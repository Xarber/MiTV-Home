// SPDX-License-Identifier: AGPL-3.0-only
import type {Transport} from './types';
import {catalog,tracks} from '../model/catalog';
import {RemoteError} from './validation';
/** Explicit preview transport. No fetch, credentials or physical device calls. */
export class PreviewTransport implements Transport {
 private track=0;private playing=false;private music=false;private position=0;private changed=Date.now();private volume=58;private home=true;
 async rpc(operation:string,payload:Record<string,unknown>){
  const song=tracks[this.track]!;
  if(operation==='state')return {schema:1,name:'Living room',observedAt:Date.now(),homeActive:this.home,wallpaper:{id:'tide',motion:false,musicTint:false},systemRemote:{status:'ready',paired:true,ready:true},music:{active:this.music,source:'airplay',title:song.title,artist:song.artist,album:song.album,playing:this.playing,positionMs:Math.min(song.duration*1000,this.position+(this.playing?Date.now()-this.changed:0)),durationMs:song.duration*1000,volume:this.volume,observedAt:Date.now(),controls:{play_pause:true,next:true,previous:true,volume:true}}};
  if(operation==='catalog')return {apps:catalog.filter(item=>['apps','casting'].includes(item.category)).map(item=>({id:'app:'+item.id,name:item.name,kind:'app',system:false})),inputs:catalog.filter(item=>item.category==='inputs').map(item=>({id:item.id==='live'?'live':'input:'+item.id,name:item.name,kind:item.id==='live'?'live':'input',connected:true}))};
  if(operation==='launch'){const id=String(payload.id);if(id==='app:music'){this.music=true;this.playing=true;this.changed=Date.now();}this.home=false;return {accepted:true};}
  if(operation==='key'){const command=payload.command;if(command==='home')this.home=true;if(command==='playpause'&&this.music)this.toggle();if(command==='volumeup')this.volume=Math.min(100,this.volume+5);if(command==='volumedown')this.volume=Math.max(0,this.volume-5);return {accepted:true};}
  if(operation==='media'){if(payload.source!=='airplay')throw new RemoteError('source_changed');if(payload.action==='play_pause')this.toggle();if(payload.action==='next'||payload.action==='previous'){this.track=(this.track+(payload.action==='next'?1:tracks.length-1))%tracks.length;this.position=0;this.changed=Date.now();}if(payload.action==='volume')this.volume=Number(payload.value);return {accepted:true};}
  if(operation==='presence')return {ok:true};
  if(operation==='icon'||operation==='artwork')throw new RemoteError('unavailable');
  return {status:'ready'};
 }
 private toggle(){if(this.playing)this.position+=Date.now()-this.changed;this.playing=!this.playing;this.changed=Date.now();}
}
