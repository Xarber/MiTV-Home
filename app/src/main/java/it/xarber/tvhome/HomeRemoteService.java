// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import java.lang.ref.WeakReference;
import java.util.concurrent.FutureTask;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

/** Persistent authenticated bridge. Phone/web clients share the same API and trust. */
public final class HomeRemoteService extends Service {
    private static volatile HomeRemoteService instance;
    private static WeakReference<LegacyHomeActivity> visibleHome=new WeakReference<>(null);
    private static final String CHANNEL="aurea.phone-remote",STOP="aurea.remote.STOP";
    private final Handler main=new Handler(Looper.getMainLooper());
    private HomeRemoteServer server;
    private SystemRemoteController system;
    private RemoteCatalog catalog;
    private volatile RemotePlayback playback;
    private volatile String pendingLaunch;
    private volatile long launchDeadline;
    private final Runnable monitor=new Runnable(){public void run(){if(playback!=null)playback.clients(server!=null&&server.hasActiveRemote());main.postDelayed(this,5000);}};

    static synchronized void attach(LegacyHomeActivity home){visibleHome=new WeakReference<>(home);HomeRemoteService service=instance;if(service!=null&&service.pendingLaunch!=null&&SystemClock.elapsedRealtime()<service.launchDeadline){String target=service.pendingLaunch;service.pendingLaunch=null;service.main.post(()->{if(home.resumed)service.catalog.launch(home,target);});}}
    static synchronized void attachExpo(MainActivity home){HomeRemoteService service=instance;if(service!=null&&service.pendingLaunch!=null&&SystemClock.elapsedRealtime()<service.launchDeadline){String target=service.pendingLaunch;service.pendingLaunch=null;service.main.post(()->service.catalog.launch(home,target));}}
    static synchronized void detach(LegacyHomeActivity home){if(visibleHome.get()==home)visibleHome.clear();}
    private static synchronized LegacyHomeActivity home(){LegacyHomeActivity activity=visibleHome.get();return activity!=null&&activity.resumed?activity:null;}
    static RemotePlayback sharedPlayback(){HomeRemoteService service=instance;return service==null?null:service.playback;}
    static HomeRemoteServer server(){HomeRemoteService value=instance;return value==null?null:value.server;}
    static boolean enabled(Context context){return context.getSharedPreferences("phone_remote",MODE_PRIVATE).getBoolean("enabled",true);}
    static void ensure(Context context){if(!enabled(context))return;try{context.startForegroundService(new Intent(context,HomeRemoteService.class));}catch(Exception failure){android.util.Log.w("MiTVPairing","remote_service_start_failed "+failure.getClass().getSimpleName());}}
    static void enable(Context context){context.getSharedPreferences("phone_remote",MODE_PRIVATE).edit().putBoolean("enabled",true).apply();ensure(context);}

