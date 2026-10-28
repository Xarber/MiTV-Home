#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Generate a strict updater manifest from validated APK bytes and the build's signer report."""
import argparse,hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def package(apk,report,commit,channel):
    release=json.loads((ROOT/'app/src/main/assets/release-history.json').read_text())['releases'][0]
    certificates=re.findall(r'certificate SHA-256 digest:\s*([0-9a-fA-F]{64})',report.read_text())
    assert len(set(certificates))==1, 'Expected exactly one APK signing identity'
    data=dict(package='it.xarber.mitvhome',version=release['version'],code=release['code'],minimumSdk=26,variant='github-extended',commit=commit,channel=channel,
              name=apk.name,size=apk.stat().st_size,sha256=hashlib.sha256(apk.read_bytes()).hexdigest(),signerSha256=certificates[0].lower())
    apk.with_suffix('.package.json').write_text(json.dumps(data,indent=2)+'\n')
def manifest(directory,tag,commit,channel):
    metadata=list(directory.glob('*.package.json'));assert len(metadata)==1
    data=json.loads(metadata[0].read_text());apk=directory/data['name']
    release=json.loads((ROOT/'app/src/main/assets/release-history.json').read_text())['releases'][0]
    assert data['commit']==commit and data['channel']==('beta' if channel=='beta' else 'stable')
    assert data['version']==release['version'] and data['code']==release['code']
    assert data['size']==apk.stat().st_size and data['sha256']==hashlib.sha256(apk.read_bytes()).hexdigest()
    expected='v'+release['version']+(f'-beta.{release["code"]}.{commit[:7]}' if channel=='beta' else '')
    assert tag==expected and '-android-universal-' in apk.name and apk.suffix=='.apk'
    result=dict(schema=1,package=data['package'],version=data['version'],code=data['code'],channel=data['channel'],variant=data['variant'],tag=tag,commit=commit,
                minimumSdk=data['minimumSdk'],critical=release.get('critical',False),release=release,
                apk=dict(url=f'https://github.com/Xarber/MiTV-Home/releases/download/{tag}/{apk.name}',size=data['size'],sha256=data['sha256'],signerSha256=data['signerSha256']))
    (directory/'update-manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('action',choices=['package','manifest']);parser.add_argument('--apk',type=Path);parser.add_argument('--report',type=Path);parser.add_argument('--dir',type=Path);parser.add_argument('--tag');parser.add_argument('--commit',required=True);parser.add_argument('--channel',required=True)
    args=parser.parse_args()
    if args.action=='package':package(args.apk,args.report,args.commit,'beta' if args.channel=='beta' else 'stable')
    else:manifest(args.dir,args.tag,args.commit,args.channel)
