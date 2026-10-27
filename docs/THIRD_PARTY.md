# Third-party notices

This is a GPL-3.0 modification of jqssun/android-airplay-server. Original source, copyright notices, and history are retained. Launcher integration and UI changes were made in October 2026.

| Component | Source | License |
| --- | --- | --- |
| Android AirPlay Server | https://github.com/jqssun/android-airplay-server | GPL-3.0 |
| UxPlay | https://github.com/FDH2/UxPlay | GPL-3.0; embedded component notices apply |
| FFmpeg | https://github.com/FFmpeg/FFmpeg | LGPL/GPL as configured; pinned source notices apply |
| libplist | https://github.com/libimobiledevice/libplist | LGPL-2.1 |
| OpenSSL 3.x | https://github.com/openssl/openssl | Apache-2.0 |
| openssl-cmake | https://github.com/viaduck/openssl-cmake | See submodule license |
| Oboe | https://github.com/google/oboe | Apache-2.0 |
| ZXing | https://github.com/zxing/zxing | Apache-2.0 |
| AndroidX / Media3 | https://android.googlesource.com/platform/frameworks/support/ | Apache-2.0 and component notices |

The original receiver documentation also credits Next Player for video-player work. Dependency notices remain in their source repositories and packaged metadata. Product logos identify third-party devices/apps and remain their owners' trademarks.


FairPlay v2 compatibility uses the public phase-one protocol capture in `joerg-krause/shairplay` (`fairplay_v2`, commit `d5f0953d2380502366592e30a0a59fe3879f3c59`) and follows the phase-two version handling documented by `mazer666/PhairPlay` (Apache-2.0, with its own third-party notices). The pinned UxPlay FairPlay/key-decryption source and its LGPL notices are retained unchanged and included by the compatibility wrapper. The small wrapper is distributed under this project's GPL-3.0 license.
