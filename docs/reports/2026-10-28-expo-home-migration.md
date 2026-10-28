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
