// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome.diagnostics;

/** Shared temporary access for native Home and the integrated receiver settings surface. */
public final class DeveloperAccess {
    public static final DeveloperSession SESSION = new DeveloperSession(android.os.SystemClock::elapsedRealtime);
    private DeveloperAccess() {}
}
