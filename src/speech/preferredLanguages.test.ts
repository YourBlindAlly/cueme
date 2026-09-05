import { filterVoicesByLanguages, filterVoicesByQuality, preferredLanguageCodes } from './preferredLanguages';

describe('preferredLanguageCodes', () => {
  it('always includes English even if the device reports something else first', () => {
    expect(preferredLanguageCodes([{ languageCode: 'es' }])).toEqual(['en', 'es']);
  });

  it('does not duplicate English when the device is English', () => {
    expect(preferredLanguageCodes([{ languageCode: 'en' }])).toEqual(['en']);
  });

  it('includes a second configured language alongside English', () => {
    expect(preferredLanguageCodes([{ languageCode: 'en' }, { languageCode: 'fr' }])).toEqual(['en', 'fr']);
  });

  it('is case-insensitive', () => {
    expect(preferredLanguageCodes([{ languageCode: 'ES' }])).toEqual(['en', 'es']);
  });

  it('falls back to just English when given no locales', () => {
    expect(preferredLanguageCodes([])).toEqual(['en']);
  });

  it('ignores a null languageCode entry', () => {
    expect(preferredLanguageCodes([{ languageCode: null }])).toEqual(['en']);
  });
});

describe('filterVoicesByLanguages', () => {
  const voices = [
    { id: '1', language: 'en-US' },
    { id: '2', language: 'es-MX' },
    { id: '3', language: 'fr-FR' },
    { id: '4', language: 'en-GB' },
  ];

  it('keeps only voices matching the preferred codes, across regions', () => {
    const result = filterVoicesByLanguages(voices, ['en']);
    expect(result.map((v) => v.id)).toEqual(['1', '4']);
  });

  it('keeps voices for multiple preferred languages', () => {
    const result = filterVoicesByLanguages(voices, ['en', 'es']);
    expect(result.map((v) => v.id)).toEqual(['1', '2', '4']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterVoicesByLanguages(voices, ['de'])).toEqual([]);
  });
});

describe('filterVoicesByQuality', () => {
  const voices = [
    { id: '1', quality: 'Enhanced' },
    { id: '2', quality: 'Default' },
    { id: '3', quality: 'Enhanced' },
    { id: '4', quality: 'Default' },
  ];

  it('keeps only Enhanced-quality voices by default', () => {
    expect(filterVoicesByQuality(voices, false).map((v) => v.id)).toEqual(['1', '3']);
  });

  it('keeps every voice when includeLowQuality is true', () => {
    expect(filterVoicesByQuality(voices, true)).toEqual(voices);
  });

  it('returns an empty list when nothing is Enhanced quality', () => {
    const allDefault = [{ id: '1', quality: 'Default' }];
    expect(filterVoicesByQuality(allDefault, false)).toEqual([]);
  });
});
