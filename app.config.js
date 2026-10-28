// SPDX-License-Identifier: AGPL-3.0-only
module.exports = ({config}) => {
 const remote = process.env.AUREA_TARGET === 'remote';
 return {...config,name:remote?'Aurea Remote':'Aurea Home',slug:remote?'aurea-remote':'aurea-home',platforms:remote?['android','ios','web']:['android','web'],android:{...config.android,package:remote?'it.xarber.aurea.remote':'it.xarber.mitvhome'},extra:{...config.extra,product:remote?'remote':'home'}};
};
