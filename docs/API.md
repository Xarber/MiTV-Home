# Local remote HTTP API

`HomeRemoteService` owns the listener independently of the Home activity. Private,
link-local or loopback peers only; exact Host validation. Port 80 falls back to
8765 if unavailable. Use the actual address shown on the TV. HTTP pairing is
explicit authorization, not TLS; use trusted home Wi-Fi and never expose it to the
Internet. See [phone companion](features/PHONE_REMOTE.md) for the complete contract.

| Method/path | Request | Result |
| --- | --- | --- |
| GET `/` | None | Embedded phone remote, source link |
| POST `/hello` | Empty object | Schema and random persistent application ID; no private state |
| POST `/pair/start` | Empty object | Top-left code notification or open QR refresh |
| POST `/pair` | Six-digit `pin` | Token and TV ID; persists trust, rotates PIN, closes QR |
| POST `/api/state` | `token` | Device name, actual playback/system-control state, timestamps |
| POST `/api/catalog` | `token` | Allowlisted installed apps and actual TV inputs |
| POST `/api/icon`, `/api/artwork` | `token`, catalog/artwork `id` | Bounded supplied image data |
| POST `/api/key` | `token`, allowlisted `command` | Foreground launcher or paired system-service key |
| POST `/api/launch` | `token`, catalog `id` | Known app/input/live-TV launch |
| POST `/api/media` | `token`, `source`, `action`, optional numeric `value` | Capability/source-checked playback control |
| POST `/api/presence` | `token`, optional `disconnect` | Presence lease |
| POST `/api/revoke` | `token` | Revokes this token only |
| POST `/api/system/pair/start` | `token` | Starts explicit loopback system-service pairing |
| POST `/api/system/pair/finish` | `token`, six-hex-digit `pin` | Completes system-service pairing |

Keys: up/down/left/right/ok/back/home/volumeup/volumedown/playpause/next/previous.
Five-minute phone PIN, five failed attempts/minute, notices throttled to three
seconds. Up to 16 encrypted tokens persist across service restarts. Presence
expires after 15 seconds; the phone refreshes actual state every two seconds while
active. No commands are queued for replay. QR PIN fragments are removed before
API requests and may complete same-origin pairing automatically.

HTTP/1.1, bounded 8 KiB headers/4 KiB JSON bodies, duplicate/transfer-encoding
rejection, complete reads and read timeout. Foreign origins require a well-formed
HTTPS origin (localhost development exception). CORS is exact-origin; each browser
token is bound to that origin. Native/same-TV-origin tokens use a separate class.
OPTIONS is parsed only for this explicit browser policy; default host parser tests
retain strict same-origin behavior. Authentication is required for every `/api/`
action regardless of preflight. No credentials/private state enter PWA caches.

## In-process Expo TV adapter

`NativeModules.AureaTV` is registered only by the handwritten TV host. This is not
an HTTP endpoint and is absent from generated phone apps and the browser preview.
`execute(operation, JSON)` accepts a bounded JSON object (32 KiB); image results
are bounded data URIs, never arbitrary URLs. `pairedRequest` has its own smaller
4 KiB bound and fixed scan/pair/cancel operations. Native methods do not expose
credentials or unrestricted intent execution.

The typed snapshot includes the real app/input catalog, canonical saved dock,
appearance/language, network availability, receiver/paired playback, volume,
remote presence, update state and exact native build metadata. App and input
launches are validated against the current catalog. Media actions check the
current source and reported capabilities. Preference writes validate the batch
before committing. Settings use supported Android intents with explicit fallbacks.

`AureaTVEvent` carries fixed key/home/pairing/notice events. `AureaTVWaveform`
carries six calculated PCM bands only while the native receiver is active and
Home is foreground. Paired Apple TV bars remain decorative. No browser example
is substituted when a native request fails.

`ready` confirms a valid initial snapshot and enables the native startup recovery
guard. Release/update actions delegate to existing native controllers; backup and
restore use Android document providers and preserve the existing validation rules.

## Remote wallpaper / browser demo extension (2.0.2)

`/api/state` may include `wallpaper: {id: string, motion: boolean, musicTint: boolean}`.
The phone validates this optional value without rejecting older state payloads.
The native service reads existing TV preferences and does not modify them.

The explicit Node demo server implements the existing hello/pair/state/catalog,
key/launch/media/presence/revoke protocol, with `provenance: simulated` and music
source `demo`. Native system-pairing operations are intentionally unsupported.
The private loopback POST `/__demo/events` streams NDJSON; `/__demo/state` accepts
owner snapshots and returns phone presence plus the LAN URL. Both require the
in-memory owner header and matching tab identity. `/__demo/health` reports owner
availability without credentials. No private endpoint or authenticated response
is cached by the PWA. See EXPO_DEMO.md for security and lifecycle constraints.

Music state may include activityVisible:boolean (presentation only); false hides a
paused activity without ending its playback session or disabling controls. Native
key payloads carry eventId to reject duplicate bridged delivery. Background Home
failure returns foreground_access_required; permission is requested through the
TV's Remote settings, never granted automatically by the application.
