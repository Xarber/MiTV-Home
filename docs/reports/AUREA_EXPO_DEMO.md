# Aurea Home Expo demo — 28 October 2026

## Implemented scope

Feature branch `feature/aurea-expo-demo` in the existing repository. Added the Expo
companion, Aurea Home visible branding, original minimal wallpapers and a native
wallpaper settings/lifecycle adapter. No framework rewrite, repository rename,
package/signing migration, public hosting activation or TV installation.

Inspected and modified only the launcher presentation/branding/preferences hooks,
new wallpaper modules, demo modules, documentation and demo workflow. This is not
a full audit of the media engine, Android platform integrations or dependencies.

## Passed local checks

| Check | Environment | Result |
| --- | --- | --- |
| Strict TypeScript | Expo SDK 58, TypeScript 6.0.3 | Passed |
| SDK-aware dependency compatibility | `expo install --check` | Up to date |
| Dock/focus model rules | Node 24, three tests | Passed |
| Browser interactions | Chrome headless, eleven tests | Passed |
| Production static web export | Metro / React Native Web | Passed |
| Android demo JavaScript/Hermes export | Expo SDK 58 | Passed; not an APK |
| Existing host checks | Java lifecycle/update/pairing checks plus 27 Python tests | Passed |
| Original Android app Java/Kotlin compilation and release lint | Existing SDK / bundled unchanged native libraries | Passed in 32 seconds |
| Source whitespace | `git diff --check` | Passed |

Browser scenarios cover dock edge clamping; all three landing points; music
controls and automatic collapse on focus departure; constant black focused and
collapsed activity material; coexistence of music/remote activities; dock pinning;
preferences/language/category changes; popup scrolling and focus visibility; held
Enter; compact and portrait layouts; reduced motion; clock/pill anchoring and
sliding activity details; one-time loading hints; stable thumbnail gradients;
actual animated-wallpaper transform changes; nonfocusable dots/downward hints.

Screens covered: 1440×900, 740×520 and 390×844. Actual production-preview captures
in `docs/assets/demo/` were inspected for dock/icon rendering, bounded content,
wallpaper cards and music/settings placement. They are web-demo screenshots, not
physical TV captures. Wallpaper motion was observed by sampling changing computed
transforms; this does not prove physical-device frame pacing or battery performance.

## Problems found and corrected

- Positioned gradient layers obscured inline SVG tile/artwork content: added an
  explicit foreground layer without cropping the art.
- The three-page canvas could grow the viewport and shift popup placement: fixed
  viewport bounds and positioned the canvas independently of normal flow.
- Held Enter release could activate the newly focused Close button: centralized
  Enter handling with press state that survives popup transitions.
- Music/settings initially used dialog behavior: replaced it with an anchored
  childless material morph and independently revealed content. Music is nonblocking
  and collapses on focus departure; settings use a right sidebar/progressive blur.
- Focus styling changed a black activity to gray: kept focus feedback on its border
  and used the same black material for expanded/collapsed states.
- All wallpaper SVGs used the same gradient ID: per-instance IDs prevent selecting
  one wallpaper from recoloring other thumbnails.
- The original drift was almost imperceptible: increased displacement and reduced
  the half-cycle to ten seconds; animation stops when inactive or reduced motion
  is requested. The settings value identifies reduced-motion suppression.
- Removed redundant music headings/X, uneven content insets, persistent demo badges,
  and focusable page hints. Instructions now disappear after 5.5 seconds.

One native check invocation failed because Python 3.11 was absent from that shell's
PATH. Repeated it with the existing verified 3.11 runtime; compilation/lint passed.
No new SDK, emulator or toolchain was installed for these native checks.

## Security and storage

The demo uses static fixtures and a dedicated browser-storage namespace; it calls
no production TV, AirPlay, remote-pairing or update-installation API. Normal preview
UI omits repeated simulation badges at the user's request; first-load context,
page title, About and documentation identify the web preview. No simulated data is
written as genuine production activity. About provides the integrated testing source link.

Current SDK tooling retains transitive Zod/deepmerge advisories. An incompatible SDK
downgrade was not used to silence npm audit. The preview serves only the production
static export on 127.0.0.1; this is not a claim that the complete dependency graph
was security-audited.

When available storage fell below 2 GB, removed superseded downloaded TV builds and
regenerable completed-build intermediates/Gradle transforms, recovering 1,818 MiB.
Kept source, installed app data, signing credentials, dependency artifacts and the
previous installed rollback APK. No unrelated user files were removed.

## Distribution and remaining limits

The detached local preview responds at http://127.0.0.1:8765. The launcher remains
installed at the previously confirmed stable version. Native branding/wallpaper
changes were compiled/linted but not installed or visually tested on the TV.

The initial demo-only scope was later expanded to the separate iOS/Android/web phone companion. See AUREA_PHONE_PWA.md for its newer validation and build boundaries. No new website is deployed. Native Expo installation, Android TV
D-pad/runtime behavior, native wallpaper performance, real AirPlay/HDMI interactions
and cross-device remote control are not established by these browser tests.
