jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  nextVoiceRate,
  increaseVoiceRate,
  decreaseVoiceRate,
  voiceRateLabel,
  RATE_PRESETS,
  DEFAULT_VOICE_RATE,
} from './voiceRatePreference';

describe('nextVoiceRate', () => {
  it('cycles through every preset in order and wraps back to the start', () => {
    for (let i = 0; i < RATE_PRESETS.length; i++) {
      const current = RATE_PRESETS[i];
      const expected = RATE_PRESETS[(i + 1) % RATE_PRESETS.length];
      expect(nextVoiceRate(current)).toBe(expected);
    }
  });
});

describe('increaseVoiceRate', () => {
  it('moves one step faster', () => {
    expect(increaseVoiceRate(1.0)).toBe(1.25);
  });

  it('clamps at the fastest preset instead of wrapping', () => {
    expect(increaseVoiceRate(2.0)).toBe(2.0);
  });
});

describe('decreaseVoiceRate', () => {
  it('moves one step slower', () => {
    expect(decreaseVoiceRate(1.0)).toBe(0.75);
  });

  it('clamps at the slowest preset instead of wrapping', () => {
    expect(decreaseVoiceRate(0.75)).toBe(0.75);
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
