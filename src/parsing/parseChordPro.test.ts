import { parseChordPro } from './parseChordPro';

describe('parseChordPro', () => {
  it('extracts title and key from long-form directives', () => {
    const result = parseChordPro('{title: Amazing Grace}\n{key: G}\n[G]Amazing grace');
    expect(result.title).toBe('Amazing Grace');
    expect(result.key).toBe('G');
  });

  it('extracts title and key from short-form directives', () => {
    const result = parseChordPro('{t: Amazing Grace}\n{key: G}\nAmazing grace');
    expect(result.title).toBe('Amazing Grace');
    expect(result.key).toBe('G');
  });

  it('extracts key from the {meta: key X} alternative form', () => {
    const result = parseChordPro('{meta: key C}\nHello');
    expect(result.key).toBe('C');
  });

  it('strips inline chord brackets, keeping the lyric text', () => {
    const result = parseChordPro('[G]Amazing [C]grace, how [G]sweet the sound');
    expect(result.lines).toEqual(['Amazing grace, how sweet the sound']);
  });

  it('drops a bare chord-only line entirely once brackets are stripped', () => {
    const result = parseChordPro('[G] [C] [D]\nReal lyric line');
    expect(result.lines).toEqual(['Real lyric line']);
  });

  it('drops blank lines and # comment lines', () => {
    const result = parseChordPro('# a comment\n\nFirst line\n   \nSecond line');
    expect(result.lines).toEqual(['First line', 'Second line']);
  });

  it('maps start_of_chorus/verse/bridge onto section markers, ignoring end directives', () => {
    const result = parseChordPro(
      [
        'Verse line one',
        '{start_of_chorus}',
        'Chorus line',
        '{end_of_chorus}',
        '{sov}',
        'Verse line two',
      ].join('\n')
    );
    expect(result.lines).toEqual(['Verse line one', 'Chorus line', 'Verse line two']);
    expect(result.sections).toEqual([
      { lineIndex: 1, label: 'Chorus' },
      { lineIndex: 2, label: 'Verse' },
    ]);
  });

  it('drops content between start_of_tab/end_of_tab entirely, not line by line', () => {
    const result = parseChordPro(
      ['Before', '{sot}', 'e|---0---|', '{title: not a real title}', '{eot}', 'After'].join('\n')
    );
    expect(result.lines).toEqual(['Before', 'After']);
    expect(result.title).toBeNull();
  });

  it('drops content between start_of_grid/end_of_grid entirely', () => {
    const result = parseChordPro(['{sog}', '| G . . . |', '{eog}', 'Real line'].join('\n'));
    expect(result.lines).toEqual(['Real line']);
  });

  it('handles a directive with a -selector suffix by matching the base name', () => {
    const result = parseChordPro('{start_of_verse-soprano}\nHarmony line\n{end_of_verse}');
    expect(result.sections).toEqual([{ lineIndex: 0, label: 'Verse' }]);
    expect(result.lines).toEqual(['Harmony line']);
  });

  it('silently ignores unrecognized directives', () => {
    const result = parseChordPro('{x_custom_directive: whatever}\n{transpose: 2}\nReal line');
    expect(result.lines).toEqual(['Real line']);
  });

  it('returns null title/key when none are present', () => {
    const result = parseChordPro('Just a plain lyric line');
    expect(result.title).toBeNull();
    expect(result.key).toBeNull();
  });
});
