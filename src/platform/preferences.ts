// SPDX-License-Identifier: AGPL-3.0-only
import { Platform } from 'react-native';
import { catalog, defaultDock, wallpapers } from '../model/catalog';
export interface Preferences {dock:string[];wallpaper:string;motion:boolean;language:'en'|'it';glass:boolean;blur?:boolean;}
export const defaults:Preferences={dock:defaultDock,wallpaper:'silk',motion:false,language:'en',glass:true,blur:true};
const key='aurea.demo.preferences.v1';
export function readPreferences():Preferences {
 try{if(Platform.OS!=='web')return defaults;const value=JSON.parse(localStorage.getItem(key)??'null');
 if(!value)return defaults;
 const dock=Array.isArray(value.dock)&&value.dock.length===6&&new Set(value.dock).size===6&&value.dock.every((id:unknown,index:number)=>typeof id==='string'&&catalog.some(a=>a.id===id)&&(id!=='all'||index===5))?value.dock:defaultDock;
 return {dock,wallpaper:wallpapers.some(w=>w.id===value.wallpaper)?value.wallpaper:'silk',motion:value.motion===true,language:value.language==='it'?'it':'en',glass:value.glass!==false,blur:value.blur!==false};
 }catch{return defaults;}
}
export function savePreferences(value:Preferences){try{if(Platform.OS==='web')localStorage.setItem(key,JSON.stringify(value));}catch{/* Storage can be disabled; preferences remain session-local. */}}
