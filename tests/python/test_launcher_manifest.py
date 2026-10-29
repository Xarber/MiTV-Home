# SPDX-License-Identifier: AGPL-3.0-only
import importlib.util
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('validate_manifest',ROOT/'scripts/validate_manifest.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
A=module.A
class LauncherManifestChecks(unittest.TestCase):
    def manifest(self,target):
        # Exercise shared source plus the selected literal overlay with packaged attributes.
        root=ET.parse(ROOT/'app/src/main/AndroidManifest.xml').getroot();overlay=ET.parse(ROOT/f'app/src/{target}/AndroidManifest.xml').getroot();self.assertEqual(overlay.find('application').find('activity').get(A+'exported'),'true')
        for feature in overlay.findall('uses-feature'):root.append(feature)
        activity=root.find('application').find("activity[@"+A+"name='it.xarber.tvhome.MainActivity']")
        for entry in overlay.find('application').find('activity').findall('intent-filter'):activity.append(entry)
        root.set('package','it.xarber.aurea.remote' if target=='remote' else 'it.xarber.mitvhome');root.set(A+'versionName','2.0.3');root.set(A+'versionCode','29');ET.SubElement(root,'uses-sdk',{A+'minSdkVersion':'26'})
        return root
    def test_both_literal_target_contracts(self):
        for target in ['tv','remote']:
            root=self.manifest(target);self.assertTrue(module.validate(root,'2.0.3','29',root.get('package')))
    def test_missing_tv_entry_is_rejected(self):
        root=self.manifest('tv')
        for category in root.iter('category'):
            if category.get(A+'name')=='android.intent.category.LEANBACK_LAUNCHER':category.set(A+'name','unresolved-placeholder')
        with self.assertRaises(AssertionError):module.validate(root,'2.0.3','29')
    def test_phone_cannot_accidentally_become_home(self):
        root=self.manifest('remote');activity=root.find('application').find('activity');entry=ET.SubElement(activity,'intent-filter');ET.SubElement(entry,'action',{A+'name':'android.intent.action.MAIN'});ET.SubElement(entry,'category',{A+'name':'android.intent.category.HOME'})
        with self.assertRaises(AssertionError):module.validate(root,'2.0.3','29','it.xarber.aurea.remote')
