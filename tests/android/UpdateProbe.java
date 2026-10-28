// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome.updates;
import android.content.Context;
import java.io.File;
import java.nio.file.Files;
import org.json.JSONObject;

/** Real APK verification only. Does not install, alter preferences, or inject production update state. */
public final class UpdateProbe {
    public static void main(String[] args)throws Exception{
        android.os.Looper.prepareMainLooper();
        Class<?> thread=Class.forName("android.app.ActivityThread");Object main=thread.getMethod("systemMain").invoke(null);
        Context system=(Context)thread.getMethod("getSystemContext").invoke(main);
        Context context=system.createPackageContext("it.xarber.mitvhome",0);
        JSONObject local=new JSONObject(new String(Files.readAllBytes(new File(args[0]).toPath()),java.nio.charset.StandardCharsets.UTF_8));
        UpdateVerifier.verify(context,new File(args[1]),new UpdateCandidate(local));
        JSONObject wrongHash=new JSONObject(local.toString());wrongHash.getJSONObject("apk").put("sha256",new String(new char[64]).replace('\0','0'));
        rejected(context,new File(args[1]),new UpdateCandidate(wrongHash),"checksum");
        JSONObject published=new JSONObject(new String(Files.readAllBytes(new File(args[2]).toPath()),java.nio.charset.StandardCharsets.UTF_8));
        rejected(context,new File(args[3]),new UpdateCandidate(published),"signing identity");
        JSONObject metadata=new JSONObject(local.toString()).put("tag","sources-v1.0");
        try{new UpdateCandidate(metadata);throw new AssertionError("Metadata tag accepted");}catch(AssertionError failed){throw failed;}catch(Exception expected){}
        System.out.println("PASS: physical Android actual matching APK, wrong hash, public-key mismatch and metadata-tag rejection; no installation performed");
    }
    static void rejected(Context context,File file,UpdateCandidate candidate,String reason)throws Exception{
        try{UpdateVerifier.verify(context,file,candidate);throw new AssertionError("Unsafe APK accepted");}
        catch(AssertionError failed){throw failed;}catch(Exception expected){if(!expected.getMessage().toLowerCase(java.util.Locale.ROOT).contains(reason))throw expected;}
    }
}
