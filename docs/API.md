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
