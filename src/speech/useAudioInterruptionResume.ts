import { useEffect } from 'react';
import CuemePedalInput from '../../modules/cueme-pedal-input/src/CuemePedalInputModule';

/**
 * Calls `onResume` when iOS reports an audio interruption (e.g. a phone call)
 * has ended and it's safe to resume — expo-speech has no built-in way to
 * detect this, so it's bridged from the native module. Re-speaking the
 * current line from the start (rather than trying to resume mid-utterance,
 * which the OS interruption itself already killed) is what `onResume` should
 * do on the caller's side.
 */
export function useAudioInterruptionResume(onResume: () => void) {
  useEffect(() => {
    const sub = CuemePedalInput.addListener('onAudioInterruptionEnded', (event) => {
      if (event.shouldResume) {
        onResume();
      }
    });
    return () => sub.remove();
  }, [onResume]);
}
