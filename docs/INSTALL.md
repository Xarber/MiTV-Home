# Install & restore

Keep the original Home app and TV services installed. No factory reset or system package removal is needed.

1. Download the APK from Releases.
2. Install with a trusted TV file manager or `adb install -r MiTV-Home.apk`.
3. Press Home and select MiTV Home, or use your TV's default Home app setting.
4. Open Control Center for network, display, sound, language, AirPlay, and the phone remote.

ADB debugging varies by firmware. A USB debugging toggle on Android 10 does not guarantee a network ADB listener. Check the actual device and approve the computer on the TV.

## Controls

Press OK to open. Hold OK on an app, source, Sources, or All Apps for its menu. Hold Back for Control Center. Down moves dock → Inputs → apps; Up reverses the transitions. Left/Right stop at the dock edges.

All Apps can occupy only position six. Sources and individual inputs can occupy any position. Removing an item from position six restores All Apps. Removing Sources from another position fills it with an available app.

## Phone remote

Choose Remote in Control Center and scan the QR with a phone on the same network. It includes the pairing code and pairs automatically, then closes the panel on the TV. The code is also displayed in that panel for manual entry. If the panel is closed, a new browser pairing request shows its code briefly at the upper left. The server runs only while Home is foreground.

Port 80 is attempted first. If Android denies it, the QR includes port 8765. Omitting that port requires privileges unavailable on a stock MiTV-MOOQ0.

## Restore the original Home app

Choose the original launcher in system default-app settings, then press Home. Keep it installed so this remains reversible. Do not clear app data or uninstall the launcher to resolve a signing mismatch without first backing up its preferences.

## Updates

Install an APK signed with the same key as the installed app. Public releases use a dedicated project key; local debug builds use Android's debug key. Android rejects mismatched signatures.
