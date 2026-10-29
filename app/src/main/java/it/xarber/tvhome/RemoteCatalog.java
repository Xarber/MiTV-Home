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
    private final LinkedHashMap<String,JSONObject> inputProfiles=new LinkedHashMap<>();
    private JSONObject cached;
    private long refreshed;
    RemoteCatalog(Context context){this.context=context.getApplicationContext();}
    synchronized JSONObject read() throws Exception {
        if(cached!=null&&SystemClock.elapsedRealtime()-refreshed<15000)return new JSONObject(cached.toString());
        PackageManager pm=context.getPackageManager();packages.clear();inputs.clear();inputProfiles.clear();JSONArray apps=new JSONArray(),sources=new JSONArray();
        for(String category:new String[]{Intent.CATEGORY_LEANBACK_LAUNCHER,Intent.CATEGORY_LAUNCHER}){
            for(ResolveInfo info:pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category),0)){
                String pkg=info.activityInfo.packageName,id="app:"+pkg;
                if(packages.size()>=256||packages.containsKey(id)||pkg.equals(context.getPackageName()))continue;
                packages.put(id,pkg);apps.put(new JSONObject().put("id",id).put("name",bounded(String.valueOf(info.loadLabel(pm)),100)).put("kind","app").put("system",(info.activityInfo.applicationInfo.flags&1)!=0));
            }
        }
        TvInputManager manager=(TvInputManager)context.getSystemService(Context.TV_INPUT_SERVICE);
        JSONArray configured=TVPlatform.get(context).catalog.read(false);
        if(manager!=null)for(TvInputInfo input:manager.getTvInputList()){
            if(input.getType()!=TvInputInfo.TYPE_HDMI||input.getParentId()!=null||sources.length()>=64)continue;
            String id="input:"+input.getId();if(id.length()>512)continue;inputs.put(id,input.getId());
            JSONObject appearance=null;for(int i=0;i<configured.length();i++){JSONObject item=configured.getJSONObject(i);if(input.getId().equals(item.optString("inputId")))appearance=item;}
            String name=String.valueOf(input.loadLabel(context)),profile=appearance==null?"generic":appearance.optString("profile","generic");
            if(!profile.equals("generic")){name=profile.equals("nintendo")?"Switch · Wii U":profile.equals("gaming")?"Xbox · PlayStation":profile.equals("appletv")?"Apple TV":profile.equals("playstation")?"PlayStation":profile.equals("nintendoswitch")?"Switch":profile.equals("wiiu")?"Wii U":profile.equals("xbox")?"Xbox":name;}
            else for(TvInputInfo child:manager.getTvInputList())if(input.getId().equals(child.getParentId())){String childName=String.valueOf(child.loadLabel(context));if(!childName.isEmpty())name=childName;}
            JSONObject source=new JSONObject().put("id",id).put("name",bounded(name,100)).put("kind","input").put("profile",profile).put("subtitle",appearance==null?String.valueOf(input.loadLabel(context)):"HDMI "+appearance.optInt("port")).put("connected",manager.getInputState(input.getId())==TvInputManager.INPUT_STATE_CONNECTED);
            if(appearance!=null){source.put("port",appearance.optInt("port"));if(appearance.has("brands"))source.put("brands",appearance.getJSONArray("brands"));}
            inputProfiles.put(id,source);sources.put(source);
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
            read();String pkg=packages.get(id);
            if(pkg==null){JSONObject source=inputProfiles.get(id);if(source==null&&!id.equals("live"))return SystemRemoteController.error("unavailable");String profile=source==null?"generic":source.optString("profile","generic");String[] marks=profile.equals("nintendo")?new String[]{"nintendoswitch","wiiu"}:profile.equals("gaming")?new String[]{"xbox","playstation"}:profile.equals("generic")?new String[0]:new String[]{profile};Bitmap composite=Bitmap.createBitmap(160,80,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(composite);if(marks.length==0)marks=new String[]{id.equals("live")?"live_tv":"hdmi"};for(int i=0;i<marks.length;i++){String name=profile.equals("generic")?"icon_"+marks[i]:"logo_"+marks[i];int resource=context.getResources().getIdentifier(name,"drawable",context.getPackageName());if(resource==0)continue;Drawable mark=context.getDrawable(resource);int side=64,x=marks.length==1?48:i*80+8;mark.setBounds(x,8,x+side,72);mark.draw(canvas);}ByteArrayOutputStream image=new ByteArrayOutputStream();composite.compress(Bitmap.CompressFormat.PNG,100,image);composite.recycle();return new JSONObject().put("image","data:image/png;base64,"+Base64.encodeToString(image.toByteArray(),Base64.NO_WRAP));}
            Drawable icon=context.getPackageManager().getApplicationIcon(pkg);Bitmap bitmap=Bitmap.createBitmap(80,80,Bitmap.Config.ARGB_8888);icon.setBounds(0,0,80,80);icon.draw(new Canvas(bitmap));
            ByteArrayOutputStream bytes=new ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.PNG,100,bytes);bitmap.recycle();
            if(bytes.size()>24000)return SystemRemoteController.error("artwork_too_large");return new JSONObject().put("image","data:image/png;base64,"+Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP));
        }catch(Exception ignored){return SystemRemoteController.error("unavailable");}
    }
    private static String bounded(String value,int length){return value.length()>length?value.substring(0,length):value;}
}
