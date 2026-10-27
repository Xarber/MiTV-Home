# Status — 27 October 2026

Version 1.3 builds locally and passes Android lint without errors. Checked on the MiTV-MOOQ0/Android 10: dock boundaries, three scroll landing positions, Sources hold menu, app category switching, fresh popup blur, wrapped popup headings, and the remote QR code. The QR was decoded independently to the server URL. The small AirPlay circle and expanded controls were observed on the TV, with playback focused on opening. The six bars measure separate frequency bands from bass on the left to treble on the right. Source PCM is analyzed before playback gain, and the UI normalizes band levels with faster attack/release smoothing. Album artwork supplies the gradient when available. This is an independent implementation, not Apple’s proprietary processing.

The receiver’s ARMv7 and ARM64 libraries were rebuilt to include the waveform JNI method. The HTTP server attempts port 80; this stock TV rejects it with EACCES. The working fallback is 8765, included in the QR code.

CI validation is deliberately unfinished at the user’s request. Earlier setup failures involved an obsolete SDK package and an SDK manager missing from PATH. The workflow now locates the executable explicitly. The latest full native build and signed release pipeline still need confirmation. No stable public release has been published yet.

Next session: inspect current main/beta runs, resolve remaining build failures, verify the signed APK and checksum, then publish the stable release. `testing` intentionally has no workflow files. Keep the release key backup private and preserve the existing TV launcher preferences.


Version 1.2 validation: 60/200/600/1800/5000/12000 Hz tones selected bars 1–6 respectively; normalized responses remained stable at 1% amplitude. The QR browser contract passed automatic pairing and URL-fragment removal. On the physical TV the embedded QR code paired successfully, dismissed its panel, was rejected on reuse, and subsequent pairing requests showed a corner notification without invalidating the paired remote. Build and lint passed with zero lint errors. Artwork-dependent colors need a sender that supplies artwork; none was supplied during this validation. See APPLE_MUSIC.md for the likely macOS Music FairPlay limitation and the system-audio workaround.


Version 1.3: replaced instant peak normalization with a fixed decibel display range and headroom, keeping measurement before receiver gain so the listening-volume slider does not drive the visualization. Both indicators use two dominant cover colors when artwork is supplied, with a neutral fallback. Added the distinct FairPlay v2 response and matching phase-two header alongside v3. Host regressions and actual RTSP v2/v3 handshakes passed on the reference TV. Mac Music playback confirmation is pending. See APPLE_MUSIC.md and tests/native/README.md for scope and evidence.
