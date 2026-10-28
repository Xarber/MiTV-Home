# Third-party notices

Original Xarber launcher modules are AGPL-3.0-only. The integrated jqssun/android-airplay-server remains GPL-3.0; original and component notices are retained. Original source, copyright notices, and history are retained. Launcher integration and UI changes were made in October 2026.

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


FairPlay v2 compatibility uses the public phase-one protocol capture in `joerg-krause/shairplay` (`fairplay_v2`, commit `d5f0953d2380502366592e30a0a59fe3879f3c59`) and follows the phase-two version handling documented by `mazer666/PhairPlay` (Apache-2.0, with its own third-party notices). The pinned UxPlay FairPlay/key-decryption source and its LGPL notices are retained unchanged and included by the compatibility wrapper. The small wrapper is distributed under its existing GPL-3.0-or-later license.

See LICENSE for original launcher contributions and LICENSES/GPL-3.0.txt for the upstream receiver. New AGPL modules combine with upstream under GPLv3/AGPLv3 section 13; this does not relicense third-party code. The remote page links to corresponding source and releases include pinned recursive source/build inputs.

The in-development external Apple TV client uses pyatv 0.18.0 (MIT) and Chaquopy
17.2.0 (MIT); full notices are packaged under `assets/licenses`. Python/CPython
retains PSF terms, cryptography its Apache/BSD terms, pydantic its MIT terms,
cffi its MIT terms, and zeroconf LGPL-2.1-or-later. Wheels retain component metadata
and notices. Upstream-supported pure-Python builds avoid optional C extensions for
HTTP/discovery helpers; native encryption and validation libraries are cross-built
for Android. No unlicensed Go implementation was copied. The application remains
AGPL-3.0-only for original contributions.

pyatv 0.18.0 is locally patched for tvOS 27 PIN display using the three-file MIT
change from https://github.com/postlund/pyatv/pull/2894 at
`fa9ef01dce9928e6be959b7f9b67d14a0c722b06`. The patch is included under
`scripts/apple_tv/patches`; it preserves upstream licensing and is not an upgrade
to an unpinned fork. Build metadata records both original source and patched-wheel
hashes. Header-boundary tests exercise the actual patched wheel.

## Expo preview branch

The companion uses Expo, React/React DOM, React Native/Web, Reanimated/Worklets,
react-native-svg and Expo Linear Gradient under their MIT licenses. Development
tools retain their packaged licenses (including Playwright's Apache-2.0 terms).
The npm lockfile records resolved versions. Original demo icons, SVG wallpapers
and cover-art drawings are AGPL project contributions; no external album covers,
fonts or stock photographs are fetched by the demo.

The loopback system-remote bridge uses androidtvremote2 0.3.2 (Apache-2.0), aiofiles 25.1.0 (Apache-2.0), and the existing pinned cryptography/protobuf runtime. Expo companion dependencies retain their upstream notices in the npm lockfile. Original Aurea SVG artwork is AGPL-3.0-only.
