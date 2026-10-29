# Security architecture and scope

The maintained disclosure policy is [SECURITY.md](../SECURITY.md). This document describes inspected boundaries, not a claim that the entire receiver has been audited.

The launcher/HTTP remote uses app-private presentation preferences and foreground-scoped random pairing tokens. RemoteRequest bounds HTTP framing, requires the local Host/matching Origin, limits JSON sizes and rejects malformed requests. Commands are allowlisted; PINs expire/rotate and attempts are throttled. Native receiver/service security is a distinct upstream integration and requires ongoing targeted review.

HTTP transport is unencrypted: pairing is not TLS. Use the existing trusted-LAN-only deployment. Adding HTTPS certificates or another public endpoint would be a separate reviewed change. No firewall/router/privileged-port changes are made.

Diagnostics copy/export accepts a bounded enum event history and generic Android observations, excluding PIN/token/SSID/address/media/identity. A snapshot has local UTC and event timestamps use monotonic elapsed time; neither is an externally verified time source. Simulation events are explicitly tagged. Developer access is in memory, expires after inactivity and locks on navigation/backgrounding; phone commands refresh it only after server authentication.

Imports validate a bounded presentation-only schema before confirmation and save a prior snapshot. Receiver credentials, tokens and media history are excluded. Token revocation warns visibly that phone remotes disconnect. Existing signing identity is retained and secrets never enter source archives.

Release artifacts require parallel package validation and checksums; branch promotions use PRs. Publication and installation are separate: preserve an installed working APK/preferences, verify the actual new version and essential service behavior after an authorized device install, and roll back safely if critical checks fail. Do not uninstall to bypass a signing mismatch or clear app data without authorization.

In-app updates request Android installation permission only for the explicit update action; checksum, package/build/variant/SDK/ABI and installed signer are checked before PackageInstaller. Public GitHub metadata contains no credentials; download completion can only verify bytes, never initiate installation. Callback receivers are explicit/non-exported or act only on the app-owned download id. See features/UPDATES.md for remaining OS/notification/signing limitations.

## Paired Apple TV client (in development)

Remote-client credentials use device-bound Android Keystore AES/GCM and an atomic
file in noBackupFilesDir. They are excluded from Home exports, diagnostics, logs and
release metadata. Pairing requires explicit device selection and its on-screen PIN.
No private Apple keys or DRM decryption bypass is introduced. Protocol commands
require feature availability; no untrusted remote code is executed. Discovery uses
the existing local-network/multicast permissions, with Home-scoped connection and
backoff. Native dependency import and real tvOS interoperability remain validation
requirements; research or compilation is not pairing proof.

Paired-playback diagnostics store only fixed endpoint paths, phases, statuses,
timing and safe exception locations in two rotating app-owned files (256 KiB
combined) and the `MiTVPairing` logcat tag. No exception messages, locals, packet
payloads/headers, PINs, credentials, addresses, device names or artwork are recorded.
The safe handler does not format arbitrary upstream debug records. Release builds
can expose these sanitized diagnostics through authorized ADB without enabling
root/debuggable mode or opening a remote shell service in the app.

## Phone companion and PWA

The remote now uses an app-owned connected-device foreground service, encrypted
persistent phone trust, per-origin browser tokens and explicit system-service
pairing on loopback. The HTTP transport still requires trusted Wi-Fi; a random
stable device ID detects IP reuse but is not a TLS server identity. Phone storage
uses SecureStore or an encrypted origin-scoped web vault. Offline/PWA caching is
static-only, never pairing/API responses or command queues. See
[phone security and limitations](features/PHONE_REMOTE.md) and [PWA](features/PWA.md).

## Expo host boundary

The native bridge is trusted in-process code, not an exported network command
surface. Its operations are allowlisted and bounded. Incoming HTTP clients still
use the existing authenticated remote API, source/capability checks and origin
policy. Browser preview fixtures cannot call the TV module. The separate preview
does not advertise a competing receiver or start the production remote listener.

Wi-Fi SSID access follows Android's permission and location-service restrictions.
The settings action requests the OS permission interactively; neither build scripts
nor the application silently grant it. UI navigation logs record only fixed
movement/group names, not app labels, pairing codes, SSIDs or media metadata.

## Phone microphone

Recording requires explicit phone OS consent and a visible Listening indicator.
No audio files or payload logs; voice session keys remain in memory. AES-GCM audio
packets bind the authenticated token owner, session and sequence, with ephemeral
RSA key wrapping. Existing HTTP initial pairing/public-key delivery still assumes
a trusted LAN and does not provide TLS identity protection against active attacks.
Capture stops on backgrounding, TV changes and timeout; server idle expiry bounds
cleanup after network loss. Details: [phone voice](features/PHONE_VOICE.md).

The Remote v2 native TLS adapter restricts endpoints to this TV's own interfaces
and pairing/control ports. Its random abstract Unix IPC socket additionally checks
Android peer UID. It adds no public relay, debug permission, accessibility grant,
ADB client or key rotation. The self-signed service-certificate exchange follows
the existing upstream protocol trust model. See
[system transport](features/SYSTEM_REMOTE_TRANSPORT.md) for limits and cancellation.
