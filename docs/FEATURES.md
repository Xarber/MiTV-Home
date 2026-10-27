# Implemented features

- Six-position customizable dock; All Apps only in position six. Sources is an ordinary pinnable shortcut. HDMI and Live TV can be pinned.
- Dock, Sources/Live TV, and app-grid snap positions; down hint; horizontal dock edges retain focus. Installed/system/casting app groups use app banners before text fallbacks.
- Device-logo source banners, slow banner zoom and crossfade, frosted surfaces, heavy popup/library contrast, reduced-motion fallback.
- Localized Italian/English controls, Wi-Fi detail reveal and time/date control bubble.
- Integrated background AirPlay receiver using the TV's friendly name. Screen mirroring/video fullscreen; audio uses six measured bass-to-treble bands and album-derived two-color gradient.
- Music and remote activities reveal short details, retain focus order and allow black or transparent backgrounds. Audio popup controls focus, album art, timeline and volume.
- Home-only HTTP remote, short-lived QR/PIN pairing, bounded token set, 5s presence heartbeat and 15s expiry. Port 80 attempted; 8765 fallback on restricted Android.
- About: version/commit footer, persistent icon-led changelog with expandable feature/fix details, once-per-update What's New (suppressed on first install), licenses and source link, export/import presentation preferences.
- Hidden developer tools: version triple press, 30s inactivity expiry, background/tab lock, safe report copy/share, allowlisted event history, notification simulation and remote revocation.

## Limits

Mac Music playback is unresolved; do not advertise complete AirPlay 2/FairPlay v2 support. User reported iPad radio and local library working. DRM/photo/sender-specific modes require actual validation. Live HDMI/tuner behavior depends on TV manufacturer APIs. No external plugin loader, iOS app, OTA engine, root/port bypass, debloating or store submission is implemented.
