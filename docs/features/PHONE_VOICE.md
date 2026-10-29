# Phone microphone → Android TV voice service (2.0.6)

In the phone remote, open TV controls and tap **Phone microphone**. Grant the OS
microphone permission, speak, then tap again to stop. The red Listening button
identifies active capture. This requires launcher pairing and Android TV system
controls pairing, plus voice support in the installed Android TV Remote Service.
It does not just send the VOICE_ASSIST key. The TV assistant determines recognition,
search results, availability and its own downstream privacy policy.

Native iOS/Android companions capture in memory; no recording files are created.
The Android TV host itself does not request microphone permission. Browser capture
uses getUserMedia and AudioWorklet only on HTTPS/localhost, subject to microphone
permission, browser local-network restrictions and normal remote pairing. A remote
served at the TV's plain HTTP address cannot request the microphone; the UI explains
the need for the phone app or HTTPS. Browser demo fixtures cannot start capture or
send real voice operations. This is not speech recognition performed by Aurea.

## Modules and lifecycle

- `modules/aurea-microphone`: auto-linked Expo local module. Android AudioRecord
  captures VOICE_RECOGNITION PCM; iOS AVAudioEngine/AVAudioConverter resamples input.
  Android needs RECORD_AUDIO, iOS NSMicrophoneUsageDescription and runtime consent.
  Permission declarations are phone-only. The module stops on background/destruction.
- `src/remote/voice`: permission/capture adapters, controller and listening button.
  Capture has a 30-second limit. Permission cancellation, disconnect, closing the
  controls, TV switching and app backgrounding stop capture and close the old TV's
  session. Three pending chunks at most; uncertain packets are never replayed.
- `public/voice-capture.js`: secure-browser audio worklet, 8 kHz mono PCM16 output;
  silent graph output prevents microphone feedback. Tracks and AudioContext close
  after stop/failure. Browser resampling uses averaged input samples.
- `HomeRemoteServer` / `HomeRemoteService` / `system_remote.py`: existing paired
  transport forwards decoded PCM to androidtvremote2 **0.3.2** VoiceStream. Output
  is signed PCM16 little endian, mono, 8000 Hz, in 8192-byte chunks; the protocol
  pads a partial final chunk. No session/audio/keys are persisted or payload-logged.

The client binds operations to the original transport/token/generation. Switching
TVs cannot forward audio to the newly selected TV; cleanup still targets the old
one. A server session expires after six idle seconds or 35 absolute seconds.
Service loss, trust revocation and shutdown end the voice stream. Recognition is
not guaranteed just because the transport accepted a chunk.

## Voice envelope and API

All routes require existing authenticated remote trust and origin checks:

| POST | Payload/result |
| --- | --- |
| `/api/voice/start` | Returns random `id`, ephemeral RSA public keys in SPKI and PKCS#1 DER/base64, format and 30000 ms limit |
| `/api/voice/chunk` | `id`, sequential integer `sequence`, base64 `nonce`, `ciphertext`, `wrappedKey`; returns accepted |
| `/api/voice/end` | `id`; idempotently ends this token owner's matching session |

The server derives owner identity from the authenticated token; clients cannot
supply an owner. Only one voice session may exist at a time. Each session uses a
new RSA-2048 key. The phone generates AES-256, wrapped with RSA-OAEP SHA-256 and
MGF1 SHA-256. Each packet uses AES-GCM, random 96-bit nonce and UTF-8 `id:sequence`
as authenticated data. Ciphertext appends its 16-byte authentication tag.
Packets are limited to 16 KiB HTTP bodies; other routes retain the 4 KiB limit.
The decoder checks ordering, replay/nonces, owner, session, bounds, idle deadline,
authentication tag, PCM alignment and aggregate size. Errors close the owning
stream; another token cannot close it by sending a malformed chunk.

This protects microphone payloads against passive HTTP observation. **It does not
turn the existing HTTP pairing/public-key exchange into authenticated TLS**;
active LAN interception and stolen remote tokens remain existing trust-boundary
limitations. Use trusted home Wi-Fi, never expose the server to the Internet.
The TV-to-system-service connection uses the existing paired TLS channel.

## Compatibility and evidence

No dependency or minimum OS upgrade: Expo 58.0.20, core 58.0.27, RN TV 0.88.0-0;
iOS module minimum 16.4, with AVAudioApplication permission API gated to iOS 17
and AVAudioSession fallback. Native build and physical microphone/assistant tests
are distinct from browser encryption/controller tests. See the associated report.

Primary references:
[Expo autolinking](https://docs.expo.dev/modules/autolinking/),
[Expo module config](https://docs.expo.dev/modules/module-config/),
[Apple recording consent](https://developer.apple.com/documentation/avfaudio/avaudioapplication/requestrecordpermission(completionhandler:)),
[Android AudioRecord](https://developer.android.com/reference/android/media/AudioRecord),
[androidtvremote2 pinned implementation](https://github.com/tronikos/androidtvremote2/tree/v0.3.2).
Android KeyEvent constants are official platform APIs; the network remote protocol
adapter is a community implementation, not an official Google remote SDK.
