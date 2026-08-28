import type { PedalAction } from './keyBindings';

/**
 * A double press (of the SAME action, next/previous) within this window
 * counts as "change song" — chosen as a typical double-tap threshold, fast
 * enough not to trigger by accident on two deliberate single presses made a
 * beat apart, slow enough for a quick double-tap to register reliably.
 */
export const DOUBLE_PRESS_WINDOW_MS = 400;

/**
 * Tracks the last press time per action so a double press can be recognized
 * on top of — not instead of — the always-instant single-press behavior:
 * every press still fires its normal single-press action immediately and
 * unconditionally; this only decides whether THIS press also completes a
 * double press, layered on top.
 */
export class DoublePressDetector {
  private lastPressAt: Partial<Record<PedalAction, number>> = {};

  constructor(private readonly windowMs: number = DOUBLE_PRESS_WINDOW_MS) {}

  /**
   * Call once per resolved single-press action, after firing the normal
   * single-press behavior. Returns true exactly when this press completes a
   * double press of the same action — and consumes it, so a third rapid
   * press starts a fresh count rather than re-triggering immediately.
   */
  registerPress(action: PedalAction, now: number = Date.now()): boolean {
    const last = this.lastPressAt[action];
    if (last !== undefined && now - last <= this.windowMs) {
      delete this.lastPressAt[action];
      return true;
    }
    this.lastPressAt[action] = now;
    return false;
  }
}
