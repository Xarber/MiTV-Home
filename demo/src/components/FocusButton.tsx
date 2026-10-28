// SPDX-License-Identifier: AGPL-3.0-only
import React,{useState} from 'react';
import {Pressable,StyleSheet,ViewStyle,StyleProp,Platform} from 'react-native';
import Animated,{useReducedMotion} from 'react-native-reanimated';
const AnimatedPressable=Animated.createAnimatedComponent(Pressable);
export function FocusButton({id,children,onPress,onSelect,onLongPress,onDeselect,style,label,group='main',selected=false,disabled=false}:{id:string;children:React.ReactNode;onPress:()=>void;onSelect?:()=>void;onDeselect?:()=>void;onLongPress?:()=>void;style?:StyleProp<ViewStyle>;label:string;group?:string;selected?:boolean;disabled?:boolean}){
 const [focus,setFocus]=useState(false);const [pressed,setPressed]=useState(false);const reduced=useReducedMotion();
 return <AnimatedPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected,disabled}} disabled={disabled} tabIndex={disabled?-1:0}
 {...(Platform.OS==='web'?{dataSet:{nav:id,group}}:{})} onFocus={()=>{setFocus(true);onSelect?.();}} onBlur={()=>{setFocus(false);onDeselect?.();}} onHoverOut={onDeselect} onHoverIn={onSelect} onPress={onPress} onLongPress={onLongPress} delayLongPress={550}
 onPressIn={()=>setPressed(true)} onPressOut={()=>setPressed(false)}
 style={[styles.base,style,{opacity:disabled?.35:1},{outlineWidth:0},focus?styles.focus:null,{transform:[{scale:reduced?1:pressed?.97:focus?1.045:1}],transitionProperty:['transform','backgroundColor','borderColor'],transitionDuration:reduced?0:120}]}>
 {children}
 </AnimatedPressable>;
}
const styles=StyleSheet.create({base:{borderWidth:2,borderColor:'transparent',borderRadius:16,justifyContent:'center',alignItems:'center',minHeight:44,minWidth:44},focus:{borderColor:'#fff',boxShadow:'0 0 0 4px rgba(255,255,255,.10), 0 12px 30px rgba(0,0,0,.20)'}});
