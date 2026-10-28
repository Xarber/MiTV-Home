# Status — 27 October 2026

The 1.5.0 beta pipeline passed signed universal APK, AAB, source packaging and publication (run 40496251252). The 1.5.1 batch adds icon-led progressive disclosure and explicit diagnostics/simulation provenance. See the [revised report](reports/REVISED_STANDARDS_1.5.1.md) for checks and missing device evidence.

The user's accepted activity/remote behavior is preserved. iPad radio and local library playback were reported working; direct Mac Music remains unresolved and deferred. Experimental v2 handshake tests do not prove complete AirPlay 2 support. HTTP remote uses 8765 when stock Android denies port 80.

Full source-built four-ABI APK/AAB CI and release status must be read from the current workflow. A local ARM simulator build does not substitute for native/hardware validation. Promote testing → beta → main only through pull requests and report queued/running/published states separately.
