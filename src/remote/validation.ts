// SPDX-License-Identifier: AGPL-3.0-only
import type {RemoteCatalog,RemoteMusic,RemoteState,RemoteTarget} from './types';
export class RemoteError extends Error {readonly code:string;constructor(code:string){super(code);this.code=code;}}
export function localAddress(raw:string):string{
 let url:URL;try{url=new URL(raw.includes('://')?raw:`http://${raw}`);}catch{throw new RemoteError('invalid_address');}
 if(url.username||url.password||!['http:','https:'].includes(url.protocol))throw new RemoteError('invalid_address');
 const pieces=url.hostname.split('.');const values=pieces.map(Number);
 const ipv4=pieces.length===4&&pieces.every((value,index)=>/^\d{1,3}$/.test(value)&&values[index]!<=255);
 const local=ipv4&&(values[0]===10||values[0]===192&&values[1]===168||values[0]===172&&values[1]!>=16&&values[1]!<=31||values[0]===169&&values[1]===254||values[0]===127);
 if(!local)throw new RemoteError('local_network_only');
 if(url.port&&(!/^\d+$/.test(url.port)||Number(url.port)<1||Number(url.port)>65535))throw new RemoteError('invalid_address');
 return url.origin;
}
const text=(value:unknown,max:number)=>typeof value==='string'&&value.length<=max;
const finite=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
export function parseState(raw:Record<string,unknown>):RemoteState{
 if(raw.schema!==1||!text(raw.name,256)||!finite(raw.observedAt)||typeof raw.homeActive!=='boolean')throw new RemoteError('invalid_response');
 const wallpaper=raw.wallpaper as Record<string,unknown>|undefined;if(wallpaper&&text(wallpaper.id,64))raw.wallpaper={id:wallpaper.id,motion:wallpaper.motion===true,musicTint:wallpaper.musicTint===true};else delete raw.wallpaper;
 const system=raw.systemRemote as Record<string,unknown>|undefined,music=raw.music as Record<string,unknown>|undefined;
 if(!system||typeof system.paired!=='boolean'||!text(system.status,64)||!music||typeof music.active!=='boolean')throw new RemoteError('invalid_response');
 if(system.backend!==undefined&&!['android-tls','python-tls'].includes(String(system.backend)))delete system.backend;
 if(music.activityVisible!==undefined&&typeof music.activityVisible!=='boolean')delete music.activityVisible;
 if(music.colors!==undefined&&(!Array.isArray(music.colors)||music.colors.length!==2||!music.colors.every(value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value))))delete music.colors;
 if(music.bands!==undefined&&(!Array.isArray(music.bands)||music.bands.length!==6||!music.bands.every(value=>finite(value)&&Number(value)<=1)))delete music.bands;
 if(music.active){
  if(!['airplay','paired-apple-tv',...(raw.provenance==='simulated'?['demo']:[])].includes(String(music.source)))throw new RemoteError('invalid_response');
  for(const key of ['title','artist','album'])if(music[key]!==undefined&&!text(music[key],512))throw new RemoteError('invalid_response');
  for(const key of ['positionMs','durationMs','volume','observedAt'])if(music[key]!==undefined&&!finite(music[key]))throw new RemoteError('invalid_response');
  if(typeof music.volume==='number'&&music.volume>100)throw new RemoteError('invalid_response');
  if(music.artworkId!==undefined&&!text(music.artworkId,128))throw new RemoteError('invalid_response');
 }
 return raw as unknown as RemoteState;
}
export function parseCatalog(raw:Record<string,unknown>):RemoteCatalog{
 const parse=(value:unknown,max:number):RemoteTarget[]=>{
  if(!Array.isArray(value)||value.length>max)throw new RemoteError('invalid_response');
  return value.map(item=>{if(!item||!text(item.id,512)||!text(item.name,100)||!['app','input','live'].includes(item.kind))throw new RemoteError('invalid_response');if(item.profile!==undefined&&!text(item.profile,64))throw new RemoteError('invalid_response');if(item.subtitle!==undefined&&!text(item.subtitle,128))throw new RemoteError('invalid_response');return item as RemoteTarget;});
 };
 return {apps:parse(raw.apps,256),inputs:parse(raw.inputs,65)};
}
export function safeImage(raw:unknown):string|undefined{return typeof raw==='string'&&raw.length<180000&&/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(raw)?raw:undefined;}
export function retryDelay(attempt:number,random=Math.random()):number{return Math.round(Math.min(30000,500*2**Math.min(attempt,6))*(.9+.2*Math.max(0,Math.min(1,random))));}
