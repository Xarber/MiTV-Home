// SPDX-License-Identifier: AGPL-3.0-only
import {useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {MusicActivityClock} from '../model/musicActivity';
export function useMusicActivity(active:boolean,playing:boolean,serverVisible?:boolean){
 const clock=useRef(new MusicActivityClock()),[visible,setVisible]=useState(active);
 useEffect(()=>{const update=()=>setVisible(clock.current.update(active,playing,Date.now()));update();const timer=setInterval(update,1000),subscription=AppState.addEventListener('change',update);return()=>{clearInterval(timer);subscription.remove();};},[active,playing]);
 return active&&serverVisible!==false&&(playing||visible);
}
