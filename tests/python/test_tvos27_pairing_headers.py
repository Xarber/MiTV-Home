# SPDX-License-Identifier: AGPL-3.0-only
"""Exercise patched upstream HAP requests with a fake receiver, not real PINs."""
import ast
import os
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch
import zipfile

ROOT=Path(__file__).resolve().parents[2]
WHEEL=Path(os.environ.get("MITV_PYATV_WHEEL",str(ROOT/"build/apple-tv-wheels/pyatv-0.18.0-py3-none-any.whl")))

@unittest.skipUnless(WHEEL.exists(),"Patched wheel is built by the portable dependency job")
class PairingHeadersChecks(unittest.IsolatedAsyncioTestCase):
    async def test_all_four_pairing_requests_include_early_client_name(self):
        values=types.SimpleNamespace(Method=0,SeqNo=1,Salt=2,PublicKey=3,Proof=4,EncryptedData=5)
        tlv=types.SimpleNamespace(TlvValue=values,write_tlv=lambda value:b"request",
            read_tlv=lambda value:{values.Salt:b"salt",values.PublicKey:b"public",values.EncryptedData:b"cipher"})
        class SRP:
            def initialize(self):pass
            def step1(self,pin):pass
            def step2(self,public,salt):return b"public",b"proof"
            def step3(self,name=None):return b"cipher"
            def step4(self,data):return "test-credentials"
        modules={}
        for name,attributes in {
            "pyatv":{},"pyatv.auth":{"hap_tlv8":tlv},
            "pyatv.auth.hap_pairing":{"HapCredentials":object,"PairSetupProcedure":object,"PairVerifyProcedure":object},
            "pyatv.auth.hap_srp":{"SRPAuthHandler":SRP},
            "pyatv.exceptions":{"InvalidResponseError":RuntimeError},
            "pyatv.support":{"log_binary":lambda *a,**k:None},
            "pyatv.support.http":{"HttpConnection":object,"HttpResponse":object},
        }.items():
            module=types.ModuleType(name);module.__dict__.update(attributes);modules[name]=module
        with zipfile.ZipFile(WHEEL) as archive:source=archive.read("pyatv/protocols/airplay/auth/hap.py")
        with patch.dict(sys.modules,modules):
            namespace={};exec(compile(source,"patched-upstream-hap.py","exec"),namespace)
            class Receiver:
                def __init__(self):self.requests=[]
                async def post(self,path,headers,body=None):
                    self.requests.append((path,dict(headers)));return types.SimpleNamespace(body=b"response")
            for client_name in ["MiTV Home","Another installation"]:
                receiver=Receiver();procedure=namespace["AirPlayHapPairSetupProcedure"](receiver,SRP(),client_name)
                await procedure.start_pairing();await procedure.finish_pairing("","1234",client_name)
                self.assertEqual([path for path,_ in receiver.requests],["/pair-pin-start","/pair-setup","/pair-setup","/pair-setup"])
                self.assertTrue(all(headers.get("X-Apple-Client-Name")==client_name for _,headers in receiver.requests))
            self.assertNotIn("X-Apple-Client-Name",namespace["_AIRPLAY_HEADERS"])
    async def test_handler_passes_configured_name_before_pin_prompt(self):
        with zipfile.ZipFile(WHEEL) as archive:
            handler=ast.parse(archive.read("pyatv/protocols/airplay/pairing.py"))
            factory=ast.parse(archive.read("pyatv/protocols/airplay/auth/__init__.py"))
        call=next(node for node in ast.walk(handler) if isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and node.func.id=="pair_setup")
        self.assertEqual(ast.unparse(call.args[-1]),"self._name")
        call=next(node for node in ast.walk(factory) if isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and node.func.id=="AirPlayHapPairSetupProcedure")
        self.assertEqual(ast.unparse(call.args[-1]),"display_name")
