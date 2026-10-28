# Aurea Home / Remote 1.8.0 validation

## Scope

Inspected and modified: Expo app dispatch, phone UI, TV source layout/scrolling,
remote client/trust/transport, PWA export/lifecycle, Android HTTP/service/catalog/
playback/system-remote adapters, namespaced credential storage, AirPlay discovery
re-registration and companion CI. This is not a full repository security audit.

## Verified locally

- TypeScript strict check and eight Node model/client tests passed.
- Seventeen headless Chrome browser tests passed (15 full-suite checks plus two targeted QR/source-scroll checks): dock/navigation, activity expansion/
  collapse, constant black material, settings blur, wallpaper independence/motion,
  bounded focus, phone tabs/music, offline shell, two encrypted saved TV pairings,
  reload, switching and forgetting one without losing the other. Device/API
  responses in the multi-TV test are controlled fixtures, not physical pairings.
- Separate real service-worker lifecycle check passed: remote manifest/maskable
  icon, waiting update, visible release notes, explicit reload, restored shell.
  Fixed a missed update-notification race found by that check.
- Android launcher Java/Kotlin compilation and release lint passed with existing
  local SDK/native dependencies. Gradle cache references were refreshed after safe
  cache cleanup; no SDK/emulator was installed. Existing deprecation warnings remain.
- Host HTTP adversarial/parser, updater and developer-session checks passed.
  Python discovery/pairing/diagnostic/system-remote tests passed (30 total; two
  protocol checks skip in the generic environment and pass separately in the
  existing pinned protocol environment). System-remote tests use a fake service,
  fixed loopback host, code expiry, staging cleanup, allowlisted keys and secret-
  free logs. They do not establish physical system-service compatibility.
- Expo Android production JavaScript/Hermes export passed; this is not an APK
  installation. Phone remote/input screens visually inspected in headless Chrome
  at 390×844. Existing TV demo browser regressions passed.

## Remaining validation and distribution

The user's physical TV is off. No new build has been installed on it. Background
system-service pairing, Home return while another app is open, real HDMI/app
launches, network recovery and concurrent AirPlay need physical verification.
Native iOS/Android phone installation, permission prompts, keyboard/safe-area/
standalone behavior, real browser LAN access and native frame performance are not
established by browser tests. Actual PWA installation on iOS/Android/desktop remains
pending; HTTP TV-IP pages cannot promise secure-context PWA capabilities.

Four companion build jobs are configured as artifact-only; their remote result
must be checked separately. Native TV beta publication stays gated by its existing
checks and successful APK/AAB validation. No main promotion, new hosting service,
store submission, phone update feed, credential rotation or destructive TV action
is included. Transitive Expo CLI tooling advisories remain documented; no
incompatible SDK downgrade was applied.

## Recovery

Existing native package/signing identity and Apple TV credential alias/file remain
unchanged. Namespaces isolate system-remote and phone trust. Failed storage reads
preserve the files. Phone commands are never replayed after reconnection or TV
switch; stale playback sources reject controls. Existing stable artifacts and
preferences remain the rollback baseline.
