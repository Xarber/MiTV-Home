# Revised standards application — 1.5.1

Date: 2026-10-27. Version: 1.5.1, code 16. This report covers the selected launcher settings/release/diagnostics modules and their documentation, not an entire application audit.

## Inspection and plan

Compared the revised universal instructions against AGENTS.md, release history/rendering, MainActivity developer/settings flows, Diagnostics, data/API/security documentation, build pins and the existing protected branch/release workflow. Inspected the previous 1.5.0 implementation at 2327ebe and its successful beta workflow before changing behavior.

Affected modules: new ReleasePanels renderer, ReleaseHistory data/baseline, launcher entry points/glyphs, Diagnostics provenance labels, localized feature metadata and validation, project instructions/docs. Reused the existing focusable frosted controls, popup lifecycle, developer session and release pipeline. No dependency/framework upgrade, native receiver/audio/dock change, license/visibility migration or new distribution destination.

Acceptance: contextual icons for every major changelog feature; localized expandable details and grouped fixes; compatibility and revocation consequences visible; compact developer menu with full safe reports accessible; skipped updates name actual intervening features; simulations labeled and isolated; completed feature-branch changes integrated into testing.

## Implemented

- Structured per-feature icon/label/detail and compatibility metadata for real historical releases; 1.5.1 records this batch.
- Shared ReleasePanels presentation: version overview → icon-led feature details, keyboard/D-pad disclosure controls with expanded/collapsed accessibility descriptions, grouped Fixes & Improvements. Long explanations are hidden by default; compatibility stays visible in release detail.
- Compact developer overview; full diagnostics behind a labeled detail action. Copy/export and developer history remain available. Token revocation consequences are visible. Authenticated phone input extends the existing temporary access timer.
- Diagnostics include local-clock UTC snapshot and distinguish observed events from simulated-local-ui previews. Existing notification simulation has no production storage/analytics/device-command side effects.
- Revised project rules allow temporary feature branches/worktrees and preserve established architecture, release authorization, rollback and scope boundaries. Added SECURITY.md/SYNC.md architecture/provenance documentation, updated the documentation map and feature/data descriptions.

## Executed checks

- `scripts/check-host.sh`: passed developer session lifecycle/expiry/input and hostile HTTP request tests; release version/history/license checks passed, including localized feature icons/details and compatibility schema.
- Android ARM bundled-native `assembleDebug` + `lintDebug`: BUILD SUCCESSFUL in 31s, 53 tasks (51 executed). APK retains package id and minimum API 26. This proves compilation/lint, not visual correctness or fresh physical-device behavior.
- actionlint: passed unchanged release workflow. `git diff --check` and Python compilation: passed.
- Git diff scope confirms no changes to C/C++ receiver/audio engine, application manifest, dependency pins, dock navigation, token/pairing implementation or workflow triggers.
- Prior 1.5.0 full native beta run 40496251252 passed both signed four-ABI packages, source archive, required checks and publication. This is prior-version evidence, not a 1.5.1 build result.

## Validation gaps and release state

StudioTV and the physical TV were unavailable in ADB for this batch. New disclosure layouts, actual screen-reader announcements and remote-driven developer timer have not received fresh emulator/physical visual testing. The 1.5.1 APK was built locally but not installed on a device in this batch. No production deployment or rollback was performed.

New remote APK/AAB jobs and beta publication must be verified from their exact run. Main's stable promotion remains draft until the new version is validated. iOS is inapplicable to this Android TV target; no Apple artifacts or external store submission is claimed. Mac Music remains deferred.

## Local storage

When free space fell below 2 GB, removed only disposable MiTV compilation intermediates (138.1 MiB first, then 593.0 MiB); retained source, APK outputs, signing assets and native dependency caches. Last observed free space: 2.6 GiB. No unrelated files/services were changed.
