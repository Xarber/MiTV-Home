// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome.playback;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.wifi.WifiManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Base64;
import com.chaquo.python.PyObject;
import com.chaquo.python.Python;
import com.chaquo.python.android.AndroidPlatform;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import org.json.JSONObject;

/** Home-scoped native remote playback. Local receiver playback is a separate source. */
public final class PairedPlayback {
    private final Context context;
    private final PairingStore store;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ScheduledExecutorService worker=Executors.newSingleThreadScheduledExecutor();
    private PyObject client;
    private WifiManager.MulticastLock multicast;
    private volatile boolean foreground,closed,busy;
    private long retryAt;
    private int failures;
    private volatile JSONObject state=new JSONObject();
    private volatile Bitmap artwork;
    private String artEncoded;
    private volatile String deviceName="";
    private volatile boolean paired,storageError;
    private long observed;
    private Runnable observer;
    public PairedPlayback(Context context){
        this.context=context.getApplicationContext();store=new PairingStore(this.context);
        worker.execute(()->{try{JSONObject value=store.read();paired=value!=null;if(value!=null)deviceName=value.optString("name");}catch(Exception error){storageError=true;}notifyChange();});
        worker.scheduleWithFixedDelay(this::poll,1,2,TimeUnit.SECONDS);
    }
    public void observe(Runnable callback){observer=callback;}
    public boolean paired(){return paired;}
    public boolean busy(){return busy;}
    public boolean storageError(){return storageError;}
    public String name(){return deviceName;}
    public JSONObject state(){return state;}
    public Bitmap artwork(){return artwork;}
    public boolean active(){return foreground&&SystemClock.elapsedRealtime()-observed<12000&&Math.abs(System.currentTimeMillis()/1000.-state.optDouble("observed_at",0))<12&&state.optBoolean("active");}
    public void resume(){foreground=true;retryAt=0;}
    public void pause(){foreground=false;worker.execute(()->{if(client!=null&&!busy)call("disconnect",new JSONObject());resetState();releaseMulticast();});}
    public void close(){closed=true;foreground=false;observer=null;worker.execute(()->{if(client!=null)call("shutdown",new JSONObject());releaseMulticast();});worker.shutdown();}
    private void notifyChange(){main.post(()->{if(!closed&&observer!=null)observer.run();});}
    private void lockMulticast(){if(multicast!=null)return;WifiManager wifi=(WifiManager)context.getSystemService(Context.WIFI_SERVICE);if(wifi!=null){multicast=wifi.createMulticastLock("MiTVAppleTVDiscovery");multicast.setReferenceCounted(false);multicast.acquire();}}
    private void releaseMulticast(){if(multicast!=null){if(multicast.isHeld())multicast.release();multicast=null;}}
    private JSONObject call(String operation,JSONObject payload){
        try{
            if(client==null){synchronized(Python.class){if(!Python.isStarted())Python.start(new AndroidPlatform(context));}client=Python.getInstance().getModule("paired_apple_tv").get("Client").call();}
            return new JSONObject(client.callAttr("request",operation,payload.toString()).toString());
        }catch(Exception error){return error("runtime_unavailable");}
    }
    private static JSONObject error(String key){JSONObject result=new JSONObject();try{result.put("error",key);}catch(Exception ignored){}return result;}
    public void request(String operation,JSONObject data,Consumer<JSONObject> callback){
        if(closed||busy){callback.accept(error("busy"));return;}busy=true;
        worker.execute(()->{JSONObject result;
            try{lockMulticast();result=call(operation,data);
                if(operation.equals("pair_finish")&&result.has("credentials")){store.save(result);paired=true;storageError=false;deviceName=result.optString("name");result=new JSONObject().put("status","paired");retryAt=0;}
            }catch(Exception error){result=error("storage_failed");}
            busy=false;JSONObject safe=result;main.post(()->{if(!closed){callback.accept(safe);notifyChange();}});
        });
    }
    public void unpair(){worker.execute(()->{if(client!=null)call("disconnect",new JSONObject());store.clear();paired=false;storageError=false;deviceName="";resetState();releaseMulticast();notifyChange();});}
    public void command(String action,Double volume){try{JSONObject value=new JSONObject().put("action",action);if(volume!=null)value.put("value",volume);request("command",value,result->{});}catch(Exception ignored){}}
    private void resetState(){state=new JSONObject();artwork=null;artEncoded=null;observed=0;}
    private void poll(){
        if(closed||!foreground||!paired||busy||SystemClock.elapsedRealtime()<retryAt)return;
        try{
            lockMulticast();JSONObject next;
            if(!state.optString("status").equals("connected")){JSONObject credentials=store.read();if(credentials==null)return;next=call("connect",credentials);}else next=call("state",new JSONObject());
            if(next.has("error")||!next.optString("status").equals("connected")){resetState();failures++;retryAt=SystemClock.elapsedRealtime()+Math.min(60000,2000L<<Math.min(5,failures));releaseMulticast();notifyChange();return;}
            failures=0;state=next;observed=SystemClock.elapsedRealtime();String encoded=next.optString("artwork","");
            if(!encoded.equals(artEncoded)){artEncoded=encoded;artwork=null;if(!encoded.isEmpty()&&encoded.length()<700000){byte[] bytes=Base64.decode(encoded,Base64.DEFAULT);BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);if(options.outWidth>0&&options.outHeight>0&&options.outWidth<=1024&&options.outHeight<=1024)artwork=BitmapFactory.decodeByteArray(bytes,0,bytes.length);}}
            notifyChange();
        }catch(Exception error){resetState();retryAt=SystemClock.elapsedRealtime()+30000;releaseMulticast();notifyChange();}
    }
}
