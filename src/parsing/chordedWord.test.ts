import { tokenizeChordedLine, tokenizePlainLine } from './chordedWord';

describe('tokenizeChordedLine', () => {
  it('attaches a chord to the word immediately following it', () => {
    expect(tokenizeChordedLine('[G]Amazing [C]grace')).toEqual([
      { chord: 'G', text: 'Amazing' },
      { chord: 'C', text: 'grace' },
    ]);
  });

  it('leaves words with no preceding chord unattached', () => {
    expect(tokenizeChordedLine('[G]Amazing grace, how [C]sweet the sound')).toEqual([
      { chord: 'G', text: 'Amazing' },
      { chord: null, text: 'grace,' },
      { chord: null, text: 'how' },
      { chord: 'C', text: 'sweet' },
      { chord: null, text: 'the' },
      { chord: null, text: 'sound' },
    ]);
  });

  it('splits a chord glued directly onto the end of a word with no space', () => {
    expect(tokenizeChordedLine('Someone who cares[G]')).toEqual([
      { chord: null, text: 'Someone' },
      { chord: null, text: 'who' },
      { chord: null, text: 'cares' },
    ]);
  });

  it('drops a trailing chord with no following word to attach to', () => {
    expect(tokenizeChordedLine('Reach out and touch faith [G] [Em]')).toEqual([
      { chord: null, text: 'Reach' },
      { chord: null, text: 'out' },
      { chord: null, text: 'and' },
      { chord: null, text: 'touch' },
      { chord: null, text: 'faith' },
    ]);
  });

  it('reassembles a word split by a chord glued on both sides', () => {
    expect(tokenizeChordedLine('It was won[C]derful')).toEqual([
      { chord: null, text: 'It' },
      { chord: null, text: 'was' },
      { chord: 'C', text: 'wonderful' },
    ]);
  });

  it('reassembles a word split by two chords glued on both sides, keeping the first chord', () => {
    expect(tokenizeChordedLine('won[C]der[D]ful')).toEqual([{ chord: 'C', text: 'wonderful' }]);
  });

  it('handles a line with no chords at all', () => {
    expect(tokenizeChordedLine('Plain lyric line')).toEqual([
      { chord: null, text: 'Plain' },
      { chord: null, text: 'lyric' },
      { chord: null, text: 'line' },
    ]);
  });

  it('handles an empty line', () => {
    expect(tokenizeChordedLine('')).toEqual([]);
  });
});

describe('tokenizePlainLine', () => {
  it('produces words with no chord data', () => {
    expect(tokenizePlainLine('Plain lyric line')).toEqual([
      { chord: null, text: 'Plain' },
      { chord: null, text: 'lyric' },
      { chord: null, text: 'line' },
    ]);
  });
});
