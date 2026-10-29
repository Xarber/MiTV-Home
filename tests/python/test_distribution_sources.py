# SPDX-License-Identifier: AGPL-3.0-only
import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('sources',Path(__file__).resolve().parents[2]/'scripts/distribution/sources.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class SourceChecks(unittest.TestCase):
 def fixtures(self):
  release={'draft':False,'published_at':'2026-10-29T10:00:00Z','prerelease':True,'tag_name':'v2.0.1-beta.27.abcdef0','assets':[{'name':'remote.ipa','size':123,'browser_download_url':module.BASE+'/releases/download/v2.0.1-beta.27.abcdef0/remote.ipa'}]}
  sidecar={'channel':'beta','platform':'ios','variant':'unsigned','size':123,'package':'it.xarber.aurea.remote','minimumOS':'17.0','buildNumber':'27','version':'2.0.1','appPermissions':{'entitlements':[],'privacy':{'NSLocalNetworkUsageDescription':'TV controls'}}}
  return release,sidecar
 def test_actual_binary_version_and_permissions_are_preserved(self):
  release,sidecar=self.fixtures();source=module.generate(release,sidecar,None);app=source['apps'][0];self.assertEqual(app['versions'][0]['buildVersion'],'27');self.assertEqual(app['appPermissions'],sidecar['appPermissions'])
 def test_drafts_and_wrong_downloads_cannot_enter_source(self):
  release,sidecar=self.fixtures();release['draft']=True
  with self.assertRaises(AssertionError):module.generate(release,sidecar,None)
  release['draft']=False;release['assets'][0]['browser_download_url']='https://example.invalid/remote.ipa'
  with self.assertRaises(AssertionError):module.generate(release,sidecar,None)
 def test_channel_mismatch_is_rejected(self):
  release,sidecar=self.fixtures();sidecar['channel']='main'
  with self.assertRaises(AssertionError):module.generate(release,sidecar,None)
 def test_metadata_contains_no_invented_version(self):
  self.assertEqual(module.source('stable')['apps'],[])
