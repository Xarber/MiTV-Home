// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

/** Restore only our own task via supported APIs. Never inject global keys or grant permissions. */
public final class HomeForeground {
    private HomeForeground(){}
    public static void request(Context context,boolean visual){
        new Handler(Looper.getMainLooper()).post(()->{
            Class<?> target=visual?io.github.jqssun.airplay.MainActivity.class:MainActivity.class;
            Intent intent=new Intent(context,target).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);
            if(visual)intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            else intent.setAction(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            try{
                ActivityManager manager=context.getSystemService(ActivityManager.class);
                // Own AppTask restoration does not require system-remote pairing.
                if(manager!=null)for(ActivityManager.AppTask task:manager.getAppTasks()){
                    android.app.ActivityManager.RecentTaskInfo info=task.getTaskInfo();
                    if(info.baseActivity!=null&&context.getPackageName().equals(info.baseActivity.getPackageName())){try{task.moveToFront();}catch(RuntimeException ignored){}break;}
                }
                context.startActivity(intent);
            }catch(RuntimeException unavailable){android.util.Log.w("MiTVPairing","foreground_request_unavailable "+unavailable.getClass().getSimpleName());}
        });
    }
    public static boolean accessGranted(Context context){return android.os.Build.VERSION.SDK_INT<29||Settings.canDrawOverlays(context);}
    public static void settings(Context context){
        Intent intent=new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,android.net.Uri.parse("package:"+context.getPackageName()));
        if(intent.resolveActivity(context.getPackageManager())==null)intent=new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,android.net.Uri.parse("package:"+context.getPackageName()));
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }
}
