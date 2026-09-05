import AsyncStorage from '@react-native-async-storage/async-storage';

// expo-speech's `rate` option: 1.0 is normal speed. A stepped preset list
// (same cycling-button pattern as lineLengthPreference.ts) rather than a
// slider — no new native dependency needed, and stays consistent with how
// the rest of the app already handles this kind of setting.
export const RATE_PRESETS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const;
export type VoiceRate = (typeof RATE_PRESETS)[number];

export const DEFAULT_VOICE_RATE: VoiceRate = 1.0;

const VOICE_RATE_KEY = 'cueme.voiceRate';

export async function loadVoiceRate(): Promise<VoiceRate> {
  const stored = await AsyncStorage.getItem(VOICE_RATE_KEY);
  const parsed = stored ? Number(stored) : NaN;
  return (RATE_PRESETS as readonly number[]).includes(parsed)
    ? (parsed as VoiceRate)
    : DEFAULT_VOICE_RATE;
}

export async function saveVoiceRate(rate: VoiceRate): Promise<void> {
  await AsyncStorage.setItem(VOICE_RATE_KEY, String(rate));
}

/** Cycles through the preset list, wrapping back to the start — for a single tappable button. */
export function nextVoiceRate(current: VoiceRate): VoiceRate {
  const index = RATE_PRESETS.indexOf(current);
  return RATE_PRESETS[(index + 1) % RATE_PRESETS.length];
}

export function voiceRateLabel(rate: VoiceRate): string {
  return rate === 1.0 ? 'Normal' : `${rate}x`;
}
