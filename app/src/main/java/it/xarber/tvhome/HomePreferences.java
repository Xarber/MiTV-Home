// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;

/** Portable presentation preferences only. Never exports receiver identity, credentials or tokens. */
final class HomePreferences {
    static String export(Context context, SharedPreferences preferences) throws Exception {
        JSONObject values = new JSONObject();
        for (String key : new String[]{"input-dock-pin", "dock-pins", "input-profile-1", "input-profile-2", "input-profile-3", "wallpaper"})
            if (preferences.contains(key)) values.put(key, preferences.getString(key, ""));
        values.put("blur-enabled", preferences.getBoolean("blur-enabled", true));
        values.put("wallpaper-motion", preferences.getBoolean("wallpaper-motion", false));
        values.put("activity-background", preferences.getBoolean("activity-background", true));
        return new JSONObject().put("schema", 1).put("language", AppLanguage.code(context)).put("home", values).toString(2);
    }
    static String readAndValidate(InputStream input) throws Exception {
        if (input == null) throw new IOException("No document");
        ByteArrayOutputStream output = new ByteArrayOutputStream(); byte[] bytes = new byte[1024]; int count;
        while ((count = input.read(bytes)) != -1) { if (output.size() + count > 16_384) throw new IOException("Document too large"); output.write(bytes, 0, count); }
        String text = output.toString("UTF-8"); validate(new JSONObject(text)); return text;
    }
    private static void validate(JSONObject backup) throws Exception {
        if (backup.getInt("schema") != 1) throw new IOException("Unsupported schema");
        if (!Arrays.asList("it", "en").contains(backup.getString("language"))) throw new IOException("Invalid language");
        JSONObject home = backup.getJSONObject("home");
        java.util.Iterator<String> keys = home.keys();
        while (keys.hasNext()) {
            String key = keys.next(); Object value = home.get(key);
            if (key.equals("wallpaper")) { if (!(value instanceof String) || !WallpaperArt.valid((String)value)) throw new IOException("Invalid wallpaper"); }
            else if (key.equals("blur-enabled") || key.equals("activity-background") || key.equals("wallpaper-motion")) { if (!(value instanceof Boolean)) throw new IOException("Invalid appearance"); }
            else if (key.matches("input-profile-[123]")) { if (!(value instanceof String) || !Arrays.asList("generic", "nintendo", "gaming", "appletv", "nintendoswitch", "playstation", "xbox", "wiiu").contains(value)) throw new IOException("Invalid profile"); }
            else if (key.equals("input-dock-pin")) { if (!(value instanceof String) || !validKey((String)value, false)) throw new IOException("Invalid dock"); }
            else if (key.equals("dock-pins")) {
                if (!(value instanceof String)) throw new IOException("Invalid dock");
                JSONArray pins = new JSONArray((String)value); if (pins.length() > 5) throw new IOException("Too many pins");
                for (int i = 0; i < pins.length(); i++) if (!(pins.get(i) instanceof String) || !validKey(pins.getString(i), i == 4)) throw new IOException("Invalid pin");
            } else throw new IOException("Unknown preference");
        }
    }
    private static boolean validKey(String value, boolean libraryAllowed) {
        return value.length() <= 250 && value.matches("[A-Za-z0-9_.$/:;-]*") && (libraryAllowed || !value.equals("library"));
    }
    static void restore(Context context, SharedPreferences preferences, String text) throws Exception {
        JSONObject backup = new JSONObject(text); validate(backup);
        // Commit a recoverable previous presentation state before replacing any values.
        if (!context.getSharedPreferences("home_restore", 0).edit().putString("previous", export(context, preferences)).commit()) throw new IOException("Backup failed");
        JSONObject values = backup.getJSONObject("home"); SharedPreferences.Editor editor = preferences.edit();
        for (String key : new String[]{"input-dock-pin", "dock-pins", "input-profile-1", "input-profile-2", "input-profile-3", "blur-enabled", "activity-background", "wallpaper", "wallpaper-motion"}) editor.remove(key);
        java.util.Iterator<String> keys = values.keys();
        while (keys.hasNext()) { String key = keys.next(); Object value = values.get(key); if (value instanceof Boolean) editor.putBoolean(key, (Boolean)value); else editor.putString(key, (String)value); }
        if (!editor.commit()) throw new IOException("Could not save preferences");
        AppLanguage.set(context, backup.getString("language"));
    }
    private HomePreferences() {}
}
