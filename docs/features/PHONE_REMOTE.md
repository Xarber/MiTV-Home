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
assets are absent in a local compile. Run `npm --prefix demo run build` and copy
`demo/dist` there before building locally when testing the complete new web UI.

`phone.yml` prepares four independent artifact-only jobs: signed universal APK,
signed AAB, unsigned physical iOS IPA and ARM64 simulator app.zip. An unsigned IPA
requires external signing before ordinary device installation; a simulator bundle
cannot install on a phone. These are companion packages (`it.xarber.aurea.remote`),
never TV launcher updates (`it.xarber.mitvhome`). No store, phone update feed or
new website deployment is activated. Existing native-TV update feeds stay intact.
See [PWA behavior](PWA.md), [branding](../BRANDING.md) and the
[validation report](../reports/AUREA_PHONE_PWA.md).

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
