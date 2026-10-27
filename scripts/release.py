#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""One release history feeds Android, Markdown, release notes and artifact validation."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
HISTORY = ROOT / 'app/src/main/assets/release-history.json'

def history():
    data = json.loads(HISTORY.read_text())
    assert data['schema'] == 1
    codes = [item['code'] for item in data['releases']]
    assert codes == sorted(set(codes), reverse=True), 'Release codes must be unique and descending'
    for item in data['releases']:
        assert re.fullmatch(r'\d+\.\d+(\.\d+)?', item['version'])
        assert re.fullmatch(r'\d{4}-\d{2}-\d{2}', item['date'])
        for field in ('highlights', 'fixes'):
            assert set(item[field]) == {'en', 'it'} and all(item[field].values())
        assert item.get('features'), 'Every release requires descriptive feature rows'
        for feature in item['features']:
            assert feature['icon'] in {'code','history','transfer','sound','remote','controls','apps','inputs','airplay','info'}
            for field in ('label','detail'):
                assert set(feature[field]) == {'en','it'} and all(feature[field].values())
        assert set(item['compatibility']) == {'en','it'}
    return data['releases']

def metadata():
    current = history()[0]
    gradle = (ROOT / 'app/build.gradle.kts').read_text()
    assert f'versionCode = {current["code"]}' in gradle
    assert f'versionName = "{current["version"]}"' in gradle
    assert f'"version":"{current["version"]}","code":{current["code"]}' in gradle, 'Generated build metadata must match version' 
    return current

def changelog():
    text = '# Changelog\n\nGenerated from `app/src/main/assets/release-history.json`. Legacy versions reflect repository history; dates describe implementation, not a verified public release.\n'
    for release in history():
        text += f'\n## {release["version"]} — {release["date"]}\n\n{release["highlights"]["en"]}\n\n### Fixes & Improvements\n\n{release["fixes"]["en"]}\n'
    return text

def generate():
    (ROOT / 'CHANGELOG.md').write_text(changelog())
    commits = subprocess.check_output(['git', 'log', '--reverse', '--format=%H %ad %s%n%b', '--date=short', '98cbd64^..HEAD'], cwd=ROOT, text=True)
    (ROOT / 'app/src/main/assets/developer-changelog.txt').write_text('MiTV Home developer changelog\nLegacy subjects are preserved. New work uses Conventional Commits.\n\n' + commits)

def validate_archive(path, kind, commit, channel):
    current = metadata()
    assert path.is_file() and path.stat().st_size > 1024, f'Missing or empty artifact: {path}'
    prefix = '' if kind == 'apk' else 'base/'
    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None, 'Corrupt ZIP'
        names = set(archive.namelist())
        assert prefix + 'manifest/AndroidManifest.xml' in names if kind == 'aab' else 'AndroidManifest.xml' in names
        assert ('BundleConfig.pb' in names) if kind == 'aab' else any(re.fullmatch(r'classes\d*\.dex', name) for name in names)
        abis = {'arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'}
        actual = {name.split('/')[1 if kind == 'apk' else 2] for name in names if name.startswith(prefix+'lib/') and name.endswith('/libairplay_native.so')}
        assert actual == abis, f'Native ABI mismatch: {actual}'
        embedded = json.loads(archive.read(prefix + 'assets/build-metadata.json'))
        assert embedded['commit'] == commit and embedded['channel'] == channel
        assert embedded['version'] == current['version'] and embedded['code'] == current['code']
        assert archive.read(prefix+'assets/release-history.json') == HISTORY.read_bytes()
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    path.with_suffix(path.suffix + '.sha256').write_text(f'{digest}  {path.name}\n')
    print(f'Validated {path.name}: four ABIs, metadata and SHA-256')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['check', 'generate', 'metadata', 'notes', 'validate'])
    parser.add_argument('--file', type=Path); parser.add_argument('--kind', choices=['apk', 'aab'])
    parser.add_argument('--commit', default=os.environ.get('GITHUB_SHA', 'unknown'))
    parser.add_argument('--channel', default=os.environ.get('MITV_BUILD_CHANNEL', 'testing'))
    args = parser.parse_args(); current = metadata()
    if args.action == 'check':
        assert (ROOT/'CHANGELOG.md').read_text() == changelog(), 'Run scripts/release.py generate'
        assert 'GNU AFFERO GENERAL PUBLIC LICENSE' in (ROOT/'LICENSE').read_text()
        assert 'GNU GENERAL PUBLIC LICENSE' in (ROOT/'LICENSES/GPL-3.0.txt').read_text()
        print('PASS: release history, version, changelog and license consistency')
    elif args.action == 'generate': generate()
    elif args.action == 'metadata':
        data = dict(version=current['version'], code=current['code'], commit=args.commit, channel=args.channel, variant='github-extended')
        (ROOT/'app/src/main/assets/build-metadata.json').write_text(json.dumps(data, indent=2)+'\n')
        print(json.dumps(data))
    elif args.action == 'notes':
        print(f'## MiTV Home {current["version"]}\n\n{current["highlights"]["en"]}\n\n### Fixes & Improvements\n\n{current["fixes"]["en"]}\n\nAndroid TV 8+; signed universal APK for sideloading, AAB for store tooling. iOS is not supported.\n\nMac Music playback remains unresolved; iPad radio/local-library playback was reported working. Port 80 falls back to 8765 when Android restricts privileged ports.\n\nSee CHANGELOG.md and docs/INSTALL.md. Signing differs from local debug builds.')
        print('\n### Developer changes\n')
        # Previous project release, if any; keep upstream history out of initial notes.
        tags = subprocess.check_output(['git','tag','--merged','HEAD','--sort=-version:refname','--list','v*'],cwd=ROOT,text=True).splitlines()
        base = tags[0] if tags else '7ef0923'
        print(subprocess.check_output(['git','log','--format=- %h %s',base+'..HEAD'],cwd=ROOT,text=True))
    elif args.action == 'validate': validate_archive(args.file, args.kind, args.commit, args.channel)

if __name__ == '__main__': main()
