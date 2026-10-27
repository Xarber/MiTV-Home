# MiTV Home development

Start with [docs/INDEX.md](docs/INDEX.md). Follow the user's Universal Application Development Standards; this file adds project-specific context.

- Native Android TV application, Java launcher + Kotlin/Compose receiver + C/C++ media engine. Minimum API 26, target 34; do not change minimum/target or rewrite the framework incidentally.
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
