// SPDX-License-Identifier: AGPL-3.0-only
import {useLayoutEffect,useRef,useState} from 'react';
import {Easing,interpolateColor,useAnimatedStyle,useReducedMotion,useSharedValue,withTiming} from 'react-native-reanimated';
/** Static color layers; interrupt at the currently visible blend, without per-frame React work. */
export function usePaletteTransition(colors:readonly string[],immediate=false){
 const reduced=useReducedMotion(),progress=useSharedValue(1),key=colors.join(',');
 const [layers,setLayers]=useState({from:[...colors],to:[...colors],revision:0}),current=useRef(layers);
 useLayoutEffect(()=>{const previous=current.current;if(previous.to.join(',')===key)return;const amount=progress.get(),next={from:previous.from.map((color,index)=>interpolateColor(amount,[0,1],[color,previous.to[index]!],'RGB',{gamma:1})),to:[...colors],revision:previous.revision+1};current.current=next;setLayers(next);},[key]);
 useLayoutEffect(()=>{if(layers.from.join(',')===layers.to.join(',')){progress.set(1);return;}progress.set(0);progress.set(withTiming(1,{duration:reduced||immediate?0:1800,easing:Easing.linear}));},[layers.revision,reduced,immediate]);
 const fade=useAnimatedStyle(()=>({opacity:progress.get()}));return {layers,fade};
}
