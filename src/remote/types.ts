// SPDX-License-Identifier: AGPL-3.0-only
export type RemoteKey='menu'|'control'|'up'|'down'|'left'|'right'|'ok'|'back'|'home'|'volumeup'|'volumedown'|'playpause'|'next'|'previous';
export type MediaAction='play_pause'|'next'|'previous'|'volume';
export interface RemoteTarget {id:string;name:string;kind:'app'|'input'|'live';system?:boolean;connected?:boolean;subtitle?:string;profile?:string;brands?:string[];port?:number;}
export interface RemoteMusic {active:boolean;bands?:number[];colors?:[string,string];source?:'airplay'|'paired-apple-tv'|'demo';title?:string;artist?:string;album?:string;playing?:boolean;positionMs?:number;durationMs?:number;volume?:number;artworkId?:string;observedAt?:number;controls?:Partial<Record<MediaAction,boolean>>;}
export interface RemoteState {schema:1;provenance?:'simulated'|'measured';id?:string;name:string;observedAt:number;homeActive:boolean;wallpaper?:{id:string;motion:boolean;musicTint?:boolean};systemRemote:{status:string;paired:boolean;ready?:boolean};music:RemoteMusic;}
export interface RemoteCatalog {apps:RemoteTarget[];inputs:RemoteTarget[];}
export type ConnectionStatus='disconnected'|'connecting'|'pairing'|'connected'|'reconnecting'|'auth_required';
export interface Session {address:string;token:string;id?:string;name?:string;}
export interface RemoteSnapshot {status:ConnectionStatus;device?:RemoteState;catalog?:RemoteCatalog;artwork?:string;icons:Record<string,string>;error?:string;lastReceived?:number;systemPairing:boolean;systemBusy?:boolean;pairingSuccess?:'launcher'|'system';}
export interface Transport {rpc(operation:string,payload:Record<string,unknown>,token:string|undefined,signal:AbortSignal):Promise<Record<string,unknown>>;close?():void;}
export const commands:readonly RemoteKey[]=['menu','control','up','down','left','right','ok','back','home','volumeup','volumedown','playpause','next','previous'];
