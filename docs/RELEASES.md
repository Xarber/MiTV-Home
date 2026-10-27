# Releases and distribution

Long-lived branches follow testing → beta → main through reviewed pull requests. Testing never automatically builds/releases; manual checks are allowed. Beta/main pushes build a signed universal APK and signed AAB in independent Linux jobs with fail-fast disabled. An independent host-check job gates publication. iOS jobs are inapplicable because this app uses Android HOME/TV input APIs and has no iOS target.

Only after both packages and required checks pass does publication download exact-run artifacts, recheck SHA-256, create release notes, include pinned corresponding native source and publish. Beta tag: `vVERSION-beta.CODE.SHORTSHA`; stable tag: `vVERSION`. Existing releases cannot be silently retargeted or overwritten. Push stable only when the complete version is validated. Known nonblocking limits remain in notes.

Artifacts include app/version/platform/channel/variant/short commit in names. APK is directly installable; AAB is for store tooling, not an installation package. APK signature uses existing signing secrets; AAB uses the same configured release key. Build metadata includes commit, channel, version/code and Git-derived build time. Workflow concurrency serializes each channel without cancelling ongoing releases.

Corresponding-source archives include repository sources, build scripts, patches and pinned recursive submodule source, excluding Git internals/build output/secrets. Original launcher code is AGPL; upstream licenses remain. The Home remote links to the public source repository; matching release source is attached with binaries.

Obtainium tracks public GitHub Releases: choose MiTV-Home with the APK asset filter `android-universal` and enable prereleases only for beta. See distribution/obtainium.json for channel hints and releases/latest for stable downloads. No iOS AltSource/IPA or mutable metadata 1.0 release is generated because there is no iOS application or configured source consumer. No Play/App Store submission occurs automatically.

When a build exceeds three minutes, report its link/status and stop actively waiting. A queued/running build is not a release. Never publish failed/incomplete packages or claim simulator coverage validates native source.
