// SPDX-License-Identifier: AGPL-3.0-only
/** Persistent non-extractable browser key; only encrypted credential records reach IndexedDB. */
const database='aurea-remote-private-v1';
async function open():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open(database,1);request.onupgradeneeded=()=>request.result.createObjectStore('vault');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('storage_unavailable'));});}
async function get(db:IDBDatabase,key:string):Promise<unknown>{return new Promise((resolve,reject)=>{const tx=db.transaction('vault');const request=tx.objectStore('vault').get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('storage_unavailable'));});}
async function put(db:IDBDatabase,key:string,value:unknown){return new Promise<void>((resolve,reject)=>{const tx=db.transaction('vault','readwrite');tx.objectStore('vault').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(new Error('storage_unavailable'));tx.onabort=()=>reject(new Error('storage_unavailable'));});}
export async function readWebVault(key:string):Promise<string|null>{
 if(!globalThis.isSecureContext||!globalThis.crypto?.subtle)return sessionStorage.getItem(key);
 const db=await open();try{const record=await get(db,key) as {iv:Uint8Array;data:ArrayBuffer}|undefined;if(!record)return sessionStorage.getItem(key);const secret=await get(db,'key') as CryptoKey|undefined;if(!secret)throw new Error('storage_unavailable');return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv as Uint8Array<ArrayBuffer>},secret,record.data));}finally{db.close();}
}
export async function writeWebVault(key:string,value:string){
 if(!globalThis.isSecureContext||!globalThis.crypto?.subtle){sessionStorage.setItem(key,value);return;}
 const db=await open();try{let secret=await get(db,'key') as CryptoKey|undefined;if(!secret){secret=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);secret=await new Promise<CryptoKey>((resolve,reject)=>{const tx=db.transaction('vault','readwrite'),store=tx.objectStore('vault'),request=store.get('key');let selected=secret!;request.onsuccess=()=>{if(request.result)selected=request.result;else store.put(selected,'key');};tx.oncomplete=()=>resolve(selected);tx.onerror=()=>reject(new Error('storage_unavailable'));});}const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},secret,new TextEncoder().encode(value));await put(db,key,{iv,data});sessionStorage.removeItem(key);}finally{db.close();}
}
