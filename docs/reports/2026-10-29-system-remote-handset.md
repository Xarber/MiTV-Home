# System remote, handset and Classic background — 2026-10-29

## Scope

The user considers other features tested/working. This batch is limited to the
web/native companion's system-control connection, adaptive handset/touchpad UI,
and gray backgrounds in TV Home and the connected launcher preview. Blur, dock,
activities, input customizations, data and signing identities are preserved.
No full application audit or revalidation of unrelated accepted features is claimed.

## Investigation evidence

- Retrieved existing persistent developer logs from physical TV 2.0.6/code 33.
  Logs show 75 failed system-key attempts and 24 failed reconnect attempts in the
  retrieved window, with ConnectionResetError during the Python TLS handshake.
  No control message was sent on those failed connections. Logs remain private.
- The user confirms the separate ATV Remote app controls YouTube/Netflix while
  Aurea web controls fail outside Home. Home navigation uses the local launcher
  channel; success there does not establish a system-control connection.
- The TV listens on 6466/6467. A temporary native SSL probe with an unpaired,
  disposable certificate reached the server and was rejected as expected. This
  is not a successful pairing/control test. No production key was extracted.
- NineWorlds/google-tv-remote is the older Anymote implementation. Modern
  androidtvremote2 0.3.2 uses paired TLS control on 6466 and pairing on 6467;
  those are the ports already selected by Aurea. Merely changing port numbers
  is not supported by the evidence.
- The canonical Classic preference was absent from the Expo wallpaper registry;
  it therefore fell back to muted Silk. Connected launcher preview independently
  used its own wallpaper preference. These are verified rendering-path defects,
  not evidence of a TV panel/calibration issue.

## Implemented

- Android SSLSocket TLS adapter, restricted to self-interface/loopback and the
  two fixed service ports, with random same-UID Unix IPC to the pinned upstream
  protobuf/session implementation. Existing RSA identity and encrypted storage
  are retained. No new ADB/accessibility/root permissions or external server.
- Native handshake error classification and sanitized exception-class diagnostics;
  backend is visible in developer information. Explicit reconnect uses existing
  trust without repeating keys or launching another pairing attempt.
- Auto/Home/Complete remote selector; complete handset replaces the popup grid.
  Grouped D-pad, touchpad, rockers, voice, media and colored controls remain in the
  main Remote tab. App/input tabs and activities remain independent.
- Tap once to select, thresholded swipes for relative DPAD navigation, no select
  after dragging. Native PanResponder plus web touch-action handling isolate pad
  gestures from page scrolling; keyboard navigation remains available.
- Classic uses the original blue/violet source artwork, with animated wallpaper
  transitions. Connected preview inherits the TV's wallpaper preferences. Existing
  procedural palette options, blur and app-banner boundaries remain unchanged.
- Version 2.0.7/build 34, bilingual release metadata and architecture/API/security
  documentation updated. Original assets retain their existing licensing.

## Verification and limits

- TypeScript and the Node regression suite passed (38 tests).
- Python system-remote/transport checks passed: 14 tests, one optional-crypto test
  skipped in the default host interpreter. Covered peer-certificate exposure,
  byte-preserving protocol delegation, cancellation cleanup and upstream-compatible
  authentication/network exception behavior. The same 14 checks also passed in
  the installed Python 3.13 environment with cryptography, with no skips.
- Default host checks passed: Java contracts, release consistency and 61 Python
  checks (8 optional-dependency skips). Six focused Chrome checks passed.
- Java TLS adapter compiled against installed Android API 37 stubs.
- The full local Java app compilation attempt could not complete because the
  existing host has no Python 3.11 for Chaquopy's packaging step. No toolchain was
  installed; this is not an Android release compilation success.
- Fresh production Expo/PWA export succeeded. Focused Chrome checks cover automatic
  view changes/manual overrides, touchpad tap/swipe semantics, all standard control
  buttons, microphone packet transport, popup regression and Classic preview.
- A private 390×844 Chrome capture was visually reviewed: grouped handset,
  circular navigation pad, vertical volume/channel rockers and reachable controls.
  This is browser rendering evidence, not physical iPhone gesture validation.

The native TLS change is a compatibility correction for the observed handshake
failure, not a physically verified cure yet. A new native TV APK and a real
third-party-app command test are still required. The TV remains on 2.0.6 until
that candidate is installed. No new release, native phone deployment or stable
branch promotion is claimed. Build submission and completion are reported separately.

## Git and cleanup

Changes are integrated on testing in focused Conventional Commits. No temporary
branch/worktree was created. Existing beta/main and signing configuration are
preserved. Temporary native probes and SSH forwards are cleaned after inspection;
private diagnostic evidence remains outside the repository.
