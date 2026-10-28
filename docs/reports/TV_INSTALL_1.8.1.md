# Physical TV update — 28 October 2026

The TV regained Wi-Fi after a user-initiated reboot. No network reset, package
removal or app-data clearing was performed.

Initial 1.8.0 local beta build used the existing release key, existing SDK/Python
runtime, exact beta source and unchanged native ARM libraries byte-matched against
the saved prior APK. Package/version/signature checks passed. Installed with
`adb install -r`; pulled-back APK bytes matched the candidate. Home was visually
confirmed with a fresh private screenshot and retained its configured dock.
The remote identity endpoint remained available while system settings was open.

Physical HTTP validation then found the embedded script returned 404: AAPT's
default asset filter omitted `_expo`, despite the index/manifests being present.
The installed app was kept available while preparing the focused 1.8.1 fix.
Obsolete CI builds were cancelled to prevent publishing that broken web bundle.

1.8.1 preserves normal asset filters except the underscore-directory exclusion.
APK/AAB validation now checks referenced scripts/styles and all exported assets.
Two host regression tests cover a missing JavaScript bundle and complete APK/AAB
layouts. Final results are recorded below.
No physical AirPlay streaming, system-remote pairing or HDMI switching is implied
by Home/HTTP checks.

## Final physical verification

- Installed **1.8.1 / code 25**, beta source
  `6dc64f86a00ff059b02bf21cd8ff2a863814d951` with the existing release signer.
- Local release build and lint passed. This ARM build reuses unchanged verified
  native libraries; it is not a substitute for full native-source universal CI.
- New embedded-web validator passed against the corrected APK and rejected the
  earlier 1.8.0 APK with missing CSS/JavaScript. Host suite: 32 tests passed with
  two protocol-environment skips; dedicated embedded-package regressions passed.
- Pulled the installed APK back and verified its SHA-256 matches the validated
  candidate. Prior installed APKs remain in private rollback storage. Used only
  replacement installation; app data was not cleared or uninstalled.
- Fresh private TV screenshot confirms Home is visible with the previously
  configured dock and input shortcuts retained. Returned the TV to Home after
  checks; no HDMI selection or playback test was performed.
- Actual TV-hosted web page rendered in headless Chrome at 390×844, with the Aurea
  Remote title, prefilled connection form and no JavaScript errors. The script
  served by the TV byte-matches the built export. This is desktop browser access
  to the physical server, not phone hardware/PWA installation evidence.
- Remote identity endpoint remained reachable with the same application identity
  while system settings was open, then Home was reopened. This verifies service
  availability outside Home, not unpaired global navigation/media controls.
- Phone pairing, system-service pairing, AirPlay streaming and physical HDMI
  switching remain separate user/device checks. No test trust token was created.

The underlying asset exclusion is documented in the installed
[Android Gradle Plugin 9.4 resource API](https://developer.android.com/reference/tools/gradle-api/9.4/com/android/build/api/dsl/AndroidResources).
The packaging fix was integrated through testing and PR #14 into beta; stable
main was not promoted. Full CI/release status remains separate from this verified
local device installation.
