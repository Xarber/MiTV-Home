// SPDX-License-Identifier: AGPL-3.0-only
import {useEffect,useState,useRef,useSyncExternalStore} from 'react';
import {AppState,Platform} from 'react-native';
import {RemoteClient} from './client';
import {LocalTransport} from './transport';
import {PreviewTransport} from './preview';
import {loadTVs,saveTV,forgetTV,PairedTV} from './credentials';
import {localAddress} from './validation';
export function useRemote(initialPreview:boolean){
 const [tvs,setTVs]=useState<PairedTV[]>([]);const [address,setAddress]=useState('');const [preview,setPreview]=useState(initialPreview);const [storageError,setStorageError]=useState(false);
 const [client]=useState(()=>new RemoteClient({save:async value=>{await saveTV(value);setTVs(await loadTVs());},forget:async target=>{await forgetTV(target);setTVs(await loadTVs());}}));
 const state=useSyncExternalStore(client.subscribe,()=>client.snapshot,()=>client.snapshot);
 const chosen=useRef(false);
 useEffect(()=>{
  let mounted=true;
  if(initialPreview){chosen.current=true;client.connect(new PreviewTransport(),{address:'preview',token:'preview'},true);}
  void loadTVs().then(saved=>{if(!mounted)return;setTVs(saved);if(chosen.current)return;const sameOrigin=Platform.OS==='web'&&document.querySelector('meta[name="aurea-remote"]')?location.origin:undefined;const qr=sameOrigin?/^#pair=(\d{6})$/.exec(location.hash)?.[1]:undefined;if(qr)history.replaceState(null,'',location.pathname+location.search);const selected=sameOrigin?saved.find(tv=>tv.address===sameOrigin):saved[0];if(selected){setAddress(selected.address);client.connect(new LocalTransport(selected.address),selected);}else if(sameOrigin){setAddress(sameOrigin);{chosen.current=true;void client.beginPair(new LocalTransport(sameOrigin),sameOrigin).then(()=>{if(qr&&client.snapshot.status==='pairing')return client.pair(qr);});}}}).catch(()=>{if(mounted)setStorageError(true);});
  return()=>{mounted=false;void client.disconnect();};
 },[client,initialPreview]);
 useEffect(()=>{const subscription=AppState.addEventListener('change',next=>client.setActive(next==='active'));return()=>subscription.remove();},[client]);
 const [formError,setFormError]=useState<string>();
 const changePreview=(value:boolean)=>{chosen.current=true;setPreview(value);if(value)client.connect(new PreviewTransport(),{address:'preview',token:'preview'},true);else{void client.disconnect();setAddress('');}};
 const connect=async()=>{chosen.current=true;setFormError(undefined);try{const target=localAddress(address);setAddress(target);const existing=tvs.find(tv=>tv.address===target);if(existing)client.connect(new LocalTransport(target),existing);else await client.beginPair(new LocalTransport(target),target);}catch{setFormError('Enter the TV’s local IP address.');}};
 const select=(tv:PairedTV)=>{chosen.current=true;setAddress(tv.address);setPreview(false);client.connect(new LocalTransport(tv.address),tv);};
 return {client,state,tvs,address,setAddress,preview,setPreview:changePreview,storageError,formError,connect,select};
}
