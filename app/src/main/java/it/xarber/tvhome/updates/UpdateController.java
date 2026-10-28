// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome.updates;

import android.app.DownloadManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.database.Cursor;
import android.net.ConnectivityManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.StatFs;
import android.provider.Settings;
import android.util.AtomicFile;
import androidx.core.app.NotificationCompat;
import io.github.jqssun.airplay.BuildConfig;
import it.xarber.tvhome.AppLanguage;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.net.URL;
import java.net.HttpURLConnection;
import javax.net.ssl.HttpsURLConnection;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/** Lifecycle-independent discovery/download state. Installation always requires an explicit user action. */
public final class UpdateController {
    private static UpdateController instance;
    public static synchronized UpdateController get(Context context){if(instance==null)instance=new UpdateController(context);return instance;}
    public final SharedPreferences preferences;
    public final String channel;
    public volatile UpdateCandidate candidate;
    public volatile String status="Not checked yet";
    public volatile boolean stale,checking,verifying,ready,foreground,installing;
    public volatile long downloaded,total=-1,speed;
    private final Context context;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final AtomicBoolean polling=new AtomicBoolean();
    private Runnable observer;
    private long previousBytes,previousSample;
    private final Runnable tick=new Runnable(){public void run(){refreshDownload();if(foreground&&downloadId()>=0&&!ready)main.postDelayed(this,1000);}};
    private UpdateController(Context value){
        context=value.getApplicationContext();preferences=context.getSharedPreferences("home_updates",0);channel=BuildConfig.UPDATE_CHANNEL;
        try{candidate=new UpdateCandidate(new JSONObject(preferences.getString("candidate","")));if(!compatible(candidate))candidate=null;}catch(Exception ignored){}
        long expected=preferences.getLong("install_expected",0);
        if(expected>0){
            if(BuildConfig.VERSION_CODE>=expected){status="Update installed successfully";preferences.edit().remove("install_expected").remove("install_session").putString("install_result",status).apply();clearDownload();}
            else status=preferences.getString("install_result","Installation needs confirmation");
        }
        if(candidate!=null)status="Cached update information";
    }
    public synchronized void observe(Runnable callback){observer=callback;}
    private void changed(){main.post(()->{Runnable callback; synchronized(this){callback=observer;}if(callback!=null)callback.run();});}
    public void resume(){foreground=true;main.removeCallbacks(tick);main.post(tick);if(preferences.getBoolean("auto_check",true))check(false);if(preferences.getBoolean("await_permission",false)&&ready&&context.getPackageManager().canRequestPackageInstalls()){preferences.edit().putBoolean("await_permission",false).apply();install();}}
    public void pause(){foreground=false;main.removeCallbacks(tick);}
    public boolean autoCheck(){return preferences.getBoolean("auto_check",true);}
    public boolean autoDownload(){return preferences.getBoolean("auto_download",false);}
    public boolean unmeteredOnly(){return preferences.getBoolean("unmetered",true);}
    public void toggle(String key){preferences.edit().putBoolean(key,!preferences.getBoolean(key,!key.equals("auto_download"))).apply();changed();}
    public long lastSuccess(){return preferences.getLong("last_success",0);}
    public long downloadId(){return preferences.getLong("download_id",-1);}
    public File apk(){File root=context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);return root==null?null:new File(root,"updates/MiTV-Home.apk");}
    public boolean managedStore(){try{String installer=Build.VERSION.SDK_INT>=30?context.getPackageManager().getInstallSourceInfo(context.getPackageName()).getInstallingPackageName():context.getPackageManager().getInstallerPackageName(context.getPackageName());return "com.android.vending".equals(installer)||"com.amazon.venezia".equals(installer)||"com.sec.android.app.samsungapps".equals(installer);}catch(Exception ignored){return false;}}
    public void openStore(){String uri="market://details?id="+context.getPackageName();try{context.startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(uri)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));}catch(Exception unavailable){status="Managed store unavailable on this device";changed();}}
    private boolean compatible(UpdateCandidate offer)throws Exception{return UpdatePolicy.accepts(BuildConfig.VERSION_CODE,offer.code,channel,offer.channel,BuildConfig.BUILD_VARIANT,offer.variant,Build.VERSION.SDK_INT,offer.minimumSdk,UpdateVerifier.installedSigner(context),offer.signer);}
    public synchronized void check(boolean manual){
        long now=System.currentTimeMillis();
        if(checking)return;
        if(now<preferences.getLong("rate_limit_until",0)){status="GitHub rate limit — try later";changed();return;}
        long last=preferences.getLong("last_attempt",0);if(!manual&&now>=last&&now-last<6*60*60*1000L)return;
        if(managedStore()){status="Updates are managed by your app store";changed();return;}
        checking=true;status="Checking for updates…";preferences.edit().putLong("last_attempt",now).apply();changed();
        worker.execute(()->{
            try{
                AtomicFile cache=new AtomicFile(new File(context.getFilesDir(),"update-releases.json"));
                String etag=preferences.getString("etag","");
                Reply reply=fetch("https://api.github.com/repos/"+UpdatePolicy.REPOSITORY+"/releases?per_page=30",etag,1_048_576);
                String list;
                if(reply.code==304){try(InputStream input=cache.openRead()){list=read(input,1_048_576);}}
                else{
                    list=reply.body;new JSONArray(list);
                    FileOutputStream output=null;try{output=cache.startWrite();output.write(list.getBytes(java.nio.charset.StandardCharsets.UTF_8));cache.finishWrite(output);}catch(Exception failure){if(output!=null)cache.failWrite(output);throw failure;}
                    preferences.edit().putString("etag",reply.etag).apply();
                }
                JSONArray releases=new JSONArray(list);UpdateCandidate newest=null;boolean signingMismatch=false,incomplete=false;
                for(int i=0;i<releases.length();i++){
                    JSONObject release=releases.getJSONObject(i);String tag=release.optString("tag_name");
                    if(release.optBoolean("draft")||!tag.startsWith("v")||!channel.equals("beta")&&release.optBoolean("prerelease"))continue;
                    JSONArray assets=release.optJSONArray("assets");if(assets==null)continue;
                    String manifest="";
                    for(int n=0;n<assets.length();n++){JSONObject asset=assets.getJSONObject(n);if(asset.optString("name").equals("update-manifest.json"))manifest=asset.optString("browser_download_url");}
                    if(!UpdatePolicy.manifestUrl(manifest,tag))continue;
                    UpdateCandidate offer;
                    try{offer=new UpdateCandidate(new JSONObject(fetch(manifest,"",65536).body));}catch(Exception invalid){incomplete=true;continue;}
                    if(!offer.tag.equals(tag)||!offer.channel.equals(release.optBoolean("prerelease")?"beta":"stable"))continue;
                    boolean actualAsset=false;for(int n=0;n<assets.length();n++){JSONObject asset=assets.getJSONObject(n);if(offer.url.equals(asset.optString("browser_download_url"))&&offer.size==asset.optLong("size"))actualAsset=true;}
                    if(!actualAsset)continue;
                    if(offer.code>BuildConfig.VERSION_CODE&&!offer.signer.equalsIgnoreCase(UpdateVerifier.installedSigner(context)))signingMismatch=true;
                    if(compatible(offer)&&(newest==null||offer.code>newest.code))newest=offer;
                }
                if(newest==null&&incomplete)throw new IOException("Incomplete release check");
                // Keep a download bound to its original manifest until it is cancelled/installed.
                if(downloadId()<0){candidate=newest;preferences.edit().putString("candidate",newest==null?"":newest.json.toString()).apply();}
                stale=false;preferences.edit().putLong("last_success",System.currentTimeMillis()).apply();
                status=candidate!=null?"Update available":signingMismatch?"Published update uses a different signing identity":"You’re up to date";
                if(candidate!=null&&autoDownload()&&downloadId()<0)download();
            }catch(Exception offline){stale=true;status=System.currentTimeMillis()<preferences.getLong("rate_limit_until",0)?"GitHub rate limit — try later":"Offline or check failed — cached information retained";}
            finally{checking=false;changed();}
        });
    }
    private static final class Reply{int code;String body="",etag="";}
    private Reply fetch(String address,String etag,int limit)throws Exception{
        HttpsURLConnection connection=(HttpsURLConnection)new URL(address).openConnection();
        connection.setConnectTimeout(15000);connection.setReadTimeout(20000);connection.setRequestProperty("User-Agent","MiTV-Home/"+BuildConfig.VERSION_NAME);
        connection.setRequestProperty("Accept","application/vnd.github+json");if(!etag.isEmpty())connection.setRequestProperty("If-None-Match",etag);
        try{
            Reply result=new Reply();result.code=connection.getResponseCode();
            if(result.code==403||result.code==429){long until=System.currentTimeMillis()+60*60*1000L;try{until=Math.max(until,Long.parseLong(connection.getHeaderField("X-RateLimit-Reset"))*1000);}catch(Exception ignored){}preferences.edit().putLong("rate_limit_until",Math.min(until,System.currentTimeMillis()+24*60*60*1000L)).apply();throw new IOException("Rate limit");}
            if(result.code!=200&&result.code!=304)throw new IOException("Release unavailable");
            String host=connection.getURL().getHost();if(!connection.getURL().getProtocol().equals("https")||!(host.equals("github.com")||host.equals("api.github.com")||host.equals("release-assets.githubusercontent.com")||host.equals("objects.githubusercontent.com")))throw new IOException("Unsafe redirect");
            if(result.code==200)try(InputStream input=connection.getInputStream()){result.body=read(input,limit);}
            String value=connection.getHeaderField("ETag");result.etag=value==null?"":value;return result;
        }finally{connection.disconnect();}
    }
    private static String read(InputStream input,int limit)throws Exception{ByteArrayOutputStream output=new ByteArrayOutputStream();byte[] bytes=new byte[8192];int count;while((count=input.read(bytes))!=-1){if(output.size()+count>limit)throw new IOException("Metadata too large");output.write(bytes,0,count);}return output.toString("UTF-8");}
    public synchronized void download(){
        if(candidate==null||downloadId()>=0||verifying)return;
        try{
            if(managedStore()){status="Updates are managed by your app store";changed();return;}
            File target=apk();if(target==null)throw new IOException("Update storage unavailable");
            if(!target.getParentFile().isDirectory()&&!target.getParentFile().mkdirs())throw new IOException("Update storage unavailable");
            if(new StatFs(target.getParent()).getAvailableBytes()<candidate.size*3+64*1024*1024L){status="Not enough storage for the update";changed();return;}
            if(target.exists()&&!target.delete())throw new IOException("Update storage unavailable");
            DownloadManager.Request request=new DownloadManager.Request(Uri.parse(candidate.url)).setTitle("Aurea Home "+candidate.version)
                .setDescription(AppLanguage.text(context,"Downloading update"))
                .setMimeType("application/vnd.android.package-archive").setDestinationUri(Uri.fromFile(target))
                .setAllowedOverMetered(!unmeteredOnly()).setAllowedOverRoaming(false).setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            long id=((DownloadManager)context.getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(request);
            ready=false;downloaded=0;total=candidate.size;speed=0;previousSample=0;
            preferences.edit().putLong("download_id",id).apply();status="Downloading update";main.removeCallbacks(tick);main.post(tick);changed();
        }catch(Exception failure){status="Download could not start — retry";changed();}
    }
    public void refreshDownload(){
        if(downloadId()<0||!polling.compareAndSet(false,true))return;
        final long requestId=downloadId();
        worker.execute(()->{
            try(Cursor cursor=((DownloadManager)context.getSystemService(Context.DOWNLOAD_SERVICE)).query(new DownloadManager.Query().setFilterById(requestId))){
                if(downloadId()!=requestId)return;
                if(cursor==null||!cursor.moveToFirst()){preferences.edit().remove("download_id").apply();ready=false;status="Download no longer available — retry";return;}
                int state=cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                downloaded=cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));total=cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                long now=android.os.SystemClock.elapsedRealtime();if(previousSample>0&&now>previousSample&&downloaded>=previousBytes)speed=(downloaded-previousBytes)*1000/(now-previousSample);previousBytes=downloaded;previousSample=now;
                if(state==DownloadManager.STATUS_SUCCESSFUL&&!ready){
                    verifying=true;status="Verifying update…";changed();
                    try{if(candidate==null)throw new IOException();UpdateVerifier.verify(context,apk(),candidate);if(downloadId()!=requestId)return;ready=true;status="Ready to install — Android confirmation required";}
                    catch(Exception unsafe){clearDownload();status="Update verification failed — download rejected";}
                    finally{verifying=false;}
                }else if(state==DownloadManager.STATUS_FAILED){clearDownload();status="Download failed — retry";}
                else if(state==DownloadManager.STATUS_PAUSED)status="Download paused — waiting for network";
                else if(!ready&&!verifying)status="Downloading update";
            }catch(Exception failure){status="Download status unavailable — retry";}
            finally{polling.set(false);changed();}
        });
    }
    public synchronized void cancel(){if(installing||preferences.getInt("install_session",-1)>=0){status="Installation needs confirmation";changed();return;}clearDownload();status="Download cancelled";changed();}
    private void clearDownload(){long id=downloadId();if(id>=0)try{((DownloadManager)context.getSystemService(Context.DOWNLOAD_SERVICE)).remove(id);}catch(Exception ignored){}preferences.edit().remove("download_id").remove("await_permission").apply();File file=apk();if(file!=null)file.delete();ready=false;downloaded=0;total=-1;speed=0;}
    public synchronized void install(){
        if(managedStore()){openStore();return;}
        if(!ready||candidate==null||!foreground||installing)return;
        int existing=preferences.getInt("install_session",-1);
        if(existing>=0){android.content.pm.PackageInstaller.SessionInfo info=context.getPackageManager().getPackageInstaller().getSessionInfo(existing);if(info!=null){try{context.startActivity(info.createDetailsIntent().addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));}catch(Exception unavailable){status="Installation needs confirmation";changed();}return;}preferences.edit().remove("install_session").remove("install_expected").apply();}
        if(!context.getPackageManager().canRequestPackageInstalls()){
            preferences.edit().putBoolean("await_permission",true).apply();status="Allow Aurea Home to install updates, then return";changed();
            try{context.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+context.getPackageName())).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));}catch(Exception unsupported){status="Installation permission screen unavailable";changed();}return;
        }
        preferences.edit().remove("await_permission").apply();installing=true;status="Preparing Android installer…";changed();
        worker.execute(()->{
            int id=-1;final long originalDownload=downloadId();
            try{
                UpdateVerifier.verify(context,apk(),candidate);PackageInstaller installer=context.getPackageManager().getPackageInstaller();
                PackageInstaller.SessionParams params=new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);params.setAppPackageName(context.getPackageName());params.setSize(candidate.size);
                if(Build.VERSION.SDK_INT>=31)params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED);
                id=installer.createSession(params);preferences.edit().putInt("install_session",id).putLong("install_expected",candidate.code).putString("install_result","Installation needs confirmation").apply();
                try(PackageInstaller.Session session=installer.openSession(id)){
                    java.security.MessageDigest digest=java.security.MessageDigest.getInstance("SHA-256");long copied=0;
                    try(InputStream input=new FileInputStream(apk());OutputStream output=session.openWrite("base.apk",0,candidate.size)){byte[] bytes=new byte[65536];int count;while((count=input.read(bytes))!=-1){output.write(bytes,0,count);digest.update(bytes,0,count);copied+=count;}session.fsync(output);}
                    if(copied!=candidate.size||!UpdateVerifier.hex(digest.digest()).equalsIgnoreCase(candidate.sha256)||downloadId()!=originalDownload)throw new IOException("Update changed while staging");
                    Intent callback=new Intent(context,UpdateInstallReceiver.class).setAction(context.getPackageName()+".UPDATE_INSTALL_RESULT");
                    PendingIntent result=PendingIntent.getBroadcast(context,id,callback,PendingIntent.FLAG_UPDATE_CURRENT|(Build.VERSION.SDK_INT>=31?PendingIntent.FLAG_MUTABLE:0));
                    session.commit(result.getIntentSender());
                }
                status="Installation needs confirmation";changed();
            }catch(Exception failure){if(id>=0)try{context.getPackageManager().getPackageInstaller().abandonSession(id);}catch(Exception ignored){}preferences.edit().remove("install_session").remove("install_expected").apply();status="Installation failed — retry";changed();}finally{installing=false;}
        });
    }
    public void installationResult(Intent intent){
        int expected=preferences.getInt("install_session",-1);
        if(expected<0||intent.getIntExtra(PackageInstaller.EXTRA_SESSION_ID,-2)!=expected)return;
        int result=intent.getIntExtra(PackageInstaller.EXTRA_STATUS,PackageInstaller.STATUS_FAILURE);
        if(result==PackageInstaller.STATUS_PENDING_USER_ACTION){
            Intent confirmation=intent.getParcelableExtra(Intent.EXTRA_INTENT);
            status="Installation needs confirmation";
            if(confirmation!=null){confirmation.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);if(foreground){try{context.startActivity(confirmation);}catch(Exception unavailable){status="Open Updates to complete installation";}}
                else{NotificationManager notifications=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);notifications.createNotificationChannel(new NotificationChannel("home_updates","Aurea Home updates",NotificationManager.IMPORTANCE_DEFAULT));PendingIntent action=PendingIntent.getActivity(context,expected,confirmation,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);try{notifications.notify(1601,new NotificationCompat.Builder(context,"home_updates").setSmallIcon(android.R.drawable.stat_sys_download_done).setContentTitle("Aurea Home").setContentText(AppLanguage.text(context,"Installation needs confirmation")).setContentIntent(action).setAutoCancel(true).build());}catch(SecurityException ignored){}}
            }
        }else{
            status=result==PackageInstaller.STATUS_SUCCESS?"Update installed successfully":result==PackageInstaller.STATUS_FAILURE_ABORTED?"Installation cancelled — retry":result==PackageInstaller.STATUS_FAILURE_STORAGE?"Not enough storage for the update":result==PackageInstaller.STATUS_FAILURE_CONFLICT?"Update signing identity mismatch":result==PackageInstaller.STATUS_FAILURE_BLOCKED?"Installation blocked by Android settings":"Installation failed — retry";
            preferences.edit().remove("install_session").putString("install_result",status).apply();
            if(result!=PackageInstaller.STATUS_SUCCESS)preferences.edit().remove("install_expected").apply();else clearDownload();
        }
        preferences.edit().putString("install_result",status).apply();changed();
    }
}
