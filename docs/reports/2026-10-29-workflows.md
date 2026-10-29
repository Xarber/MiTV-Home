# Complete build workflow simplification — 2026-10-29

## Diagnosis and review scope

Reviewed build.yml, demo.yml, phone.yml, packaging/manifest validation, browser pairing regression tests and current CI job evidence. This was a workflow/build-system review, not a whole-application audit.

Run 40821203244 had one completed failure when reviewed: the saved-TV browser regression timed out because it did not dismiss the newly added pairing success screen before subsequent interactions. Sixteen other browser cases passed. Because export and tests were combined, the TV matrix was skipped. Both iOS formats and all dependency/provenance jobs succeeded. Android phone jobs were still running; no success is inferred for them.

Earlier run 40760050126 failed Android native packaging because historical JNI files and CMake output both supplied libairplay_native.so, and reused wheel artifacts lacked provenance. Those underlying source/provenance fixes are retained. No integrity, signature or release check was removed to make a run pass.

## Implemented

- One dispatchable **Build Aurea — all platforms** workflow, with branch selection only. No dependency run IDs, partial-preview switches, or separate phone/web buttons.
- Shared Android target/format matrix: TV APK/AAB and phone APK/AAB. Independent reusable iOS device/simulator helper. Internal browser helper consumes the exported web artifact.
- Automatic ABI-specific cache verification/rebuild for pinned dependencies. All builds use exact-run wheels and exact-commit web assets.
- Browser/PWA validation separated from export. Failed tests still block publication, while independent native compilation and artifact collection continue.
- Android validation/upload occurs before lint; a later lint failure still fails the job and blocks release, retaining artifacts for diagnosis.
- Always-run results summary rejects incomplete/failed/skipped required stages and links to artifacts. Browser traces/HTML reports are retained on failure.
- Complete native companion/web/source collection gates existing GitHub publication. Companion metadata/hash/commit/channel checks reject incomplete or mismatched artifacts. Android companion validation checks actual package/version/signing/ABI; AAB manifests are validated with bundletool.
- Phone filenames use android-phone-universal so existing TV Obtainium filters remain safe. TV update metadata continues to reference only the TV package.
- Pairing browser tests acknowledge the success screen, retaining their encrypted-storage, reload, multi-TV selection and forgetting assertions. A dedicated test port avoids interrupting the user's local preview.
- Current build/release/test documentation and the architecture decision were updated; no application UI or blur code was modified.

## Validation executed

- TypeScript: passed.
- Actionlint on all three workflow files: passed.
- Headless Chrome production-export browser tests on isolated port 8877: 17 passed.
- PWA manifest, offline/update notification, explicit reload and restored shell checks: passed.
- Host checks: passed; 37 Python cases ran, with two protocol-environment-dependent cases skipped. These include five synthetic release-collection/partial-summary cases, not native package tests.
- Git whitespace checks: passed.

## Boundaries and release status

No native SDK/emulator was installed or native package compiled locally. No physical TV or phone was contacted, installed or reset. The user said the TV is off. Updated native packaging and the complete Actions graph require the submitted run's results. A submitted/running workflow is not a successful build or a release. Testing remains manual-only; beta/main and signing identities are unchanged. No temporary branch/worktree was created.

Archived private CI logs were losslessly compressed because free disk space remained below 2 GB. Rollback APKs, source, dependencies and credentials were retained. Full native builds stay remote.
