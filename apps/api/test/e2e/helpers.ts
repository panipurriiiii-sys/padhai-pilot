// E2E helpers: plain fetch against a RUNNING local API (see `npm run test:e2e` / docs/LOCAL_DEV.md).
// Requires the dev seed (scripts/local/seed.mts). Never point E2E_API_URL at a deployed environment.

export const BASE = process.env.E2E_API_URL || 'http://localhost:3199/api';
export const DEV_PASSWORD = 'DevPass#2026';

if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(BASE + '/')) {
  throw new Error(`E2E_API_URL must be a localhost URL, got ${BASE}`);
}

export interface Res<T = any> {
  status: number;
  body: T;
  headers: Headers;
}

export async function call<T = any>(
  method: string,
  path: string,
  opts: { token?: string | null; body?: unknown; headers?: Record<string, string> } = {},
): Promise<Res<T>> {
  const r = await fetch(BASE + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.headers ?? {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await r.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: r.status, body, headers: r.headers };
}

const tokenCache = new Map<string, string>(
  Object.entries(JSON.parse(process.env.E2E_TOKENS || '{}') as Record<string, string>),
);
/** Logs in once per email per test file (login is rate limited to 5/min per ip+email). */
export async function login(email: string, password = DEV_PASSWORD): Promise<string> {
  const key = `${email}|${password}`;
  const cached = tokenCache.get(key);
  if (cached) return cached;
  const r = await call('POST', '/auth/login', { body: { email, password } });
  if (r.status !== 200 || !r.body?.token) throw new Error(`login ${email} failed: ${r.status} ${JSON.stringify(r.body)} (did you run local:seed?)`);
  tokenCache.set(key, r.body.token);
  return r.body.token;
}

export const ACCOUNTS = {
  superAdmin: 'admin@dev.local',
  ownerA: 'owner@dev.local',
  faculty1: 'faculty1@dev.local', // TEACHER, lead of Mathematics Batch 1
  faculty2: 'faculty2@dev.local', // FACULTY, lead of Science Batch 2
  student1: 'student1@dev.local', // Dev Academy, Mathematics Batch 1
  student2: 'student2@dev.local', // Dev Academy, Science Batch 2
  student3: 'student3@dev.local', // Dev Academy, Mathematics Batch 1, no graded submission
  ownerB: 'owner2@dev.local',
  facultyB: 'rfaculty1@dev.local',
  studentB: 'rstudent1@dev.local',
} as const;

export async function tokens() {
  const out: Record<keyof typeof ACCOUNTS, string> = {} as any;
  for (const [k, email] of Object.entries(ACCOUNTS)) out[k as keyof typeof ACCOUNTS] = await login(email);
  return out;
}

/** Batches visible to a token (teacher routes). */
export async function batchesOf(token: string): Promise<any[]> {
  const r = await call('GET', '/teacher/batches', { token });
  if (r.status !== 200) throw new Error(`batches ${r.status}`);
  return r.body;
}

let counter = 0;
export const uniqueEmail = (prefix: string) => `${prefix}.${Date.now().toString(36)}${counter++}@e2e.local`;

/** The roster endpoint returns `{ batch, students }`. */
export const rosterOf = (r: Res): any[] => (Array.isArray(r.body) ? r.body : r.body?.students ?? []);
