# Bounded TV popups

Every host Dialog uses PopupViewport: a stationary frosted shell constrained to display height minus 30 dp top/bottom margins and the established right margin. The inner native ScrollView scrolls arbitrary content, including developer history and licenses. Small popups still wrap their natural content height. Long labels wrap and remain inside the bounded frame rather than enlarging the window beyond the screen.

No scrollbars are shown. Focus scrolling reserves 24/28 dp around requested rectangles, plus an 18 dp bottom peek region. Up/down chevrons and native fading edges show remaining content. Tiny software-blurred edge strips sample only the current viewport, at quarter resolution, coalesced to at most 20 Hz. They are scoped to the dialog and released on detach; no cross-dialog or wallpaper blur cache is introduced. The background remains fixed while contents scroll. Reduced-motion users receive the same immediate state feedback and native scrolling, with no added decorative animation.

Focusable long read-only text consumes TV up/down to scroll in 60 dp increments until a boundary, then normal focus navigation can reach actions. EditText cursor movement and ordinary action buttons retain their native behavior. Focus starts near the top of a long text block rather than jumping to its final button. The edge layer is excluded from accessibility; ScrollView retains standard accessible scroll actions.

A dialog dismissal clears its captured backdrop only if it still owns the current panel, preventing a previously dismissed dialog's asynchronous callback from clearing the next popup's blur.
