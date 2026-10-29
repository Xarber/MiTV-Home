// SPDX-License-Identifier: AGPL-3.0-only
/** Equal visible area for wide and square brand marks, with bounded hero-only extents. */
export function heroMarkSize(width:number,height:number){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return {width:100,height:80};
 const scale=Math.min(148/width,96/height,Math.sqrt(8000/(width*height)));
 return {width:width*scale,height:height*scale};
}
