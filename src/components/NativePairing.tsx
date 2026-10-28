// SPDX-License-Identifier: AGPL-3.0-only
import React,{useRef,useState} from 'react';
import {Text,TextInput} from 'react-native';
import type {Launcher} from '../launcher/types';
import type {IconName} from '../model/catalog';
export function NativePairing({demo,t,row}:{demo:Launcher;t:(s:string)=>string;row:(label:string,icon:IconName,click:()=>void,value?:string)=>React.ReactNode}){
 const field=useRef<React.ComponentRef<typeof TextInput>>(null);
 const [devices,setDevices]=useState<{id:string;name:string}[]>([]),[status,setStatus]=useState(''),[pin,setPin]=useState('');const [busy,setBusy]=useState(false);const paired=demo.snapshot!.paired;
 const request=async(operation:string,payload:Record<string,unknown>={})=>{setBusy(true);setStatus(t('Connecting…'));try{const value=await demo.pairedRequest(operation,payload);if(value.error){setStatus(t('Pairing failed — go back and try again'));return;}setStatus('');if(operation==='scan'&&Array.isArray(value.devices))setDevices(value.devices.filter(device=>device&&typeof device.id==='string'&&typeof device.name==='string'));}catch{setStatus(t('Could not connect — try again'));}finally{setBusy(false);}};
 return <>
 <Text style={{color:'#c2cad7',marginBottom:14}}>{paired.paired?paired.name:t('No paired device')}</Text>
 {!!status&&<Text accessibilityLiveRegion="polite" style={{color:'#fff',marginBottom:14}}>{status}</Text>}
 {paired.pending?<><Text style={{color:'#c2cad7',lineHeight:23,marginBottom:16}}>{t('Show Apple TV on its HDMI input, note the code, then press Home to return here. The saved pairing does not expire.')}</Text>
 <TextInput ref={field} accessibilityLabel={t('Pairing code')} secureTextEntry keyboardType="number-pad" maxLength={4} value={pin} onChangeText={setPin} autoComplete="off" style={{color:'#fff',backgroundColor:'#ffffff16',padding:15,borderRadius:14,fontSize:24,marginBottom:15}}/>
 {row('Enter code','code',()=>field.current?.focus())}
 {row('Pair','check',()=>{if(busy)return;if(!/^\d{4}$/.test(pin)){setStatus(t('Enter four digits'));return;}const value=pin;setPin('');void request('pair_finish',{pin:value});})}
 {row('Show pairing code','inputs',()=>{if(!paired.input){demo.setPanel('input');return;}void demo.execute('launch',{id:paired.input}).catch(()=>{});})}
 {row('Change HDMI input','inputs',()=>demo.setPanel('input'))}{row('Cancel','close',()=>{void demo.execute('cancelPairing').catch(()=>{});})}</>:<>
 {row('Find Apple TV','airplay',()=>{if(!busy)void request('scan');})}
 {devices.map(device=>row(device.name,'airplay',()=>{if(!busy)void request('pair_begin',{id:device.id});}))}
 {paired.paired&&row('Remove pairing','close',()=>{void demo.execute('unpairAppleTV').catch(()=>{});})}</>}
 </>;
}
