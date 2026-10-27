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

## Final local/simulator validation

- Final debug build/lint passed in 25s (53 tasks); version 1.5.0/code 15 installed in the running StudioTV ARM64 emulator, preserving app data.
- Fresh screenshots verified the corrected compact upgrade popup, visible heading/buttons, Italian About/version/commit and developer report. Upgrade simulation backed up/restored only the release-history baseline; original baseline restored and popup did not repeat.
- Developer triple-press opened the hidden diagnostics; after >30s without input the panel closed. Host tests independently cover activity input extending access and tab/background locking. Receiver settings now use the same shared transient session instead of a permanent toggle.
- Real emulator HTTP tests passed root/source link, unauthenticated rejection, hostile Origin rejection, PIN pairing, QR panel dismissal, one-use PIN rotation, command validation and explicit presence disconnect. No PIN/token was printed or published.
- Android app_process probe passed Home preference validation against the real Android JSON implementation (valid export shape, wrong schema/language/type/field/profile/slot and oversized data). Probe reads no actual preferences. Document-picker import/export interaction is still untested.
- actionlint 1.7.12 passed the workflow; Python scripts compiled; host/release consistency and git whitespace checks passed. Private vulnerability reporting enabled. Branch protection confirmed: no deletion/force pushes; beta/main require PR and host checks.
- Public channel JSON and deep links follow Obtainium's official app configuration format; actual Obtainium import was not executed.

Full native source-built APK/AAB/signing verification remains the remote pipeline's responsibility. Native log-level change is not verified by the bundled-library simulator build. Physical TV, first-ever clean installation, touchscreen receiver developer settings and Mac Music were not re-tested. No stable release is claimed here.
