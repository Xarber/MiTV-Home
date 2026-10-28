// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiManager;
import android.provider.Settings;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import io.github.jqssun.airplay.BuildConfig;
import it.xarber.tvhome.playback.PairedPlayback;
import it.xarber.tvhome.updates.UpdateController;
import org.json.JSONArray;
import org.json.JSONObject;
import java.lang.ref.WeakReference;
import java.net.NetworkInterface;
import java.net.Inet4Address;
import java.util.Collections;

/** Android capabilities behind the Expo interface. No view or example data is owned here. */
public final class TVPlatform {
    private static TVPlatform shared;
    private static WeakReference<Activity> activity=new WeakReference<>(null);
    private static volatile boolean foreground;
    public static synchronized TVPlatform get(Context context){if(shared==null)shared=new TVPlatform(context.getApplicationContext());return shared;}
    public static boolean foreground(){return foreground&&activity.get()!=null;}
    private final Context context;
    private final SharedPreferences prefs;
    final TVHomeCatalog catalog;
    private final RemotePlayback playback;
    private final PairedPlayback paired;
    private final UpdateController updates;
    private Bitmap paletteArtwork;
    private JSONArray palette=new JSONArray().put("#e6eaf0").put("#929aa8");
    private final Handler main=new Handler(Looper.getMainLooper());
    private TVPlatform(Context context){this.context=context;prefs=context.getSharedPreferences("it.xarber.tvhome.MainActivity",0);catalog=new TVHomeCatalog(context,prefs);paired=PairedPlayback.get(context);playback=new RemotePlayback(context,false);if(!BuildConfig.APPLICATION_ID.endsWith(".preview"))playback.start();updates=UpdateController.get(context);}
    public void resume(Activity host){activity=new WeakReference<>(host);foreground=true;paired.resume();if(!BuildConfig.MOBILE_REMOTE){updates.observe(this::notifyUpdate);updates.resume();}if(!BuildConfig.MOBILE_REMOTE&&!BuildConfig.APPLICATION_ID.endsWith(".preview")){HomeRemoteService.ensure(context);ensureReceiver();}}
    public void pause(Activity host){if(activity.get()!=host)return;foreground=false;paired.pause();updates.pause();}
    private void ensureReceiver(){context.getSharedPreferences("settings",0).edit().putBoolean("auto_start",true).putBoolean("boot_auto_start",true).putBoolean("run_in_background",true).putBoolean("launch_on_connect",true).putBoolean("auto_fullscreen",true).apply();try{context.startForegroundService(new Intent(context,io.github.jqssun.airplay.service.AirPlayService.class).setAction(io.github.jqssun.airplay.service.AirPlayService.ACTION_START_SERVER));}catch(Exception failure){AureaTVModule.event("notice",safe("message","AirPlay service could not start"));}}
    static JSONObject safe(String key,Object value){JSONObject result=new JSONObject();try{result.put(key,value);}catch(Exception ignored){}return result;}
    public static boolean key(KeyEvent event){if(!foreground()||!AureaTVModule.listening())return false;String key;
        switch(event.getKeyCode()){case KeyEvent.KEYCODE_DPAD_UP:key="up";break;case KeyEvent.KEYCODE_DPAD_DOWN:key="down";break;case KeyEvent.KEYCODE_DPAD_LEFT:key="left";break;case KeyEvent.KEYCODE_DPAD_RIGHT:key="right";break;case KeyEvent.KEYCODE_ENTER:case KeyEvent.KEYCODE_NUMPAD_ENTER:case KeyEvent.KEYCODE_DPAD_CENTER:key="select";break;case KeyEvent.KEYCODE_ESCAPE:case KeyEvent.KEYCODE_BACK:key="back";break;case KeyEvent.KEYCODE_MENU:key="control";break;case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:key="playpause";break;default:return false;}
        JSONObject value=safe("key",key);try{value.put("phase",event.getAction()==KeyEvent.ACTION_UP?"up":"down").put("repeat",event.getRepeatCount()).put("long",event.isLongPress());}catch(Exception ignored){}AureaTVModule.event("key",value);return true;
    }
    static JSONObject remoteKey(String key)throws Exception{if(!foreground()||!AureaTVModule.listening())return SystemRemoteController.error("home_not_ready");
        if(key.equals("home")){AureaTVModule.event("home",new JSONObject());return safe("accepted",true);}
        if(key.equals("volumeup")||key.equals("volumedown")){AudioManager audio=activity.get().getSystemService(AudioManager.class);audio.adjustStreamVolume(AudioManager.STREAM_MUSIC,key.equals("volumeup")?AudioManager.ADJUST_RAISE:AudioManager.ADJUST_LOWER,0);return safe("accepted",true);}
        if(key.equals("next")||key.equals("previous")){TVPlatform platform=get(activity.get());JSONObject state=platform.playback.state();return platform.playback.command(new JSONObject().put("source",state.optString("source")).put("action",key));}
        String translated=key.equals("ok")?"select":key;AureaTVModule.event("key",new JSONObject().put("key",translated).put("phase","down").put("repeat",0));AureaTVModule.event("key",new JSONObject().put("key",translated).put("phase","up").put("repeat",0));return safe("accepted",true);
    }
    static void remoteEvent(String event,HomeRemoteServer server){if(!foreground())return;JSONObject value=new JSONObject();try{if(event.equals("pair-request"))value.put("pin",server.pin()).put("origin",server.requestingOrigin());}catch(Exception ignored){}AureaTVModule.event(event,value);}
    JSONObject snapshot(boolean refresh)throws Exception{
        main.post(this::notifyUpdate);JSONObject result=new JSONObject().put("schema",1).put("catalog",catalog.read(refresh));
        JSONObject preferences=new JSONObject().put("dock",catalog.dock()).put("wallpaper",prefs.getString("wallpaper","classic")).put("motion",prefs.getBoolean("wallpaper-motion",false)).put("glass",prefs.getBoolean("activity-background",true)).put("language",AppLanguage.code(context));
        AudioManager audio=context.getSystemService(AudioManager.class);int maximum=audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC);int volume=Math.round(100f*audio.getStreamVolume(AudioManager.STREAM_MUSIC)/Math.max(1,maximum));
        JSONObject music=playback.state();Bitmap cover=playback.cover();if(cover!=paletteArtwork){paletteArtwork=cover;palette=new JSONArray();for(int color:WavePalette.from(cover))palette.put(String.format(java.util.Locale.US,"#%06x",color&0xffffff));}music.put("colors",palette);HomeRemoteServer remote=HomeRemoteService.server();
        result.put("preferences",preferences).put("music",music).put("network",network()).put("volume",volume).put("remoteConnected",remote!=null&&remote.hasActiveRemote()).put("paired",pairedState()).put("updates",updateState())
          .put("releasePending",ReleaseHistory.previousVersion(context)<BuildConfig.VERSION_CODE).put("build",new JSONObject().put("version",BuildConfig.VERSION_NAME).put("code",BuildConfig.VERSION_CODE).put("commit",BuildConfig.SOURCE_COMMIT).put("channel",BuildConfig.BUILD_CHANNEL));
        return result;
    }
    private JSONObject network(){JSONObject value=new JSONObject();try{
        ConnectivityManager manager=context.getSystemService(ConnectivityManager.class);NetworkCapabilities capabilities=manager.getNetworkCapabilities(manager.getActiveNetwork());boolean connected=capabilities!=null;boolean wifi=connected&&capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI);
        value.put("namePermissionGranted",context.checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)==android.content.pm.PackageManager.PERMISSION_GRANTED).put("locationEnabled",android.os.Build.VERSION.SDK_INT>=28&&context.getSystemService(android.location.LocationManager.class)!=null&&context.getSystemService(android.location.LocationManager.class).isLocationEnabled());
        value.put("connected",connected).put("transport",wifi?"wifi":connected&&capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)?"ethernet":"none");
        if(wifi){String ssid=context.getSystemService(WifiManager.class).getConnectionInfo().getSSID();if(ssid!=null&&!ssid.equals("<unknown ssid>")&&!ssid.equals("0x"))value.put("title",ssid.replaceAll("^\"|\"$",""));}
        value.put("observedAt",System.currentTimeMillis());
    }catch(Exception ignored){}return value;}
    private JSONObject pairedState()throws Exception{return new JSONObject().put("paired",paired.paired()).put("name",paired.name()).put("pending",paired.pairingPending()).put("remaining",paired.pairingRemaining()).put("busy",paired.busy()).put("storageError",paired.storageError()).put("input",catalog.inputKey(context.getSharedPreferences("paired_device_ui",0).getString("input_id","")));}
    private void notifyUpdate(){if(!foreground()||!AureaTVModule.listening())return;it.xarber.tvhome.updates.UpdateCandidate offer=updates.candidate;if(offer!=null&&!updates.checking&&!updates.stale&&!updates.preferences.getString("notified","").equals(offer.tag)){AureaTVModule.event("notice",safe("message",AppLanguage.text(context,"Update available — open About")));updates.preferences.edit().putString("notified",offer.tag).apply();}}
    private JSONObject updateState()throws Exception{JSONObject value=new JSONObject().put("status",updates.status).put("channel",updates.channel).put("checking",updates.checking).put("ready",updates.ready).put("installing",updates.installing).put("downloaded",updates.downloaded).put("total",updates.total).put("speed",updates.speed).put("autoCheck",updates.autoCheck()).put("autoDownload",updates.autoDownload()).put("unmeteredOnly",updates.unmeteredOnly()).put("lastCheck",updates.lastSuccess()).put("stale",updates.stale);if(updates.candidate!=null)value.put("candidate",updates.candidate.json);return value;}
    JSONObject execute(String operation,JSONObject data)throws Exception{
        switch(operation){
        case "snapshot":return snapshot(data.optBoolean("refresh"));
        case "image":return catalog.image(data.getString("id"),data.optString("kind","icon"));
        case "artwork":return playback.artwork();
        case "launch":catalog.launch(data.getString("id"));return safe("accepted",true);
        case "preferences":savePreferences(data);return snapshot(false);
        case "wifiName":main.post(()->{Activity host=activity.get();if(host instanceof MainActivity)((MainActivity)host).requestWifiName();});return safe("accepted",true);
        case "navigationTrace":String direction=data.optString("direction"),from=data.optString("from"),to=data.optString("to");if(direction.matches("up|down|left|right")&&from.matches("none|header|modal|page-[0-2]")&&to.matches("none|header|modal|page-[0-2]"))android.util.Log.i("AureaHomeUI","direction="+direction+" from="+from+" to="+to+" moved="+data.optBoolean("moved"));return safe("accepted",true);
        case "settings":openSettings(data.getString("screen"));return safe("accepted",true);
        case "uninstall":catalog.appAction(data.getString("id"),true);return safe("accepted",true);
        case "appInfo":catalog.appAction(data.getString("id"),false);return safe("accepted",true);
        case "media":return playback.command(data);
        case "volume":int value=data.getInt("value");if(value<0||value>100)throw new IllegalArgumentException("invalid_volume");AudioManager audio=context.getSystemService(AudioManager.class);audio.setStreamVolume(AudioManager.STREAM_MUSIC,Math.round(audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)*value/100f),0);return safe("accepted",true);
        case "startReceiver":main.post(this::ensureReceiver);return safe("accepted",true);
        case "remote":HomeRemoteService.enable(context);return remoteInfo();
        case "revokeRemotes":HomeRemoteServer remote=HomeRemoteService.server();if(remote!=null)remote.revokeAll();return safe("accepted",true);
        case "exportPreferences":return safe("text",HomePreferences.export(context,prefs));
        case "restorePreferences":HomePreferences.restore(context,prefs,data.getString("text"));return snapshot(true);
        case "inputProfile":String port=data.getString("id");String profile=data.getString("profile");if(!port.matches("hdmi[0-9]{1,2}")||!java.util.Arrays.asList("generic","nintendo","gaming","appletv","nintendoswitch","playstation","xbox","wiiu").contains(profile))throw new IllegalArgumentException("invalid_profile");prefs.edit().putString("input-profile-"+port.substring(4),profile).apply();return snapshot(true);
        case "checkUpdates":updates.check(true);return updateState();
        case "downloadUpdate":updates.download();return updateState();
        case "installUpdate":main.post(updates::install);return updateState();
        case "cancelUpdate":updates.cancel();return updateState();
        case "updatePreference":String key=data.getString("key");if(!java.util.Arrays.asList("auto_check","auto_download","unmetered").contains(key))throw new IllegalArgumentException("invalid_preference");updates.toggle(key);return updateState();
        case "unpairAppleTV":main.post(paired::unpair);return safe("accepted",true);
        case "cancelPairing":main.post(paired::cancelPairing);return safe("accepted",true);
        case "pairedInput":String input=catalog.inputId(data.getString("id"));context.getSharedPreferences("paired_device_ui",0).edit().putString("input_id",input).apply();return pairedState();
        case "releaseSeen":ReleaseHistory.markSeen(context);return safe("accepted",true);
        case "backupPreferences":main.post(()->{Activity host=activity.get();if(host instanceof MainActivity)((MainActivity)host).exportPreferences();});return safe("accepted",true);
        case "importPreferences":main.post(()->{Activity host=activity.get();if(host instanceof MainActivity)((MainActivity)host).importPreferences();});return safe("accepted",true);
        case "developerChangelog":try(java.io.InputStream source=context.getAssets().open("developer-changelog.txt")){return safe("text",new String(read(source),java.nio.charset.StandardCharsets.UTF_8));}
        case "changelog":try(java.io.InputStream source=context.getAssets().open("release-history.json")){return new JSONObject(new String(read(source),java.nio.charset.StandardCharsets.UTF_8));}
        case "diagnostics":return safe("text",it.xarber.tvhome.diagnostics.Diagnostics.report(context,playback.receiverReady(),HomeRemoteService.server()!=null)+paired.diagnosticHistory());
        case "recovery":context.startActivity(new Intent(context,LegacyHomeActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));return safe("accepted",true);
        default:throw new IllegalArgumentException("unsupported");
        }
    }
    private static byte[] read(java.io.InputStream input)throws Exception{java.io.ByteArrayOutputStream output=new java.io.ByteArrayOutputStream();byte[] buffer=new byte[4096];int count;while((count=input.read(buffer))!=-1)output.write(buffer,0,count);return output.toByteArray();}
    private void savePreferences(JSONObject data)throws Exception{
        SharedPreferences.Editor edit=prefs.edit();if(data.has("dock"))catalog.writeDock(data.getJSONArray("dock"),edit);
        String language=data.has("language")?data.getString("language"):null;if(language!=null&&!language.equals("it")&&!language.equals("en"))throw new IllegalArgumentException("invalid_language");
        if(data.has("wallpaper")){String value=data.getString("wallpaper");if(!WallpaperArt.valid(value))throw new IllegalArgumentException("invalid_wallpaper");edit.putString("wallpaper",value);}
        if(data.has("motion"))edit.putBoolean("wallpaper-motion",data.getBoolean("motion"));if(data.has("glass"))edit.putBoolean("activity-background",data.getBoolean("glass"));if(!edit.commit())throw new IllegalStateException("storage_failed");
        if(language!=null)AppLanguage.set(context,language);
    }
    private void openSettings(String screen)throws Exception{String action;switch(screen){case "network":action=Settings.ACTION_WIFI_SETTINGS;break;case "display":action=Settings.ACTION_DISPLAY_SETTINGS;break;case "location":action=Settings.ACTION_LOCATION_SOURCE_SETTINGS;break;case "sound":action=Settings.ACTION_SOUND_SETTINGS;break;case "inputs":action=Settings.ACTION_SETTINGS;break;case "airplay":context.startActivity(new Intent(context,io.github.jqssun.airplay.MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));return;default:action=Settings.ACTION_SETTINGS;}
        Intent intent=new Intent(action);if(screen.equals("display")){Intent picture=new Intent("com.mitv.settings.PICTURE_SETTINGS");if(context.getPackageManager().resolveActivity(picture,0)!=null)intent=picture;}if(context.getPackageManager().resolveActivity(intent,0)==null)intent=new Intent(Settings.ACTION_SETTINGS);context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));}
    private JSONObject remoteInfo()throws Exception{HomeRemoteServer server=HomeRemoteService.server();if(server==null)throw new IllegalStateException("remote_unavailable");server.rotatePairing();String address=null;for(NetworkInterface network:Collections.list(NetworkInterface.getNetworkInterfaces()))for(java.net.InetAddress candidate:Collections.list(network.getInetAddresses()))if(candidate instanceof Inet4Address&&!candidate.isLoopbackAddress()&&candidate.isSiteLocalAddress())address=candidate.getHostAddress();if(address==null)throw new IllegalStateException("network_unavailable");String url="http://"+address+(server.port()==80?"":":"+server.port())+"/";String pin=server.pin();com.google.zxing.common.BitMatrix matrix=new com.google.zxing.qrcode.QRCodeWriter().encode(url+"#pair="+pin,com.google.zxing.BarcodeFormat.QR_CODE,300,300);Bitmap bitmap=Bitmap.createBitmap(300,300,Bitmap.Config.ARGB_8888);for(int y=0;y<300;y++)for(int x=0;x<300;x++)bitmap.setPixel(x,y,matrix.get(x,y)?Color.BLACK:Color.WHITE);java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.PNG,100,bytes);bitmap.recycle();return new JSONObject().put("url",url).put("pin",pin).put("qr","data:image/png;base64,"+android.util.Base64.encodeToString(bytes.toByteArray(),android.util.Base64.NO_WRAP));}
    float[] waveform(){return playback.waveform();}
    void pairedRequest(String operation,JSONObject data,java.util.function.Consumer<JSONObject> callback){if(!java.util.Arrays.asList("scan","pair_begin","pair_finish","cancel_pairing").contains(operation)){callback.accept(SystemRemoteController.error("unsupported"));return;}main.post(()->paired.request(operation,data,callback));}
}
