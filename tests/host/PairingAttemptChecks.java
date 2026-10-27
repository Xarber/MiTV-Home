// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome.playback;
public final class PairingAttemptChecks {
    static long now;
    static void check(boolean value,String message){if(!value)throw new AssertionError(message);}
    public static void main(String[] args){
        PairingAttempt attempt=new PairingAttempt(()->now);
        check(!attempt.pending(),"no pending attempt by default");
        long first=attempt.begin("TV");now=120000;check(attempt.pending(),"survives time away on HDMI");check(attempt.name().equals("TV"),"device label retained");
        check(attempt.remaining()==60000,"return does not reset expiry");now=179999;check(attempt.pending(),"active before deadline");now=180000;check(!attempt.pending(),"expires exactly at deadline");check(attempt.expire(first),"worker cleans expired protocol session");
        long previous=attempt.begin("Old");now+=1000;long latest=attempt.begin("New");now+=180000;
        check(!attempt.expire(previous),"old timer cannot cancel replacement");check(attempt.expire(latest),"replacement uses its own timer");
        long completed=attempt.begin("Saved");attempt.clear();now+=180000;check(!attempt.expire(completed),"completed pairing unaffected by pending timer");
        System.out.println("PASS: HDMI pairing lifetime, monotonic expiry and stale timer isolation");
    }
}
