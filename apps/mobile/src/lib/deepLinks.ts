import { Linking } from 'react-native';
import type { MainTabKey } from '../store/useNavigationStore';

/**
 * Deep-link scaffolding for the `padhaipilot://` scheme (also used by FCM notification payloads via `data.link`).
 * Only whitelisted destinations are honoured, so a crafted link can never reach arbitrary screens.
 *
 *   padhaipilot://fees          -> student fees tab
 *   padhaipilot://timetable     -> student timetable
 *   padhaipilot://announcements -> student diary / broadcasts
 *   padhaipilot://batches       -> teacher classes
 */
export const DEEP_LINK_SCHEME = 'padhaipilot';

const STUDENT_TARGETS: Record<string, MainTabKey> = {
  home: 'student_dashboard',
  fees: 'student_more',
  timetable: 'student_more',
  announcements: 'student_diary',
  diary: 'student_diary',
  results: 'student_results',
};

const TEACHER_TARGETS: Record<string, MainTabKey> = {
  home: 'teacher_dashboard',
  batches: 'teacher_classes',
  attendance: 'teacher_attendance',
  marks: 'teacher_marks',
  announcements: 'teacher_more',
};

export interface ParsedDeepLink {
  target: string;
  params: Record<string, string>;
}

export function parseDeepLink(url: string | null | undefined): ParsedDeepLink | null {
  if (!url) return null;
  const match = /^padhaipilot:\/\/([a-z0-9-]+)(?:\/[^?#]*)?(?:\?([^#]*))?/i.exec(url.trim());
  if (!match) return null;
  const params: Record<string, string> = {};
  if (match[2]) {
    for (const pair of match[2].split('&')) {
      const [k, v = ''] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v);
    }
  }
  return { target: match[1].toLowerCase(), params };
}

export function resolveDeepLinkTab(url: string | null | undefined, isTeacher: boolean): MainTabKey | null {
  const parsed = parseDeepLink(url);
  if (!parsed) return null;
  return (isTeacher ? TEACHER_TARGETS : STUDENT_TARGETS)[parsed.target] ?? null;
}

/** Subscribes to cold-start and warm links. Returns an unsubscribe function. */
export function subscribeDeepLinks(onLink: (url: string) => void): () => void {
  void Linking.getInitialURL()
    .then((url) => {
      if (url) onLink(url);
    })
    .catch(() => {});
  const sub = Linking.addEventListener('url', (e) => onLink(e.url));
  return () => sub.remove();
}
