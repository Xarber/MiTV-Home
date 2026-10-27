# FairPlay compatibility regression

The fixtures are public protocol captures from `joerg-krause/shairplay`, branch `fairplay_v2`, commit `d5f0953d2380502366592e30a0a59fe3879f3c59`: `fply_2` and `fply_3` in `src/lib/fairplay_playfair.c`. No user session data is included.

The test compares complete v2 phase-one replies, preserves all v3 mode replies, checks version-matched phase-two replies, compares the existing key-decryption path using deterministic synthetic input, and rejects invalid mode/version/signature values. Synthetic key regression does not substitute for actual Mac Music playback validation.

```sh
clang -std=c11 -I app/src/main/cpp -I app/src/main/cpp/third_party/UxPlay/lib \
 tests/native/fairplay_compat_test.c app/src/main/cpp/third_party/UxPlay/lib/playfair/{playfair,omg_hax,hand_garble,modified_md5,sap_hash}.c \
 -o /tmp/mitv-fairplay-test
/tmp/mitv-fairplay-test tests/native/fixtures/fairplay-v2-reply.bin tests/native/fixtures/fairplay-v2-key-message.bin
```
