import { buildExtractionPrompt, cleanAiResponse, NOT_FOUND_SENTINEL } from './promptBuilder';

describe('buildExtractionPrompt', () => {
  it('includes the title, artist, and search results', () => {
    const prompt = buildExtractionPrompt({
      title: 'Wonderwall',
      artist: 'Oasis',
      includeChords: false,
      results: [{ title: 'Wonderwall lyrics', url: 'https://example.com', description: 'Today is gonna be the day...' }],
    });

    expect(prompt).toContain('Wonderwall');
    expect(prompt).toContain('Oasis');
    expect(prompt).toContain('https://example.com');
    expect(prompt).toContain(NOT_FOUND_SENTINEL);
  });

  it('instructs the model to omit chords when includeChords is false', () => {
    const prompt = buildExtractionPrompt({ title: 'X', artist: 'Y', includeChords: false, results: [] });
    expect(prompt).toContain('Do not include any chords');
  });

  it('instructs the model to include bracketed chords when includeChords is true', () => {
    const prompt = buildExtractionPrompt({ title: 'X', artist: 'Y', includeChords: true, results: [] });
    expect(prompt).toContain('[C]Amazing [G]grace');
  });

  it('handles no search results without throwing', () => {
    const prompt = buildExtractionPrompt({ title: 'X', artist: '', includeChords: false, results: [] });
    expect(prompt).toContain('(no search results)');
    expect(prompt).toContain('(not specified)');
  });
});

describe('cleanAiResponse', () => {
  it('returns the trimmed text for a normal response', () => {
    expect(cleanAiResponse('  Amazing grace\nHow sweet the sound  ')).toBe('Amazing grace\nHow sweet the sound');
  });

  it('returns null for the not-found sentinel', () => {
    expect(cleanAiResponse(NOT_FOUND_SENTINEL)).toBeNull();
    expect(cleanAiResponse(`  ${NOT_FOUND_SENTINEL}  `)).toBeNull();
  });

  it('returns null for an empty response', () => {
    expect(cleanAiResponse('   ')).toBeNull();
  });

  it('strips a wrapping markdown code fence', () => {
    expect(cleanAiResponse('```\nAmazing grace\nHow sweet the sound\n```')).toBe(
      'Amazing grace\nHow sweet the sound'
    );
  });

  it('strips a wrapping fence with a language tag', () => {
    expect(cleanAiResponse('```text\nAmazing grace\n```')).toBe('Amazing grace');
  });
});
