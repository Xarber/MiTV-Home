# Native remote and music follow-up — 2026-10-29

## Scope and implementation

Reviewed and changed the phone remote, panel navigation, native HTTP/system-remote adapter, input catalog and hero marks, wallpaper tint, packaging/version metadata and release-source generation. No full application audit is claimed. The TV blur implementation/parameters, dock appearance and developer Recovery Home remain intact.

Phone popup origins now come from actual native trigger/root measurements; collapse reuses the same coordinate space. Safe-area and keyboard bounds constrain the material and scrollable content. A phone-only material uses Expo Glass Effect 58.0.5 on supported iOS, native BlurView otherwise, with reduced-transparency fallback. Android phone popups receive an actual blur target. Preview mode requests landscape through Expo Screen Orientation 58.0.3 and restores the previous orientation policy. Resizable iOS 27 windows/browser policies may refuse locks.

Back traverses a shared visited-panel stack. Popup dismissal remains separate. Remote controls now provide combined Play/Pause, Menu and Control Center, plus long-OK and long-Back alternatives. Fixed row spacing replaces percentage row gaps. Physical HDMI route IDs remain stable while configured brands and CEC names replace generic labels; input icons are included in the remote catalog flow.

Input banner marks have a separate hero-icon path: aspect-preserving rasterization, transparent-margin trimming, and equal visible-area fitting. Dock icon responses are unchanged. Live TV uses its TV glyph in the hero. Music wallpaper tint is optional, uses the same two artwork colors as the waveform, drifts gently above the selected wallpaper/banner, respects reduced motion and fades on pause. All six paused waveform bars use a uniform zero-amplitude visual baseline.

## Device diagnosis

Read existing persistent diagnostics from the physical TV without changing it. Installed production was build 26, commit 9816374. Repeated system_pair_finish failures were ConnectionClosed at androidtvremote2 async_finish_pairing. This is a protocol-connection closure, not evidence that the TV's ordinary HTTP remote is unreachable.

The adapter now attempts authenticated control-channel verification after a closed pairing connection; it cannot report success merely because the TV closed the pairing popup. An explicitly acknowledged pairing is persisted independently of temporary control readiness. Wrong authentication still fails. Pairing time budgets are consistent across Python/HTTP client. The HTTP server uses a bounded three-worker pool so one pairing exchange does not block every normal request; state reads no longer wait on the pairing monitor.

The TV contained separate historical prototype and production package IDs. Android cannot replace one package with another through an update. Production stays it.xarber.mitvhome, with the same signing identity and a new version 2.0.1/build 27. Phone remains it.xarber.aurea.remote; it no longer renders Native TV Home or advertises a Leanback launcher entry when installed on a TV. No installed app or user data was removed.

## Distribution

TV and phone have distinct stable/beta Obtainium profiles. Metadata releases are filtered out. After successful beta/main publication, actual IPA sidecar metadata and published download assets generate channel-separated AltSources and update the separate sources-v1.0 metadata release. Actual native minimum OS, version/build, byte size and declared permissions are preserved. Testing publishes no release; source endpoints/first iOS entries are pending that first validated publication. No invented download/version is included and no official-store submission is configured.

## Validation

TypeScript and workflow validation passed. Host/model tests passed, including authenticated recovery/rejection, delayed readiness, source-channel/asset validation and hero sizing. Browser tests passed for 20 cases, including submenu Back, paused six-bar baseline, explicit controls, bounded phone popup and an animated music tint over a selected wallpaper. PWA update/offline checks passed. Final batch counts: 21 model tests passed; 44 host Python cases ran with two protocol-environment-dependent skips; 20 headless Chrome browser tests passed. Workflow validation and Git whitespace checks passed.

Existing TV diagnostics and installed package metadata were read from the physical TV; new native behavior was not installed or exercised there. iOS glass/safe areas/rotation, Android pairing and HTTP concurrency, native icon rendering and sources inside real AltStore/Obtainium require device testing and the native build. Headless Chrome checks do not establish iPhone/iPad behavior. Public source URLs are not claimed live before publication.

## Primary references

- Expo SDK 58 Glass Effect: https://docs.expo.dev/versions/v58.0.0/sdk/glass-effect/
- Expo SDK 58 Screen Orientation and resizable-window limits: https://docs.expo.dev/versions/v58.0.0/sdk/screen-orientation/
- androidtvremote2 v0.3.2 pairing implementation: https://github.com/tronikos/androidtvremote2/blob/v0.3.2/src/androidtvremote2/androidtv_remote.py
- AltStore source and native permission schema: https://faq.altstore.io/developers/make-a-source
- Obtainium source filtering: https://wiki.obtainium.imranr.dev/sources/
