/**
 * Song-search backend config. Left BLANK here on purpose and filled in at
 * build time by build-unsigned-ipa.yml, from the AI_SEARCH_BACKEND_URL and
 * AI_SEARCH_APP_SECRET GitHub repo secrets — never commit real values into
 * this file. This repo is public; a real value committed here would be
 * readable by anyone on GitHub, defeating the whole point of
 * AI_SEARCH_APP_SECRET (unlike the Dropbox app key below, which really is
 * safe to embed since Dropbox designed it as a public client identifier,
 * this one is a real secret).
 *
 *  - AI_SEARCH_BACKEND_URL: the Worker's *.workers.dev URL, ending in
 *    "/search" (e.g. "https://cueme-song-search.your-subdomain.workers.dev/search").
 *  - AI_SEARCH_APP_SECRET: must exactly match the Worker's APP_SHARED_SECRET
 *    secret. This is a simple shared-secret check, not real per-user
 *    authentication — just enough to stop a stranger who finds the URL from
 *    running up the API bill. Fine for personal use; would need real auth
 *    before any wider release.
 *
 * Until AI_SEARCH_BACKEND_URL is set (locally for testing, or injected at
 * build time for a real build), the Search for a Song screen shows a
 * friendly "not set up yet" message instead of attempting a request — everything
 * else in the app works fine without it, same pattern as the Dropbox app
 * key in cloud/dropbox/config.ts.
 */
export const AI_SEARCH_BACKEND_URL = '';
export const AI_SEARCH_APP_SECRET = '';

export function isAiSearchConfigured(): boolean {
  return AI_SEARCH_BACKEND_URL.trim().length > 0;
}
