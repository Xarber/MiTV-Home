#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Fetch one pinned official bundletool release asset and verify its GitHub digest."""
import hashlib
import json
from pathlib import Path
import sys
import urllib.request
release = json.loads(Path(sys.argv[1]).read_text())
assert release['tag_name'] == '1.18.3'
asset = next(item for item in release['assets'] if item['name'] == 'bundletool-all-1.18.3.jar')
url = asset['browser_download_url']
assert url.startswith('https://github.com/google/bundletool/releases/download/1.18.3/')
digest = asset.get('digest', '')
assert digest.startswith('sha256:') and len(digest) == 71, 'Missing official release digest'
with urllib.request.urlopen(url, timeout=90) as response:
    payload = response.read(80_000_001)
assert len(payload) <= 80_000_000
assert hashlib.sha256(payload).hexdigest() == digest.split(':', 1)[1], 'Digest mismatch'
Path(sys.argv[2]).write_bytes(payload)
