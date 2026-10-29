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

Use the single `build.yml` full workflow for native verification. It always compiles all supported native formats; the earlier isolated-preview switches are retired. Test outcomes and build artifacts are reported separately and all checks remain release gates.

For browser checks without interrupting an existing local preview, use `DEMO_PORT=8877 npm run test:e2e`. Pairing tests acknowledge the real completion dialog and verify encrypted storage, reloading, multiple TVs, selection and forgetting. Failure traces and the HTML report are uploaded by CI. `npm run test:pwa` exercises update/reload/offline behavior on its own temporary server.

`tests/python/test_ci_collection.py` uses synthetic files to verify incomplete, wrong-commit and tampered artifact rejection plus partial-run reporting. Those fixtures are not evidence of native package compilation.

Always validate the real TV before claiming installation, HDMI, receiver or remote-control success. See [RELEASES.md](RELEASES.md) for the complete build entry point.

`npm run test:demo-bridge` runs the local demo bridge against two headless browser
pages with in-memory pairing credentials. It does not contact physical TVs. The
shared browser CI job runs this after regular navigation checks. Spectrum geometry
and interruptible palette fades are checked in the regular browser suite. Native
Java compilation runs before Android packaging in each full-build job.

Launcher manifest contracts cover literal TV/phone overlays; packaged AAB checks
also validate MAIN/HOME/LEANBACK versus phone MAIN/LAUNCHER. The expanded waveform
circle test polls actual settled geometry instead of relying on a fixed animation
sleep, keeping the same shape assertion under slower CI rendering.
