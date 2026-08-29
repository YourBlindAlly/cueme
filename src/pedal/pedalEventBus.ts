import CuemePedalInput from '../../modules/cueme-pedal-input/src/CuemePedalInputModule';
import type {
  AudioInterruptionEndedPayload,
  KeyEventPayload,
} from '../../modules/cueme-pedal-input/src/CuemePedalInput.types';

/**
 * A single, permanent native subscription per event, fanning out to however
 * many JS listeners are currently registered via a plain Set. `usePedalInput`
 * (and `useAudioInterruptionResume`) register/deregister against this bus
 * instead of calling `CuemePedalInput.addListener` directly.
 *
 * The point: this makes it structurally impossible for the NATIVE side to
 * ever end up with more than one live listener per event, regardless of how
 * many component instances mount, remount, or fail to clean up after
 * themselves — a real, hard-to-fully-verify class of bug (an uncaught
 * exception, a lifecycle edge case, anything that leaves an old instance's
 * cleanup from running) would otherwise mean the same native event gets
 * delivered to multiple stacked listeners, each independently re-triggering
 * whatever it does — which is exactly the "same text spoken 3-5 times"
 * symptom Rusty reported (2026-08-28). Fan-out now happens over a plain JS
 * Set, which is simple enough to trust completely, rather than depending on
 * the native/Expo bridge's own listener bookkeeping being leak-proof across
 * every possible lifecycle edge case.
 */
/**
 * A physical pedal press should never register as two "key down" events this
 * close together — the pedal's own hardware auto-repeat (a HID keyboard
 * convention: holding a key resends key-down while it's still pressed) and
 * the fact that this module runs TWO separate native key-delivery paths at
 * once (GCKeyboard's keyChangedHandler, kept for pedals it does work for, and
 * PedalKeyCaptureView's pressesBegan fallback, which is what actually
 * delivers events for Rusty's own pedal — see CuemePedalInputModule.swift)
 * are both plausible sources of a spurious second "down" for one real press.
 * Deliberately well under DOUBLE_PRESS_WINDOW_MS (400ms) so a genuine fast
 * double-press to jump setlist songs still passes both real presses through
 * untouched — this only swallows a second down edge that arrives too fast to
 * be a human's second stomp.
 */
const DUPLICATE_KEYDOWN_WINDOW_MS = 120;

class PedalEventBus {
  private keyEventListeners = new Set<(event: KeyEventPayload) => void>();
  private connectedListeners = new Set<() => void>();
  private disconnectedListeners = new Set<() => void>();
  private interruptionEndedListeners = new Set<(event: AudioInterruptionEndedPayload) => void>();
  private started = false;
  private lastKeyDownAt = new Map<number, number>();

  private ensureStarted() {
    if (this.started) {
      return;
    }
    this.started = true;
    CuemePedalInput.addListener('onKeyEvent', (event: KeyEventPayload) => {
      if (event.isKeyDown) {
        const now = Date.now();
        const last = this.lastKeyDownAt.get(event.keyCode);
        if (last !== undefined && now - last < DUPLICATE_KEYDOWN_WINDOW_MS) {
          // Reported 2026-08-29: lines repeating (sometimes overlapping)
          // during setlist playback, most likely this exact duplicate-
          // delivery pattern surfacing more often under longer, more
          // continuous pedal use. Swallow the duplicate at this single
          // fan-out point rather than in every consumer.
          return;
        }
        this.lastKeyDownAt.set(event.keyCode, now);
      }
      this.keyEventListeners.forEach((listener) => listener(event));
    });
    CuemePedalInput.addListener('onPedalConnected', () => {
      this.connectedListeners.forEach((listener) => listener());
    });
    CuemePedalInput.addListener('onPedalDisconnected', () => {
      this.disconnectedListeners.forEach((listener) => listener());
    });
    CuemePedalInput.addListener('onAudioInterruptionEnded', (event: AudioInterruptionEndedPayload) => {
      this.interruptionEndedListeners.forEach((listener) => listener(event));
    });
  }

  onKeyEvent(listener: (event: KeyEventPayload) => void): () => void {
    this.ensureStarted();
    this.keyEventListeners.add(listener);
    return () => this.keyEventListeners.delete(listener);
  }

  onConnected(listener: () => void): () => void {
    this.ensureStarted();
    this.connectedListeners.add(listener);
    return () => this.connectedListeners.delete(listener);
  }

  onDisconnected(listener: () => void): () => void {
    this.ensureStarted();
    this.disconnectedListeners.add(listener);
    return () => this.disconnectedListeners.delete(listener);
  }

  onAudioInterruptionEnded(listener: (event: AudioInterruptionEndedPayload) => void): () => void {
    this.ensureStarted();
    this.interruptionEndedListeners.add(listener);
    return () => this.interruptionEndedListeners.delete(listener);
  }
}

export const pedalEventBus = new PedalEventBus();
