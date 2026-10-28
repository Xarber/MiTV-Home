// SPDX-License-Identifier: AGPL-3.0-only
import {neighbor,type Direction} from '../../model/navigation';
export interface NativeHandle {requestTVFocus?:()=>void;focus?:()=>void;measureInWindow?:(callback:(x:number,y:number,width:number,height:number)=>void)=>void;setNativeProps?:(props:Record<string,unknown>)=>void;}
interface Node {id:string;group:string;target:()=>NativeHandle|null;press:()=>void;hold?:()=>void;box?:{x:number;y:number;width:number;height:number};}
const nodes=new Map<string,Node>(),listeners=new Set<()=>void>(),focusListeners=new Set<(id:string)=>void>();let groups=new Set<string>();let current='';let revision=0;
const publish=()=>{revision++;for(const listener of listeners)listener();};
export const nativeFocus={
 subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},get revision(){return revision;},
 allowed(group:string){return groups.size===0||groups.has(group);},
 scope(next:string[]){if(next.join('|')===[...groups].join('|'))return;groups=new Set(next);publish();},
 register(node:Node){nodes.set(node.id,node);this.measure(node.id);return()=>{if(nodes.get(node.id)===node)nodes.delete(node.id);};},
 measure(id:string){const node=nodes.get(id);node?.target()?.measureInWindow?.((x,y,width,height)=>{if(width>0&&height>0&&nodes.get(id)===node)node.box={x,y,width,height};});},
 focused(id:string){current=id;this.measure(id);for(const listener of focusListeners)listener(id);},
 onFocus(listener:(id:string)=>void){focusListeners.add(listener);return()=>{focusListeners.delete(listener);};},
 measureGroup(group:string){for(const node of nodes.values())if(node.group===group)this.measure(node.id);},
 get current(){return current;},get group(){return nodes.get(current)?.group;},
 node(id:string){return nodes.get(id);},
 focus(id:string){const node=nodes.get(id);if(!node||!this.allowed(node.group))return;current=id;const target=node.target();if(target?.requestTVFocus)target.requestTVFocus();else if(target?.focus)target.focus();else{target?.setNativeProps?.({hasTVPreferredFocus:false});requestAnimationFrame(()=>target?.setNativeProps?.({hasTVPreferredFocus:true}));}this.measure(id);},
 press(id=current){const node=nodes.get(id);if(node&&this.allowed(node.group))node.press();},hold(){nodes.get(current)?.hold?.();},
 move(direction:Direction){const eligible=[...nodes.values()].filter(node=>this.allowed(node.group));const measured=eligible.filter(node=>node.box).map(node=>({id:node.id,...node.box!}));const next=neighbor(measured,current,direction);if(next){this.focus(next);return true;}return false;},
};
