# SPDX-License-Identifier: AGPL-3.0-only
"""Catch AAPT silently dropping Expo's underscore-prefixed bundle directory."""
import importlib.util,io,unittest,zipfile
from pathlib import Path
from unittest.mock import patch
root=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('release_web',root/'scripts/release.py');release=importlib.util.module_from_spec(spec);spec.loader.exec_module(release)
class EmbeddedWebChecks(unittest.TestCase):
    def archive(self,prefix='',missing=False):
        out=io.BytesIO()
        with zipfile.ZipFile(out,'w') as archive:
            archive.writestr(prefix+'assets/remoteapp/index.html','<link rel="stylesheet" href="/_expo/main.css"><script src="/_expo/main.js"></script>')
            archive.writestr(prefix+'assets/remoteapp/_expo/main.css','body{}')
            if not missing:archive.writestr(prefix+'assets/remoteapp/_expo/main.js','console.log("ok")')
        out.seek(0);return zipfile.ZipFile(out)
    def test_missing_expo_javascript_fails(self):
        with self.archive(missing=True) as archive,patch.object(release,'ROOT',Path('/nonexistent-test-source')):
            with self.assertRaisesRegex(AssertionError,'Missing embedded remote resource'):release.validate_embedded_web(archive)
    def test_complete_apk_and_aab_assets_pass(self):
        for prefix in ['','base/']:
            with self.archive(prefix) as archive,patch.object(release,'ROOT',Path('/nonexistent-test-source')):release.validate_embedded_web(archive,prefix)
