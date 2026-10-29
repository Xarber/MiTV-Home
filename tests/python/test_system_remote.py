# SPDX-License-Identifier: AGPL-3.0-only
"""Loopback adapter lifecycle and secret-free diagnostics, without a physical TV."""
import asyncio,json,sys,tempfile,time,types,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'app/src/main/python'))
from system_remote import Client
class FakeRemote:
    instances=[]
    def __init__(self,name,cert,key,host,**options):
        self.host=host;self.keys=[];self.instances.append(self)
    def add_is_available_updated_callback(self,callback):self.callback=callback
    async def async_start_pairing(self):pass
    async def async_finish_pairing(self,pin):self.pin=pin
    async def async_connect(self):pass
    def keep_reconnecting(self,callback):self.invalid=callback
    def send_key_command(self,key):self.keys.append(key)
    def disconnect(self):pass
class SystemRemoteChecks(unittest.TestCase):
    def setUp(self):
        self.root=tempfile.TemporaryDirectory();self.client=Client(self.root.name,self.root.name,'test','test')
    def tearDown(self):
        self.client.request('shutdown');self.client.thread.join(timeout=2);self.root.cleanup()
    def request(self,operation,**value):return json.loads(self.client.request(operation,json.dumps(value)))
    def prepare(self):
        return self.request('prepare',certificate='PUBLIC CERTIFICATE',key='PRIVATE KEY NEVER LOG',paired=False)
    def test_unavailable_runtime_can_shutdown(self):
        self.assertEqual(self.request('key',command='home')['error'],'runtime_unavailable')
    def test_loopback_pairing_cleanup_and_key_allowlist(self):
        module=types.ModuleType('androidtvremote2');module.AndroidTVRemote=FakeRemote
        generator=types.ModuleType('androidtvremote2.certificate_generator');generator.generate_selfsigned_cert=lambda _:None
        with patch.dict(sys.modules,{'androidtvremote2':module,'androidtvremote2.certificate_generator':generator}):
            self.prepare();remote=FakeRemote.instances[-1];self.assertEqual(remote.host,'127.0.0.1')
            self.assertEqual(self.request('pair_begin')['status'],'pin_required')
            self.assertFalse((Path(self.client.stage.name)/'client.key').exists())
            self.assertEqual(self.request('pair_finish',pin='ABC123')['status'],'ready')
            self.assertEqual(self.request('key',command='home')['status'],'accepted');self.assertEqual(remote.keys,['HOME'])
            self.assertEqual(self.request('key',command='arbitrary-intent')['error'],'unsupported')
            logs=''.join(p.read_text() for p in Path(self.root.name).glob('*.jsonl'))
            self.assertNotIn('ABC123',logs);self.assertNotIn('PRIVATE KEY',logs)
            remote.invalid();self.assertFalse(self.client.ready)
    def test_pairing_expiry(self):
        module=types.ModuleType('androidtvremote2');module.AndroidTVRemote=FakeRemote
        generator=types.ModuleType('androidtvremote2.certificate_generator');generator.generate_selfsigned_cert=lambda _:None
        with patch.dict(sys.modules,{'androidtvremote2':module,'androidtvremote2.certificate_generator':generator}):
            self.prepare();self.client.pair_deadline=time.monotonic()-1
            self.assertEqual(self.request('pair_finish',pin='ABC123')['error'],'pairing_expired')

class PairingRecoveryChecks(unittest.TestCase):
    setUp=SystemRemoteChecks.setUp
    tearDown=SystemRemoteChecks.tearDown
    request=SystemRemoteChecks.request
    prepare=SystemRemoteChecks.prepare
    def adapter(self,remote):
        module=types.ModuleType('androidtvremote2');module.AndroidTVRemote=remote
        generator=types.ModuleType('androidtvremote2.certificate_generator');generator.generate_selfsigned_cert=lambda _:None
        return patch.dict(sys.modules,{'androidtvremote2':module,'androidtvremote2.certificate_generator':generator})
    def test_closed_pairing_socket_requires_authenticated_control_connection(self):
        class CloseAfterPair(FakeRemote):
            async def async_finish_pairing(self,pin):raise type('ConnectionClosed',(Exception,),{})()
        with self.adapter(CloseAfterPair):
            self.prepare();self.request('pair_begin');result=self.request('pair_finish',pin='ABC123')
            self.assertTrue(result['paired']);self.assertTrue(result['ready'])
    def test_closed_pairing_socket_cannot_hide_invalid_authentication(self):
        class Untrusted(FakeRemote):
            async def async_finish_pairing(self,pin):raise type('ConnectionClosed',(Exception,),{})()
            async def async_connect(self):raise type('InvalidAuth',(Exception,),{})()
        with self.adapter(Untrusted):
            self.prepare();self.request('pair_begin');result=self.request('pair_finish',pin='ABC123')
            self.assertEqual(result['error'],'authentication_failed');self.assertFalse(self.client.paired)
    def test_acknowledged_pair_survives_temporary_control_unavailability(self):
        class DelayedControl(FakeRemote):
            async def async_connect(self):raise type('CannotConnect',(Exception,),{})()
        with self.adapter(DelayedControl):
            self.prepare();self.request('pair_begin');result=self.request('pair_finish',pin='ABC123')
            self.assertTrue(result['paired']);self.assertFalse(result['ready']);self.assertEqual(result['status'],'reconnecting')
