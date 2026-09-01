import type { SearchResult } from './search/braveSearch';

export const NOT_FOUND_SENTINEL = 'NOT_FOUND';

export type BuildExtractionPromptInput = {
  title: string;
  artist: string;
  includeChords: boolean;
  results: SearchResult[];
};

/**
 * Builds the prompt for the AI extraction step. Kept as a pure function
 * (no network calls) so it's unit-testable without hitting a real provider.
 */
export function buildExtractionPrompt(input: BuildExtractionPromptInput): string {
  const { title, artist, includeChords, results } = input;

  const resultsBlock =
    results.length > 0
      ? results.map((r, i) => `${i + 1}. ${r.title}\n${r.url}\n${r.description}`).join('\n\n')
      : '(no search results)';

  const chordInstructions = includeChords
    ? 'Include chords, placed inline directly before the syllable each chord change happens on, in square brackets — for example "[C]Amazing [G]grace, how [C]sweet the [F]sound". Use only chord names in the brackets (e.g. [G], [Am7], [D/F#]) — no chord diagrams, no tab notation, no strumming patterns.'
    : 'Do not include any chords, chord symbols, or brackets — plain lyrics text only.';

  return [
    `You are helping find the real, accurate lyrics${includeChords ? ' and chords' : ''} for a specific song, using only the web search results below as your source of truth. Do not use lyrics from memory and do not invent anything.`,
    '',
    `Song title: ${title}`,
    `Artist: ${artist || '(not specified)'}`,
    '',
    'Search results:',
    resultsBlock,
    '',
    chordInstructions,
    '',
    "Output format: plain text only, one lyric line per line, in performance order (verses, choruses, bridge, etc., in the order they're actually sung). Do not include song structure labels, chord diagrams, tab notation, page headers/footers, ads, or any commentary — just the lines someone would read or sing aloud, line by line, while performing the song.",
    '',
    `If none of the search results actually contain this song's real lyrics with reasonable confidence, respond with exactly: ${NOT_FOUND_SENTINEL}`,
  ].join('\n');
}

/**
 * Cleans up the AI's raw response: strips a wrapping markdown code fence if
 * the model added one despite instructions, and returns null for the
 * not-found sentinel or an empty response.
 */
export function cleanAiResponse(raw: string): string | null {
  let text = raw.trim();

  const fenceMatch = text.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  if (text === NOT_FOUND_SENTINEL || text.length === 0) {
    return null;
  }

  return text;
}
