// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome.playback;
/** Monotonic pause deadline, unaffected by metadata updates or state polling. */
public final class MusicActivityClock {
    public static final long TIMEOUT_MS=5*60*1000;
    private long pausedAt=-1;
    public synchronized boolean visible(boolean active,boolean playing,long now){
        if(!active||playing)pausedAt=-1;
        else if(pausedAt<0)pausedAt=now;
        return active&&(playing||now-pausedAt<TIMEOUT_MS);
    }
}
