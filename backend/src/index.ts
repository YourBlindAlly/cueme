import { getAiProvider, type AiEnv } from './ai';
import type { AiProvider } from './ai/types';
import {
  buildReformatPrompt,
  buildUrlSearchPrompt,
  cleanAiResponse,
  cleanUrlResponse,
  INCOMPLETE_SENTINEL,
  looksComplete,
  type SongQuery,
} from './promptBuilder';
import { fetchPageText } from './fetchPage';

export interface Env extends AiEnv {
  APP_SHARED_SECRET: string;
}

// How many different candidate pages to try before giving an honest "this
// didn't work" answer, per Rusty's explicit request 2026-09-02 — real
// testing that day found the completeness gate correctly rejecting most
// first attempts, so a single try wasn't good enough to be worth charging
// a credit for.
const MAX_ATTEMPTS = 3;

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

type FeedbackRequestBody = {
  title?: string;
  artist?: string;
  includeChords?: boolean;
  sourceUrl?: string;
  rating?: string;
};

type AttemptResult =
  | { status: 'success'; lyricsText: string; sourceUrl: string }
  | { status: 'no_url' }
  | { status: 'fetch_failed'; sourceUrl: string; error: string }
  | { status: 'incomplete_ai_flagged'; sourceUrl: string }
  | { status: 'incomplete_shape'; sourceUrl: string }
  | { status: 'not_found_on_page'; sourceUrl: string };

/**
 * One full search-fetch-reformat cycle. Provider-level failures (auth, a
 * malformed API response, etc.) are deliberately NOT caught here — those
 * propagate up and abort the whole request immediately, since retrying the
 * exact same broken API call three times would just hide a real,
 * actionable error behind a generic "didn't work" message. Only content-
 * quality problems (nothing found, fetch failed, result judged incomplete)
 * become a retryable AttemptResult.
 */
async function attemptOnce(
  provider: AiProvider,
  query: SongQuery,
  excludeUrls: string[]
): Promise<AttemptResult> {
  const urlPrompt = buildUrlSearchPrompt(query, excludeUrls);
  const urlRaw = await provider.complete(urlPrompt);
  const foundUrl = cleanUrlResponse(urlRaw);

  if (foundUrl === null) {
    return { status: 'no_url' };
  }

  let pageText: string;
  try {
    pageText = await fetchPageText(foundUrl);
  } catch (err) {
    return { status: 'fetch_failed', sourceUrl: foundUrl, error: err instanceof Error ? err.message : String(err) };
  }

  const reformatPrompt = buildReformatPrompt(query, pageText);
  const raw = await provider.complete(reformatPrompt);
  const trimmedRaw = raw.trim();
  const lyricsText = cleanAiResponse(raw);

  if (lyricsText === null) {
    return {
      status: trimmedRaw === INCOMPLETE_SENTINEL ? 'incomplete_ai_flagged' : 'not_found_on_page',
      sourceUrl: foundUrl,
    };
  }

  // Second, independent check — the AI's own completeness judgment above
  // doesn't reliably catch its own truncated output (confirmed live,
  // 2026-09-02), so this never trusts that alone.
  if (!looksComplete(lyricsText)) {
    return { status: 'incomplete_shape', sourceUrl: foundUrl };
  }

  return { status: 'success', lyricsText, sourceUrl: foundUrl };
}

/**
 * A human verdict on one search result — cancelling the review screen
 * without saving logs 'rejected', saving logs 'accepted' — sitting
 * alongside the automated song_search logs from the same event, so a real
 * human "this was actually bad" (or good) signal is visible next to the
 * gate's own mechanical reasoning, not just inferred from it. Metadata
 * only, same as everywhere else in this feature — never the lyrics text.
 */
async function handleFeedback(request: Request): Promise<Response> {
  let body: FeedbackRequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const rating = body.rating === 'accepted' || body.rating === 'rejected' ? body.rating : null;
  if (!rating) {
    return json({ error: 'rating must be "accepted" or "rejected"' }, 400);
  }

  console.log(
    JSON.stringify({
      event: 'song_search_feedback',
      title: (body.title ?? '').trim(),
      artist: (body.artist ?? '').trim(),
      includeChords: body.includeChords === true,
      sourceUrl: body.sourceUrl ?? null,
      rating,
    })
  );

  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (request.method !== 'POST' || (url.pathname !== '/search' && url.pathname !== '/feedback')) {
      return json({ error: 'Not found' }, 404);
    }

    if (!env.APP_SHARED_SECRET || request.headers.get('X-App-Secret') !== env.APP_SHARED_SECRET) {
      return json({ error: 'Unauthorized' }, 401);
    }

    if (url.pathname === '/feedback') {
      return handleFeedback(request);
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

    const query: SongQuery = { title, artist, includeChords };
    const startedAt = Date.now();
    // Metadata-only logging (title/artist/success/timing/attempt reasons),
    // per the settled per-user-only / no-content-archive decision for this
    // feature — never log the actual lyrics/chords text itself. The
    // per-attempt reasons are exactly the "how much are we wasting on the
    // back end" data — viewable in Cloudflare's Worker Logs.
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
      const triedUrls: string[] = [];
      const attemptReasons: string[] = [];
      let lastResult: AttemptResult | null = null;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const result = await attemptOnce(provider, query, triedUrls);
        lastResult = result;
        attemptReasons.push(result.status);

        if (result.status === 'success') {
          break;
        }
        if ('sourceUrl' in result) {
          triedUrls.push(result.sourceUrl);
        }
      }

      logResult(lastResult?.status === 'success', {
        attempts: attemptReasons.length,
        reasons: attemptReasons,
        ...(lastResult && 'sourceUrl' in lastResult ? { sourceUrl: lastResult.sourceUrl } : {}),
      });

      if (lastResult?.status === 'success') {
        return json({ title, artist, lyricsText: lastResult.lyricsText, sourceUrl: lastResult.sourceUrl });
      }

      // Honest final response — say plainly that multiple different
      // sources were tried and none worked out, not just "not found" as
      // if only a single attempt happened.
      const triedCount = attemptReasons.length;
      const message =
        triedCount > 1
          ? `Tried ${triedCount} different sources for "${title}"${artist ? ` by ${artist}` : ''} and couldn't get a complete, reliable result from any of them.`
          : `Couldn't find a page with lyrics for "${title}"${artist ? ` by ${artist}` : ''}.`;
      return json({ error: message }, 404);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      logResult(false, { error: detail });
      // `detail` surfaces the real underlying error (a provider's own API
      // error message, a config problem like an unset/misspelled secret,
      // etc.) — worth keeping in the response, not just the logs, since
      // this app has no other users yet and a specific reason is far more
      // useful for troubleshooting than a generic message every time.
      return json({ error: 'Search failed — try again in a moment.', detail }, 502);
    }
  },
};
