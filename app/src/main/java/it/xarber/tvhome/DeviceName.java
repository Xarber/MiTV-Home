package it.xarber.tvhome;
import android.content.Context;
import android.provider.Settings;
/** The user-assigned system name, never the hardware model. */
public final class DeviceName {
 private DeviceName() {}
 public static String read(Context c){
  String name=Settings.Global.getString(c.getContentResolver(),"device_name");
  if(name==null || name.trim().isEmpty())name=Settings.Secure.getString(c.getContentResolver(),"bluetooth_name");
  return name==null || name.trim().isEmpty()?"AirPlay TV":name.trim();
 }
}
