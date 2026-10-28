#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Verify a published updater manifest and public APK URL after complete draft publication."""
import json,subprocess,sys,time,urllib.request
from pathlib import Path
expected=json.loads(Path(sys.argv[1]).read_text());tag=expected['tag']
for attempt in range(6):
    try:
        release=json.loads(subprocess.check_output(['gh','api',f'repos/Xarber/MiTV-Home/releases/tags/{tag}'],text=True))
        assert not release['draft'] and release['prerelease']==(expected['channel']=='beta')
        assert release['target_commitish']==expected['commit']
        names={asset['name']:asset for asset in release['assets']}
        assert 'update-manifest.json' in names
        with urllib.request.urlopen(names['update-manifest.json']['browser_download_url'],timeout=30) as reply:
            assert reply.status==200 and json.load(reply)==expected
        artifact=next(asset for asset in release['assets'] if asset['browser_download_url']==expected['apk']['url'])
        assert artifact['size']==expected['apk']['size']
        with urllib.request.urlopen(urllib.request.Request(expected['apk']['url'],method='HEAD'),timeout=30) as reply:assert reply.status==200 and reply.url.startswith('https://')
        print('PASS: published exact-commit updater metadata, public APK URL and size')
        break
    except Exception:
        if attempt==5:raise
        time.sleep(5)
