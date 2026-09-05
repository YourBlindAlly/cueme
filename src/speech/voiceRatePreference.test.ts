jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { nextVoiceRate, voiceRateLabel, RATE_PRESETS, DEFAULT_VOICE_RATE } from './voiceRatePreference';

describe('nextVoiceRate', () => {
  it('cycles through every preset in order and wraps back to the start', () => {
    for (let i = 0; i < RATE_PRESETS.length; i++) {
      const current = RATE_PRESETS[i];
      const expected = RATE_PRESETS[(i + 1) % RATE_PRESETS.length];
      expect(nextVoiceRate(current)).toBe(expected);
    }
  });
});

describe('voiceRateLabel', () => {
  it('labels the default rate as "Normal" rather than "1x"', () => {
    expect(voiceRateLabel(DEFAULT_VOICE_RATE)).toBe('Normal');
  });

  it('labels every other preset as a multiplier', () => {
    expect(voiceRateLabel(1.5)).toBe('1.5x');
    expect(voiceRateLabel(0.75)).toBe('0.75x');
    expect(voiceRateLabel(2.0)).toBe('2x');
  });
});
