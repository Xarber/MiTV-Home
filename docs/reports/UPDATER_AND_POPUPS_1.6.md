# MiTV Home 1.6 validation — 27 October 2026

## Implemented scope

GitHub release-manifest updates, verified APK download and supported Android
installation; bounded scrolling TV popups; updates consolidated under About;
explicit persistent developer-options toggle revealed by three version presses.
See [updates](../features/UPDATES.md) and [popups](../features/POPUPS.md).

## Completed validation

- Host regression checks passed: hostile remote requests, developer session policy,
  updater version/channel/signature/SDK/variant/owned URL rules and release metadata.
- Existing Android SDK: bundled ARM debug compilation and Android lint passed.
  This does not verify a complete native-source release build.
- Physical MiTV, Android 10 ARMv7: isolated ADB connection, default launcher,
  installed version/code and actual signing certificate checked.
- APK trust probe on the physical TV accepted the newer matching-key APK and
  rejected altered hashes, a differently signed public APK and invalid tag metadata.
- Android 10 archive signature query required both supported certificate flags;
  corrected without weakening certificate verification.
- User explicitly approved Android's one-time signing-key rotation. The migration
  proof and installed APK signature passed Android 10 v3 verification. Data and
  launcher preferences were retained. Subsequent matching release-key installation
  succeeded without uninstalling or clearing data.
- On-device update screen reached GitHub successfully and displayed its actual
  successful-check timestamp, beta channel and preferences.
- Physical About screen showed bounded margins and the developer toggle after
  three real remote-center presses.

## Remaining checks

- Full release-mode APK/AAB build for this batch has not yet run.
- A complete newer published-manifest download followed by installation from the
  in-app updater remains untested. Opening Android's installer is not installation
  proof. Existing physical installs used the authorized ADB installation path.
- Persistent developer toggle navigation and the latest read-only D-pad text
  scrolling correction still require final physical visual validation.
- TV was subsequently displaying Live TV, which was left undisturbed.

## Rollback

Previous installed APK and private preference backup retained locally. No factory
reset, package removals, app uninstall or data clearing were performed. Signing
credentials, pairing secrets, network identifiers and screenshots are not published.

Paired external Apple TV work is a separate, unfinished development batch and is
not included in these validation claims.
