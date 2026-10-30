/**
 * Media Hosting Service Client (Powered by Cloudflare Worker at https://media.dhyey.cc/docs)
 * Highly resilient, production-hardened client with:
 *  - 20MB preflight file validation (per official docs limit)
 *  - Filename sanitization (removes non-ASCII, emojis, symbols, normalizes whitespace)
 *  - 3x jittered exponential backoff retries with per-attempt timeouts
 *  - Automatic fallback to backend serverless proxy (/api/tuition/media-upload) on CORS / DNS / Network failure
 *  - Detailed progress callback for smooth UX
 *  - PostgreSQL stores strictly metadata and URLs; binary blobs never touch PostgreSQL
 */

import { teacherApi } from './api';

export interface MediaUploadResult {
  url: string;
  data: string;
  fileName: string;
  fileSize: string;
  rawSize: number;
  mediaType: string;
}

export type ProgressCallback = (percent: number, statusText: string) => void;

export const MEDIA_HOST_ENDPOINT = 'https://media-hosting.dhyeyp254.workers.dev/upload';
export const MAX_MEDIA_SIZE_BYTES = 20 * 1024 * 1024; // 20MB limit per https://media.dhyey.cc/docs
const REQUEST_TIMEOUT_MS = 35000; // 35 seconds per attempt
const MAX_ATTEMPTS = 3;

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Sanitizes filename to prevent multipart boundary distortion or Telegram parser errors.
 * Preserves extension while ensuring safe alphanumeric characters.
 */
export function sanitizeFilename(originalName: string): string {
  if (!originalName) return 'document.pdf';
  const extMatch = originalName.match(/\.[0-9a-z]+$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';
  const baseName = originalName.replace(/\.[0-9a-z]+$/i, '');

  const cleanBase =
    baseName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^a-zA-Z0-9_\-]/g, '_') // replace non-alphanumeric with underscore
      .replace(/_+/g, '_') // collapse consecutive underscores
      .replace(/^_|_$/g, '') || 'document'; // trim leading/trailing underscores

  return `${cleanBase}${ext || '.pdf'}`;
}

/**
 * Converts a File / Blob to a Base64 string for serverless proxy transport.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file for fallback upload.'));
    reader.readAsDataURL(file);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Highly resilient upload with preflight checks, 3 retries, and backend proxy fallback.
 */
export async function uploadMediaFile(
  file: File,
  onProgress?: ProgressCallback,
): Promise<MediaUploadResult> {
  // 1. Preflight Validation
  if (!file) {
    throw new Error('No file selected for upload.');
  }

  if (file.size === 0) {
    throw new Error('The selected file is empty (0 Bytes).');
  }

  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    throw new Error(
      `File size (${formatBytes(file.size)}) exceeds the 20 MB limit allowed by the Media CDN. Please compress the file or choose a smaller one.`,
    );
  }

  const safeFileName = sanitizeFilename(file.name);
  // Create a new File instance with the safe filename
  const cleanFile = new File([file], safeFileName, {
    type: file.type || 'application/octet-stream',
  });

  let directUploadError: Error | null = null;

  // 2. Multi-attempt direct CDN upload
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const isRetry = attempt > 1;
    const attemptText = isRetry
      ? `Retrying upload to CDN (Attempt ${attempt} of ${MAX_ATTEMPTS})...`
      : 'Uploading directly to high-speed CDN...';

    onProgress?.(15 + (attempt - 1) * 20, attemptText);

    const formData = new FormData();
    formData.append('file', cleanFile, safeFileName);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(MEDIA_HOST_ENDPOINT, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      onProgress?.(85, 'Verifying CDN response...');

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `CDN HTTP ${response.status}: ${errorText || response.statusText || 'Upload rejected'}`,
        );
      }

      const json = await response.json();
      const fileUrl = json.url || json.data;

      if (!fileUrl) {
        throw new Error('Media host response did not return a valid download URL.');
      }

      onProgress?.(100, 'Upload completed successfully!');

      return {
        url: fileUrl,
        data: json.data || fileUrl,
        fileName: json.filename || safeFileName,
        fileSize: formatBytes(json.size || file.size),
        rawSize: json.size || file.size,
        mediaType: json.media_type || file.type || 'application/octet-stream',
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      const msg = isAbort
        ? `CDN request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
        : err.message || 'Network error';
      directUploadError = new Error(msg);

      if (attempt < MAX_ATTEMPTS) {
        const jitter = Math.floor(Math.random() * 500);
        const backoffMs = 1200 * attempt + jitter;
        onProgress?.(
          15 + attempt * 20,
          `CDN busy (${msg}). Waiting ${Math.round(backoffMs / 1000)}s before next attempt...`,
        );
        await delay(backoffMs);
      }
    }
  }

  // 3. Fallback: Upload via backend serverless proxy
  // This bypasses client-side CORS issues, ISP worker blocks, or adblockers seamlessly.
  onProgress?.(80, 'Connecting through secure serverless backend fallback...');

  try {
    const base64Data = await fileToBase64(cleanFile);
    const proxyResult = await teacherApi.uploadMediaProxy(
      base64Data,
      safeFileName,
      cleanFile.type,
    );

    onProgress?.(100, 'Uploaded successfully via secure fallback tunnel!');
    return {
      url: proxyResult.url,
      data: proxyResult.data,
      fileName: proxyResult.fileName || safeFileName,
      fileSize: proxyResult.fileSize || formatBytes(cleanFile.size),
      rawSize: proxyResult.rawSize || cleanFile.size,
      mediaType: proxyResult.mediaType || cleanFile.type,
    };
  } catch (proxyErr: any) {
    const finalMsg = `Direct CDN upload failed (${directUploadError?.message || 'unknown error'}) and fallback proxy also encountered an error: ${proxyErr.message || 'unknown'}. Please verify your connection.`;
    throw new Error(finalMsg);
  }
}
