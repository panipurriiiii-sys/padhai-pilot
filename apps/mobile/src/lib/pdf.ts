import { Alert } from 'react-native';
import { apiClient } from '../services/api/client';

declare const require: ((moduleName: string) => any) | undefined;

/**
 * Downloads a server-rendered PDF (the institute's letterhead is applied by the API, never the platform name)
 * with the bearer token, stores it in the app cache and opens it in the device's PDF viewer.
 * Safe no-op with an Alert when the native module is missing.
 */
export async function openPdf(path: string, fileName: string): Promise<void> {
  const token = apiClient.getAuthToken();
  if (!token) {
    Alert.alert('Signed out', 'Sign in again to open this document.');
    return;
  }
  try {
    const mod = typeof require === 'function' ? require('react-native-blob-util') : null;
    const ReactNativeBlobUtil = mod?.default ?? mod;
    if (!ReactNativeBlobUtil?.config) throw new Error('PDF viewer unavailable on this build.');
    const safe = fileName.replace(/[^A-Za-z0-9._-]/g, '_');
    const target = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${safe}.pdf`;
    const res = await ReactNativeBlobUtil.config({ fileCache: true, path: target }).fetch(
      'GET',
      `${apiClient.getBaseUrl()}${path}`,
      { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
    );
    const status = res.info().status;
    if (status === 401) {
      apiClient.notifyUnauthorized();
      return;
    }
    if (status < 200 || status >= 300) {
      await ReactNativeBlobUtil.fs.unlink(target).catch(() => undefined);
      throw new Error(status === 403 || status === 404 ? 'This document is not available to you.' : `Server returned HTTP ${status}`);
    }
    await ReactNativeBlobUtil.android?.actionViewIntent(res.path(), 'application/pdf');
  } catch (e) {
    Alert.alert('Could not open document', e instanceof Error ? e.message : 'Unknown error');
  }
}
