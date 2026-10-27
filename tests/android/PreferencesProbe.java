// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

/** Runs on Android's real JSON implementation; does not access or change app preferences. */
public final class PreferencesProbe {
    private static void validate(String value, boolean accepted) throws Exception {
        boolean actual;
        try { HomePreferences.readAndValidate(new ByteArrayInputStream(value.getBytes(StandardCharsets.UTF_8))); actual=true; }
        catch (Exception error) { actual=false; }
        if(actual!=accepted)throw new AssertionError("Preference validation mismatch");
    }
    public static void main(String[] args) throws Exception {
        validate("{\"schema\":1,\"language\":\"it\",\"home\":{\"input-dock-pin\":\"inputs\",\"dock-pins\":\"[\\\"com.netflix.ninja\\\",\\\"airplay\\\",\\\"hdmi2\\\",\\\"live\\\",\\\"library\\\"]\",\"input-profile-2\":\"appletv\",\"activity-background\":false}}",true);
        validate("{\"schema\":2,\"language\":\"it\",\"home\":{}}",false);
        validate("{\"schema\":1,\"language\":\"xx\",\"home\":{}}",false);
        validate("{\"schema\":1,\"language\":\"en\",\"home\":{\"token\":\"secret\"}}",false);
        validate("{\"schema\":1,\"language\":\"en\",\"home\":{\"activity-background\":\"false\"}}",false);
        validate("{\"schema\":1,\"language\":\"it\",\"home\":{\"input-dock-pin\":\"library\"}}",false);
        validate("{\"schema\":1,\"language\":\"it\",\"home\":{\"dock-pins\":\"[\\\"library\\\"]\"}}",false);
        validate("{\"schema\":1,\"language\":\"it\",\"home\":{\"input-profile-1\":\"unknown\"}}",false);
        validate(" ".repeat(16385),false);
        System.out.println("PASS: Android preferences valid backup and hostile schema/type/field/slot/size checks");
    }
}
