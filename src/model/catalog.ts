// SPDX-License-Identifier: AGPL-3.0-only
export type IconName = 'playpause'|'menu'|'code'|'info'|'back'|'inputs'|'apps'|'music'|'film'|'play'|'airplay'|'settings'|'tv'|'game'|'apple'|'remote'|'wifi'|'sun'|'volume'|'chevron'|'pause'|'next'|'previous'|'close'|'home'|'check'|'wallpaper';
export interface AppEntry { id:string; name:string; icon:IconName; color:string; category:'apps'|'system'|'casting'|'inputs'; mark?:string; subtitle?:string; kind?:string;profile?:string;brands?:string[];port?:number; }
export const catalog:AppEntry[] = [
 {id:'inputs',name:'Inputs',icon:'inputs',color:'#555a75',category:'system'},
 {id:'cinema',name:'Cinema',icon:'film',color:'#ba422f',category:'apps',mark:'cinema'},
 {id:'music',name:'Music',icon:'music',color:'#c74a69',category:'apps'},
 {id:'video',name:'Videos',icon:'play',color:'#cf2c35',category:'apps'},
 {id:'airplay',name:'AirPlay',icon:'airplay',color:'#60718c',category:'casting'},
 {id:'all',name:'All apps',icon:'apps',color:'#656480',category:'system'},
 {id:'hdmi1',name:'HDMI 1',icon:'game',color:'#70856b',category:'inputs',subtitle:'Switch · Wii U'},
 {id:'hdmi2',name:'HDMI 2',icon:'apple',color:'#596377',category:'inputs',subtitle:'Apple TV'},
 {id:'hdmi3',name:'HDMI 3',icon:'game',color:'#686fa0',category:'inputs',subtitle:'Xbox · PlayStation'},
 {id:'live',name:'Live TV',icon:'tv',color:'#716c94',category:'inputs'},
 {id:'settings',name:'TV settings',icon:'settings',color:'#637281',category:'system'},
 {id:'games',name:'Arcade',icon:'game',color:'#6e778e',category:'apps'},
 {id:'photos',name:'Wallpapers',icon:'wallpaper',color:'#a57c58',category:'apps'},
 {id:'remote',name:'Remote',icon:'remote',color:'#596a78',category:'system'},
];
export const defaultDock=['inputs','cinema','music','video','airplay','all'];
export const entry=(id:string)=>catalog.find(item=>item.id===id)??catalog[0]!;
export const tracks=[
 {title:'Between the tides',artist:'Aurea Sessions',album:'Slow mornings',duration:216,colors:['#f1ba8b','#ad6f98'] as const},
 {title:'A quieter place',artist:'Aurea Sessions',album:'After hours',duration:184,colors:['#82bdba','#697bc8'] as const},
 {title:'Golden hour',artist:'Aurea Sessions',album:'Soft focus',duration:243,colors:['#e8bb74','#cd7d59'] as const},
];
export const wallpapers=[
 {id:'classic',name:'Classic',detail:'Deep blue and violet light.',colors:['#0b1645','#444bc4','#152965'] as const},
 {id:'silk',name:'Silk',detail:'Soft light. Quiet depth.',colors:['#111b2c','#778ba1','#23344e'] as const},
 {id:'dune',name:'Dune',detail:'A warmer kind of calm.',colors:['#2c2022','#b09278','#483e48'] as const},
 {id:'tide',name:'Tide',detail:'A little room to breathe.',colors:['#0b222b','#668d91','#183d47'] as const},
 {id:'ink',name:'Ink',detail:'Nothing extra.',colors:['#080a10','#30333e','#10131c'] as const},
 {id:'aurora',name:'Aurora',detail:'Light, slowly unfolding.',colors:['#151426','#6b739f','#29334e'] as const},
];
export type WallpaperId=typeof wallpapers[number]['id'];
export function pin(dock:string[],id:string,slot:number):string[]{
 if(slot<0||slot>5||id==='all'&&slot!==5)return dock;
 const next=[...dock];const previous=next.indexOf(id);
 if(previous>=0&&previous!==slot){const displaced=next[slot]!;next[slot]=id;next[previous]=displaced==='all'&&previous!==5?(catalog.find(a=>a.id!=='all'&&!next.includes(a.id))?.id??defaultDock[previous]!):displaced;}else next[slot]=id;
 return next;
}
export function remove(dock:string[],id:string):string[]{const index=dock.indexOf(id);if(index<0)return dock;const next=[...dock];next[index]=index===5?'all':(!next.includes(defaultDock[index]!)?defaultDock[index]!:catalog.find(a=>a.id!=='all'&&!next.includes(a.id))!.id);return next;}
export function timeLabel(seconds:number){return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
