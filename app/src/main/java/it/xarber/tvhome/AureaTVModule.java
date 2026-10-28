// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONObject;
import org.json.JSONArray;
import java.lang.ref.WeakReference;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Trusted in-process adapter only; unrelated apps and web pages cannot invoke it. */
public final class AureaTVModule extends ReactContextBaseJavaModule {
    private static WeakReference<AureaTVModule> instance=new WeakReference<>(null);
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final Handler main=new Handler(Looper.getMainLooper());
    private volatile int listeners;
    private volatile boolean valid=true;
    private final Runnable waveform=new Runnable(){public void run(){if(!valid)return;if(listeners>0&&TVPlatform.foreground()){float[] values=TVPlatform.get(getReactApplicationContext()).waveform();if(values!=null){JSONArray samples=new JSONArray();for(float value:values)samples.put((Object)(Float.isFinite(value)?value:0));emit("AureaTVWaveform",samples.toString());}}main.postDelayed(this,100);}};
    AureaTVModule(ReactApplicationContext context){super(context);instance=new WeakReference<>(this);main.post(waveform);}
    @Override public String getName(){return "AureaTV";}
    @ReactMethod public void addListener(String name){listeners++;}
    @ReactMethod public void removeListeners(double count){listeners=Math.max(0,listeners-(int)count);}
    static boolean listening(){AureaTVModule value=instance.get();return value!=null&&value.valid&&value.listeners>0;}
    public static void event(String type,JSONObject payload){AureaTVModule value=instance.get();if(value==null||!value.valid)return;try{value.emit("AureaTVEvent",new JSONObject().put("type",type).put("payload",payload).toString());}catch(Exception ignored){}}
    private void emit(String event,String value){if(valid&&getReactApplicationContext().hasActiveReactInstance())getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(event,value);}
    @ReactMethod public void ready(){it.xarber.tvhome.MainActivity.interfaceReady=true;}
    @ReactMethod public void execute(String operation,String encoded,Promise promise){
        if(!valid||encoded.length()>32768){promise.reject("invalid_request","Request unavailable");return;}
        worker.execute(()->{try{JSONObject value=TVPlatform.get(getReactApplicationContext()).execute(operation,new JSONObject(encoded));promise.resolve(value.toString());}catch(Exception failure){String code=failure instanceof IllegalArgumentException?failure.getMessage():"native_operation_failed";if(code==null||!code.matches("[a-z_]{1,64}"))code="native_operation_failed";promise.reject(code,"This action is unavailable");}});
    }
    @ReactMethod public void pairedRequest(String operation,String encoded,Promise promise){
        if(encoded.length()>4096){promise.reject("invalid_request","Request unavailable");return;}
        try{TVPlatform.get(getReactApplicationContext()).pairedRequest(operation,new JSONObject(encoded),value->{if(value.has("error"))promise.reject(value.optString("error","pairing_failed"),"Pairing action failed");else promise.resolve(value.toString());});}catch(Exception failure){promise.reject("pairing_failed","Pairing action failed");}
    }
    @Override public void invalidate(){valid=false;listeners=0;main.removeCallbacks(waveform);worker.shutdownNow();if(instance.get()==this)instance.clear();super.invalidate();}
}
