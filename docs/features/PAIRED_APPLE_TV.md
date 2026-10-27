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

Until those checks pass this is build infrastructure, not an implemented feature.

Primary references: [pyatv protocols](https://pyatv.dev/documentation/protocols/),
[pyatv features](https://pyatv.dev/documentation/supported_features/),
[Chaquopy Android](https://chaquo.com/chaquopy/doc/current/android.html),
[Chaquopy cross builder](https://github.com/chaquo/chaquopy/blob/6e365e30f7199468d9fffe628fe9f0a7658fdbb3/server/pypi/README-old.md).
