# MiTV Home development

Start with [docs/INDEX.md](docs/INDEX.md). Follow the user's Universal Application Development Standards; this file adds project-specific context.

- Expo is the application base, with React Native TV Home, a separate shared phone remote, and web/PWA preview. Keep the handwritten Android host and Kotlin/Compose receiver + C/C++ media engine behind the native platform adapter. Minimum API 26, target 34; preserve package, signing identity and canonical preferences. See docs/decisions/0003-expo-home-base.md.
- Develop atomic Conventional Commits on `testing` or isolated feature branches/worktrees; integrate completed work into `testing` before promotion. Promote complete tested batches by pull request to `beta`, then `main`. Never force push. Testing has no automatically triggered workflows.
- Original launcher modules are AGPL-3.0-only. Preserve upstream GPL/LGPL/Apache notices and GPL text in LICENSES. Never relicense third-party code as your own.
- Use existing SDKs for emulator checks; prefer GitHub Actions for full native release builds. Run `scripts/check-host.sh` after a batch; use Android lint/build and fresh emulator screenshots for UI changes. Record results in docs/reports. Never equate simulator checks with physical HDMI or AirPlay compatibility.
- Preserve six customizable dock positions, three navigation stops, held-OK menus, held-Back Control Center, focus order, Italian/English, activity preferences, input routing and receiver persistence.
- Keep new diagnostics, settings and release logic outside MainActivity. No arbitrary plugin code loading. See docs/PLUGIN_SYSTEM.md for controlled extension boundaries.
- No blind debloating, root, factory reset, app-data clearing or uninstall to resolve signing mismatches. Request specific authorization for destructive actions.
- Secrets stay in Actions secrets/private signing storage. Never export raw logs, pairing PINs, tokens, album metadata, SSIDs, IPs or device identity. Scrub screenshots before publication.
- `release-history.json` is the shared release source. Update version/code together, run `scripts/release.py generate`, and keep known compatibility limits accurate. Legacy subjects stay intact.
- Full source builds include pinned submodules and UxPlay patches; bundled-native builds are ARM UI previews and do not verify native changes.

## Revised standards and scope

The user's latest universal instructions replace earlier versions. Project-specific Android TV decisions specialize their defaults. Preserve the established repository visibility/channels/workflows; deliberate migration requires authorization when disruptive. Publication through the existing public GitHub release channel is already authorized; new destinations require separate approval.

Inspect actual installed versions and use matching official APIs before integration edits. Current pins are in gradle/libs.versions.toml and app/build.gradle.kts. Do not upgrade dependencies/frameworks or raise OS baselines incidentally.

Use contextual icons for short lists and focusable disclosure controls for long explanations. Keep compatibility, consent and destructive consequences visible. Release feature metadata supplies localized labels/details/icons; do not invent historical claims.

Review only the affected modules and state that scope. For regressions compare known-working commits before rewriting. Distinguish calculated PCM bands, supplied metadata, current local observations, cached artwork and simulated local previews; never label missing information as measured zero or production history.

Simulations must remain local, labeled and out of production storage/analytics/external actions. See docs/SECURITY.md and docs/SYNC.md. Report exact emulator/physical-device evidence separately. Preserve rollback APKs and preferences; do not equate build/release publication with TV deployment.

## Priority, exceptions and update policy

Apply actual system/developer constraints first. Within project instructions, prefer explicit current task instructions, then repository architecture/approved decisions, then universal defaults, then general conventions. More specific/recent instructions resolve same-level conflicts; ask only for material unresolved or risky decisions. Preserve data, signing identity and existing public GitHub channel authorization. Temporary branches remain allowed, but integrate completed work into testing before beta/main promotion. No workflow migration or new distribution destination is implied by new universal defaults.

The native TV launcher remains Android-only. The user authorized Expo as the shared base and iOS/Android phone companions at the repository root; phone.yml builds their distinct packages. Do not fabricate Apple packages or add OTA. APK updates use GitHub's public release manifest, installed signing identity, SHA-256/package/version/SDK/ABI checks and official Android installation confirmation. Development-key installations cannot silently move to the release key. See docs/features/UPDATES.md. Never embed a GitHub token or bypass Android prompts.

## Diagnose before rebuilding

For TV pairing failures, collect existing diagnostics before changing code or
requesting another build. Use `scripts/collect_tv_diagnostics.py` with the actual
ADB serial/server port and a private output directory. Paired-client release logs
persist under the app's external `files/diagnostics` directory and the safe
`MiTVPairing` logcat tag. Developer details/copy/export include recent history.
Do not enable raw pyatv binary logging, print PINs/credentials, or claim an old
error was recovered when that app version never recorded it. Use failure class,
HTTP status, HAP phase and stack locations as evidence before choosing a fix.

## Aurea Home and Remote companion

The user authorized testing → beta promotion of the Expo work and companion
builds. Keep stable main unchanged until separately validated. Expo is now the shared application base. Android TV uses the native React Home
host and retained Android services; App.tsx dispatches the web preview and separate
iOS/Android/web phone remote. Preserve separate package IDs, update channels and signing continuity.
Multiple saved TVs have isolated credentials and cancellation on switching. Never
replay commands after reconnect, treat an example as a real TV, cache private API
requests or claim physical background remote support from browser tests.
PWA manifests/service worker are required for production exports; installation
requires a secure browser context. See docs/features/PHONE_REMOTE.md and PWA.md.
Music stays a top-left focus-driven activity; settings grow from the clock bubble.
Preserve sliding details, black activity material and nonfocusable navigation hints.
Temporary branch cleanup must preserve active Dependabot PRs and other worktrees.
