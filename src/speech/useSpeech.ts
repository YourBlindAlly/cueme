import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { loadVoicePreference } from './voicePreference';
import { DEFAULT_VOICE_RATE, loadVoiceRate, type VoiceRate } from './voiceRatePreference';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mounted = useRef(true);
  const voiceIdRef = useRef<string | null>(null);
  const rateRef = useRef<VoiceRate>(DEFAULT_VOICE_RATE);
  // Every speakNow() call claims the next id and checks it's still current
  // right before actually speaking — if a newer call came in while this one
  // was awaiting Speech.stop(), this one was superseded and silently backs
  // off instead of racing it. Without this, two speakNow calls issued close
  // together (e.g. a stale line from a pedal press, immediately followed by
  // "Next song" once a double-press is recognized) can both end up audible,
  // in submission order, since each call's own internal stop()+speak() has
  // no way to know a newer one is already in flight (Rusty's report,
  // 2026-08-31 — reading the stale line before "Next song" before "No more
  // songs in this setlist", none of them properly cut off).
  const requestIdRef = useRef(0);

  useEffect(() => {
    mounted.current = true;
    loadVoicePreference().then((id) => {
      voiceIdRef.current = id;
    });
    loadVoiceRate().then((rate) => {
      rateRef.current = rate;
    });
    return () => {
      mounted.current = false;
      Speech.stop();
    };
  }, []);

  /**
   * Re-reads the voice and rate preferences from storage. Needed because a
   * screen doesn't remount when you navigate back to it (React Navigation
   * keeps the existing instance), so a voice or rate picked in Settings
   * would otherwise never reach an already-mounted prompter screen's speech
   * hook.
   */
  const refreshVoicePreference = useCallback(async () => {
    voiceIdRef.current = await loadVoicePreference();
    rateRef.current = await loadVoiceRate();
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
    const requestId = ++requestIdRef.current;
    (async () => {
      await Speech.stop();
      if (!mounted.current) return;
      if (requestIdRef.current !== requestId) return; // superseded by a newer speakNow call — don't speak stale content
      setIsSpeaking(true);
      Speech.speak(text, {
        voice: voiceIdRef.current ?? undefined,
        rate: rateRef.current,
        // Gives AVSpeechSynthesizer its own audio session instead of sharing
        // the app-wide one that the tick/end-of-song sound effects (expo-audio)
        // also touch — fixed lines "fading" partway through, which turned out
        // to be same-process session hand-off between the two playback
        // engines, not the stop()/speak() ordering above.
        useApplicationAudioSession: false,
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
    })();
  }, []);

  const stopImmediate = useCallback(() => {
    requestIdRef.current++; // invalidates any speakNow() still awaiting Speech.stop() from before this call
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speakNow, stopImmediate, refreshVoicePreference };
}
