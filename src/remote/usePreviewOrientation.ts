// SPDX-License-Identifier: AGPL-3.0-only
import {useEffect} from 'react';
import {Platform} from 'react-native';
import * as Orientation from 'expo-screen-orientation';
/** Restore the prior policy, including when leaving during an unfinished request. */
export function usePreviewOrientation(enabled:boolean){
 useEffect(()=>{if(!enabled||Platform.isTV)return;let disposed=false;let previous:Orientation.OrientationLock|undefined;
  void(async()=>{try{previous=await Orientation.getOrientationLockAsync();if(disposed)return;await Orientation.lockAsync(Orientation.OrientationLock.LANDSCAPE);if(disposed&&previous!==undefined)await Orientation.lockAsync(previous);}catch{/* Resizable iOS windows and browser policy can refuse orientation locks. */}})();
  return()=>{disposed=true;if(previous!==undefined)void Orientation.lockAsync(previous).catch(()=>{});};
 },[enabled]);
}
