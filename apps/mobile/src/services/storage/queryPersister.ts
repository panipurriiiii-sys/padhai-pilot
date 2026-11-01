import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/**
 * High-performance offline cache persister for React Query.
 * Saves query caches into device flash memory (AsyncStorage) with a 24-hour cache window.
 * Exactly like Instagram / Twitter:
 * 1. App opens -> instantly renders previously fetched data from disk (0ms delay).
 * 2. Background query executes -> silently updates local cache without flickering.
 * 3. Offline / No internet -> user can still browse all loaded timetables, diaries, homework, results.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'PADHAI_PILOT_OFFLINE_CACHE_V1',
  throttleTime: 1000, // Debounce writes to disk to prevent I/O bottlenecks
});
