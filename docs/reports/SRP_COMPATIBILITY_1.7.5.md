# SRP compatibility fix — 1.7.5

## Scope and evidence

Inspected pairing diagnostics, pyatv HAP SRP, resolved srptools 2.0.0, wheel
patching, dependency pins and the portable-wheel CI test job. No UI, receiver
media engine, signing identity or stored pairing changes.

Physical 1.7.4 logs recorded successful HTTP 200 PIN-start/M1, followed by
PairingError caused by TypeError at hap_srp.py:147 when submitting the PIN.
No M3 request was recorded. A local environment using the same library
versions reproduced: SRPClientSession received three positional arguments,
while its new constructor accepts only two.

## Correction and tests

A one-line vendor patch passes private= explicitly. srptools is pinned to
2.0.0; cryptography remains 50.0.2. Both real-library regression tests failed
before the patch and passed afterwards: successful proof/key agreement and
encrypted setup payload, plus incorrect-PIN rejection. CI now runs these
tests against the actual patched wheel, in addition to header checks.

Build, host checks and physical installation results are recorded below
when performed. Physical pairing was subsequently confirmed by the user;
concurrent iPhone streaming remains unverified.

Host validation passed: Java lifecycle, hostile remote request, update policy
and pairing lifetime checks; release/license consistency; all 27 Python tests
including the two real-library tests. `git diff --check` passed.

## Local build

Release APK and Android lint passed in 52 seconds using existing tools. This
ARMv7/ARM64 build reuses unchanged app-owned native libraries from the
previous verified APK; it is not a newly compiled universal native build.
No AAB or public release was produced in this batch.

Artifact source: `1a9afd9ec3f2a60bda9dcbd6b3c3ffd1c8cea019`, version 1.7.5/code23,
testing channel. SHA-256:
`e515f64e3351ff638425983aacf39d2e1579aff1c6c599a8f9c3b4471cb050b8`.
Android 10 signature verification passed with the existing release key.
The previous installed APK was preserved privately before replacement.

## Physical TV deployment

Supported replacement installation succeeded without uninstalling or clearing
app data. Package Manager reports code 23; SHA-256 of the installed APK
matches the verified artifact. Cold launch returned Status ok (1.839 s),
and MiTV Home remains the default Home activity. The user retried pairing
and reported “It works!” on 2026-10-28, then authorized release promotion.
This is user-reported physical pairing success, not an automated playback
or simultaneous-phone-streaming test. No PIN was collected or logged.
