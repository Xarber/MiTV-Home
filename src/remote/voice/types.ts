// SPDX-License-Identifier: AGPL-3.0-only
export interface VoiceSession {id:string;publicKey:string;publicKeyPKCS1:string;sampleRate:8000;channels:1;sampleBits:16;maximumMs:30000;}
export interface VoicePacket {id:string;sequence:number;nonce:string;ciphertext:string;wrappedKey:string;}
export type VoiceRPC=(operation:'voice_start'|'voice_chunk'|'voice_end',payload:Record<string,unknown>)=>Promise<Record<string,unknown>>;
export interface VoiceCapture {
 permission():Promise<void>;
 start(session:VoiceSession,packet:(value:VoicePacket)=>void,ended:(error?:string)=>void):Promise<void>;
 stop():Promise<void>;
}
export function parseVoiceSession(value:Record<string,unknown>):VoiceSession{
 if(typeof value.id!=='string'||! /^[a-f0-9]{32}$/.test(value.id)||value.sampleRate!==8000||value.channels!==1||value.sampleBits!==16||value.maximumMs!==30000||typeof value.publicKey!=='string'||typeof value.publicKeyPKCS1!=='string'||![value.publicKey,value.publicKeyPKCS1].every(key=>key.length<2048&&/^[A-Za-z0-9+/]+=*$/.test(key)))throw new Error('invalid_voice_session');
 return value as unknown as VoiceSession;
}
