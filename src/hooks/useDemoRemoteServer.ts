// SPDX-License-Identifier: AGPL-3.0-only
import {useEffect,useRef,useState} from 'react';
import {Platform} from 'react-native';
import type {Launcher} from '../launcher/types';
import {tracks} from '../model/catalog';
export interface DemoServerInfo{url:string;connected:boolean;}
/** Browser-owner channel exists only in the explicitly launched local demo server. */
export function useDemoRemoteServer(demo:Launcher,launch:(id:string)=>void){
 const latest=useRef({demo,launch});latest.current={demo,launch};const [server,setServer]=useState<DemoServerInfo>();
 useEffect(()=>{
  if(Platform.OS!=='web'||demo.native)return;const key=document.querySelector<HTMLMetaElement>('meta[name="aurea-demo-owner"]')?.content;if(!key)return;
  const clientId=crypto.randomUUID(),controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined,sequence=0;
  const post=async(path:string,payload:unknown)=>{const response=await fetch('/__demo/'+path,{method:'POST',headers:{'Content-Type':'application/json','x-aurea-demo-owner':key},body:JSON.stringify({...payload as Record<string,unknown>,clientId}),signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error('demo_server_unavailable');return response;};
  const state=async()=>{if(controller.signal.aborted)return;const current=latest.current.demo,song=tracks[current.track]!;
   const catalog={apps:current.catalog.filter(item=>item.category!=='inputs'&&!['all','inputs'].includes(item.id)).map(item=>({id:'app:'+item.id,name:item.name,kind:'app'})),inputs:current.catalog.filter(item=>item.category==='inputs').map(item=>({id:item.id==='live'?'live':'input:'+item.id,name:item.name,kind:item.id==='live'?'live':'input',connected:true}))};
   try{const reply=await(await post('state',{state:{wallpaper:{id:current.prefs.wallpaper,motion:current.prefs.motion,musicTint:current.prefs.musicTint},music:{active:current.music,source:'demo',title:song.title,artist:song.artist,album:song.album,colors:song.colors,playing:current.playing,positionMs:current.position*1000,durationMs:song.duration*1000,volume:current.volume,controls:{play_pause:true,next:true,previous:true,volume:true}}},catalog})).json();setServer(previous=>previous&&previous.url===reply.url&&previous.connected===reply.connected?previous:{url:reply.url,connected:reply.connected});if(current.remote!==reply.connected)current.setRemote(reply.connected);}catch{}finally{if(!controller.signal.aborted)timer=setTimeout(state,600);}
  };
  const receive=(event:Record<string,unknown>)=>{const current=latest.current.demo;
   if(event.type==='pair-request'&&typeof event.pin==='string'&&/^\d{6}$/.test(event.pin))current.setNotice('Pairing code  '+event.pin);
   if(event.type==='paired'){current.setRemote(true);current.setNotice('Remote connected');}
   if(event.type==='launch'&&typeof event.id==='string')latest.current.launch(event.id.replace(/^(app|input):/,''));
   if(event.type==='media'){if(event.action==='play_pause')current.toggle();if(event.action==='next'||event.action==='previous')current.next(event.action==='next'?1:-1);if(event.action==='volume'&&typeof event.value==='number')current.setVolume(event.value);}
   if(event.type==='key'){
    const keys:Record<string,string>={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',ok:'Enter',back:'Escape',menu:'m',control:'c',playpause:' '};const command=String(event.command),key=keys[command];
    if(key){window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true,cancelable:true}));}
    if(command==='home'){current.close();current.setPage(0);current.setSelected(current.prefs.dock[0]!);setTimeout(()=>document.querySelector<HTMLElement>(`[data-nav="dock:${current.prefs.dock[0]}"]`)?.focus(),320);}
    if(command==='volumeup'||command==='volumedown')current.setVolume(value=>Math.max(0,Math.min(100,value+(command==='volumeup'?5:-5))));
    if(command==='next'||command==='previous')current.next(command==='next'?1:-1);
   }
  };
  const events=async()=>{try{const response=await post('events',{}),reader=response.body?.getReader();if(!reader)return;const decoder=new TextDecoder();let pending='';while(!controller.signal.aborted){const result=await reader.read();if(result.done)break;pending+=decoder.decode(result.value,{stream:true});let end;while((end=pending.indexOf('\n'))>=0){const line=pending.slice(0,end);pending=pending.slice(end+1);try{receive(JSON.parse(line));}catch{}}if(pending.length>20000)break;}}catch{}finally{if(!controller.signal.aborted){const token=++sequence;setTimeout(()=>{if(!controller.signal.aborted&&token===sequence)void events();},1500);}}};
  void events();void state();return()=>{controller.abort();clearTimeout(timer);sequence++;};
 },[demo.native]);
 return server;
}
