/**
 * Song-search backend config. Left BLANK here on purpose and filled in at
 * build time by each build workflow, from the AI_SEARCH_BACKEND_URL and
 * AI_SEARCH_APP_SECRET GitHub repo secrets — never commit real values into
 * this file. This repo is public; a real value committed here would be
 * readable by anyone on GitHub, defeating the whole point of a shared
 * secret (unlike the Dropbox app key elsewhere, which really is safe to
 * embed since Dropbox designed it as a public client identifier, this one
 * is a real secret). Repo secret names kept as AI_SEARCH_* even though this
 * backend no longer does AI search — same secret values, renaming them in
 * GitHub isn't necessary, see backend/SETUP.txt.
 *
 *  - SEARCH_BACKEND_URL: the Worker's *.workers.dev URL, ending in
 *    "/search" (e.g. "https://cueme-song-search.your-subdomain.workers.dev/search").
 *  - SEARCH_APP_SECRET: must exactly match the Worker's APP_SHARED_SECRET
 *    secret. This is a simple shared-secret check, not real per-user
 *    authentication — just enough to stop a stranger who finds the URL from
 *    running searches through your account. Fine for personal use; would
 *    need real auth before any wider release.
 *
 * Until SEARCH_BACKEND_URL is set (locally for testing, or injected at
 * build time for a real build), the Search screen shows a friendly "not
 * set up yet" message instead of attempting a request — everything else in
 * the app works fine without it, same pattern as the Dropbox app key in
 * cloud/dropbox/config.ts.
 */
export const SEARCH_BACKEND_URL = '';
export const SEARCH_APP_SECRET = '';

export function isSearchConfigured(): boolean {
  return SEARCH_BACKEND_URL.trim().length > 0;
}
