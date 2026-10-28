# Aurea Home interactive demo

React Native + Expo companion to the Android TV launcher, in the same repository.
This is a simulated showcase, not a replacement launcher or an AirPlay receiver.
No iOS target, account, remote server, TV connection or paid service is required.

Use Node 24 (at least 24.3) and npm:

```sh
cd demo
npm ci
npm run build
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8765. From the repository root,
`python3 scripts/start-demo-preview.py` builds when necessary and starts the
preview detached. Closing the chat does not stop that server. `npm run web`
starts the Expo development server instead; keep development tools on trusted networks.

## Controls

- Arrow keys: directional focus; left/right stop at dock boundaries.
- Enter: open. Hold Enter or press M: app menu, including dock pinning.
- Escape / Backspace: dismiss or return Home. C: Control Center.
- Space: play/pause simulated music. Tab / Shift+Tab: sequential focus.
- Click or tap: the same actions. Scroll: Dock → Inputs → Apps.
- In Control Center, Remote opens a simulated D-pad. Music and remote activities coexist.

Music has three original-artwork demo tracks, progress, pause/skip and simulated
volume; it emits no audio. Six animated bars are simulated; the preview UI stays minimal. Inputs,
network, casting and remote connection states are simulated. No real device is
scanned or controlled. Preferences use only `aurea.demo.preferences.v1` browser
storage, separate from Android settings; Restore defaults affects only this demo.

Five original minimal vector wallpapers share palettes with the Android branch.
Optional 20-second drift is off by default; reduced motion stops it and the bars.
No wallpaper videos, telemetry, external fonts, copyrighted album covers or third-party image requests.

```sh
npm run typecheck
npm test
npm run test:e2e     # build first; uses local Chrome, CI uses bundled Chromium
npm run build
npx expo export --platform android --output-dir dist-android
```

The Android command exports a JavaScript bundle, not a tested or installable APK.
No native demo was installed during browser validation. The original Gradle Android
TV application remains the production launcher. Feature-branch / manual `demo.yml` uploads a static
web artifact without publishing to a hosting service or changing release workflows.

See [implementation and limitations](../docs/features/EXPO_DEMO.md).
Original code is AGPL-3.0-only; inherited project artwork keeps its existing notices.
