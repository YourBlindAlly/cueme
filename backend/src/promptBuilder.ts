export const NOT_FOUND_SENTINEL = 'NOT_FOUND';

export type BuildExtractionPromptInput = {
  title: string;
  artist: string;
  includeChords: boolean;
};

/**
 * Builds the prompt for the AI provider's own web-search-enabled call. Kept
 * as a pure function (no network calls) so it's unit-testable. Deliberately
 * instructs the model to search and read a real page rather than answer
 * from its own memory — a model that already "knows" a famous song's
 * lyrics will otherwise recite a plausible-sounding but unverified
 * version instead of what's actually written on a real source.
 */
export function buildExtractionPrompt(input: BuildExtractionPromptInput): string {
  const { title, artist, includeChords } = input;

  const chordInstructions = includeChords
    ? 'Include chords, placed inline directly before the syllable each chord change happens on, in square brackets — for example "[C]Amazing [G]grace, how [C]sweet the [F]sound". Use only chord names in the brackets (e.g. [G], [Am7], [D/F#]) — no chord diagrams, no tab notation, no strumming patterns.'
    : 'Do not include any chords, chord symbols, or brackets — plain lyrics text only.';

  return [
    `Search the web and find the real, accurate lyrics${includeChords ? ' and chords' : ''} for this specific song. Only use what you actually find on a real page you search for and read — never fill in or guess from your own memory of the song, even if you recognize it confidently. If you can't find a page with reliable, complete lyrics, say so rather than guessing.`,
    '',
    `Song title: ${title}`,
    `Artist: ${artist || '(not specified)'}`,
    '',
    chordInstructions,
    '',
    "Output format: plain text only, one lyric line per line, in performance order (verses, choruses, bridge, etc., in the order they're actually sung). Do not include song structure labels, chord diagrams, tab notation, page headers/footers, ads, or any commentary — just the lines someone would read or sing aloud, line by line, while performing the song.",
    '',
    `If you can't find a page with reliable, complete lyrics for this song, respond with exactly: ${NOT_FOUND_SENTINEL}`,
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