    @Override public void onCreate(){
        super.onCreate();instance=this;
        NotificationManager notifications=getSystemService(NotificationManager.class);notifications.createNotificationChannel(new NotificationChannel(CHANNEL,"Aurea phone remote",NotificationManager.IMPORTANCE_LOW));
        Intent open=new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content=PendingIntent.getActivity(this,71,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        PendingIntent stop=PendingIntent.getService(this,72,new Intent(this,HomeRemoteService.class).setAction(STOP),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification notification=new Notification.Builder(this,CHANNEL).setSmallIcon(io.github.jqssun.airplay.R.drawable.ic_launcher_monochrome).setContentTitle("Aurea Home").setContentText("Phone remote available").setContentIntent(content).setOngoing(true).addAction(new Notification.Action.Builder(null,"Stop remote",stop).build()).build();
        if(Build.VERSION.SDK_INT>=29)startForeground(1843,notification,ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);else startForeground(1843,notification);
        catalog=new RemoteCatalog(this);system=new SystemRemoteController(this);playback=new RemotePlayback(this);playback.start();
        try{
            server=new HomeRemoteServer(this,new HomeRemoteServer.Commands(){
                @Override public void run(String event){main.post(()->{if(event.equals("paired"))playback.clients(true);if(TVPlatform.foreground()){TVPlatform.remoteEvent(event,server);return;}LegacyHomeActivity activity=home();if(activity==null)return;if(event.equals("pair-request"))activity.showRemoteCode();else if(event.equals("paired"))activity.remotePaired();});}
                @Override public JSONObject request(String operation,JSONObject payload)throws Exception{return handle(operation,payload);}
            });server.start();main.post(monitor);
        }catch(Exception failure){android.util.Log.w("MiTVPairing","remote_service_unavailable "+failure.getClass().getSimpleName());server=null;stopSelf();}
    }
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        if(intent!=null&&STOP.equals(intent.getAction())){getSharedPreferences("phone_remote",MODE_PRIVATE).edit().putBoolean("enabled",false).apply();stopSelf();return START_NOT_STICKY;}
        return START_STICKY;
    }
    @Override public IBinder onBind(Intent intent){return null;}
    @Override public void onDestroy(){main.removeCallbacks(monitor);if(server!=null)server.stop();if(playback!=null)playback.close();if(system!=null){SystemRemoteController closing=system;new Thread(closing::close,"AureaRemoteClose").start();}server=null;if(instance==this)instance=null;super.onDestroy();}
    private JSONObject handle(String operation,JSONObject payload)throws Exception{
        main.post(()->{if(playback!=null)playback.clients(server!=null&&server.hasActiveRemote());});
        if(operation.equals("state"))return new JSONObject().put("schema",1).put("name",DeviceName.read(this)).put("observedAt",System.currentTimeMillis()).put("homeActive",home()!=null||TVPlatform.foreground()).put("systemRemote",system.state()).put("music",playback.state());
        if(operation.equals("catalog"))return catalog.read();
        if(operation.equals("icon"))return catalog.icon(payload.optString("id"));
        if(operation.equals("artwork")){playback.state();JSONObject art=playback.artwork();return payload.optString("id").equals(art.optString("id"))?art:SystemRemoteController.error("source_changed");}
        if(operation.equals("system_pair_begin"))return system.request("pair_begin",new JSONObject());
        if(operation.equals("system_pair_finish"))return system.request("pair_finish",new JSONObject().put("pin",payload.optString("pin")));
        if(operation.equals("media"))return onMain(()->playback.command(payload));
        if(operation.equals("launch")){
            String id=payload.optString("id");if(id.length()>512||!catalog.contains(id))return SystemRemoteController.error("unknown_target");
            if(TVPlatform.foreground())return onMain(()->catalog.launch(TVPlatform.get(this),id));
            if(command.equals("control"))return SystemRemoteController.error("home_required");
        if(home()!=null)return onMain(()->{LegacyHomeActivity activity=home();if(activity==null)return SystemRemoteController.error("home_changed");catalog.launch(activity,id);return accepted();});
            android.content.pm.ResolveInfo defaultHome=getPackageManager().resolveActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),android.content.pm.PackageManager.MATCH_DEFAULT_ONLY);
            if(!Settings.canDrawOverlays(this)&&(defaultHome==null||defaultHome.activityInfo==null||!getPackageName().equals(defaultHome.activityInfo.packageName)))return SystemRemoteController.error("set_default_home");
            pendingLaunch=id;launchDeadline=SystemClock.elapsedRealtime()+12000;JSONObject result=key("home");if(result.has("error"))pendingLaunch=null;return result;
        }
        if(operation.equals("key"))return key(payload.optString("command"));
        return SystemRemoteController.error("unsupported");
    }
    private JSONObject key(String command)throws Exception{
        if(!command.matches("up|down|left|right|ok|back|home|volumeup|volumedown|playpause|next|previous|menu|control"))return SystemRemoteController.error("unsupported");
        if(TVPlatform.foreground())return TVPlatform.remoteKey(command);
        if(home()!=null)return onMain(()->{LegacyHomeActivity activity=home();if(activity==null)return SystemRemoteController.error("home_changed");activity.remoteCommand(command);return accepted();});
        if(command.equals("home")){
            android.content.pm.ResolveInfo resolved=getPackageManager().resolveActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),android.content.pm.PackageManager.MATCH_DEFAULT_ONLY);
            boolean ownHome=resolved!=null&&resolved.activityInfo!=null&&getPackageName().equals(resolved.activityInfo.packageName);
            if(ownHome||Settings.canDrawOverlays(this))return onMain(()->{startActivity(new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_REORDER_TO_FRONT));return accepted();});
        }
        JSONObject result=system.state().optBoolean("paired")?system.request("key",new JSONObject().put("command",command)):SystemRemoteController.error("system_pairing_required");
        if(!result.has("error"))return result;
        // Capability-based fallback, never replay global navigation into another app.
        if(command.equals("home")&&Settings.canDrawOverlays(this)){main.post(()->startActivity(new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP)));return accepted();}
        if(command.equals("volumeup")||command.equals("volumedown")){AudioManager audio=(AudioManager)getSystemService(AUDIO_SERVICE);audio.adjustStreamVolume(AudioManager.STREAM_MUSIC,command.equals("volumeup")?AudioManager.ADJUST_RAISE:AudioManager.ADJUST_LOWER,AudioManager.FLAG_SHOW_UI);return accepted();}
        return result.optString("error").equals("authentication_failed")?SystemRemoteController.error("system_pairing_required"):result;
    }
    private JSONObject onMain(java.util.concurrent.Callable<JSONObject> task){
        FutureTask<JSONObject> future=new FutureTask<>(task);try{main.post(future);return future.get(3,TimeUnit.SECONDS);}catch(Exception unavailable){future.cancel(false);return SystemRemoteController.error("busy");}
    }
    private static JSONObject accepted(){try{return new JSONObject().put("accepted",true);}catch(Exception ignored){return new JSONObject();}}
}
