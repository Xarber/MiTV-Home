# Phone microphone implementation — 2026-10-29

Scope: phone TV controls, local microphone module, encrypted voice transport,
TV-side Android remote adapter, packaging and associated tests/docs. Existing
blur, dock, wallpaper colors, identifiers and signing identities are preserved.
Native and browser audio stays in memory; no recordings are saved to disk.

## Implemented

- Phone microphone button with recording consent, red Listening state and tap stop.
- Android AudioRecord, iOS AVAudioEngine/converter and secure-browser AudioWorklet.
- Encrypted bounded packet API, single-owner sessions, replay/nonce checks, deadlines,
  cleanup on cancellation/background/disconnect/switch/revocation. No key replay.
- Local module copied into the isolated iOS staging workspace; permissions only in
  phone variants. Android TV does not request RECORD_AUDIO.
- Version 2.0.6 / build 33; structured bilingual release metadata/docs updated.

## Verification

- TypeScript check: passed.
- Node regression suite: 35 passed, including permission/network cancellation,
  chunk ordering, no retry after failure, TV-switch binding and preview isolation.
- Host Java checks and release consistency: passed. Python default host suite:
  57 tests, 8 skipped where optional host dependencies are absent.
- Existing Python environment with cryptography 50.0.2: all five real RSA/AES voice
  checks and all ten system-remote tests passed, including voice dispatch/cleanup.
  The dependency CI job runs these with the pinned crypto dependency installed.
- Android local module release Kotlin compilation: passed using existing SDK/cache
  in offline mode. This is module compilation, not a full Android release build.
- Expo local-module Android and Apple autodiscovery: passed; production web/PWA export passed.
- Chrome browser checks: standard TV controls passed; secure-browser AudioWorklet
  capture, real RSA/AES decrypt interoperability, chunk ordering and stop passed
  with a fake microphone and mocked TV endpoint. No physical audio was used.
  The initial test used a nonexistent controls selector; corrected to the actual
  TV controls button and rerun successfully.
- Swift source grammar parse: passed. Full iOS local type/build validation unavailable:
  installed Xcode link points to an unmounted external volume; SDK cannot be found.
  No SDK/toolchain was installed. iOS remains subject to the full remote build.

Workflow syntax validation with actionlint: passed.

The preceding 2.0.5 full workflow 40901651385 completed successfully for iOS unsigned,
iOS simulator and Android TV/remote APK/AAB. New 2.0.6 native workflow is separate;
submission is not a completed build. No new APK was installed on the TV or phone,
no release was published, and no physical microphone/assistant test is claimed.

## Git and rollback

Development stays on testing; no branch promotion or temporary worktree cleanup is
needed. Previously approved command-scoped unsigned commits preserve global signing
configuration. Existing installed TV remains a rollback boundary until a native
candidate is built and explicitly installed. No preferences or trust were cleared.
