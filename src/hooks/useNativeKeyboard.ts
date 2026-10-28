// SPDX-License-Identifier: AGPL-3.0-only
import {useEffect,useRef} from 'react';
import {BackHandler,Platform} from 'react-native';
import {nativeFocus} from '../platform/native/focus';
import {tv} from '../platform/native/tv';
interface Options {panel:string|null;close:()=>void;control:()=>void;page:number;changePage:(page:number)=>void;menu:(id:string)=>void;play:()=>void;}
export function useNativeKeyboard(options:Options){
 const press=useRef<{timer?:ReturnType<typeof setTimeout>;held:boolean;id?:string}>({held:false});
 useEffect(()=>{
  if(Platform.OS==='web')return;
  const blocking=options.panel!==null&&options.panel!=='music';nativeFocus.scope(blocking?['modal']:['header','page-'+options.page,...(options.panel==='music'?['modal']:[])]);
  const unsubscribe=tv.subscribe(event=>{
   if(event.type==='back'){if(options.panel)options.close();else if(options.page)options.changePage(0);return;}
   if(event.type!=='key')return;const key=event.payload.key,phase=event.payload.phase,repeat=event.payload.repeat;
   if(key==='select'||key==='back'){
    if(phase==='down'&&repeat===0){press.current.held=false;press.current.id=nativeFocus.current;clearTimeout(press.current.timer);press.current.timer=setTimeout(()=>{press.current.held=true;if(key==='back')options.control();else if(!options.panel&&press.current.id)options.menu(press.current.id.split(':').slice(1).join(':'));},550);}
    if(phase==='up'){clearTimeout(press.current.timer);if(press.current.held)return;if(key==='select')nativeFocus.press(press.current.id);else if(options.panel)options.close();else if(options.page)options.changePage(0);}
    return;
   }
   if(phase!=='down')return;
   if(key==='control'){options.control();return;}if(key==='playpause'){options.play();return;}
   const directions={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'} as const;
   if(typeof key!=='string'||!(key in directions))return;
   const moved=nativeFocus.move(directions[key as keyof typeof directions]);
   if(!moved&&!options.panel&&key==='down'&&options.page<2)options.changePage(options.page+1);
   if(!moved&&!options.panel&&key==='up'&&options.page>0)options.changePage(options.page-1);
   if(options.panel==='music'&&nativeFocus.group!=='modal')options.close();
  });
  const back=BackHandler.addEventListener('hardwareBackPress',()=>{if(options.panel)options.close();else if(options.page)options.changePage(0);return true;});
  return()=>{unsubscribe();back.remove();clearTimeout(press.current.timer);};
 },[options.panel,options.page,options.close,options.control,options.changePage,options.menu,options.play]);
}
