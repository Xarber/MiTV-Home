# Compact remote, microphone lifecycle and build recovery — 2026-10-29

## Scope and findings

Only remote layout/settings/gestures, microphone lifecycle, native TLS diagnostics
and the failed CI test path were changed. Blur, wallpapers, dock, activities,
input customizations and other features accepted by the user remain unchanged.

Run 40933563290 built both iOS packages and all four Android packages successfully.
Its browser job failed because a test tried to write a screenshot under the
Mac-only /private/tmp directory on Linux. The test now uses Playwright's
platform-independent testInfo.outputPath; checks and release gates were retained.

Fresh physical diagnostics initially showed 2.0.6/code 33. voice_start failed
before streaming because its system-service TLS handshake failed. The exact-run
2.0.7/code 34 TV APK was downloaded, checksum/signature/package verified, and
installed as an update. MainActivity was launched and the installed version was
confirmed. New 2.0.7 logs show the native handshake also failing; merely changing
TLS libraries did not solve the actual TV connection.

Controlled probes used a fresh, unpaired disposable certificate and the same
native TLS implementation directly and through a temporary source-restricted LAN
relay. Direct connections failed before certificate selection; relayed connections
reached certificate authentication and rejected the unpaired probe as expected.
No production credentials were extracted, no PIN was submitted, no key was trusted,
and no persistent relay/infrastructure change was introduced. The observations
show this TV rejects self-originating control sessions. They are not a successful
system-control or microphone test. Optional local debugging access remains subject
to explicit user authorization; it has not been enabled.

## Implemented

- Removed both extra selector rows. Auto layout remains default; manual layout and
  touchpad choices are in Settings and persist independently of paired TV trust.
- Reduced full handset height, matched both rockers and restored horizontal compact
  volume. The complete handset fits the tested 390×844 viewport; small screens or
  large text retain scrolling as a safe fallback.
- Separate native responder and web pointer/wheel handlers avoid duplicate events.
  Pointer capture, nonpassive wheel/touch listeners and parent scroll locking keep
  pad navigation from moving the page. Page gestures elsewhere still work.
- The microphone remains mounted through automatic layout changes. Inactive OS
  permission dialogs leave the transport alive; true backgrounding still stops it.
  Voice is disabled without a ready system connection, with readable error feedback.
- Native TLS diagnostics retain a fixed alert enum from nested causes, no raw text.

## Validation and limits

TypeScript and Node checks passed (39 tests). Python system-remote/transport checks
and Android-stub Java compilation were run. Production Expo/PWA export succeeded.
The full local Chrome regression suite passed: 28 tests. A focused follow-up adds
short-viewport emulated touch input alongside wheel/drag coverage. Browser checks
verify automatic/manual layout selection, Settings-only controls, equal rockers,
handset bounds and voice packets surviving an automatic layout change.

These are browser/emulated-touch tests, not physical iPhone gesture validation.
The global TV control channel and actual TV microphone streaming remain unresolved;
a local debugging bridge requires permission and cannot itself provide voice PCM.
No 2.0.8 binary has been installed yet. No stable release/promotion is claimed.
The old APK remains a rollback reference; installation did not clear app data.

Changes stay on testing with Conventional Commits; no temporary Git branch/worktree
was created. Native probes and temporary network forwards are cleaned after use;
raw evidence stays private and outside Git. The new full build is reported separately.
