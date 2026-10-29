// SPDX-License-Identifier: AGPL-3.0-only
import {usePanelNavigation} from './usePanelNavigation';
import {useState,useEffect,useCallback} from 'react';
import {readPreferences,savePreferences,defaults,Preferences} from '../platform/preferences';
import {tracks,pin,remove} from '../model/catalog';
export function useDemo(){
 const [prefs,setPrefs]=useState(readPreferences);const [page,setPage]=useState(0);const [selected,setSelected]=useState('inputs');const {panel,setPanel,back,close,canGoBack}=usePanelNavigation();
 const [playing,setPlaying]=useState(false);const [music,setMusic]=useState(false);const [track,setTrack]=useState(0);const [position,setPosition]=useState(0);const [volume,setVolume]=useState(58);const [remote,setRemote]=useState(false);const [notice,setNotice]=useState('');const [filter,setFilter]=useState('all');
 useEffect(()=>savePreferences(prefs),[prefs]);
 useEffect(()=>{if(!playing)return;const timer=setInterval(()=>setPosition(p=>p+1),1000);return()=>clearInterval(timer);},[playing]);
 useEffect(()=>{if(position>=tracks[track]!.duration){setTrack(t=>(t+1)%tracks.length);setPosition(0);}},[position,track]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),2800);return()=>clearTimeout(timer);},[notice]);
 const change=useCallback((value:Partial<Preferences>)=>setPrefs(p=>({...p,...value})),[]);
 const start=useCallback(()=>{setMusic(true);setPlaying(true);},[]);
 const toggle=useCallback(()=>{setMusic(true);setPlaying(p=>!p);},[]);
 const next=useCallback((delta=1)=>{setTrack(t=>(t+delta+tracks.length)%tracks.length);setPosition(0);},[]);

 return {prefs,change,page,setPage,selected,setSelected,panel,setPanel,playing,music,track,position,setPosition,volume,setVolume,remote,setRemote,notice,setNotice,filter,setFilter,start,toggle,next,close,back,canGoBack,
 pin:(id:string,slot:number)=>setPrefs(p=>({...p,dock:pin(p.dock,id,slot)})),remove:(id:string)=>setPrefs(p=>({...p,dock:remove(p.dock,id)})),reset:()=>{setPrefs({...defaults,dock:[...defaults.dock]});setPage(0);setPanel(null);setSelected('inputs');setPlaying(false);setMusic(false);setRemote(false);setPosition(0);setTrack(0);setVolume(58);}};
}
export type Demo=ReturnType<typeof useDemo>;
