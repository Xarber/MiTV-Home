// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import {View,Text,StyleSheet} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {FocusButton} from '../components/FocusButton';
import {Icon} from '../components/Icon';
import type {IconName} from '../model/catalog';
import type {RemoteKey} from './types';
import type {RemoteClient} from './client';
import {VoiceButton} from './voice/VoiceButton';
import {NavigationPad} from './NavigationPad';
type Props={client:RemoteClient;full:boolean;connected:boolean;paired:boolean;ready:boolean;command:(key:RemoteKey)=>void;pair:()=>void;group?:string;touch?:boolean;availableHeight?:number;touchActive?:(value:boolean)=>void;voiceError?:(value:string|undefined)=>void;};
const paths:Partial<Record<RemoteKey,string>>={mute:'M3 9h4l5-4v14l-5-4H3z M17 9l5 6 M17 15l5-6',rewind:'M11 5l-9 7 9 7z M22 5l-9 7 9 7z',fastforward:'M2 5l9 7-9 7z M13 5l9 7-9 7z',stop:'M5 5h14v14H5z'};
function KeyIcon({name}:{name:RemoteKey}){return paths[name]?<Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round"><Path d={paths[name]}/></Svg>:<Icon name={name==='control'?'settings':name as IconName} size={22}/>;}
export function RemoteHandset({client,full,connected,paired,ready,command,pair,group='phone',touch=false,availableHeight=600,touchActive=()=>{},voiceError}:Props){
 const padSize=full?Math.max(160,Math.min(200,availableHeight-310)):Math.max(170,Math.min(240,availableHeight-150));
 const key=(name:RemoteKey,label:string,id='phone-'+name,style:object={},symbol?:string)=><FocusButton key={id} id={id} group={group} label={label} disabled={!connected} onPress={()=>command(name)} onLongPress={name==='ok'?()=>command('menu'):name==='back'?()=>command('control'):undefined} style={[s.key,style]}>{symbol?<Text style={s.symbol}>{symbol}</Text>:<KeyIcon name={name}/>}</FocusButton>;
 return <View testID={full?'full-remote':'home-remote'} style={s.wrapper}>
 <View style={[s.handset,full&&s.complete]}>
 {touch?<NavigationPad size={padSize} connected={connected} command={command} active={touchActive}/>:<View style={[s.pad,{width:padSize,height:padSize}]}>
 {key('up','Up','phone-up',{position:'absolute',top:4,left:padSize/2-22},'⌃')}
 {key('left','Left','phone-left',{position:'absolute',left:4,top:padSize/2-22},'‹')}
 {key('ok','Select','phone-ok',s.ok,'OK')}
 {key('right','Right','phone-right',{position:'absolute',right:4,top:padSize/2-22},'›')}
 {key('down','Down','phone-down',{position:'absolute',bottom:4,left:padSize/2-22},'⌄')}
 </View>}
 <View style={s.row}>{key('back','Back')}{key('home','Home')}{key('playpause','Play / Pause','phone-play')}{key('menu','Menu','phone-menu')}{key('control','Control Center','phone-control')}</View>
 <View style={s.rockers}>
 {full?<View testID="volume-rocker" style={s.rocker}>{key('volumeup','Volume up','phone-volume-up',s.rockerKey,'+')}<Text style={s.rockerLabel}>VOL</Text>{key('volumedown','Volume down','phone-volume-down',s.rockerKey,'−')}</View>:<View testID="compact-volume" style={s.horizontalVolume}>{key('mute','Mute','phone-mute',s.small)}{key('volumedown','Volume down','phone-volume-down',s.small,'−')}{key('volumeup','Volume up','phone-volume-up',s.small,'+')}</View>}
 <View style={s.middle}><VoiceButton client={client} enabled={connected&&paired&&ready} group={group} compact onError={voiceError}/>{full&&key('mute','Mute','phone-mute',s.small)}</View>
 {full&&<View testID="channel-rocker" style={s.rocker}>{key('channelup','Channel up','phone-tv-channelup',s.rockerKey,'+')}<Text style={s.rockerLabel}>CH</Text>{key('channeldown','Channel down','phone-tv-channeldown',s.rockerKey,'−')}</View>}
 </View>
 {full&&<><View style={s.row}>{key('previous','Previous','phone-tv-previous',s.small)}{key('rewind','Rewind','phone-tv-rewind',s.small)}{key('stop','Stop','phone-tv-stop',s.small)}{key('fastforward','Fast forward','phone-tv-fastforward',s.small)}{key('next','Next','phone-tv-next',s.small)}</View><View style={[s.row,{gap:15}]}>{(['red','green','yellow','blue'] as const).map((name,index)=><FocusButton id={'phone-tv-'+name} key={name} group={group} label={name+' button'} onPress={()=>command(name)} disabled={!connected} style={s.colorKey}><View style={[s.color,{backgroundColor:['#e34b5d','#4dae80','#e6c45a','#599df0'][index]}]}/></FocusButton>)}</View></>}
 </View></View>;
}
const s=StyleSheet.create({wrapper:{alignItems:'center',width:'100%',paddingHorizontal:16,paddingBottom:4},inputMode:{flexDirection:'row',padding:3,borderRadius:18,backgroundColor:'#ffffff08',marginBottom:14},mode:{paddingHorizontal:18,minHeight:34,borderRadius:15},chosen:{backgroundColor:'#ffffff12'},caption:{color:'#d0d9e5',fontSize:12},handset:{alignItems:'center',width:'100%',maxWidth:330,padding:10,borderRadius:36,gap:16},complete:{backgroundColor:'#10131bd9',borderWidth:1,borderColor:'#ffffff14',paddingVertical:10,gap:8,boxShadow:'0 14px 38px #00000026'},brand:{color:'#7c899b',fontSize:10,fontWeight:'700',letterSpacing:2},top:{width:'100%',flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:8},key:{width:44,height:44,borderRadius:24,backgroundColor:'#ffffff0b'},small:{width:44,height:44,minWidth:44,borderRadius:24},symbol:{color:'#e9edf6',fontSize:25,lineHeight:30},pad:{width:240,height:240,borderRadius:124,backgroundColor:'#ffffff08',borderWidth:1,borderColor:'#ffffff14',alignItems:'center',justifyContent:'center'},ok:{width:78,height:78,borderRadius:42,backgroundColor:'#ffffff10'},touch:{borderRadius:35},touchDot:{width:5,height:5,borderRadius:3,backgroundColor:'#ffffff70'},touchHint:{position:'absolute',bottom:18,color:'#9caabc',fontSize:11},row:{flexDirection:'row',gap:8,justifyContent:'center',alignItems:'center'},rockers:{flexDirection:'row',justifyContent:'center',gap:18,alignItems:'center'},rocker:{width:60,padding:4,borderRadius:30,backgroundColor:'#ffffff08',alignItems:'center',gap:2},rockerKey:{backgroundColor:'transparent'},rockerLabel:{height:20,lineHeight:20,color:'#8f9eb2',fontSize:10,fontWeight:'600',letterSpacing:1},horizontalVolume:{flexDirection:'row',alignItems:'center',padding:5,gap:6,borderRadius:30,backgroundColor:'#ffffff08'},middle:{alignItems:'center',gap:8},colorKey:{width:44,height:44,borderRadius:24,backgroundColor:'#ffffff05'},color:{width:15,height:15,borderRadius:8},status:{fontSize:11,color:'#97a7ba',textAlign:'center',marginTop:4}});
