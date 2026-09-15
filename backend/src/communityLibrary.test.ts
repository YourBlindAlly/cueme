import { parseCommunityFilename } from './communityLibrary';

describe('parseCommunityFilename', () => {
  it('parses "Title - Artist [Key].ext"', () => {
    expect(parseCommunityFilename('Iko Iko - Sugar Boy James Crawford [G].pro')).toEqual({
      title: 'Iko Iko',
      artist: 'Sugar Boy James Crawford',
      key: 'G',
    });
  });

  it('parses "Title - Artist.ext" with no key', () => {
    expect(parseCommunityFilename('Hotel California - Eagles.pro')).toEqual({
      title: 'Hotel California',
      artist: 'Eagles',
      key: null,
    });
  });

  it('parses a bare "Title.ext" with no artist', () => {
    expect(parseCommunityFilename('Amazing Grace.pro')).toEqual({
      title: 'Amazing Grace',
      artist: null,
      key: null,
    });
  });

  it('keeps a title-embedded " - Alt" suffix intact rather than mistaking it for the artist separator', () => {
    // Split is on the LAST " - ", deliberately different from the app's own
    // extractArtistFromPath (first) — see the doc comment on
    // parseCommunityFilename for why that matters for real titles like this
    // one in the community library.
    expect(parseCommunityFilename('Rum And Coca Cola - Alt - Andrews Sisters.pro')).toEqual({
      title: 'Rum And Coca Cola - Alt',
      artist: 'Andrews Sisters',
      key: null,
    });
  });

  it('handles a multi-key value inside the brackets', () => {
    expect(parseCommunityFilename('Desperado - Eagles [Am, G].pro')).toEqual({
      title: 'Desperado',
      artist: 'Eagles',
      key: 'Am, G',
    });
  });

  it('handles a .chopro extension the same as .pro', () => {
    expect(parseCommunityFilename('Lovesong - The Cure.chopro')).toEqual({
      title: 'Lovesong',
      artist: 'The Cure',
      key: null,
    });
  });
});
