// SPDX-License-Identifier: AGPL-3.0-only
import React,{useLayoutEffect,useRef,useState} from 'react';
import {StyleSheet,View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Animated,{Easing,interpolateColor,useAnimatedStyle,useReducedMotion,useSharedValue,withTiming} from 'react-native-reanimated';
/** Two static gradients crossfade on the UI thread. Interrupted changes sample the visible blend. */
export function PaletteGradient({colors,mirror=false,horizontal=false}:{colors:readonly[string,string];mirror?:boolean;horizontal?:boolean}){
 const reduced=useReducedMotion(),progress=useSharedValue(1);
 const [layers,setLayers]=useState({from:[...colors] as [string,string],to:[...colors] as [string,string],revision:0});
 const current=useRef(layers);
 useLayoutEffect(()=>{const previous=current.current;if(previous.to[0]===colors[0]&&previous.to[1]===colors[1])return;
  const amount=progress.get(),next={from:previous.from.map((color,index)=>interpolateColor(amount,[0,1],[color,previous.to[index]!],'RGB',{gamma:1})) as [string,string],to:[...colors] as [string,string],revision:previous.revision+1};
  current.current=next;setLayers(next);
 },[colors[0],colors[1]]);
 useLayoutEffect(()=>{if(layers.from[0]===layers.to[0]&&layers.from[1]===layers.to[1]){progress.set(1);return;}progress.set(0);progress.set(withTiming(1,{duration:reduced?0:1800,easing:Easing.linear}));},[layers.revision,reduced]);
 const fade=useAnimatedStyle(()=>({opacity:progress.get()}));
 const points=horizontal?{start:{x:0,y:0},end:{x:1,y:0}}:mirror?{start:{x:0,y:0},end:{x:1,y:1}}:{};
 const stops=(value:[string,string]):[string,string,...string[]]=>mirror?[value[0],value[1],value[0]]:value;
 return <View testID="palette-gradient" pointerEvents="none" style={StyleSheet.absoluteFill}><LinearGradient colors={stops(layers.from)} {...points} style={StyleSheet.absoluteFill}/><Animated.View testID="palette-fade" style={[StyleSheet.absoluteFill,fade]}><LinearGradient colors={stops(layers.to)} {...points} style={StyleSheet.absoluteFill}/></Animated.View></View>;
}
