// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import {Platform} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import TVHomeDemo from './TVHomeDemo';
import PhoneRemoteApp from './src/remote/PhoneRemoteApp';
export default function App(){
 const web=Platform.OS==='web';
 const params=web?new URLSearchParams(location.search):undefined;
 const tvHosted=web&&!!document.querySelector('meta[name="aurea-remote"]');
 const phone=!web||tvHosted||params?.get('remote')==='1';
 const preview=web&&!tvHosted&&params?.get('preview')==='1';
 return <SafeAreaProvider>{phone?<PhoneRemoteApp preview={preview}/>:<TVHomeDemo/>}</SafeAreaProvider>;
}
