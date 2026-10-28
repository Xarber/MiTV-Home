// SPDX-License-Identifier: AGPL-3.0-only
import type {Demo} from '../hooks/useDemo';
import type {AppEntry} from '../model/catalog';
import type {RemoteMusic} from '../remote/types';
export interface NativeSnapshot {
 schema:1;releasePending?:boolean;catalog:(AppEntry&{kind:string;port?:number;profile?:string;brands?:string[];connected?:boolean})[];
 preferences:Demo['prefs'];music:RemoteMusic;volume:number;remoteConnected:boolean;
 network:{connected:boolean;transport:'wifi'|'ethernet'|'none';title?:string;observedAt?:number};
 paired:{paired:boolean;name:string;pending:boolean;remaining:number;busy:boolean;storageError:boolean;input:string};
 updates:Record<string,unknown>;build:{version:string;code:number;commit:string;channel:string};
}
export type Launcher=Demo&{
 native:boolean;ready:boolean;error?:string;catalog:AppEntry[];entry:(id:string)=>AppEntry;
 snapshot?:NativeSnapshot;artwork?:string;refresh:()=>void;
 execute:(operation:string,payload?:Record<string,unknown>)=>Promise<Record<string,unknown>>;
 pairedRequest:(operation:string,payload?:Record<string,unknown>)=>Promise<Record<string,unknown>>;
};
