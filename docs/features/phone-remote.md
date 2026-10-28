# Phone remote and launcher preview

The mobile entry point is Aurea Remote on Android and iOS. The complete shared launcher remains bundled. Tap the version three times in settings to expose **Preview launcher**; return with the remote button. When connected, preview app and input tiles use the selected television's catalog and send launch commands to that TV. Preview appearance preferences remain separate from native TV preferences. Other preview settings and media are demonstration controls, not receiver support on iOS or web.

## Pairing and televisions

Saved televisions, television controls, and application information have separate headings. An authenticated saved session reconnects normally. A TV-hosted browser remote starts one pairing attempt on initial load when no saved session exists. A QR pairing fragment can supply the code, then is removed from browser history. This does not bypass television pairing approval. System remote pairing shows a success confirmation after completing the separate Android TV Remote Service exchange.

Only physical HDMI roots are listed: CEC child-device entries are excluded to avoid listing both HDMI 2 and Apple TV for the same port. Input identities remain Android TV input IDs.

## Music activity data

`RemoteMusic.colors` contains two validated hexadecimal artwork colors. `bands` optionally contains six finite linear receiver spectrum samples in the range 0–1. Receiver-backed audio is polled every 500 ms while the remote is foregrounded; other states retain two-second polling. This is a sampled spectrum, not continuous frame-rate audio transport. The existing normalized receiver DSP and bounded display curve are reused. Missing bands use decorative motion, including paired Apple TV playback; missing colors use the established fallback palette. No microphone or audio payload is sent to the phone.

## Native Android companion

The Android companion now builds the existing root native host with `-PmobileRemote -PhomeApplicationId=it.xarber.aurea.remote`. It includes the existing receiver and platform bridge rather than an Expo-generated host without AirPlay. The mobile manifest uses a normal launcher entry, unrestricted orientation, and recents. It does not register as a replacement Android Home app. The default screen is the remote, and the Android-only settings action starts the local AirPlay receiver explicitly. Native receiver operation on physical phones remains unverified. iOS and web remain remote clients and do not advertise an AirPlay receiver.

Mobile builds do not automatically start the TV remote server, install the TV immersive navigation behavior, or check for TV APK updates. TV production keeps its existing package, Home component, signing identity, receiver, persistent remote, and saved data. The separate development preview package is not the production receiver.

## Build limitations

All formats use the same source commit. Android companion jobs reuse pinned Python wheel artifacts from run 40701926505 and compile current Android native source for all four ABIs. iOS device and simulator jobs package separately; unsigned IPA installation requires external signing. The corrected `lipo` invocation supplies the binary before the architecture verification options.

This batch was deliberately not tested locally at the user's request. See the batch report for validation boundaries.
