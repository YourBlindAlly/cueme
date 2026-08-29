import { sortDropboxEntriesForDisplay } from './sortDropboxEntries';
import type { DropboxEntry } from './dropboxApi';

function file(name: string, path: string, modifiedAt?: string): DropboxEntry {
  return { name, path, isFolder: false, modifiedAt };
}
function folder(name: string, path: string): DropboxEntry {
  return { name, path, isFolder: true };
}

describe('sortDropboxEntriesForDisplay', () => {
  it('keeps folders ahead of files regardless of mode, folders sorted by name', () => {
    const entries = [
      file('B Song.pro', '/b song.pro'),
      folder('Zeta Folder', '/zeta folder'),
      folder('Alpha Folder', '/alpha folder'),
      file('A Song.pro', '/a song.pro'),
    ];
    const result = sortDropboxEntriesForDisplay(entries, 'titleAZ');
    expect(result.map((e) => e.name)).toEqual([
      'Alpha Folder',
      'Zeta Folder',
      'A Song.pro',
      'B Song.pro',
    ]);
  });

  it('sorts files by name for titleAZ', () => {
    const entries = [file('Zebra.pro', '/zebra.pro'), file('Apple.pro', '/apple.pro')];
    expect(sortDropboxEntriesForDisplay(entries, 'titleAZ').map((e) => e.name)).toEqual([
      'Apple.pro',
      'Zebra.pro',
    ]);
  });

  it('sorts files by most-recently-modified first for newest', () => {
    const entries = [
      file('Old.pro', '/old.pro', '2024-01-01T00:00:00Z'),
      file('New.pro', '/new.pro', '2026-01-01T00:00:00Z'),
    ];
    expect(sortDropboxEntriesForDisplay(entries, 'newest').map((e) => e.name)).toEqual([
      'New.pro',
      'Old.pro',
    ]);
  });

  it('sorts files by artist extracted from the filename for artistAZ', () => {
    const entries = [
      file('Song One - Zeta Band.pro', '/song one - zeta band.pro'),
      file('Song Two - Alpha Band.pro', '/song two - alpha band.pro'),
    ];
    expect(sortDropboxEntriesForDisplay(entries, 'artistAZ').map((e) => e.name)).toEqual([
      'Song Two - Alpha Band.pro',
      'Song One - Zeta Band.pro',
    ]);
  });

  it('groups files with no extractable artist at the end, sorted by name', () => {
    const entries = [
      file('Zeta Title - Known Artist.pro', '/zeta title - known artist.pro'),
      file('NoDashHere.pro', '/nodashhere.pro'),
    ];
    expect(sortDropboxEntriesForDisplay(entries, 'artistAZ').map((e) => e.name)).toEqual([
      'Zeta Title - Known Artist.pro',
      'NoDashHere.pro',
    ]);
  });
});
