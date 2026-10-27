# Security architecture and scope

The maintained disclosure policy is [SECURITY.md](../SECURITY.md). This document describes inspected boundaries, not a claim that the entire receiver has been audited.

The launcher/HTTP remote uses app-private presentation preferences and foreground-scoped random pairing tokens. RemoteRequest bounds HTTP framing, requires the local Host/matching Origin, limits JSON sizes and rejects malformed requests. Commands are allowlisted; PINs expire/rotate and attempts are throttled. Native receiver/service security is a distinct upstream integration and requires ongoing targeted review.

HTTP transport is unencrypted: pairing is not TLS. Use the existing trusted-LAN-only deployment. Adding HTTPS certificates or another public endpoint would be a separate reviewed change. No firewall/router/privileged-port changes are made.

Diagnostics copy/export accepts a bounded enum event history and generic Android observations, excluding PIN/token/SSID/address/media/identity. A snapshot has local UTC and event timestamps use monotonic elapsed time; neither is an externally verified time source. Simulation events are explicitly tagged. Developer access is in memory, expires after inactivity and locks on navigation/backgrounding; phone commands refresh it only after server authentication.

Imports validate a bounded presentation-only schema before confirmation and save a prior snapshot. Receiver credentials, tokens and media history are excluded. Token revocation warns visibly that phone remotes disconnect. Existing signing identity is retained and secrets never enter source archives.

Release artifacts require parallel package validation and checksums; branch promotions use PRs. Publication and installation are separate: preserve an installed working APK/preferences, verify the actual new version and essential service behavior after an authorized device install, and roll back safely if critical checks fail. Do not uninstall to bypass a signing mismatch or clear app data without authorization.
