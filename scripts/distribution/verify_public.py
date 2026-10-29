#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Verify the published metadata assets without credentials or private endpoints."""
import json
from pathlib import Path
from urllib.request import urlopen
base='https://github.com/Xarber/MiTV-Home/releases/download/sources-v1.0/'
for name in ['altsource.json','altsource-beta.json']:
    with urlopen(base+name,timeout=30) as response:data=json.load(response)
    expected=json.loads(Path('distribution-generated',name).read_text());assert data==expected,'Published metadata differs from the generated source'
    assert data['sourceURL']==base+name and isinstance(data['apps'],list)
    for app in data['apps']:
        assert app['bundleIdentifier']=='it.xarber.aurea.remote' and app['versions']
        for version in app['versions'][:1]:
            with urlopen(version['downloadURL'],timeout=30) as response:assert response.status==200
for name in ['obtainium.json','obtainium-beta.json','obtainium-remote.json','obtainium-remote-beta.json']:
    with urlopen(base+name,timeout=30) as response:data=json.load(response)
    settings=json.loads(data['additionalSettings']);assert settings['apkFilterRegEx']
print('PASS: public channel metadata and current IPA download URLs')
