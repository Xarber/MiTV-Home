// SPDX-License-Identifier: AGPL-3.0-only
import React,{useRef,useState,useCallback,useEffect} from 'react';
import {View,ScrollView,StyleSheet,Platform} from 'react-native';
import {revealFocus} from '../platform/focus';
import {LinearGradient} from 'expo-linear-gradient';
/** Edge hints change only when crossing boundaries, never one React render per frame. */
export function FadedScroll({children}:{children:React.ReactNode}){
 const container=useRef<View>(null);
 const measurements=useRef({height:0,content:0,offset:0});const last=useRef({top:false,bottom:false});const [edges,setEdges]=useState(last.current);
 const update=useCallback(()=>{const {height,content,offset}=measurements.current;const next={top:offset>8,bottom:height>0&&content-offset-height>8};if(next.top!==last.current.top||next.bottom!==last.current.bottom){last.current=next;setEdges(next);}},[]);
 useEffect(()=>{
  if(Platform.OS!=='web'||!container.current)return;
  const node=container.current as unknown as HTMLElement;let frame=0;
  const reveal=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const active=document.activeElement;if(active instanceof HTMLElement&&node.contains(active))revealFocus(active);});};
  const observer=new ResizeObserver(reveal);observer.observe(node);node.addEventListener('focusin',reveal);
  return()=>{observer.disconnect();node.removeEventListener('focusin',reveal);cancelAnimationFrame(frame);};
 },[]);
 return <View ref={container} style={{flexShrink:1,minHeight:0}}>
 <ScrollView showsVerticalScrollIndicator={false} style={{flexShrink:1}} contentContainerStyle={{paddingHorizontal:0,paddingTop:0,paddingBottom:0}} onLayout={e=>{measurements.current.height=e.nativeEvent.layout.height;update();}} onContentSizeChange={(_,height)=>{measurements.current.content=height;update();}} onScroll={e=>{measurements.current.offset=e.nativeEvent.contentOffset.y;update();}} scrollEventThrottle={48}>{children}</ScrollView>
 {edges.top&&<View pointerEvents="none" style={[s.fade,{top:0}]}><LinearGradient colors={['#0b0e16','transparent']} style={StyleSheet.absoluteFill}/></View>}
 {edges.bottom&&<View pointerEvents="none" style={[s.fade,{bottom:0}]}><LinearGradient colors={['transparent','#0b0e16']} style={StyleSheet.absoluteFill}/></View>}
 </View>;
}
const s=StyleSheet.create({fade:{position:'absolute',left:0,right:0,height:22,...Platform.select({web:{backdropFilter:'blur(1px)'} as object})}});
