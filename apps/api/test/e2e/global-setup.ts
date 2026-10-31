// Logs the seeded dev accounts in ONCE so test files share tokens (login is rate limited to 5/min per account).
import { ACCOUNTS, BASE, DEV_PASSWORD } from './helpers';

export default async function setup() {
  const out: Record<string, string> = {};
  for (const email of Object.values(ACCOUNTS)) {
    const r = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: DEV_PASSWORD }),
    });
    const j: any = await r.json().catch(() => null);
    if (r.status !== 200 || !j?.token) throw new Error(`e2e setup: login ${email} -> ${r.status}. Run npm run local:seed and start the API (npm run test:e2e does both).`);
    out[`${email}|${DEV_PASSWORD}`] = j.token;
  }
  process.env.E2E_TOKENS = JSON.stringify(out);
}
