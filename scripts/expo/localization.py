#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Reuse established native Italian strings in Expo without copying their source."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[2]
source=(root/'app/src/main/java/it/xarber/tvhome/AppLanguage.java').read_text()
strings={}
for left,right in re.findall(r'IT\.put\(("(?:\\.|[^"\\])*"),("(?:\\.|[^"\\])*")\)',source):
    strings[json.loads(left)]=json.loads(right)
(root/'src/model/native-it.json').write_text(json.dumps(strings,ensure_ascii=False,indent=2)+'\n')
