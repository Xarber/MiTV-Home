# SPDX-License-Identifier: AGPL-3.0-only
import base64
import csv
import hashlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
import zipfile

path=Path(__file__).resolve().parents[2]/"scripts/apple_tv/build_pure_wheels.py"
spec=importlib.util.spec_from_file_location("pure_wheels",path)
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class PortableWheelChecks(unittest.TestCase):
    def wheel(self,directory,files):
        source=Path(directory)/"zeroconf-0.151.5-cp311-cp311-linux_x86_64.whl"
        with zipfile.ZipFile(source,"w") as archive:
            archive.writestr("zeroconf-0.151.5.dist-info/WHEEL","Root-Is-Purelib: false\nTag: cp311-cp311-linux_x86_64\n")
            archive.writestr("zeroconf-0.151.5.dist-info/RECORD","")
            for name,data in files.items():archive.writestr(name,data)
        return source
    def test_extension_free_wheel_has_valid_integrity_records(self):
        with tempfile.TemporaryDirectory() as directory:
            source=self.wheel(directory,{"zeroconf/__init__.py":b"__version__='0.151.5'"})
            module.portable_zeroconf(source)
            self.assertFalse(source.exists())
            with zipfile.ZipFile(Path(directory)/"zeroconf-0.151.5-py3-none-any.whl") as archive:
                metadata=archive.read("zeroconf-0.151.5.dist-info/WHEEL")
                self.assertIn(b"Root-Is-Purelib: true",metadata)
                rows=csv.reader(io.StringIO(archive.read("zeroconf-0.151.5.dist-info/RECORD").decode()))
                for name,digest,length in rows:
                    if digest:
                        data=archive.read(name)
                        self.assertEqual(int(length),len(data))
                        self.assertEqual(digest,"sha256="+base64.urlsafe_b64encode(hashlib.sha256(data).digest()).decode().rstrip("="))
    def test_native_extension_or_disguised_elf_is_rejected(self):
        for name,data in [("zeroconf/native.so",b"binary"),("zeroconf/innocent.py",b"\x7fELFbinary")]:
            with tempfile.TemporaryDirectory() as directory:
                source=self.wheel(directory,{name:data})
                with self.assertRaises(RuntimeError):module.portable_zeroconf(source)
                self.assertTrue(source.exists())
                self.assertFalse((Path(directory)/"zeroconf-0.151.5-py3-none-any.whl").exists())
