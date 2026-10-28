# Post-PIN failure and streaming coexistence — 28 October 2026

The user confirmed that a code now appears but entering it produces a generic
pairing failure. No exact device error is available from the installed v1.7.2,
which intentionally discarded exception messages and collapsed failure types.
An upstream report describes HTTP 470 after PIN entry on the same Apple TV model,
but that is only a hypothesis for this device, not an observed error.

Reviewed the app's paired-playback Python adapter, Android controller, PIN UI and
pyatv 0.18.0's AirPlay/MRP tunnel setup. The actual tunnel sets remote-control-only
mode; our adapter never invokes media-streaming methods. Therefore this is an
appropriate architecture for metadata and transport control rather than taking
the phone's media output. Compatibility and concurrent phone playback remain
physical-device acceptance criteria, not verified capabilities.

Implemented a bounded, allowlisted failure classifier and localized UI messages
for HTTP rejection/status, authentication failure, timeout, network interruption,
expiry, cancellation, runtime and secure-storage failures. No raw protocol logging,
credentials, response bodies, PINs or addresses are exposed. Five new tests cover
wrapped HTTP 470, distinct failure classes, redaction, cyclic causes and invalid
status values. All 21 Python tests and existing Java host checks passed locally.
Workflow static validation and diff checks passed. No Android compilation or new
physical installation was performed during these checks.

The TV still runs v1.7.2. v1.7.3 adds diagnosis and does not claim a post-PIN protocol
fix. Local build remains blocked by critically low Mac storage; the established
GitHub build is used for the next diagnostic artifact.

Sources:
- https://pyatv.dev/documentation/protocols/#airplay-2
- https://github.com/postlund/pyatv/blob/v0.18.0/pyatv/protocols/airplay/ap2_session.py
- https://github.com/postlund/pyatv/issues/2866
