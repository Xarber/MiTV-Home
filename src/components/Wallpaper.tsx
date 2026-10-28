// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect,useId,useState} from 'react';
import {StyleSheet,View,AppState} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Svg,{Path,Defs,LinearGradient as SvgGradient,Stop} from 'react-native-svg';
import Animated,{useSharedValue,useAnimatedStyle,withRepeat,withTiming,Easing,cancelAnimation,useReducedMotion} from 'react-native-reanimated';
import {wallpapers} from '../model/catalog';
export function Wallpaper({id,motion=false,mini=false}:{id:string;motion?:boolean;mini?:boolean}){
 const gradientId='wallpaper-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const [active,setActive]=useState(AppState.currentState!=='background'&&AppState.currentState!=='inactive');
 useEffect(()=>{const subscription=AppState.addEventListener('change',state=>setActive(state==='active'));return()=>subscription.remove();},[]);
 const wallpaper=wallpapers.find(w=>w.id===id)??wallpapers[0]!;const reduced=useReducedMotion();
 const drift=useSharedValue(0);
 useEffect(()=>{cancelAnimation(drift);drift.set(0);if(motion&&!reduced&&!mini&&active)drift.set(withRepeat(withTiming(1,{duration:10000,easing:Easing.inOut(Easing.sin)}),-1,true));return()=>cancelAnimation(drift);},[motion,reduced,mini,id,active]);
 const style=useAnimatedStyle(()=>({transform:[{translateX:drift.get()*90},{translateY:drift.get()*-38},{scale:1.08}]}));
 return <View style={[StyleSheet.absoluteFill,{overflow:'hidden',backgroundColor:wallpaper.colors[0]}]} pointerEvents="none">
 <LinearGradient colors={wallpaper.colors} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
 <Animated.View nativeID={mini?undefined:'wallpaper-motion'} style={[StyleSheet.absoluteFill,style]}>
 <Svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
 <Defs><SvgGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={wallpaper.colors[1]} stopOpacity=".03"/><Stop offset=".5" stopColor={wallpaper.colors[1]} stopOpacity=".6"/><Stop offset="1" stopColor={wallpaper.colors[0]} stopOpacity=".05"/></SvgGradient></Defs>
 <Path d="M-200 880 C80 830 240 470 430 100 C590-210 1030-190 1140 80 C920 130 640 320 490 570 C320 850 50 1050-200 1100Z" fill={`url(#${gradientId})`}/>
 <Path d="M440 1000 C600 760 620 520 930 410 C1100 350 1260 420 1570 180 L1600 950Z" fill={`url(#${gradientId})`} opacity=".5"/>
 <Path d="M-100 850 C420 1070 700 230 1570 220" stroke={wallpaper.colors[1]} strokeWidth="1" opacity=".24" fill="none"/>
 </Svg>
 </Animated.View>
 <LinearGradient colors={['transparent','rgba(3,7,15,0.18)','rgba(3,7,15,0.66)']} style={StyleSheet.absoluteFill}/>
 </View>;
}
