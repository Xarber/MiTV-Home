// SPDX-License-Identifier: AGPL-3.0-only
/** OS permission dialogs may be inactive without backgrounding the companion. */
export function remoteActivity(state:string):boolean|undefined{return state==='active'?true:state==='background'?false:undefined;}
