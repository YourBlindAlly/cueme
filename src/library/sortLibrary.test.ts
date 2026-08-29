import { sortLibraryForDisplay } from './sortLibrary';
import type { Song } from '../types';

function makeSong(overrides: Partial<Song>): Song {
  return {
    id: 'id',
    title: 'Untitled',
    rawText: 'line',
    lines: ['line'],
    chordedLines: [[{ chord: null, text: 'line' }]],
    sections: [],
    source: { type: 'manual' },
    addedAt: 0,
    ...overrides,
  };
}

describe('sortLibraryForDisplay', () => {
  it('leaves "newest" order untouched', () => {
    const library = [makeSong({ id: 'b', title: 'B' }), makeSong({ id: 'a', title: 'A' })];
    expect(sortLibraryForDisplay(library, 'newest')).toBe(library);
  });

  it('sorts by title A-Z regardless of source', () => {
    const library = [
      makeSong({ id: '1', title: 'Zebra' }),
      makeSong({ id: '2', title: 'Apple' }),
      makeSong({ id: '3', title: 'Mango' }),
    ];
    expect(sortLibraryForDisplay(library, 'titleAZ').map((s) => s.title)).toEqual([
      'Apple',
      'Mango',
      'Zebra',
    ]);
  });

  it('sorts by artist A-Z extracted from Dropbox filenames', () => {
    const library = [
      makeSong({
        id: '1',
        title: 'Song One',
        source: { type: 'dropbox', path: '/song one - zeta band.pro' },
      }),
      makeSong({
        id: '2',
        title: 'Song Two',
        source: { type: 'dropbox', path: '/song two - alpha band.pro' },
      }),
    ];
    expect(sortLibraryForDisplay(library, 'artistAZ').map((s) => s.title)).toEqual([
      'Song Two',
      'Song One',
    ]);
  });

  it('groups songs with no extractable artist at the end, sorted by title', () => {
    const library = [
      makeSong({
        id: '1',
        title: 'Zeta Title',
        source: { type: 'dropbox', path: '/zeta title - known artist.pro' },
      }),
      makeSong({ id: '2', title: 'B Pasted', source: { type: 'manual' } }),
      makeSong({ id: '3', title: 'A Pasted', source: { type: 'manual' } }),
    ];
    expect(sortLibraryForDisplay(library, 'artistAZ').map((s) => s.title)).toEqual([
      'Zeta Title',
      'A Pasted',
      'B Pasted',
    ]);
  });

  it('breaks ties between same-artist songs by title', () => {
    const library = [
      makeSong({
        id: '1',
        title: 'Zebra Song',
        source: { type: 'dropbox', path: '/zebra song - same artist.pro' },
      }),
      makeSong({
        id: '2',
        title: 'Apple Song',
        source: { type: 'dropbox', path: '/apple song - same artist.pro' },
      }),
    ];
    expect(sortLibraryForDisplay(library, 'artistAZ').map((s) => s.title)).toEqual([
      'Apple Song',
      'Zebra Song',
    ]);
  });
});
