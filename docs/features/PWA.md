# Web installation, offline use and updates

`npm run build` exports Expo and runs `scripts/expo/pwa.mjs`. It generates distinct
Home/Remote manifests with stable IDs, standalone start URLs, icons, shortcuts,
theme metadata, Apple Touch Icon and a content-hashed service worker. Editable
icon source and reproducible exports are documented in [branding](../BRANDING.md).

Service workers require HTTPS or localhost. A plain HTTP TV IP remains a usable
remote webpage but is not promised to be installable/offline. Browser install
buttons appear only when the browser supplies an installation event. On iOS use
Share → Add to Home Screen on a secure deployment; actual iOS installation has
not been verified. No production hosting destination has been activated.

Only the exported public static allowlist is precached. Navigation tries the
network then falls back to the cached shell; immutable assets use the cache.
Private state, artwork responses, pairing codes, tokens, API POSTs and user
commands never enter the service-worker cache. Offline remote state shows
reconnection; it does not silently switch to a simulated TV or queue actions.
Cache activation removes only older `aurea-static-*` caches.

An updated worker waits. The app shows version/highlights with icons and grouped
Fixes & Improvements from its exported release metadata, plus Update & reload and
Later. Reload happens only after an explicit update action. Finish an in-progress
pairing first; saved pairings remain in separate credential storage. Foreground
update checks are throttled to five minutes. Web release metadata is not used to
install native APKs or claim native OTA support.

Headless Chrome verifies manifest output, registration and offline preview
navigation; actual Android/iOS/desktop installation prompts remain device checks.
The localhost production export runs independently of Metro.
