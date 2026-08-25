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
