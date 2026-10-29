# SPDX-License-Identifier: AGPL-3.0-only
"""Synthetic artifact tests; these are not native build validation."""
import hashlib,json,os,subprocess,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
class CollectionChecks(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name);self.env=dict(os.environ,GITHUB_SHA='a'*40,GITHUB_REF_NAME='testing')
        (self.root/'app.json').write_text(json.dumps({'expo':{'version':'2.0.0'}}))
        self.assets=self.root/'dist/companions';self.assets.mkdir(parents=True)
        for platform,variant,extension in [('android','apk','apk'),('android','aab','aab'),('ios','unsigned','ipa'),('ios','simulator','app.zip')]:
            asset=self.assets/f'Aurea-Remote-{platform}-{variant}.{extension}';asset.write_bytes(b'synthetic fixture')
            digest=hashlib.sha256(asset.read_bytes()).hexdigest()
            value={'platform':platform,'variant':variant,'commit':'a'*40,'channel':'testing','version':'2.0.0','package':'it.xarber.aurea.remote','size':asset.stat().st_size,'sha256':digest}
            asset.with_suffix(asset.suffix+'.json').write_text(json.dumps(value))
            asset.with_suffix(asset.suffix+'.sha256').write_text(digest+'  '+asset.name+'\n')
        web=self.root/'web-dist';web.mkdir()
        for name in ['index.html','manifest.webmanifest','sw.js']:(web/name).write_text('synthetic fixture')
    def run_collection(self):
        return subprocess.run([sys.executable,str(ROOT/'scripts/ci/release_collection.py')],cwd=self.root,env=self.env,capture_output=True,text=True)
    def test_complete_collection_packages_web(self):
        result=self.run_collection();self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(len(list(self.assets.glob('*-web.zip'))),1)
    def test_missing_format_blocks_release(self):
        next(self.assets.glob('*unsigned*.json')).unlink();self.assertNotEqual(self.run_collection().returncode,0)
    def test_wrong_commit_blocks_release(self):
        sidecar=next(self.assets.glob('*.json'));value=json.loads(sidecar.read_text());value['commit']='b'*40;sidecar.write_text(json.dumps(value))
        self.assertNotEqual(self.run_collection().returncode,0)
    def test_tampered_package_blocks_release(self):
        next(self.assets.glob('*.apk')).write_bytes(b'changed fixture');self.assertNotEqual(self.run_collection().returncode,0)
    def test_summary_rejects_partial_full_build(self):
        statuses={name:{'result':'success'} for name in ['checks','web-remote','web-validation','apple-tv-runtime','apple-tv-pure','android','ios','source']}
        statuses['android']['result']='skipped'
        env=dict(self.env,BUILD_RESULTS=json.dumps(statuses),GITHUB_EVENT_NAME='workflow_dispatch',GITHUB_REPOSITORY='example/test',GITHUB_RUN_ID='123',GITHUB_STEP_SUMMARY=str(self.root/'summary.md'))
        result=subprocess.run([sys.executable,str(ROOT/'scripts/ci/summary.py')],env=env,capture_output=True)
        self.assertNotEqual(result.returncode,0);self.assertIn('Incomplete: android',(self.root/'summary.md').read_text())
