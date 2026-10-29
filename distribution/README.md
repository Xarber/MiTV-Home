# Install and update

Download the signed universal APK from [GitHub Releases](https://github.com/Xarber/MiTV-Home/releases). AAB files are for store tooling, not direct installation. Local debug APKs have a different signing key; do not uninstall an existing installation merely to switch keys without preserving its settings.

- [Import TV stable into Obtainium](obtainium://app/%7B%22id%22%3A%22it.xarber.mitvhome%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FXarber%2FMiTV-Home%22%2C%22author%22%3A%22Xarber%22%2C%22name%22%3A%22Aurea%20Home%22%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22%5EMiTV-Home-.%2A-android-universal-.%2A%5C%5C%5C%5C.apk%24%5C%22%2C%5C%22filterReleaseTitlesByRegEx%5C%22%3A%5C%22%5E%28Aurea%7CMiTV%29%20Home%20%5B0-9%5D%5C%22%7D%22%7D) · [View JSON](obtainium.json)
- [Import TV beta into Obtainium](obtainium://app/%7B%22id%22%3A%22it.xarber.mitvhome%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FXarber%2FMiTV-Home%22%2C%22author%22%3A%22Xarber%22%2C%22name%22%3A%22Aurea%20Home%22%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Atrue%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22%5EMiTV-Home-.%2A-android-universal-.%2A%5C%5C%5C%5C.apk%24%5C%22%2C%5C%22filterReleaseTitlesByRegEx%5C%22%3A%5C%22%5E%28Aurea%7CMiTV%29%20Home%20%5B0-9%5D%5C%22%7D%22%7D) · [View JSON](obtainium-beta.json)
- [Import Phone stable into Obtainium](obtainium://app/%7B%22id%22%3A%22it.xarber.aurea.remote%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FXarber%2FMiTV-Home%22%2C%22author%22%3A%22Xarber%22%2C%22name%22%3A%22Aurea%20Remote%22%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22%5EAurea-Remote-.%2A-android-phone-universal%5C%5C%5C%5C.apk%24%5C%22%2C%5C%22filterReleaseTitlesByRegEx%5C%22%3A%5C%22%5E%28Aurea%7CMiTV%29%20Home%20%5B0-9%5D%5C%22%7D%22%7D) · [View JSON](obtainium-remote.json)
- [Import Phone beta into Obtainium](obtainium://app/%7B%22id%22%3A%22it.xarber.aurea.remote%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FXarber%2FMiTV-Home%22%2C%22author%22%3A%22Xarber%22%2C%22name%22%3A%22Aurea%20Remote%22%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Atrue%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22%5EAurea-Remote-.%2A-android-phone-universal%5C%5C%5C%5C.apk%24%5C%22%2C%5C%22filterReleaseTitlesByRegEx%5C%22%3A%5C%22%5E%28Aurea%7CMiTV%29%20Home%20%5B0-9%5D%5C%22%7D%22%7D) · [View JSON](obtainium-remote-beta.json)

If the browser blocks the custom scheme, import the JSON file or add the repository URL manually. Stable excludes prereleases; beta includes them. Both filter for universal APKs. Full configuration uses the [official Obtainium deep-link format](https://wiki.obtainium.imranr.dev/deep_links/). Import and download require Obtainium/network access; an import has not been tested inside Obtainium in this batch. Release asset availability depends on a successful channel build.

## Native phone sources

The release pipeline generates separate stable and beta AltSources for Aurea Remote from the actual published IPA, version/build number, minimum OS, size and native permissions. Simulator bundles are excluded. The fixed metadata release is `sources-v1.0`; it is kept separate from real application version tags. The first native phone version appears only after a complete validated beta/main release, not when a testing Actions artifact exists.

Stable AltSource: `https://github.com/Xarber/MiTV-Home/releases/download/sources-v1.0/altsource.json`

Beta AltSource: `https://github.com/Xarber/MiTV-Home/releases/download/sources-v1.0/altsource-beta.json`

These are publication destinations; they are not claimed live before that metadata release exists. Add the source with AltStore Classic/SideStore or another compatible signing installer; unsigned IPA installation requires signing.

Android TV keeps its existing Obtainium profiles. Android phones use [stable remote](obtainium-remote.json) or [beta remote](obtainium-remote-beta.json). Their APK filters are distinct, and all profiles exclude the metadata release by title. Never install the phone APK to update the TV launcher, or a historical preview APK to update production.

The phone package is `it.xarber.aurea.remote`; production TV is `it.xarber.mitvhome`. Older `it.xarber.tvhome` prototypes and `.preview` builds are separate Android applications, not signing failures. The OS cannot update a different package in place. Existing installations and their data are never silently uninstalled by this pipeline.
