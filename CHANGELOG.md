# Changelog

Generated from `app/src/main/assets/release-history.json`. Legacy versions reflect repository history; dates describe implementation, not a verified public release.

## 2.0.5 — 2026-10-29

More TV controls and deeper TV wallpaper colors.

### Fixes & Improvements

Separate system-service errors from launcher connectivity, reconnect without replaying keys, correct TV manifest lint, and wait for rendered animation frames in browser checks.

## 2.0.4 — 2026-10-29

More reliable Home controls and smoother wallpaper changes.

### Fixes & Improvements

Single Home/input ownership; paused activities hide after five minutes. Wallpaper tint stays behind banners, covers rotating edges, and is slightly dimmer only on TV. Corrects explicit launcher export declarations.

## 2.0.3 — 2026-10-29

Android launcher registration and build reliability improvements.

### Fixes & Improvements

Separate TV and phone launcher declarations; additional CI packaging memory and animation-aware browser checks.

## 2.0.2 — 2026-10-29

Smooth music colors and a phone-controllable web demo.

### Fixes & Improvements

Remote wallpaper follows the TV across the full window; minimum waveform bars stay circular. Corrects the Android host compilation failure.

## 2.0.1 — 2026-10-29

Refined native remote, pairing recovery and music-themed wallpapers.

### Fixes & Improvements

Safe-area-aware anchored popups, submenu Back navigation, menu and combined playback buttons, customized input names/icons and silent paused waves.

## 2.0.0 — 2026-10-28

Expo becomes the shared Home, phone and web application base.

### Fixes & Improvements

Improves TV focus and pairing restoration, shares AirPlay music activities with the phone remote, adds pairing confirmation and an optional blur switch, and corrects native build packaging.

## 1.8.1 — 2026-10-28

Fixes the phone remote page bundled inside the TV app.

### Fixes & Improvements

Preserves Expo JavaScript and CSS during Android asset packaging and verifies required web files before publication.

## 1.8.0 — 2026-10-28

Aurea Home identity, minimal wallpapers and a paired phone remote.

### Fixes & Improvements

Improves small-screen sources, reconnects discovery after network changes and separates credentials for each TV.

## 1.7.5 — 2026-10-28

Fixes the immediate error when submitting an Apple TV pairing code.

### Fixes & Improvements

Updates the HAP SRP call for the bundled authentication library and pins its version for reproducible builds.

## 1.7.4 — 2026-10-28

Persistent pairing diagnostics that can be retrieved from the TV without rebuilding for every failure.

### Fixes & Improvements

Records pairing phases, HTTP status, timings and safe exception locations in rotating files and Android logs; developer copy/export includes recent history.

## 1.7.3 — 2026-10-28

Understand why Apple TV pairing fails, with safe and specific error details.

### Fixes & Improvements

Distinguishes receiver authorization rejection, HTTP status, authentication failure, timeout, interrupted connection and secure storage errors without exposing PINs or credentials.

## 1.7.2 — 2026-10-28

Send the client name required for tvOS 27 pairing codes and hide software receivers from Apple TV discovery.

### Fixes & Improvements

Filters this launcher’s local addresses, marked receiver/preview instances and the legacy UxPlay simulated Apple TV fingerprint without relying on device names.

## 1.7.1 — 2026-10-28

Choose the Apple TV HDMI input and return Home to enter its pairing code.

### Fixes & Improvements

Pending pairing survives HDMI switching and Home recreation. Only unfinished code entry expires after three minutes; saved pairing has no application expiry timer.

## 1.7.0 — 2026-10-27

Pair an Apple TV to show its playback and available controls in the music activity.

### Fixes & Improvements

Keeps local AirPlay audio priority, protects saved pairing credentials and hides unavailable remote controls.

## 1.6.0 — 2026-10-27

Discover GitHub updates in Home, read release notes and download verified APKs inside the launcher.

### Fixes & Improvements

Cached checks, channel and signing compatibility, metered-network preferences and Android installation confirmation preserve existing app data.

## 1.5.1 — 2026-10-27

Clearer changelog cards with contextual icons and expandable details; compact developer tools.

### Fixes & Improvements

Remote interactions keep temporary developer access active. Diagnostics identify observation time and local-only simulations. Existing dock, AirPlay and pairing behavior is preserved.

## 1.5.0 — 2026-10-27

Developer tools, a permanent changelog and portable Home preferences.

### Fixes & Improvements

Stronger remote request validation, private diagnostic exports and reproducible release builds.

## 1.4 — 2026-10-27

Music and remote activities reveal details on focus; choose black or transparent backgrounds.

### Fixes & Improvements

Six frequency bands, album-color gradients, inset artwork and focused playback controls. Mac Music playback remains unresolved.

## 1.3 — 2026-10-27

QR pairing includes its short-lived code and dismisses after pairing.

### Fixes & Improvements

Experimental FairPlay v2 handshake framing; this does not provide complete AirPlay 2 or guarantee Mac Music playback.

## 1.1 — 2026-10-26

Customizable six-position dock, HDMI shortcuts, integrated AirPlay and phone remote.

### Fixes & Improvements

Three animated navigation stops, Italian and English, and fresh popup backdrops.
