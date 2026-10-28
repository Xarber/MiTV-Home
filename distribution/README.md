# Install and update

Download the signed universal APK from [GitHub Releases](https://github.com/Xarber/MiTV-Home/releases). AAB files are for store tooling, not direct installation. Local debug APKs have a different signing key; do not uninstall an existing installation merely to switch keys without preserving its settings.

- [Import stable into Obtainium](obtainium://app/%7B%22id%22%3A%22it.xarber.mitvhome%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FXarber%2FMiTV-Home%22%2C%22author%22%3A%22Xarber%22%2C%22name%22%3A%22MiTV%20Home%22%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22android-universal.%2A%5C%5C%5C%5C.apk%24%5C%22%7D%22%7D)
- [Import beta into Obtainium](obtainium://app/%7B%22id%22%3A%22it.xarber.mitvhome%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FXarber%2FMiTV-Home%22%2C%22author%22%3A%22Xarber%22%2C%22name%22%3A%22MiTV%20Home%22%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Atrue%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22android-universal.%2A%5C%5C%5C%5C.apk%24%5C%22%7D%22%7D)
- [View/copy stable config](obtainium.json)
- [View/copy beta config](obtainium-beta.json)

If the browser blocks the custom scheme, import the JSON file or add the repository URL manually. Stable excludes prereleases; beta includes them. Both filter for universal APKs. Full configuration uses the [official Obtainium deep-link format](https://wiki.obtainium.imranr.dev/deep_links/). Import and download require Obtainium/network access; an import has not been tested inside Obtainium in this batch. Release asset availability depends on a successful channel build.
