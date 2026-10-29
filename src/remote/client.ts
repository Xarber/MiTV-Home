// SPDX-License-Identifier: AGPL-3.0-only
import type {Transport,RemoteSnapshot,Session,RemoteKey,MediaAction} from './types';
import {parseState,parseCatalog,safeImage,retryDelay,RemoteError} from './validation.ts';
export interface TrustStore {save(session:Session):Promise<void>;forget(address?:string):Promise<void>;}
/** Read-only polls reconnect; user commands are never automatically replayed. */
export class RemoteClient {
 snapshot:RemoteSnapshot={status:'disconnected',icons:{},systemPairing:false};
 private listeners=new Set<()=>void>();
 private transport?:Transport;
 private session?:Session;
 private fixture=false;
 private active=true;
 private generation=0;
 private attempts=0;
 private polling=false;
 private timer?:ReturnType<typeof setTimeout>;
 private requests=new Set<AbortController>();
 private readonly trust:TrustStore;
 constructor(trust:TrustStore){this.trust=trust;}
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 private update(value:Partial<RemoteSnapshot>){this.snapshot={...this.snapshot,...value};for(const listener of this.listeners)listener();}
 private cancel(){clearTimeout(this.timer);for(const controller of this.requests)controller.abort();this.requests.clear();this.polling=false;this.generation++;this.iconQueue=[];this.iconsLoading.clear();this.lastArt=undefined;}
 connect(transport:Transport,session:Session,fixture=false){
  this.cancel();this.transport?.close?.();this.transport=transport;this.session=session;this.fixture=fixture;this.active=true;this.attempts=0;
  this.update({status:'connecting',device:undefined,catalog:undefined,artwork:undefined,icons:{},error:undefined,systemPairing:false,systemBusy:false,pairingSuccess:undefined,lastReceived:undefined});
  void this.poll();
 }
 async beginPair(transport:Transport,address:string){
  this.cancel();this.transport?.close?.();this.transport=transport;this.session={address,token:''};this.fixture=false;this.active=true;
  this.update({status:'connecting',device:undefined,catalog:undefined,icons:{},error:undefined,systemPairing:false,systemBusy:false,pairingSuccess:undefined});
  const generation=this.generation;
  try{await this.verifyIdentity();if(generation!==this.generation)return;await this.rpc('pair_start',{});if(generation===this.generation)this.update({status:'pairing'});}catch(error){if(generation===this.generation)this.update({status:'disconnected',error:this.code(error)});}
 }
 async pair(pin:string){
  if(!/^\d{6}$/.test(pin)){this.update({error:'invalid_pin'});return;}
  const generation=this.generation;
  try{
   const result=await this.rpc('pair',{pin});if(generation!==this.generation)return;
   if(typeof result.token!=='string'||! /^[A-Za-z0-9_-]{32}$/.test(result.token))throw new RemoteError('invalid_response');
   if(!this.fixture&&result.id!==this.session?.id)throw new RemoteError('device_changed');
   this.session={...this.session!,token:result.token};await this.trust.save(this.session);
   if(generation!==this.generation)return;this.update({status:'connecting',error:undefined,pairingSuccess:'launcher'});void this.poll();
  }catch(error){if(generation===this.generation)this.update({status:'pairing',error:this.code(error)});}
 }
 private async rpc(operation:string,payload:Record<string,unknown>,timeout=8000){
  if(!this.transport)throw new RemoteError('disconnected');
  const controller=new AbortController();this.requests.add(controller);const timer=setTimeout(()=>controller.abort(),timeout);
  try{return await this.transport.rpc(operation,payload,operation==='hello'?undefined:this.session?.token||undefined,controller.signal);}
  finally{clearTimeout(timer);this.requests.delete(controller);}
 }
 private async verifyIdentity(){
  if(this.fixture)return;
  const generation=this.generation,session=this.session;
  const result=await this.rpc('hello',{}),id=result.id;if(generation!==this.generation||session!==this.session)return;
  if(typeof id!=='string'||! /^[A-Za-z0-9-]{16,128}$/.test(id))throw new RemoteError('invalid_response');
  if(this.session?.id&&this.session.id!==id)throw new RemoteError('device_changed');
  if(this.session)this.session={...this.session,id};
 }
 private async poll(){
  if(this.polling||!this.active||!this.session?.token)return;
  this.polling=true;const generation=this.generation;
  try{
   await this.verifyIdentity();if(generation!==this.generation)return;
   const device=parseState(await this.rpc('state',{}));if(this.session?.id&&device.id!==this.session.id)throw new RemoteError('device_changed');if(generation!==this.generation)return;
   this.attempts=0;this.update({status:'connected',device,lastReceived:Date.now(),error:undefined});if(!this.fixture&&this.session&&this.session.name!==device.name){this.session={...this.session,name:device.name};await this.trust.save(this.session);}
   if(!this.snapshot.catalog){const catalog=parseCatalog(await this.rpc('catalog',{}));if(generation!==this.generation)return;this.update({catalog});}
   const artworkId=device.music.artworkId;
   if(device.music.active&&artworkId){
    if(this.lastArt!==artworkId){const art=await this.rpc('artwork',{id:artworkId}).catch(()=>({} as Record<string,unknown>));if(generation!==this.generation)return;const image=safeImage(art.image);if(image&&art.id===artworkId){this.lastArt=artworkId;this.update({artwork:image});}}
   }else if(this.snapshot.artwork){this.lastArt=undefined;this.update({artwork:undefined});}
   this.schedule(device.music.active&&device.music.source==='airplay'?500:2000);
  }catch(error){if(generation!==this.generation||!this.active)return;const code=this.code(error);if(code==='auth_required'||code==='device_changed'){this.update({status:'auth_required',error:code});}else{this.update({status:'reconnecting',error:code});this.schedule(retryDelay(this.attempts++));}}
  finally{if(generation===this.generation)this.polling=false;}
 }
 private lastArt?:string;
 private schedule(delay:number){clearTimeout(this.timer);if(this.active)this.timer=setTimeout(()=>{void this.poll();},delay);}
 refresh(){if(this.session?.token&&this.active){clearTimeout(this.timer);void this.poll();}}
 async refreshCatalog(){const generation=this.generation;try{const catalog=parseCatalog(await this.rpc('catalog',{}));if(generation!==this.generation)return;const icons={...this.snapshot.icons};for(const target of [...catalog.apps,...catalog.inputs]){const old=[...(this.snapshot.catalog?.apps??[]),...(this.snapshot.catalog?.inputs??[])].find(item=>item.id===target.id);if(old&&(old.profile!==target.profile||old.name!==target.name))delete icons[target.id];}this.update({catalog,icons});}catch(error){if(generation===this.generation)this.update({error:this.code(error)});}}

