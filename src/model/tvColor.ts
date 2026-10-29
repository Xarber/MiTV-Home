// SPDX-License-Identifier: AGPL-3.0-only
/** Expand chroma around linear-light Rec.709 luminance without increasing that luminance. */
export function tvColor(color:string,strength=1.18){
 if(!/^#[0-9a-f]{6}$/i.test(color))return color;
 const rgb=[1,3,5].map(offset=>{const channel=parseInt(color.slice(offset,offset+2),16)/255;return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;}),y=rgb[0]!*.2126+rgb[1]!*.7152+rgb[2]!*.0722;
 let gain=strength;for(const channel of rgb){const delta=channel-y;if(delta>0)gain=Math.min(gain,(1-y)/delta);else if(delta<0)gain=Math.min(gain,-y/delta);}
 return '#'+rgb.map(channel=>{const linear=y+(channel-y)*gain,encoded=linear<=.0031308?linear*12.92:1.055*linear**(1/2.4)-.055;return Math.round(Math.max(0,Math.min(1,encoded))*255).toString(16).padStart(2,'0');}).join('');
}
