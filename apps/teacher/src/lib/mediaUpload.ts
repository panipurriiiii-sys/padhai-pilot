/**
 * Media Hosting Service Client (Powered by Cloudflare Worker at https://media.dhyey.cc/docs)
 * Direct file upload to https://media-hosting.dhyeyp254.workers.dev/upload
 * PostgreSQL stores only metadata and URLs; binary content is served directly by the media CDN.
 */

export interface MediaUploadResult {
  url: string;
  data: string;
  fileName: string;
  fileSize: string;
  rawSize: number;
  mediaType: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const MEDIA_HOST_ENDPOINT = 'https://media-hosting.dhyeyp254.workers.dev/upload';

/**
 * Uploads a file directly to the media hosting worker without routing binary blobs
 * through PostgreSQL or the main application database.
 */
export async function uploadMediaFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<MediaUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  onProgress?.(20);

  const response = await fetch(MEDIA_HOST_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  onProgress?.(80);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Media CDN upload failed (${response.status}): ${errorText || response.statusText}`,
    );
  }

  const json = await response.json();
  const fileUrl = json.url || json.data;

  if (!fileUrl) {
    throw new Error('Media host response did not return a valid download URL.');
  }

  onProgress?.(100);

  return {
    url: fileUrl,
    data: json.data || fileUrl,
    fileName: json.filename || file.name,
    fileSize: formatBytes(json.size || file.size),
    rawSize: json.size || file.size,
    mediaType: json.media_type || file.type || 'application/octet-stream',
  };
}
