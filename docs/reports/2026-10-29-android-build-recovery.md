# Android build recovery and physical TV update — 29 October 2026

## Findings from run 40869261140

- TV APK and AAB and phone AAB compiled, were signed/validated, and were retained.
  Their jobs then failed lint MissingLeanbackLauncher. The TV source used category
  placeholders that lint did not resolve; the phone also inherited a Leanback feature.
- Phone APK packaging failed with Java heap space in zipflinger. The Gradle daemon
  had only a 2 GiB heap; this was not a Java source compilation failure.
- The browser suite passed 20 cases and failed the new paused-circle assertion after
  a fixed delay. Geometry now polls for settled animation rather than assuming
  the CI renderer completes a frame within 350 ms. The geometry tolerance remains.
- Both iOS formats, source/host/dependency jobs and the PWA update check succeeded.
  The whole run failed and publication stayed blocked, as intended.

## Implemented correction

Version 2.0.3 / build 29 uses literal TV and phone manifest overlays for all build
types (including debug/sanitize), while retaining common permissions/services and
activity attributes. TV keeps HOME and LEANBACK_LAUNCHER; phone keeps LAUNCHER and
omits the TV feature. Package identifiers, signing identity, user preferences and
visual blur are unchanged. AAB validation now checks the actual merged launcher
contract in addition to version/package/SDK/release mode. Three contract regression
checks cover both overlays, missing TV registration and accidental phone Home.

Android CI gives the daemon 6 GiB heap and limits workers to two, for packaging
and lint; the local Gradle default is preserved. No checks are disabled or baselined.
The browser bridge check can run independently of a failing navigation test.

## Validation and deployment

- 47 host Python cases ran successfully, with two environment-dependent skips.
- TypeScript, actionlint, release consistency and whitespace checks passed.
- The formerly failing paused-circle/color-transition browser case passed locally.
  Full native lint/packaging correction still requires the new remote build.
- The latest available TV artifact, **2.0.2 / code 28 / commit 4492c79**, was installed
  over 2.0.0 / code 26 using ADB through a temporary SSH forward to the home network.
  Direct LAN access from the computer was unavailable. The device model matched.
- Before installation, APK SHA-256 matched the exact-run package sidecar, identifier
  and version were verified, and its signer matched the pulled installed APK.
  The old APK is retained privately for rollback. Installation returned Success.
- Android reported 2.0.2/code 28 afterward. Home launched; a fresh TV screenshot
  showed the updated Italian What's New panel, retained customized dock and input
  banner. No fatal exception or ReactNativeJS errors appeared in the initial logs.
  AirPlay playback, physical HDMI switching and phone system pairing were not
  exercised. This is installation/startup evidence, not a full native regression pass.
- Private screenshots/logs/device information and rollback APKs remain outside Git.
  No factory reset, uninstall, data clearing or signing-key change was performed.

Work stays on testing. No stable/beta promotion or public release is authorized by
this maintenance task. No temporary Git branches or worktrees were created.
