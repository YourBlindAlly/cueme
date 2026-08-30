import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LineWrapOptions } from './wrapLines';

export type LineLengthPreset = 'short' | 'medium' | 'long' | 'off';

// Rusty's own stated comfort zone (4-7 words, ~8 syllables) is "medium" —
// the default. Short/long give room either side without a custom-number UI.
export const LINE_LENGTH_OPTIONS: Record<Exclude<LineLengthPreset, 'off'>, LineWrapOptions> = {
  short: { maxWords: 4, maxSyllables: 5 },
  medium: { maxWords: 6, maxSyllables: 8 },
  long: { maxWords: 9, maxSyllables: 12 },
};

export const DEFAULT_LINE_LENGTH_PRESET: LineLengthPreset = 'medium';

const LINE_LENGTH_KEY = 'cueme.lineLengthPreset';
const VALID_PRESETS: LineLengthPreset[] = ['short', 'medium', 'long', 'off'];

export async function loadLineLengthPreset(): Promise<LineLengthPreset> {
  const stored = await AsyncStorage.getItem(LINE_LENGTH_KEY);
  if (stored && (VALID_PRESETS as string[]).includes(stored)) {
    return stored as LineLengthPreset;
  }
  return DEFAULT_LINE_LENGTH_PRESET;
}

export async function saveLineLengthPreset(preset: LineLengthPreset): Promise<void> {
  await AsyncStorage.setItem(LINE_LENGTH_KEY, preset);
}

/** Cycles short -> medium -> long -> off -> short, for a single tappable header button (no separate settings screen). */
export function nextLineLengthPreset(current: LineLengthPreset): LineLengthPreset {
  const index = VALID_PRESETS.indexOf(current);
  return VALID_PRESETS[(index + 1) % VALID_PRESETS.length];
}

export const LINE_LENGTH_PRESET_LABEL: Record<LineLengthPreset, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
  off: 'Off',
};

/**
 * Resolves a preset to wrap options. 'off' uses caps that no real line will
 * ever hit, so every line comes out as a single unsplit chunk — i.e. spoken
 * exactly as authored — while still going through the same chording/section
 * remap pipeline as every other preset (so "Off" + "Include chords" still
 * speaks chord names, just without any length-based splitting).
 */
export function wrapOptionsForPreset(preset: LineLengthPreset): LineWrapOptions {
  if (preset === 'off') {
    return { maxWords: Infinity, maxSyllables: Infinity };
  }
  return LINE_LENGTH_OPTIONS[preset];
}
