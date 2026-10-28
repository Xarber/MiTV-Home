# Persistent paired-client diagnostics — 28 October 2026

## Evidence before changes

At the user's request, captured Android logcat from the physical TV before the
1.7.3 installation and retained it privately. No pairing-specific exception or HTTP
status was present. Release-build `run-as` was correctly unavailable; no app-owned
external diagnostic files existed. Inspected the developer report: it records
lifecycle events, while the existing persisted receiver logs belong to a different
receiver path. The paired Apple TV client disabled Python logging and discarded
exception detail. Therefore previous failures could not be recovered from those
logs. No device pairing failure cause was inferred from their absence.

Installed the exact successful GitHub v1.7.3 artifact after verifying checksum,
version/code/source commit and the existing Android 10 release signing identity.
Android installation reported Success and package listing confirmed code 21. The
user immediately reproduced the generic failure on this installed version. No
HTTP 470 or incorrect PIN has been established.

## Implemented

A bounded persistent paired-client recorder, mirrored to logcat and included in the
existing developer details/copy/export, captures safe HTTP/HAP stages, outcomes,
class chains and source locations. Raw messages and protocol secrets stay excluded.
The file path supports authorized ADB retrieval on non-debuggable release builds.
Old protocol failures remain unrecoverable; this fixes future observation.

## Validation so far

25 Python tests and existing Java host checks passed, including phase/status
capture, payload/header redaction, ignoring arbitrary logs/URLs, safe error trace
locations, bounded rotation and persistence across recorder recreation. Tests use
fake protocol data; they do not establish a physical authentication result.
The next local Android build, installed-log retrieval and actual pairing failure
capture remain pending at report creation.

## Local build and physical verification

Local release compilation and lint passed in 1m43s with the existing Android SDK,
Python 3.11 and verified prebuilt app-owned/native Python ARM32/ARM64 libraries.
This is not a fresh C/C++ source build or a four-ABI universal build. Source commit
`323d2eb`, version 1.7.4 / code 22, was signed with the existing release identity.
Verified package/version/commit, non-debuggable mode and Android 10 signing before
installing in place. Installation reported Success; package listing confirmed code
22, cold launch completed and installed bytes matched the local verified APK.
Previous working GitHub v1.7.3 APK and private backups remain available.

A harmless real discovery scan initialized the recorder. The first collection,
before client startup completed, truthfully reported no file. A second collection
successfully retrieved the persistent JSONL and matching safe logcat records from
the stock release build. The file contained scan start/success records. This proves
that future error records can be read without another diagnostic build, not that
an authenticated pairing or specific failure has been captured yet.

Added `scripts/collect_tv_diagnostics.py` to retrieve existing release logs safely,
and repository agent guidance requiring log collection before speculative fixes.
The user was asked to reproduce once so the actual immediate failure could be read.
No PIN or credentials were requested or printed.
