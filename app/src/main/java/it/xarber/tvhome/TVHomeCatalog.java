// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.media.tv.TvContract;
import android.media.tv.TvInputInfo;
import android.media.tv.TvInputManager;
import android.net.Uri;
import android.util.Base64;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.util.*;

/** Authoritative native catalog. Canonical IDs retain the original dock preferences. */
final class TVHomeCatalog {
    private final Context context;
    private final SharedPreferences prefs;
    private final LinkedHashMap<String,JSONObject> entries=new LinkedHashMap<>();
    private final HashMap<String,String> inputs=new HashMap<>();
    private final HashMap<String,ResolveInfo> applications=new HashMap<>();
    private long refreshed;
    TVHomeCatalog(Context context,SharedPreferences prefs){this.context=context;this.prefs=prefs;}
    private JSONObject entry(String id,String name,String kind,String icon,String category)throws Exception{return new JSONObject().put("id",id).put("name",name).put("kind",kind).put("icon",icon).put("category",category).put("color","#515c73");}
    synchronized JSONArray read(boolean force)throws Exception{
        if(!force&&!entries.isEmpty()&&android.os.SystemClock.elapsedRealtime()-refreshed<15000)return array();
        entries.clear();inputs.clear();applications.clear();
        entries.put("inputs",entry("inputs","Inputs","inputs","inputs","system"));
        entries.put("all",entry("all","All apps","library","apps","system"));
        entries.put("airplay",entry("airplay","AirPlay","airplay","airplay","casting"));
        PackageManager pm=context.getPackageManager();
        for(String category:new String[]{Intent.CATEGORY_LEANBACK_LAUNCHER,Intent.CATEGORY_LAUNCHER})for(ResolveInfo info:pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category),0)){
            String pkg=info.activityInfo.packageName;if(pkg.equals(context.getPackageName())||pkg.equals(context.getPackageName()+".preview")||applications.containsKey(pkg)||applications.size()>=256)continue;
            boolean system=(info.activityInfo.applicationInfo.flags&1)!=0,casting=pkg.matches(".*(airplay|smartshare|mediashell|miracast|milink).*");
            applications.put(pkg,info);entries.put(pkg,entry(pkg,String.valueOf(info.loadLabel(pm)),"app","apps",casting?"casting":system?"system":"apps").put("system",system));
        }
        TvInputManager manager=context.getSystemService(TvInputManager.class);
        if(manager!=null)for(TvInputInfo input:manager.getTvInputList()){
            if(input.getType()!=TvInputInfo.TYPE_HDMI||input.getParentId()!=null)continue;
            int port=0;String label=String.valueOf(input.loadLabel(context));java.util.regex.Matcher match=java.util.regex.Pattern.compile("HDMI\\s*(\\d+)",java.util.regex.Pattern.CASE_INSENSITIVE).matcher(label);if(match.find())port=Integer.parseInt(match.group(1));
            if(android.os.Build.MODEL.equals("MiTV-MOOQ0")){String registered=input.getId();if(registered.endsWith("/HW4"))port=1;else if(registered.endsWith("/HW5"))port=2;else if(registered.endsWith("/HW6"))port=3;}
            if(port<1||port>64)continue;
            String id="hdmi"+port;if(inputs.containsKey(id)&&input.getParentId()!=null)continue;
            inputs.put(id,input.getId());String fallback=android.os.Build.MODEL.equals("MiTV-MOOQ0")?(port==1?"nintendo":port==2?"appletv":port==3?"gaming":"generic"):"generic";String profile=prefs.getString("input-profile-"+port,fallback);
            JSONObject value=entry(id,"HDMI "+port,"hdmi",profile.equals("appletv")?"apple":"inputs","inputs").put("port",port).put("inputId",input.getId()).put("profile",profile).put("connected",manager.getInputState(input.getId())==TvInputManager.INPUT_STATE_CONNECTED);
            if(profile.equals("appletv"))value.put("name","Apple TV").put("subtitle","HDMI "+port);
            if(profile.equals("nintendo"))value.put("brands",new JSONArray().put("Switch").put("Wii U"));
            if(profile.equals("gaming"))value.put("brands",new JSONArray().put("Xbox").put("PlayStation"));
            entries.put(id,value);
        }
        entries.put("live",entry("live","Live TV","live","tv","inputs"));
        refreshed=android.os.SystemClock.elapsedRealtime();return array();
    }
    private JSONArray array(){JSONArray result=new JSONArray();List<JSONObject> values=new ArrayList<>(entries.values());values.sort((a,b)->{boolean ai=a.optString("kind").equals("hdmi"),bi=b.optString("kind").equals("hdmi");if(ai&&bi)return Integer.compare(a.optInt("port"),b.optInt("port"));if(ai!=bi)return ai?-1:1;return 0;});for(JSONObject value:values)result.put(value);return result;}
    private String normalize(String key){return key.equals("library")?"all":key;}
    synchronized JSONArray dock()throws Exception{
        read(false);List<String> requested=new ArrayList<>();requested.add(normalize(prefs.getString("input-dock-pin","inputs")));
        String saved=prefs.getString("dock-pins",null);
        if(saved!=null)try{JSONArray values=new JSONArray(saved);for(int i=0;i<Math.min(5,values.length());i++)requested.add(normalize(values.getString(i)));}catch(Exception ignored){}
        if(requested.size()==1)requested.addAll(Arrays.asList("com.netflix.ninja","com.amazon.amazonvideo.livingroom","com.google.android.youtube.tv","airplay","all"));
        JSONArray result=new JSONArray();HashSet<String> used=new HashSet<>();
        for(int slot=0;slot<6;slot++){
            String key=slot<requested.size()?requested.get(slot):"";
            if(!entries.containsKey(key)||used.contains(key)||slot<5&&key.equals("all"))key=slot==5&&!used.contains("all")?"all":"";
            if(key.isEmpty())for(String candidate:entries.keySet())if(!candidate.equals("all")&&!used.contains(candidate)){key=candidate;break;}
            if(key.isEmpty())key="empty"+slot;
            result.put(key);used.add(key);
        }return result;
    }
    synchronized void writeDock(JSONArray values,SharedPreferences.Editor edit)throws Exception{
        read(false);if(values.length()!=6)throw new IllegalArgumentException("invalid_dock");HashSet<String> used=new HashSet<>();JSONArray tail=new JSONArray();
        for(int i=0;i<6;i++){String key=values.getString(i);if(!entries.containsKey(key)||!used.add(key)||i<5&&key.equals("all"))throw new IllegalArgumentException("invalid_dock");if(i>0)tail.put(key.equals("all")?"library":key);}
        edit.putString("input-dock-pin",values.getString(0)).putString("dock-pins",tail.toString());
    }
    synchronized JSONObject image(String id,String kind)throws Exception{
        read(false);ResolveInfo info=applications.get(id);PackageManager pm=context.getPackageManager();Drawable drawable=null;
        if(info==null){String name=id.equals("inputs")?"icon_hdmi":id.equals("all")?"icon_apps":id.equals("live")?"icon_live_tv":id.equals("airplay")?"icon_airplay":null;
            if(id.startsWith("brand:")&&Arrays.asList("appletv","nintendoswitch","wiiu","xbox","playstation").contains(id.substring(6)))name="logo_"+id.substring(6);
            if(name==null||kind.equals("banner"))return new JSONObject();int resource=context.getResources().getIdentifier(name,"drawable",context.getPackageName());if(resource==0)return new JSONObject();drawable=context.getDrawable(resource);
        }
        if(info!=null&&kind.equals("banner")){try{drawable=info.activityInfo.loadBanner(pm);}catch(Exception ignored){}if(drawable==null)try{drawable=pm.getApplicationBanner(id);}catch(Exception ignored){}}
        else if(info!=null)drawable=info.loadIcon(pm);
        if(drawable==null)return new JSONObject();int width=kind.equals("banner")?640:kind.equals("hero-icon")?256:128,height=kind.equals("banner")?360:kind.equals("hero-icon")?256:128;
        Bitmap bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);if(kind.equals("hero-icon")&&drawable.getIntrinsicWidth()>0&&drawable.getIntrinsicHeight()>0){float fit=Math.min(width/(float)drawable.getIntrinsicWidth(),height/(float)drawable.getIntrinsicHeight());int w=Math.round(drawable.getIntrinsicWidth()*fit),h=Math.round(drawable.getIntrinsicHeight()*fit);drawable.setBounds((width-w)/2,(height-h)/2,(width+w)/2,(height+h)/2);}else drawable.setBounds(0,0,width,height);drawable.draw(new Canvas(bitmap));
        if(kind.equals("hero-icon")){int[] pixels=new int[width*height];bitmap.getPixels(pixels,0,width,0,0,width,height);int left=width,top=height,right=-1,bottom=-1;for(int y=0;y<height;y++)for(int x=0;x<width;x++)if((pixels[y*width+x]>>>24)>24){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}if(right>=left&&bottom>=top){Bitmap cropped=Bitmap.createBitmap(bitmap,left,top,right-left+1,bottom-top+1);if(cropped!=bitmap)bitmap.recycle();bitmap=cropped;}}
        ByteArrayOutputStream bytes=new ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.PNG,100,bytes);bitmap.recycle();
        if(bytes.size()>600000)throw new IllegalArgumentException("artwork_too_large");return new JSONObject().put("image","data:image/png;base64,"+Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP));
    }
    synchronized void launch(String id)throws Exception{
        read(false);Intent intent;
        if(inputs.containsKey(id)){intent=new Intent(Intent.ACTION_VIEW,TvContract.buildChannelUriForPassthroughInput(inputs.get(id))).setPackage("com.mediatek.wwtv.tvcenter");if(context.getPackageManager().resolveActivity(intent,0)==null)intent.setPackage(null);}
        else if(id.equals("live")){intent=liveIntent();}
        else if(applications.containsKey(id)){PackageManager pm=context.getPackageManager();intent=pm.getLeanbackLaunchIntentForPackage(id);if(intent==null)intent=pm.getLaunchIntentForPackage(id);}
        else throw new IllegalArgumentException("unknown_target");
        if(intent==null||context.getPackageManager().resolveActivity(intent,0)==null)throw new IllegalStateException("screen_unavailable");context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }
    private Intent liveIntent(){
        TvInputManager manager=context.getSystemService(TvInputManager.class);
        if(manager!=null)for(TvInputInfo info:manager.getTvInputList())if(info.getType()==TvInputInfo.TYPE_TUNER){Intent intent=new Intent(Intent.ACTION_VIEW,TvContract.buildChannelsUriForInput(info.getId()));if(context.getPackageManager().resolveActivity(intent,0)!=null)return intent;}
        Intent intent=context.getPackageManager().getLeanbackLaunchIntentForPackage("com.mediatek.wwtv.tvcenter");return intent!=null?intent:new Intent(Intent.ACTION_VIEW,TvContract.Channels.CONTENT_URI);
    }
    synchronized String inputKey(String inputId)throws Exception{read(false);for(Map.Entry<String,String> entry:inputs.entrySet())if(entry.getValue().equals(inputId)||entry.getKey().equals(inputId))return entry.getKey();return "";}
    synchronized String inputId(String key)throws Exception{read(false);if(!inputs.containsKey(key))throw new IllegalArgumentException("unknown_input");return inputs.get(key);}
    synchronized void appAction(String id,boolean uninstall)throws Exception{read(false);if(!applications.containsKey(id))throw new IllegalArgumentException("unknown_target");context.startActivity(new Intent(uninstall?Intent.ACTION_DELETE:android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+id)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));}
}
