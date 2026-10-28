// SPDX-License-Identifier: AGPL-3.0-only
const {getDefaultConfig}=require('expo/metro-config');
const config=getDefaultConfig(__dirname);
const escaped=__dirname.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
config.resolver.blockList=[new RegExp(escaped+'/(?:build|demo|app/build|app/src/main/assets/remoteapp)/')];
module.exports=config;
