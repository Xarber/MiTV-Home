# Automatic GitHub APK updates

## Scope and components

Android-only GitHub extended builds use `updates/UpdateController`, `UpdateCandidate`, `UpdatePolicy`, `UpdateVerifier`, explicit download/install receivers, and host `UpdatePanels`. Uses existing Android APIs (minimum 26/Android 8; physical reference Android 10), AndroidX notification support and the current Java/Kotlin/AGP pins. No framework/dependency migration, Expo OTA, iOS updater or new public destination is introduced.

On Home launch/resume, automatic checks run by default with six-hour attempt throttling. Manual checks are in Control Center → Updates and About → Updates. The screen shows installed version/code, build-defined stable/beta channel, last successful check, availability and preferences. Testing/beta builds default beta; main defaults stable. Channel switching is deliberately absent to avoid accidental cross-channel installs.

Stable excludes prereleases; beta may accept a newer stable version. Comparison uses version code, not publication date. Drafts, metadata-only `sources-v1.0`/`1.0` releases, missing/invalid manifests, non-universal assets, wrong package/variant/minimum SDK, equal/older codes and wrong installed signer are rejected. Up to 30 recent release records are read. JSON/URLs/text are bounded and validated. Public GitHub HTTPS API only, with no embedded credentials.

## Metadata and trust

Actions builds and verifies both packages first. The APK job emits exact package/version/code/commit/channel/size/hash/signer metadata from verified output. Publication generates `update-manifest.json` from actual bytes and shared release history, uploads a complete draft collection, then publishes and verifies the public manifest/APK URL. Clients never consume Actions artifacts or incomplete drafts. See `scripts/update_manifest.py` and `check_published_update.py`.

Manifest schema 1 includes package, version/code, channel, variant, tag, commit, minimumSdk, explicit critical flag, localized feature notes/fixes/compatibility, and universal APK URL/size/SHA-256/public signer-certificate digest. Tags must match version/code/commit/channel. Asset URL is restricted to this repository's release path and must occur in the release's actual assets with matching size.

Before install: verify complete file size/hash, parse Android archive package/version/minimum SDK, require a strictly newer build, compare installed/archive signing certificates and manifest identity, and verify a supported native ABI is present. Android PackageInstaller performs the final platform signature/installation checks. Metadata/hash alone never grants permission to replace a trusted installation. Key rotation is not performed automatically.

**Existing development-key installations cannot accept the public release key.** The TV's signing identity must be preserved unless the user separately authorizes an Android-supported key migration. Such an installation may report a newer release as incompatible; it is never uninstalled or reset to resolve this.

## Download and user confirmation

Optional automatic downloads are off by default. The default network preference permits only unmetered Wi-Fi/Ethernet; roaming is disabled. DownloadManager runs the download in the background and handles network pause/retry/resume supported by Android. The app shows sampled bytes, total/remaining when known and calculated byte-delta speed; unknown totals/speed are omitted. Cancellation removes only the updater-owned download/file. Retry starts a new request. There is no unsupported manual pause API; network pausing/resumption belongs to DownloadManager.

Storage is checked for roughly three times the APK plus 64 MiB overhead. The APK is in the app's external Download/updates directory, not arbitrary shared paths. Verification runs after completion/on next foreground. Release notes stay accessible during download. Duplicate download/install sessions are guarded. User chooses Update Now/Install update; the app requests REQUEST_INSTALL_PACKAGES via Android's per-app unknown-sources screen when needed, then creates a PackageInstaller session and handles its explicit result callback.

USER_ACTION_REQUIRED is set on supported API levels; no silent-install permission or security bypass is requested. Android may require additional confirmation or block installation under device policy. Pending confirmation is opened while Home is foreground, otherwise exposed through a system notification when allowed; unsupported notifications/settings are reported. Retry/cancel/failure/storage/signing conflicts have visible status. An opened installer is never recorded as successful installation: final callback and installed build reconciliation determine completion.

App id/data/signing identity remain intact. No uninstall/data clearing occurs. After an update, the existing native version baseline displays What's New once and permanent release history includes the new version. Downloads do not mark updates as installed. A failed/pending session preserves the current working app. Rollback across Android version-code rules may require a controlled developer installation and explicit data precautions; no automatic destructive downgrade is attempted.

## Caching, source and managed stores

Release-list ETag/304 caching uses AtomicFile; last successful and last attempted checks are separate. Failures retain valid cached candidates and label them stale rather than claiming a current check. GitHub 403/429 backs off, including the reset header with a bounded 24-hour limit. A compact corner notice directs users to notes/settings; it does not initiate downloads. Critical releases have a visible security label but never block ordinary use.

Known Google Play/Amazon/Samsung installers are routed to their managed store instead of GitHub sideloading. No official-store variant or Play Core integration is distributed in this project, so supported store-listing routing is the current fallback. Unknown sideload installers use the configured GitHub variant. No App Store/unsigned IPA or Expo OTA flow is claimed.

## Storage and isolation

`home_updates` stores safe public candidate JSON, ETag, attempt/success/backoff times, preferences, notified tag, download/session ids and expected/result build. API JSON cache is app-private; temporary APK belongs only to this app. Preferences/backups do not export install sessions, receiver identity or signing keys. The updater has no production test-feed override or simulated install button. Host tests isolate synthetic policy data; real-device verification uses actual APK bytes and must be reported separately from simulated policy checks.

References: Android DownloadManager and PackageInstaller.Session API documentation; GitHub Releases REST API and conditional-request best practices. SDK-specific APIs are guarded at 28/30/31; target/minimum SDK remain unchanged.

## Reference-TV parser compatibility

On the physical MiTV Android 10, getPackageArchiveInfo with GET_SIGNING_CERTIFICATES alone returned no certificate arrays; GET_SIGNATURES or both flags returned the real certificate. The verifier requests both supported flags on API 28+ and prefers SigningInfo when available, otherwise the returned legacy certificate. Missing certificates are still rejected. Real matching APK/hash/public-key mismatch checks were executed on the TV without installing through the test probe.
