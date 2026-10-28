#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Stage the shared Expo sources without allowing prebuild to overwrite the TV host."""
from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[2]
target=root/'.phone-native'
if target.exists():
    raise SystemExit('Phone workspace already exists; preserve it or remove that generated directory explicitly.')
target.mkdir()
for name in ['App.tsx','TVHome.tsx','index.ts','app.json','app.config.js','package.json','package-lock.json','.npmrc','metro.config.js','react-native.config.js','tsconfig.json','global.d.ts']:
    shutil.copy2(root/name,target/name)
for name in ['src','assets','public']:
    shutil.copytree(root/name,target/name)
(target/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
print('Prepared isolated phone workspace: .phone-native')
