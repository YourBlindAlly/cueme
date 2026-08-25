import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { loadVoicePreference } from './voicePreference';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mounted = useRef(true);
  const voiceIdRef = useRef<string | null>(null);

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
   * Stops whatever is currently being spoken (if anything) and immediately
   * starts speaking `text` — this is the "cut off and jump" behavior the
   * pedal's forward press needs, not a queued/sequential speak.
   */
  const speakNow = useCallback((text: string) => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(text, {
      voice: voiceIdRef.current ?? undefined,
      onDone: () => {
        if (mounted.current) setIsSpeaking(false);
      },
      onStopped: () => {
        if (mounted.current) setIsSpeaking(false);
      },
      onError: () => {
        if (mounted.current) setIsSpeaking(false);
      },
    });
  }, []);

  const stopImmediate = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speakNow, stopImmediate };
}
