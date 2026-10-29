// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;
import java.util.Set;
/** Public remote commands are finite; system-only keys never pretend to be Home navigation. */
final class RemoteKeys {
    private static final Set<String> SYSTEM=new java.util.HashSet<>(java.util.Arrays.asList("channelup","channeldown","rewind","fastforward","stop","voice","red","green","yellow","blue"));
    static boolean systemOnly(String command){return SYSTEM.contains(command);}
    static boolean supported(String command){return SYSTEM.contains(command)||command.matches("up|down|left|right|ok|back|home|volumeup|volumedown|mute|playpause|next|previous|menu|control");}
}
