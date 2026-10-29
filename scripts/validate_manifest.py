#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
import sys
import xml.etree.ElementTree as ET
root = ET.parse(sys.argv[1]).getroot()
a = '{http://schemas.android.com/apk/res/android}'
assert root.get('package') == (sys.argv[4] if len(sys.argv)>4 else 'it.xarber.mitvhome')
assert root.get(a+'versionName') == sys.argv[2]
assert root.get(a+'versionCode') == sys.argv[3]
assert root.find('application').get(a+'debuggable', 'false') == 'false'
assert root.find('uses-sdk').get(a+'minSdkVersion') == '26'
print('PASS: bundle package/version/code/minimum SDK/release mode')
