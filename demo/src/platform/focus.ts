// SPDX-License-Identifier: AGPL-3.0-only
import {Platform} from 'react-native';
/** Scroll the nearest content viewport without moving the launcher canvas. */
export function revealFocus(element:HTMLElement){
 if(Platform.OS!=='web')return;
 let parent=element.parentElement;
 while(parent){
  if(['auto','scroll'].includes(getComputedStyle(parent).overflowY)){
   const item=element.getBoundingClientRect(),viewport=parent.getBoundingClientRect();
   if(item.bottom>viewport.bottom-18)parent.scrollTop+=item.bottom-viewport.bottom+18;
   else if(item.top<viewport.top+18)parent.scrollTop+=item.top-viewport.top-18;
   break;
  }
  parent=parent.parentElement;
 }
}
