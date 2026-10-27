# Developer tools, updates and portable settings

Control Center → About MiTV Home shows version/build and exact source commit, release history, licenses and preference export/import. Triple-press the version row within four seconds to open Developer options. It uses the same focusable, scrollable frosted popup controls; developer access remains in memory, expires after 30 seconds without input and locks on page/category navigation or backgrounding. A later visit requires another triple press. No external intent or persistent preference unlocks it.

The developer landing panel is a compact icon-led menu. Diagnostic details opens the longer report on request; copy/export still use the complete safe report. Authenticated phone-remote actions extend temporary access just like physical input. Revocation consequences remain visible.

The report includes exact version/code/commit/channel/build date/variant, API/ABI, generic network transport, permission booleans, service binding/listener state and the last 64 allowlisted enum events. It excludes raw logs, PINs, tokens, hardware identity, network addresses/SSID and media titles/artwork. Copy/share are explicit user actions; notification preview and phone-token revocation are available. Developer changelog includes exact committed messages; legacy non-Conventional subjects are preserved, new subjects are Conventional Commits.

Release JSON is shared by the permanent localized changelog, compact What's New and generated Markdown/release highlights. Fresh installation seeds the current code and shows no update popup. Upgrade shows changes since the recorded code; for older builds without the new baseline, Android install/update timestamps identify an upgrade. It is marked seen only after presentation; dismissal/relaunch does not repeat. Each major feature has its own descriptive icon and focusable disclosure control with expanded/collapsed accessibility text. Fixes & Improvements is one expandable group. The permanent changelog lists versions first; release detail reveals feature cards while compatibility stays visible. Skipped updates include one actual feature from each intervening release, linking to its full details. This app has native APK updates only, no OTA mechanism.

Export/import uses Android's document picker without broad storage access. Only dock, input profiles, activity background and language are portable. Import is bounded/validated before confirmation; previous presentation settings are saved in home_restore for recovery. AirPlay identity and tokens never enter exports. See DATA_MODEL.md and API.md for contracts and security limitations.

Diagnostics v2 records snapshot UTC from the local clock, identifies current Android API observations, and labels monotonic event records as observed or simulated-local-ui. Notification previews write no production preferences, analytics, or history; their only trace is the bounded diagnostic event ring.

Physical-TV validation of the 1.6.0 upgrade from pre-baseline versions found too many intervening-release rows in the initial popup. Earlier updates now collapse into a single row with a real feature summary and reveal their full icon-led list on request. Feature disclosure uses the feature label/icon plus accessible expanded/collapsed state rather than repeating a verbose hint on every card. About → What's New reopens current notes without changing the seen-version baseline.

## Explicit developer on/off override

The user's latest task-specific behavior overrides the earlier expiring-access default: three presses on the About build/version reveal a Developer options toggle. Its enabled flag is persisted in home_developer. When enabled, Developer settings appears in Control Center and stays enabled until switched off. The transient 30-second/navigation/background session controls only the hidden toggle's initial reveal; it does not turn an enabled developer configuration off. The receiver's settings surface shares the same persisted flag. This flag is deliberately excluded from portable presentation backups.

Updates is nested only under About; the duplicate Control Center Updates entry was removed at the user's request.
