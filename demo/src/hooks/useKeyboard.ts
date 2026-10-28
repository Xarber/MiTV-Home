// SPDX-License-Identifier: AGPL-3.0-only
import {useEffect,useRef} from 'react';
import {Platform} from 'react-native';
import {neighbor,Direction} from '../model/navigation';

export function focusId(id:string){
 if(Platform.OS!=='web')return;
 const element=document.querySelector<HTMLElement>(`[data-nav="${id}"]`);
 if(!element)return;
 element.focus({preventScroll:true});
 // Scroll only the nearest scroll view; never move the three-stage canvas.
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
interface Options {
 panel:string|null;close:()=>void;control:()=>void;page:number;
 changePage:(page:number)=>void;menu:(id:string)=>void;play:()=>void;
}
export function useKeyboard({panel,close,control,page,changePage,menu,play}:Options){
 // Survives a popup opening between keydown and keyup. The release must never
 // activate the popup's newly focused Close button after a held Enter.
 const press=useRef<{target?:HTMLElement;timer?:ReturnType<typeof setTimeout>;held:boolean}>({held:false});
 useEffect(()=>{
  if(Platform.OS!=='web')return;
  const down=(event:KeyboardEvent)=>{
   const target=event.target as HTMLElement;
   if(event.metaKey||event.ctrlKey||event.altKey||['INPUT','TEXTAREA','SELECT'].includes(target.tagName))return;
   const active=document.activeElement as HTMLElement|null;
   if(event.key==='Enter'){
    event.preventDefault();event.stopPropagation();
    if(event.repeat)return;
    press.current.target=active??undefined;press.current.held=false;
    if(!panel)press.current.timer=setTimeout(()=>{
     const id=press.current.target?.dataset.nav?.split(':').pop();
     if(id){press.current.held=true;menu(id);}
    },550);
    return;
   }
   if(event.key==='Escape'||event.key==='Backspace'){
    event.preventDefault();event.stopPropagation();
    if(panel)close();else if(page>0)changePage(0);else control();return;
   }
   if(event.key.toLowerCase()==='c'){event.preventDefault();control();return;}
   if(event.key===' '){event.preventDefault();event.stopPropagation();play();return;}
   if(event.key==='ContextMenu'||event.key==='m'){
    const id=active?.dataset.nav?.split(':').pop();
    if(id&&!panel){event.preventDefault();menu(id);}return;
   }
   if(!event.key.startsWith('Arrow')&&event.key!=='Tab')return;
   const blocking=panel!==null&&panel!=='music';
   const group=blocking?'modal':`page-${page}`;
   const elements=[...document.querySelectorAll<HTMLElement>(`[data-group="${group}"]`)];
   if(!blocking){elements.unshift(...document.querySelectorAll<HTMLElement>('[data-group="header"]'));if(panel==='music')elements.unshift(...document.querySelectorAll<HTMLElement>('[data-group="modal"]'));}
   const usable=elements.filter(element=>element.getBoundingClientRect().width>0);
   event.preventDefault();event.stopPropagation();
   if(event.key==='Tab'){
    const index=usable.indexOf(active!);
    const next=usable[(index+(event.shiftKey?-1:1)+usable.length)%usable.length];
    if(next)focusId(next.dataset.nav!);return;
   }
   const items=usable.map(element=>{
    const rect=element.getBoundingClientRect();
    return {id:element.dataset.nav!,x:rect.x,y:rect.y,width:rect.width,height:rect.height};
   });
   const next=neighbor(items,active?.dataset.nav??'',event.key as Direction);
   if(!next&&!panel&&event.key==='ArrowDown'&&page<2){changePage(page+1);return;}
   if(!next&&!panel&&event.key==='ArrowUp'&&page>0){changePage(page-1);return;}
   if(next)focusId(next);
  };
  const up=(event:KeyboardEvent)=>{
   if(event.key!=='Enter'||!press.current.target)return;
   event.preventDefault();event.stopPropagation();clearTimeout(press.current.timer);
   if(!press.current.held&&press.current.target.isConnected)press.current.target.click();
   press.current.target=undefined;press.current.held=false;
  };
  window.addEventListener('keydown',down,true);window.addEventListener('keyup',up,true);
  return()=>{clearTimeout(press.current.timer);window.removeEventListener('keydown',down,true);window.removeEventListener('keyup',up,true);};
 },[panel,close,control,page,changePage,menu,play]);
}
