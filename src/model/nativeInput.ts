// SPDX-License-Identifier: AGPL-3.0-only
/** Reject the same bridged event twice, while preserving distinct rapid presses. */
export class NativeInputGate {
 private seen=new Set<string>();
 accept(id:unknown){
  if(typeof id!=='string')return true;
  if(this.seen.has(id))return false;
  this.seen.add(id);if(this.seen.size>128)this.seen.delete(this.seen.values().next().value!);return true;
 }
 reset(){this.seen.clear();}
}
