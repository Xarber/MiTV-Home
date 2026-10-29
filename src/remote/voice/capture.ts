// SPDX-License-Identifier: AGPL-3.0-only
import {Platform,PermissionsAndroid} from 'react-native';
import {requireOptionalNativeModule} from 'expo';
import type {VoiceCapture,VoicePacket,VoiceSession} from './types';
type Subscription={remove():void};
interface MicrophoneModule {
 requestPermission():Promise<boolean>;
 start(id:string,key:string,pkcs1:string):Promise<void>;
 stop():Promise<void>;
 addListener(event:'chunk',listener:(value:VoicePacket)=>void):Subscription;
 addListener(event:'stopped',listener:(value:{id:string;error?:string})=>void):Subscription;
}
export function voiceAvailable(){return Platform.OS==='web'?!!(globalThis.isSecureContext&&navigator.mediaDevices&&'AudioWorkletNode' in globalThis):!!requireOptionalNativeModule('AureaMicrophone');}
export function microphoneCapture():VoiceCapture{
 if(Platform.OS==='web')return webCapture();
 const native=requireOptionalNativeModule<MicrophoneModule>('AureaMicrophone');
 let subscriptions:Subscription[]=[],finish:()=>void=()=>{},stopped=Promise.resolve();
 return {
  async permission(){
   if(!native)throw new Error('microphone_requires_updated_app');
   const allowed=Platform.OS==='android'?await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)==='granted':await native.requestPermission();
   if(!allowed)throw new Error('microphone_permission_denied');
  },
  async start(session,packet,ended){
   if(!native)throw new Error('microphone_unavailable');
   stopped=new Promise<void>(resolve=>{finish=resolve;});
   subscriptions=[native.addListener('chunk',value=>{if(value.id===session.id)packet(value);}),native.addListener('stopped',value=>{if(value.id===session.id){finish();ended(value.error);}})];
   try{await native.start(session.id,session.publicKey,session.publicKeyPKCS1);}catch(error){finish();throw error;}
  },
  async stop(){
   await native?.stop().catch(()=>{});
   let timer:ReturnType<typeof setTimeout>|undefined;
   await Promise.race([stopped,new Promise<void>(resolve=>{timer=setTimeout(resolve,2000);})]);clearTimeout(timer);
   subscriptions.forEach(subscription=>subscription.remove());subscriptions=[];
  }
 };
}
const b64=(bytes:ArrayBuffer|Uint8Array)=>{let text='';for(const byte of new Uint8Array(bytes))text+=String.fromCharCode(byte);return btoa(text);};
function webCapture():VoiceCapture{
 let stream:MediaStream|undefined,context:AudioContext|undefined,node:AudioWorkletNode|undefined;
 let encryption=Promise.resolve(),flushed=()=>{},stopping=false;
 return {
  async permission(){
   if(!voiceAvailable())throw new Error('microphone_requires_https_or_native_app');
   context=new AudioContext();await context.resume();
   stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
  },
  async start(session:VoiceSession,packet,ended){
   if(!stream)throw new Error('microphone_unavailable');
   stopping=false;
   const aes=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt']);
   const rsa=await crypto.subtle.importKey('spki',Uint8Array.from(atob(session.publicKey),c=>c.charCodeAt(0)),{name:'RSA-OAEP',hash:'SHA-256'},false,['wrapKey']);
   const wrappedKey=b64(await crypto.subtle.wrapKey('raw',aes,rsa,{name:'RSA-OAEP'}));
   if(!context)throw new Error('microphone_unavailable');await context.audioWorklet.addModule('/voice-capture.js');
   node=new AudioWorkletNode(context,'aurea-voice');let sequence=0;
   node.port.onmessage=event=>{
    if(event.data?.flushed){flushed();if(!stopping)ended();return;}
    if(!(event.data instanceof ArrayBuffer))return;
    const pcm=event.data;
    encryption=encryption.then(async()=>{
     const current=sequence++,nonce=crypto.getRandomValues(new Uint8Array(12));
     const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:new TextEncoder().encode(session.id+':'+current)},aes,pcm);
     new Uint8Array(pcm).fill(0);packet({id:session.id,sequence:current,nonce:b64(nonce),wrappedKey,ciphertext:b64(ciphertext)});
    }).catch(()=>ended('microphone_encryption_failed'));
   };
   for(const track of stream.getTracks())track.onended=()=>{if(!stopping)ended('microphone_disconnected');};
   const silent=context.createGain();silent.gain.value=0;
   context.createMediaStreamSource(stream).connect(node);node.connect(silent);silent.connect(context.destination);await context.resume();
  },
  async stop(){
   stopping=true;
   try{
    if(node){let timer:ReturnType<typeof setTimeout>|undefined;await new Promise<void>(resolve=>{flushed=resolve;timer=setTimeout(resolve,500);node!.port.postMessage('flush');});clearTimeout(timer);}
    await encryption;
   }finally{stream?.getTracks().forEach(track=>track.stop());stream=undefined;node?.disconnect();node=undefined;await context?.close().catch(()=>{});context=undefined;}
  }
 };
}
