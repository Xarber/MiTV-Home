#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Generate channel-specific AltSources only from a published, validated release."""
import argparse,json
from pathlib import Path
BASE='https://github.com/Xarber/MiTV-Home'
META=BASE+'/releases/download/sources-v1.0/'
def source(channel):
    return {'name':'Aurea '+('Beta' if channel=='beta' else 'Stable'),'subtitle':'Aurea Remote for iPhone and iPad','description':'Local television controls, apps, inputs and music activities. Unsigned IPAs are signed by your compatible installer.','website':BASE,'iconURL':META+'icon-512.png','tintColor':'858BEA','sourceURL':META+('altsource-beta.json' if channel=='beta' else 'altsource.json'),'apps':[],'news':[]}
def generate(release,sidecar,previous):
    assert not release.get('draft') and release.get('published_at'),'Only published releases may enter update sources'
    channel='beta' if release['prerelease'] else 'stable'
    assert sidecar['channel']==('beta' if channel=='beta' else 'main') and sidecar['platform']=='ios' and sidecar['variant']=='unsigned'
    assets={asset['name']:asset for asset in release['assets']}
    candidates=[a for a in assets.values() if a['name'].endswith('.ipa')]
    assert len(candidates)==1,'Exactly one physical-device IPA is required'
    ipa=candidates[0];assert ipa['size']==sidecar['size']
    expected=BASE+'/releases/download/'+release['tag_name']+'/'+ipa['name']
    assert ipa['browser_download_url']==expected
    assert sidecar['package']=='it.xarber.aurea.remote' and sidecar['minimumOS'] and sidecar['buildNumber']
    permissions=sidecar['appPermissions'];assert isinstance(permissions['privacy'],dict) and isinstance(permissions['entitlements'],list)
    result=previous or source(channel);assert result['sourceURL']==source(channel)['sourceURL']
    version={'version':sidecar['version'],'buildVersion':sidecar['buildNumber'],'date':release['published_at'],'downloadURL':expected,'size':ipa['size'],'minOSVersion':sidecar['minimumOS'],'localizedDescription':release.get('body') or 'Aurea Remote update.'}
    app={'name':'Aurea Remote','bundleIdentifier':sidecar['package'],'developerName':'Xarber','subtitle':'Your television, closer','localizedDescription':'Control paired televisions on your home network. Includes navigation, app launching, customized inputs and in-app music controls. Developer options include a launcher preview. AirPlay receiving is Android-only.','iconURL':META+'icon-512.png','tintColor':'858BEA','versions':[version],'appPermissions':permissions}
    for old in result['apps']:
        if old['bundleIdentifier']==app['bundleIdentifier']:
            app['versions'] += [item for item in old['versions'] if (item['version'],item.get('buildVersion'))!=(version['version'],version['buildVersion'])]
    result['apps']=[app];return result
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--release',type=Path,required=True);parser.add_argument('--sidecar',type=Path,required=True);parser.add_argument('--previous',type=Path,required=True);parser.add_argument('--out',type=Path,required=True);args=parser.parse_args()
    release=json.loads(args.release.read_text());sidecar=json.loads(args.sidecar.read_text());channel='beta' if release['prerelease'] else 'stable';args.out.mkdir(exist_ok=True,parents=True)
    for current in ['stable','beta']:
        name='altsource-beta.json' if current=='beta' else 'altsource.json';path=args.previous/name;previous=json.loads(path.read_text()) if path.exists() else None
        value=generate(release,sidecar,previous) if current==channel else previous or source(current)
        (args.out/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    print('Generated channel-separated AltSources from actual release assets and native package metadata')
