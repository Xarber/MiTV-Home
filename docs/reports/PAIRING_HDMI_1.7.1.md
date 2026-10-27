# Same-TV pairing and configurable HDMI — 28 October 2026

## Scope and root cause

In v1.7.0, Home's pause path called the protocol disconnect operation, which also
closed an unfinished PIN pairing. Home reset dismissed its PIN popup. A user could
therefore not switch the same television to Apple TV's HDMI to read its code.
The old UI's three-minute wording also failed to distinguish pending code entry
from the saved, encrypted pairing.

## Implemented

- Pending PIN entry is process-local and expires after three monotonic minutes.
  Successful saved credentials have no application expiry timer.
- The controller owns cleanup independently of a popup and survives Home activity
  recreation. Background playback polling stops; only explicitly pending pairing
  is retained during an input switch.
- Home resume/reset restores pending PIN entry without restarting its deadline.
- Paired-device settings and the PIN popup allow HDMI selection. No default port.
- All registered physical HDMI inputs are enumerated; no restriction to ports 1–3
  or to this user's MiTV/Apple TV wiring. Missing saved inputs require a new choice.
- Show pairing code switches to the chosen input using existing input routing;
  press Home after reading the code to return. Selected input ID is remembered.
- English/Italian copy, missing-input state, existing bounded popup layout.
- Process death loses unfinished pairing state, requiring a new attempt; completed
  encrypted credentials and the selected input remain stored. PINs are not saved.

## Verification

Passed existing host regression tests, new pairing-deadline/stale-timer checks,
eight isolated Python tests including teardown of prior observation before pairing,
workflow static validation and diff checks. Gradle configuration (`help`) passed
with the installed SDK. The actual installed SDK exposes both label APIs used by
the chooser. No additional SDK, emulator or local toolchain was installed.

These checks do not establish Android UI or physical pairing success. The new
APK/AAB build and same-TV HDMI → Home → PIN round trip still require validation.
The physical TV remains on v1.7.0 until a new verified artifact is installed.
