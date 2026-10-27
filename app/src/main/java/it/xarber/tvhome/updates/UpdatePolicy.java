// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome.updates;

import java.net.URI;
import java.util.Locale;

/** Platform-independent trust/channel/version rules, shared with adversarial host checks. */
public final class UpdatePolicy {
    public static final String REPOSITORY = "Xarber/MiTV-Home";
    public static boolean accepts(long installed, long offered, String channel, String releaseChannel,
            String variant, String releaseVariant, int sdk, int minimumSdk, String signer, String expectedSigner) {
        return offered > installed && offered <= 2_100_000_000L && minimumSdk >= 26 && minimumSdk <= sdk
            && (releaseChannel.equals("stable") || channel.equals("beta") && releaseChannel.equals("beta"))
            && variant.equals(releaseVariant) && digest(signer) && signer.equalsIgnoreCase(expectedSigner);
    }
    public static boolean digest(String value) { return value != null && value.matches("[0-9a-fA-F]{64}"); }
    public static boolean assetUrl(String value, String tag) {
        try {
            URI uri = new URI(value);
            return uri.getScheme().equals("https") && "github.com".equals(uri.getHost()) && uri.getPort() == -1
                && uri.getUserInfo() == null && uri.getQuery() == null && uri.getFragment() == null
                && uri.getRawPath().startsWith("/" + REPOSITORY + "/releases/download/" + tag + "/")
                && !value.contains("%") && !value.contains("..") && tag.matches("v[0-9A-Za-z.-]+")
                && uri.getPath().endsWith(".apk") && uri.getPath().contains("-android-universal-");
        } catch (Exception invalid) { return false; }
    }
    public static boolean manifestUrl(String value, String tag) {
        return tag.matches("v[0-9A-Za-z.-]+") && value.equals("https://github.com/" + REPOSITORY + "/releases/download/" + tag + "/update-manifest.json");
    }
    public static String normalizeSigner(String value) { return value.replace(":", "").toLowerCase(Locale.ROOT); }
    private UpdatePolicy() {}
}
