# Architecture

MiTV Home is a native Android TV application, not a React Native project. Its package identity is `it.xarber.mitvhome`; the historical Android namespace remains `io.github.jqssun.airplay`. Changing either needs explicit migration planning.

## Components

| Module | Responsibility |
| --- | --- |
| `it.xarber.tvhome.MainActivity` | TV renderer, D-pad focus, three snap positions, banners, input/platform intents, Control Center and activity views |
| `AppLanguage` | English/Italian presentation context, independent of system language |
| `DeviceName` | System-assigned friendly receiver name with fallbacks |
| `HomeRemoteServer`, `RemoteRequest` | Foreground-only paired phone remote, bounded HTTP validation, presence expiration |
| `HomePreferences` | Versioned presentation export/import with allowlist and previous-state snapshot |
| `ReleaseHistory` | Shared localized release history, upgrade baseline and once-per-version presentation |
| `diagnostics.DeveloperSession`, `Diagnostics` | Temporary access and bounded safe event export |
| Kotlin `AirPlayService` / bridge | Foreground service, mDNS, session state, metadata, audio/video routing and native callbacks |
| C/C++ engine / UxPlay | Receiver protocol, clocking, codecs, PCM output, six-band signal analysis |
| `scripts/release.py` / Actions | Version consistency, embedded provenance, artifact checksums and release notes |

## Flows and lifecycle

Home starts/binds the receiver, then starts HTTP remote while resumed. Pausing stops HTTP/presence and unbinds the launcher, while the foreground receiver remains available. AirPlay video/mirroring uses receiver playback UI; audio metadata and measured PCM bands feed the native Home activity and popup. Opening phone remote controls preserves the music activity.

UI work is on Android's main thread; app discovery/art preparation use the existing single worker; media work stays in native/service threads. Popup backgrounds are captured when opened and discarded on dismiss. Never reintroduce stale cross-banner backdrop caches. Reduced-motion settings disable decorative transitions.

The existing renderer remains in MainActivity; new state and validation live in separate modules. Further renderer extraction should preserve focus and hardware behavior in small reviewed steps. MainActivity is not a public plugin API.
