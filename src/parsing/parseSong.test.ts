import { parseSong } from './parseSong';

describe('parseSong', () => {
  it('splits plain lines and drops blank lines', () => {
    const { lines, sections } = parseSong('Line one\n\nLine two\n   \nLine three');
    expect(lines).toEqual(['Line one', 'Line two', 'Line three']);
    expect(sections).toEqual([]);
  });

  it('extracts a bare "--" divider as an unlabeled section', () => {
    const { lines, sections } = parseSong('Verse line\n--\nChorus line');
    expect(lines).toEqual(['Verse line', 'Chorus line']);
    expect(sections).toEqual([{ lineIndex: 1, label: '' }]);
  });

  it('extracts a "-- Label --" style section with its label', () => {
    const { lines, sections } = parseSong('Verse line\n-- Chorus --\nChorus line');
    expect(lines).toEqual(['Verse line', 'Chorus line']);
    expect(sections).toEqual([{ lineIndex: 1, label: 'Chorus' }]);
  });

  it('extracts a "[Label]" bracketed section with its label', () => {
    const { lines, sections } = parseSong('Verse line\n[Bridge]\nBridge line');
    expect(lines).toEqual(['Verse line', 'Bridge line']);
    expect(sections).toEqual([{ lineIndex: 1, label: 'Bridge' }]);
  });

  it('records the section at the index of the line that follows it', () => {
    const { sections } = parseSong('[Intro]\nFirst line\nSecond line\n[Verse]\nThird line');
    expect(sections).toEqual([
      { lineIndex: 0, label: 'Intro' },
      { lineIndex: 2, label: 'Verse' },
    ]);
  });

  it('handles a song with no section markers at all', () => {
    const { lines, sections } = parseSong('Only\nplain\nlines');
    expect(lines).toEqual(['Only', 'plain', 'lines']);
    expect(sections).toEqual([]);
  });

  it('handles an empty song', () => {
    expect(parseSong('')).toEqual({ lines: [], chordedLines: [], sections: [] });
  });

  it('trims surrounding whitespace on each line', () => {
    const { lines } = parseSong('  Padded line  \n\tTabbed line\t');
    expect(lines).toEqual(['Padded line', 'Tabbed line']);
  });

  it('produces chordedLines with no chord data, one-to-one with lines', () => {
    const { chordedLines } = parseSong('Line one\nLine two');
    expect(chordedLines).toEqual([
      [
        { chord: null, text: 'Line' },
        { chord: null, text: 'one' },
      ],
      [
        { chord: null, text: 'Line' },
        { chord: null, text: 'two' },
      ],
    ]);
  });
});
