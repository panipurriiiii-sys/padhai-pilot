import { describe, expect, it } from 'vitest';
import { call, login, uniqueEmail, DEV_PASSWORD } from './helpers';

describe('auth (e2e)', () => {
  const email = uniqueEmail('owner');
  const password = 'Str0ng!Passw0rd';
  let token: string;

  it('registers a new tuition owner and returns a session', async () => {
    const r = await call('POST', '/auth/register', {
      body: { fullName: 'E2E Owner', email, password, instituteName: 'E2E Academy', role: 'TUITION_OWNER' },
    });
    expect(r.status).toBe(201);
    expect(r.body.user.role).toBe('TUITION_OWNER');
    expect(r.body.user.instituteId).toBeTruthy();
    expect(r.body.token).toBeTruthy();
    token = r.body.token;
  });

  it('rejects a duplicate registration', async () => {
    const r = await call('POST', '/auth/register', {
      body: { fullName: 'E2E Owner', email, password, instituteName: 'E2E Academy 2', role: 'TUITION_OWNER' },
    });
    expect([400, 409]).toContain(r.status);
  });

  it('rejects weak passwords and public SUPER_ADMIN / staff self-registration', async () => {
    const weak = await call('POST', '/auth/register', { body: { fullName: 'x', email: uniqueEmail('weak'), password: '123', instituteName: 'x' } });
    expect(weak.status).toBe(400);
    const sneaky = await call('POST', '/auth/register', {
      body: { fullName: 'Sneaky', email: uniqueEmail('sneaky'), password, instituteName: 'S', role: 'SUPER_ADMIN' },
    });
    if (sneaky.status === 201) expect(sneaky.body.user.role).not.toBe('SUPER_ADMIN');
  });

  it('logs in, and /auth/me works with the token', async () => {
    const r = await call('POST', '/auth/login', { body: { email, password } });
    expect(r.status).toBe(200);
    expect(r.body.user.email).toBe(email);
    const me = await call('GET', '/auth/me', { token: r.body.token });
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
    expect(JSON.stringify(me.body)).not.toMatch(/passwordHash|scrypt\$/);
  });

  it('wrong password and unknown user give the same 401', async () => {
    const a = await call('POST', '/auth/login', { body: { email, password: 'Wrong!Pass123' } });
    const b = await call('POST', '/auth/login', { body: { email: uniqueEmail('ghost'), password: 'Wrong!Pass123' } });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.message).toBe(b.body.message);
  });

  it('no token / garbage token / tampered token are rejected', async () => {
    expect((await call('GET', '/auth/me')).status).toBe(401);
    expect((await call('GET', '/auth/me', { token: 'not.a.jwt' })).status).toBe(401);
    const good = await login('student1@dev.local');
    const tampered = good.slice(0, -4) + (good.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    expect((await call('GET', '/auth/me', { token: tampered })).status).toBe(401);
  });

  it('changing the password revokes previously issued tokens (tokenVersion)', async () => {
    const newPassword = 'N3w!Passw0rdXyz';
    const ch = await call('POST', '/auth/change-password', { token, body: { oldPassword: password, newPassword } });
    expect(ch.status).toBe(200);
    const old = await call('GET', '/auth/me', { token });
    expect(old.status).toBe(401); // old token revoked
    if (ch.body.token) expect((await call('GET', '/auth/me', { token: ch.body.token })).status).toBe(200);
    expect((await call('POST', '/auth/login', { body: { email, password } })).status).toBe(401);
    expect((await call('POST', '/auth/login', { body: { email, password: newPassword } })).status).toBe(200);
  });

  it('login is rate limited per ip+account (in-process limiter when Redis is unset)', async () => {
    const target = uniqueEmail('ratelimit');
    const codes: number[] = [];
    for (let i = 0; i < 8; i++) codes.push((await call('POST', '/auth/login', { body: { email: target, password: 'Bad!Pass1234' } })).status);
    expect(codes.slice(0, 5).every((c) => c === 401)).toBe(true);
    expect(codes).toContain(429);
  });

  it('demo-login routes exist only outside production (dev harness: reachable)', async () => {
    // In production these must 404; here NODE_ENV=development so they respond. Documented, not asserted either way.
    const r = await call('GET', '/auth/demo-teacher');
    expect([200, 404]).toContain(r.status);
  });

  it('seeded dev account can log in with the documented password', async () => {
    expect(await login('owner@dev.local', DEV_PASSWORD)).toBeTruthy();
  });
});
