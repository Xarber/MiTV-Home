// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome.playback;

import java.util.function.LongSupplier;

/** Short-lived PIN-entry window. Saved pairing credentials have no timer here. */
public final class PairingAttempt {
    public static final long TIMEOUT_MS=180_000;
    private final LongSupplier clock;
    private long generation,deadline;
    private String name="";
    private boolean started;
    public PairingAttempt(LongSupplier clock){this.clock=clock;}
    public synchronized long begin(String name){generation++;started=true;this.name=name;deadline=clock.getAsLong()+TIMEOUT_MS;return generation;}
    public synchronized long token(){return generation;}
    public synchronized boolean pending(){return started&&clock.getAsLong()<deadline;}
    public synchronized String name(){return pending()?name:"";}
    public synchronized long remaining(){return pending()?Math.max(0,deadline-clock.getAsLong()):0;}
    public synchronized void clear(){generation++;started=false;name="";deadline=0;}
    public synchronized boolean expire(long token){if(!started||token!=generation||clock.getAsLong()<deadline)return false;clear();return true;}
}
