<p align="center"><img src="docs/assets/banner.svg" alt="MiTV Home — a quieter home for your TV" width="100%"></p>
<p align="center">
<a href="https://github.com/Xarber/MiTV-Home/actions/workflows/build.yml"><img src="https://github.com/Xarber/MiTV-Home/actions/workflows/build.yml/badge.svg?branch=main" alt="Build"></a>
<a href="https://github.com/Xarber/MiTV-Home/releases"><img src="https://img.shields.io/github/v/release/Xarber/MiTV-Home?color=858bea" alt="Release"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-abb5fa" alt="GPL 3"></a>
<img src="https://img.shields.io/badge/Android-8%2B-9acda9" alt="Android 8 or newer">
</p>

A remote-first Android TV launcher with a six-item dock, fullscreen artwork, fast input shortcuts, and an integrated AirPlay receiver. Built for the living room, with Italian and English throughout.

<p align="center"><a href="https://github.com/Xarber/MiTV-Home/releases/latest"><strong>Download APK</strong></a> · <a href="docs/INSTALL.md">Install & restore</a> · <a href="docs/BUILDING.md">Build it yourself</a> · <a href="https://github.com/Xarber/MiTV-Home/issues">Report an issue</a></p>

![MiTV Home dock](docs/assets/home.png)

## Your TV, arranged your way

- **Six customizable positions.** Apps, individual HDMI inputs, Live TV, and Sources can move around. All Apps is available in position six.
- **Three landing points.** Dock → Inputs & Live TV → apps with All Apps, System Apps, and Casting categories. Longer grids scroll normally; dock edges keep horizontal focus inside the dock.
- **Fullscreen banners.** App artwork takes priority; source banners use centered device logos. Translucent surfaces and strong library shading keep controls readable. Popups capture and blur the current screen when opened; their backdrop is discarded on dismissal.
- **Remote ergonomics.** Hold OK on an item for its menu. Hold Back for Control Center. A downward All Apps hint leads from Inputs to the app grid.
- **Compact status.** Time, date, and an expanding, single-line network bubble.
- **Integrated AirPlay.** The receiver starts with Home and can remain active in the background. Audio uses a compact activity bubble with a PCM-derived waveform and playback/volume controls; supported video and screen mirroring open fullscreen.
- **Phone remote.** Scan the QR in Control Center. A browser pairing request shows its code in a small notification at the upper left.

<p><img src="docs/assets/inputs.png" alt="Inputs and Live TV" width="49%"> <img src="docs/assets/apps.png" alt="App library" width="49%"></p>

## Compatibility

The physical reference device is a Xiaomi MiTV-MOOQ0 running Android 10. HDMI routing and the picture-settings shortcut are device-specific; other TVs may use their system input picker. Existing apps and TV services are preserved. This repository contains no debloat script.

Android 8/API 26 or newer is required. CI compiles native libraries for ARMv7, ARM64, and x86_64. Other TVs and Google TV devices need their own hardware validation.

AirPlay support comes from the integrated open-source receiver. Sender, codec, DRM, and network compatibility vary. This is not an Apple-certified product. Screen mirroring was tested on the reference TV; the latest audio bubble still needs an end-to-end sender check.

The phone remote runs while Home is foreground. It tries HTTP port 80 first. Stock Android can restrict privileged ports; on the reference TV the working fallback is **8765**. The QR always contains the actual address. Opening the QR panel does not show a pairing code; a client must request pairing.

## Install

Get the APK from [Releases](https://github.com/Xarber/MiTV-Home/releases/latest), install it, and select MiTV Home as your Home app. See [Install & restore](docs/INSTALL.md) for ADB and rollback steps. Keep the original launcher installed.

## Development channels

| Branch | Automatic build | GitHub Release assets |
| --- | --- | --- |
| `main` | Every push | Built and attached when a release targeting `main` is published |
| `beta` | Every push; downloadable Actions artifact | Never |
| `testing` | No workflow files | Never |

Stable APKs use the project's signing key, stored in Actions secrets. Local debug APKs use a different key, so Android will not accept a stable APK as an update to a debug installation. Preserve preferences before switching signing identities.

## Credits & license

MiTV Home is a modified distribution of [jqssun/android-airplay-server](https://github.com/jqssun/android-airplay-server), extended with the launcher, input customization, phone remote, and integrated audio controls by Xarber, October 2026. Upstream history and notices are retained.

The receiver includes [UxPlay](https://github.com/FDH2/UxPlay), [FFmpeg](https://ffmpeg.org/), [libplist](https://github.com/libimobiledevice/libplist), [OpenSSL](https://www.openssl.org/), and [Oboe](https://github.com/google/oboe). QR codes use [ZXing](https://github.com/zxing/zxing). See [third-party notices](docs/THIRD_PARTY.md) and [GPL-3.0](LICENSE).

Apple, AirPlay, Apple TV, Xbox, PlayStation, Nintendo Switch, Wii U, and other names/logos belong to their owners and identify devices or installed apps. This is an independent project.
