// SPDX-License-Identifier: AGPL-3.0-only
import {NativeModules,NativeEventEmitter,Platform} from 'react-native';
import type {NativeSnapshot} from '../../launcher/types';
interface TVModule {execute(operation:string,payload:string):Promise<string>;pairedRequest(operation:string,payload:string):Promise<string>;ready():void;addListener(name:string):void;removeListeners(count:number):void;}
const module=NativeModules.AureaTV as TVModule|undefined;
export const nativeTVAvailable=Platform.OS==='android'&&!!module;
export interface TVEvent {type:string;payload:Record<string,unknown>;}
export const tvEvents=nativeTVAvailable?new NativeEventEmitter(module!):undefined;
function decode(value:string):Record<string,unknown>{if(value.length>3000000)throw new Error('invalid_native_response');const result:unknown=JSON.parse(value);if(!result||typeof result!=='object'||Array.isArray(result))throw new Error('invalid_native_response');return result as Record<string,unknown>;}
export const tv={
 async execute(operation:string,payload:Record<string,unknown>={}){if(!module)throw new Error('native_bridge_unavailable');return decode(await module.execute(operation,JSON.stringify(payload)));},
 async pairedRequest(operation:string,payload:Record<string,unknown>={}){if(!module)throw new Error('native_bridge_unavailable');return decode(await module.pairedRequest(operation,JSON.stringify(payload)));},
 ready(){module?.ready();},
 subscribe(listener:(event:TVEvent)=>void){const subscription=tvEvents?.addListener('AureaTVEvent',(...args:readonly Object[])=>{const encoded=args[0];if(typeof encoded!=='string')return;try{const value=decode(encoded);if(typeof value.type==='string'&&value.payload&&typeof value.payload==='object')listener(value as unknown as TVEvent);}catch{/* malformed events cannot mutate launcher state */}});return()=>subscription?.remove();},
};
export function nativeSnapshot(value:Record<string,unknown>):NativeSnapshot{
 if(value.schema!==1||!Array.isArray(value.catalog)||value.catalog.length>330)throw new Error('invalid_native_response');
 for(const entry of value.catalog)if(!entry||typeof entry.id!=='string'||entry.id.length>512||typeof entry.name!=='string'||!['app','hdmi','live','library','inputs','airplay','settings'].includes(entry.kind))throw new Error('invalid_native_response');
 const prefs=value.preferences as NativeSnapshot['preferences']|undefined;
 if(!prefs||!Array.isArray(prefs.dock)||prefs.dock.length!==6||new Set(prefs.dock).size!==6||prefs.dock.some((id,index)=>typeof id!=='string'||index<5&&id==='all')||!['en','it'].includes(prefs.language)||typeof prefs.glass!=='boolean'||typeof prefs.motion!=='boolean')throw new Error('invalid_native_response');
 if(!value.music||!value.network||!value.paired||!value.build)throw new Error('invalid_native_response');return value as unknown as NativeSnapshot;
}
