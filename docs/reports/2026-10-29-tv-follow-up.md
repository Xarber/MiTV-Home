# TV follow-up and CI diagnosis — 2026-10-29

## Scope

Inspected the Expo Home, native focus adapter and keyboard hook, blur/material and preference paths, native/phone pairing, persistent HTTP remote, playback adapters, native packaging and build workflows. This was not a whole-application audit. No physical TV operations were attempted because the user said it is powered off.

## Implemented

- Preserve the live blur method, values, shading and default appearance. Add an independent Disable blur switch and backward-compatible backup preference.
- Keep the dock layout. Slightly increase native status controls, Control Center, category tabs and input icons; retain input label and hero logo sizes. Give status pills a dark contrast base for white banners.
- Read Home music through the same persistent receiver adapter that supplies the working remote UI, with a local fallback and immediate receiver mode-change notification. Start service bindings on Android's main thread.
- Refresh pending Apple TV pairing state on resume/Home, rather than resetting from stale cached state.
- Preserve header focus across page snaps and remember the last item per page. Bound duplicate/repeat directional events, allow recovery after missing key-up, and focus playback controls instead of song text.
- Show explicit phone pairing completion for launcher trust and ready system-remote handshakes. Return Home without system pairing when Android permits this launcher to start its own activity.
- Let the QR panel wait briefly for persistent HTTP service startup. Keep actual port/URL reporting and Android's supported fallback.
- Preserve developer Recovery Home and record the requirement permanently in repository guidance.

## Failed build evidence

Run 40760050126: both iOS unsigned and simulator jobs succeeded. Android phone APK/AAB compiled but failed at mergeReleaseNativeLibs: duplicate libairplay_native.so from historical jniLibs and current CMake output. Full source builds now exclude historical prebuilt JNI folders; explicit bundled-native previews retain their designated prebuilt folder.

All four reused native wheel jobs failed because the previous artifacts lacked the required single provenance record. Integrity validation stays enabled. The cache namespace is invalidated and the next full run must cross-compile fresh wheels. Android companion jobs consume the verified artifacts from that parent run; independent iOS jobs run in parallel with dependency preparation. Publication additionally requires iOS completion. Nothing is released from testing.

## Checks and limitations

TypeScript validation passed. All 20 Expo model/navigation/remote tests passed, including two targeted pairing-confirmation regressions. Host checks passed: 32 Python cases ran, with two protocol-environment-dependent cases skipped. Workflow validation with actionlint and Git whitespace checks passed. A test fixture initially failed because its pairing response shadowed the token; the fixture was corrected and the suite rerun successfully.

There was no browser visual session, emulator session, Android native build, physical TV check, Mac HTTP handshake or physical AirPlay test. A successful model check does not establish that the reported TV regressions are resolved. The submitted GitHub workflow must establish native packaging; the user will verify the real TV behavior.

## Storage and deployment

Removed only disposable intermediate output under /private/tmp/aurea-expo-build/android (401 MiB apparent size). Source, dependencies, signing keys and rollback APKs were retained. No application was installed, uninstalled or reset. The existing production installation and legacy recovery renderer remain intact. No promotion to beta/main is included.
