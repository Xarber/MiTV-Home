# SPDX-License-Identifier: AGPL-3.0-only
"""Exercise native-TLS IPC with fake native sockets and upstream-shaped protocols."""
import asyncio,base64,json,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'app/src/main/python'))
from system_remote_tls import NativeTlsLoop
class NativeTlsChecks(unittest.IsolatedAsyncioTestCase):
    async def test_peer_certificate_is_available_to_pairing_and_bytes_are_unchanged(self):
        from unittest.mock import AsyncMock,patch
        from system_remote_tls import Protocol
        class Bridge:
            closed=[]
            def open(self,*args):return json.dumps({'socket':'aurea-test','certificate':base64.b64encode(b'PEER DER').decode()})
            def close(self,name):self.closed.append(name)
        class Upstream(asyncio.Protocol):
            def connection_made(self,transport):self.transport=transport
            def data_received(self,data):self.received=data
            def connection_lost(self,error):self.lost=error
        class SocketTransport:
            def write(self,data):self.written=data
            def get_extra_info(self,name,default=None):return default
        bridge=Bridge();loop=asyncio.get_running_loop();upstream=Upstream();socket=SocketTransport()
        async def connect(factory,**kwargs):
            self.assertEqual(kwargs['path'],'\0aurea-test');proxy=factory();proxy.connection_made(socket);proxy.data_received(b'protobuf');proxy.connection_lost(None);return socket,proxy
        adapter=NativeTlsLoop(loop,bridge,'PUBLIC CERT','PKCS8 PRIVATE')
        with patch.object(loop,'create_unix_connection',side_effect=connect):
            _,original=await adapter.create_connection(lambda:upstream,'127.0.0.1',6466,ssl=object())
        self.assertIs(original,upstream);self.assertEqual(upstream.received,b'protobuf');self.assertEqual(upstream.transport.get_extra_info('ssl_object').getpeercert(True),b'PEER DER');upstream.transport.write(b'command');self.assertEqual(socket.written,b'command');self.assertEqual(bridge.closed,['aurea-test'])
    async def test_cancelled_native_handshake_is_closed_when_it_returns(self):
        import threading
        started=threading.Event();release=threading.Event()
        class Bridge:
            closed=[]
            def open(self,*args):started.set();release.wait(2);return json.dumps({'socket':'cancelled','certificate':''})
            def close(self,name):self.closed.append(name)
        bridge=Bridge();adapter=NativeTlsLoop(asyncio.get_running_loop(),bridge,'cert','key')
        task=asyncio.create_task(adapter.create_connection(lambda:asyncio.Protocol(),'127.0.0.1',6466,ssl=object()))
        await asyncio.to_thread(started.wait,1);task.cancel()
        with self.assertRaises(asyncio.CancelledError):await task
        release.set()
        for _ in range(100):
            if bridge.closed:break
            await asyncio.sleep(.01)
        self.assertEqual(bridge.closed,['cancelled'])
    async def test_native_authentication_errors_keep_standard_upstream_ssl_semantics(self):
        import ssl
        class Bridge:
            def open(self,*args):return json.dumps({'error':'authentication_failed','failureClass':'SSLHandshakeException'})
            def close(self,name):raise AssertionError('no socket was opened')
        adapter=NativeTlsLoop(asyncio.get_running_loop(),Bridge(),'cert','key')
        from unittest.mock import patch,AsyncMock
        with patch.object(asyncio.get_running_loop(),'create_connection',new=AsyncMock(side_effect=ssl.SSLError('rejected'))):
            with self.assertRaises(ssl.SSLError):await adapter.create_connection(lambda:asyncio.Protocol(),'127.0.0.1',6466,ssl=object())
    async def test_transport_failures_are_oserrors_handled_by_upstream_reconnection(self):
        class Bridge:
            def open(self,*args):return json.dumps({'error':'system_tls_failed','failureClass':'SocketTimeoutException'})
            def close(self,name):raise AssertionError('no socket was opened')
        adapter=NativeTlsLoop(asyncio.get_running_loop(),Bridge(),'cert','key')
        from unittest.mock import patch,AsyncMock
        with patch.object(asyncio.get_running_loop(),'create_connection',new=AsyncMock(return_value=('original transport','original protocol'))) as original:
            result=await adapter.create_connection(lambda:asyncio.Protocol(),'127.0.0.1',6466,ssl=object())
        self.assertEqual(result,('original transport','original protocol'));self.assertEqual(original.await_count,1);self.assertEqual(adapter.backend,'python-tls')
