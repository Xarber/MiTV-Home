// SPDX-License-Identifier: AGPL-3.0-only
module.exports = ({config}) => {
 const remote = process.env.AUREA_TARGET === 'remote';
 return {...config,name:remote?'Aurea Remote':'Aurea Home',slug:remote?'aurea-remote':'aurea-home',platforms:remote?['android','ios','web']:['android','web'],ios:{...config.ios,infoPlist:{...config.ios?.infoPlist,...(remote?{NSMicrophoneUsageDescription:'Send your voice to your paired television while the microphone is active.'}:{})}},android:{...config.android,...(remote?{permissions:[...(config.android?.permissions??[]),'android.permission.RECORD_AUDIO']} : {}),package:remote?'it.xarber.aurea.remote':'it.xarber.mitvhome'},extra:{...config.extra,product:remote?'remote':'home'}};
};
