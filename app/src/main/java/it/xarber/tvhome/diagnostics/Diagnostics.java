// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome.diagnostics;

import android.content.Context;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.Build;
import io.github.jqssun.airplay.BuildConfig;
import java.util.ArrayDeque;

/** Bounded, allowlisted event history: never accepts arbitrary sender or network strings. */
public final class Diagnostics {
    public enum Event { HOME_CREATED, HOME_RESUMED, HOME_PAUSED, PAGE_CHANGED, REMOTE_STARTED,
        REMOTE_STOPPED, REMOTE_PAIRED, REMOTE_FAILED, DEVELOPER_OPENED, SETTINGS_EXPORTED, SETTINGS_IMPORTED, SIMULATION_PREVIEW }
    private static final ArrayDeque<String> EVENTS = new ArrayDeque<>();
    public static synchronized void record(Event event) {
        if (EVENTS.size() == 64) EVENTS.removeFirst();
        EVENTS.addLast(android.os.SystemClock.elapsedRealtime() + " " + (event == Event.SIMULATION_PREVIEW ? "[simulated-local-ui] " : "[observed] ") + event.name());
    }
    public static synchronized String report(Context context, boolean receiverReady, boolean remoteReady) {
        ConnectivityManager manager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkCapabilities network = manager == null ? null : manager.getNetworkCapabilities(manager.getActiveNetwork());
        String transport = network == null ? "offline" : network.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ? "wifi" : network.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) ? "ethernet" : "other";
        StringBuilder text = new StringBuilder("MiTV Home diagnostics v2\n")
            .append("snapshot_utc=").append(java.time.Instant.now()).append("\nsource=local Android APIs; current snapshot\n")
            .append("version=").append(BuildConfig.VERSION_NAME).append(" (").append(BuildConfig.VERSION_CODE).append(")\n")
            .append("commit=").append(BuildConfig.SOURCE_COMMIT).append("\nbranch=").append(BuildConfig.BUILD_CHANNEL)
            .append("\nbuilt=").append(BuildConfig.BUILD_DATE).append("\nvariant=").append(BuildConfig.BUILD_VARIANT)
            .append("\nandroid_api=").append(Build.VERSION.SDK_INT).append("\nabis=").append(String.join(",", Build.SUPPORTED_ABIS))
            .append("\nnetwork=").append(transport).append("\nreceiver_bound=").append(receiverReady)
            .append("\nremote_listening=").append(remoteReady).append("\nplugins=disabled (no external loader)\n");
        for (String permission : new String[]{"INTERNET", "ACCESS_NETWORK_STATE", "POST_NOTIFICATIONS", "ACCESS_FINE_LOCATION"}) {
            text.append("permission.").append(permission).append('=').append(context.checkSelfPermission("android.permission." + permission) == PackageManager.PERMISSION_GRANTED).append('\n');
        }
        text.append("\nEvents (monotonic milliseconds)\n");
        for (String event : EVENTS) text.append(event).append('\n');
        return text.toString();
    }
    private Diagnostics() {}
}
