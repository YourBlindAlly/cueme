import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const tickSource = require('../../assets/audio/tick.wav');
const endSource = require('../../assets/audio/end.wav');

let tickPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let endPlayer: ReturnType<typeof createAudioPlayer> | null = null;

/**
 * Configures the audio session so CueMe's TTS and feedback sounds always take
 * priority — never ducked or muted for other audio, per spec.
 */
export async function configureAudioSession(): Promise<void> {
  await setAudioModeAsync({
    interruptionMode: 'doNotMix',
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    allowsRecording: false,
  });
  tickPlayer = createAudioPlayer(tickSource);
  endPlayer = createAudioPlayer(endSource);
}

export function playAdvanceFeedback(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  void (async () => {
    await tickPlayer?.seekTo(0);
    tickPlayer?.play();
  })();
}

export function playEndOfSongFeedback(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  void (async () => {
    await endPlayer?.seekTo(0);
    endPlayer?.play();
  })();
}

/**
 * Diagnostic-only feedback: a distinct double-buzz fired whenever the app
 * detects an iOS audio-session interruption ending and re-speaks the current
 * line as a result. Lets a listener tell, by feel alone, whether a given
 * "fading" line coincided with this code path firing — a real candidate
 * cause, since it's meant for phone-call-style interruptions but could in
 * theory also fire from the app's own tick-sound player briefly touching the
 * shared audio session.
 */
export function playInterruptionResumeFeedback(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
