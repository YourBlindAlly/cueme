import { getAiProvider, type AiEnv } from './ai';
import { braveSearch } from './search/braveSearch';
import { buildExtractionPrompt, cleanAiResponse } from './promptBuilder';

export interface Env extends AiEnv {
  APP_SHARED_SECRET: string;
  BRAVE_API_KEY: string;
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

    const startedAt = Date.now();
    // Metadata-only logging (title/artist/success/timing/result count), per
    // the settled per-user-only / no-content-archive decision for this
    // feature — never log the actual lyrics/chords text itself. resultCount
    // and the reason split below exist specifically so these logs (viewable
    // in the Cloudflare dashboard's Worker Logs) double as a simple
    // evaluation layer: a low resultCount pointing at a search-query
    // problem looks very different from a healthy resultCount that still
    // comes back not_found_in_results, which points at the AI step instead.
    // No dashboard/DB needed for this — revisit only if the raw logs stop
    // being enough to tell what's going wrong.
    let resultCount = 0;
    const logResult = (success: boolean, extra?: Record<string, unknown>) => {
      console.log(
        JSON.stringify({
          event: 'song_search',
          title,
          artist,
          includeChords,
          success,
          resultCount,
          ms: Date.now() - startedAt,
          ...extra,
        })
      );
    };

    try {
      const query = `${title} ${artist} ${includeChords ? 'chords' : 'lyrics'}`.trim();
      const results = await braveSearch(env.BRAVE_API_KEY, query);
      resultCount = results.length;

      const provider = getAiProvider(env);
      const prompt = buildExtractionPrompt({ title, artist, includeChords, results });
      const raw = await provider.complete(prompt);
      const lyricsText = cleanAiResponse(raw);

      if (lyricsText === null) {
        logResult(false, { reason: resultCount === 0 ? 'no_search_results' : 'not_found_in_results' });
        return json(
          { error: `Couldn't find reliable lyrics for "${title}"${artist ? ` by ${artist}` : ''}.` },
          404
        );
      }

      logResult(true);
      return json({ title, artist, lyricsText });
    } catch (err) {
      logResult(false, { error: err instanceof Error ? err.message : String(err) });
      return json({ error: 'Search failed — try again in a moment.' }, 502);
    }
  },
};
