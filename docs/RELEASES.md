# Releases and distribution

Use **Build Aurea — all platforms** (`build.yml`). Select a branch and click **Run workflow**, or run:

```sh
gh workflow run build.yml --ref testing
```

There are no required inputs, dependency run IDs, preview switches, or separate phone/web runs. The `phone.yml` and `demo.yml` files are internal reusable jobs and do not have independent Run buttons. `testing` remains manual-only. Pushes to `beta` and `main` use this same full pipeline. Pull requests run host/model/browser/PWA checks without signing or paid native build jobs.

| Output | Build |
| --- | --- |
| Android TV universal APK and AAB | Two independent Linux jobs |
| Android phone universal APK and AAB | Two independent Linux jobs |
| iOS unsigned device IPA | Independent macOS job |
| iOS ARM64 simulator app.zip | Independent macOS job |
| Web/PWA and embedded remote | One export shared by validation and native builds |
| Corresponding source | Independent source archive |

The four Android jobs share one matrix and consume exact-run verified Python dependency wheels and the exact-commit web export. Native wheels are restored automatically from ABI-specific caches, checked against pinned versions/provenance/hashes and rebuilt when absent or invalid. Users never choose an old run to supply dependencies. iOS builds run in parallel with dependency preparation.

Web export and browser tests are separate stages: test failures block publication but do not skip native compilation if the required export exists. Browser traces and HTML reports are retained on failures. Android artifacts are validated and uploaded before lint; lint failures still fail the job and block release while retaining packages for diagnosis. Matrices use fail-fast=false, so one platform does not cancel another.

The final **Build results** summary lists every stage and links to artifacts. It fails when any required stage is failed, cancelled or unexpectedly skipped. A partial run is never reported as complete. Long native builds may take substantial time; report the submitted run URL rather than actively waiting beyond three minutes.

## Publication

The promotion sequence stays `testing → beta → main`. Testing publishes no release. Beta/main publish only after host/model/browser/PWA checks, all six native formats and corresponding source succeed. Companion sidecars are validated against source commit, channel, version, package, size and SHA-256 before publication. The web/PWA is attached as a standalone zip. Unsigned IPA files require external signing; simulator bundles and AABs are not directly installable device applications.

Beta tags are `vVERSION-beta.CODE.SHORTSHA`; stable tags are `vVERSION`. Publication creates a draft, attaches the complete validated collection, checks asset presence, then publishes. Existing release tags cannot be silently overwritten. Packages retain established identifiers and signing continuity; no new store or hosting destination is configured.

The TV updater manifest references only the TV APK. TV filenames retain their compatible `MiTV-Home-...-android-universal` prefix. Phone APK names use `android-phone-universal`, preventing existing Obtainium TV filters from selecting the companion APK. Companion/web assets remain separate during validation and are included in the release checksums.

Original launcher sources remain AGPL-3.0-only, with upstream licenses preserved. Corresponding-source archives include pinned native submodule source and exclude Git internals, build output and secrets. No Play/App Store submission or new AltSource endpoint is created.

## In-app discovery

Validated APK jobs emit a public signer/hash/package sidecar. Publication generates update-manifest.json from exact bytes and structured release notes, stages a complete draft release, publishes only after assets are present, then verifies public manifest and APK URLs. Existing public GitHub stable/beta channel authorization applies; no new distribution destination is added. See features/UPDATES.md.

## Native installation sources

After the validated application release is publicly published, the distribution-sources job generates stable/beta AltSources from the actual IPA sidecar and released asset, preserving native version/build number, minimum OS, byte size and all declared entitlements/privacy strings. It updates the separate mutable `sources-v1.0` metadata release together with distinct TV/phone Obtainium configurations and existing brand icon. Public metadata and download availability are checked. Testing creates no application or metadata release; source URLs become usable only after the first validated native publication. See [distribution/README.md](../distribution/README.md).

### Android target manifests and CI memory

TV/phone intent filters live in `app/src/tv/AndroidManifest.xml` and
`app/src/remote/AndroidManifest.xml`, selected for every build type. Keep category
names literal so lint can validate them. Shared permissions/services remain in the
main manifest. The phone must not declare Leanback or HOME. AAB validation checks
these target contracts from the actual packaged manifest. Android Actions commands
use a 6 GiB Gradle heap and two workers to avoid universal APK zipflinger exhaustion;
the developer-machine default remains unchanged. Never fix these failures by
turning off lint, skipping ABIs, or publishing incomplete artifacts.
