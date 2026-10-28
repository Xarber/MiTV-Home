#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Collect existing safe developer logs from a stock release-installed Android TV."""
import argparse
from datetime import datetime,timezone
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

parser=argparse.ArgumentParser()
parser.add_argument('--serial',required=True)
parser.add_argument('--adb-server-port',type=int,default=5037)
parser.add_argument('--package',default='it.xarber.mitvhome')
parser.add_argument('--out',type=Path,required=True)
args=parser.parse_args()
if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+',args.package):parser.error('Invalid package identifier')
adb=shutil.which('adb')
if not adb:
 sdk=os.environ.get('ANDROID_HOME',str(Path.home()/'Library/Android/sdk'))
 adb=str(Path(sdk)/'platform-tools/adb')
root=args.out.resolve();root.mkdir(parents=True,exist_ok=True);os.chmod(root,0o700)
base=[adb,'-P',str(args.adb_server_port),'-s',args.serial]
report={'utc':datetime.now(timezone.utc).isoformat(),'package':args.package,'source':'Android APIs and existing safe app logs'}
result=subprocess.run(base+['pull',f'/sdcard/Android/data/{args.package}/files/diagnostics/',str(root/'persistent')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=30)
report['persistent_logs_retrieved']=result.returncode==0
with open(root/'pairing-logcat.txt','wb') as output:
 os.chmod(root/'pairing-logcat.txt',0o600)
 result=subprocess.run(base+['logcat','-d','-v','threadtime','-s','MiTVPairing:V','*:S'],stdout=output,stderr=subprocess.DEVNULL,timeout=30)
report['safe_logcat_retrieved']=result.returncode==0
result=subprocess.run(base+['shell','pm','list','packages','--show-versioncode',args.package],capture_output=True,text=True,timeout=20)
match=re.search(r'versionCode:(\d+)',result.stdout)
report['installed_code']=int(match.group(1)) if match else None
(root/'report.json').write_text(json.dumps(report,indent=2)+'\n')
for file in root.rglob('*'):
 if file.is_file():os.chmod(file,0o600)
 elif file.is_dir():os.chmod(file,0o700)
print(json.dumps(report))
if not report['persistent_logs_retrieved']:print('No persistent file retrieved; check app version, storage availability and whether the paired client has run.')
