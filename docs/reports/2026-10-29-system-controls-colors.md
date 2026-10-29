# Android TV controls, build triage and TV colors — 29 October 2026

## Inspected and implemented

The phone/web TV controls panel now exposes standard Android KeyEvent actions:
Home, Back, volume/mute, channel up/down, previous/rewind/play-pause/fast-forward/
next/stop, programmable red/green/yellow/blue and VOICE_ASSIST. Mute uses the official
AudioManager API; other system-only keys use the paired Android TV Remote Service.
They are not falsely accepted as local Home navigation. Normal audio permission is
declared; no input-injection, accessibility, root or ADB runtime fallback is added.
Keys remain dependent on what the focused TV app supports. The microphone button
is explicitly labelled TV voice assistant; phone PCM capture/streaming is not yet
implemented, pending the user's microphone-mode choice. It does not request or
record microphone audio.

The protocol adapter remains pinned androidtvremote2 0.3.2, implementing the same
protocol used by Google TV; it is a third-party library, not a Google-supported
SDK. Java and Python key allowlists match the UI. Stored pairing and actual ready
state remain distinct. A read-only recovery worker reconnects every bounded backoff
interval; uncertain key delivery is never replayed. System connection errors use
system_connection_failed so the functioning launcher HTTP connection stays usable.

Private existing logs from the installed 2.0.4 showed system pairing completing,
then CannotConnect caused by ConnectionResetError in TLS establishment on loopback.
Ports were listening. The new compatibility fallback tries only an interface
address obtained from this TV by the native adapter, using the same client identity;
it never accepts a LAN target from a phone or web request. It retries connection
establishment, not commands, and cannot bypass InvalidAuth. This is an implemented
compatibility fallback, not a confirmed diagnosis or verified physical repair.
A new native build and fresh control attempt are required.

TV-only chroma compensation expands linear-light RGB around Rec.709 luminance,
capping gain before clipping. Computed luminance is preserved within 8-bit
quantization; neutral tones remain unchanged. It affects wallpaper/tint colors,
not banners, blur, waveform data or web/phone palettes. Camera photographs are not
calibration evidence; matching the physical TV to a laptop is not claimed.

## Exact failed-build findings

Run 40892093210: iOS simulator succeeded, as did the Android phone APK. The unsigned
IPA job had no build steps and was cancelled because GitHub could not acquire a
hosted runner, with explicit Apple Silicon capacity annotations. Device IPA now
cross-compiles ARM64 on standard macos-26-intel; simulator remains on macos-26 ARM64.
No larger paid runner or new distribution destination is used.

TV APK packaging succeeded; lint then reported MissingTvBanner and
ImpliedTouchscreenHardware in the TV overlay. Both attributes are now explicit in
that overlay, without suppressions. Contracts cover the source declarations.

The new tint test had sampled opacity once after 180 ms. Its failure snapshot
showed preference On. It now observes an actual intermediate frame and the exact
terminal opacity, and verifies playback/setup state. A nonworking/frozen fade
still fails. Three focused repeated Chrome runs passed. An attempted local
CI-channel run could not launch because that exact Chromium revision was absent;
no browser/toolchain was installed. This is not Linux Chromium execution proof.

## Validation scope and limits

TypeScript, model tests, Java key-scope checks, Python pairing/recovery/allowlist
checks, release consistency, actionlint and whitespace checks were executed.
Focused headless Chrome checks cover rendered TV-control buttons and the complete
wallpaper/tint transition test. Native system-key reception, self-interface TLS
fallback, hardware color appearance and iOS device build on the alternate runner
are pending CI/device validation. No new APK was installed this turn. The live TV
was queried read-only; its private diagnostics are outside Git. Existing Home,
AirPlay, blur, dock, stored preferences and signing identity are preserved.

Work stays on testing, with no beta/main promotion or release publication.

## Primary references

- Android KeyEvent: https://developer.android.com/reference/android/view/KeyEvent
- Pinned protocol implementation: https://github.com/tronikos/androidtvremote2/tree/v0.3.2
- Protocol voice support (not implemented in this UI): https://github.com/tronikos/androidtvremote2
- Standard GitHub runner labels: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
