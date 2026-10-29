// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;
public final class RemoteKeysChecks {
 public static void main(String[] args){for(String key:new String[]{"home","back","mute","channelup","channeldown","rewind","fastforward","stop","voice","red","green","yellow","blue"})if(!RemoteKeys.supported(key))throw new AssertionError(key);if(RemoteKeys.supported("arbitrary-system-command")||RemoteKeys.systemOnly("home")||!RemoteKeys.systemOnly("voice"))throw new AssertionError("Key scope");System.out.println("PASS: documented Android TV key allowlist and scope");}
}
