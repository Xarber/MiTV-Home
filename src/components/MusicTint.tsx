// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect,useRef,useState} from 'react';
import {Platform,StyleSheet} from 'react-native';
import Animated,{useAnimatedStyle,useReducedMotion,useSharedValue,withTiming} from 'react-native-reanimated';
import {tvColor} from '../model/tvColor';
import {PaletteGradient} from './PaletteGradient';
/** Wallpaper-only tint. Overscan covers rotated corners at TV and phone aspect ratios. */
export function MusicTint({enabled,playing,colors}:{enabled:boolean;playing:boolean;colors:readonly[string,string]}){
 const reduced=useReducedMotion(),strength=Platform.isTV?.22:.24,previous=useRef(enabled),opacity=useSharedValue(enabled&&playing?strength:0),[retained,setRetained]=useState(enabled);
 useEffect(()=>{const toggled=previous.current!==enabled;previous.current=enabled;opacity.set(withTiming(enabled&&playing?strength:0,{duration:reduced?0:toggled?1800:600}));if(enabled){setRetained(true);return;}const timer=setTimeout(()=>setRetained(false),reduced?0:1800);return()=>clearTimeout(timer);},[enabled,playing,reduced,strength]);
 const fade=useAnimatedStyle(()=>({opacity:opacity.get()}));
 return <Animated.View testID="music-wallpaper-tint" pointerEvents="none" style={[StyleSheet.absoluteFill,{overflow:'hidden'},fade]}>
 <Animated.View testID="music-wallpaper-drift" style={[StyleSheet.absoluteFill,{left:'-20%',right:'-20%',top:'-40%',bottom:'-40%',animationName:playing&&retained&&!reduced?{from:{transform:[{translateX:-28},{translateY:12},{rotate:'-8deg'},{scale:1.08}]},to:{transform:[{translateX:28},{translateY:-12},{rotate:'8deg'},{scale:1.16}]}}:undefined,animationDuration:14000,animationDirection:'alternate',animationIterationCount:'infinite'}]}><PaletteGradient colors={Platform.isTV?colors.map(color=>tvColor(color)) as [string,string]:colors} mirror/></Animated.View>
 </Animated.View>;
}
