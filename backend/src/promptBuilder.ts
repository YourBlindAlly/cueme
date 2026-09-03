export const NOT_FOUND_SENTINEL = 'NOT_FOUND';
export const INCOMPLETE_SENTINEL = 'INCOMPLETE';

export type SongQuery = {
  title: string;
  artist: string;
  includeChords: boolean;
};

/**
 * Step 1 of 2: ask the AI to find and return ONE real page URL, nothing
 * else — deliberately does not ask it to reproduce, summarize, or even
 * describe the lyrics. Asking a model to search-and-recite copyrighted
 * lyrics in the same breath tends to trigger a copyright-caution refusal
 * (confirmed live, 2026-09-02 — see project notes); asking it to find a
 * source is a plain, uncontroversial search task.
 */
export function buildUrlSearchPrompt(
  { title, artist, includeChords }: SongQuery,
  excludeUrls: string[] = []
): string {
  const kind = includeChords ? 'chords/tab' : 'lyrics';
  const lines = [
    `Search the web and find ONE real, currently-accessible web page that has the actual, complete ${kind} for this specific song. Do not summarize, describe, or reproduce any of the song's words yourself — just locate a real page and return its address.`,
    '',
    `Song title: ${title}`,
    `Artist: ${artist || '(not specified)'}`,
  ];

  if (excludeUrls.length > 0) {
    lines.push(
      '',
      `Do not return any of these URLs — they were already tried and turned out to be unusable (incomplete, inaccessible, or otherwise unreliable): ${excludeUrls.join(', ')}. Find a genuinely different page.`
    );
  }

  lines.push(
    '',
    `Respond with exactly one URL and nothing else — no explanation, no markdown formatting, just the raw web address. If you can't find a real page with this song's ${kind}, respond with exactly: ${NOT_FOUND_SENTINEL}`
  );

  return lines.join('\n');
}

/** Extracts a single URL from the AI's step-1 response, or null if not found/invalid. */
export function cleanUrlResponse(raw: string): string | null {
  const text = raw.trim();
  if (text === NOT_FOUND_SENTINEL || text.length === 0) {
    return null;
  }
  // The model was told to answer with just a URL, but guard against a
  // stray wrapping sentence anyway by pulling the first http(s) URL out.
  const match = text.match(/https?:\/\/\S+/);
  if (!match) {
    return null;
  }
  try {
    return new URL(match[0].replace(/[).,'"]+$/, '')).toString();
  } catch {
    return null;
  }
}

/**
 * Step 2 of 2: given the REAL text already fetched from that page, ask the
 * AI to extract and reformat just the song lyrics/chords from it —
 * reformatting text it's been handed is a fundamentally different, far
 * less refusal-prone task than being asked to produce copyrighted content
 * from a search or from memory.
 */
export function buildReformatPrompt(
  { title, artist, includeChords }: SongQuery,
  pageText: string
): string {
  const chordInstructions = includeChords
    ? 'Include chords, placed inline directly before the syllable each chord change happens on, in square brackets — for example "[C]Amazing [G]grace, how [C]sweet the [F]sound". Use only chord names in the brackets (e.g. [G], [Am7], [D/F#]) — no chord diagrams, no tab notation, no strumming patterns.'
    : 'Do not include any chords, chord symbols, or brackets — plain lyrics text only.';

  return [
    `Below is the raw text content of a real web page. Extract and reformat ONLY the actual song lyrics from it — the words that are sung — removing everything else on the page: ads, navigation, comments, related-song links, site chrome, anything that isn't a real lyric line.`,
    '',
    `Song title: ${title}`,
    `Artist: ${artist || '(not specified)'}`,
    '',
    chordInstructions,
    '',
    "Output format: plain text only, one lyric line per line, in performance order (verses, choruses, bridge, etc., in the order they're actually sung). Do not include song structure labels, chord diagrams, tab notation, page headers/footers, ads, citations, source links, or any commentary — just the lines someone would read or sing aloud, line by line, while performing the song.",
    '',
    `If this page's text doesn't actually contain this song's real lyrics, respond with exactly: ${NOT_FOUND_SENTINEL}`,
    '',
    `Quality check, important: some pages only show part of a song, or the text below is cut off before reaching a real ending. Look at whether what you're extracting reaches a genuine, natural conclusion — a final chorus, a clear closing line, a fade-out repeat — versus just stopping mid-verse or mid-sentence with nothing that reads like an ending. If it looks cut short, respond with exactly: ${INCOMPLETE_SENTINEL} — never guess, invent, or fill in the missing part yourself, and never hand back a partial result as if it were the whole song.`,
    '',
    'PAGE TEXT:',
    pageText,
  ].join('\n');
}

/**
 * Cleans up the AI's raw response: strips a wrapping markdown code fence if
 * the model added one despite instructions, and returns null for the
 * not-found sentinel, the incomplete-source sentinel, or an empty
 * response — callers that need to distinguish "not found" from
 * "incomplete" for logging should check the raw trimmed text against
 * NOT_FOUND_SENTINEL/INCOMPLETE_SENTINEL themselves before calling this.
 */
export function cleanAiResponse(raw: string): string | null {
  let text = raw.trim();

  const fenceMatch = text.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  if (text === NOT_FOUND_SENTINEL || text === INCOMPLETE_SENTINEL || text.length === 0) {
    return null;
  }

  return text;
}

/**
 * Mechanical backstop for the AI's own completeness judgment, which
 * confirmed live (2026-09-02) does NOT reliably catch its own truncated
 * output — three real attempts in a row on the same song all cut off
 * mid-sentence ("...Well I don't know if I'm") without the model ever
 * flagging INCOMPLETE, apparently because when the source page itself
 * trails off, the model has no way to know more lyrics exist beyond what
 * it was given. This checks the actual output text's shape instead of
 * trusting the model's self-report.
 *
 * Two independent checks, both must pass:
 *  - Length: a real song is essentially never under MIN_LINES lines once
 *    reformatted one-line-per-lyric — confirmed live 2026-09-03 that a
 *    3-4 line fragment reached the app anyway, because the ending-shape
 *    check below has nothing to say about overall length at all. This
 *    catches that class of failure directly.
 *  - Ending shape: real lyrics almost always end on a real sentence
 *    (terminal punctuation) or a repeated hook/chorus line — text that
 *    just stops mid-word or mid-clause with neither is a strong,
 *    independent signal of truncation regardless of what the AI said.
 */
const MIN_LINES = 12;

export function looksComplete(lyricsText: string): boolean {
  const lines = lyricsText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < MIN_LINES) {
    return false;
  }

  const lastLine = lines[lines.length - 1];
  if (/[.!?"'”’)\]]\s*$/.test(lastLine)) {
    return true;
  }

  // A final line that repeats an earlier line (a chorus/hook fade-out) is
  // also a legitimate, real ending shape, even with no terminal punctuation.
  const normalized = lines.map((line) => line.toLowerCase());
  const lastNormalized = normalized[normalized.length - 1];
  return normalized.slice(0, -1).includes(lastNormalized);
}
