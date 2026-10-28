// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome.updates;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.zip.ZipFile;

public final class UpdateVerifier {
    static int signatureFlags(){return Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES|PackageManager.GET_SIGNATURES:PackageManager.GET_SIGNATURES;}
    static Signature[] signatures(PackageInfo info){return Build.VERSION.SDK_INT>=28&&info.signingInfo!=null?info.signingInfo.getApkContentsSigners():info.signatures;}
    public static long code(PackageInfo info){return Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode;}
    static String hex(byte[] bytes){StringBuilder result=new StringBuilder();for(byte value:bytes)result.append(String.format(java.util.Locale.ROOT,"%02x",value&255));return result.toString();}
    public static String installedSigner(Context context)throws Exception{
        Signature[] values=signatures(context.getPackageManager().getPackageInfo(context.getPackageName(),signatureFlags()));
        if(values==null||values.length!=1)throw new Exception("Unsupported signing identity");
        return hex(MessageDigest.getInstance("SHA-256").digest(values[0].toByteArray()));
    }
    public static void verify(Context context, File file, UpdateCandidate candidate)throws Exception{
        if(!file.isFile()||file.length()!=candidate.size)throw new Exception("Download size mismatch");
        MessageDigest hash=MessageDigest.getInstance("SHA-256");
        try(FileInputStream input=new FileInputStream(file)){byte[] bytes=new byte[65536];int count;while((count=input.read(bytes))!=-1)hash.update(bytes,0,count);}
        if(!hex(hash.digest()).equalsIgnoreCase(candidate.sha256))throw new Exception("Update checksum mismatch");
        PackageManager manager=context.getPackageManager();PackageInfo archive=manager.getPackageArchiveInfo(file.getAbsolutePath(),signatureFlags());
        PackageInfo installed=manager.getPackageInfo(context.getPackageName(),signatureFlags());
        if(archive==null||!context.getPackageName().equals(archive.packageName)||!candidate.version.equals(archive.versionName)
            ||code(archive)!=candidate.code||code(archive)<=code(installed)||archive.applicationInfo==null
            ||archive.applicationInfo.minSdkVersion>Build.VERSION.SDK_INT)throw new Exception("Incompatible update package");
        Signature[] current=signatures(installed),offered=signatures(archive);
        if(current==null||offered==null||current.length!=1||offered.length!=1
            ||!Arrays.equals(current[0].toByteArray(),offered[0].toByteArray())
            ||!installedSigner(context).equalsIgnoreCase(candidate.signer))throw new Exception("Update signing identity mismatch");
        boolean abi=false;
        try(ZipFile zip=new ZipFile(file)){for(String architecture:Build.SUPPORTED_ABIS)if(zip.getEntry("lib/"+architecture+"/libairplay_native.so")!=null)abi=true;}
        if(!abi)throw new Exception("Unsupported update architecture");
    }
    private UpdateVerifier(){}
}
