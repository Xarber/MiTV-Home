# Expo becomes the application base

Status: approved by the user on 28 October 2026; implementation in progress.

## Plan and acceptance

1. Promote the existing Expo project from demo/ to the repository root; retain the
   separate phone interface and web preview. Pin the SDK-matched React Native TV
   fork (Expo 58 / RN TV 0.88) for actual D-pad/focus support.
2. Integrate Expo/Hermes/Fabric in the existing Android host rather than replacing
   tested AirPlay, Python, HDMI and update services. Retain the existing Home
   component name, package, signing identity and native preferences. Keep the
   legacy UI as an explicit recovery screen, not the default or a hidden success.
3. Replace fixture data in native Home with a typed platform adapter for installed
   apps/banners, actual inputs, saved dock/appearance, network, playback, pairing,
   settings, updates and diagnostics. Web preview fixtures remain isolated.
4. Port focus/held-key handling, scrolling, anchored panels/materials and real music
   activity. Preserve three stops, six customizable dock slots and pinned inputs.
5. Validate the actual release UI on the Android 10 ARMv7 TV before calling the
   interface migration deployed. Verify actual app/input routes and retained
   preferences separately from browser rendering. Preserve the signed 1.8.1 APK.
6. Integrate completed changes into testing, then beta after relevant checks.
   Main stays stable until separately validated. Update CI to consume root Expo
   sources and build phone packages in an isolated generated native workspace.

## Reviewed architecture

The native Android project intentionally keeps its existing custom root Gradle
layout and pinned C/C++ submodules. Expo's supported integrated/brownfield approach
allows a custom project root; this avoids moving native submodules or silently
regenerating the media/service host. Root package.json/Expo sources become the
primary app; the main Android activity hosts the native React surface, not a
WebView. Expo bundles are embedded for release and do not need Metro at runtime.
Phone-generated projects must not overwrite the hand-maintained TV host.

Risks: native dependency/Gradle compatibility, Android 10 ARM32 support, native
focus and clipping, low-end performance, retained credential/preference namespaces,
and lifecycle interactions. Do not clear app data or substitute examples when a
native API fails. Keep the currently installed working version until the migrated
package passes installation/signature/runtime checks.

References: Expo TV guide; Expo existing-native-app integration; version-matched
Expo 58 bare template and react-native-tvos 0.88.0-0 sources. This document records
intent; it does not claim the migration is already implemented or tested.
