// SPDX-License-Identifier: AGPL-3.0-only
export const MUSIC_PAUSE_TIMEOUT = 5 * 60 * 1000;
/** A paused interval belongs to a session, never to its polling samples or artwork. */
export class MusicActivityClock {
 private pausedAt:number|undefined;
 update(active:boolean,playing:boolean,now:number){
  if(!active||playing)this.pausedAt=undefined;
  else this.pausedAt??=now;
  return active&&(playing||now-this.pausedAt!<MUSIC_PAUSE_TIMEOUT);
 }
}
