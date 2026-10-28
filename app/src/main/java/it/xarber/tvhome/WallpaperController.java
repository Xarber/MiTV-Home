// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.content.SharedPreferences;
import android.graphics.drawable.Drawable;
import android.widget.LinearLayout;

/** Presentation preferences and bounded wallpaper updates, independent of receiver services. */
final class WallpaperController {
    private final LegacyHomeActivity home;
    private final Runnable frame=new Runnable(){@Override public void run(){
        if(home.resumed&&!home.libraryVisible&&home.systemBackdrop&&home.motionEnabled()
                &&preferences().getBoolean("wallpaper-motion",false)
                &&!preferences().getString("wallpaper","classic").equals("classic")){
            if(home.heroImage!=null)home.heroImage.invalidate();
            home.handler.postDelayed(this,80);
        }
    }};
    WallpaperController(LegacyHomeActivity home){this.home=home;}
    private SharedPreferences preferences(){return home.getPreferences(0);}
    Drawable art(){
        String id=preferences().getString("wallpaper","classic");
        return id.equals("classic")?home.asset("hero_system_background")
            :new WallpaperArt(id,home.motionEnabled()&&preferences().getBoolean("wallpaper-motion",false));
    }
    void refresh(){pause();if(home.resumed)home.handler.post(frame);}
    void pause(){home.handler.removeCallbacks(frame);}
    private void apply(){
        home.closePanel();home.heroKey="";
        for(LegacyHomeActivity.Entry source:home.sources.values())home.decorateInput(source);
        home.renderHome();
        home.showHero(home.action("inputs","Inputs","inputs",home.hdmiArt));
        refresh();
    }
    void show(){
        LinearLayout rows=home.dialog("Wallpapers");
        String chosen=preferences().getString("wallpaper","classic");
        for(int i=0;i<WallpaperArt.IDS.length;i++){
            final String id=WallpaperArt.IDS[i];
            home.addControl(rows,WallpaperArt.LABELS[i],chosen.equals(id)?"✓":"",()->{
                preferences().edit().putString("wallpaper",id).apply();apply();
            });
        }
        home.addControl(rows,"Animated wallpapers",preferences().getBoolean("wallpaper-motion",false)?"✓":"",()->{
            preferences().edit().putBoolean("wallpaper-motion",!preferences().getBoolean("wallpaper-motion",false)).apply();apply();
        });
        home.panel.show();home.focusFirst(rows);
    }
}
