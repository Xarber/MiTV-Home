# Local connectivity, backup and provenance

MiTV Home does not have a cloud synchronization engine or shared user-history database. The existing direct LAN AirPlay receiver and foreground HTTP remote avoid centralized content storage. Device discovery/session handling belong to the Kotlin/native receiver; phone pairing and ephemeral presence belong to HomeRemoteServer.

Presentation backup uses Android's document provider and schema-1 JSON. HomePreferences exports only dock/input profile/language/activity appearance; imports are validated and confirmed, with a previous-state snapshot available for recovery. No automatic merge, background synchronization, resumable transfer or peer migration protocol is claimed. Conflicting configurations are explicitly replaced after confirmation rather than silently merged.

## Data provenance

- Six waveform bars are **calculated** from native PCM band-pass measurements before output gain, then converted to decibels and smoothed for display. They are decorative signal levels, not calibrated loudness/spectral measurements or Apple's proprietary algorithm. No invented time series or music statistics is stored.
- Title/artwork/track duration are **sender-supplied** metadata. Missing artwork uses a generic icon/neutral palette; unknown duration hides the timeline rather than claiming a measured duration of zero. Existing app artwork may be cached for rendering, not asserted to be a fresh sensor reading.
- Network transport, permission and binding/listener state in diagnostics are **current local observations** sampled on report creation. The UTC snapshot uses the device clock; event ordering uses monotonic milliseconds. Binding is not proof of media playback or network reachability.
- Authenticated remote presence is a **recent observation** that expires after 15 seconds. It does not prove continuous connectivity after the last heartbeat.
- Developer notification preview is **simulated**, local UI only, with no external device command and no production preference/history/analytics write. Its enum diagnostic event is labeled simulated-local-ui and the bounded process ring disappears on termination.

No achievements, model calibration, training or production analytics consume simulated UI state. Additional measurements/synchronization would need explicit source/freshness/units and isolation contracts; this document does not imply those features already exist.
