import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { loadVoicePreference } from './voicePreference';

export type SpeechCallCounts = {
  speakCalls: number;
  starts: number;
  dones: number;
  stops: number;
  errors: number;
};

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mounted = useRef(true);
  const voiceIdRef = useRef<string | null>(null);
  const [counts, setCounts] = useState<SpeechCallCounts>({
    speakCalls: 0,
    starts: 0,
    dones: 0,
    stops: 0,
    errors: 0,
  });

  useEffect(() => {
    mounted.current = true;
    loadVoicePreference().then((id) => {
      voiceIdRef.current = id;
    });
    return () => {
      mounted.current = false;
      Speech.stop();
    };
  }, []);

  /**
   * Re-reads the voice preference from storage. Needed because a screen
   * doesn't remount when you navigate back to it (React Navigation keeps the
   * existing instance), so a voice picked in Settings would otherwise never
   * reach an already-mounted prompter screen's speech hook.
   */
  const refreshVoicePreference = useCallback(async () => {
    voiceIdRef.current = await loadVoicePreference();
  }, []);

  /**
   * Stops whatever is currently being spoken (if anything) and immediately
   * starts speaking `text` — this is the "cut off and jump" behavior the
   * pedal's forward press needs, not a queued/sequential speak.
   *
   * Speech.stop() is asynchronous even though it looks like a fire-and-forget
   * call. Calling speak() right after it without awaiting let the old
   * utterance's stop and the new utterance's start land out of order, which
   * could cut the new line off partway through shortly after it started —
   * found via real on-device testing where lines were "fading away" before
   * finishing.
   */
  const speakNow = useCallback((text: string) => {
    (async () => {
      await Speech.stop();
      if (!mounted.current) return;
      setIsSpeaking(true);
      setCounts((c) => ({ ...c, speakCalls: c.speakCalls + 1 }));
      Speech.speak(text, {
        voice: voiceIdRef.current ?? undefined,
        // Gives AVSpeechSynthesizer its own audio session instead of sharing
        // the app-wide one that the tick/end-of-song sound effects (expo-audio)
        // also touch — found while investigating lines "fading" partway
        // through, since expo-speech's default is to share that session, and
        // a same-process session hand-off between two different playback
        // engines is a real, if hard-to-prove-from-JS, way for one to cut the
        // other off without ever surfacing as a JS-visible interruption event.
        useApplicationAudioSession: false,
        onStart: () => {
          setCounts((c) => ({ ...c, starts: c.starts + 1 }));
        },
        onDone: () => {
          setCounts((c) => ({ ...c, dones: c.dones + 1 }));
          if (mounted.current) setIsSpeaking(false);
        },
        onStopped: () => {
          setCounts((c) => ({ ...c, stops: c.stops + 1 }));
          if (mounted.current) setIsSpeaking(false);
        },
        onError: () => {
          setCounts((c) => ({ ...c, errors: c.errors + 1 }));
          if (mounted.current) setIsSpeaking(false);
        },
      });
    })();
  }, []);

  const stopImmediate = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speakNow, stopImmediate, refreshVoicePreference, counts };
}
