# Aurea Remote

## Scope and testing

The existing Expo companion has two entry points: `/` shows the TV demo;
`/?remote=1` and native iOS/Android show the separate phone remote. Add
`&preview=1` for an explicitly selected, isolated example TV. Preview never calls
physical devices or saves credentials. No native OS Live Activities are used.
Use `http://localhost:8765/?remote=1&preview=1` for local testing. This URL is
on the development computer; a phone cannot reach another computer's localhost.
Use the CI Android package on a phone or an explicitly configured secure LAN
preview. Do not expose Metro to untrusted networks.

The TV is off during this implementation. Physical system-service pairing,
background Home/navigation, phone installation and AirPlay coexistence remain
unverified. Web and host tests are not evidence of those native capabilities.

## Saved televisions and connection lifecycle

Up to 16 saved televisions have independent tokens, stable random receiver IDs,
addresses, friendly names and last-used timestamps. Settings lists saved TVs;
selecting one cancels prior requests and discards stale responses. Add television
starts a separate pairing. Forget affects only the selected TV and requests token revocation when it is reachable; if it is offline, use the TV’s revoke-remotes control later. Read-only state
polling retries with bounded exponential backoff (0.5–30 seconds, jitter); button
presses, app launches and media commands are not queued for replay. Authentication
failure stops retries. An unauthenticated identity probe precedes token use; a
changed device at the same IP requires explicit pairing rather than receiving the
old TV's token. A device ID detects accidental address reuse, not an authenticated
TLS identity. The HTTP TV listener must only be used on trusted home Wi-Fi.

Native trust is stored in Expo SecureStore. Secure web contexts use IndexedDB,
AES-GCM and an origin-scoped non-extractable WebCrypto key; records are validated
and mutations serialized. This does not protect against arbitrary script execution
in that origin. Plain HTTP origins use tab-session storage, so pairing is not
promised across browser restarts. Legacy single-TV records migrate only after a
successful write. Damaged storage is preserved and reported, never replaced with
an empty list.

## TV implementation

`HomeRemoteService` is an explicitly stoppable connected-device foreground service.
It owns one local `HomeRemoteServer`, encrypted trust, the actual application/input
catalog, playback adapter and system-key adapter. Home attaches a weak foreground
reference; closing it does not stop the listener. Force-stop, OS restrictions and
network loss can still make the TV unreachable. No ADB or accessibility input
injection is used.

The custom API controls existing launcher actions while Home is visible. For
navigation outside Home, `SystemRemoteController` uses the existing Python runtime
and pinned `androidtvremote2` 0.3.2 to pair with Android TV Remote Service **only on
127.0.0.1**. This is a separate six-hex-digit system pairing, requested in phone
settings. Missing/incompatible system services return an error. A user-granted
overlay capability can return Home as a fallback; volume can use AudioManager.
Launching a catalog target from another app requires Aurea to be the default Home
or an appropriate existing overlay grant. No new grant is enabled automatically.

Phone music controls use actual receiver or paired-Apple-TV metadata. Receiver
streams take priority. Commands include their source and reject a changed source.
Artwork is bounded, supplied by the player and fetched only when its ID changes.
Phone-visible playback ownership and Home ownership are independent; a phone
presence lease keeps the paired-client observer active while Home is in background.
Closing the phone app releases that lease. Animated bars are decorative rather
than measured audio on the phone. AirPlay mDNS registrations refresh after network
changes without restarting the receiver engine or claiming a sender can be forced
to reconnect.

## API and browser trust

All authenticated endpoints are bounded JSON POST requests with a token. `/hello`
returns only schema and a random application device ID. `/pair/start` requests a
physical TV code; `/pair` accepts it and issues a token. Routes:
`/api/state`, `/api/catalog`, `/api/icon`, `/api/artwork`, `/api/key`, `/api/launch`,
`/api/media`, `/api/presence`, `/api/revoke`, `/api/system/pair/start`, `/api/system/pair/finish`.
App/input targets must come from the actual allowlisted catalog, never arbitrary
intent URLs. Six-digit pairing has expiry, attempt limits and TV notification.

Browser tokens are bound to the exact requesting HTTPS origin; native and
same-TV-origin clients have a separate empty-origin trust class. No cookies or
wildcard credentialed CORS are used. CORS preflight permits public pairing/identity
routes and previously paired origins for the API; token validation still occurs
on every action. Foreign insecure origins are rejected except localhost development.
The TV displays the requesting browser origin with its code. Host/size/content-type
and duplicate-header checks remain mandatory.

A secure PWA can request private-network access through supported browser APIs
(`targetAddressSpace`); availability and browser permission vary. Safari or other
browsers may reject secure-to-HTTP LAN access. Use the native companion or the
TV-hosted same-origin page in that case. Do not disable browser security.

## Builds and recovery

