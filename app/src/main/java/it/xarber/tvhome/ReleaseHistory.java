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
    static String changesSince(Context context, int previous) {
        StringBuilder text = new StringBuilder(); JSONArray releases = entries(context);
        for (int i = 0; i < releases.length(); i++) {
            JSONObject release = releases.optJSONObject(i);
            if (release == null || release.optInt("code") <= previous || release.optInt("code") > BuildConfig.VERSION_CODE) continue;
            if (text.length() > 0) text.append("\n\n");
            text.append(release.optString("version")).append(" · ").append(release.optString("date"));
            text.append("\n✦ ").append(localized(context, release, "highlights"));
            text.append("\n\n").append(AppLanguage.text(context, "Fixes & Improvements")).append("\n• ").append(localized(context, release, "fixes"));
        }
        return text.toString();
    }
    static String updateSummary(Context context, int previous) {
        JSONArray releases=entries(context);JSONObject latest=releases.optJSONObject(0);
        if(latest==null)return "";
        String summary=latest.optString("version")+"\n✦ "+localized(context,latest,"highlights")+"\n\n"+AppLanguage.text(context,"Fixes & Improvements")+"\n• "+localized(context,latest,"fixes");
        int skipped=0;for(int i=1;i<releases.length();i++){JSONObject release=releases.optJSONObject(i);if(release!=null&&release.optInt("code")>previous)skipped++;}
        if(skipped>0)summary+="\n\n"+String.format(java.util.Locale.getDefault(),AppLanguage.text(context,"Includes %d earlier updates in the full changelog"),skipped);
        return summary;
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
