# Home ownership, background access and wallpaper transitions

## Physical TV actions and evidence

The user authorized removing a second custom launcher and restarting Aurea.
Installed prototype it.xarber.tvhome 0.3 was uninstalled; only the canonical custom
package it.xarber.mitvhome remained. OEM launchers were preserved. Aurea was stopped
and restarted with its data intact. On recurrence, private diagnostics showed two
MainActivity instances in separate HOME and ordinary tasks in one process; safe
navigation logs showed consecutive duplicate actions within 1–3 ms. The earlier
explicit-component restart also used the ordinary-task path. A second restart used
ACTION_MAIN/CATEGORY_HOME and confirmed one Home record. The user confirmed both
remote methods worked immediately after the first restart; recurrence established
that removing the prototype alone did not solve the issue.

The TV resolved Aurea as default Home but lacked SYSTEM_ALERT_WINDOW access. The
user explicitly approved enabling it; appops subsequently reported allow. No other
permissions, packages, data or production preferences were changed. Private logs
and device identifiers remain outside Git. Native 2.0.4 is not installed yet.

## Implemented in 2.0.4 / code 30

MainActivity retires a prior Home instance when Android creates another task root.
Remote Home now requests the canonical Home intent and restores only the app's own
task, checking foreground acknowledgement before success. Unpaired Home does not
require system pairing; arbitrary system navigation still does. Blocked launches
report a background-access error. Remote settings offer Android's permission page;
new installations never silently grant it. AirPlay audio targets the Home activity,
visual playback targets the receiver, and a new video request clears the stale
presentation latch. Platform background restrictions still apply.

The JS bridge grants one keyboard owner at a time, rejects repeated event identities,
and resets held keys/direction state on lifecycle transitions. Native focus rejects
out-of-scope callbacks and cancels stale transition ownership on resume/unmount,
with a bounded transition guard. These are source corrections; recurrence testing
on the physical TV still requires the new binary.

MusicActivityClock hides activity presentation after 300000 ms paused, unaffected
by repeated metadata polls, and restores it immediately on playback. Server state
carries optional activityVisible for Home/phone consistency; playback/session data
and controls remain available. The service samples activity state every five
seconds in the background; UI polling determines the exact display refresh.
Web/older-server UI uses a matching fallback clock. No persisted user data changes.

Wallpaper selection, tint toggles and song palette changes share 1.8-second
interruptible fades with reduced-motion support. The tint remains mounted for its
exit fade, has explicit overscan on each edge, and sits beneath app banners.
TV-only intensity is 0.22; phone/web remains 0.24. Blur and dock materials are
unchanged. Wallpaper previews remain independent and wallpaper motion keeps phase.

## Build correction and validation

Run 40883276625 compiled all four Android packages; lint then rejected the overlay
activity nodes without explicit exported=true, despite that attribute being present
in the shared manifest. Both overlays now declare it and regression checks require
it locally. Browser/PWA and both iOS jobs had succeeded in that run.

Executed: TypeScript, 26 Node model tests, 47 Python cases (two environment skips),
Java host checks including native pause-clock boundaries, workflow/release checks,
and 22 headless Chrome tests. Browser checks cover interrupted palettes, wallpaper
and tint-toggle fades, untinted banner layer ordering and existing UI navigation.
These do not establish native focus recovery, background AirPlay playback, five
minutes of real receiver pause, or physical picture quality. Those await the new
native build/device tests. No broad additional test repetition was performed after
the user requested conserving usage. Work remains on testing; no temporary Git
branch/worktree or public release was created.

References: Android background activity restrictions:
https://developer.android.com/guide/components/activities/secure-bal
Own-task restoration:
https://developer.android.com/reference/android/app/ActivityManager.AppTask#moveToFront()
