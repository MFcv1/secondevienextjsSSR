import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';

const envPath = path.join(process.cwd(), 'logs', 'e2e-mail.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const [key, ...rest] = line.split('=');
    if (!process.env[key]) process.env[key] = rest.join('=').trim();
  }
}

const email = String(process.argv[2] || '').trim().toLowerCase();
const user = process.env.E2E_MAILBOX_USER || process.env.E2E_EMAIL || 'loa.gto15@gmail.com';
const password = String(process.env.E2E_GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
if (!email || !password) process.exit(2);

const escapeImap = (value) => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const decodeMail = (raw) => String(raw || '').replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
const extractOtp = (raw) => {
  const decoded = decodeMail(raw);
  return decoded.match(/Code:\s*(\d{6})/i)?.[1] || decoded.match(/code de connexion[\s\S]{0,260}?(\d{6})/i)?.[1] || '';
};

const socket = tls.connect(993, 'imap.gmail.com', { servername: 'imap.gmail.com' });
socket.setEncoding('utf8');
let tag = 0;
const send = (command) => new Promise((resolve, reject) => {
  const id = `A${String(++tag).padStart(4, '0')}`;
  let buffer = '';
  const onData = (chunk) => {
    buffer += chunk;
    if (!buffer.includes(`${id} `)) return;
    socket.off('data', onData);
    if (new RegExp(`${id} OK`, 'i').test(buffer)) resolve(buffer);
    else reject(new Error('IMAP command failed'));
  };
  socket.on('data', onData);
  socket.write(`${id} ${command}\r\n`);
});

await new Promise((resolve, reject) => {
  socket.once('data', resolve);
  socket.once('error', reject);
});
await send(`LOGIN "${escapeImap(user)}" "${escapeImap(password)}"`);
await send('SELECT INBOX');

const deadline = Date.now() + 120_000;
let code = '';
while (!code && Date.now() < deadline) {
  const search = await send('UID SEARCH SUBJECT "Votre code de connexion Seconde Vie"');
  const ids = (search.match(/\* SEARCH\s+(.+)/i)?.[1] || '').trim().split(/\s+/).filter(Boolean).slice(-40).reverse();
  for (const id of ids) {
    const header = await send(`UID FETCH ${id} BODY.PEEK[HEADER.FIELDS (TO SUBJECT DATE)]`);
    if (!header.toLowerCase().includes(email)) continue;
    const raw = await send(`UID FETCH ${id} BODY.PEEK[]`);
    code = extractOtp(raw);
    if (code) break;
  }
  if (!code) await new Promise((resolve) => setTimeout(resolve, 4_000));
}

await send('LOGOUT').catch(() => null);
socket.end();
if (!code) process.exit(3);
process.stdout.write(code);
