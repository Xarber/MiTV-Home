# Building

Use JDK 21, Android SDK platform 37.0, build tools 37.0.0, NDK 27.0.12077973, and CMake 3.22.1. The wrapper pins Gradle 9.8.1.

```sh
git clone --recurse-submodules https://github.com/Xarber/MiTV-Home.git
cd MiTV-Home
./gradlew :app:assembleDebug :app:lintDebug
```

Native code is compiled from source and pinned submodules. Gradle applies checked-in UxPlay patches before CMake configuration. GitHub's generated source ZIP does not contain submodules; clone recursively.

For fast launcher iteration, `./gradlew -PuseBundledNative :app:assembleDebug` uses bundled ARMv7/ARM64 libraries and does not rebuild native changes or support x86_64. CI always compiles native code from source.

## Signed release

Set `MITV_STORE_FILE`, `MITV_STORE_PASSWORD`, `MITV_KEY_ALIAS`, and `MITV_KEY_PASSWORD`, then run `./gradlew :app:assembleRelease :app:lintRelease`. The APK appears in `app/build/outputs/apk/release/`.

GitHub Actions requires four repository secrets:

| Secret | Value |
| --- | --- |
| `MITV_KEYSTORE_BASE64` | Base64 encoded project release keystore |
| `MITV_STORE_PASSWORD` | Keystore password |
| `MITV_KEY_ALIAS` | Signing alias |
| `MITV_KEY_PASSWORD` | Key password |

Keep a private backup of the keystore and passwords. They are never committed.

Pushes to beta/main compile signed universal APK and AAB in parallel from all four supported ABIs, run validation and publish only after required jobs succeed. Testing has no automatic runs. See RELEASES.md for promotion and artifact naming.

For an existing local SDK: `ANDROID_HOME=/path/to/sdk ./gradlew -PuseBundledNative :app:assembleDebug :app:lintDebug`. Native bundled previews are ARM-only and do not test C/C++ changes. CI generates build metadata and developer history for the exact commit.
