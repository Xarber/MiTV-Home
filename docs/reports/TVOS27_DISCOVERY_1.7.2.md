# tvOS 27 PIN display and receiver exclusion — 28 October 2026

## Scope and evidence

The installed pyatv 0.18.0 HAP pairing implementation does not send
`X-Apple-Client-Name` before requesting a PIN. Upstream issue 2866 and PR 2894
report that tvOS 27 can generate a passcode while suppressing its UI without this
header. The user's missing-code symptom matches that report; actual code display
on this physical Apple TV still requires a new installed build and test.

https://github.com/postlund/pyatv/pull/2894

Rebuilt pinned pyatv source with the three-file upstream change, preserving MIT
notices. The patch uses per-attempt header copies on all four HAP pairing requests,
without changing legacy verification or transient authentication. Gradle explicitly
selects the patched wheel. Build output records source/patch/wheel hashes.

Discovery and reconnect now exclude local Android interface addresses, marked
MiTV Home/preview receivers and the exact shared legacy UxPlay simulated identity.
The existing Kotlin NSD registration adds a marker without changing Apple's model
compatibility field or C/C++ behavior. Filtering does not depend on friendly names
or reject all devices with an older Apple TV model.

## Passed checks

- Patched wheel built locally from checksum-verified pyatv 0.18.0 source.
- Sixteen local Python tests: actual patched HAP code sends the client name on all
  four requests; separate attempts do not modify global headers; name propagation
  is present before PIN request; local/marked/legacy software receivers are rejected;
  real old/new Apple TVs remain eligible. Existing adapter and wheel integrity
  regression checks also pass. Header tests use a fake receiver and fake SRP inputs,
  not real-device cryptographic authentication.
- Existing Java host checks and workflow static validation pass.
- Reused ARMv7/ARM64 native Python wheels verified against successful CI provenance.
- Unchanged app-owned native libraries extracted from checksum-verified v1.7.1 APK.

## Local build attempt

The user explicitly requested a local build. Used the existing Android SDK and
Gradle, plus a checksum-verified temporary Python 3.11.18 runtime needed by the
ARMv7-compatible Android Python runtime. No Android SDK/emulator was installed.
Release compilation with lint began, then failed with `No space left on device`
after 22 seconds during generated artifacts/transforms. This was not a successful
APK build and does not establish that all compilation stages pass.

Removed 115 MiB of superseded own local APK outputs and 114 MiB of the redundant
v1.7.0 download, retaining the current working v1.7.1 APK, private preference backups
and signing proof/credentials. Remaining disk space is still below the safe build
margin. Asked the user to free approximately 2 GB or choose the remote-build fallback.
No unrelated user files, dependencies, signing keys or production data were removed.

## Deployment status

v1.7.2 is committed development work. It is not built, released or installed yet.
The TV retains v1.7.1. Physical PIN display, authenticated pairing/playback and the
updated discovery list remain unverified. Do not present the upstream report or
fake-receiver tests as physical-TV proof.

The existing authorized GitHub pipeline was also submitted after the storage
blocker, reusing successful native dependencies. This does not complete the user's
local-build request. Remote run for commit `dbc5b4d`:
https://github.com/Xarber/MiTV-Home/actions/runs/40604486783

No build success or installation is claimed for that in-progress run.
