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

## Physical installation — 28 October 2026

Workflow 40601216815 completed the AAB first; its matching universal APK completed
while preparing installation. Installed that official APK directly, without bundle
conversion, using an in-place update. Verified SHA-256, embedded version 1.7.1 /
code 19 / commit `8a2f896`, ARMv7 support and the existing release signing identity
with Android 10 verification. Android reported Success; package listing confirmed
code 19, and the installed APK's on-device hash matched the verified artifact.
Default Home remained MiTV Home. Cold launch completed successfully.

Fresh physical screenshots showed the new HDMI setting initially requesting an
explicit choice. A later screenshot showed the pending PIN-entry screen with a
chosen HDMI input, the revised expiry explanation and both Show pairing code and
Change HDMI input actions. No PIN was captured or published. Stopped automated
navigation at that point to avoid interfering with the user's pairing interaction.
Authenticated completion and the full HDMI/Home round trip are not claimed tested.

The TV had already disabled system service dumps before installation, and a fresh
UIAutomator capture exited 137. Used direct package-manager queries, installed-byte
verification and fresh screenshots instead; no restart, data clearing or factory
reset was performed. Those diagnostic limitations do not invalidate the verified
package installation, but full system-dump/UIAutomator coverage was unavailable.

Removed 111 MiB of redundant old temporary APK copies and 113 MiB of unused bundle
and conversion-tool downloads. Retained the verified v1.7.1 APK, working v1.7.0
rollback APK and private prior backups/signing credentials. No user data was removed.
