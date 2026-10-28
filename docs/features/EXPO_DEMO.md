# Aurea Home branding, wallpapers and Expo demo

## Scope and plan

Build the existing launcher’s interface as an isolated React Native/Expo demo on
`feature/aurea-expo-demo` in this repository. Keep the Android TV app, identifiers,
release signing, update repository and existing CI channels intact. Adopt the
platform-neutral display name **Aurea Home**. Do not migrate the native launcher to
Expo, create an unrelated repository, introduce an iOS target or publish to a new
hosting destination as an incidental change.

Acceptance: six customizable dock slots; three navigation stops; app/input menus;
keyboard/mouse/touch navigation; focused, bounded scrollable popups; simulated music
and remote activities; minimal wallpapers; reduced motion; local production preview;
repeatable web checks and clear separation from physical-device capabilities.

## Architecture

`demo/` contains the companion runtime, its npm lockfile and no native Gradle files.
Expo SDK 58.0.20, React Native 0.88.0, React 19.3.0, React Native Web 0.21.4,
Reanimated 4.7.1 and Worklets 0.13.0 were resolved through Expo’s SDK-aware installer.
SDK 58 requires a compatible recent Node version; development/CI use Node 24.
Primary references: [Expo SDK 58](https://expo.dev/changelog/sdk-58),
[Expo web export](https://docs.expo.dev/workflow/web/),
[Reanimated](https://docs.swmansion.com/react-native-reanimated/).

- `model/catalog.ts`: app/input fixtures, track/wallpaper metadata and dock rules.
- `model/navigation.ts`: bounded spatial focus selection, independently tested.
- `hooks/useDemo.ts`: demo-only preferences, playback and remote state.
- `hooks/useKeyboard.ts`: web keyboard adapter, modal focus trapping and restoration;
  focused rows scroll only within the nearest actual scrolling container.
- `platform/preferences.ts`: validated, versioned demo browser storage with safe
  fallback when storage is unavailable. No Android preferences/credentials are read.
- `components`: tiles, icons, procedural wallpaper, six-bar activity, music panel,
  bounded panels and overflow edge fades. No static screenshot is used as a UI.
- `bootstrap.web.ts`: browser styles/title, isolated from the native bundle.

The background is a fullscreen original vector scene. System/app icons and banners
change with focus; the library keeps its independent heavy blur under every tab.
The bottom glass dock has six tiles. All Apps is only allowed in slot six; sources
and individual HDMI entries can replace any slot. Replacement/removal maintains
six distinct entries. Settings and app menus trap focus and restore their trigger on dismissal. Music
is a nonblocking activity: it expands from the current top-left pill rectangle,
keeps the same black material when focused/collapsed, has no close button or heading,
and collapses when focus leaves. The background material morphs independently of
content so text/artwork do not stretch. Settings grow from the clock/date bubble
into a right sidebar, with progressively stronger backdrop blur toward the menu.
Both music and remote activity details slide open/closed without wrapping.
Page-position dots and downward library hints never enter directional focus.
Keyboard instructions appear for 5.5 seconds after loading, then disappear. Repeated simulation badges and redundant popup overlines are absent from the normal preview UI. Music has equal 16-pixel outer insets and no heading/close button. Inactive pages are inert to browser focus and screen readers.

## Simulations and provenance

All app launches, HDMI switches, network state, remote connections, tracks, volume
and waveform activity are simulated. Track progress is a demo clock, not a sampled
music source. The first-load preview hint, page title and About identify this as a
web preview; repeated simulation badges are intentionally absent from normal UI. Music produces no actual audio; its original artwork and two-color
bars are demonstration visuals. External receiver/pyatv/remote APIs, production
pairing, update installation, real TV input changes and microphone access are absent.
No sample records are written to production storage or analytics. Simulated remote
buttons only alter this demo. No external image/font service is used.

## Wallpapers and motion

Five original vector themes: Silk, Dune, Tide, Ink and Aurora. The demo uses layered
SVG curves and gradients; optional transform drift has a 10-second half-cycle and visibly advances without flashing. Each SVG instance has a unique gradient ID; selecting a main wallpaper cannot recolor other thumbnails. Motion pauses when the app becomes inactive.
It is off by default. Reduced motion stops wallpaper and waveform loops; short
focus feedback is reduced to static feedback. Scene changes use transform/opacity,
not animated blur intensity. No cached blur bitmap or pre-rendered video is used.

The Android `WallpaperController` settings/lifecycle adapter and `WallpaperArt` renderer provides matching original gradients/curves plus
Classic, which retains the previous background by default. Control Center’s
Wallpapers menu stores `wallpaper` / `wallpaper-motion` with presentation preferences;
backup/restore validates the IDs and Boolean. Older backups remain accepted; older APKs may reject a newer backup containing wallpaper keys rather than silently dropping them. Optional live system-banner drawing
is capped at 12.5 fps, pauses outside Home/library visibility and when Android
animator duration is disabled, and removes callbacks on pause/destroy. App-provided
banners remain intact. HDMI banners use a still rendering; no native media engine
or HDMI-routing behavior changes. Native visual/performance validation remains
separate from browser validation.

## Branding and distribution safety

Visible native application/settings/remote/update labels and the pairing client
name use Aurea Home. Existing package ID, preference files, DNS-SD marker, diagnostic
log tag, GitHub repository slug, update URLs, signing lineage and historical release
records remain unchanged. This keeps installed updates compatible. Saved custom
receiver names remain the user’s own names; only the default fallback label changes.

`demo.yml` runs preview checks on this feature branch (and allows manual dispatch),
exports a web artifact with its source commit, and validates Android JavaScript export. It does not alter the native build
matrix, auto-publish a new website, create iOS builds or deploy an APK to the TV.
A static export can be hosted later through an explicitly selected destination.

## Security and limits

Browser preferences are bounded fixtures, not credentials. Local previews bind to
127.0.0.1. Expo CLI’s transitive Zod/deepmerge advisories remain in the current SDK
build toolchain; npm’s suggested downgrade would change SDK compatibility, so it
was not applied. These packages do not implement this app’s remote/network service;
serve the production static export rather than exposing a development server to
untrusted clients. No claim of a complete dependency security audit is made.

Android demo exports prove bundle compatibility only; native input/focus, blur,
performance and installation need separate device validation. Browser media queries
and accessibility settings cannot establish physical TV behavior. See the
[validation report](../reports/AUREA_EXPO_DEMO.md).
