# Android TV compatibility

Supported runtime baseline is Android 8/API 26; target API remains 34. CI compiles against installed platform 37.0. Stock MiTV-MOOQ0 Android 10 is the physical reference; StudioTV ARM64 is a UI preview.

Universal source builds target ARMv7, ARM64, x86 and x86_64. Bundled UI previews contain ARM only. Vendor HDMI and Live TV require registered inputs and resolver intents; use the existing input picker fallback on unsupported hardware. No emulator can validate physical HDMI/eARC/CEC.

Background AirPlay uses an Android foreground service, subject to platform/vendor restrictions. Phone HTTP remote is intentionally Home-only. Rootless Android may prohibit port 80; fallback is 8765 and QR reflects it. Do not alter system privileged-port policy or disable TV services to bypass this.

No iOS/tvOS implementation exists. HOME replacement, Android TV Input Framework and the Android media/JNI engine cannot be packaged into valid Apple artifacts. Adding an Apple client is a separate platform project, not an additional CI flag.
