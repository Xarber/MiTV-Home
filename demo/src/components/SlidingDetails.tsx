// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import Animated,{useReducedMotion} from 'react-native-reanimated';
/** Keep one-line content mounted while its clipped window slides open and closed. */
export function SlidingDetails({expanded,width,children}:{expanded:boolean;width:number;children:React.ReactNode}){
 const reduced=useReducedMotion();
 return <Animated.View style={{width:expanded?width:0,opacity:expanded?1:0,marginLeft:expanded?10:0,overflow:'hidden',transitionProperty:['width','opacity','marginLeft'],transitionDuration:reduced?0:180,transitionTimingFunction:'ease-out'}}>
 <Animated.View style={{width,flexDirection:'row',alignItems:'center',gap:9,transform:[{translateX:expanded?0:-8}],transitionProperty:'transform',transitionDuration:reduced?0:180}}>{children}</Animated.View>
 </Animated.View>;
}
