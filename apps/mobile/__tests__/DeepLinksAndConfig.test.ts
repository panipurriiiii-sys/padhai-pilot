import { parseDeepLink, resolveDeepLinkTab } from '../src/lib/deepLinks';
import { loadPush } from '../src/services/push';
import { apiClient, DEV_API_BASE_URL, PROD_API_BASE_URL } from '../src/services/api/client';

describe('deep links', () => {
  it('parses whitelisted padhaipilot:// links with params', () => {
    expect(parseDeepLink('padhaipilot://fees?batch=b1')).toEqual({ target: 'fees', params: { batch: 'b1' } });
  });
  it('rejects foreign schemes', () => {
    expect(parseDeepLink('https://evil.example/fees')).toBeNull();
    expect(parseDeepLink('javascript:alert(1)')).toBeNull();
  });
  it('maps targets per role and ignores unknown targets', () => {
    expect(resolveDeepLinkTab('padhaipilot://batches', true)).toBe('teacher_classes');
    expect(resolveDeepLinkTab('padhaipilot://batches', false)).toBeNull();
    expect(resolveDeepLinkTab('padhaipilot://announcements', false)).toBe('student_diary');
    expect(resolveDeepLinkTab('padhaipilot://admin', true)).toBeNull();
  });
});

describe('push scaffolding', () => {
  it('is a safe no-op without Firebase installed', async () => {
    const push = loadPush();
    expect(push.available).toBe(false);
    expect(await push.getToken()).toBeNull();
    expect(() => push.onMessage(() => {})()).not.toThrow();
  });
});

describe('api base url', () => {
  it('uses the emulator host in dev and Vercel in production, always ending in /api', () => {
    expect(DEV_API_BASE_URL).toBe('http://10.0.2.2:3001/api');
    expect(PROD_API_BASE_URL).toBe('https://padhai-pilot.vercel.app/api');
    expect(apiClient.getBaseUrl()).toBe(DEV_API_BASE_URL);
    apiClient.setBaseUrl('http://192.168.1.5:3001/');
    expect(apiClient.getBaseUrl()).toBe('http://192.168.1.5:3001/api');
    apiClient.setBaseUrl(DEV_API_BASE_URL);
  });
});
