// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect,useRef,useState} from 'react';
import {AppState,Text,View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {FocusButton} from '../../components/FocusButton';
import type {RemoteClient} from '../client';
import {VoiceController} from './VoiceController';
import type {VoicePhase} from './VoiceController';
import {microphoneCapture,voiceAvailable} from './capture';
const messages:Record<string,string>={system_connection_failed:'Microphone could not connect to the TV’s system controls.',system_tls_failed:'Microphone could not establish the system control connection.',authentication_failed:'System pairing was rejected. Pair system controls again.',microphone_permission_denied:'Microphone access was denied.',microphone_requires_https_or_native_app:'Use the phone app or HTTPS for microphone access.',voice_unavailable_in_preview:'Voice is available when connected to a real TV.',voice_unsupported:'This TV does not support voice streaming.',system_pairing_required:'Pair system controls first.',voice_busy:'Another microphone is already active.'};
export function VoiceButton({client,enabled,group="phone-modal",compact=false,onError}:{client:RemoteClient;enabled:boolean;group?:string;compact?:boolean;onError?:(value:string|undefined)=>void}){
 const [phase,setPhase]=useState<VoicePhase>('idle'),[error,setError]=useState<string>();
 const phaseRef=useRef(phase);phaseRef.current=phase;
 const controller=useRef<VoiceController|undefined>(undefined),mounted=useRef(true);
 const available=voiceAvailable(),active=phase!=='idle',deviceId=client.snapshot.device?.id;
 useEffect(()=>()=>{void controller.current?.stop();},[deviceId]);
 useEffect(()=>{mounted.current=true;const subscription=AppState.addEventListener('change',state=>{if(state==='background'||state==='inactive'&&phaseRef.current==='listening')void controller.current?.stop();});return()=>{mounted.current=false;subscription.remove();void controller.current?.stop();};},[]);
 useEffect(()=>{if(!enabled)void controller.current?.stop();},[enabled]);
 const press=()=>{
  if(active){void controller.current?.stop();return;}
  try{
   const next=new VoiceController(microphoneCapture(),client.voiceTransport(),(value,message)=>{if(mounted.current){setPhase(value);const text=message?messages[message]??'Voice connection ended. Check system controls and try again.':undefined;setError(text);onError?.(text);}});
   controller.current=next;void next.start();
  }catch(error){const text=error instanceof Error?messages[error.message]??'Connect and pair system controls first.':'Microphone unavailable.';setError(text);onError?.(text);}
 };
 return <View style={{gap:8}}><FocusButton id="phone-tv-microphone" group={group} label={!enabled?'Connect system controls to use the microphone':!available?'Microphone requires the phone app or HTTPS':active?'Stop microphone':'Use phone microphone'} disabled={!enabled||!available} onPress={press} style={{minHeight:compact?52:64,width:compact?52:undefined,flexDirection:'row',gap:12,backgroundColor:active?'#a12636':'#ffffff0a',borderRadius:compact?28:18}}><Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"><Path d="M9 5a3 3 0 016 0v6a3 3 0 01-6 0z M6 10v1a6 6 0 0012 0v-1 M12 17v5 M9 22h6"/></Svg>{!compact&&<Text style={{color:'#fff',fontWeight:'600'}}>{phase==='listening'?'Listening · Tap to stop':phase==='permission'?'Allow microphone access…':phase==='connecting'?'Connecting microphone…':phase==='stopping'?'Stopping…':'Phone microphone'}</Text>}</FocusButton>{!compact&&(!available||error)&&<Text accessibilityLiveRegion="polite" style={{color:'#bdc6d5',fontSize:12}}>{error??'Use the updated phone app or an HTTPS browser page for microphone access.'}</Text>}</View>;
}
