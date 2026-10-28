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
when performed. Physical pairing and concurrent iPhone streaming remain
pending; local test success does not establish either.

Host validation passed: Java lifecycle, hostile remote request, update policy
and pairing lifetime checks; release/license consistency; all 27 Python tests
including the two real-library tests. `git diff --check` passed.
