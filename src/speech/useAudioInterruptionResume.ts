import { useEffect, useRef } from 'react';
import { pedalEventBus } from '../pedal/pedalEventBus';

/**
 * Calls `onResume` when iOS reports an audio interruption (e.g. a phone call)
 * has ended and it's safe to resume — expo-speech has no built-in way to
 * detect this, so it's bridged from the native module. Re-speaking the
 * current line from the start (rather than trying to resume mid-utterance,
 * which the OS interruption itself already killed) is what `onResume` should
 * do on the caller's side.
 *
 * `onResume` is read through a ref so the native subscription is set up
 * exactly once for the caller's lifetime, not re-subscribed every time
 * `onResume` gets a new identity (e.g. PromptScreen passes a callback that
 * changes on every line advance) — re-subscribing that often previously
 * risked a brief window with either zero or two live listeners, which would
 * show up as a line getting spoken more than once.
 */
export function useAudioInterruptionResume(onResume: () => void) {
  const onResumeRef = useRef(onResume);
  onResumeRef.current = onResume;

  useEffect(() => {
    return pedalEventBus.onAudioInterruptionEnded((event) => {
      if (event.shouldResume) {
        onResumeRef.current();
      }
    });
  }, []);
}
