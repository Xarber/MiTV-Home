# Architecture

Expo is the shared application base. `App.tsx` selects native Android TV Home
(`Platform.isTV`), the separate phone remote, or the isolated browser preview.
The native Home is a React Native/Fabric surface with an embedded Hermes bundle,
not a WebView. Package `it.xarber.mitvhome`, Home component
`it.xarber.tvhome.MainActivity`, native namespace, signing identity and original
preference/credential stores are retained.

## Runtime boundaries

| Module | Responsibility |
| --- | --- |
| `TVHome.tsx`, `src/components` | Shared Home layout, dock/library, anchored panels and activities |
| `src/launcher/useLauncher.ts` | Real TV state adapter or explicitly isolated preview model |
| `src/platform/native` | Typed native RPC/events and spatial TV focus |
| `AureaTVModule`, `TVPlatform`, `TVHomeCatalog` | Bounded trusted bridge, actual apps/banners, registered inputs, original preferences, native service actions |
| Kotlin `MainActivity` / `AirPlayApp` | Expo React host and lifecycle; unchanged installed Home identity |
| `HomeRemoteService`, `RemotePlayback`, `PairedPlayback` | Persistent authenticated remote and real receiver/paired-device playback |
| `AirPlayService`, C/C++ engine | Receiver discovery, audio/video, actual six-band PCM analysis |
| `updates/*` | Existing GitHub metadata, download trust checks and official Android installer |
| `LegacyHomeActivity` | Explicit recovery interface, sharing canonical preferences; never the default Expo success path |
| `.phone-native` | Ignored generated phone host, staged from root sources; never overwrites TV host |

Native Home uses installed app IDs and registered input IDs, not sample app names.
Preferences remain in the historical activity store, with `library` translated to
`all` only at the adapter boundary. Web examples remain in their separate browser
namespace. Phone pairings stay separate per TV. Secure Apple TV credentials remain
under the existing native Keystore identity.

Foreground snapshots refresh at 1.5 seconds; receiver spectrum events use the
existing native six bands at 100 ms. Background polling stops. Remote FGS and
receiver persistence remain native so opening another application does not remove
their capabilities. Waveform artwork colors reuse the native palette algorithm;
paired-player bars remain decorative, never claimed as measured spectrum.

Live blur uses Expo 58 BlurTargetView, never retained screenshots. Android 10 uses
RenderScript and needs physical performance validation. Insets and popup content
remain bounded; D-pad focus reveals content inside its own scroll container.

See [migration decision](decisions/0003-expo-home-base.md),
[Expo development](features/EXPO_DEMO.md), [remote](features/PHONE_REMOTE.md),
[PWA](features/PWA.md), and [branding](BRANDING.md). Migration verification and
remaining limitations belong in reports, not implied by a successful web export.
