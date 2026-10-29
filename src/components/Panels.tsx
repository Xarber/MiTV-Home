// SPDX-License-Identifier: AGPL-3.0-only
import appConfig from '../../app.json';
import React,{useState,useEffect} from 'react';
import {View,Text,ScrollView,StyleSheet,Platform,Linking} from 'react-native';
import {FocusButton} from './FocusButton';
import {Icon} from './Icon';
import {useReducedMotion} from 'react-native-reanimated';
import {AnchoredPanel,Anchor} from './AnchoredPanel';
import {Wallpaper} from './Wallpaper';
import {FadedScroll} from './FadedScroll';
import {MusicPanel} from './Music';
import {wallpapers,entry,IconName} from '../model/catalog';
import type {Demo} from '../hooks/useDemo';
export function Panels({demo,t,launch,musicAnchor,settingsAnchor}:{demo:Demo;t:(s:string)=>string;launch:(id:string)=>void;musicAnchor:Anchor;settingsAnchor:Anchor}){
 const reduced=useReducedMotion();
 const [retained,setRetained]=useState<string|null>(null);
 useEffect(()=>{if(demo.panel){setRetained(demo.panel);return;}const timer=setTimeout(()=>setRetained(null),300);return()=>clearTimeout(timer);},[demo.panel]);
 const panel=demo.panel??retained;if(!panel)return null;const row=(title:string,icon:IconName,action:()=>void,value?:string)=><FocusButton key={title} id={`panel-${title}`} group="modal" label={t(title)} onPress={action} style={s.row}><Icon name={icon} size={21}/><Text style={s.label}>{t(title)}</Text>{value&&<Text style={s.value}>{value}</Text>}</FocusButton>;
 const titles:Record<string,string>={control:'Control Center',music:'Music',wallpapers:'Wallpapers',remote:'Remote',airplay:'AirPlay',network:'Network',display:'Display',sound:'Sound',about:'About Aurea Home'};
 const title=panel.startsWith('menu:')?entry(panel.split(':')[1]!).name:panel.startsWith('pin:')?'Choose a slot':panel.startsWith('launch:')?entry(panel.split(':')[1]!).name:titles[panel]??panel;
 return <AnchoredPanel key={panel==='music'?'music':'settings'} kind={panel==='music'?'music':'settings'} anchor={panel==='music'?musicAnchor:settingsAnchor} visible={demo.panel!==null} close={demo.close}>
 {panel!=='music'&&<View style={s.header}><Text style={[s.title,{flex:1}]}>{t(title)}</Text><FocusButton id="panel-close" group="modal" label={t('Close')} onPress={demo.close} style={s.close}><Icon name="close" size={20}/></FocusButton></View>}

 <FadedScroll key={panel}>
 {panel==='control'&&<>
 {row('Network','wifi',()=>demo.setPanel('network'),'Aurea Demo')}
 {row('Inputs','inputs',()=>{demo.close();demo.setPage(1);})}
 {row('Display','sun',()=>demo.setPanel('display'))}
 {row('Sound','volume',()=>demo.setPanel('sound'),`${demo.volume}%`)}
 {row('AirPlay','airplay',()=>demo.setPanel('airplay'))}
 {row('Remote','remote',()=>demo.setPanel('remote'),demo.remote?t('Connected'):'')}
 {row('Wallpapers','wallpaper',()=>demo.setPanel('wallpapers'))}

 {row('Disable blur','sun',()=>demo.change({blur:demo.prefs.blur===false}),t(demo.prefs.blur===false?'On':'Off'))}
 {row('Activity background','apps',()=>demo.change({glass:!demo.prefs.glass}),demo.prefs.glass?'Black':'Clear')}
 {row('Language','tv',()=>demo.change({language:demo.prefs.language==='en'?'it':'en'}),demo.prefs.language==='en'?'English':'Italiano')}
 {row('TV settings','settings',()=>demo.setPanel('about'))}
 </>}
 {panel==='music'&&<MusicPanel demo={demo} t={t}/>}
 {panel==='wallpapers'&&<><Text style={s.description}>A quieter backdrop for your screen.</Text><View style={s.gallery}>{wallpapers.map(w=><View key={w.id} style={{width:'47%'}}><FocusButton id={`wallpaper-${w.id}`} group="modal" label={w.name} selected={demo.prefs.wallpaper===w.id} onPress={()=>demo.change({wallpaper:w.id})} style={{height:104,overflow:'hidden',borderRadius:15}}><Wallpaper id={w.id} mini/>{demo.prefs.wallpaper===w.id&&<View style={s.check}><Icon name="check" size={16}/></View>}</FocusButton><Text style={[s.label,{marginTop:9,marginBottom:15}]}>{w.name}</Text></View>)}</View>{row('Music wallpaper tint','music',()=>demo.change({musicTint:!demo.prefs.musicTint}),t(demo.prefs.musicTint?'On':'Off'))}{row('Animated wallpapers','wallpaper',()=>demo.change({motion:!demo.prefs.motion}),t(demo.prefs.motion?(reduced?'Reduced motion':'On'):'Off'))}<Text style={s.description}>Subtle motion, following your accessibility preferences.</Text></>}
 {panel==='remote'&&<><Text style={s.description}>Use the pad to navigate Aurea Home.</Text>{row(demo.remote?'Disconnect remote':'Connect remote','remote',()=>demo.setRemote(r=>!r))}<View style={s.dpad}><FocusButton id="remote-up" group="modal" label="Remote up" onPress={()=>demo.setPage(p=>Math.max(0,p-1))}><Text style={s.arrow}>↑</Text></FocusButton><View style={{flexDirection:'row',gap:20,alignItems:'center'}}><FocusButton id="remote-left" group="modal" label="Remote left" onPress={()=>{const i=demo.prefs.dock.indexOf(demo.selected);demo.setSelected(demo.prefs.dock[Math.max(0,i-1)]!);}}><Text style={s.arrow}>←</Text></FocusButton><FocusButton id="remote-ok" group="modal" label="Remote OK" onPress={()=>{demo.close();launch(demo.selected);}} style={s.ok}><Text style={s.label}>OK</Text></FocusButton><FocusButton id="remote-right" group="modal" label="Remote right" onPress={()=>{const i=demo.prefs.dock.indexOf(demo.selected);demo.setSelected(demo.prefs.dock[Math.min(5,i+1)]!);}}><Text style={s.arrow}>→</Text></FocusButton></View><FocusButton id="remote-down" group="modal" label="Remote down" onPress={()=>demo.setPage(p=>Math.min(2,p+1))}><Text style={s.arrow}>↓</Text></FocusButton></View><Text style={[s.value,{textAlign:'center'}]}>{entry(demo.selected).name}</Text><View style={s.actions}>{row('Home','home',()=>{demo.close();demo.setPage(0);})}{row('Play','play',demo.toggle)}</View></>}
 {panel==='airplay'&&<><View style={s.emptyIcon}><Icon name="airplay" size={54}/></View><Text style={s.description}>Your listening experience, right at home.</Text>{row('Music','music',()=>{demo.start();demo.close();})}</>}
 {panel==='network'&&<><Text style={s.description}>Aurea Wi-Fi · Connected</Text>{row('Remote','remote',()=>demo.setPanel('remote'))}</>}
 {panel==='display'&&<>{row('Wallpapers','wallpaper',()=>demo.setPanel('wallpapers'))}

 {row('Disable blur','sun',()=>demo.change({blur:demo.prefs.blur===false}),t(demo.prefs.blur===false?'On':'Off'))}{row('Motion','sun',()=>demo.change({motion:!demo.prefs.motion}),t(demo.prefs.motion?(reduced?'Reduced motion':'On'):'Off'))}</>}
 {panel==='sound'&&<><Text style={s.description}>Listening volume</Text>{row('Volume −','volume',()=>demo.setVolume(v=>Math.max(0,v-5)),`${demo.volume}%`)}{row('Volume +','volume',()=>demo.setVolume(v=>Math.min(100,v+5)),`${demo.volume}%`)}</>}
 {panel==='about'&&<><Text style={s.description}>Aurea Home · Web preview {appConfig.expo.version}{ '\n\n' }This web preview shares the Expo Home interface with Android TV. Its sample apps and media stay in this browser. Preview changes stay in this browser.{ '\n\n' }Arrow keys navigate · Enter selects · M opens an app menu · C opens Control Center · Escape goes back · Space plays or pauses.{ '\n\n' }AGPL-3.0-only · Same project, isolated preview data. Preferences are saved only in this browser.</Text>{row('Source code','apps',()=>{void Linking.openURL('https://github.com/Xarber/MiTV-Home/tree/'+(process.env.EXPO_PUBLIC_SOURCE_COMMIT??'testing'));})}{row('Restore defaults','settings',demo.reset)}</>}
 {panel.startsWith('menu:')&&<>{row('Launch','play',()=>{demo.close();launch(panel.split(':')[1]!);})}{row('Pin to dock','apps',()=>demo.setPanel(`pin:${panel.split(':')[1]}`))}{panel.split(':')[1]!=='all'&&demo.prefs.dock.includes(panel.split(':')[1]!)&&row('Remove from dock','close',()=>{demo.remove(panel.split(':')[1]!);demo.close();})}</>}
 {panel.startsWith('pin:')&&demo.prefs.dock.map((id,index)=>panel.split(':')[1]==='all'&&index!==5?null:row(`${index+1} · ${entry(id).name}`,'apps',()=>{demo.pin(panel.split(':')[1]!,index);demo.close();},panel.split(':')[1]==='all'&&index!==5?'Slot 6 only':undefined))}
 {panel.startsWith('launch:')&&<><View style={s.emptyIcon}><Icon name={entry(panel.split(':')[1]!).icon} size={70}/></View><Text style={[s.title,{textAlign:'center',marginBottom:14}]}>{entry(panel.split(':')[1]!).subtitle??entry(panel.split(':')[1]!).name}</Text><Text style={s.description}></Text>{row('Home','home',()=>{demo.close();demo.setPage(0);})}</>}
 </FadedScroll>
 </AnchoredPanel>;
}
const s=StyleSheet.create({overlay:{...StyleSheet.absoluteFill,backgroundColor:'rgba(2,4,10,.62)',alignItems:'center',justifyContent:'center',zIndex:10,padding:28,...Platform.select({web:{backdropFilter:'blur(26px) saturate(1.2)'} as object})},panel:{flexShrink:1,width:'100%',maxWidth:530,maxHeight:'88%',borderRadius:30,backgroundColor:'rgba(15,18,25,.94)',borderWidth:1,borderColor:'#ffffff20',padding:23,boxShadow:'0 30px 100px #0008',overflow:'hidden'},music:{alignSelf:'flex-start',maxHeight:'100%',backgroundColor:'rgba(0,0,0,.88)',maxWidth:590},header:{flexDirection:'row',alignItems:'center',padding:0,marginBottom:16,gap:12},eyebrow:{fontSize:10,fontWeight:'700',letterSpacing:2.3,color:'#a4abb9',marginBottom:8},title:{fontSize:27,fontWeight:'600',letterSpacing:-.6,color:'#fff'},close:{backgroundColor:'#ffffff0d',width:44,height:44,borderRadius:24},row:{flexDirection:'row',gap:15,alignItems:'center',justifyContent:'flex-start',paddingHorizontal:15,paddingVertical:12,minHeight:54,borderRadius:13,marginBottom:5,backgroundColor:'#ffffff08'},label:{fontSize:15,fontWeight:'500',color:'#f3f4f8',flexShrink:1},value:{fontSize:12,color:'#aeb6c7',marginLeft:'auto'},description:{fontSize:14,lineHeight:23,color:'#bfc5d1',marginBottom:20},gallery:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:12},check:{position:'absolute',right:8,bottom:8,padding:4,backgroundColor:'#0008',borderRadius:20},emptyIcon:{alignItems:'center',justifyContent:'center',height:140},dpad:{alignItems:'center',gap:6,padding:20},arrow:{fontSize:26,color:'white'},ok:{width:65,height:65,borderRadius:40,backgroundColor:'#ffffff15'},actions:{marginTop:25,gap:10}});
