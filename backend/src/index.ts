import {
  fetchCommunityFile,
  searchCommunityLibrary,
  type CommunityLibraryEnv,
} from './communityLibrary';

export interface Env extends CommunityLibraryEnv {
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

type SearchRequestBody = { query?: string };
type FetchRequestBody = { path?: string };

async function handleSearch(request: Request, env: Env): Promise<Response> {
  let body: SearchRequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const query = (body.query ?? '').trim();
  if (!query) {
    return json({ error: 'query is required' }, 400);
  }

  const startedAt = Date.now();
  try {
    const results = await searchCommunityLibrary(env, query);
    // Metadata-only logging (the query text and how many results came
    // back), same "never log actual song content" policy this backend has
    // always used — see the git history of this file for the equivalent
    // AI-search-era logging this replaces.
    console.log(JSON.stringify({ event: 'library_search', query, resultCount: results.length, ms: Date.now() - startedAt }));
    return json({ results });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ event: 'library_search', query, error: detail, ms: Date.now() - startedAt }));
    return json({ error: 'Search failed — try again in a moment.', detail }, 502);
  }
}

async function handleFetch(request: Request, env: Env): Promise<Response> {
  let body: FetchRequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const path = (body.path ?? '').trim();
  if (!path) {
    return json({ error: 'path is required' }, 400);
  }

  try {
    const content = await fetchCommunityFile(env, path);
    return json({ content });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ event: 'library_fetch', path, error: detail }));
    return json({ error: "Couldn't load that song — try again in a moment.", detail }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (request.method !== 'POST' || (url.pathname !== '/search' && url.pathname !== '/fetch')) {
      return json({ error: 'Not found' }, 404);
    }

    if (!env.APP_SHARED_SECRET || request.headers.get('X-App-Secret') !== env.APP_SHARED_SECRET) {
      return json({ error: 'Unauthorized' }, 401);
    }

    if (url.pathname === '/fetch') {
      return handleFetch(request, env);
    }
    return handleSearch(request, env);
  },
};
