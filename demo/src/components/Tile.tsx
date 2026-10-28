// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import {View,Text,StyleSheet,useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {FocusButton} from './FocusButton';
import {Icon} from './Icon';
import {AppEntry} from '../model/catalog';
export function Tile({app,id,group,onPress,onSelect,onMenu,wide=false}:{app:AppEntry;id:string;group:string;onPress:()=>void;onSelect:()=>void;onMenu:()=>void;wide?:boolean}){
 const screenWidth=useWindowDimensions().width;const narrow=screenWidth<600;const compactInput=wide&&screenWidth<800;
 return <View style={{flex:1,minWidth:wide?(compactInput?0:180):narrow?40:100,maxWidth:wide?(compactInput?'48%':360):240,flexBasis:compactInput?'46%':undefined}}>
 <FocusButton id={id} label={app.name} group={group} onPress={onPress} onSelect={onSelect} onLongPress={onMenu} style={[styles.tile,{aspectRatio:wide?2.1:1.75}]}>
 <LinearGradient colors={[app.color,'#20232b']} style={[StyleSheet.absoluteFill,{borderRadius:13}]} start={{x:0,y:0}} end={{x:1,y:1}}/>
 {app.id==='cinema'?<Text style={[styles.cinema,narrow&&{fontSize:13}]}>cinema<Text style={{fontWeight:'300',color:'#eec2ab'}}>+</Text></Text>:app.id==='video'?<View style={[styles.video,narrow&&{paddingHorizontal:9,paddingVertical:5}]}><Icon name="play" size={narrow?19:29}/></View>:<View style={{zIndex:1}}><Icon name={app.icon} size={wide?(compactInput?30:44):narrow?25:39}/></View>}
 </FocusButton>
 {wide&&<><Text style={[styles.caption,compactInput&&{fontSize:13,marginTop:8}]}>{app.name}</Text>{app.subtitle&&<Text style={[styles.subtitle,compactInput&&{fontSize:10,marginTop:4}]}>{app.subtitle}</Text>}</>}
 </View>;
}
const styles=StyleSheet.create({tile:{overflow:'visible',borderRadius:16,width:'100%'},cinema:{fontSize:24,fontWeight:'700',letterSpacing:-1,color:'#fff'},video:{paddingHorizontal:17,paddingVertical:8,borderRadius:13,backgroundColor:'#f1313e'},caption:{color:'#f3f3f5',fontSize:16,fontWeight:'600',textAlign:'center',marginTop:16},subtitle:{color:'#bbc0cb',fontSize:12,textAlign:'center',marginTop:6}});
