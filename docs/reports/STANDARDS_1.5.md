# Standards implementation — 1.5.0

Date: 2026-10-27. Scope: Android TV launcher standards, preserving accepted activities/remote behavior. Mac Music work is deferred.

## Implemented

Temporary shared developer session for Home and receiver settings, private bounded diagnostics/copy/share, persistent bilingual release history, first-install suppression and upgrade summary, portable validated Home preferences with previous-state recovery, AGPL original-code licensing with upstream preservation, security request parser and quieter receiver logs, documentation map, contribution/security/repository configuration, Android APK/AAB release pipeline and exact-source archives.

Android-only scope is explicit. No Apple target, store submission, OTA, plugin loader or complete AirPlay 2 support is claimed. Existing renderer remains; new responsibilities are separate modules.

## Checks performed so far

- Java host tests: passed developer unlock/expiry/interaction reset/navigation lock and malicious HTTP framing/length/origin/host/truncation cases.
- Structured release/version/changelog/license checks: passed.
- Android debug build and lint with bundled ARM native libraries: passed (52 tasks, initial 8m52s; UI refinement rebuild 40s).
- Installed successfully over the existing StudioTV app without clearing data. Confirmed AVD identity StudioTV, package it.xarber.mitvhome, version 1.5.0/code 15.
- Fresh UI hierarchy/screenshots: About with version/commit, Italian labels, hidden triple-press developer diagnostics. First upgrade screenshot caught an overlong summary and bottom focus; shortened summary and initial text focus implemented for recheck.
- Bundletool 1.18.3 official asset/digest availability verified. Python build/release scripts compile.

## Pending checks and limits

Final simulator recheck, preference import/export document-provider flow, end-to-end remote validation, full source-built four-ABI APK/AAB signing/package validation and remote workflow statuses are recorded below as execution completes. Bundled local native libraries do not contain the new native log-level edit. A full source build is required for that edit. No fresh physical-TV or Mac Music test in this batch; old device confirmations are not new evidence. Do not call a queued/running build a success or a published release.
