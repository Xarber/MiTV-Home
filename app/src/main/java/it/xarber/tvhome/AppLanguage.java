package it.xarber.tvhome;
import android.content.Context;
import android.content.res.Configuration;
import java.util.Locale;
import java.util.HashMap;
/** Per-app language preference; it never changes the television's system language. */
public final class AppLanguage {
 private AppLanguage() {}
 private static final HashMap<String,String> IT=new HashMap<>();
 static {
  IT.put("Customize input","Personalizza ingresso");
  IT.put("Pin to dock","Aggiungi al dock");
  IT.put("Dock position %d","Posizione %d del dock");
  IT.put("Empty","Vuoto");
  IT.put("Remove from dock","Rimuovi dal dock");
  IT.put("All apps returns to the dock","Tutte le app torna nel dock");
  IT.put("All apps restored to the dock","La libreria app è tornata nel dock");
  IT.put("Inputs returns to the dock","Ingressi torna nel dock");
  IT.put("Inputs restored to the dock","Ingressi ripristinati nel dock");
  IT.put("Uninstall","Disinstalla");
  IT.put("Phone remote","Telecomando dal telefono");
  IT.put("Scan with your phone on the same Wi-Fi","Scansiona con il telefono sulla stessa rete Wi-Fi");
  IT.put("Open the phone remote","Apri il telecomando dal telefono");
  IT.put("Close","Chiudi");
  IT.put("Inputs","Ingressi");
  IT.put("Apps","App");
  IT.put("All apps","Tutte le app");
  IT.put("System apps","App di sistema");
  IT.put("System","Sistema");
  IT.put("Controls","Controlli");
  IT.put("App library","Libreria app");
  IT.put("INPUTS & LIVE TV","INGRESSI E TV IN DIRETTA");
  IT.put("APPS","APP");
  IT.put("Live TV","TV in diretta");
  IT.put("Casting","Trasmissione");
  IT.put("Control Center","Centro di controllo");
  IT.put("Control Center, time and date","Centro di controllo, ora e data");
  IT.put("Network settings","Impostazioni di rete");
  IT.put("Offline","Non connesso");
  IT.put("Connected","Connesso");
  IT.put("No signal","Nessun segnale");
  IT.put("Open","Apri");
  IT.put("App information","Informazioni app");
  IT.put("System settings","Impostazioni di sistema");
  IT.put("Settings","Impostazioni");
  IT.put("Back to Home","Torna alla Home");
  IT.put("Network","Rete");
  IT.put("Sound","Audio");
  IT.put("Remote","Telecomando");
  IT.put("Use a phone on the same Wi-Fi","Usa un telefono sulla stessa rete Wi-Fi");
  IT.put("AirPlay audio","Audio AirPlay");
  IT.put("AirPlay audio controls","Controlli audio AirPlay");
  IT.put("Phone Remote  •  %s","Telecomando  •  %s");
  IT.put("Pairing request  •  Code %s","Richiesta di abbinamento  •  Codice %s");
  IT.put("Phone remote unavailable on this network","Telecomando non disponibile su questa rete");
  IT.put("TV audio settings","Impostazioni audio TV");
  IT.put("Display","Schermo");
  IT.put("Picture settings","Impostazioni immagine");
  IT.put("TV settings","Impostazioni TV");
  IT.put("All settings","Tutte le impostazioni");
  IT.put("Settings, Play Store & more","Impostazioni, Play Store e altro");
  IT.put("HDMI & Live TV","HDMI e TV in diretta");
  IT.put("Always available in the background","Sempre disponibile in background");
  IT.put("Built-in receiver settings","Impostazioni del ricevitore integrato");
  IT.put("Ready to receive","Pronto a ricevere");
  IT.put("Starting receiver…","Avvio del ricevitore…");
  IT.put("Done","Fine");
  IT.put("Language","Lingua");
  IT.put("Italian","Italiano");
  IT.put("English","English");
  IT.put("Current language","Lingua attuale");
  IT.put("No launchable apps in this folder","Nessuna app avviabile in questa cartella");
  IT.put("HDMI only","Solo HDMI");
  IT.put("Not registered on this device","Non registrato su questo dispositivo");
  IT.put("Broadcast channels","Canali televisivi");
  IT.put("This screen is unavailable on this TV","Questa schermata non è disponibile su questa TV");
  IT.put("Preview: this emulator has no physical HDMI ports","Anteprima: questo emulatore non ha porte HDMI fisiche");
  IT.put("This HDMI port is not registered; choose an input below","Questa porta HDMI non è registrata; scegli un ingresso qui sotto");
  IT.put("Preview: this emulator has no broadcast tuner","Anteprima: questo emulatore non ha un sintonizzatore TV");
  IT.put("Live TV is unavailable","La TV in diretta non è disponibile");
  IT.put("Artwork preview only — open this app on the television","Solo anteprima grafica: apri questa app sulla televisione");
  IT.put("Connecting to AirPlay…","Connessione ad AirPlay…");
  IT.put("Choose %s in Screen Mirroring or AirPlay.\n\nThe receiver starts with Home and remains available in the background.","Scegli %s in Duplica schermo o AirPlay.\n\nIl ricevitore si avvia con la Home e rimane disponibile in background.");
 }
 public static String code(Context c){return c.getSharedPreferences("home_language",0).getString("language","it");}
 public static boolean italian(Context c){return !code(c).equals("en");}
 public static Context wrap(Context c){Locale locale=Locale.forLanguageTag(code(c));Locale.setDefault(locale);Configuration cfg=new Configuration(c.getResources().getConfiguration());cfg.setLocale(locale);cfg.setLayoutDirection(locale);return c.createConfigurationContext(cfg);}
 public static void set(Context c,String code){c.getSharedPreferences("home_language",0).edit().putString("language",code).apply();Locale locale=Locale.forLanguageTag(code);Locale.setDefault(locale);Configuration cfg=new Configuration(c.getApplicationContext().getResources().getConfiguration());cfg.setLocale(locale);c.getApplicationContext().getResources().updateConfiguration(cfg,c.getResources().getDisplayMetrics());c.sendBroadcast(new android.content.Intent("it.xarber.tvhome.LANGUAGE_CHANGED").setPackage(c.getPackageName()));}
 public static String text(Context c,String source){if(!italian(c))return source;String full=IT.get(source);if(full!=null)return full;String[] lines=source.split("\n",-1);for(int i=0;i<lines.length;i++){if(lines[i].startsWith("Edit HDMI "))lines[i]="Modifica HDMI "+lines[i].substring(10);else lines[i]=IT.getOrDefault(lines[i],lines[i]);}return String.join("\n",lines);}
}
