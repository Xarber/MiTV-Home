// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect,useRef,useState} from 'react';
import {View,Text,Image,TextInput,StyleSheet} from 'react-native';
import {AnchoredPanel,type Anchor} from './AnchoredPanel';
import {FocusButton} from './FocusButton';
import {FadedScroll} from './FadedScroll';
import {Icon} from './Icon';
import {Wallpaper} from './Wallpaper';
import {wallpapers,type IconName} from '../model/catalog';
import {PhonePlayer} from '../remote/PhonePlayer';
import {NativeWaveform} from './NativeWaveform';
import {NativeReleaseHistory,ReadableDetails} from './NativeReleaseHistory';
import {NativePairing} from './NativePairing';
import type {Launcher} from '../launcher/types';
import {nativeFocus} from '../platform/native/focus';
export function NativePanels({demo,t,launch,musicAnchor,settingsAnchor}:{demo:Launcher;t:(s:string)=>string;launch:(id:string)=>void;musicAnchor:Anchor;settingsAnchor:Anchor}){
 const [retained,setRetained]=useState<string|null>(null),[remote,setRemote]=useState<Record<string,unknown>>({}),[details,setDetails]=useState(''),[history,setHistory]=useState<unknown>();
 useEffect(()=>{if(demo.panel!=='changelog'&&demo.panel!=='whatsnew')return;let active=true;void demo.execute('changelog').then(value=>{if(!active)return;setHistory(value.releases);if(demo.panel==='whatsnew')requestAnimationFrame(()=>{void demo.execute('releaseSeen').catch(()=>{});});}).catch(()=>{});return()=>{active=false;};},[demo.panel]);
 const [developer,setDeveloper]=useState(false),[revealed,setRevealed]=useState(false);const taps=useRef({count:0,time:0});
 const panel=demo.panel??retained, snapshot=demo.snapshot;
 useEffect(()=>{if(demo.panel){setRetained(demo.panel);return;}const timer=setTimeout(()=>setRetained(null),300);return()=>clearTimeout(timer);},[demo.panel]);
 useEffect(()=>{if(demo.panel!=='remote'){setRemote({});return;}let active=true;void demo.execute('remote').then(value=>{if(active)setRemote(value);}).catch(()=>{});return()=>{active=false;};},[demo.panel]);
 useEffect(()=>{if(!revealed)return;const timer=setTimeout(()=>{setRevealed(false);setDeveloper(false);},30000);return()=>clearTimeout(timer);},[revealed,demo.panel]);
 useEffect(()=>{setRevealed(false);setDeveloper(false);},[demo.page]);
 if(!panel||!snapshot)return null;
 const action=(operation:string,payload:Record<string,unknown>={})=>{void demo.execute(operation,payload).catch(()=>{});};
 const row=(label:string,icon:IconName,click:()=>void,value?:string)=><FocusButton key={label} id={'native-'+label} group="modal" label={t(label)} onPress={click} style={s.row}><Icon name={icon} size={21}/><Text style={s.label}>{t(label)}</Text>{value!==undefined&&<Text style={s.value}>{t(value)}</Text>}</FocusButton>;
 const text=(value:string)=><Text selectable style={s.description}>{t(value)}</Text>;
 const id=panel.includes(':')?panel.slice(panel.indexOf(':')+1):'';const app=demo.entry(id);
 const titles:Record<string,string>={control:'Control Center',whatsnew:"What’s New",wallpapers:'Wallpapers',network:'Network',remote:'Remote',sound:'Sound',airplay:'AirPlay',about:'About Aurea Home',changelog:'Changelog',developer:'Developer settings',profiles:'Input appearance',pair:'Paired AirPlay device',input:'Choose HDMI input',notes:'Release notes'};
 const title=id?(panel.startsWith('pin:')?'Choose a slot':app.name):titles[panel]??panel;
 const updates=snapshot.updates;const candidate=updates.candidate as Record<string,unknown>|undefined;
 const music=snapshot.music;
 const versionTap=()=>{const now=Date.now();taps.current.count=now-taps.current.time<1500?taps.current.count+1:1;taps.current.time=now;if(taps.current.count>=3){setRevealed(true);taps.current.count=0;}};
 const info=(operation:string,next:string)=>{void demo.execute(operation).then(value=>{setDetails(typeof value.text==='string'?value.text:JSON.stringify(value,null,2));demo.setPanel(next);}).catch(()=>{});};
 return <AnchoredPanel kind={panel==='music'?'music':'settings'} anchor={panel==='music'?musicAnchor:settingsAnchor} visible={!!demo.panel} close={demo.close}>
 {panel!=='music'&&<View style={s.header}><Text style={s.title}>{t(title)}</Text><FocusButton id="panel-close" group="modal" label={t('Close')} onPress={demo.close}><Icon name="close" size={20}/></FocusButton></View>}
 <FadedScroll key={panel}>
 {panel==='music'&&<PhonePlayer music={music} artwork={demo.artwork} connected={music.active} group="modal" prefix="music" waveform={<NativeWaveform playing={!!music.playing} source={music.source} colors={music.colors}/>} action={(key,value)=>action('media',{source:music.source,action:key,...(value===undefined?{}:{value})})}/>}
 {panel==='control'&&<>
 {row('Network','wifi',()=>demo.setPanel('network'),snapshot.network.title||snapshot.network.transport)}
 {row('Inputs','inputs',()=>{demo.close();demo.setPage(1);setTimeout(()=>nativeFocus.focus('input:'+demo.catalog.find(a=>a.category==='inputs')?.id),320);})}
 {row('Display','sun',()=>action('settings',{screen:'display'}))}{row('Sound','volume',()=>demo.setPanel('sound'),snapshot.volume+'%')}
 {row('AirPlay','airplay',()=>demo.setPanel('airplay'))}{row('Remote','remote',()=>demo.setPanel('remote'),demo.remote?'Connected':undefined)}
 {row('Wallpapers','wallpaper',()=>demo.setPanel('wallpapers'))}{row('Activity background','apps',()=>demo.change({glass:!demo.prefs.glass}),demo.prefs.glass?'Black':'Clear')}
 {row('Language','tv',()=>demo.change({language:demo.prefs.language==='it'?'en':'it'}),demo.prefs.language==='it'?'Italiano':'English')}
 {developer&&row('Developer settings','code',()=>demo.setPanel('developer'))}
 {row('About Aurea Home','info',()=>demo.setPanel('about'))}{row('TV settings','settings',()=>action('settings',{screen:'system'}))}
 </>}
 {panel==='network'&&<>{text(snapshot.network.title||t(snapshot.network.connected?'Connected':'Offline'))}{row('Network settings','wifi',()=>action('settings',{screen:'network'}))}</>}
 {panel==='sound'&&<>{row('Volume −','volume',()=>demo.setVolume(v=>Math.max(0,v-5)),snapshot.volume+'%')}{row('Volume +','volume',()=>demo.setVolume(v=>Math.min(100,v+5)),snapshot.volume+'%')}{row('Sound settings','settings',()=>action('settings',{screen:'sound'}))}</>}
 {panel==='remote'&&<>{typeof remote.qr==='string'&&<Image source={{uri:remote.qr}} style={{height:220,width:220,alignSelf:'center',borderRadius:16,marginBottom:16}}/>}{typeof remote.url==='string'&&text(remote.url)}{typeof remote.pin==='string'&&text(t('Pairing code')+' · '+remote.pin)}{row('Forget paired remotes','remote',()=>demo.setPanel('confirm-remotes'))}</>}
 {panel==='confirm-remotes'&&<>{text('All paired remotes will need to pair again.')}{row('Forget paired remotes','remote',()=>{action('revokeRemotes');demo.close();})}</>}
 {panel==='airplay'&&<>{row('Receiver settings','airplay',()=>action('settings',{screen:'airplay'}))}{row('Paired AirPlay device','remote',()=>demo.setPanel('pair'),snapshot.paired.paired?snapshot.paired.name:t('No paired device'))}</>}
 {panel==='pair'&&<NativePairing demo={demo} t={t} row={row}/>}
 {panel==='input'&&demo.catalog.filter(value=>value.kind==='hdmi').map(value=>row(value.name,'inputs',()=>{action('pairedInput',{id:value.id});demo.setPanel('pair');},snapshot.paired.input===value.id?'✓':undefined))}
 {panel==='wallpapers'&&<><View style={s.gallery}>{wallpapers.map(w=><View key={w.id} style={{width:'47%'}}><FocusButton id={'native-wallpaper-'+w.id} group="modal" label={w.name} selected={w.id===demo.prefs.wallpaper} onPress={()=>demo.change({wallpaper:w.id})} style={{height:104,width:'100%',borderRadius:15,overflow:'hidden'}}><Wallpaper id={w.id} mini/>{w.id===demo.prefs.wallpaper&&<Icon name="check" size={22}/>}</FocusButton><Text style={s.description}>{w.name}</Text></View>)}</View>{row('Animated wallpapers','wallpaper',()=>demo.change({motion:!demo.prefs.motion}),demo.prefs.motion?'On':'Off')}</>}
 {panel==='about'&&<>{row(snapshot.build.version+' · '+snapshot.build.code,'info',versionTap)}{text(snapshot.build.commit+' · '+snapshot.build.channel)}{revealed&&row('Developer options','code',()=>setDeveloper(!developer),developer?'On':'Off')}{text(String(updates.status??''))}{row('Check for Updates','info',()=>action('checkUpdates'))}{row('Automatic update checks','check',()=>action('updatePreference',{key:'auto_check'}),updates.autoCheck?'On':'Off')}{row('Automatic downloads','apps',()=>action('updatePreference',{key:'auto_download'}),updates.autoDownload?'On':'Off')}{row('Unmetered downloads only','wifi',()=>action('updatePreference',{key:'unmetered'}),updates.unmeteredOnly?'On':'Off')}{candidate&&<><NativeReleaseHistory releases={[candidate.release]} language={demo.prefs.language} compact/>{row('Release notes','info',()=>{setDetails(JSON.stringify(candidate.changes??candidate.notes??candidate,null,2));demo.setPanel('notes');})}{row(updates.ready?'Install update':'Update Now','apps',()=>action(updates.ready?'installUpdate':'downloadUpdate'))}</>}{Number(updates.total)>0&&text(Math.round(Number(updates.downloaded)/Number(updates.total)*100)+'%')}{row('Changelog','info',()=>demo.setPanel('changelog'))}{row('Export preferences','apps',()=>action('backupPreferences'))}{row('Import preferences','apps',()=>action('importPreferences'))}</>}
 {(panel==='notes'||panel==='diagnostics')&&<ReadableDetails text={details}/>}
 {(panel==='changelog'||panel==='whatsnew')&&<NativeReleaseHistory releases={history} language={demo.prefs.language} compact={panel==='whatsnew'}/>}
 {panel==='whatsnew'&&row('Full changelog','info',()=>demo.setPanel('changelog'))}
 {panel==='developer'&&<>{row('Developer changelog','code',()=>info('developerChangelog','diagnostics'))}{row('Diagnostics','code',()=>info('diagnostics','diagnostics'))}{row('Recovery Home','home',()=>action('recovery'))}</>}
 {panel.startsWith('menu:')&&<>{row('Launch','play',()=>{demo.close();launch(id);})}{row('Pin to dock','apps',()=>demo.setPanel('pin:'+id))}{id!=='all'&&demo.prefs.dock.includes(id)&&row('Remove from dock','close',()=>{demo.remove(id);demo.close();})}{app.kind==='hdmi'&&row('Input appearance','inputs',()=>demo.setPanel('profile:'+id))}{app.kind==='app'&&<>{row('App info','info',()=>action('appInfo',{id}))}{row('Uninstall','close',()=>action('uninstall',{id}))}</>}</>}
 {panel.startsWith('pin:')&&demo.prefs.dock.map((key,index)=>id==='all'&&index!==5?null:row(`${index+1} · ${demo.entry(key).name}`,'apps',()=>{demo.pin(id,index);demo.close();}))}
 {panel.startsWith('profile:')&&['generic','nintendo','gaming','appletv','nintendoswitch','playstation','xbox','wiiu'].map(profile=>row(profile,'inputs',()=>{action('inputProfile',{id,profile});demo.close();}))}
 </FadedScroll>
 </AnchoredPanel>;
}
const s=StyleSheet.create({header:{flexDirection:'row',alignItems:'center',gap:14,marginBottom:16},title:{color:'#fff',fontSize:25,fontWeight:'600',flex:1},row:{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',gap:14,padding:13,minHeight:54,borderRadius:15,marginBottom:6,backgroundColor:'#ffffff08'},label:{flex:1,color:'#fff',fontSize:15,fontWeight:'500'},value:{color:'#b9c3d2',fontSize:12,flexShrink:1,maxWidth:'42%'},description:{color:'#c2cad7',fontSize:14,lineHeight:23,marginBottom:16},gallery:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:10}});
