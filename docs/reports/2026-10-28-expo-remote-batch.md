# Expo TV and phone batch — 2026-10-28

## Scope

This batch follows the already integrated Expo TV geometry/focus corrections. It filters duplicate CEC HDMI entries, carries artwork colors and sampled receiver bands through the authenticated remote state, distinguishes television/settings/about groups, confirms system remote pairing, starts one hosted pairing attempt, exposes a developer launcher preview with connected-TV launch targets, and builds Android mobile from the full native host. iOS packaging architecture verification is corrected.

## Validation boundary

The user explicitly requested no local testing for this batch to conserve remaining usage. No tests, type check, emulator session, browser validation, native compilation, or physical-device validation were performed for these new edits. The existing full GitHub Actions workflow is being submitted from `testing`; its status is not a success claim. Android phone receiver behavior, iOS packages, TV focus/layout, pairing, sampled waveform behavior, and lifecycle/reconnection still require the user's target-device testing and CI results.

## Deployment and rollback

No production installation or release is part of this batch submission. The TV production package must be updated in place to retain preferences, trusted remotes, signing continuity, and keys. Remove only the separate preview installation after the production update succeeds. Existing rollback artifacts are retained. Stable and beta branches are unchanged.
