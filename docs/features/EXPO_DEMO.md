# Expo Home, web preview, and phone companion

The user explicitly approved Expo as the application base on 28 October 2026.
This supersedes the earlier demo-only boundary. Root package.json, lockfile,
App.tsx and TVHome.tsx are the shared application entry points.

## Development

Run `npm ci`, `npm run typecheck`, `npm test`, then `npm run build` at the root.
`python3 scripts/start-demo-preview.py` starts the production web export on
http://127.0.0.1:8765. `/?remote=1` opens the phone remote; add `&preview=1` only
for its isolated demonstration. The web Home keeps fixture apps/music, never
claims to control local Android hardware, and retains keyboard navigation/PWA.

Native Android Home uses React Native TV 0.88.0-0 with Expo 58, React 19.3,
Reanimated 4.7.1 and Worklets 0.13.0. The TV fork prerelease is outside npm's
ordinary semver peer ranges; committed .npmrc preserves the pinned, SDK-matched
set. Do not replace it with upstream React Native incidentally. Expo 58's bare
host requires Gradle 9.4.1 / AGP 9.2.1 and explicit Kotlin plugin opt-outs.

`./gradlew :app:assembleRelease` bundles the actual Expo Home into the existing
handwritten Android host. It also needs the project's original native media and
Android Python dependency preparation, documented in BUILDING.md. No Metro server
is needed by a release APK. Keep the default Home/package/signing identity.

Phone builds set `AUREA_TARGET=remote`, run `python3 scripts/phone/prepare.py`, and
run Expo prebuild only in the ignored `.phone-native` workspace. The script refuses
to overwrite an existing workspace. CI builds iOS device/simulator and Android
APK/AAB independently. Never run `expo prebuild --clean` over the TV host.

Italian strings reuse the established native dictionary via
`python3 scripts/expo/localization.py`; newer Expo-specific labels live in i18n.ts.
See ARCHITECTURE.md and decisions/0003-expo-home-base.md for migration boundaries.

## Native verification builds

Use `gh workflow run build.yml --ref testing` for complete native verification. All TV and phone formats build from source with the exact web export; older isolated ARM preview workflow switches have been retired. Validate signatures, package identifiers, source/version and rollback before installation. No release is published from testing.

SSID names can be redacted by Android when location access is missing. Network
settings exposes the official permission/settings flow and never grants it silently.
Reference: [Android WifiInfo/getSSID](https://developer.android.com/reference/android/net/wifi/WifiInfo#getSSID()).

## Phone control of the browser demo

Run `npm run demo:remote` to start the exported web app and its local Node bridge
on port 8768, detached from the terminal. Open `http://127.0.0.1:8768/` on the
computer. In Control Center → Remote, open the displayed LAN URL on the phone.
Enter the six-digit notification code from the computer's launcher. No Android
system pairing is needed. The phone controls fixture apps, inputs, music and
navigation in that browser tab. Its wallpaper follows the demo's selection.

The server advertises `_aurea-remote._tcp` with `role=demo` using macOS `dns-sd`
or Linux `avahi-publish-service` when installed. Direct URLs work without Bonjour;
browsers do not provide a general Bonjour browsing API or incoming HTTP listener.
A static public website cannot provide this alone. The owner tab must remain open
on the host computer. One owner tab controls the session; a reload reconnects.
The server must be reachable on the same trusted LAN and the host firewall must
allow its port. HTTP on LAN uses session-only credential storage in the web remote.
Restarting the demo server changes its identity and requires fresh pairing.

The bridge never calls ADB, Android platform adapters, or real playback. Owner
commands require a loopback-only header credential; phone PINs and origin-bound
session tokens exist only in memory. PINs are displayed on request, expire after
five minutes, and are rate-limited. Commands are not queued or replayed during
owner disconnection. State explicitly carries `provenance: simulated` and a `demo`
music source. Do not expose this development bridge to the public Internet.

`npm run test:demo-bridge` checks separate launcher/phone browser pages, PIN pairing,
app launch, music activity, navigation, wallpaper synchronization and owner reload.
