# Paired Apple TV development validation — 27 October 2026

## Implemented on testing

- pyatv 0.18.0 in an embedded Chaquopy 17.2 / Python 3.11 runtime.
- Explicit discovery, PIN pairing, device-bound encrypted credentials and removal.
- Home-scoped playback observation/reconnect and supported transport controls.
- Shared music activity, optional artwork and animated remote playback bars.
- Local receiver priority, stale-state removal and source-change control protection.
- English/Italian settings and existing bounded popup layout.

## Passed

- Linux cross-compilation: cffi 2.0.0, cryptography 50.0.2 and pydantic-core 2.50.1
  for ARMv7, ARM64, x86 and x86_64.
- Portable HTTP/discovery wheel build; zeroconf wheel metadata corrected only
  after checking that no native binaries exist, with regenerated integrity records.
- Reused dependency artifacts verified against pinned versions, target, ABI and hashes.
- Seven local isolated Python boundary tests: invalid PINs, secret-free state,
  feature-gated controls, invalid volume values, stale disconnect state, wheel
  integrity records and rejection of native/disguised ELF binaries.
- Existing host regression checks and workflow static validation passed.

## Initial full-build result

Full APK/AAB workflow for application commit `f2bb5a8`:
https://github.com/Xarber/MiTV-Home/actions/runs/40578289224

Its portable dependency job and all four native dependency jobs passed. APK and AAB
failed during Gradle configuration: Chaquopy could not see the architecture filters
placed only in build types. No application release was published.
Additional test/report/source-availability changes after this commit do not change
its application implementation; final artifacts must retain their actual commit.

## Not yet verified

- Complete APK/AAB compilation, package size and lint.
- Python/encryption imports on the physical Android 10 ARMv7 television.
- Actual PIN pairing, MRP session, supplied metadata/artwork and controls on the
  user's tvOS 27.2 Apple TV.
- Native focus/keyboard and local receiver regression testing with the client present.
- Background/reconnect and device-bound credential persistence on the TV.

No installation was performed for this feature. The TV's existing launcher and
Live TV session were left intact. The simulator was not used.

## Build configuration correction

Moved the existing architecture list into `android.defaultConfig.ndk.abiFilters`,
as required by Chaquopy 17.2. Removed duplicate debug/release declarations; retained
the sanitizer build's explicit ARM64 selection. Normal universal builds retain
ARMv7, ARM64, x86 and x86_64. Bundled previews retain their existing two ARM ABIs.
No SDK, dependency version, minimum OS, application identifier or signing key changed.

Actual Gradle 9.8.1 configuration checks passed locally for both bundled-native and
normal full-source configurations. These were `help` tasks, not APK compilation.
Existing host checks, seven Python tests, workflow static validation and diff checks
also passed. Full APK/AAB compilation remains necessary after this correction.

Reference: https://chaquo.com/chaquopy/doc/current/android.html#android-abis
