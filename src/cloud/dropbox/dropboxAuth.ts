import { useCallback, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import { DROPBOX_APP_KEY, DROPBOX_DISCOVERY } from './config';
import { clearDropboxToken, loadDropboxToken, saveDropboxToken } from './tokenStorage';

export const isDropboxConfigured = DROPBOX_APP_KEY.length > 0;

/**
 * Returns a valid (refreshed if necessary) Dropbox access token, or null if
 * not connected. Used by the API layer before every request.
 */
export async function getValidDropboxAccessToken(): Promise<string | null> {
  const token = await loadDropboxToken();
  if (!token) {
    return null;
  }
  if (!token.shouldRefresh()) {
    return token.accessToken;
  }
  if (!token.refreshToken) {
    return token.accessToken;
  }
  const refreshed = await token.refreshAsync(
    { clientId: DROPBOX_APP_KEY },
    DROPBOX_DISCOVERY
  );
  await saveDropboxToken(refreshed);
  return refreshed.accessToken;
}

export function useDropboxAuth() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isDropboxConfigured) {
      setIsChecking(false);
      return;
    }
    (async () => {
      const token = await loadDropboxToken();
      setIsConnected(!!token);
      setIsChecking(false);
    })();
  }, []);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'cueme' });

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: DROPBOX_APP_KEY,
      redirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['files.metadata.read', 'files.content.read'],
      extraParams: { token_access_type: 'offline' },
    },
    DROPBOX_DISCOVERY
  );

  const connect = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!request) {
      return { success: false, error: 'Not ready yet — try again in a moment.' };
    }
    const result = await promptAsync();
    if (result.type !== 'success' || !result.params.code) {
      return { success: false };
    }
    try {
      const token = await AuthSession.exchangeCodeAsync(
        {
          clientId: DROPBOX_APP_KEY,
          code: result.params.code,
          redirectUri,
          extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
        },
        DROPBOX_DISCOVERY
      );
      await saveDropboxToken(token);
      setIsConnected(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Connection failed.' };
    }
  }, [request, promptAsync, redirectUri]);

  const disconnect = useCallback(async () => {
    await clearDropboxToken();
    setIsConnected(false);
  }, []);

  return { isConnected, isChecking, connect, disconnect, redirectUri };
}
