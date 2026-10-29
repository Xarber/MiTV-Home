// SPDX-License-Identifier: AGPL-3.0-only
import {useRef} from 'react';
import {Platform,View} from 'react-native';
import type {Anchor} from '../components/AnchoredPanel';
import {nativeFocus} from '../platform/native/focus';
/** Both trigger and popup use coordinates relative to the same root, including tablets. */
export function usePhoneAnchor(){
 const root=useRef<React.ComponentRef<typeof View>>(null);
 const measure=(id:string,done:(anchor:Anchor)=>void,fallback:Anchor)=>{
  if(Platform.OS==='web'){
   const parent=document.getElementById('phone-remote-root')?.getBoundingClientRect(),trigger=document.querySelector<HTMLElement>(`[data-nav="${id}"]`)?.getBoundingClientRect();
   if(parent&&trigger)done({left:trigger.left-parent.left,top:trigger.top-parent.top,width:trigger.width,height:trigger.height});else done(fallback);return;
  }
  nativeFocus.measure(id,()=>{const trigger=nativeFocus.node(id)?.box;if(!trigger||!root.current){done(fallback);return;}root.current.measureInWindow((x,y)=>done({left:trigger.x-x,top:trigger.y-y,width:trigger.width,height:trigger.height}));});
 };
 return {root,measure};
}
