import { chordToSpeech } from './chordPronunciation';

describe('chordToSpeech', () => {
  it('speaks a bare major chord as just the note', () => {
    expect(chordToSpeech('G')).toBe('G');
    expect(chordToSpeech('D')).toBe('D');
  });

  it('speaks sharps and flats', () => {
    expect(chordToSpeech('F#')).toBe('F sharp');
    expect(chordToSpeech('Bb')).toBe('B flat');
  });

  it('speaks a minor chord', () => {
    expect(chordToSpeech('Am')).toBe('A minor');
    expect(chordToSpeech('Bm')).toBe('B minor');
  });

  it('speaks numbered and sus chords', () => {
    expect(chordToSpeech('G7')).toBe('G seven');
    expect(chordToSpeech('Gsus4')).toBe('G sus four');
    expect(chordToSpeech('Asus4')).toBe('A sus four');
    expect(chordToSpeech('A5')).toBe('A five');
  });

  it('speaks major seven and minor seven chords', () => {
    expect(chordToSpeech('Fmaj7')).toBe('F major seven');
    expect(chordToSpeech('Em7')).toBe('E minor seven');
    expect(chordToSpeech('Am7')).toBe('A minor seven');
  });

  it('combines an accidental with a quality', () => {
    expect(chordToSpeech('Bbmaj7')).toBe('B flat major seven');
  });

  it('speaks a slash chord as "root over bass"', () => {
    expect(chordToSpeech('G/B')).toBe('G over B');
  });

  it('speaks diminished and augmented chords', () => {
    expect(chordToSpeech('Cdim')).toBe('C diminished');
    expect(chordToSpeech('Caug')).toBe('C augmented');
  });

  it('handles "no chord" markers', () => {
    expect(chordToSpeech('N.C.')).toBe('no chord');
    expect(chordToSpeech('NC')).toBe('no chord');
  });

  it('falls back to reading the root plus the raw suffix for an unknown quality', () => {
    expect(chordToSpeech('Gm11')).toBe('G m11');
  });

  it('handles empty input', () => {
    expect(chordToSpeech('')).toBe('');
    expect(chordToSpeech('   ')).toBe('');
  });
});
