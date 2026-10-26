# Status — 26 October 2026

Version 1.1 builds locally and passes Android lint without errors. Checked on the MiTV-MOOQ0/Android 10: dock boundaries, three scroll landing positions, Sources hold menu, app category switching, fresh popup blur, wrapped popup headings, and the remote QR code. The QR was decoded independently to the server URL. The small AirPlay circle and expanded controls were observed on the TV, with playback focused on opening. The five bars use PCM-derived RMS levels over short windows, not frequency bands or Apple’s proprietary processing.

The receiver’s ARMv7 and ARM64 libraries were rebuilt to include the waveform JNI method. The HTTP server attempts port 80; this stock TV rejects it with EACCES. The working fallback is 8765, included in the QR code.

CI validation is deliberately unfinished at the user’s request. Earlier setup failures involved an obsolete SDK package and an SDK manager missing from PATH. The workflow now locates the executable explicitly. The latest full native build and signed release pipeline still need confirmation. No stable public release has been published yet.

Next session: inspect current main/beta runs, resolve remaining build failures, verify the signed APK and checksum, then publish the stable release. `testing` intentionally has no workflow files. Keep the release key backup private and preserve the existing TV launcher preferences.
