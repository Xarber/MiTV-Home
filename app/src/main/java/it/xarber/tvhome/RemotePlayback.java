// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.graphics.Bitmap;
import android.os.IBinder;
import android.util.Base64;
import io.github.jqssun.airplay.audio.TrackInfo;
import io.github.jqssun.airplay.service.AirPlayService;
import it.xarber.tvhome.playback.PairedPlayback;
import java.io.ByteArrayOutputStream;
import org.json.JSONObject;

/** In-app phone activities reuse the receiver/paired-player state, not OS notifications. */
final class RemotePlayback {
    private final Context context;
    private final PairedPlayback paired;
    private final boolean presenceOwner;
    private volatile AirPlayService receiver;
    private boolean bound;
    private final it.xarber.tvhome.playback.MusicActivityClock activityClock=new it.xarber.tvhome.playback.MusicActivityClock();
    private Bitmap previousArt;
    private String art="",artId="";
    private int artVersion;
    private org.json.JSONArray palette=new org.json.JSONArray().put("#e6eaf0").put("#929aa8");
    private final long session=android.os.SystemClock.elapsedRealtime();
    private final ServiceConnection connection=new ServiceConnection(){
        @Override public void onServiceConnected(ComponentName name,IBinder binder){receiver=((AirPlayService.LocalBinder)binder).getService();}
        @Override public void onServiceDisconnected(ComponentName name){receiver=null;}
    };
    RemotePlayback(Context context){this(context,true);}
    RemotePlayback(Context context,boolean presenceOwner){this.presenceOwner=presenceOwner;this.context=context.getApplicationContext();paired=PairedPlayback.get(context);}
    void start(){new android.os.Handler(android.os.Looper.getMainLooper()).post(()->{if(bound)return;try{bound=context.bindService(new Intent(context,AirPlayService.class),connection,Context.BIND_AUTO_CREATE);}catch(Exception ignored){bound=false;}});}
    void tickActivity(){
        AirPlayService current=receiver;
        if(current!=null&&current.getAudioOnly().getValue())activityClock.visible(true,current.getPlaying().getValue(),android.os.SystemClock.elapsedRealtime());
        else if(paired.active())activityClock.visible(true,paired.state().optBoolean("playing"),android.os.SystemClock.elapsedRealtime());
        else activityClock.visible(false,false,android.os.SystemClock.elapsedRealtime());
    }
    void clients(boolean active){paired.remoteActive(active);}
    void close(){if(presenceOwner)paired.remoteActive(false);if(bound){context.unbindService(connection);bound=false;}receiver=null;}
    synchronized JSONObject state(){
        try{
            AirPlayService current=receiver;JSONObject value=new JSONObject();Bitmap image=null;
            if(current!=null&&current.getAudioOnly().getValue()){
                TrackInfo info=current.getTrackInfo().getValue();image=info.getCoverArt();
                value.put("active",true).put("source","airplay").put("title",bounded(info.getTitle())).put("artist",bounded(info.getArtist())).put("album",bounded(info.getAlbum()))
                    .put("playing",current.getPlaying().getValue()).put("positionMs",current.currentPositionMs()).put("durationMs",current.getDurationMs().getValue()).put("volume",Math.round(current.clientVolume()*100));
                value.put("controls",new JSONObject().put("play_pause",true).put("next",current.getDacpController()!=null).put("previous",current.getDacpController()!=null).put("volume",true));
            }else if(paired.active()){
                JSONObject supplied=paired.state();image=paired.artwork();
                value.put("active",true).put("source","paired-apple-tv").put("title",bounded(supplied.optString("title"))).put("artist",bounded(supplied.optString("artist"))).put("album",bounded(supplied.optString("album"))).put("playing",supplied.optBoolean("playing"));
                if(!supplied.isNull("position"))value.put("positionMs",supplied.optLong("position")*1000);
                if(!supplied.isNull("duration"))value.put("durationMs",supplied.optLong("duration")*1000);
                if(!supplied.isNull("volume"))value.put("volume",supplied.optDouble("volume"));
                value.put("controls",supplied.optJSONObject("controls"));
            }else value.put("active",false);
            value.put("activityVisible",activityClock.visible(value.optBoolean("active"),value.optBoolean("playing"),android.os.SystemClock.elapsedRealtime()));
            if(image!=previousArt){palette=new org.json.JSONArray();for(int color:WavePalette.from(image))palette.put(String.format(java.util.Locale.US,"#%06x",color&0xffffff));previousArt=image;art="";artId="";if(image!=null&&!image.isRecycled()){
                Bitmap scaled=Bitmap.createScaledBitmap(image,Math.max(1,Math.min(384,image.getWidth())),Math.max(1,Math.min(384,image.getHeight())),true);
                ByteArrayOutputStream bytes=new ByteArrayOutputStream();scaled.compress(Bitmap.CompressFormat.JPEG,85,bytes);if(scaled!=image)scaled.recycle();
                if(bytes.size()<=120000){art="data:image/jpeg;base64,"+Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP);artId=session+"-"+(++artVersion);}
            }}
            if(!artId.isEmpty())value.put("artworkId",artId);
            value.put("colors",palette);
            float[] measured=waveform();if(measured!=null&&measured.length==6&&value.optString("source").equals("airplay")){org.json.JSONArray bands=new org.json.JSONArray();for(float band:measured)bands.put(Float.isFinite(band)?Math.max(0,Math.min(1,band)):0);value.put("bands",bands);}
            value.put("observedAt",System.currentTimeMillis());return value;
        }catch(Exception ignored){return SystemRemoteController.error("playback_unavailable");}
    }
    boolean receiverReady(){AirPlayService current=receiver;return current!=null&&current.getServerState().getValue().toString().equals("RUNNING");}
    float[] waveform(){AirPlayService current=receiver;return current!=null&&current.getAudioOnly().getValue()?current.audioWaveform():null;}
    synchronized Bitmap cover(){return previousArt;}
    synchronized JSONObject artwork(){try{return new JSONObject().put("id",artId).put("image",art);}catch(Exception ignored){return new JSONObject();}}
    JSONObject command(JSONObject payload){
        JSONObject current=state();String action=payload.optString("action"),source=payload.optString("source");
        if(!current.optBoolean("active")||!source.equals(current.optString("source")))return SystemRemoteController.error("source_changed");
        if(!action.matches("play_pause|next|previous|volume"))return SystemRemoteController.error("unsupported");
        JSONObject controls=current.optJSONObject("controls");if(controls==null||!controls.optBoolean(action))return SystemRemoteController.error("unsupported");
        Double volume=null;if(action.equals("volume")){Object raw=payload.opt("value");if(!(raw instanceof Number))return SystemRemoteController.error("invalid_volume");volume=((Number)raw).doubleValue();if(!Double.isFinite(volume)||volume<0||volume>100)return SystemRemoteController.error("invalid_volume");}
        if(source.equals("paired-apple-tv"))paired.command(action,volume);
        else {AirPlayService service=receiver;if(service==null)return SystemRemoteController.error("unavailable");
            if(action.equals("volume"))service.setClientVolume(volume.floatValue()/100f);
            else if(action.equals("play_pause"))service.toggleMediaPlayback();
            else if(service.getDacpController()!=null){if(action.equals("next"))service.getDacpController().nextItem();else service.getDacpController().prevItem();}
        }
        try{return new JSONObject().put("accepted",true);}catch(Exception ignored){return new JSONObject();}
    }
    private static String bounded(String value){return value.length()>512?value.substring(0,512):value;}
}
