import { migrateSong } from './migrateSong';
import type { Song } from '../types';

function makeSong(overrides: Partial<Song>): Song {
  return {
    id: 'id',
    title: 'Untitled',
    rawText: 'Line one\nLine two',
    lines: ['Line one', 'Line two'],
    chordedLines: [],
    sections: [],
    source: { type: 'manual' },
    addedAt: 0,
    ...overrides,
  };
}

describe('migrateSong', () => {
  it('leaves a song that already has chordedLines untouched', () => {
    const song = makeSong({ chordedLines: [[{ chord: 'G', text: 'Line' }]] });
    expect(migrateSong(song)).toBe(song);
  });

  it('derives chordedLines from lines when the field is missing (pre-update persisted data)', () => {
    // Simulates JSON.parse of data saved before chordedLines existed —
    // the field is simply absent, not an empty array.
    const legacy = makeSong({}) as unknown as Record<string, unknown>;
    delete legacy.chordedLines;
    const migrated = migrateSong(legacy as unknown as Song);
    expect(migrated.chordedLines).toEqual([
      [{ chord: null, text: 'Line' }, { chord: null, text: 'one' }],
      [{ chord: null, text: 'Line' }, { chord: null, text: 'two' }],
    ]);
  });

  it('does not mutate every other field when migrating', () => {
    const legacy = makeSong({ title: 'My Song', key: 'G' }) as unknown as Record<string, unknown>;
    delete legacy.chordedLines;
    const migrated = migrateSong(legacy as unknown as Song);
    expect(migrated.title).toBe('My Song');
    expect(migrated.key).toBe('G');
    expect(migrated.lines).toEqual(['Line one', 'Line two']);
  });
});
