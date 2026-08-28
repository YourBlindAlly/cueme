import { isJunkLine } from './junkLineFilter';

describe('isJunkLine', () => {
  it('flags a bare https URL', () => {
    expect(isJunkLine('https://www.youtube.com/watch?v=Yim4--J44gk')).toBe(true);
  });

  it('flags a URL combined with a capo note on the same line', () => {
    expect(isJunkLine(' https://www.youtube.com/watch?v=Yim4--J44gk  Capo 2')).toBe(true);
  });

  it('flags a www. link with no protocol', () => {
    expect(isJunkLine('www.ultimate-guitar.com/tab/some-song')).toBe(true);
  });

  it('flags a standalone capo note', () => {
    expect(isJunkLine('Capo 2')).toBe(true);
    expect(isJunkLine('Capo: 3rd fret')).toBe(true);
    expect(isJunkLine('capo no capo')).toBe(true);
  });

  it('does not flag a real lyric line', () => {
    expect(isJunkLine("Lately, I've been, I've been losing sleep")).toBe(false);
  });

  it('does not flag a real lyric line whose first word merely starts with "capo"', () => {
    expect(isJunkLine('Capon crowed at dawn over the yard')).toBe(false);
  });
});
