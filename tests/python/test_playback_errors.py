# SPDX-License-Identifier: AGPL-3.0-only
import sys
from pathlib import Path
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/"app/src/main/python"))
from playback_errors import classify_failure

class FailureChecks(unittest.TestCase):
    def test_wrapped_http_rejection_retains_status_without_secrets(self):
        class HttpError(Exception):status_code=470
        inner=HttpError("PIN secret, private endpoint and credentials")
        outer=RuntimeError("sensitive outer message");outer.__cause__=inner
        self.assertEqual(classify_failure("pair_finish",outer),{"error":"authorization_rejected","stage":"pair_finish","http_status":470})
    def test_timeout_network_and_authentication_remain_distinct(self):
        class AuthenticationError(Exception):pass
        for error,code in [(TimeoutError("secret"),"timeout"),(ConnectionError("private address"),"network_error"),(AuthenticationError("PIN"),"authentication_failed")]:
            self.assertEqual(classify_failure("pair_finish",error)["error"],code)
    def test_unknown_failure_and_stage_do_not_leak_data(self):
        self.assertEqual(classify_failure("secret operation",ValueError("secret payload")),{"error":"connection_failed","stage":"unknown"})
    def test_cause_cycles_do_not_loop(self):
        error=RuntimeError("secret");error.__cause__=error
        self.assertEqual(classify_failure("pair_begin",error)["error"],"connection_failed")
    def test_invalid_http_status_is_not_exposed(self):
        class InvalidStatus(Exception):status_code="secret"
        self.assertNotIn("http_status",classify_failure("pair_finish",InvalidStatus()))
