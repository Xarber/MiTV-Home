#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Validate the actual merged, packaged Android manifest for each target."""
import sys
import xml.etree.ElementTree as ET
A = '{http://schemas.android.com/apk/res/android}'
def validate(root, version, code, package='it.xarber.mitvhome'):
    assert root.get('package') == package
    assert root.get(A+'versionName') == version
    assert root.get(A+'versionCode') == str(code)
    application = root.find('application')
    assert application is not None
    assert application.get(A+'debuggable', 'false') == 'false'
    assert root.find('uses-sdk').get(A+'minSdkVersion') == '26'
    activity = next((item for item in application.findall('activity') if item.get(A+'name') == 'it.xarber.tvhome.MainActivity'), None)
    assert activity is not None and activity.get(A+'exported') == 'true', 'Missing exported Home/remote entry point'
    categories = {item.get(A+'name') for entry in activity.findall('intent-filter') if any(action.get(A+'name') == 'android.intent.action.MAIN' for action in entry.findall('action')) for item in entry.findall('category')}
    if package == 'it.xarber.aurea.remote':
        assert 'android.intent.category.LAUNCHER' in categories, 'Phone launcher entry missing'
        assert not {'android.intent.category.HOME', 'android.intent.category.LEANBACK_LAUNCHER'} & categories, 'Phone must not register as TV Home'
        assert not any(item.get(A+'name') == 'android.software.leanback' for item in root.findall('uses-feature')), 'Phone must not declare TV feature'
    else:
        assert {'android.intent.category.HOME', 'android.intent.category.LEANBACK_LAUNCHER'} <= categories, 'TV Home/Leanback entry missing'
    return True
if __name__ == '__main__':
    validate(ET.parse(sys.argv[1]).getroot(), sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv)>4 else 'it.xarber.mitvhome')
    print('PASS: bundle package/version/code/minimum SDK/release mode/target launcher')
