// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import {View} from 'react-native';
import Animated,{useAnimatedStyle,useReducedMotion,withTiming,interpolateColor,type SharedValue} from 'react-native-reanimated';
import {PaletteGradient} from './PaletteGradient';
/** Fixed slots isolate six tiny height animations. Real diameter preserves circular zero-level caps. */
export function Spectrum({values,playing,decorative,small,colors,width,height,gap,label,period=650,stagger=163,phase=false}:{values:SharedValue<number[]>;playing:boolean;decorative:boolean;small:boolean;colors:readonly[string,string];width:number;height:number;gap:number;label:string;period?:number;stagger?:number;phase?:boolean}){
 return <View accessibilityLabel={label} style={{flexDirection:'row',alignItems:'center',height:small?22:height,gap}}>{[0,1,2,3,4,5].map(index=><Bar key={index} index={index} values={values} playing={playing} decorative={decorative} colors={[interpolateColor(index/6,[0,1],colors),interpolateColor((index+1)/6,[0,1],colors)]} width={width} height={height} period={period} stagger={stagger} phase={phase}/>)}</View>;
}
function Bar({index,values,playing,decorative,colors,width,height,period,stagger,phase}:{index:number;values:SharedValue<number[]>;playing:boolean;decorative:boolean;colors:readonly[string,string];width:number;height:number;period:number;stagger:number;phase:boolean}){
 const reduced=useReducedMotion();
 const style=useAnimatedStyle(()=>({height:withTiming(playing?Math.max(width,height*(values.get()[index]??.12)):width,{duration:reduced?0:100})}));
 return <View style={{width,height,position:'relative'}}><Animated.View testID="spectrum-bar" style={[{position:'absolute',width,height:width,top:'50%',transform:[{translateY:'-50%'}],borderRadius:width/2,overflow:'hidden',...(decorative&&playing&&!reduced?{animationName:{from:{height:width},to:{height:Math.max(width,height*(.5+index*.07))}},animationDuration:period+index*stagger,animationDirection:'alternate' as const,animationIterationCount:'infinite' as const,animationDelay:phase?index*-170:0}:undefined)},(!decorative||!playing||reduced)&&style]}><PaletteGradient colors={colors} horizontal/></Animated.View></View>;
}
