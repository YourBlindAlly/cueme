import { resolveSetlistEntry } from './resolveSetlistEntry';
import type { Song } from '../types';

function makeSong(overrides: Partial<Song>): Song {
  return {
    id: 'id',
    title: 'Untitled',
    rawText: '',
    lines: ['line'],
    chordedLines: [[{ chord: null, text: 'line' }]],
    sections: [],
    source: { type: 'manual' },
    addedAt: 0,
    ...overrides,
  };
}

describe('resolveSetlistEntry', () => {
  it('matches by Dropbox path', () => {
    const target = makeSong({
      title: 'Beautiful Day',
      source: { type: 'dropbox', path: '/beautiful day - u2.cho' },
    });
    const other = makeSong({ title: 'Other Song', source: { type: 'dropbox', path: '/other.cho' } });
    const result = resolveSetlistEntry(
      { title: 'Beautiful Day', path: '/beautiful day - u2.cho' },
      [other, target]
    );
    expect(result).toBe(target);
  });

  it('falls back to a case-insensitive title match when the path is not found', () => {
    const target = makeSong({ title: 'Beautiful Day', source: { type: 'manual' } });
    const result = resolveSetlistEntry({ title: 'beautiful day', path: '/moved.cho' }, [target]);
    expect(result).toBe(target);
  });

  it('returns null when neither path nor title matches anything in the library', () => {
    const result = resolveSetlistEntry({ title: 'Nope', path: '/nope.cho' }, [
      makeSong({ title: 'Something Else' }),
    ]);
    expect(result).toBeNull();
  });

  it('returns null for an entry with no path and no matching title', () => {
    const result = resolveSetlistEntry({ title: '', path: '' }, [makeSong({ title: 'Anything' })]);
    expect(result).toBeNull();
  });
});
