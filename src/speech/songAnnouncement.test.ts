import { buildSongAnnouncement } from './songAnnouncement';

describe('buildSongAnnouncement', () => {
  it('includes the key when known', () => {
    expect(buildSongAnnouncement('Beautiful Day', 'A')).toBe('Beautiful Day, Key of A');
  });

  it('omits the key phrase entirely when no key is known', () => {
    expect(buildSongAnnouncement('Beautiful Day', undefined)).toBe('Beautiful Day');
  });

  it('omits the key phrase when the key is an empty/whitespace string', () => {
    expect(buildSongAnnouncement('Beautiful Day', '   ')).toBe('Beautiful Day');
  });

  it('trims surrounding whitespace on both title and key', () => {
    expect(buildSongAnnouncement('  Beautiful Day  ', '  A  ')).toBe('Beautiful Day, Key of A');
  });
});
