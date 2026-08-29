import { extractArtistFromPath } from './artistFromFilename';

describe('extractArtistFromPath', () => {
  it('extracts the artist from a clean "Title - Artist.ext" filename', () => {
    expect(extractArtistFromPath('/beautiful day - u2.cho')).toBe('u2');
    expect(extractArtistFromPath('/just the way you are - bruno mars.pro')).toBe('bruno mars');
  });

  it('splits on the first separator, not the last, when there are two', () => {
    expect(
      extractArtistFromPath('/it never rains in southern california - albert hammond - 1972.chopro')
    ).toBe('albert hammond');
  });

  it('strips a trailing arrangement-variant suffix from the artist', () => {
    expect(extractArtistFromPath('/fix you - coldplay - alt.pro')).toBe('coldplay');
    expect(extractArtistFromPath('/moon river - andy williams - easier.pro')).toBe('andy williams');
  });

  it('returns null when there is no " - " separator at all', () => {
    expect(extractArtistFromPath('/countingstars.pro')).toBeNull();
  });

  it('returns null when the artist portion is empty after stripping', () => {
    expect(extractArtistFromPath('/some title - .pro')).toBeNull();
  });

  it('ignores any leading folder path, using only the filename', () => {
    expect(extractArtistFromPath('/setlists/beautiful day - u2.cho')).toBe('u2');
  });
});
