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
layouts. Final installation/HTTP/browser results are recorded after verification.
No physical AirPlay streaming, system-remote pairing or HDMI switching is implied
by Home/HTTP checks.
