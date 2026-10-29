# SPDX-License-Identifier: AGPL-3.0-only
"""Keep upstream protobuf/session handling; adapt only TLS to Android's supported SSLSocket.

The private local socket accepts this application UID only. No network relay or
arbitrary remote endpoint is exposed. The peer certificate is needed for Polo's
RSA/PIN proof; it never enters diagnostics or browser responses.
"""
import asyncio
import base64
import json
import ssl

class NativeTlsError(OSError):
    def __init__(self,code,failure):self.code=code;self.failure=failure;super().__init__(code)

class Peer:
    def __init__(self,certificate):self.certificate=certificate
    def getpeercert(self,binary_form=False):return self.certificate if binary_form else {}

class Transport:
    def __init__(self,transport,peer,host,port):self.transport=transport;self.peer=peer;self.endpoint=(host,port)
    def __getattr__(self,name):return getattr(self.transport,name)
    def get_extra_info(self,name,default=None):
        if name=='ssl_object':return self.peer
        if name=='peername':return self.endpoint
        return self.transport.get_extra_info(name,default)

class Protocol(asyncio.Protocol):
    def __init__(self,protocol,peer,host,port,close):self.protocol=protocol;self.peer=peer;self.host=host;self.port=port;self.close=close
    def connection_made(self,transport):self.protocol.connection_made(Transport(transport,self.peer,self.host,self.port))
    def data_received(self,data):self.protocol.data_received(data)
    def connection_lost(self,error):
        try:self.protocol.connection_lost(error)
        finally:self.close()
    def eof_received(self):return False
    def pause_writing(self):getattr(self.protocol,'pause_writing',lambda:None)()
    def resume_writing(self):getattr(self.protocol,'resume_writing',lambda:None)()

class NativeTlsLoop:
    def __init__(self,loop,bridge,certificate,key):self.loop=loop;self.bridge=bridge;self.certificate=certificate;self.key=key;self.backend="android-tls"
    def __getattr__(self,name):return getattr(self.loop,name)
    async def create_connection(self,factory,host,port,**options):
        if not options.get('ssl'):return await self.loop.create_connection(factory,host,port,**options)
        result=None
        # Shield open so cancellation can close the resulting native socket instead of leaking it.
        pending=self.loop.create_task(asyncio.to_thread(self.bridge.open,host,port,self.certificate,self.key))
        try:
            result=json.loads(str(await asyncio.shield(pending)))
            if result.get('error'):
                error=NativeTlsError(result['error'],result.get('failureClass','IOException'))
                if error.code=='authentication_failed':raise ssl.SSLError('native_peer_rejected') from error
                raise error
            peer=Peer(base64.b64decode(result['certificate'],validate=True));protocol=factory()
            transport,_=await self.loop.create_unix_connection(lambda:Protocol(protocol,peer,host,port,lambda:self.bridge.close(result['socket'])),path='\0'+result['socket'])
            self.backend='android-tls'
            return transport,protocol
        except BaseException as error:
            if result and result.get('socket'):self.bridge.close(result['socket'])
            else:
                def cleanup(future):
                    try:self.bridge.close(json.loads(str(future.result()))['socket'])
                    except BaseException:pass
                pending.add_done_callback(cleanup)
            if isinstance(error,OSError):
                # Connection establishment only: retain the original TLS stack for TVs
                # incompatible with platform TLS. No key/audio operation is replayed.
                self.backend='python-tls'
                try:return await self.loop.create_connection(factory,host,port,**options)
                except OSError as fallback:raise fallback from error
            raise
