// SPDX-License-Identifier: AGPL-3.0-only
import type {RemoteKey} from './types';
export type RemoteView='auto'|'home'|'full';
export function fullRemote(mode:RemoteView,homeActive?:boolean){return mode==='full'||mode==='auto'&&homeActive===false;}
/** Bounded relative swipes, not absolute pointer injection; never repeats after a failed request. */
export class TouchpadMotion{
 private x=0;private y=0;private moved=false;
 begin(){this.x=0;this.y=0;this.moved=false;}
 move(dx:number,dy:number):RemoteKey|undefined{
  if(!Number.isFinite(dx)||!Number.isFinite(dy))return;
  if(Math.abs(dx)>7||Math.abs(dy)>7)this.moved=true;
  const x=dx-this.x,y=dy-this.y;if(Math.max(Math.abs(x),Math.abs(y))<36)return;
  this.x=dx;this.y=dy;this.moved=true;
  return Math.abs(x)>Math.abs(y)?x>0?'right':'left':y>0?'down':'up';
 }
 end(){return this.moved?undefined:'ok' as const;}
}
