import { parseSetlistCsv, sanitizeSetlistFilename, serializeSetlistCsv } from './setlistCsv';

describe('serializeSetlistCsv / parseSetlistCsv round trip', () => {
  it('round-trips a simple list of entries', () => {
    const entries = [
      { title: 'Hey There Delilah', path: '/hey there delilah.cho' },
      { title: 'Beautiful Day', path: '/beautiful day.cho' },
    ];
    const csv = serializeSetlistCsv(entries);
    expect(parseSetlistCsv(csv)).toEqual(entries);
  });

  it('round-trips a title containing a comma and a quote', () => {
    const entries = [{ title: 'Rock, "Paper", Scissors', path: '/x.pro' }];
    const csv = serializeSetlistCsv(entries);
    expect(parseSetlistCsv(csv)).toEqual(entries);
  });

  it('produces just the header row for an empty setlist', () => {
    expect(serializeSetlistCsv([])).toBe('Title,Path');
  });

  it('parses an empty setlist (header only) back to an empty array', () => {
    expect(parseSetlistCsv('Title,Path')).toEqual([]);
  });

  it('parses completely empty input as an empty array', () => {
    expect(parseSetlistCsv('')).toEqual([]);
  });
});

describe('sanitizeSetlistFilename', () => {
  it('appends .csv to a plain name', () => {
    expect(sanitizeSetlistFilename('Friday Night Set')).toBe('Friday Night Set.csv');
  });

  it('strips characters not safe in a filename', () => {
    expect(sanitizeSetlistFilename('Set: Take 2 / Redo?')).toBe('Set Take 2  Redo.csv');
  });

  it('falls back to a default name when the input is empty after cleaning', () => {
    expect(sanitizeSetlistFilename('   ')).toBe('Untitled Setlist.csv');
    expect(sanitizeSetlistFilename('///')).toBe('Untitled Setlist.csv');
  });
});
