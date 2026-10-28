#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""CI artifact-only packaging. Phone artifacts are not added to the TV updater."""
import hashlib,json,os,plistlib,shutil,subprocess,sys,zipfile
from pathlib import Path
platform,kind=sys.argv[1:];config=json.loads(Path('app.json').read_text())['expo'];commit=os.environ['GITHUB_SHA'];channel=os.environ['GITHUB_REF_NAME'];version=config['version']
out=Path('phone-dist');out.mkdir(exist_ok=True);stem=f'Aurea-Remote-v{version}-{channel}-{commit[:7]}'
if platform=='android':
    candidates=list(Path(os.environ.get('AUREA_ANDROID_OUTPUTS','.phone-native/android/app/build/outputs')).rglob('app-release.'+kind));assert len(candidates)==1
    target=out/f'{stem}-android-{("universal" if kind=="apk" else "bundle")}.{kind}';shutil.copy2(candidates[0],target)
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None
        prefix='' if kind=='apk' else 'base/'
        abis={p.split('/')[1 if kind=='apk' else 2] for p in z.namelist() if p.startswith(prefix+'lib/') and p.endswith('.so')}
        assert {'armeabi-v7a','arm64-v8a','x86','x86_64'}<=abis,abis
        assert prefix+'assets/index.android.bundle' in z.namelist(),'Missing production JavaScript'
    if kind=='apk':
        tools=sorted(Path(os.environ['ANDROID_HOME'],'build-tools').glob('*/apksigner'))[-1]
        report=subprocess.check_output([str(tools),'verify','--print-certs',str(target)],text=True);assert 'a57dfea6154bf320e051cdfd304b1aa7976559f7239fdbde6fcea265a9f93724' in report
    else: subprocess.run(['jarsigner','-verify',str(target)],check=True)
else:
    sdk='iphonesimulator' if kind=='simulator' else 'iphoneos'
    app=Path(os.environ['RUNNER_TEMP'])/f'aurea-ios/Build/Products/Release-{sdk}/AureaRemote.app';assert app.is_dir()
    info=plistlib.loads((app/'Info.plist').read_bytes());assert info['CFBundleIdentifier']=='it.xarber.aurea.remote';assert info['CFBundleShortVersionString']==version;assert (app/'main.jsbundle').is_file()
    subprocess.run(['lipo',str(app/info['CFBundleExecutable']),'-verify_arch','arm64'],check=True)
    platform_info=subprocess.check_output(['xcrun','vtool','-show-build',str(app/info['CFBundleExecutable'])],text=True);assert ('IOSSIMULATOR' if kind=='simulator' else 'IOS') in platform_info
    target=out/f'{stem}-ios-{kind}.{("app.zip" if kind=="simulator" else "ipa")}'
    if kind=='unsigned':
        payload=out/'Payload';payload.mkdir();shutil.copytree(app,payload/app.name);subprocess.run(['ditto','-c','-k','--keepParent',str(payload),str(target)],check=True);shutil.rmtree(payload)
    else:subprocess.run(['ditto','-c','-k','--keepParent',str(app),str(target)],check=True)
manifest={'name':'Aurea Remote','package':'it.xarber.aurea.remote','version':version,'commit':commit,'channel':channel,'platform':platform,'variant':kind,'size':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'signing':'unsigned-requires-external-signing' if kind=='unsigned' else 'release-key' if platform=='android' else 'simulator-only'}
target.with_suffix(target.suffix+'.json').write_text(json.dumps(manifest,indent=2)+'\n');target.with_suffix(target.suffix+'.sha256').write_text(manifest['sha256']+'  '+target.name+'\n')
