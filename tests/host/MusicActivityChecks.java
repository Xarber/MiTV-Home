// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome.playback;
public final class MusicActivityChecks {
    private static void check(boolean condition){if(!condition)throw new AssertionError("Music activity deadline");}
    public static void main(String[] args){
        MusicActivityClock clock=new MusicActivityClock();check(clock.visible(true,true,0));check(clock.visible(true,false,10));
        check(clock.visible(true,false,200000));check(clock.visible(true,false,300009));check(!clock.visible(true,false,300010));
        check(!clock.visible(true,false,900000));check(clock.visible(true,true,900001));check(clock.visible(true,false,900002));
        check(!clock.visible(false,false,900003));check(clock.visible(true,false,900004));System.out.println("PASS: native music pause deadline and resume");
    }
}
