// `npm run local:web` - teacher 3000 / student 3002 / admin 3003 / web 3004 in dev mode against the local API.
import { spawn } from 'node:child_process';
import { ROOT, WEB_PORTS, API_URL, API_PORT } from './lib.mjs';

const env = { ...process.env, NEXT_PUBLIC_API_URL: API_URL, API_URL, NODE_ENV: 'development' };
for (const [name, port] of Object.entries(WEB_PORTS)) {
  const p = spawn('npx', ['next', 'dev', '-p', String(port)], {
    cwd: `${ROOT}/apps/${name}`, env, stdio: 'inherit', shell: process.platform === 'win32',
  });
  p.on('exit', (c) => console.log(`[local:web] ${name} exited ${c}`));
}
console.log(`[local:web] starting on ${Object.values(WEB_PORTS).join(', ')}; API expected at ${API_URL} (port ${API_PORT})`);
