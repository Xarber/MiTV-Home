// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect} from 'react';
import {View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Animated,{useSharedValue,useAnimatedStyle,withTiming,useReducedMotion} from 'react-native-reanimated';
import {tvEvents} from '../platform/native/tv';
/** Receiver bands reuse the existing volume-normalized DSP; remote-player bars are labelled animation. */
export function NativeWaveform({playing,source,colors=['#e6eaf0','#929aa8'],small=false}:{playing:boolean;source?:string;colors?:[string,string];small?:boolean}){
 const reduced=useReducedMotion();const bands=useSharedValue([.13,.13,.13,.13,.13,.13]);
 useEffect(()=>{if(source!=='airplay')return;const subscription=tvEvents?.addListener('AureaTVWaveform',(...args:readonly Object[])=>{const encoded=args[0];if(typeof encoded!=='string')return;try{const values:unknown=JSON.parse(encoded);if(Array.isArray(values)&&values.length===6&&values.every(value=>typeof value==='number'&&Number.isFinite(value)))bands.set(values.map(value=>Math.max(.12,Math.min(1,(20*Math.log10(Math.max(.0001,value))+52)/46))));}catch{}});return()=>subscription?.remove();},[source]);
 return <View accessibilityLabel={source==='airplay'?'Audio spectrum':'Playback animation'} style={{height:small?22:32,flexDirection:'row',alignItems:'center',gap:small?2:4}}>{[0,1,2,3,4,5].map(index=><Band key={index} index={index} bands={bands} small={small} playing={playing} animated={source!=='airplay'&&!reduced} colors={colors}/>)}</View>;
}
function Band({index,bands,small,playing,animated,colors}:{index:number;bands:ReturnType<typeof useSharedValue<number[]>>;small:boolean;playing:boolean;animated:boolean;colors:[string,string]}){
 const reduced=useReducedMotion();const style=useAnimatedStyle(()=>({transform:[{scaleY:withTiming(playing?bands.get()[index]??.12:.12,{duration:reduced?0:100})}]}));
 return <Animated.View style={[{width:small?2:5,height:small?20:32,borderRadius:9,overflow:'hidden',...(animated&&playing?{animationName:{from:{transform:[{scaleY:.18}]},to:{transform:[{scaleY:.5+index*.07}]}},animationDuration:650+index*163,animationDirection:'alternate' as const,animationIterationCount:'infinite' as const}:undefined)},!animated&&style]}><LinearGradient colors={colors} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/></Animated.View>;
}
