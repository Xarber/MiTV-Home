// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import {StyleSheet} from 'react-native';
import Animated,{useReducedMotion} from 'react-native-reanimated';
import {PaletteGradient} from './PaletteGradient';
/** Decorative artwork tint; no PCM animation or changes to the wallpaper/blur implementation. */
export function MusicTint({enabled,playing,colors}:{enabled:boolean;playing:boolean;colors:readonly[string,string]}){
 const reduced=useReducedMotion();
 if(!enabled)return null;
 return <Animated.View testID="music-wallpaper-tint" pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:playing?.24:0,overflow:'hidden',transitionProperty:['opacity'],transitionDuration:reduced?0:600}]}>
 <Animated.View testID="music-wallpaper-drift" style={[StyleSheet.absoluteFill,{inset:-80,animationName:playing&&!reduced?{from:{transform:[{translateX:-28},{translateY:12},{rotate:'-8deg'},{scale:1.08}]},to:{transform:[{translateX:28},{translateY:-12},{rotate:'8deg'},{scale:1.16}]}}:undefined,animationDuration:14000,animationDirection:'alternate',animationIterationCount:'infinite'}]}><PaletteGradient colors={colors} mirror/></Animated.View>
 </Animated.View>;
}
