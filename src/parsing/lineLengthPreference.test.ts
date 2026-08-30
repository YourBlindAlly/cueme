jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { nextLineLengthPreset, LINE_LENGTH_PRESET_LABEL } from './lineLengthPreference';

describe('nextLineLengthPreset', () => {
  it('cycles short -> medium -> long -> off -> short', () => {
    expect(nextLineLengthPreset('short')).toBe('medium');
    expect(nextLineLengthPreset('medium')).toBe('long');
    expect(nextLineLengthPreset('long')).toBe('off');
    expect(nextLineLengthPreset('off')).toBe('short');
  });
});

describe('LINE_LENGTH_PRESET_LABEL', () => {
  it('has a label for every preset', () => {
    expect(LINE_LENGTH_PRESET_LABEL).toEqual({
      short: 'Short',
      medium: 'Medium',
      long: 'Long',
      off: 'Off',
    });
  });
});