 async action(operation:'key'|'launch'|'media',payload:Record<string,unknown>){
  if(this.snapshot.status!=='connected'){this.update({error:'not_connected'});return;}
  const generation=this.generation;
  try{await this.rpc(operation,payload,18000);if(generation===this.generation)this.refresh();}
  catch(error){if(generation!==this.generation)return;const code=this.code(error);this.update({error:code});if(code==='auth_required')this.update({status:'auth_required'});else if(['connection_failed','AbortError','timeout'].includes(code)){this.update({status:'reconnecting'});this.schedule(retryDelay(this.attempts++));}else this.refresh();}
 }
 key(command:RemoteKey){return this.action('key',{command});}
 launch(id:string){return this.action('launch',{id});}
 media(action:MediaAction,value?:number){return this.action('media',{source:this.snapshot.device?.music.source,action,...(value===undefined?{}:{value})});}
 async systemPair(pin?:string){
  if(this.snapshot.systemBusy)return;
  const generation=this.generation;this.update({systemBusy:true});
  try{if(pin!==undefined&&!/^[A-Fa-f0-9]{6}$/.test(pin))throw new RemoteError('invalid_pin');const result=await this.rpc(pin===undefined?'system_pair_begin':'system_pair_finish',pin===undefined?{}:{pin},35000);if(pin!==undefined&&result.ready!==true&&result.paired!==true)throw new RemoteError('system_pairing_required');if(generation===this.generation){this.update({systemPairing:pin===undefined,error:undefined,pairingSuccess:pin===undefined?undefined:'system'});this.refresh();}}
  catch(error){if(generation===this.generation)this.update({error:this.code(error)});}
  finally{if(generation===this.generation)this.update({systemBusy:false});}
 }
 dismissPairingSuccess(){this.update({pairingSuccess:undefined});}
 private iconQueue:string[]=[];
 private iconsLoading=new Set<string>();
 private iconWorkers=0;
 icon(id:string){if(this.snapshot.icons[id]||this.iconsLoading.has(id)||this.snapshot.status!=='connected')return;this.iconsLoading.add(id);this.iconQueue.push(id);this.pumpIcons();}
 private pumpIcons(){while(this.active&&this.transport&&this.snapshot.status==='connected'&&this.iconWorkers<2&&this.iconQueue.length){const id=this.iconQueue.shift()!,generation=this.generation;this.iconWorkers++;void this.rpc('icon',{id}).then(result=>{const image=safeImage(result.image);if(image&&generation===this.generation)this.update({icons:{...this.snapshot.icons,[id]:image}});}).catch(()=>{}).finally(()=>{this.iconWorkers--;this.iconsLoading.delete(id);this.pumpIcons();});}}
 setActive(active:boolean){if(this.active===active)return;this.active=active;if(!active){clearTimeout(this.timer);for(const controller of this.requests)controller.abort();this.requests.clear();this.polling=false;this.generation++;if(this.session?.token)void this.rpc('presence',{disconnect:true},1500).catch(()=>{});}else if(this.session?.token){this.update({status:'connecting'});this.refresh();}}
 async disconnect(forget=false){
  const session=this.session,transport=this.transport;this.cancel();const generation=this.generation;this.active=false;this.transport=undefined;this.session=undefined;
  this.update({status:'disconnected',device:undefined,catalog:undefined,artwork:undefined,icons:{},error:undefined,systemPairing:false,systemBusy:false,pairingSuccess:undefined});
  if(forget&&session&&!this.fixture){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),1500);
   try{await transport?.rpc('revoke',{},session.token,controller.signal);}catch{/* Local forgetting remains possible while a TV is offline. */}finally{clearTimeout(timer);}
   try{await this.trust.forget(session.address);}catch{if(generation===this.generation)this.update({error:'storage_failed'});}
  }
  transport?.close?.();
 }
 private code(error:unknown){return error instanceof RemoteError?error.code:error instanceof Error&&error.name==='AbortError'?'timeout':'connection_failed';}
}
