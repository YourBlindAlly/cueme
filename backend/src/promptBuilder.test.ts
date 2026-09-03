import {
  buildReformatPrompt,
  buildUrlSearchPrompt,
  cleanAiResponse,
  cleanUrlResponse,
  INCOMPLETE_SENTINEL,
  looksComplete,
  NOT_FOUND_SENTINEL,
} from './promptBuilder';

describe('buildUrlSearchPrompt', () => {
  it('includes the title and artist', () => {
    const prompt = buildUrlSearchPrompt({ title: 'Wonderwall', artist: 'Oasis', includeChords: false });
    expect(prompt).toContain('Wonderwall');
    expect(prompt).toContain('Oasis');
    expect(prompt).toContain(NOT_FOUND_SENTINEL);
  });

  it('never asks the model to reproduce or summarize the lyrics', () => {
    const prompt = buildUrlSearchPrompt({ title: 'X', artist: 'Y', includeChords: false });
    expect(prompt).toMatch(/do not summarize, describe, or reproduce/i);
  });

  it('asks for lyrics pages when chords are off, chord/tab pages when on', () => {
    const withoutChords = buildUrlSearchPrompt({ title: 'X', artist: 'Y', includeChords: false });
    expect(withoutChords).toContain('lyrics');
    const withChords = buildUrlSearchPrompt({ title: 'X', artist: 'Y', includeChords: true });
    expect(withChords).toContain('chords/tab');
  });

  it('says nothing about excluded URLs when none are given', () => {
    const prompt = buildUrlSearchPrompt({ title: 'X', artist: 'Y', includeChords: false });
    expect(prompt).not.toMatch(/already tried/i);
  });

  it('tells the model to avoid previously-tried URLs on a retry', () => {
    const prompt = buildUrlSearchPrompt({ title: 'X', artist: 'Y', includeChords: false }, [
      'https://example.com/bad-page',
      'https://example.com/another-bad-page',
    ]);
    expect(prompt).toMatch(/already tried/i);
    expect(prompt).toContain('https://example.com/bad-page');
    expect(prompt).toContain('https://example.com/another-bad-page');
  });
});

describe('cleanUrlResponse', () => {
  it('returns a clean URL from a well-formed response', () => {
    expect(cleanUrlResponse('https://example.com/song-lyrics')).toBe('https://example.com/song-lyrics');
  });

  it('extracts the URL even if the model wraps it in a sentence', () => {
    expect(cleanUrlResponse('Here it is: https://example.com/lyrics.html — hope that helps!')).toBe(
      'https://example.com/lyrics.html'
    );
  });

  it('returns null for the not-found sentinel', () => {
    expect(cleanUrlResponse(NOT_FOUND_SENTINEL)).toBeNull();
  });

  it('returns null when there is no URL at all', () => {
    expect(cleanUrlResponse("I couldn't find one")).toBeNull();
  });
});

describe('buildReformatPrompt', () => {
  it('includes the page text verbatim', () => {
    const prompt = buildReformatPrompt(
      { title: 'X', artist: 'Y', includeChords: false },
      'Amazing grace, how sweet the sound'
    );
    expect(prompt).toContain('Amazing grace, how sweet the sound');
  });

  it('instructs the model to omit chords when includeChords is false', () => {
    const prompt = buildReformatPrompt({ title: 'X', artist: 'Y', includeChords: false }, 'page text');
    expect(prompt).toContain('Do not include any chords');
  });

  it('instructs the model to include bracketed chords when includeChords is true', () => {
    const prompt = buildReformatPrompt({ title: 'X', artist: 'Y', includeChords: true }, 'page text');
    expect(prompt).toContain('[C]Amazing [G]grace');
  });

  it('frames the task as reformatting given text, not producing lyrics from scratch', () => {
    const prompt = buildReformatPrompt({ title: 'X', artist: 'Y', includeChords: false }, 'page text');
    expect(prompt).toMatch(/raw text content of a real web page/i);
  });

  it('instructs the model to flag an incomplete source rather than pass along a partial result', () => {
    const prompt = buildReformatPrompt({ title: 'X', artist: 'Y', includeChords: false }, 'page text');
    expect(prompt).toContain(INCOMPLETE_SENTINEL);
    expect(prompt).toMatch(/never guess, invent, or fill in the missing part/i);
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

  it('returns null for the incomplete-source sentinel', () => {
    expect(cleanAiResponse(INCOMPLETE_SENTINEL)).toBeNull();
    expect(cleanAiResponse(`  ${INCOMPLETE_SENTINEL}  `)).toBeNull();
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

describe('looksComplete', () => {
  // Generic, non-lyric placeholder lines — long enough to clear MIN_LINES —
  // used to isolate the ending-shape checks from the length check below.
  function lines(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `Line number ${i + 1}`);
  }

  it('accepts a long-enough result ending on terminal punctuation', () => {
    const body = [...lines(11), 'This is the final line.'].join('\n');
    expect(looksComplete(body)).toBe(true);
  });

  it('accepts a long-enough result whose final line repeats an earlier line (a chorus fade-out)', () => {
    const body = ['Chorus line here', ...lines(11), 'Chorus line here'].join('\n');
    expect(looksComplete(body)).toBe(true);
  });

  it('rejects a long-enough result that stops mid-sentence with no punctuation and no repeat', () => {
    const body = [...lines(11), 'And then it just stops'].join('\n');
    expect(looksComplete(body)).toBe(false);
  });

  it('rejects a short fragment even if it happens to end cleanly — confirmed live 2026-09-03, the ending-shape check alone let this through', () => {
    expect(looksComplete('Line one\nLine two\nLine three.')).toBe(false);
  });

  it('rejects empty input', () => {
    expect(looksComplete('')).toBe(false);
    expect(looksComplete('   ')).toBe(false);
  });

  it('is case-insensitive when checking for a repeated final line', () => {
    const body = ['Chorus Line Here', ...lines(11), 'chorus line here'].join('\n');
    expect(looksComplete(body)).toBe(true);
  });
});
