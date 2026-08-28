/** One lyric word, with the chord that sits immediately before it in the source, if any. */
export type ChordedWord = { chord: string | null; text: string };

// Matches either a bracketed chord token or a run of non-space, non-bracket
// characters (a word) — deliberately excludes '[' and ']' from the word
// alternative so a chord glued directly onto a word with no space (e.g.
// "cares[G]") still splits into two separate tokens instead of one blob.
const CHORD_OR_WORD_RE = /\[([^\]]*)\]|([^\s[\]]+)/g;

/**
 * Tokenizes a raw ChordPro lyric line (chords still in [brackets]) into
 * words, each carrying the chord that immediately preceded it, if any. A
 * chord with no following word on the line (a trailing "[G]" at line's end)
 * has nothing to attach to and is dropped — there's no word left to speak it
 * before.
 */
export function tokenizeChordedLine(rawLine: string): ChordedWord[] {
  const words: ChordedWord[] = [];
  let pendingChord: string | null = null;
  let match: RegExpExecArray | null;
  CHORD_OR_WORD_RE.lastIndex = 0;
  while ((match = CHORD_OR_WORD_RE.exec(rawLine)) !== null) {
    const [, chordGroup, wordGroup] = match;
    if (chordGroup !== undefined) {
      const trimmedChord = chordGroup.trim();
      if (trimmedChord) {
        pendingChord = trimmedChord;
      }
    } else if (wordGroup !== undefined) {
      words.push({ chord: pendingChord, text: wordGroup });
      pendingChord = null;
    }
  }
  return words;
}

/** For plain (non-ChordPro) lyric lines, which never carry chord data. */
export function tokenizePlainLine(rawLine: string): ChordedWord[] {
  return rawLine
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ chord: null, text }));
}
