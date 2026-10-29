// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect,useState} from 'react';
import {AccessibilityInfo,Platform,StyleSheet,View} from 'react-native';
import {BlurView} from 'expo-blur';
import {GlassView,isLiquidGlassAvailable,isGlassEffectAPIAvailable} from 'expo-glass-effect';
/** Phone-only material; does not change the TV's live blur target or parameters. */
export function PhoneMaterial({music=false}:{music?:boolean}){
 const [reduced,setReduced]=useState(false);
 useEffect(()=>{void AccessibilityInfo.isReduceTransparencyEnabled().then(setReduced);const listener=AccessibilityInfo.addEventListener('reduceTransparencyChanged',setReduced);return()=>listener.remove();},[]);
 if(reduced)return <View style={[StyleSheet.absoluteFill,{backgroundColor:music?'#000':'#10151e'}]}/>;
 if(Platform.OS==='ios'&&isLiquidGlassAvailable()&&isGlassEffectAPIAvailable())return <GlassView pointerEvents="none" glassEffectStyle="regular" colorScheme="dark" tintColor={music?'#000000bb':'#0f14254d'} style={StyleSheet.absoluteFill}/>;
 if(Platform.OS==='ios')return <BlurView pointerEvents="none" tint="systemChromeMaterialDark" intensity={80} style={StyleSheet.absoluteFill}/>;
 return null;
}
