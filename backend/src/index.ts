import { getAiProvider, type AiEnv } from './ai';
import { buildExtractionPrompt, cleanAiResponse } from './promptBuilder';

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
      // The AI provider does its own web search and reads real pages
      // itself (see backend/src/ai/*.ts) — there's no separate search step
      // here anymore.
      const provider = getAiProvider(env);
      const prompt = buildExtractionPrompt({ title, artist, includeChords });
      const raw = await provider.complete(prompt);
      const lyricsText = cleanAiResponse(raw);

      if (lyricsText === null) {
        logResult(false, { reason: 'not_found' });
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
