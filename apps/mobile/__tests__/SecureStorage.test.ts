import {
  secureStorage,
  tokenStorage,
  MemoryStorageAdapter,
  KeychainStorageAdapter,
  EncryptedStorageAdapter,
  KeychainModule,
  EncryptedStorageModule,
} from '../src/services/storage/secureStorage';
import { authService, MobileUserSession } from '../src/services/api/authService';
import { apiClient } from '../src/services/api/client';

describe('Secure Storage Abstraction & Fallback Pattern', () => {
  beforeEach(async () => {
    await secureStorage.clear();
    secureStorage.setAdapter(new MemoryStorageAdapter());
    apiClient.setAuthToken(null);
  });

  describe('MemoryStorageAdapter', () => {
    it('sets, gets, removes, and clears items in memory', async () => {
      const adapter = new MemoryStorageAdapter();
      expect(adapter.backend).toBe('memory');

      expect(await adapter.getItem('key1')).toBeNull();
      await adapter.setItem('key1', 'val1');
      expect(await adapter.getItem('key1')).toBe('val1');

      await adapter.removeItem('key1');
      expect(await adapter.getItem('key1')).toBeNull();

      await adapter.setItem('key2', 'val2');
      await adapter.clear();
      expect(await adapter.getItem('key2')).toBeNull();
    });
  });

  describe('KeychainStorageAdapter', () => {
    it('interacts with Keychain when available', async () => {
      const mockStorage = new Map<string, string>();
      const mockKeychain: KeychainModule = {
        setGenericPassword: jest.fn(async (_u, pass, opts) => {
          mockStorage.set(opts?.service || 'default', pass);
          return true;
        }),
        getGenericPassword: jest.fn(async (opts) => {
          const pass = mockStorage.get(opts?.service || 'default');
          return pass ? { username: 'user', password: pass, service: opts?.service } : false;
        }),
        resetGenericPassword: jest.fn(async (opts) => {
          mockStorage.delete(opts?.service || 'default');
          return true;
        }),
      };

      const adapter = new KeychainStorageAdapter(mockKeychain);
      expect(adapter.backend).toBe('keychain');

      await adapter.setItem('auth_key', 'token_xyz');
      expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith('padhai_secure_user', 'token_xyz', { service: 'auth_key' });

      const retrieved = await adapter.getItem('auth_key');
      expect(retrieved).toBe('token_xyz');

      await adapter.removeItem('auth_key');
      expect(await adapter.getItem('auth_key')).toBeNull();
    });

    it('falls back seamlessly to internal memory when Keychain throws native exception', async () => {
      const throwingKeychain: KeychainModule = {
        setGenericPassword: jest.fn().mockRejectedValue(new Error('Keystore locked')),
        getGenericPassword: jest.fn().mockRejectedValue(new Error('Hardware unavailable')),
        resetGenericPassword: jest.fn().mockRejectedValue(new Error('Hardware unavailable')),
      };

      const adapter = new KeychainStorageAdapter(throwingKeychain);
      // setItem will catch the error and fallback to memory
      await adapter.setItem('token', 'fallback_val');
      // getItem catches error and retrieves fallback
      expect(await adapter.getItem('token')).toBe('fallback_val');
    });
  });

  describe('EncryptedStorageAdapter', () => {
    it('interacts with EncryptedStorage when available', async () => {
      const store = new Map<string, string>();
      const mockES: EncryptedStorageModule = {
        setItem: jest.fn(async (k, v) => { store.set(k, v); }),
        getItem: jest.fn(async (k) => store.get(k) ?? null),
        removeItem: jest.fn(async (k) => { store.delete(k); }),
        clear: jest.fn(async () => { store.clear(); }),
      };

      const adapter = new EncryptedStorageAdapter(mockES);
      expect(adapter.backend).toBe('encrypted-storage');

      await adapter.setItem('jwt', 'header.payload.signature');
      expect(await adapter.getItem('jwt')).toBe('header.payload.signature');

      await adapter.removeItem('jwt');
      expect(await adapter.getItem('jwt')).toBeNull();
    });

    it('falls back to internal memory if EncryptedStorage rejects', async () => {
      const faultyES: EncryptedStorageModule = {
        setItem: jest.fn().mockRejectedValue(new Error('Decryption failure')),
        getItem: jest.fn().mockRejectedValue(new Error('Decryption failure')),
        removeItem: jest.fn().mockRejectedValue(new Error('Decryption failure')),
        clear: jest.fn().mockRejectedValue(new Error('Decryption failure')),
      };

      const adapter = new EncryptedStorageAdapter(faultyES);
      await adapter.setItem('key', 'resilient_data');
      expect(await adapter.getItem('key')).toBe('resilient_data');
    });
  });

  describe('tokenStorage session helpers', () => {
    it('stores and retrieves raw auth token', async () => {
      expect(await tokenStorage.getAuthToken()).toBeNull();
      await tokenStorage.setAuthToken('bearer_12345');
      expect(await tokenStorage.getAuthToken()).toBe('bearer_12345');
      await tokenStorage.removeAuthToken();
      expect(await tokenStorage.getAuthToken()).toBeNull();
    });

    it('stores, retrieves, and clears full user session', async () => {
      const mockSession: MobileUserSession = {
        token: 'jwt_mock_token',
        user: {
          id: 'user_1',
          email: 'student@padhaipilot.com',
          name: 'Ananya Sharma',
          role: 'STUDENT',
          instituteId: 'inst_1',
          batchName: 'Class 10 - Alpha',
        },
      };

      await tokenStorage.setSession(mockSession);
      const retrieved = await tokenStorage.getSession();
      expect(retrieved).toEqual(mockSession);
      expect(await tokenStorage.getAuthToken()).toBe('jwt_mock_token');

      await tokenStorage.clearSession();
      expect(await tokenStorage.getSession()).toBeNull();
      expect(await tokenStorage.getAuthToken()).toBeNull();
    });

    it('returns null on corrupted session data without crashing', async () => {
      await secureStorage.setItem('padhai_user_session_v1', 'not-valid-json');
      expect(await tokenStorage.getSession()).toBeNull();
    });
  });

  describe('authService session restoration and role guards', () => {
    it('restores valid student session into apiClient', async () => {
      const validStudent: MobileUserSession = {
        token: 'student_token_abc',
        user: {
          id: 's1',
          email: 'student@test.com',
          name: 'Student One',
          role: 'STUDENT',
          instituteId: 'inst_1',
        },
      };

      await tokenStorage.setSession(validStudent);
      const restored = await authService.restoreStoredSession();
      expect(restored).toEqual(validStudent);
      expect(apiClient.getAuthToken()).toBe('student_token_abc');
    });

    it('restores valid teacher session into apiClient', async () => {
      const validTeacher: MobileUserSession = {
        token: 'teacher_token_xyz',
        user: {
          id: 't1',
          email: 'teacher@test.com',
          name: 'Teacher One',
          role: 'TEACHER',
          instituteId: 'inst_1',
        },
      };

      await tokenStorage.setSession(validTeacher);
      const restored = await authService.restoreStoredSession();
      expect(restored).toEqual(validTeacher);
      expect(apiClient.getAuthToken()).toBe('teacher_token_xyz');
    });

    it('purges and rejects a stored super-admin session', async () => {
      const adminSession = {
        token: 'admin_tok',
        user: {
          id: 'adm1',
          email: 'admin@test.com',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          instituteId: 'inst_1',
        },
      } as unknown as MobileUserSession;

      await secureStorage.setItem('padhai_user_session_v1', JSON.stringify(adminSession));
      await secureStorage.setItem('padhai_auth_token_v1', 'admin_tok');

      const restored = await authService.restoreStoredSession();
      expect(restored).toBeNull();
      expect(apiClient.getAuthToken()).toBeNull();
      expect(await tokenStorage.getSession()).toBeNull();
    });
  });
});
