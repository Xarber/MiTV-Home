# Decision 0001: licensing and platform scope

Date: 2026-10-27. Accepted for the standards update.

Original Xarber launcher modules use AGPL-3.0-only with SPDX/copyright notices. The root LICENSE contains complete AGPLv3; LICENSES/GPL-3.0.txt retains the original receiver license. Upstream components retain their own GPL/LGPL/Apache and embedded notices; do not replace their headers or claim ownership. GPLv3 section 13 permits combination with AGPLv3 and applies the network source requirement to the combination. References: https://www.gnu.org/licenses/gpl-3.0.html#section13 and https://www.gnu.org/licenses/agpl-3.0.html#section13.

The LAN remote includes an obvious corresponding-source link and release binaries include pinned source/build inputs. FFmpeg is configured minimally without nonfree/proprietary codecs; pinned upstream licenses and build flags remain authoritative. Trademarks/device logos identify installed apps/sources and do not imply endorsement or a grant of trademark rights. System fonts add no bundled font dependency.

Platform scope remains Android TV because Android HOME, TV Input Framework and native receiver are essential. Android packages are applicable; iOS unsigned/simulator jobs and AltSources are not. A distinct Apple platform app would require a reviewed architecture and purpose; it is not fabricated for a nominal four-job matrix.
