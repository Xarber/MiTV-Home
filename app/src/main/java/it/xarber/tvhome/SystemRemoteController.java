// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.content.Context;
import com.chaquo.python.PyObject;
import com.chaquo.python.Python;
import com.chaquo.python.android.AndroidPlatform;
import it.xarber.tvhome.playback.PairingStore;
import org.json.JSONObject;

/** Blocking protocol calls are made only from the HTTP worker, never Android's UI thread. */
final class SystemRemoteController {
    private final Context context;
    private final PairingStore store;
    private volatile PyObject client;
    private volatile boolean paired;
    private final java.util.concurrent.ExecutorService recovery=java.util.concurrent.Executors.newSingleThreadExecutor();
    private final java.util.concurrent.atomic.AtomicBoolean recovering=new java.util.concurrent.atomic.AtomicBoolean();
    private volatile boolean closed;
    private volatile long retryAt;
    void recover(){
        JSONObject state=state();
        if(closed||!state.optBoolean("paired")||state.optBoolean("ready")||android.os.SystemClock.elapsedRealtime()<retryAt||!recovering.compareAndSet(false,true))return;
        try{recovery.execute(()->{try{if(!closed)request("connect",new JSONObject());}finally{retryAt=android.os.SystemClock.elapsedRealtime()+15000;recovering.set(false);}});}catch(java.util.concurrent.RejectedExecutionException stopped){recovering.set(false);}
    }
    SystemRemoteController(Context context){this.context=context.getApplicationContext();store=new PairingStore(context,"system-tv-remote");}
    private JSONObject call(String operation,JSONObject payload) throws Exception {
        if(client==null){
            synchronized(Python.class){if(!Python.isStarted())Python.start(new AndroidPlatform(context));}
            java.io.File diagnostics=context.getExternalFilesDir("diagnostics");if(diagnostics==null)diagnostics=new java.io.File(context.getFilesDir(),"diagnostics");diagnostics.mkdirs();
            client=Python.getInstance().getModule("system_remote").get("Client").call(context.getCacheDir().getAbsolutePath(),diagnostics.getAbsolutePath(),io.github.jqssun.airplay.BuildConfig.VERSION_NAME,io.github.jqssun.airplay.BuildConfig.SOURCE_COMMIT);
            JSONObject stored=store.read(),credentials=stored==null?new JSONObject():new JSONObject(stored.getString("credentials"));paired=credentials.optBoolean("paired");
            JSONObject configuration=new JSONObject(credentials.toString());
            // Compatibility fallback is this device's own interface, never a client-supplied LAN peer.
            for(java.net.NetworkInterface network:java.util.Collections.list(java.net.NetworkInterface.getNetworkInterfaces())){
                if(!network.isUp()||network.isLoopback())continue;
                for(java.net.InetAddress address:java.util.Collections.list(network.getInetAddresses()))if(address instanceof java.net.Inet4Address&&address.isSiteLocalAddress()){configuration.put("localAddress",address.getHostAddress());break;}
                if(configuration.has("localAddress"))break;
            }
            JSONObject prepared=new JSONObject(client.callAttr("request","prepare",configuration.toString()).toString());
            if(prepared.has("error")){client.callAttr("request","shutdown");client=null;return prepared;}
            prepared.put("paired",paired);save(prepared);
        }
        return new JSONObject(client.callAttr("request",operation,payload.toString()).toString());
    }
    private void save(JSONObject credentials) throws Exception {store.save(new JSONObject().put("credentials",credentials.toString()).put("identifier","system-tv-remote").put("name","Aurea Home"));}
    synchronized JSONObject request(String operation,JSONObject payload){
        try{
            JSONObject result=call(operation,payload);
            if(result.optString("error").equals("connection_failed"))result.put("error","system_connection_failed");
            if(operation.equals("pair_finish")&&(result.optBoolean("paired")||result.optBoolean("ready"))){
                JSONObject saved=store.read();if(saved==null)return error("storage_failed");
                JSONObject credentials=new JSONObject(saved.getString("credentials")).put("paired",true);save(credentials);paired=true;
            }
            if(result.optString("error").equals("authentication_failed")){paired=false;JSONObject saved=store.read();if(saved!=null)save(new JSONObject(saved.getString("credentials")).put("paired",false));}
            return result;
        }catch(Exception failure){try{if(client!=null)client.callAttr("host_failure",operation.startsWith("pair")?"system_"+operation:"system_key",failure.getClass().getSimpleName());}catch(Exception ignored){}return error("runtime_unavailable");}
    }
    JSONObject state(){
        try {JSONObject state=client==null?new JSONObject():new JSONObject(client.callAttr("request","state").toString());if(client==null){JSONObject saved=store.read();paired=saved!=null&&new JSONObject(saved.getString("credentials")).optBoolean("paired");}state.put("paired",state.optBoolean("paired",paired));if(!state.has("status"))state.put("status",paired?"paired":"not_paired");return state;}
        catch(Exception failure){return error("storage_failed");}
    }
    synchronized void close(){closed=true;recovery.shutdownNow();try{if(client!=null)client.callAttr("request","shutdown");}catch(Exception ignored){}client=null;}
    static JSONObject error(String key){JSONObject value=new JSONObject();try{value.put("error",key);}catch(Exception ignored){}return value;}
}
