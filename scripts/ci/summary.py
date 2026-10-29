#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Always explain the complete run; never turn a partial run into success."""
import json,os
from pathlib import Path
results=json.loads(os.environ['BUILD_RESULTS'])
required={'checks','web-remote','web-validation'}
if os.environ['GITHUB_EVENT_NAME']!='pull_request':
    required.update({'apple-tv-runtime','apple-tv-pure','android','ios','source'})
    if os.environ['GITHUB_REF_NAME'] in {'main','beta'}:required.add('publish')
failed=sorted(name for name in required if results.get(name,{}).get('result')!='success')
url=f"https://github.com/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{os.environ['GITHUB_RUN_ID']}"
lines=['# Aurea build results','',f"Commit: `{os.environ['GITHUB_SHA']}`",'','| Stage | Result |','| --- | --- |']
lines.extend(f"| {name} | {record['result']} |" for name,record in results.items())
lines+=['',f'[Download successful artifacts]({url}#artifacts)','',
'Formats: Android TV APK/AAB, Android phone APK/AAB, iOS unsigned IPA, iOS simulator app, web/PWA and corresponding source.',
'Unsigned IPAs require signing; AABs are not directly installable.',
'Failed tests block publication. They do not discard independently successful build artifacts.']
lines+=['',('Incomplete: '+', '.join(failed)) if failed else 'All required stages passed.']
Path(os.environ['GITHUB_STEP_SUMMARY']).write_text('\n'.join(lines)+'\n')
raise SystemExit(1 if failed else 0)
