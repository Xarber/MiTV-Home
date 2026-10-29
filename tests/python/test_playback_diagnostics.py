# SPDX-License-Identifier: AGPL-3.0-only
import json
import logging
from pathlib import Path
import sys
import tempfile
import types
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/"app/src/main/python"))
from playback_diagnostics import Recorder,SafeHttpHandler

class RecorderChecks(unittest.IsolatedAsyncioTestCase):
    async def test_http_phase_status_recorded_without_packets_or_headers(self):
        with tempfile.TemporaryDirectory() as directory:
            recorder=Recorder(directory,"1.7.4","a"*40);handler=SafeHttpHandler(recorder)
            packet=b'POST /pair-setup HTTP/1.1\r\nAuthorization: SECRET_TOKEN\r\nX-Apple-Client-Name: PRIVATE_NAME\r\n\r\n\x06\x01\x03\x05\x04' + b'1234'
            handler.emit(logging.LogRecord("pyatv.support.http",logging.DEBUG,"",1,"Sending %s message: %s",("HTTP/1.1",packet),None))
            response=types.SimpleNamespace(code=470,body="SECRET_BODY",headers={"secret":"SECRET_TOKEN"})
            handler.emit(logging.LogRecord("pyatv.support.http",logging.DEBUG,"",1,"Got %s response: %s:",("HTTP",response),None))
            content=recorder.path.read_text();events=[json.loads(line) for line in content.splitlines()]
            self.assertEqual([row["event"] for row in events],["http_request","http_response"])
            self.assertEqual(events[1]["http_status"],470);self.assertEqual(events[1]["phase"],3)
            self.assertEqual(events[1]["operation"],"pair_finish")
            for secret in ["SECRET_TOKEN","SECRET_BODY","PRIVATE_NAME","1234"]:self.assertNotIn(secret,content)
    async def test_arbitrary_debug_records_and_urls_are_ignored(self):
        with tempfile.TemporaryDirectory() as directory:
            recorder=Recorder(directory,"1.7.4","a"*40);handler=SafeHttpHandler(recorder)
            for message,args in [("Received: %s",(b"SECRET",)),("Sending %s message: %s",("HTTP",b"POST /private?token=SECRET HTTP/1.1\r\n\r\n"))]:
                handler.emit(logging.LogRecord("http",logging.DEBUG,"",1,message,args,None))
            self.assertFalse(recorder.path.exists())
    async def test_error_trace_has_locations_but_no_exception_message(self):
        with tempfile.TemporaryDirectory() as directory:
            recorder=Recorder(directory,"1.7.4","a"*40)
            try:raise ValueError("PIN=1234 credential=SECRET")
            except ValueError as error:recorder.write("failure","pair_finish",error="connection_failed",exception=error)
            content=recorder.path.read_text();row=json.loads(content)
            self.assertEqual(row["exceptions"][0]["type"],"ValueError")
            self.assertTrue(row["exceptions"][0]["frames"])
            self.assertNotIn("SECRET",content);self.assertNotIn("1234",content);self.assertNotIn(str(Path.home()),content)
    async def test_rotation_bounds_retention_and_survives_new_instance(self):
        with tempfile.TemporaryDirectory() as directory:
            recorder=Recorder(directory,"1.7.4","a"*40);recorder.LIMIT=800
            for i in range(40):recorder.write("success","scan",elapsed_ms=i)
            self.assertLessEqual(recorder.path.stat().st_size,800)
            self.assertLessEqual(recorder.previous.stat().st_size,800)
            Recorder(directory,"1.7.4","b"*40).write("start","pair_begin")
            self.assertIn('"pair_begin"',recorder.path.read_text())

class NativeTlsReasonChecks(unittest.TestCase):
    def test_native_tls_reason_is_allowlisted_without_passing_payloads(self):
        with tempfile.TemporaryDirectory() as directory:
            recorder=Recorder(directory,'test','a'*40)
            recorder.write('failure','system_connect',tls_details={'tlsAlert':'handshake_failure','privateKey':'DO_NOT_LOG','certificate':'DO_NOT_LOG'})
            recorder.write('failure','system_connect',tls_details={'tlsAlert':'DO_NOT_LOG'})
            rows=[json.loads(line) for line in recorder.path.read_text().splitlines()]
            self.assertEqual(rows[0]['tls_alert'],'handshake_failure');self.assertNotIn('tls_alert',rows[1]);self.assertNotIn('DO_NOT_LOG',recorder.path.read_text())
