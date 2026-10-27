# Extension boundaries and future plugins

There is **no external plugin runtime or installable plugin format** in this release. Unknown scripts, APK code and downloaded native libraries are never loaded. The launcher uses installed-app intents and host-owned source/action definitions, not arbitrary plugin code.

The architecture separates presentation (`MainActivity`), preference portability (`HomePreferences`), diagnostics (`Diagnostics`), remote transport (`HomeRemoteServer`) and media service/bridge. Future extensions should implement a separately versioned host interface around these responsibilities rather than receiving an Activity, raw preferences, JNI handle or service instance.

## Reserved API v1 design (proposed, not implemented)

A manifest would declare plugin id/version, host API range and capabilities. Host registries would expose screen sections, menu actions, data-provider snapshots and typed events. Initial capabilities should be `home.section`, `home.action`, `metadata.read`, and isolated plugin storage; network/device control require separate user consent. Versioning, schema migrations and errors remain host-owned.

Before enabling third-party plugins, implement manifest validation, explicit permission grant/revoke, isolated process or safe declarative renderer, per-plugin storage quotas and lifecycle, resource/time limits, compatibility checks, crash boundaries, signed updates with rollback, removal and settings UI. No unrestricted reflection, runtime JVM loading or arbitrary WebView bridge. Security must be demonstrated before shipping a loader.

Current distribution is GitHub extended only. There is no separate official-store product yet; a future store variant must exclude any noncompliant loader at compile time. Hiding it from reviewers is prohibited. Android TV functionality does not imply an iOS/tvOS port or store approval.
