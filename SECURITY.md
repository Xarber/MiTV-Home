# Security policy

Report a vulnerability privately through GitHub's private vulnerability reporting for this repository. If unavailable, open an issue asking for a private reporting channel without including exploit details, credentials or private captures. Do not post pairing codes, tokens, screenshots of QR codes, signing files, sender identifiers or raw media/network logs.

The maintained channel is main; beta is preview. Updates preserve signing identity. This app does not root/debloat devices, bypass DRM or guarantee every AirPlay sender. Mac Music playback remains a documented compatibility limitation.

The phone remote is authorized by a short-lived displayed PIN/QR, restricts requests to the local network, checks Host/Origin and bounds input, but runs over HTTP. Use a trusted LAN and do not forward its port to the Internet. Pairing does not encrypt transport. Tokens are process/foreground-session scoped; background Home or revoke them in Developer options to disconnect clients. For a lost remote/browser session, revocation is preferable to deleting app data.

Diagnostics use an allowlisted event model and exclude secrets/media/network identity. Keep native protocol logging at error level; never distribute verbose handshake captures. Review upstream native advisories and pinned submodule updates before promoting releases.
