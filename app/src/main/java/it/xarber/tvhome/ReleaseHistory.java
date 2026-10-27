// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome;

import android.content.Context;
import android.content.SharedPreferences;
import io.github.jqssun.airplay.BuildConfig;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;

/** Shared source for the update popup and permanent, localized release history. */
final class ReleaseHistory {
    static JSONArray entries(Context context) {
        try (InputStream input = context.getAssets().open("release-history.json")) {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] chunk = new byte[4096]; int count;
            while ((count = input.read(chunk)) != -1) output.write(chunk, 0, count);
            return new JSONObject(output.toString("UTF-8")).getJSONArray("releases");
        } catch (Exception error) { return new JSONArray(); }
    }
    static String localized(Context context, JSONObject object, String key) {
        JSONObject value = object.optJSONObject(key);
        return value == null ? "" : value.optString(AppLanguage.code(context), value.optString("en"));
    }
    /** Never marks an upgrade seen before its popup has actually been presented. */
    static int previousVersion(Context context) {
        SharedPreferences state = context.getSharedPreferences("release_history", 0);
        if (!state.contains("seen")) {
            int baseline = BuildConfig.VERSION_CODE;
            try {
                android.content.pm.PackageInfo info = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
                // Existing users upgrading from versions without this module still see this update.
                if (info.lastUpdateTime > info.firstInstallTime) baseline = 0;
            } catch (android.content.pm.PackageManager.NameNotFoundException error) { baseline = BuildConfig.VERSION_CODE; }
            state.edit().putInt("seen", baseline).apply();
        }
        return state.getInt("seen", BuildConfig.VERSION_CODE);
    }
    static void markSeen(Context context) { context.getSharedPreferences("release_history", 0).edit().putInt("seen", BuildConfig.VERSION_CODE).apply(); }
    private ReleaseHistory() {}
}
