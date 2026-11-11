import { apiClient } from '../services/api/client';

declare const require: (moduleName: string) => any;

// Vercel serverless functions have a 4.5 MB body limit; base64 encoding adds ~33% overhead.
// Keep the raw file under 3 MB so the base64 payload stays under 4 MB with request headers.
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

export interface UploadedMedia {
  url: string;
  fileName: string;
  fileSize: string;
  mediaType: string;
}

/**
 * Picks a document / image and uploads it through the existing proxy (POST /tuition/media-upload, base64 body,
 * 20 MB preflight). Returns null when the user cancels. Throws a readable Error otherwise. The returned `url` is the
 * https media link to attach to an assignment or material.
 */
export async function pickAndUploadMedia(): Promise<UploadedMedia | null> {
  let picker: any = null;
  let blob: any = null;
  try {
    // Literal requires (Metro needs static module names); lazy so a missing native module never crashes startup.
    picker = require('@react-native-documents/picker');
    blob = require('react-native-blob-util');
  } catch {
    // handled below
  }
  const fs = (blob?.default ?? blob)?.fs;
  if (!picker?.pick || !fs) throw new Error('File picking is not available on this build. Paste an https link instead.');
  let file: { uri: string; name?: string | null; type?: string | null; size?: number | null };
  try {
    const res = await picker.pick({
      type: [picker.types.pdf, picker.types.doc, picker.types.docx, picker.types.ppt, picker.types.pptx, picker.types.xls, picker.types.xlsx, picker.types.plainText, picker.types.images],
    });
    file = res[0];
  } catch (e) {
    if (picker.isErrorWithCode?.(e) && (e as { code?: string }).code === picker.errorCodes?.OPERATION_CANCELED) return null;
    throw new Error(e instanceof Error ? e.message : 'Could not open the file picker.');
  }
  if (!file) return null;
  if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) throw new Error('File exceeds the 3 MB limit.');
  const fileName = file.name || 'document.pdf';
  const [copy] = await picker.keepLocalCopy({ files: [{ uri: file.uri, fileName }], destination: 'cachesDirectory' });
  if (copy?.status !== 'success') throw new Error('Could not read the selected file.');
  const path = decodeURIComponent(String(copy.localUri).replace(/^file:\/\//, ''));
  const stat = await fs.stat(path);
  if (Number(stat.size) > MAX_UPLOAD_BYTES) throw new Error('File exceeds the 3 MB limit.');
  const base64: string = await fs.readFile(path, 'base64');
  void fs.unlink(path).catch(() => undefined);
  const out = await apiClient.post<UploadedMedia>('/tuition/media-upload', { base64, fileName, mimeType: file.type || undefined });
  if (!out?.url || !/^https:\/\//i.test(out.url)) throw new Error('Upload did not return a valid link.');
  return out;
}
