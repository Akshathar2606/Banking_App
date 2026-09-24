import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Key used to store the JWT across all platforms. */
const TOKEN_KEY = 'bankease_auth_token';

// ── Platform-specific helpers ─────────────────────────────────────────────────

/**
 * Web: localStorage is synchronous but we wrap it in async functions
 * so the public API stays identical to the native (SecureStore) path.
 *
 * Native (iOS/Android): expo-secure-store uses the device keychain/keystore.
 */

const web = {
  save: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
  },
  get: async (key: string): Promise<string | null> => {
    return localStorage.getItem(key);
  },
  remove: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
  },
};

const native = {
  save:   (key: string, value: string): Promise<void>         => SecureStore.setItemAsync(key, value),
  get:    (key: string): Promise<string | null>               => SecureStore.getItemAsync(key),
  remove: (key: string): Promise<void>                        => SecureStore.deleteItemAsync(key),
};

const storage = Platform.OS === 'web' ? web : native;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Persist the JWT after a successful login.
 * Never call this with a plain-text password.
 */
export const saveToken = async (token: string): Promise<void> => {
  await storage.save(TOKEN_KEY, token);
};

/**
 * Retrieve the stored JWT.
 * Returns null if no token is found.
 */
export const getToken = async (): Promise<string | null> => {
  return storage.get(TOKEN_KEY);
};

/**
 * Delete the stored JWT (used on logout or session expiry).
 */
export const removeToken = async (): Promise<void> => {
  await storage.remove(TOKEN_KEY);
};
