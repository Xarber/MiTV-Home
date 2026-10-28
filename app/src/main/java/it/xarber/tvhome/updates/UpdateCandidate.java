// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome.updates;

import org.json.JSONArray;
import org.json.JSONObject;

/** Validated public release metadata. Never accepts draft Actions artifacts or arbitrary URLs. */
public final class UpdateCandidate {
    public final String version, channel, variant, tag, commit, url, sha256, signer;
    public final long code, size;
    public final int minimumSdk;
    public final boolean critical;
    public final JSONObject notes;
    public final JSONObject json;
    public UpdateCandidate(JSONObject object) throws Exception {
        if(object.getInt("schema")!=1||!object.getString("package").equals("it.xarber.mitvhome"))throw new Exception("manifest");
        version=object.getString("version"); code=object.getLong("code"); channel=object.getString("channel");
        variant=object.getString("variant");tag=object.getString("tag");commit=object.getString("commit");
        minimumSdk=object.getInt("minimumSdk");critical=object.optBoolean("critical",false);
        JSONObject apk=object.getJSONObject("apk");url=apk.getString("url");size=apk.getLong("size");
        sha256=apk.getString("sha256");signer=UpdatePolicy.normalizeSigner(apk.getString("signerSha256"));
        if(!version.matches("[0-9]+\\.[0-9]+\\.[0-9]+")||code<=0||code>2_100_000_000L||!commit.matches("[0-9a-f]{40}")
            ||!UpdatePolicy.assetUrl(url,tag)||size<1024||size>300_000_000||!UpdatePolicy.digest(sha256)||!UpdatePolicy.digest(signer)
            ||!variant.equals("github-extended")||!(channel.equals("stable")||channel.equals("beta")))throw new Exception("manifest");
        String expectedTag="v"+version+(channel.equals("beta")?"-beta."+code+"."+commit.substring(0,7):"");
        if(!tag.equals(expectedTag))throw new Exception("tag");
        notes=object.getJSONObject("release");
        if(!notes.getString("version").equals(version)||notes.getLong("code")!=code)throw new Exception("notes");
        JSONArray features=notes.getJSONArray("features");if(features.length()<1||features.length()>8)throw new Exception("features");
        for(int i=0;i<features.length();i++){
            JSONObject feature=features.getJSONObject(i);
            if(!feature.getString("icon").matches("code|history|transfer|sound|remote|controls|apps|inputs|airplay|info|shield"))throw new Exception("icon");
            localized(feature.getJSONObject("label"),160);localized(feature.getJSONObject("detail"),1500);
        }
        localized(notes.getJSONObject("fixes"),2500);localized(notes.getJSONObject("compatibility"),1500);
        json=object;
    }
    private static void localized(JSONObject object,int limit)throws Exception{
        for(String language:new String[]{"en","it"}){String value=object.getString(language);if(value.isEmpty()||value.length()>limit)throw new Exception("text");}
    }
}
