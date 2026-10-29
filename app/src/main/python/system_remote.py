# SPDX-License-Identifier: AGPL-3.0-only
"""Private loopback bridge to the TV's system remote service. Never targets a LAN peer.

Certificate PEM is returned only for immediate Android Keystore encryption. PINs,
keys, metadata and raw protocol logs are excluded from diagnostic records.
"""
import asyncio
import concurrent.futures
import json
import ipaddress
import logging
import os
from pathlib import Path
import re
import tempfile
import threading
import time
from playback_diagnostics import Recorder

KEYS={'up':'DPAD_UP','down':'DPAD_DOWN','left':'DPAD_LEFT','right':'DPAD_RIGHT',
      'ok':'DPAD_CENTER','back':'BACK','home':'HOME','volumeup':'VOLUME_UP',
      'volumedown':'VOLUME_DOWN','playpause':'MEDIA_PLAY_PAUSE','next':'MEDIA_NEXT','previous':'MEDIA_PREVIOUS','menu':'MENU','mute':'VOLUME_MUTE',
      'channelup':'CHANNEL_UP','channeldown':'CHANNEL_DOWN','rewind':'MEDIA_REWIND','fastforward':'MEDIA_FAST_FORWARD',
      'stop':'MEDIA_STOP','voice':'VOICE_ASSIST','red':'PROG_RED','green':'PROG_GREEN','yellow':'PROG_YELLOW','blue':'PROG_BLUE'}

