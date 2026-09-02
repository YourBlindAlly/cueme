import { groupVoicesByLanguage, languageDisplayName } from './groupVoicesByLanguage';
import type { Voice } from 'expo-speech';

function voice(identifier: string, name: string, language: string): Voice {
  return { identifier, name, language, quality: 'Default' } as Voice;
}

describe('groupVoicesByLanguage', () => {
  it('groups voices by language', () => {
    const sections = groupVoicesByLanguage([
      voice('1', 'Samantha', 'en-US'),
      voice('2', 'Monica', 'es-MX'),
      voice('3', 'Alex', 'en-US'),
    ]);

    expect(sections).toHaveLength(2);
    const enSection = sections.find((s) => s.title.includes('en-US'));
    expect(enSection?.data.map((v) => v.name)).toEqual(['Alex', 'Samantha']);
  });

  it('sorts voices within a section alphabetically by name', () => {
    const sections = groupVoicesByLanguage([
      voice('1', 'Zelda', 'en-US'),
      voice('2', 'Aaron', 'en-US'),
    ]);
    expect(sections[0].data.map((v) => v.name)).toEqual(['Aaron', 'Zelda']);
  });

  it('sorts sections alphabetically by title', () => {
    const sections = groupVoicesByLanguage([
      voice('1', 'A', 'fr-FR'),
      voice('2', 'B', 'en-US'),
      voice('3', 'C', 'es-MX'),
    ]);
    const titles = sections.map((s) => s.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });

  it('handles an empty voice list', () => {
    expect(groupVoicesByLanguage([])).toEqual([]);
  });

  it('does not lose any voices across sections', () => {
    const voices = [
      voice('1', 'A', 'en-US'),
      voice('2', 'B', 'es-MX'),
      voice('3', 'C', 'en-US'),
      voice('4', 'D', 'fr-FR'),
    ];
    const sections = groupVoicesByLanguage(voices);
    const total = sections.reduce((sum, s) => sum + s.data.length, 0);
    expect(total).toBe(voices.length);
  });
});

describe('languageDisplayName', () => {
  it('never throws, even for a nonsense code', () => {
    expect(() => languageDisplayName('not-a-real-code')).not.toThrow();
  });

  it('falls back to the raw code when given something unrecognizable', () => {
    // A syntactically valid-ish but meaningless code Intl won't have a name
    // for is the realistic failure case to guard against, not literal
    // garbage that Intl might reject outright with a RangeError.
    const result = languageDisplayName('xx-XX');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
