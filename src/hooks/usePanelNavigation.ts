// SPDX-License-Identifier: AGPL-3.0-only
import {useCallback,useState} from 'react';
import type {Dispatch,SetStateAction} from 'react';
/** Back traverses actual visited panels; dismiss always clears the whole stack. */
export function usePanelNavigation(){
 const [stack,setStack]=useState<string[]>([]);
 const setPanel:Dispatch<SetStateAction<string|null>>=useCallback(value=>setStack(previous=>{
  const current=previous.at(-1)??null,next=typeof value==='function'?value(current):value;
  if(next===null)return [];if(next===current)return previous;
  const existing=previous.lastIndexOf(next);return existing>=0?previous.slice(0,existing+1):[...previous,next];
 }),[]);
 const back=useCallback(()=>setStack(previous=>previous.slice(0,-1)),[]);
 const close=useCallback(()=>setStack([]),[]);
 return {panel:stack.at(-1)??null,setPanel,back,close,canGoBack:stack.length>1};
}
