// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect,useMemo,useRef} from 'react';
import {View,Text,Platform,PanResponder,StyleSheet} from 'react-native';
import {TouchpadMotion} from './remoteNavigation';
import type {RemoteKey} from './types';
/** Native responders and browser pointer/wheel events are separate to prevent duplicate input. */
export function NavigationPad({size,connected,command,active}:{size:number;connected:boolean;command:(key:RemoteKey)=>void;active:(value:boolean)=>void}){
 const element=useRef<React.ComponentRef<typeof View>>(null),motion=useRef(new TouchpadMotion()),latest=useRef({connected,command,active});latest.current={connected,command,active};
 const gesture=useMemo(()=>PanResponder.create({onStartShouldSetPanResponderCapture:()=>latest.current.connected,onStartShouldSetPanResponder:()=>latest.current.connected,onMoveShouldSetPanResponder:()=>latest.current.connected,onPanResponderGrant:()=>{motion.current.begin();latest.current.active(true);},onPanResponderMove:(_,state)=>{const key=motion.current.move(state.dx,state.dy);if(key)latest.current.command(key);},onPanResponderRelease:()=>{const key=motion.current.end();latest.current.active(false);if(key)latest.current.command(key);},onPanResponderTerminate:()=>{motion.current.begin();latest.current.active(false);},onPanResponderTerminationRequest:()=>false}),[]);
 useEffect(()=>{
  if(Platform.OS!=='web')return()=>latest.current.active(false);
  const node=element.current as unknown as HTMLElement;if(!node)return;
  let pointer:number|undefined,x=0,y=0,wheelX=0,wheelY=0,timer:ReturnType<typeof setTimeout>|undefined;
  const wheelMotion=new TouchpadMotion();
  const down=(e:PointerEvent)=>{if(!latest.current.connected||!e.isPrimary||e.button!==0)return;e.preventDefault();pointer=e.pointerId;x=e.clientX;y=e.clientY;motion.current.begin();node.setPointerCapture(pointer);latest.current.active(true);};
  const move=(e:PointerEvent)=>{if(e.pointerId!==pointer)return;e.preventDefault();const key=motion.current.move(e.clientX-x,e.clientY-y);if(key)latest.current.command(key);};
  const cancel=()=>{pointer=undefined;motion.current.begin();latest.current.active(false);};
  const up=(e:PointerEvent)=>{if(e.pointerId!==pointer)return;e.preventDefault();const key=motion.current.end();pointer=undefined;latest.current.active(false);if(node.hasPointerCapture(e.pointerId))node.releasePointerCapture(e.pointerId);if(key)latest.current.command(key);};
  const wheel=(e:WheelEvent)=>{if(!latest.current.connected)return;e.preventDefault();if(!timer){wheelMotion.begin();wheelX=0;wheelY=0;}clearTimeout(timer);const unit=e.deltaMode===1?16:e.deltaMode===2?size:1;wheelX+=e.deltaX*unit;wheelY+=e.deltaY*unit;const key=wheelMotion.move(wheelX,wheelY);if(key)latest.current.command(key);timer=setTimeout(()=>{timer=undefined;},160);};
  node.style.touchAction='none';node.style.overscrollBehavior='contain';
  node.addEventListener('pointerdown',down);node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);node.addEventListener('pointercancel',cancel);node.addEventListener('lostpointercapture',cancel);node.addEventListener('wheel',wheel,{passive:false});
  // Safari may still deliver touch scrolling separately from its pointer stream.
  const prevent=(e:TouchEvent)=>{if(latest.current.connected)e.preventDefault();};node.addEventListener('touchmove',prevent,{passive:false});
  return()=>{clearTimeout(timer);node.removeEventListener('pointerdown',down);node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',up);node.removeEventListener('pointercancel',cancel);node.removeEventListener('lostpointercapture',cancel);node.removeEventListener('wheel',wheel);node.removeEventListener('touchmove',prevent);latest.current.active(false);};
 },[size]);
 return <View ref={element} testID="phone-touchpad" accessibilityLabel="Navigation touchpad. Swipe to move; tap to select." accessibilityRole="adjustable" accessibilityState={{disabled:!connected}} accessibilityActions={[{name:'increment',label:'Move right'},{name:'decrement',label:'Move left'},{name:'activate',label:'Select'}]} onAccessibilityAction={e=>{if(connected)command(e.nativeEvent.actionName==='increment'?'right':e.nativeEvent.actionName==='decrement'?'left':'ok');}} {...(Platform.OS==='web'?{}:gesture.panHandlers)} style={[s.pad,{width:size,height:size},Platform.OS==='web'&&({touchAction:'none',userSelect:'none'} as object)]}><View style={s.dot}/><Text pointerEvents="none" style={s.hint}>Swipe · Tap to select</Text></View>;
}
const s=StyleSheet.create({pad:{borderRadius:30,backgroundColor:'#ffffff08',borderWidth:1,borderColor:'#ffffff14',alignItems:'center',justifyContent:'center'},dot:{width:5,height:5,borderRadius:3,backgroundColor:'#ffffff70'},hint:{position:'absolute',bottom:15,color:'#9caabc',fontSize:10}});
