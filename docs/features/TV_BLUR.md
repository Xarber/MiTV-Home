# TV blur performance preference

The existing live Expo BlurView implementation, blur target, Dimezis method, reduction factor, intensities, tint, popup shading, and web backdrop blur values are preserved. Blur remains enabled by default. No screenshot cache is introduced.

**Disable blur** in Control Center turns blur processing off for devices that need it. It is independent of **Activity background**, which continues to control black versus transparent activity surfaces. Disabling blur retains the existing contrast shades. Enabling it restores the original blur implementation. Native canonical preferences store `blur-enabled`; web preview preferences store `blur` in their existing isolated namespace. Missing values mean enabled. Backup validation accepts the new boolean and older backups remain readable.

The native status pills have a darker contrast base for white app banners. Status controls, Control Center and app category tabs are slightly larger; the dock, input text, other typography, and hero logo sizes retain their previous values. Native input icon sizes alone increase modestly.

Legacy Home and the developer **Recovery Home** action remain present. They must not be removed without a new explicit user instruction.

The QR page startup wait addresses a local service-start race; it does not prove that the powered-off television is reachable from a Mac. Receiver and focus changes similarly require physical retesting.

## Music and input hero rendering

Wallpapers has a separate **Music wallpaper tint** toggle (off by default). It overlays a low-opacity animated gradient from the two current waveform/artwork colors on any selected wallpaper. It fades away while music is paused and respects reduced motion. It neither replaces wallpaper selection nor changes blur settings or measured waveform data.

Input banner logos use a separate hero-icon rendering request: preserve the vector aspect ratio, trim transparent margins, and fit a common visible-area budget. Dock/app-icon responses are untouched. Live TV uses its TV glyph at the banner size. Paused measured/decorative waves render a uniform zero-amplitude baseline rather than retaining large bars.
