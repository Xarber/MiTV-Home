# Apple Music on macOS

## FairPlay v2 compatibility in v1.3

The receiver now accepts FairPlay v2 alongside the existing v3 path. V2 has a genuinely different 142-byte phase-one response; relabeling the v3 response does not supply it. Phase two echoes the negotiated version, and the existing key-decryption core is preserved.

The v2 capture comes from:
https://github.com/joerg-krause/shairplay/blob/d5f0953d2380502366592e30a0a59fe3879f3c59/src/lib/fairplay_playfair.c

The Android implementation and version-matched phase-two handling were cross-checked against:
https://github.com/mazer666/PhairPlay/blob/main/app/src/main/kotlin/com/phairplay/airplay/handshake/FairPlay.kt

Validation: host regression tests passed for v2, v3, key handling, and malformed requests. Both complete handshake phases for both versions also passed against the physical TV over RTSP. On the user's Mac, Music connects to the receiver but does not play audio (tested with the free Chill station). End-to-end Mac Music playback remains unresolved; successful handshake tests do not establish playback compatibility.

This implements the missing FairPlay v2 transport handshake. Modern AirPlay 2 multi-room playback, HomeKit pairing, PTP synchronization, and buffered-stream support are separate features and are not claimed by this change.

## Background and fallback

A related receiver documents the same macOS Music compatibility error when Music sends v2 to a v3-only receiver:
https://github.com/Jheenz/airplay-tv-receiver#compatibility-and-limitations

If a sender still fails, choose the TV in macOS Control Center → Sound (or System Settings → Sound → Output), then play Music through system audio. That route can omit track metadata and artwork. The launcher uses a neutral gradient when the sender supplies no cover.
