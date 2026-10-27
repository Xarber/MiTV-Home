#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Archive tracked repository and recursive pinned submodule sources only."""
from pathlib import Path
import subprocess
import sys
import io
import tarfile
import hashlib
import json
import urllib.request
from urllib.parse import urlparse
root = Path(__file__).resolve().parents[1]
def tracked(directory):
    entries = subprocess.check_output(['git','ls-files','--stage','-z'],cwd=directory).split(b'\0')
    for entry in entries:
        if not entry: continue
        mode, object_id, rest = entry.split(b' ',2)
        stage, name = rest.split(b'\t',1)
        assert stage == b'0', 'Unresolved index'
        path = directory/name.decode()
        if mode == b'160000':
            assert (path/'.git').exists(), f'Uninitialized source: {path}'
            actual = subprocess.check_output(['git','rev-parse','HEAD'],cwd=path).strip()
            assert actual == object_id, f'Unexpected submodule revision: {path}'
            yield from tracked(path)
        else:
            assert path.exists() or path.is_symlink(), f'Missing source: {path}'
            yield path
with tarfile.open(sys.argv[1], 'w:gz', format=tarfile.PAX_FORMAT) as archive:
    commit = subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
    epoch = subprocess.check_output(['git','show','-s','--format=%ct','HEAD'],cwd=root,text=True).strip()
    channel = subprocess.check_output(['git','branch','--show-current'],cwd=root,text=True).strip()
    provenance = f"commit={commit}\nchannel={channel}\nepoch={epoch}\n".encode()
    info = tarfile.TarInfo('MiTV-Home/source-build.properties'); info.size=len(provenance); info.mtime=int(epoch)
    archive.addfile(info,io.BytesIO(provenance))
    for path in tracked(root):
        archive.add(path, arcname='MiTV-Home/'+str(path.relative_to(root)), recursive=False)
print('Archived all tracked sources and pinned submodules')

# LGPL dependency: include the exact unmodified upstream source with the
# corresponding-source artifact, not just a mutable website link.
if (root/'scripts/apple_tv/build_pure_wheels.py').exists():
    with urllib.request.urlopen('https://pypi.org/pypi/zeroconf/0.151.5/json', timeout=30) as response:
        package = json.load(response)
    candidates = [item for item in package['urls'] if item['packagetype'] == 'sdist']
    assert len(candidates) == 1
    source = candidates[0]
    assert urlparse(source['url']).hostname == 'files.pythonhosted.org'
    with urllib.request.urlopen(source['url'], timeout=30) as response:
        payload = response.read(8*1024*1024+1)
    assert len(payload) <= 8*1024*1024
    assert hashlib.sha256(payload).hexdigest() == source['digests']['sha256']
    # gzip archives cannot be appended. Repack tracked source plus the verified
    # source payload into a sibling temporary archive, preserving the original
    # until the new archive is complete.
    destination = Path(sys.argv[1])
    temporary = destination.with_suffix(destination.suffix+'.tmp')
    try:
        with tarfile.open(destination, 'r:gz') as existing, tarfile.open(temporary, 'w:gz', format=tarfile.PAX_FORMAT) as combined:
            for member in existing:
                combined.addfile(member, existing.extractfile(member) if member.isfile() else None)
            info = tarfile.TarInfo('MiTV-Home/third_party/python/zeroconf-0.151.5.tar.gz')
            info.size=len(payload);info.mtime=int(epoch)
            combined.addfile(info, io.BytesIO(payload))
        temporary.replace(destination)
    finally:
        temporary.unlink(missing_ok=True)
    print('Included checksum-verified LGPL Bonjour dependency source')
