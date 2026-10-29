// SPDX-License-Identifier: AGPL-3.0-only
import {Platform} from 'react-native';
import type {Transport} from './types';
import {localAddress,RemoteError} from './validation';
const routes:Record<string,string>={system_connect:'/api/system/connect',voice_start:'/api/voice/start',voice_chunk:'/api/voice/chunk',voice_end:'/api/voice/end',revoke:'/api/revoke',hello:'/hello',state:'/api/state',catalog:'/api/catalog',icon:'/api/icon',artwork:'/api/artwork',key:'/api/key',launch:'/api/launch',media:'/api/media',presence:'/api/presence',pair_start:'/pair/start',pair:'/pair',system_pair_begin:'/api/system/pair/start',system_pair_finish:'/api/system/pair/finish'};
export class LocalTransport implements Transport {
 readonly address:string;
 constructor(address:string){this.address=localAddress(address);}
 async rpc(operation:string,payload:Record<string,unknown>,token:string|undefined,signal:AbortSignal){
  const route=routes[operation];if(!route)throw new RemoteError('unsupported');
  if(Platform.OS==='web'&&location.origin!==this.address&&!globalThis.isSecureContext)throw new RemoteError('use_tv_address_or_mobile_app');
  const options:RequestInit&{targetAddressSpace?:string}={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,...(token?{token}:{})}),signal,redirect:'error',credentials:'omit',...(Platform.OS==='web'&&location.origin!==this.address?{targetAddressSpace:new URL(this.address).hostname.startsWith('127.')?'loopback':'local'}:{})};
  const response=await fetch(this.address+route,options);
  if(Number(response.headers.get('Content-Length'))>180000)throw new RemoteError('invalid_response');
  const body=await response.text();if(body.length>180000)throw new RemoteError('invalid_response');
  let result:Record<string,unknown>;try{result=JSON.parse(body);}catch{throw new RemoteError('invalid_response');}
  if(!result||typeof result!=='object'||Array.isArray(result))throw new RemoteError('invalid_response');
  if(response.status===401)throw new RemoteError('auth_required');
  if(!response.ok||result.error){const code=typeof result.error==='string'&&/^[a-z_]{1,64}$/.test(result.error)?result.error:operation==='pair'?'invalid_pin':'connection_failed';throw new RemoteError(code);}
  return result;
 }
}