class Client:
    def __init__(self,directory,diagnostics,version,commit):
        logger=logging.getLogger('androidtvremote2')
        logger.handlers=[logging.NullHandler()];logger.propagate=False;logger.setLevel(logging.CRITICAL)
        self.local_address=None;self.loop=asyncio.new_event_loop();self.remote=None;self.stage=None;self.ready=False
        self.paired=False;self.status='not_paired';self.directory=directory;self.pair_deadline=0
        self.recorder=Recorder(diagnostics,version,commit,basename='system-remote')
        self.thread=threading.Thread(target=self._run,name='SystemTVRemote',daemon=True);self.thread.start()
    def _run(self):
        asyncio.set_event_loop(self.loop)
        self.loop.set_exception_handler(lambda loop,context:self.recorder.write('failure','system_key',error='connection_failed',exception=context.get('exception')))
        try:self.loop.run_forever()
        finally:
            pending=asyncio.all_tasks(self.loop)
            for task in pending:task.cancel()
            if pending:self.loop.run_until_complete(asyncio.gather(*pending,return_exceptions=True))
            self.loop.close()
    def request(self,operation,payload='{}'):
        if operation=='state':return json.dumps({'status':self.status,'ready':self.ready,'paired':self.paired})
        names={'prepare':'system_prepare','pair_begin':'system_pair_begin','pair_finish':'system_pair_finish','key':'system_key','connect':'system_connect','disconnect':'system_disconnect','shutdown':'system_disconnect'}
        if operation not in names:return json.dumps({'error':'unsupported'})
        record=names[operation];self.recorder.write('start',record)
        future=asyncio.run_coroutine_threadsafe(self._dispatch(operation,json.loads(payload)),self.loop)
        try:
            result=future.result(timeout=28 if operation=='pair_finish' else 18)
            self.recorder.write('failure' if 'error' in result else 'success',record,error=result.get('error'))
            return json.dumps(result)
        except Exception as error:
            if isinstance(error,concurrent.futures.TimeoutError):future.cancel();code='timeout'
            elif type(error).__name__=='InvalidAuth':code='authentication_failed';self.status='not_paired';self.paired=False
            else:code=('pairing_interrupted' if type(error).__name__=='ConnectionClosed' else 'system_pairing_unverified') if operation=='pair_finish' else 'connection_failed';self.status='unavailable'
            self.ready=False;self.recorder.write('failure',record,error=code,exception=error)
            return json.dumps({'error':code})
    async def _dispatch(self,operation,data):
        if operation=='prepare':
            from androidtvremote2 import AndroidTVRemote
            from androidtvremote2.certificate_generator import generate_selfsigned_cert
            self._disconnect()
            cert,key=data.get('certificate',''),data.get('key','')
            if not cert or not key:
                raw_cert,raw_key=await asyncio.to_thread(generate_selfsigned_cert,'Aurea Home')
                cert,key=raw_cert.decode(),raw_key.decode()
            if len(cert)>5000 or len(key)>5000:raise ValueError('Invalid credential bounds')
            self.stage=tempfile.TemporaryDirectory(prefix='system-remote-',dir=self.directory)
            os.chmod(self.stage.name,0o700)
            cert_path=Path(self.stage.name)/'client.crt';key_path=Path(self.stage.name)/'client.key'
            for path,value in [(cert_path,cert),(key_path,key)]:
                descriptor=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
                with os.fdopen(descriptor,'w') as output:output.write(value)
            self.remote=AndroidTVRemote('Aurea Home',str(cert_path),str(key_path),'127.0.0.1',loop=self.loop,enable_ime=False,enable_voice=False)
            local=data.get('localAddress')
            try:self.local_address=local if isinstance(local,str) and ipaddress.ip_address(local).version==4 and ipaddress.ip_address(local).is_private and not ipaddress.ip_address(local).is_loopback else None
            except ValueError:self.local_address=None
            self.paired=data.get('paired') is True;self.status='paired' if self.paired else 'not_paired';self.ready=False
            self.remote.add_is_available_updated_callback(self._availability)
            # Java persists this result before starting any pairing operation.
            return {'certificate':cert,'key':key,'status':self.status}
        if operation in {'disconnect','shutdown'}:
            self._disconnect()
            if operation=='shutdown':self.loop.call_later(.1,self.loop.stop)
            return {'status':'disconnected'}
        if self.remote is None:return {'error':'runtime_unavailable'}
        if operation=='pair_begin':
            self.ready=False
            await asyncio.wait_for(self.remote.async_start_pairing(),12)
            self._remove_private_staging();self.status='pin_required';self.pair_deadline=time.monotonic()+180
            return {'status':'pin_required'}
        if operation=='pair_finish':
            if time.monotonic()>self.pair_deadline:return {'error':'pairing_expired'}
            pin=data.get('pin','')
            if not isinstance(pin,str) or not re.fullmatch('[0-9a-fA-F]{6}',pin):return {'error':'invalid_pin'}
            try:
                await asyncio.wait_for(self.remote.async_finish_pairing(pin),12)
            except Exception as error:
                if type(error).__name__!='ConnectionClosed':raise
                # Some receivers close the pairing socket after accepting the secret.
                # Trust is established only if the control channel authenticates with this certificate.
                self.remote.disconnect()
                await self._connect()
                self.paired=True
                return {'status':'ready','ready':True,'paired':True}
            self.paired=True
            try:await self._connect()
            except Exception as error:
                if type(error).__name__=='InvalidAuth':self.paired=False;raise
                self.ready=False;self.status='reconnecting';self.remote.keep_reconnecting(self._invalid_auth)
            return {'status':self.status,'ready':self.ready,'paired':True}
        if operation=='connect':
            if not self.paired:return {'error':'system_pairing_required'}
            if not self.ready:await self._connect()
            return {'status':'ready','ready':True,'paired':True}
        if operation=='key':
            command=data.get('command')
            if command not in KEYS:return {'error':'unsupported'}
            if not self.ready:await self._connect()
            try:self.remote.send_key_command(KEYS[command])
            except Exception:
                self.ready=False
                raise
            return {'status':'accepted'}
        return {'error':'unsupported'}
    async def _connect(self):
        try:await asyncio.wait_for(self.remote.async_connect(),7)
        except Exception as error:
            # A self-hosted remote service may reset loopback TLS after pairing.
            # Retry only establishment, never a potentially delivered key command.
            if not self.local_address or self.remote.host!='127.0.0.1' or type(error).__name__ not in {'CannotConnect','ConnectionClosed','TimeoutError'}:raise
            self.remote.disconnect();self.remote.host=self.local_address
            await asyncio.wait_for(self.remote.async_connect(),7)
        self._remove_private_staging();self.ready=True;self.status='ready'
        self.remote.keep_reconnecting(self._invalid_auth)
    def _availability(self,available):
        self.ready=available;self.status='ready' if available else 'reconnecting'
    def _invalid_auth(self):
        self.paired=False;self.ready=False;self.status='not_paired'
    def host_failure(self,operation,exception_type):
        self.recorder.write('failure',operation,error='runtime_unavailable',host_exception=exception_type)
    def _remove_private_staging(self):
        if self.stage:
            path=Path(self.stage.name)/'client.key'
            try:path.unlink(missing_ok=True)
            except OSError:pass
    def _disconnect(self):
        if self.remote:self.remote.disconnect()
        if self.stage:self.stage.cleanup()
        self.remote=None;self.stage=None;self.ready=False;self.status='disconnected'
