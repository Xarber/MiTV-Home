// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import {StyleSheet,View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import {usePaletteTransition} from '../hooks/usePaletteTransition';
export function PaletteGradient({colors,mirror=false,horizontal=false}:{colors:readonly[string,string];mirror?:boolean;horizontal?:boolean}){
 const {layers,fade}=usePaletteTransition(colors);
 const points=horizontal?{start:{x:0,y:0},end:{x:1,y:0}}:mirror?{start:{x:0,y:0},end:{x:1,y:1}}:{};
 const stops=(value:string[]):[string,string,...string[]]=>mirror?[value[0]!,value[1]!,value[0]!]:[value[0]!,value[1]!];
 return <View testID="palette-gradient" pointerEvents="none" style={StyleSheet.absoluteFill}><LinearGradient colors={stops(layers.from)} {...points} style={StyleSheet.absoluteFill}/><Animated.View testID="palette-fade" style={[StyleSheet.absoluteFill,fade]}><LinearGradient colors={stops(layers.to)} {...points} style={StyleSheet.absoluteFill}/></Animated.View></View>;
}
