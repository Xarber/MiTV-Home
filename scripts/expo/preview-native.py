#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Reuse verified media bytes only for an explicitly non-release Expo UI preview."""
import subprocess,sys,zipfile
from pathlib import Path
apk=Path(sys.argv[1]);destination=Path(sys.argv[2])
# Framework changes do not validate changes to the media source or Python dependency build.
subprocess.run(['git','diff','--exit-code','3caa3d4e74e7ff5d9d95d14289f5aeff82333bee','HEAD','--','app/src/main/cpp'],check=True,stdout=subprocess.DEVNULL)
subprocess.run(['git','diff','--exit-code','6dc64f86a00ff059b02bf21cd8ff2a863814d951','HEAD','--','scripts/apple_tv'],check=True,stdout=subprocess.DEVNULL)
with zipfile.ZipFile(apk) as archive:
    for abi in ['armeabi-v7a','arm64-v8a']:
        files=[name for name in archive.namelist() if name.startswith('lib/'+abi+'/') and name.endswith('.so')]
        assert files, 'Missing pinned media ABI'
        for name in files:
            target=destination/abi/Path(name).name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(archive.read(name))
print('Prepared unchanged signed-release native bytes for ARM UI preview only')
