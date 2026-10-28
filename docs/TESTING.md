# Testing strategy

`scripts/check-host.sh` runs Java host checks for developer unlock/idle/navigation lifecycle and hostile remote HTTP framing, Origin/Host, size/type/truncation cases. It also validates structured release history, version/license and generated changelog consistency.

Build UI previews with existing tools: `./gradlew -PuseBundledNative :app:assembleDebug :app:lintDebug`. Full release builds compile all four Android ABIs from pinned native source in Actions. Native FairPlay regression instructions remain in tests/native/README.md; these validate protocol framing, not Mac Music playback.

For UI batches use a fresh StudioTV screenshot/UIAutomator dump after install. Check About, first install/update behavior, Italian/English, triple-press unlock, focus/D-pad, 30s timeout, navigation/background relock, long developer history, settings export validation and safe diagnostics content. Never clear data on the user's TV to simulate first install. Test version-state logic with an isolated application id/emulator when necessary.

Hardware checks require the physical target: real HDMI/Live TV, AirPlay audio/video, remote LAN pairing, receiver background behavior and friendly name. Preserve app data and signing identity; stop active streams before installation. Record untested paths explicitly in docs/reports. Do not publish screenshots containing PIN, QR credentials, SSID or private network details.

CI verifies APK signatures, AAB JAR signature presence/verification, ZIP integrity, four ABIs, version/code, embedded commit/channel, release-history content, checksums and bundletool structure. Required job failures block publication while successful artifacts remain downloadable.

## Expo checks

At the root, run `npm run typecheck`, `npm test`, `npm run build`,
`npm run test:e2e` and `npm run test:pwa`. Pure focus tests use artificial rectangles
to verify stale-page correction, separate fixed/scrolling geometry and hold/release
ownership. They are regression checks, not evidence of native rendering.

Manual `build.yml` with `expo_preview=true` validates the unchanged media source
before using a previously verified signed media binary for ARM UI candidates.
It produces an isolated preview plus an in-place production-package candidate.
These do not replace full four-ABI source builds. Always inspect fresh screenshots
and native state on the intended physical TV before declaring the migration deployed.
