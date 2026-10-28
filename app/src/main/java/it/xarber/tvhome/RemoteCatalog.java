// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.media.tv.TvInputInfo;
import android.media.tv.TvInputManager;
import android.os.SystemClock;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import java.util.LinkedHashMap;
import org.json.JSONArray;
import org.json.JSONObject;

/** Published launch targets come from current Android APIs, never arbitrary client intents. */
final class RemoteCatalog {
    private final Context context;
    private final LinkedHashMap<String,String> packages=new LinkedHashMap<>(),inputs=new LinkedHashMap<>();
    private JSONObject cached;
    private long refreshed;
    RemoteCatalog(Context context){this.context=context.getApplicationContext();}
    synchronized JSONObject read() throws Exception {
        if(cached!=null&&SystemClock.elapsedRealtime()-refreshed<15000)return new JSONObject(cached.toString());
        PackageManager pm=context.getPackageManager();packages.clear();inputs.clear();JSONArray apps=new JSONArray(),sources=new JSONArray();
        for(String category:new String[]{Intent.CATEGORY_LEANBACK_LAUNCHER,Intent.CATEGORY_LAUNCHER}){
            for(ResolveInfo info:pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category),0)){
                String pkg=info.activityInfo.packageName,id="app:"+pkg;
                if(packages.size()>=256||packages.containsKey(id)||pkg.equals(context.getPackageName()))continue;
                packages.put(id,pkg);apps.put(new JSONObject().put("id",id).put("name",bounded(String.valueOf(info.loadLabel(pm)),100)).put("kind","app").put("system",(info.activityInfo.applicationInfo.flags&1)!=0));
            }
        }
        TvInputManager manager=(TvInputManager)context.getSystemService(Context.TV_INPUT_SERVICE);
        if(manager!=null)for(TvInputInfo input:manager.getTvInputList()){
            if(input.getType()!=TvInputInfo.TYPE_HDMI||sources.length()>=64)continue;
            String id="input:"+input.getId();if(id.length()>512)continue;inputs.put(id,input.getId());
            sources.put(new JSONObject().put("id",id).put("name",bounded(String.valueOf(input.loadLabel(context)),100)).put("kind","input").put("connected",manager.getInputState(input.getId())==TvInputManager.INPUT_STATE_CONNECTED));
        }
        sources.put(new JSONObject().put("id","live").put("name","Live TV").put("kind","live"));
        cached=new JSONObject().put("apps",apps).put("inputs",sources);refreshed=SystemClock.elapsedRealtime();return new JSONObject(cached.toString());
    }
    synchronized boolean contains(String id){try{read();return id.equals("live")||packages.containsKey(id)||inputs.containsKey(id);}catch(Exception ignored){return false;}}
    synchronized void launch(LegacyHomeActivity home,String id){
        try{
            read();if(id.equals("live")){home.openLive();return;}
            if(inputs.containsKey(id)){LegacyHomeActivity.Entry target=home.action(id,"HDMI","hdmi",home.hdmiArt);target.inputId=inputs.get(id);home.openInput(target);return;}
            String pkg=packages.get(id);if(pkg==null)return;
            Intent intent=home.getPackageManager().getLeanbackLaunchIntentForPackage(pkg);if(intent==null)intent=home.getPackageManager().getLaunchIntentForPackage(pkg);
            if(intent!=null)home.start(intent);
        }catch(Exception ignored){home.showNotice(home.tr("This screen is unavailable on this TV"),2500);}
    }
    synchronized void launch(MainActivity home,String id){JSONObject result=launch(TVPlatform.get(context),id);if(result.has("error"))AureaTVModule.event("notice",TVPlatform.safe("message","This input is unavailable"));}
    synchronized JSONObject launch(TVPlatform platform,String id){
        try{read();if(id.equals("live"))platform.catalog.launch("live");else if(packages.containsKey(id))platform.catalog.launch(packages.get(id));else if(inputs.containsKey(id)){JSONArray values=platform.catalog.read(false);String target=null;for(int i=0;i<values.length();i++){JSONObject item=values.getJSONObject(i);if(inputs.get(id).equals(item.optString("inputId")))target=item.getString("id");}if(target==null)return SystemRemoteController.error("unknown_target");platform.catalog.launch(target);}else return SystemRemoteController.error("unknown_target");return new JSONObject().put("accepted",true);}catch(Exception unavailable){return SystemRemoteController.error("screen_unavailable");}
    }
    synchronized JSONObject icon(String id){
        try{
            read();String pkg=packages.get(id);if(pkg==null)return SystemRemoteController.error("unavailable");
            Drawable icon=context.getPackageManager().getApplicationIcon(pkg);Bitmap bitmap=Bitmap.createBitmap(80,80,Bitmap.Config.ARGB_8888);icon.setBounds(0,0,80,80);icon.draw(new Canvas(bitmap));
            ByteArrayOutputStream bytes=new ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.PNG,100,bytes);bitmap.recycle();
            if(bytes.size()>24000)return SystemRemoteController.error("artwork_too_large");return new JSONObject().put("image","data:image/png;base64,"+Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP));
        }catch(Exception ignored){return SystemRemoteController.error("unavailable");}
    }
    private static String bounded(String value,int length){return value.length()>length?value.substring(0,length):value;}
}
