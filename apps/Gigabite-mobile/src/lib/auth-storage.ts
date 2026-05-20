import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'gigabite.mobile.authToken';

export async function saveAuthToken(token: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken() {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(AUTH_TOKEN_KEY) ?? null;
  }

  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function removeAuthToken() {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

function getWebStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  // Web-only development fallback. Native builds use expo-secure-store above.
  return window.sessionStorage;
}