The native TV pipeline embeds the exact-commit Expo web export in
`app/src/main/assets/remoteapp/`. The old bundled remote remains a fallback if those
assets are absent in a local compile. Run `npm run build` and copy
`dist` there before building locally when testing the complete new web UI.

The single `build.yml` workflow produces Android phone APK/AAB through the shared root native host, alongside TV APK/AAB. Internal `phone.yml` builds iOS unsigned device IPA and ARM64 simulator app.zip. Internal `demo.yml` validates the exact web export. Run only `gh workflow run build.yml --ref testing`; no dependency-run selection or separate workflow is required.

The entire application is bundled; mobile opens the remote by default. Phone packages remain separate from the TV updater. See [RELEASES.md](../RELEASES.md) for artifacts, complete release gates and installation restrictions.

### Android asset packaging

AGP 9.4's default asset filter skips underscore-prefixed directories, including
Expo's `_expo`. Version 1.8.1 retains the other default filters while allowing
those directories. Release validation checks HTML script/link references and every
exported web asset inside both APK and AAB, preventing a working HTML shell with
missing JavaScript from being published. The defect was found by fetching the
actual installed TV's script URL; browser-only exports did not expose it.

TV integration now runs behind the Expo Home surface. The production package owns
the existing remote/receiver services; isolated preview packages deliberately do
not advertise duplicate receivers or listen on the TV remote port. Test pairing
and activities with the production-package candidate, not the isolated UI preview.

## 2.0.1 native phone corrections

Popups measure native triggers relative to the same root used for their material and content. Safe-area/keyboard bounds prevent clipping; phone-only materials use native iOS Liquid Glass when both Expo availability checks pass, native iOS blur otherwise, and the existing live Android blur target on Android. TV blur parameters are unchanged. Back traverses the visited submenu stack; outside dismissal still closes the whole popup.

Remote buttons include combined Play/Pause, Menu and Control Center. Holding OK opens an item menu; holding Back opens Control Center. Menu works through authenticated launcher commands or the paired Android TV Remote Service; Control Center requests require Home. App grids use fixed row gaps and independent column spacing. Physical input IDs are stable while TV customization or a CEC child name supplies the display label and logos.

System pairing distinguishes accepted trust from control-channel readiness. If the pairing socket closes, success requires authenticating the control channel with the same certificate. Explicit pairing acknowledgements remain saved if the control channel is temporarily reconnecting. HTTP requests use bounded parallel workers so the pairing exchange cannot block normal state refreshes.

The Android phone build never renders Native TV Home merely because it was installed on a television and does not register a Leanback launcher entry. It remains a different package from TV production. Package identity cannot migrate automatically across historical prototypes.

Developer Preview launcher requests landscape and restores the previous orientation policy on exit. Resizable iOS 27 windows and browsers can refuse orientation locks; the layout continues to adapt to the actual window. These changes require a native binary; they are not an OTA update.

### Wallpaper and palette rendering (2.0.2)

The optional state `wallpaper` object carries canonical TV preference `id`, `motion`
and `musicTint`. Older servers remain compatible and use the remote's Ink fallback.
The remote renders one full-window background, with centered controls on desktop;
popup anchors use that same full-window coordinate space. Artwork-derived colors
crossfade for 1.8 seconds in tint and spectrum gradients. Rapid changes begin from
the currently blended palette; reduced motion applies the target immediately.
Six shared spectrum bars use their actual height with a minimum equal to their
width, preserving circular zero levels in collapsed and expanded views. Existing
native receiver bands remain measured; remote-player fallback bars are animation.

### Home ownership and paused activities (2.0.4)

Optional music.activityVisible is false after five paused minutes; active playback
state is preserved for controls, and playback restores visibility. A matching UI
clock supports older servers. Home uses canonical Android Home/task restoration
without system pairing, acknowledges foreground arrival, and reports missing
background access. Remote settings on the TV expose Android's Display over other
apps permission page. The grant remains user-controlled. Other apps' navigation
continues to require the system remote service.

### Extended Android TV controls (2.0.5)

TV controls groups the standard system-service keys separately from local Home
navigation: channels, media transport, colored keys and TV voice assistant.
A quick mute button uses AudioManager. System-only controls require pairing;
read-only reconnection never repeats a key after uncertain delivery. The TV-side
adapter starts with loopback and can fall back only to an interface address of
this same TV supplied by native code. A system_connection_failed error preserves
the working launcher bridge. Phone-microphone streaming is not implemented; voice
currently opens the TV's assistant. Actual key behavior depends on the TV/app.

### Phone microphone (2.0.6)

The phone controls button now captures the phone microphone instead of sending
only the assistant key. See [voice capture, encryption and compatibility](PHONE_VOICE.md).
Native phones request recording consent; secure browsers use AudioWorklet.
The TV's HTTP remote page explains the browser restriction. No audio files are
saved; sessions stop on cancellation/background/disconnect and after 30 seconds.
