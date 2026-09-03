import { getAiProvider, type AiEnv } from './ai';
import {
  buildReformatPrompt,
  buildUrlSearchPrompt,
  cleanAiResponse,
  cleanUrlResponse,
  INCOMPLETE_SENTINEL,
  looksComplete,
} from './promptBuilder';
import { fetchPageText } from './fetchPage';

export interface Env extends AiEnv {
  APP_SHARED_SECRET: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-App-Secret',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

type SearchRequestBody = {
  title?: string;
  artist?: string;
  includeChords?: boolean;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/search' || request.method !== 'POST') {
      return json({ error: 'Not found' }, 404);
    }

    if (!env.APP_SHARED_SECRET || request.headers.get('X-App-Secret') !== env.APP_SHARED_SECRET) {
      return json({ error: 'Unauthorized' }, 401);
    }

    let body: SearchRequestBody;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const title = (body.title ?? '').trim();
    const artist = (body.artist ?? '').trim();
    const includeChords = body.includeChords === true;

    if (!title) {
      return json({ error: 'title is required' }, 400);
    }

    const query = { title, artist, includeChords };
    const startedAt = Date.now();
    // Metadata-only logging (title/artist/success/timing), per the settled
    // per-user-only / no-content-archive decision for this feature — never
    // log the actual lyrics/chords text itself.
    const logResult = (success: boolean, extra?: Record<string, unknown>) => {
      console.log(
        JSON.stringify({
          event: 'song_search',
          title,
          artist,
          includeChords,
          success,
          ms: Date.now() - startedAt,
          ...extra,
        })
      );
    };

    try {
      const provider = getAiProvider(env);

      // Step 1: find a real source page — deliberately NOT asked to
      // reproduce any lyrics itself, just locate one. Asking a model to
      // search-and-recite copyrighted lyrics in the same call reliably
      // triggers a copyright-caution refusal (confirmed live, 2026-09-02).
      const urlPrompt = buildUrlSearchPrompt(query);
      const urlRaw = await provider.complete(urlPrompt);
      const foundUrl = cleanUrlResponse(urlRaw);

      if (foundUrl === null) {
        logResult(false, { reason: 'no_url_found' });
        return json(
          { error: `Couldn't find a page with lyrics for "${title}"${artist ? ` by ${artist}` : ''}.` },
          404
        );
      }

      // Step 2: fetch that real page directly (plain HTTP, no AI
      // involved), then ask the AI to reformat the text it's been handed
      // — a fundamentally different, much less refusal-prone task than
      // being asked to produce copyrighted lyrics from a search.
      const pageText = await fetchPageText(foundUrl);
      const reformatPrompt = buildReformatPrompt(query, pageText);
      const raw = await provider.complete(reformatPrompt);
      const trimmedRaw = raw.trim();
      const lyricsText = cleanAiResponse(raw);

      if (lyricsText === null) {
        // Quality gate: a real result never reaches the user unless it
        // passed the completeness check baked into the reformat prompt —
        // distinguishing "incomplete" from "not found" here, and logging
        // it, is exactly what turns "does this actually work well enough
        // to charge for" from a guess into a measurable rate over time.
        const isIncomplete = trimmedRaw === INCOMPLETE_SENTINEL;
        logResult(false, { reason: isIncomplete ? 'incomplete_source' : 'not_found_on_page', sourceUrl: foundUrl });
        const message = isIncomplete
          ? `Found a page for "${title}"${artist ? ` by ${artist}` : ''}, but it only had part of the song — try again, or add it manually.`
          : `Found a page but couldn't extract reliable lyrics for "${title}"${artist ? ` by ${artist}` : ''}.`;
        return json({ error: message }, 404);
      }

      // Second, independent check — the AI's own completeness judgment
      // above doesn't reliably catch its own truncated output (confirmed
      // live), so this never trusts that alone.
      if (!looksComplete(lyricsText)) {
        logResult(false, { reason: 'incomplete_shape', sourceUrl: foundUrl });
        return json(
          {
            error: `Found a page for "${title}"${artist ? ` by ${artist}` : ''}, but the result looked cut off — try again, or add it manually.`,
            // TEMPORARY, 2026-09-02: surfacing the actual rejected text's
            // tail end to check whether looksComplete is correctly
            // catching real truncation or being too strict — remove once
            // that's confirmed either way.
            debugTail: lyricsText.slice(-200),
          },
          404
        );
      }

      logResult(true, { sourceUrl: foundUrl });
      return json({ title, artist, lyricsText });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      logResult(false, { error: detail });
      // `detail` surfaces the real underlying error (a provider's own API
      // error message, a page-fetch failure, a config problem like an
      // unset/misspelled secret, etc.) — worth keeping in the response,
      // not just the logs, since this app has no other users yet and a
      // specific reason is far more useful for troubleshooting than a
      // generic message every time.
      return json({ error: 'Search failed — try again in a moment.', detail }, 502);
    }
  },
};
