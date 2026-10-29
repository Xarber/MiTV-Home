# System remote transport and handset (2.0.7)

## Two command scopes

The authenticated browser/phone connection terminates at HomeRemoteServer on the
TV. While Aurea Home is foreground, navigation uses its existing local UI adapter.
Outside Home, the TV service uses the separately paired Android TV Remote v2
control connection. Pairing runs on TCP 6467; persistent control runs on TCP 6466.
The browser cannot itself open raw TLS/protobuf sockets. Home, local volume/mute
and existing foreground restoration retain their previous capability fallbacks.
No ADB, accessibility service, privileged input injection or always-on PC was added.

The NineWorlds/google-tv-remote reference uses historical Anymote; it is useful as
a UI reference, not a protocol replacement for current Android TV Remote Service.
The pinned androidtvremote2 0.3.2 implementation follows the modern Remote v2
pairing, Configure/SetActive/RemoteStart exchange, protobuf framing, ping response,
key constants, voice and reconnect behavior. Those implementations are preserved.

## Android-native TLS

Physical 2.0.6 logs show ConnectionResetError during the Python SSL handshake,
before button dispatch. Re-pairing acknowledged trust but did not establish the
control connection. The user confirms ATV Remote controls third-party apps on
the same TV. This establishes an Aurea-side connection failure, not a general
absence of the TV service. It does not alone establish the exact TLS defect.

`SystemRemoteTls.java` uses the supported Android SSLSocket/KeyManager APIs for
TLS 1.2/1.3. `system_remote_tls.py` adapts connection creation while leaving the
pinned upstream protocol and lifecycle logic intact. AndroidTVRemote receives a
loop adapter whose create_connection delegates to an app-private local socket
when TLS is requested. Its protocol receives the actual peer DER certificate
through get_extra_info('ssl_object'), preserving Polo's RSA/PIN proof.

When native establishment fails, the original Python TLS stack remains a
connection-only fallback for other TV models. No button/audio command is replayed;
developer backend state identifies the last selected transport.

The relay's abstract Unix socket name has a random UUID; Android peer credentials
must match the current application UID. No relay TCP port is opened. Both remote
and local streams close together. Only two native sessions/four I/O workers are
allowed; connect/handshake timeouts and cancellation cleanup bound resources.
Host targets must be loopback or an interface belonging to this TV; ports are
restricted to 6466/6467. Client-supplied network targets are never accepted.

Existing RSA credentials remain encrypted in PairingStore. In-memory PKCS#8
conversion does not change the key or signing identity. Native server-certificate
handling retains upstream's self-signed Remote v2 exchange model; it is not
public-CA HTTPS validation. No certificate/private key/session bytes are logged.
R8 keeps the native methods invoked by Chaquopy. Host tests retain the Python
transport where no Android bridge exists; production prefers android-tls and reports python-tls if that fallback is selected.

Authentication rejection and generic native TLS failures remain distinct. A
Reconnect action calls `/api/system/connect` using existing trust. A connection
failure never automatically discards pairing or replays a possibly delivered key.
Sanitized diagnostics retain the fixed native exception class and cause chain.
A successful pairing acknowledgement remains different from control readiness.

## Handset UI

The Remote tab defaults to Auto: Home shown → simplified layout; Home hidden →
complete layout on the next state poll. Home/Complete buttons provide explicit
manual overrides; Auto restores tracking. Existing app/input tabs and activities
remain independent. Full controls use a compact handset with D-pad/touchpad,
Back/Home/Play-Pause/Menu, volume and channel rockers, voice, transport and colored
buttons. Controls below the viewport remain reachable through ordinary scrolling.

Arrows and Touchpad switch the same navigation surface. Touchpad swipes produce
relative discrete DPAD commands, not a system mouse cursor. A 36-point movement
threshold suppresses tiny moves; a drag beyond tap slop never also selects on
release. A tap selects once. Native PanResponder and web touch-action:none prevent
page scrolling inside the pad; outside it the remote remains scrollable. Keyboard
navigation remains available. Real phone gesture behavior still needs hardware QA.

## Source references

- [NineWorlds historical remote](https://github.com/NineWorlds/google-tv-remote)
- [Pinned Remote v2 implementation](https://github.com/tronikos/androidtvremote2/tree/v0.3.2)
- [Android SSLSocket](https://developer.android.com/reference/javax/net/ssl/SSLSocket)
- [Android local socket peer credentials](https://developer.android.com/reference/android/net/LocalSocket#getPeerCredentials())

A native release build and a physical third-party-app navigation check are required
to establish that the Android TLS change resolves this particular TV's failure.
Browser/mocked-protocol tests and Java compilation do not establish that outcome.
