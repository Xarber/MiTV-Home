# Palette transitions, remote wallpaper and demo bridge — 29 October 2026

## Implemented scope

Version 2.0.2 / build 28 adds shared Spectrum/PaletteGradient rendering: six
actual rounded heights with circular zero levels, 1.8-second interruptible palette
crossfades, reduced-motion support, and unchanged receiver-band ingestion. Music
wallpaper tint uses the same palette transition without changing TV blur.

Remote state includes optional existing TV wallpaper preferences. One full-window
remote background replaces the desktop's overlapping/narrow backgrounds. Popup
coordinates share that window, and pairing success measures the actual settings
trigger instead of using the initial fallback anchor.

The explicit local Node demo bridge advertises Aurea Web Demo through Bonjour
and accepts the existing phone protocol. Owner-only loopback NDJSON events drive
only the web fixture model. PIN pairing, origin-bound tokens, bounded bodies,
allowed-command validation, no command replay, ephemeral identity/session storage,
and explicit simulated provenance isolate it from native devices. Owner credentials
are omitted from the precached index.html and foreign-origin HTML responses.
The displayed address prefers physical network interfaces over virtual bridges.
A static browser page alone cannot host an HTTP server or publish Bonjour.

## Failed build diagnosis

Run [40837709728](https://github.com/Xarber/MiTV-Home/actions/runs/40837709728)
failed all four Android formats because HomeRemoteService.handle referenced
`command`, which only exists in key(). The Control Center guard now sits in key(),
after the active Expo/Legacy Home dispatches. Android workflows compile the Java
host explicitly before package assembly. The original iOS device/simulator and
browser jobs succeeded; this does not prove the revised Android packages build.

## Executed validation

- TypeScript, actionlint, release version/history/license and whitespace checks passed.
- 23 Node model/server tests passed, including wallpaper compatibility, simulated
  source isolation, owner authorization, PIN pairing and command allowlists.
- 44 host Python cases ran successfully, with two environment-dependent skips.
- 21 headless Chrome navigation/UI cases passed, including expanded zero-level
  circles, gradual/interrupted color transitions and existing blur behavior.
- A final full repeat passed 19 cases but hit ENOSPC while saving results for
  two cases; both affected cases passed on a focused repeat after safe cache cleanup.
- Two-browser integration passed: requested PIN, paired success, fixture Music,
  activity, Home/Control Center, shared wallpaper, full desktop background and
  owner reload/reconnection. The test also runs in the shared browser CI job.
- PWA manifest, waiting update prompt, explicit reload and restored shell passed.
- Detached server responded at port 8768. Actual Bonjour browsing observed Aurea
  Web Demo. Chrome paired through the active Wi-Fi LAN address as a separate
  browser session. This is desktop browser evidence, not physical-phone testing.
- A desktop screenshot was inspected for the full-window remote wallpaper.

## Boundaries, build and cleanup

Android/iOS native validation requires the next full build and device
testing. No new version was installed on the TV, no release was published, and
main/beta were not promoted. Native signing identity/package identifiers, production
preferences, dock, blur and developer Legacy Home were preserved.

Removed approximately 135 MiB of obsolete preview APK/signature and generated/cache output after disk
space fell below 2 GB; retained production rollback APKs, credentials, source and
screenshots. About 381 MiB remained after the final cleanup, so no large local native build ran.
No temporary Git branch or worktree was created; development stays on testing.

The configured hardware Git signing key was unavailable (confirmed also with
installed FIDO-capable OpenSSH). The user explicitly approved unsigned commits for
this batch on 29 October 2026. Signing configuration remains unchanged; the commit
uses a command-scoped signing exception. The full native build is submitted from
testing and its status is reported separately from local checks.
