#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Build if stale and start the local demo detached, without exposing it to the LAN."""
import argparse
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import urllib.request
import urllib.error
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8765);parser.add_argument('--build',action='store_true');args=parser.parse_args()
if not 1024<=args.port<=65535:parser.error('Choose an unprivileged port between 1024 and 65535')
demo=root/'demo';index=demo/'dist/index.html';url=f'http://127.0.0.1:{args.port}'
sources=[demo/'App.tsx',demo/'package.json',demo/'package-lock.json',*list((demo/'src').rglob('*'))]
if args.build or not index.exists() or any(p.is_file() and p.stat().st_mtime>index.stat().st_mtime for p in sources):
 if not (demo/'node_modules').exists():sys.exit('Run npm ci inside demo first.')
 subprocess.run(['npm','run','build'],cwd=demo,check=True)
def ready():
 try:
  with urllib.request.urlopen(url,timeout=1) as response:body=response.read(32768).decode()
  if 'Aurea Home' not in body:sys.exit('That port serves another application; choose --port.')
  return True
 except (urllib.error.URLError,TimeoutError):return False
if not ready():
 with open(Path(tempfile.gettempdir())/'aurea-preview-server.log','a') as log:
  child=subprocess.Popen([sys.executable,'-m','http.server',str(args.port),'--bind','127.0.0.1','--directory',str(demo/'dist')],stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True)
 for _ in range(20):
  if ready():break
  if child.poll() is not None:sys.exit('Preview server could not start; inspect the temporary server log.')
  time.sleep(.1)
 if not ready():sys.exit('Preview did not respond; inspect the temporary server log.')
print(f'Aurea Home preview ready: {url}')
