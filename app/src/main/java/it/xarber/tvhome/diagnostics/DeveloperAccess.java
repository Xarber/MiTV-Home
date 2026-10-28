// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome.diagnostics;

/** Shared persisted opt-in; the triple-press session only reveals its configuration toggle. */
public final class DeveloperAccess {
    public static final DeveloperSession SESSION = new DeveloperSession(android.os.SystemClock::elapsedRealtime);
    public static boolean enabled(android.content.Context context){return context.getSharedPreferences("home_developer",0).getBoolean("enabled",false);}
    public static void setEnabled(android.content.Context context,boolean enabled){context.getSharedPreferences("home_developer",0).edit().putBoolean("enabled",enabled).apply();}
    private DeveloperAccess() {}
}
