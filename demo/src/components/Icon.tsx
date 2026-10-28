// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import Svg,{Path,Rect,Circle,Line,Polyline} from 'react-native-svg';
import type {IconName} from '../model/catalog';
export function Icon({name,size=24,color='white'}:{name:IconName;size?:number;color?:string}){
 const paths:Partial<Record<IconName,string>>={
 inputs:'M5 3h14v7H5z M8 10v5h8v-5 M12 15v6',music:'M9 17V5l12-2v12 M9 7l12-2',
 film:'M3 3h18v18H3z M7 3v18 M17 3v18 M3 8h4 M3 16h4 M17 8h4 M17 16h4',
 airplay:'M4 16H3V3h18v13h-1 M12 13l7 8H5z',tv:'M3 7h18v14H3z M8 2l4 5 4-5',
 game:'M7 8h10c4 0 6 11 3 12-2 1-4-3-5-3H9c-1 0-3 4-5 3C1 19 3 8 7 8z M7 10v6 M4 13h6 M17 12h.01 M19 15h.01',
 remote:'M9 2h6a3 3 0 013 3v14a3 3 0 01-3 3H9a3 3 0 01-3-3V5a3 3 0 013-3z M10 16h4 M10 19h4',
 wifi:'M2 8a16 16 0 0120 0 M5 12a11 11 0 0114 0 M8 16a6 6 0 018 0 M12 20h.01',
 volume:'M4 9h4l5-4v14l-5-4H4z M17 8a7 7 0 010 8 M20 5a11 11 0 010 14',
 sun:'M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M5 19l1-1 M18 6l1-1',
 chevron:'M6 9l6 6 6-6',close:'M6 6l12 12 M6 18L18 6',home:'M3 10l9-8 9 8 M5 9v12h5v-7h4v7h5V9',
 check:'M5 12l4 4L20 5',wallpaper:'M3 3h18v18H3z M3 17l6-6 5 5 3-3 4 4',settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
 previous:'M5 5v14 M19 5l-11 7 11 7z',next:'M19 5v14 M5 5l11 7-11 7z',
 };
 return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round">
 {name==='apps'?<>{[4,14].flatMap(x=>[4,14].map(y=><Rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1.4"/>))}</>:name==='play'?<Path d="M7 4l14 8-14 8z" fill={color} stroke="none"/>:name==='pause'?<><Rect x="6" y="4" width="4" height="16" rx="1" fill={color}/><Rect x="14" y="4" width="4" height="16" rx="1" fill={color}/></>:name==='apple'?<Path d="M16 3c-2 0-4 2-4 4 2 0 4-2 4-4M12 8c-3-3-8-1-8 4 0 4 3 9 5 9l3-1 3 1c2 0 4-4 5-6-4-1-4-5-1-7-2-2-5-1-7 0" fill={color} stroke="none"/>:<Path d={paths[name]??paths.apps}/>}
 {name==='music'&&<><Circle cx="6" cy="17" r="3" fill={color}/><Circle cx="18" cy="15" r="3" fill={color}/></>}{name==='sun'&&<Circle cx="12" cy="12" r="4"/>}{name==='remote'&&<Circle cx="12" cy="9" r="3"/>}{name==='settings'&&<Circle cx="12" cy="12" r="3"/>}
 </Svg>;
}
