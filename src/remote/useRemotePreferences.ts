// SPDX-License-Identifier: AGPL-3.0-only
import {useEffect,useRef,useState} from 'react';
import {Platform} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type {RemoteView} from './remoteNavigation';
const key='aurea-remote-layout-v1';
interface Preferences {view:RemoteView;touchpad:boolean;}
export function useRemotePreferences(){
 const [preferences,setPreferences]=useState<Preferences>({view:'auto',touchpad:false});
 const current=useRef(preferences),changed=useRef(false),writes=useRef(Promise.resolve());
 useEffect(()=>{let mounted=true;void(async()=>{try{const raw=Platform.OS==='web'?localStorage.getItem(key):await SecureStore.getItemAsync(key);if(!raw||raw.length>256)return;const value=JSON.parse(raw);if(!['auto','home','full'].includes(value.view)||typeof value.touchpad!=='boolean')return;if(mounted&&!changed.current){current.current=value;setPreferences(value);}}catch{/* Keep safe session defaults if storage is unavailable. */}})();return()=>{mounted=false;};},[]);
 const update=(value:Preferences)=>{changed.current=true;current.current=value;setPreferences(value);writes.current=writes.current.catch(()=>{}).then(async()=>{try{const json=JSON.stringify(value);if(Platform.OS==='web')localStorage.setItem(key,json);else await SecureStore.setItemAsync(key,json);}catch{/* The active choice still works without persistence. */}});};
 return {...preferences,setView:(view:RemoteView)=>update({...current.current,view}),toggleTouchpad:()=>update({...current.current,touchpad:!current.current.touchpad})};
}
