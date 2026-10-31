import { BadRequestException } from '@nestjs/common';
import { ALLOWED_MEDIA_HOSTS } from '@padhai-pilot/shared';

export const LOGO_EXTENSIONS = ['png', 'jpg', 'jpeg'];
export const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'png', 'jpg', 'jpeg'];

/**
 * Accepts only https URLs on the media upload hosts (media.dhyey.cc, its worker host and *.dhyey.cc) with an
 * allowed file extension. Returns the normalised URL, or undefined for empty input.
 */
export function validateMediaUrl(value: unknown, field: string, extensions: string[]): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > 2048) throw new BadRequestException(`${field} is not a valid URL.`);
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new BadRequestException(`${field} is not a valid URL.`);
  }
  const host = url.hostname.toLowerCase();
  const hostOk =
    url.protocol === 'https:' &&
    !url.username &&
    !url.password &&
    ((ALLOWED_MEDIA_HOSTS as readonly string[]).includes(host) || host.endsWith('.dhyey.cc'));
  if (!hostOk) throw new BadRequestException(`${field} must be an https link from the PadhaiPilot media uploader.`);
  const ext = url.pathname.split('.').pop()?.toLowerCase() ?? '';
  if (!extensions.includes(ext)) {
    throw new BadRequestException(`${field} must be one of: ${extensions.join(', ')}.`);
  }
  return url.toString();
}
