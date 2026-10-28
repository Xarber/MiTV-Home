// SPDX-License-Identifier: AGPL-3.0-only
import React,{useState} from 'react';
import {View,Text} from 'react-native';
import {FocusButton} from './FocusButton';
import {Icon} from './Icon';
import type {IconName} from '../model/catalog';
type Dictionary=Record<string,unknown>;
function record(value:unknown):Dictionary{return value&&typeof value==='object'&&!Array.isArray(value)?value as Dictionary:{};}
function localized(value:unknown,language:string){const data=record(value);return typeof data[language]==='string'?data[language] as string:typeof data.en==='string'?data.en:'';}
export function ReadableDetails({text,id='details'}:{text:string;id?:string}){return <>{text.match(/[\s\S]{1,320}/g)?.map((part,index)=><FocusButton key={index} id={id+'-'+index} group="modal" label={part} onPress={()=>{}} style={{alignItems:'stretch',paddingVertical:8}}><Text selectable style={{color:'#c7cfdb',fontSize:14,lineHeight:23}}>{part}</Text></FocusButton>)}</>;}
export function NativeReleaseHistory({releases,language,compact=false}:{releases:unknown;language:'it'|'en';compact?:boolean}){
 const [expanded,setExpanded]=useState<string|null>(null);if(!Array.isArray(releases))return null;
 return <>{releases.slice(0,compact?1:50).map(value=>{const release=record(value),version=String(release.version??'');return <View key={version} style={{marginBottom:22}}>
 <Text style={{color:'#fff',fontSize:21,fontWeight:'600',marginBottom:8}}>{version}</Text><Text style={{color:'#9da9bc',fontSize:12,marginBottom:14}}>{String(release.date??'')}</Text>
 {Array.isArray(release.features)&&release.features.map((item,index)=>{const feature=record(item),id=version+'-'+index;const icons:Record<string,IconName>={remote:'remote',inputs:'inputs',apps:'apps',controls:'settings',airplay:'airplay',sound:'volume',code:'code',info:'info',history:'info',transfer:'apps',shield:'check'};return <View key={id}><FocusButton id={'release-'+id} group="modal" label={localized(feature.label,language)} onPress={()=>setExpanded(expanded===id?null:id)} style={{flexDirection:'row',gap:12,padding:12,alignItems:'center',justifyContent:'flex-start',borderRadius:14,marginBottom:6,backgroundColor:'#ffffff08'}}><Icon name={icons[String(feature.icon)]??'info'} size={22}/><Text style={{color:'#fff',fontSize:15,flex:1}}>{localized(feature.label,language)}</Text><Icon name="info" size={16}/></FocusButton>{expanded===id&&<ReadableDetails id={'release-detail-'+id} text={localized(feature.detail,language)}/>}</View>;})}
 <Text style={{color:'#fff',fontSize:15,fontWeight:'600',marginTop:14,marginBottom:8}}>{language==='it'?'Correzioni e miglioramenti':'Fixes & Improvements'}</Text><ReadableDetails id={'release-fixes-'+version} text={localized(release.fixes,language)}/>
 {!compact&&<ReadableDetails id={'release-compatibility-'+version} text={localized(release.compatibility,language)}/>}</View>;})}</>;
}
