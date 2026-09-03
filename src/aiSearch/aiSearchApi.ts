import { AI_SEARCH_APP_SECRET, AI_SEARCH_BACKEND_URL } from './config';

export type AiSearchResult = {
  title: string;
  artist: string;
  lyricsText: string;
};

/**
 * Calls the CueMe song-search backend (see backend/ in this repo). Throws
 * with a message suitable to show directly to Rusty in an Alert — the
 * backend already returns human-readable `error` strings for the cases
 * that are expected to happen in normal use (not found, misconfigured).
 */
export async function searchSongWithAi(
  title: string,
  artist: string,
  includeChords: boolean
): Promise<AiSearchResult> {
  const res = await fetch(AI_SEARCH_BACKEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Secret': AI_SEARCH_APP_SECRET,
    },
    body: JSON.stringify({ title, artist, includeChords }),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // fall through to the generic status-based error below
  }

  if (!res.ok) {
    const errorData = data && typeof data === 'object' ? (data as { error?: unknown; detail?: unknown }) : null;
    const message =
      errorData && typeof errorData.error === 'string' ? errorData.error : `Search failed (${res.status})`;
    // `detail` (present on unexpected backend failures, not on the
    // expected "couldn't find lyrics" case) carries the real underlying
    // reason — appended so a failure is self-diagnosable from the app's
    // own error alert instead of needing to dig through Worker logs.
    const detail = errorData && typeof errorData.detail === 'string' ? errorData.detail : null;
    throw new Error(detail ? `${message}\n\n${detail}` : message);
  }

  const result = data as Partial<AiSearchResult> | null;
  if (!result || typeof result.lyricsText !== 'string') {
    throw new Error('Search returned an unexpected response.');
  }

  return {
    title: result.title ?? title,
    artist: result.artist ?? artist,
    lyricsText: result.lyricsText,
  };
}
