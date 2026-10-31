// `npm run local:all` - db -> migrate -> seed -> api + web.
import net from 'node:net';
import { spawn } from 'node:child_process';
import { ROOT, DB_PORT, run } from './lib.mjs';

const kids = [];
const start = (script) => {
  const p = spawn('npm', ['run', script], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  kids.push(p);
  return p;
};
const up = (port) => new Promise((r) => {
  const s = net.connect(port, '127.0.0.1');
  s.on('connect', () => { s.destroy(); r(true); });
  s.on('error', () => r(false));
});
process.on('SIGINT', () => { kids.forEach((k) => k.kill()); process.exit(0); });

if (!(await up(DB_PORT))) {
  start('local:db');
  for (let i = 0; i < 90 && !(await up(DB_PORT)); i++) await new Promise((r) => setTimeout(r, 1000));
}
await run('npm', ['run', 'local:migrate']);
await run('npm', ['run', 'local:seed']);
start('local:api');
start('local:web');
