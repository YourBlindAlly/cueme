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
  it('accepts lyrics ending on terminal punctuation', () => {
    expect(looksComplete('Amazing grace\nHow sweet the sound.')).toBe(true);
    expect(looksComplete('Is this the real life?')).toBe(true);
    expect(looksComplete('With arms wide open!')).toBe(true);
  });

  it('accepts lyrics whose final line repeats an earlier line (a chorus fade-out)', () => {
    expect(looksComplete('With arms wide open\nSomething else\nWith arms wide open')).toBe(true);
  });

  it('rejects text that stops mid-sentence with no punctuation and no repeat', () => {
    expect(looksComplete("Well I just heard the news today\nWell I don't know if I'm")).toBe(false);
  });

  it('rejects empty input', () => {
    expect(looksComplete('')).toBe(false);
    expect(looksComplete('   ')).toBe(false);
  });

  it('is case-insensitive when checking for a repeated final line', () => {
    expect(looksComplete('With Arms Wide Open\nSomething else\nwith arms wide open')).toBe(true);
  });
});
