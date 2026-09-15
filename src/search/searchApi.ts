import { SEARCH_APP_SECRET, SEARCH_BACKEND_URL } from './config';

// SEARCH_BACKEND_URL always ends in "/search" — the fetch endpoint lives
// alongside it on the same Worker.
const FETCH_URL = SEARCH_BACKEND_URL.replace(/\/search$/, '/fetch');

export type SearchResult = {
  title: string;
  artist: string | null;
  key: string | null;
  path: string;
};

async function postJson(url: string, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-App-Secret': SEARCH_APP_SECRET },
    body: JSON.stringify(body),
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
    const detail = errorData && typeof errorData.detail === 'string' ? errorData.detail : null;
    throw new Error(detail ? `${message}\n\n${detail}` : message);
  }

  return data;
}

/** Searches the song library. Empty results just mean nothing matched — not an error. */
export async function searchLibrary(query: string): Promise<SearchResult[]> {
  const data = await postJson(SEARCH_BACKEND_URL, { query });
  const results = data && typeof data === 'object' ? (data as { results?: unknown }).results : null;
  if (!Array.isArray(results)) {
    throw new Error('Search returned an unexpected response.');
  }
  return results.map((r) => ({
    title: typeof r.title === 'string' ? r.title : '',
    artist: typeof r.artist === 'string' ? r.artist : null,
    key: typeof r.key === 'string' ? r.key : null,
    path: typeof r.path === 'string' ? r.path : '',
  }));
}

/** Downloads one search result's raw file content, by the `path` from a SearchResult. */
export async function fetchSearchResult(path: string): Promise<string> {
  const data = await postJson(FETCH_URL, { path });
  const content = data && typeof data === 'object' ? (data as { content?: unknown }).content : null;
  if (typeof content !== 'string') {
    throw new Error('Search returned an unexpected response.');
  }
  return content;
}
