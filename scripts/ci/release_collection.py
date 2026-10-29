#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Validate the full same-commit companion collection before any release."""
import hashlib,json,os,sys,zipfile
from pathlib import Path
root=Path('dist/companions')
def digest(path):
    with path.open('rb') as source:
        checksum=hashlib.sha256()
        for chunk in iter(lambda:source.read(1024*1024),b''):checksum.update(chunk)
        return checksum.hexdigest()
if '--checksums' in sys.argv:
    with Path('dist/SHA256SUMS.txt').open('a') as output:
        for path in sorted(root.iterdir()):
            if path.is_file():output.write(digest(path)+'  '+path.name+'\n')
    raise SystemExit(0)
expected={('android','apk'),('android','aab'),('ios','unsigned'),('ios','simulator')}
version=json.loads(Path('app.json').read_text())['expo']['version']
for sidecar in root.glob('Aurea-Remote-*.json'):
    metadata=json.loads(sidecar.read_text());kind=(metadata['platform'],metadata['variant'])
    assert kind in expected,'Unexpected or duplicate companion artifact'
    expected.remove(kind)
    assert metadata['commit']==os.environ['GITHUB_SHA'] and metadata['channel']==os.environ['GITHUB_REF_NAME']
    assert metadata['version']==version and metadata['package']=='it.xarber.aurea.remote'
    asset=sidecar.with_name(sidecar.name[:-5]);assert asset.is_file()
    assert asset.stat().st_size==metadata['size'] and digest(asset)==metadata['sha256']
    assert asset.with_suffix(asset.suffix+'.sha256').read_text().split()[0]==metadata['sha256']
assert not expected,'Incomplete mandatory companion collection'
web=Path('web-dist');assert (web/'index.html').is_file() and (web/'manifest.webmanifest').is_file() and (web/'sw.js').is_file()
archive=root/f"Aurea-Home-v{version}-{os.environ['GITHUB_REF_NAME']}-{os.environ['GITHUB_SHA'][:7]}-web.zip"
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as output:
    for path in sorted(web.rglob('*')):
        if path.is_file():output.write(path,path.relative_to(web))
archive.with_suffix('.zip.sha256').write_text(digest(archive)+'  '+archive.name+'\n')
print('PASS: complete same-commit Android/iOS companions and standalone web export')
