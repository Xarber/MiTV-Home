// SPDX-License-Identifier: AGPL-3.0-only
export type Direction='ArrowLeft'|'ArrowRight'|'ArrowUp'|'ArrowDown';
export interface Target {id:string;x:number;y:number;width:number;height:number;}
export function neighbor(items:Target[],current:string,direction:Direction):string|undefined{
 const from=items.find(item=>item.id===current);if(!from)return items[0]?.id;
 const horizontal=direction==='ArrowLeft'||direction==='ArrowRight';const sign=direction==='ArrowLeft'||direction==='ArrowUp'?-1:1;
 const x=from.x+from.width/2,y=from.y+from.height/2;
 return items.filter(item=>item.id!==current).map(item=>{const dx=item.x+item.width/2-x,dy=item.y+item.height/2-y;return {id:item.id,forward:(horizontal?dx:dy)*sign,cross:Math.abs(horizontal?dy:dx)};})
 .filter(item=>item.forward>4&&(!horizontal||item.cross<from.height*.7))
 .sort((a,b)=>(a.forward+a.cross*3)-(b.forward+b.cross*3))[0]?.id;
}
