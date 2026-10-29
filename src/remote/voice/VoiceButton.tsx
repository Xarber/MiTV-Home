// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect,useRef,useState} from 'react';
import {AppState,Text,View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {FocusButton} from '../../components/FocusButton';
import type {RemoteClient} from '../client';
import {VoiceController} from './VoiceController';
import type {VoicePhase} from './VoiceController';
import {microphoneCapture,voiceAvailable} from './capture';
const messages:Record<string,string>={microphone_permission_denied:'Microphone access was denied.',microphone_requires_https_or_native_app:'Use the phone app or HTTPS for microphone access.',voice_unavailable_in_preview:'Voice is available when connected to a real TV.',voice_unsupported:'This TV does not support voice streaming.',system_pairing_required:'Pair system controls first.',voice_busy:'Another microphone is already active.'};
export function VoiceButton({client,enabled}:{client:RemoteClient;enabled:boolean}){
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
   const next=new VoiceController(microphoneCapture(),client.voiceTransport(),(value,message)=>{if(mounted.current){setPhase(value);setError(message?messages[message]??'Voice connection ended. Please try again.':undefined);}});
   controller.current=next;void next.start();
  }catch(error){setError(error instanceof Error?messages[error.message]??'Connect and pair system controls first.':'Microphone unavailable.');}
 };
 return <View style={{gap:8}}><FocusButton id="phone-tv-microphone" group="phone-modal" label={active?'Stop microphone':'Use phone microphone'} disabled={!enabled||!available} onPress={press} style={{minHeight:64,flexDirection:'row',gap:12,backgroundColor:active?'#a12636':'#ffffff0a',borderRadius:18}}><Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"><Path d="M9 5a3 3 0 016 0v6a3 3 0 01-6 0z M6 10v1a6 6 0 0012 0v-1 M12 17v5 M9 22h6"/></Svg><Text style={{color:'#fff',fontWeight:'600'}}>{phase==='listening'?'Listening · Tap to stop':phase==='permission'?'Allow microphone access…':phase==='connecting'?'Connecting microphone…':phase==='stopping'?'Stopping…':'Phone microphone'}</Text></FocusButton>{(!available||error)&&<Text accessibilityLiveRegion="polite" style={{color:'#bdc6d5',fontSize:12}}>{error??'Use the updated phone app or an HTTPS browser page for microphone access.'}</Text>}</View>;
}
