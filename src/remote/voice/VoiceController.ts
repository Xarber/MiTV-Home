// SPDX-License-Identifier: AGPL-3.0-only
import {parseVoiceSession} from './types.ts';
import type {VoiceCapture,VoicePacket,VoiceRPC} from './types.ts';
export type VoicePhase='idle'|'permission'|'connecting'|'listening'|'stopping';
/** A single use controller. Cancellation also covers a pending OS permission dialog. */
export class VoiceController{
 private cancelled=false;
 private session?:string;
 private queue:Promise<void>=Promise.resolve();
 private pending=0;
 private stopped?:Promise<void>;
 private timer?:ReturnType<typeof setTimeout>;
 private starting?:Promise<void>;
 private capture:VoiceCapture;
 private rpc:VoiceRPC;
 private status:(phase:VoicePhase,error?:string)=>void;
 constructor(capture:VoiceCapture,rpc:VoiceRPC,status:(phase:VoicePhase,error?:string)=>void){this.capture=capture;this.rpc=rpc;this.status=status;}
 start(){this.starting=this.begin();return this.starting;}
 private async begin(){
  try{
   this.status('permission');await this.capture.permission();if(this.cancelled)return;
   this.status('connecting');const session=parseVoiceSession(await this.rpc('voice_start',{}));this.session=session.id;
   if(this.cancelled)return;
   await this.capture.start(session,packet=>this.send(packet),error=>{void this.stop(error);});
   if(this.cancelled)return;
   this.status('listening');this.timer=setTimeout(()=>{void this.stop();},30000);
  }catch(error){void this.stop(error instanceof Error?error.message:'microphone_failed');}
 }
 private send(packet:VoicePacket){
  if(packet.id!==this.session)return;
  if(this.pending>=3){void this.stop('voice_connection_too_slow');return;}
  this.pending++;
  this.queue=this.queue.then(async()=>{await this.rpc('voice_chunk',{...packet});}).catch(()=>{void this.stop('voice_connection_lost');}).finally(()=>{this.pending--;});
 }
 stop(error?:string):Promise<void>{
  if(this.stopped)return this.stopped;
  this.cancelled=true;clearTimeout(this.timer);this.status('stopping');
  // Schedule cleanup after assignment so synchronous capture callbacks cannot reenter it.
  this.stopped=Promise.resolve().then(async()=>{
   await this.starting?.catch(()=>{});
   try{await this.capture.stop();await this.queue;}finally{
    if(this.session)await this.rpc('voice_end',{id:this.session}).catch(()=>{});
    this.session=undefined;this.status('idle',error);
   }
  });return this.stopped;
 }
}
