/**
 * Dropbox "App key" (public client identifier — not a secret, safe to embed).
 * To get one: create an app at https://www.dropbox.com/developers/apps
 * ("Scoped access", "App folder" or "Full Dropbox" per your preference),
 * add `files.metadata.read` and `files.content.read` under Permissions, and
 * add this app's redirect URI (printed in the Settings tab once the app is
 * connected on a device) under OAuth 2 > Redirect URIs.
 *
 * Until this is set, the Dropbox connect flow shows a friendly message
 * instead of attempting to start — everything else in the app works fine
 * without it.
 */
export const DROPBOX_APP_KEY = '0iibd4asi022p7w';

export const DROPBOX_DISCOVERY = {
  authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
  tokenEndpoint: 'https://api.dropboxapi.com/oauth2/token',
};
