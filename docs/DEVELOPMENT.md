# Development

Read AGENTS.md and ARCHITECTURE.md first. Clone recursively onto a local filesystem; keep signing material outside the checkout. Use existing JDK/Android tools (see BUILDING.md). Do not install SDKs or emulators without approval.

1. Branch from testing; plan affected modules and acceptance criteria.
2. Implement one coherent change, update relevant docs and Conventional Commit it.
3. Push completed changes to testing, which has no automatic builds.
4. After a batch run host checks, build/lint and emulator checks. Record actual results.
5. Open testing→beta PR. Beta builds release APK/AAB in parallel, validates/signs and publishes a prerelease only after all required jobs succeed.
6. Review the exact beta artifacts and compatibility report, then promote beta→main by PR for stable publication.

`python3 scripts/release.py generate` refreshes Markdown and developer history from structured releases and Git. `metadata` writes build provenance; CI runs it against the exact checked-out commit. Keep versionName/versionCode/release-history in sync. Do not amend published commits or change signing identity.

Large native builds belong in Actions. Local `-PuseBundledNative` previews use checked-in ARM binaries and do not verify C/C++ edits. Simulator UI evidence does not prove TV input routing or new sender playback.
