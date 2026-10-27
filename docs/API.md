# Home remote HTTP API

Server exists only while Home is resumed. Requests must originate from loopback/link-local/private LAN addresses. URL is the actual TV IPv4 address and active port; port 80 may fall back to 8765. Use trusted LANs: HTTP has no transport encryption and tokens are readable to a capable local-network observer. Do not expose this listener to the Internet. Pairing is authorization, not TLS.

## Routes

| Method/path | JSON body | Result |
| --- | --- | --- |
| GET `/` or `/index.html` | None | Embedded remote page and corresponding-source link |
| POST `/pair/start` | None | Requests top-left PIN notification or refreshes open QR panel |
| POST `/pair` | `pin` string | 192-bit URL-safe token; rotates PIN and closes QR panel |
| POST `/api/key` | `token`, `command` | Executes allowlisted key; refreshes presence |
| POST `/api/presence` | `token`, optional `disconnect` bool | Heartbeat or disconnect |

Commands: up/down/left/right/ok/back/home/volumeup/volumedown/playpause/next/previous. PIN expires after five minutes. Five failed PIN attempts per minute are allowed. Notice requests are throttled to one per three seconds. At most 16 tokens exist in memory. Backgrounding Home/revocation invalidates all tokens. Presence heartbeat is 5s; stale presence expires after 15s. QR stores PIN in a fragment cleared before request transmission. Authenticated presence drives the remote activity.

## Validation and errors

HTTP/1.1 only, exact local Host authority, matching Origin when supplied, no transfer encoding or duplicate headers, 8 KiB headers, 4 KiB JSON bodies, complete reads and 3s per-client timeout. POST bodies must be application/json. The listener processes one connection at a time: slow clients can temporarily delay other clients within the timeout; no remote public access is intended.

400 malformed request/JSON, 401 unknown token, 403 incorrect/expired PIN or foreign Host/Origin, 404 unknown route, 405 method, 413 oversized body, 415 media type, 429 pairing throttled, 431 oversized headers. Responses are no-store, nosniff, deny framing and restrict page connections to the same origin. No cross-origin permission is granted.
