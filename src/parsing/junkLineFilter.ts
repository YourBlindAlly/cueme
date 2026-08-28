// Some raw tab/chord-site files (and occasionally a hand-pasted lyric) carry
// a stray non-lyric line — a source URL, a "Capo 2" note — that isn't marked
// with any directive or comment syntax, so the parser would otherwise speak
// it as if it were a real lyric line. General prose-aside filtering isn't
// reliably automatable (a file can contain arbitrary unmarked commentary
// with no distinguishing shape), but these two specific patterns are safe to
// drop unconditionally — neither has ever been a real sung lyric.

const URL_RE = /https?:\/\/\S+|www\.\S+/i;
const CAPO_ONLY_RE = /^capo\b/i;

/** True if `line` is junk (a stray URL or capo note) rather than real lyric content. */
export function isJunkLine(line: string): boolean {
  const trimmed = line.trim();
  return URL_RE.test(trimmed) || CAPO_ONLY_RE.test(trimmed);
}
