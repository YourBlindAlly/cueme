jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadLibrary, removeLibrarySong, upsertLibrarySong } from './libraryStorage';
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

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('upsertLibrarySong', () => {
  it('adds a new song', async () => {
    const song = makeSong({ id: 'a', title: 'Song A' });
    const result = await upsertLibrarySong(song);
    expect(result).toEqual([song]);
  });

  it('replaces an existing entry with the same id', async () => {
    await upsertLibrarySong(makeSong({ id: 'a', title: 'Old title', addedAt: 1 }));
    const updated = makeSong({ id: 'a', title: 'New title', addedAt: 2 });
    const result = await upsertLibrarySong(updated);
    expect(result).toEqual([updated]);
  });

  it('replaces a stale re-import of the same Dropbox file instead of duplicating it (the real Counting Stars bug)', async () => {
    const stale = makeSong({
      id: 'old-id',
      title: 'Counting Stars (with junk line)',
      addedAt: 1,
      source: { type: 'dropbox', path: '/counting stars - onerepublic.pro' },
    });
    await upsertLibrarySong(stale);

    const freshReimport = makeSong({
      id: 'new-id',
      title: 'Counting Stars',
      addedAt: 2,
      source: { type: 'dropbox', path: '/counting stars - onerepublic.pro' },
    });
    const result = await upsertLibrarySong(freshReimport);

    expect(result).toEqual([freshReimport]);
  });

  it('does not merge two different Dropbox songs that happen to share no path', async () => {
    const a = makeSong({
      id: 'a',
      title: 'Song A',
      source: { type: 'dropbox', path: '/a.pro' },
    });
    const b = makeSong({
      id: 'b',
      title: 'Song B',
      source: { type: 'dropbox', path: '/b.pro' },
    });
    await upsertLibrarySong(a);
    const result = await upsertLibrarySong(b);
    expect(result.map((s) => s.id).sort()).toEqual(['a', 'b']);
  });

  it('does not dedupe two separately pasted (non-Dropbox) songs just because they share a title', async () => {
    const a = makeSong({ id: 'a', title: 'Draft', addedAt: 1, source: { type: 'manual' } });
    const b = makeSong({ id: 'b', title: 'Draft', addedAt: 2, source: { type: 'manual' } });
    await upsertLibrarySong(a);
    const result = await upsertLibrarySong(b);
    expect(result.map((s) => s.id).sort()).toEqual(['a', 'b']);
  });
});

describe('removeLibrarySong', () => {
  it('removes only the matching id', async () => {
    await upsertLibrarySong(makeSong({ id: 'a' }));
    await upsertLibrarySong(makeSong({ id: 'b' }));
    const result = await removeLibrarySong('a');
    expect(result.map((s) => s.id)).toEqual(['b']);
  });
});

describe('loadLibrary', () => {
  it('returns an empty array when nothing has been saved', async () => {
    expect(await loadLibrary()).toEqual([]);
  });
});
