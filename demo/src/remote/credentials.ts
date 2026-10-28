// SPDX-License-Identifier: AGPL-3.0-only
import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';
import type {Session} from './types';
import {localAddress} from './validation';
import {readWebVault,writeWebVault} from './webVault';
export interface PairedTV extends Session {id?:string;name:string;lastUsed:number;}
const key='aurea-remote-tvs-v2',legacy='aurea-remote-trust-v1';
async function read(key:string){return Platform.OS==='web'?readWebVault(key):SecureStore.getItemAsync(key);}
async function write(value:string){if(Platform.OS==='web')await writeWebVault(key,value);else await SecureStore.setItemAsync(key,value,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});}
export async function loadTVs():Promise<PairedTV[]>{
 const encoded=await read(key);
 if(encoded){if(encoded.length>32768)throw new Error('invalid_trust_store');const value=JSON.parse(encoded);if(value.schema!==2||!Array.isArray(value.tvs)||value.tvs.length>16)throw new Error('invalid_trust_store');
  return value.tvs.map((item:PairedTV)=>{if(typeof item.token!=='string'||! /^[A-Za-z0-9_-]{32}$/.test(item.token)||typeof item.name!=='string'||item.name.length>256||!Number.isFinite(item.lastUsed)||(item.id!==undefined&&(typeof item.id!=='string'||item.id.length>128)))throw new Error('invalid_trust_store');return {...item,address:localAddress(item.address)};});
 }
 const old=await read(legacy);if(!old)return[];
 const value=JSON.parse(old);if(typeof value.token!=='string'||! /^[A-Za-z0-9_-]{32}$/.test(value.token))throw new Error('invalid_trust_store');
 const tv={address:localAddress(value.address),token:value.token,name:'Television',lastUsed:0};await write(JSON.stringify({schema:2,tvs:[tv]}));return[tv];
}
async function save(value:Session){const all=await loadTVs();const candidate=value as Partial<PairedTV>;const tv:PairedTV={...value,id:candidate.id,name:candidate.name??all.find(t=>t.address===value.address)?.name??'Television',lastUsed:Date.now()};const next=all.filter(item=>!(tv.id&&item.id===tv.id)&&item.address!==tv.address);next.unshift(tv);await write(JSON.stringify({schema:2,tvs:next.slice(0,16)}));}
async function forget(address?:string){if(!address)return;const all=await loadTVs();await write(JSON.stringify({schema:2,tvs:all.filter(tv=>tv.address!==address)}));}

// Serialize read-modify-write updates; a failed write never replaces the saved list.
let writes:Promise<unknown>=Promise.resolve();
function mutate(action:()=>Promise<void>){const next=writes.catch(()=>{}).then(()=>Platform.OS==='web'&&navigator.locks?navigator.locks.request('aurea-tv-vault',action):action());writes=next;return next;}
export function saveTV(value:Session){return mutate(()=>save(value));}
export function forgetTV(address?:string){return mutate(()=>forget(address));}
