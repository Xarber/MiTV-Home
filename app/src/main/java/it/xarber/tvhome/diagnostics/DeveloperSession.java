// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome.diagnostics;

import java.util.function.LongSupplier;

/** In-memory, monotonic developer access. No permanent preference or external unlock intent. */
public final class DeveloperSession {
    public static final long IDLE_MILLIS = 30_000;
    private final LongSupplier clock;
    private long lastTap = -1, lastInput;
    private int taps;
    private boolean unlocked;

    public DeveloperSession(LongSupplier clock) { this.clock = clock; }
    public boolean tapVersion() {
        long now = clock.getAsLong();
        if (lastTap < 0 || now - lastTap > 4_000) taps = 0;
        lastTap = now;
        if (++taps >= 3) { unlocked = true; taps = 0; lastInput = now; }
        return isUnlocked();
    }
    public boolean isUnlocked() {
        if (unlocked && clock.getAsLong() - lastInput >= IDLE_MILLIS) lock();
        return unlocked;
    }
    public void interact() { if (isUnlocked()) lastInput = clock.getAsLong(); }
    public void lock() { unlocked = false; taps = 0; lastTap = -1; }
}
