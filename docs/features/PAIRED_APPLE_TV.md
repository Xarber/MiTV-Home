# Paired Apple TV — implementation in progress

The requested integration runs inside the Android TV APK, with no PC bridge.
Bonjour only discovers devices. Playback observation requires authenticated Apple
TV remote-control protocols, including MRP tunneled through AirPlay on modern tvOS.
Metadata and artwork depend on the playing application; discovery does not reveal them.

## Compatibility preflight

The existing MiTV is Android 10 / ARMv7. Chaquopy 17.2 supports the project's AGP
9.4 and Python 3.11 preserves all four Android ABIs. Python 3.12+ cannot replace it
because those Android runtimes drop ARMv7 and x86. Minimum Android API remains 26.

Before changing the shipping APK, a manually requested Actions matrix builds the
native dependencies required by pyatv 0.18.0: cryptography 50.0.2, cffi 2.0.0 and
pydantic-core 2.50.1. No downgrade of pyatv's encryption requirements is permitted.
The cross builder and CPython target are pinned; output records wheel hashes and
provenance. This preflight does not publish a release or install on the TV.

The pydantic-core build supplies an explicit CPython 3.11 PyO3 cross configuration;
it does not pretend that pydantic-core supports Python's limited ABI.

## Remaining acceptance criteria

- Native imports and encryption self-tests on the physical ARMv7 television.
- User-selected discovery and PIN pairing with encrypted, revocable local credentials.
- Real playback state, optional artwork and supported transport controls.
- Existing music activity UI, with explicitly animated bars for the remote device.
- Local AirPlay reception retains priority and its measured waveform.
- No credentials in backups, logs or screenshots; no automatic pairing.
- Test lifecycle, disconnects, reconnect backoff and the user's actual tvOS version.

The adapter and UI are implemented on the development branch; until those checks pass the feature is not device-validated or released.

Primary references: [pyatv protocols](https://pyatv.dev/documentation/protocols/),
[pyatv features](https://pyatv.dev/documentation/supported_features/),
[Chaquopy Android](https://chaquo.com/chaquopy/doc/current/android.html),
[Chaquopy cross builder](https://github.com/chaquo/chaquopy/blob/6e365e30f7199468d9fffe628fe9f0a7658fdbb3/server/pypi/README-old.md).

## Adapter implementation (not yet device-validated)

`paired_apple_tv.py` owns one asyncio protocol loop. Only explicit scan and pairing
operations discover/select devices; the paired device reconnects while Home is
foreground. pyatv's AirPlay pairing creates the credentials used for its MRP tunnel.
Transport commands are gated by actual reported feature availability. No system
volume fallback is substituted for an unsupported Apple TV volume API.

`PairedPlayback` owns the worker, bounded requests, multicast lock and reconnect
backoff. `PairingStore` encrypts the selected identity and credentials with Android
Keystore AES/GCM, authenticated with the application identifier. Its AtomicFile is
inside `noBackupFilesDir`; portable Home exports contain no remote credentials.
Unreadable credentials are retained for explicit removal, not silently replaced.

`PairedPlaybackPanels` uses existing bounded settings popups, localized PIN input
and a three-minute pending PIN-entry window. Completed pairing credentials have no
application expiry timer. Removing a pairing deletes the app's credential;
it does not remotely revoke other Apple TV clients or reset the device.

The launcher reuses its existing music chip and expanded control panel. Local
receiver audio has priority. External snapshots expose source-supplied title,
artist, optional artwork, transport availability, position/duration and observation
time. Absent fields remain absent in the protocol contract. Artwork is bounded by
bytes and dimensions before decoding. Stale snapshots do not keep activities alive.
Remote waveform bars are a deterministic playback animation with an accessibility
label; local audio retains its actual PCM bands. Reduced-motion keeps remote bars
still. Popups close on a source change so an old control cannot target a new source.

Pausing Home disconnects observation and releases multicast, except that an explicit
pending pairing remains alive until its original three-minute deadline; no always-on PC,
external account, server upload or new Android permission is used. Python initializes
only after discovery or a saved pairing reconnect. Network errors return redacted
error codes. Protocol debug logging is disabled. The application-scoped controller survives Home
activity recreation; background polling is canceled. Process termination discards
only unfinished protocol state, so a pending attempt must then be restarted.


## Pairing on the same television

Choose **HDMI input** in paired-device settings. There is deliberately no default.
The chooser enumerates Android's registered physical HDMI inputs, including ports
beyond the launcher's legacy three-port presentation when the platform exposes them.
Existing customized source labels are reused where available; other inputs use
system/custom labels. The stable input ID is saved in `paired_device_ui` preferences.
If that input disappears, a new explicit choice is required; no other port is selected.

Start pairing, then choose **Show pairing code**. If no input was selected, first
choose one. The launcher switches using its existing input-opening path. Note the
code displayed by Apple TV and press Home. The PIN-entry popup is restored, including
after Home activity recreation, without extending the original deadline. The PIN
itself is never retained. The HDMI choice can be changed in Settings or the PIN popup.

The controller owns monotonic expiry and protocol cleanup even while HDMI is shown.
An old attempt's timer cannot cancel a replacement attempt or a completed pairing.
If the operating system kills the entire app process, restart the unfinished pairing;
completed encrypted credentials and the chosen input remain in app storage.

## tvOS 27 PIN display compatibility

Pinned pyatv 0.18.0 omits `X-Apple-Client-Name` during HAP pair setup. The tvOS 27
no-code report and focused upstream PR document that a receiver can generate a
passcode but suppress its UI without this early header. We rebuild the exact PyPI
source with the three-file fix from upstream PR 2894, commit
`fa9ef01dce9928e6be959b7f9b67d14a0c722b06`. The patch, source checksum and wheel
checksum are recorded; Gradle installs this explicit wheel, not an arbitrary fork.
MIT notices are retained. Headers are copied per pairing, so names do not leak
between attempts or into verification/transient/legacy authentication paths.
This fix targets code display, not separate post-PIN or playback errors.

## Excluding software receivers

Discovery and saved-device reconnect reject addresses belonging to this Android
host, `mitvhome=receiver-v1` or `preview-v1` advertisements, and the exact shared
legacy UxPlay fingerprint (`AppleTV3,2` plus UxPlay's fixed generic `pi` value).
The receiver advertises its marker in Kotlin's existing NSD registration path;
its Apple-compatible model and native C/C++ libraries remain unchanged. This also
covers future preview instances. Older previews are recognized by the legacy
fingerprint. Names are never used for filtering, and genuine old Apple TVs are not
excluded merely because their model matches the software receiver's model.
These are compatibility filters, not cryptographic identity proof; real control
still requires explicit selection and authenticated pairing.
