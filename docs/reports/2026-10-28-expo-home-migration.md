# Expo Home migration checkpoint

Scope: root Expo application, Android React host/platform adapter, shared TV UI,
separate phone workspace, build workflows and associated documentation. This is
not a full application audit or a stable release approval.

Implemented in source: native React Home entry, real installed app/banner and
registered-input catalog, retained dock/preferences, receiver and paired-device
playback adapter, actual spectrum events, native service actions, anchored panels,
D-pad scope/focus handling, update actions, Italian dictionary reuse and root PWA.
Legacy UI is an explicit recovery screen, not the default Home.

Observed checks:

- Root TypeScript passed after initial UI/platform integration.
- Eight model/reconnection tests passed.
- Browser Chrome regression suite: 17 passed, including keyboard, activities,
  remote pairing persistence and offline shell. These are browser checks only.
- Host/release checks passed; 32 Python tests completed with two dependency-bound
  skips. This is not a physical AirPlay protocol test.
- Android Java/Kotlin compilation passed after aligning Expo 58 / Gradle 9.4.1 /
  AGP 9.2.1 and fixing generated-source configuration order. Subsequent settings/
  changelog/backup additions still require compilation in the remote build.
- Full local preview APK did not complete: relocated Reanimated codegen first
  failed (fixed by retaining library default build directories), then local disk
  exhaustion interrupted the build. No completed Expo APK or deployment is claimed.
- Disposable old build/Gradle/npm caches and failed preview C++ intermediates were
  removed. Source, installed dependencies, signing material and rollback APKs stay.
- The physical TV is offline in ADB at this checkpoint. Its last installed working
  package remains 1.8.1/code25 with the old native UI.

Next gate: manual isolated ARM preview build using verified unchanged media bytes,
install under the separate preview package, and inspect fresh physical TV screens,
D-pad, app/HDMI routes and lifecycle. Only then replace the production package and
verify retained preferences/services. Full four-ABI native builds and phone format
validation are separate release gates. No promotion to stable is authorized by
these partial results.

## First physical preview and follow-up fixes

Run 40746867768 built the release-mode ARM preview from 445ac55 successfully.
Its checksum, established certificate, preview package, version/code, minimum API,
embedded Hermes bundle and ARM host library were verified before installation.
The separate preview ran on the physical Android 10 MiTV. Fresh private screenshots
confirmed the Expo interface and actual installed app banners. It deliberately did
not bind/start receiver or remote listeners, so this does not verify AirPlay,
remote pairing or production preference retention.

The user reported density/layout, hero frame, focus and clipping defects in that
preview. Follow-up source changes fit the web canvas to TV density, lower/widen the
dock with concentric padding/radii, remove the header wordmark, fix the full-screen
banner frame, refresh focus geometry after snapping, maintain scroll geometry,
contain rounded popup materials and inset scroll content. Wi-Fi name access now has
an explicit Android permission/settings path; no permission is silently granted.
See Android's WifiInfo/getSSID reference for SSID redaction requirements.

The follow-up candidate build must use the actual production package to exercise
native listeners and retained preferences. It is an ARM validation candidate, not
a universal release. Stable and beta publication remain separate validation gates.

Additional checks for the follow-up source batch: 18 model/focus/hold/reconnection
checks passed; Chrome browser regression suite passed all 17 checks; Android phone
prebuild succeeded in the isolated workspace with the pinned TV fork preserved.
No iOS native build or actual phone hardware validation is implied. Native runtime
warnings exposed fractional SVG strings, now normalized; idle snapshot equality,
minute-boundary clock updates and active-page-only artwork reduce unnecessary TV
work. Follow-up geometry/material fixes still await the matching physical APK.
