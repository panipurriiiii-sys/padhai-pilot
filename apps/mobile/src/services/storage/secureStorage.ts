/**
 * Secure Token Storage Fallback Pattern for PadhaiPilot Mobile (React Native CLI).
 *
 * Implements a layered abstraction for cryptographic credential storage:
 * 1. Hardware-backed OS Keychain / Keystore via `react-native-keychain` (when present)
 * 2. Hardware-encrypted shared preferences via `react-native-encrypted-storage` (when present)
 * 3. Graceful in-memory fallback adapter (guarantees zero crashes during tests, web builds,
 *    simulators without Keystore hardware, or when native dependencies are absent).
 *
 * Strictly adheres to rule 38 ("Never crash the app because of device features")
 * and rule 72 ("Proper null safety and fallbacks everywhere").
 */

import type { MobileUserSession } from '../api/authService';

declare const require: ((moduleName: string) => any) | undefined;

export type StorageBackendType = 'keychain' | 'encrypted-storage' | 'memory';

export interface SecureStorageAdapter {
  readonly backend: StorageBackendType;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface KeychainModule {
  setGenericPassword(
    username: string,
    password: string,
    options?: { service?: string; accessible?: string },
  ): Promise<unknown>;
  getGenericPassword(options?: { service?: string }): Promise<
    false | { username: string; password: string; service?: string }
  >;
  resetGenericPassword(options?: { service?: string }): Promise<boolean>;
}

export interface EncryptedStorageModule {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryStorageAdapter implements SecureStorageAdapter {
  readonly backend: StorageBackendType = 'memory';
  private readonly memory = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.memory.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.memory.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.memory.delete(key);
  }

  async clear(): Promise<void> {
    this.memory.clear();
  }
}

export class KeychainStorageAdapter implements SecureStorageAdapter {
  readonly backend: StorageBackendType = 'keychain';
  private readonly fallback = new Map<string, string>();

  constructor(private readonly keychain: KeychainModule) {}

  async getItem(key: string): Promise<string | null> {
    try {
      const result = await this.keychain.getGenericPassword({ service: key });
      if (result && typeof result === 'object' && 'password' in result) {
        return result.password;
      }
      return null;
    } catch {
      return this.fallback.get(key) ?? null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.keychain.setGenericPassword('padhai_secure_user', value, { service: key });
    } catch {
      this.fallback.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.keychain.resetGenericPassword({ service: key });
    } catch {
      this.fallback.delete(key);
    }
  }

  async clear(): Promise<void> {
    this.fallback.clear();
  }
}

export class EncryptedStorageAdapter implements SecureStorageAdapter {
  readonly backend: StorageBackendType = 'encrypted-storage';
  private readonly fallback = new Map<string, string>();

  constructor(private readonly storage: EncryptedStorageModule) {}

  async getItem(key: string): Promise<string | null> {
    try {
      const val = await this.storage.getItem(key);
      return val ?? null;
    } catch {
      return this.fallback.get(key) ?? null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.storage.setItem(key, value);
    } catch {
      this.fallback.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.storage.removeItem(key);
    } catch {
      this.fallback.delete(key);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.storage.clear();
    } catch {
      this.fallback.clear();
    }
  }
}

export function detectNativeAdapter(): SecureStorageAdapter {
  if (typeof require === 'function') {
    try {
      const kc = require('react-native-keychain');
      if (kc && typeof kc.getGenericPassword === 'function') {
        return new KeychainStorageAdapter(kc);
      }
    } catch {
      // Keychain module not installed or unlinked
    }

    try {
      const es = require('react-native-encrypted-storage');
      const target = es?.default ?? es;
      if (target && typeof target.getItem === 'function') {
        return new EncryptedStorageAdapter(target);
      }
    } catch {
      // EncryptedStorage module not installed or unlinked
    }
  }

  return new MemoryStorageAdapter();
}

export class SecureStorageManager implements SecureStorageAdapter {
  private activeAdapter: SecureStorageAdapter;
  private readonly fallbackAdapter = new MemoryStorageAdapter();

  constructor(initialAdapter?: SecureStorageAdapter) {
    this.activeAdapter = initialAdapter ?? detectNativeAdapter();
  }

  get backend(): StorageBackendType {
    return this.activeAdapter.backend;
  }

  setAdapter(adapter: SecureStorageAdapter): void {
    this.activeAdapter = adapter;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const value = await this.activeAdapter.getItem(key);
      if (value !== null) return value;
      return await this.fallbackAdapter.getItem(key);
    } catch {
      return await this.fallbackAdapter.getItem(key);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.activeAdapter.setItem(key, value);
    } catch {
      // Native storage failed, ensure fallback succeeds
      await this.fallbackAdapter.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.activeAdapter.removeItem(key);
    } catch {
      // Ignored
    }
    await this.fallbackAdapter.removeItem(key);
  }

  async clear(): Promise<void> {
    try {
      await this.activeAdapter.clear();
    } catch {
      // Ignored
    }
    await this.fallbackAdapter.clear();
  }
}

export const secureStorage = new SecureStorageManager();

export const AUTH_TOKEN_KEY = 'padhai_auth_token_v1';
export const USER_SESSION_KEY = 'padhai_user_session_v1';

export const tokenStorage = {
  getBackend: (): StorageBackendType => secureStorage.backend,

  async getAuthToken(): Promise<string | null> {
    return secureStorage.getItem(AUTH_TOKEN_KEY);
  },

  async setAuthToken(token: string): Promise<void> {
    if (!token || typeof token !== 'string') return;
    await secureStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  async removeAuthToken(): Promise<void> {
    await secureStorage.removeItem(AUTH_TOKEN_KEY);
  },

  async getSession(): Promise<MobileUserSession | null> {
    const raw = await secureStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof parsed.token === 'string' && parsed.user?.role) {
        return parsed as MobileUserSession;
      }
    } catch {
      // Non-fatal JSON parse error
    }
    return null;
  },

  async setSession(session: MobileUserSession): Promise<void> {
    if (!session?.token) return;
    await Promise.all([
      secureStorage.setItem(AUTH_TOKEN_KEY, session.token),
      secureStorage.setItem(USER_SESSION_KEY, JSON.stringify(session)),
    ]);
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      secureStorage.removeItem(AUTH_TOKEN_KEY),
      secureStorage.removeItem(USER_SESSION_KEY),
    ]);
  },
};
