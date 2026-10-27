// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome;

import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;

/** Icon-led release presentation using the launcher's existing accessible, focusable controls. */
final class ReleasePanels {
    static void appendHistory(MainActivity host, LinearLayout rows) {
        JSONArray releases = ReleaseHistory.entries(host);
        for (int i = 0; i < releases.length(); i++) {
            JSONObject release = releases.optJSONObject(i);
            if (release == null || release.optInt("code") > io.github.jqssun.airplay.BuildConfig.VERSION_CODE) continue;
            host.addControlIcon(rows, "MiTV Home " + release.optString("version"), release.optString("date"), "history", () -> {
                host.closePanel(); host.showRelease(release);
            });
        }
    }
    static void appendUpdate(MainActivity host, LinearLayout rows, int previous) {
        JSONArray releases = ReleaseHistory.entries(host);
        JSONObject latest = releases.optJSONObject(0);
        if (latest == null) return;
        label(host, rows, latest.optString("version"));
        features(host, rows, latest);
        disclosure(host, rows, host.tr("Fixes & Improvements"), "bug", ReleaseHistory.localized(host, latest, "fixes"));
        // Summarize each skipped version with one real feature, rather than just counting updates.
        for (int i = 1; i < releases.length(); i++) {
            JSONObject release = releases.optJSONObject(i);
            if (release == null || release.optInt("code") <= previous) continue;
            JSONArray features = release.optJSONArray("features");
            JSONObject first = features == null ? null : features.optJSONObject(0);
            if (first != null) host.addControlIcon(rows, ReleaseHistory.localized(host, first, "label"), release.optString("version"), first.optString("icon", "info"), () -> {host.closePanel();host.showRelease(release);});
        }
    }
    static void appendRelease(MainActivity host, LinearLayout rows, JSONObject release) {
        label(host, rows, release.optString("date"));
        features(host, rows, release);
        disclosure(host, rows, host.tr("Fixes & Improvements"), "bug", ReleaseHistory.localized(host, release, "fixes"));
        // Compatibility is visible, never hidden behind optional help.
        String compatibility = ReleaseHistory.localized(host, release, "compatibility");
        if (!compatibility.isEmpty()) label(host, rows, host.tr("Compatibility") + "\n" + compatibility);
    }
    private static void features(MainActivity host, LinearLayout rows, JSONObject release) {
        JSONArray features = release.optJSONArray("features");
        if (features == null) return;
        for (int i = 0; i < features.length(); i++) {
            JSONObject feature = features.optJSONObject(i);
            if (feature != null) disclosure(host, rows, ReleaseHistory.localized(host, feature, "label"), feature.optString("icon", "info"), ReleaseHistory.localized(host, feature, "detail"));
        }
    }
    private static void disclosure(MainActivity host, LinearLayout rows, String title, String icon, String detail) {
        TextView body = host.text(detail, 13, MainActivity.MUTED);
        body.setPadding(host.dp(16), host.dp(8), host.dp(10), host.dp(10));
        body.setLineSpacing(host.dp(3), 1);
        body.setVisibility(View.GONE);
        final TextView[] trigger = new TextView[1];
        host.addControlIcon(rows, title, host.tr("More information"), icon, () -> {
            boolean expanded = body.getVisibility() != View.VISIBLE;
            body.setVisibility(expanded ? View.VISIBLE : View.GONE);
            trigger[0].setContentDescription(title + ", " + host.tr(expanded ? "Expanded" : "Collapsed"));
            trigger[0].requestFocus();
        });
        trigger[0] = (TextView) rows.getChildAt(rows.getChildCount() - 1);
        trigger[0].setContentDescription(title + ", " + host.tr("Collapsed"));
        rows.addView(body, host.lp(-1, -2));
    }
    private static void label(MainActivity host, LinearLayout rows, String text) {
        TextView label = host.text(text, 13, MainActivity.MUTED);
        label.setPadding(0, host.dp(8), 0, host.dp(8));
        rows.addView(label, host.lp(-1, -2));
    }
    private ReleasePanels() {}
}
