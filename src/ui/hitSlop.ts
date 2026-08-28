/**
 * Extra invisible touch-catching margin for small text-only "link" buttons
 * (Back, Edit, Remove, Voice, Lines, etc.) — these render as just a line of
 * text with no padding, well under Apple's recommended 44x44pt minimum
 * touch target. Under VoiceOver's touch-exploration (dragging a finger
 * around to find an element, as opposed to swiping between elements), a
 * target this small is easy to miss entirely — the finger slides past it
 * into open space and can end up announcing whatever's next in that
 * direction, including the system status bar for links positioned near the
 * top of the screen. Applying this to every such link is the fix (found via
 * Rusty's real on-device report, 2026-08-28).
 */
export const LINK_HIT_SLOP = { top: 14, bottom: 14, left: 14, right: 14 };

/**
 * For links packed tightly in a row (e.g. the Prompt screen's header
 * buttons) — generous top/bottom (that's the direction a finger overshoots
 * toward the status bar), but narrower left/right so two adjacent buttons'
 * expanded areas don't overlap enough to make it easy to hit the wrong one.
 */
export const ROW_LINK_HIT_SLOP = { top: 16, bottom: 16, left: 8, right: 8 };
