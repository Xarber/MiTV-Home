// SPDX-License-Identifier: AGPL-3.0-only
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VoiceController} from '../../src/remote/voice/VoiceController.ts';
import {parseVoiceSession} from '../../src/remote/voice/types.ts';
import type {VoiceCapture,VoicePacket,VoiceRPC} from '../../src/remote/voice/types.ts';
const session={id:'a'.repeat(32),publicKey:'YQ==',publicKeyPKCS1:'YQ==',sampleRate:8000,channels:1,sampleBits:16,maximumMs:30000};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
class Capture implements VoiceCapture{
 stops=0;starts=0;permission=async()=>{};packet?:(packet:VoicePacket)=>void;
 async start(_session:unknown,packet:(packet:VoicePacket)=>void){this.starts++;this.packet=packet;}
 async stop(){this.stops++;}
 send(sequence=0){this.packet?.({id:session.id,sequence,nonce:'a',ciphertext:'b',wrappedKey:'c'});}
}
test('cancelling permission never starts TV voice or microphone',async()=>{
 const capture=new Capture();let permit!:()=>void;capture.permission=()=>new Promise<void>(resolve=>{permit=resolve;});const calls:string[]=[];
 const controller=new VoiceController(capture,async operation=>{calls.push(operation);return session;},()=>{});
 const start=controller.start();const stop=controller.stop();permit();await Promise.all([start,stop]);assert.equal(capture.starts,0);assert.deepEqual(calls,[]);assert.equal(capture.stops,1);
});
test('ordered chunks drain before end; stop is idempotent',async()=>{
 const capture=new Capture(),calls:string[]=[];
 const controller=new VoiceController(capture,async(operation,payload)=>{calls.push(operation+(operation==='voice_chunk'?':'+payload.sequence:''));return session;},()=>{});
 await controller.start();capture.send(0);capture.send(1);await controller.stop();await controller.stop();assert.deepEqual(calls,['voice_start','voice_chunk:0','voice_chunk:1','voice_end']);assert.equal(capture.stops,1);
});
test('cancel during network setup closes the original session without starting capture',async()=>{
 const capture=new Capture(),calls:string[]=[];let ready!:(value:Record<string,unknown>)=>void;
 const rpc:VoiceRPC=async operation=>{calls.push(operation);return operation==='voice_start'?new Promise(resolve=>{ready=resolve;}):{};};
 const controller=new VoiceController(capture,rpc,()=>{});const start=controller.start();await tick();const stop=controller.stop();ready(session);await Promise.all([start,stop]);assert.equal(capture.starts,0);assert.deepEqual(calls,['voice_start','voice_end']);
});
test('failed audio packet is never retried and ends microphone',async()=>{
 const capture=new Capture(),calls:string[]=[],phases:string[]=[];
 const controller=new VoiceController(capture,async operation=>{calls.push(operation);if(operation==='voice_chunk')throw new Error('offline');return session;},(phase)=>phases.push(phase));
 await controller.start();capture.send();await tick();await controller.stop();assert.deepEqual(calls,['voice_start','voice_chunk','voice_end']);assert.equal(capture.stops,1);assert.equal(phases.at(-1),'idle');
});
test('unexpected microphone format is rejected',()=>{assert.throws(()=>parseVoiceSession({...session,sampleRate:48000}));assert.throws(()=>parseVoiceSession({...session,id:'unsafe'}));});
