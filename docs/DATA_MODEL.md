# Data model

All preferences use app-private SharedPreferences; OS backup is disabled. No account/cloud database is required.

| Store | Data | Lifetime |
| --- | --- | --- |
| Activity preferences (`MainActivity`) | `input-dock-pin` first position; JSON-string `dock-pins` five following positions; `input-profile-1..3`; boolean `activity-background` | Persistent |
| `home_language` | `language`: `it` or `en` | Persistent |
| `release_history` | `seen`: highest displayed/current version code | Persistent |
| `home_restore` | `previous`: last presentation snapshot before import | Persistent, no receiver credentials |
| Receiver `settings` | Typed settings from Kotlin Prefs; receiver private identity/key material | Persistent, excluded from Home export |
| HTTP server memory | Up to 16 random 192-bit tokens; six-digit PIN/expiry; authenticated heartbeat timestamps | Destroyed when Home remote stops |
| `home_developer` | Explicit `enabled` opt-in; excluded from presentation exports | Persistent until switched off |
| Developer session memory | Triple-press count, monotonic last input, unlock state | Cleared on timeout/navigation/background |
| Diagnostics memory | Last 64 enum events with monotonic timestamp | Process lifetime; no arbitrary payloads |

Export schema 1 contains `schema`, `language`, and `home` allowlisted presentation fields. It is UTF-8 JSON, at most 16 KiB. Import rejects unsupported schema, unknown Home fields, wrong types, invalid profiles, oversized dock keys, excess slots and All Apps outside the final slot. Validation occurs before writes; previous state is committed first. User confirms replacement. Import never touches installed apps, TV settings, AirPlay keys or remote credentials. System document-provider access is scoped to the selected URI, with no broad storage permission.

`app/src/main/assets/release-history.json` contains version/code/date, English/Italian highlights/fixes, per-feature icon/label/detail and visible compatibility notes. Generated CHANGELOG.md and user update UI consume it. CI generates developer commit history and provenance for the exact source commit; these are distinct from a user-friendly feature summary.

Updater state is isolated in home_updates (public candidate, check timestamps/ETag/backoff, download/session ids, preferences and install result). Update API cache is an AtomicFile; transient APKs are app-owned external files. No credentials or receiver settings enter update metadata. See features/UPDATES.md for validation and lifecycle contracts.


External Apple TV pairing keeps only the selected HDMI input ID in
`paired_device_ui` SharedPreferences (no default input). This device-specific UI
choice is separate from encrypted Apple TV credentials and portable Home exports.
Pending pairing name/deadline/generation are process-local; the PIN is never saved.
