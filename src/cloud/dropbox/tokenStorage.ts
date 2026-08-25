import * as SecureStore from 'expo-secure-store';
import { TokenResponse } from 'expo-auth-session';

const TOKEN_KEY = 'cueme.dropboxToken';

export async function saveDropboxToken(token: TokenResponse): Promise<void> {
  if (!(await SecureStore.isAvailableAsync())) {
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(token.getRequestConfig()));
}

export async function loadDropboxToken(): Promise<TokenResponse | null> {
  if (!(await SecureStore.isAvailableAsync())) {
    return null;
  }
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) {
    return null;
  }
  return new TokenResponse(JSON.parse(raw));
}

export async function clearDropboxToken(): Promise<void> {
  if (!(await SecureStore.isAvailableAsync())) {
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
