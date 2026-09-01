/**
 * Song-search backend config. Fill these in once the Cloudflare Worker is
 * deployed (see backend/SETUP.txt in this repo):
 *  - AI_SEARCH_BACKEND_URL: the Worker's *.workers.dev URL, ending in
 *    "/search" (e.g. "https://cueme-song-search.your-subdomain.workers.dev/search").
 *  - AI_SEARCH_APP_SECRET: must exactly match the Worker's APP_SHARED_SECRET
 *    secret. This is a simple shared-secret check, not real per-user
 *    authentication — just enough to stop a stranger who finds the URL from
 *    running up the API bill. Fine for personal use; would need real auth
 *    before any wider release.
 *
 * Until AI_SEARCH_BACKEND_URL is set, the Find a Song screen shows a
 * friendly "not set up yet" message instead of attempting a request —
 * everything else in the app works fine without it, same pattern as the
 * Dropbox app key in cloud/dropbox/config.ts.
 */
export const AI_SEARCH_BACKEND_URL = '';
export const AI_SEARCH_APP_SECRET = '';

export function isAiSearchConfigured(): boolean {
  return AI_SEARCH_BACKEND_URL.trim().length > 0;
}
