import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';
import { chromium, expect } from '@playwright/test';

const HOSTED_URL = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';

const loadLocalEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const [key, ...rest] = line.split('=');
    if (!process.env[key]) process.env[key] = rest.join('=').trim();
  }
};

loadLocalEnvFile(path.join(process.cwd(), 'logs', 'e2e-mail.env'));

const baseUrl = (process.env.NEXT_BASE_URL || HOSTED_URL).replace(/\/$/, '');
const mailboxUser = process.env.E2E_MAILBOX_USER || process.env.E2E_EMAIL || 'loa.gto15@gmail.com';
const gmailAppPassword = String(process.env.E2E_GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
const appCheckDebugToken = process.env.E2E_APPCHECK_DEBUG_TOKEN || '';
const headless = String(process.env.E2E_HEADLESS || 'true').toLowerCase() !== 'false';
const freshAlias = process.env.E2E_AUTH_EMAIL || `loa.gto15+auth-a-z-${Date.now()}@gmail.com`;
const allowNonSandboxTarget = String(process.env.E2E_ALLOW_NON_SANDBOX || 'false').toLowerCase() === 'true';

const logDir = path.join(process.cwd(), 'logs');
fs.mkdirSync(logDir, { recursive: true });
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const resultPath = path.join(logDir, `auth-email-otp-e2e-${runId}.json`);
const screenshotPath = path.join(logDir, `auth-email-otp-e2e-${runId}.png`);

const isSandboxOrLocalTarget = (
  baseUrl === HOSTED_URL ||
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
);

if (!isSandboxOrLocalTarget && !allowNonSandboxTarget) {
  console.error(`Refusing to run auth E2E against non-sandbox target: ${baseUrl}`);
  process.exit(1);
}

if (!gmailAppPassword) {
  console.error('Missing E2E_GMAIL_APP_PASSWORD in environment or logs/e2e-mail.env.');
  process.exit(1);
}

if (!appCheckDebugToken) {
  console.error('Missing E2E_APPCHECK_DEBUG_TOKEN in environment or logs/e2e-mail.env.');
  process.exit(1);
}

const result = {
  baseUrl,
  alias: freshAlias,
  runId,
  status: 'started',
  steps: [],
  consoleErrors: [],
};

const redactSensitiveText = (value) => String(value ?? '')
  .replace(/(E2E_GMAIL_APP_PASSWORD|E2E_APPCHECK_DEBUG_TOKEN)(["'\s:=]+)([^"',\s&]+)/gi, '$1$2<redacted>')
  .replace(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/g, '<uuid-redacted>')
  .replace(/\b\d{6}\b/g, '<otp-redacted>');

const writeResult = () => {
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
};

const escapeImapString = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const sendImap = (socket, state, command) => new Promise((resolve, reject) => {
  const tag = `A${String(++state.tag).padStart(4, '0')}`;
  let buffer = '';
  const onData = (chunk) => {
    buffer += chunk;
    if (!buffer.includes(`${tag} `)) return;
    socket.off('data', onData);
    if (new RegExp(`${tag} OK`, 'i').test(buffer)) {
      resolve(buffer);
    } else {
      reject(new Error(redactSensitiveText(buffer.slice(-600))));
    }
  };
  socket.on('data', onData);
  socket.write(`${tag} ${command}\r\n`);
});

const withImap = (handler) => new Promise((resolve, reject) => {
  const socket = tls.connect(993, 'imap.gmail.com', { servername: 'imap.gmail.com' });
  const state = { tag: 0 };
  socket.setEncoding('utf8');

  const cleanup = () => {
    socket.removeAllListeners();
    socket.end();
  };

  socket.once('data', async () => {
    try {
      await sendImap(
        socket,
        state,
        `LOGIN "${escapeImapString(mailboxUser)}" "${escapeImapString(gmailAppPassword)}"`
      );
      const value = await handler(socket, state);
      await sendImap(socket, state, 'LOGOUT').catch(() => null);
      cleanup();
      resolve(value);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });

  socket.once('error', (error) => {
    cleanup();
    reject(error);
  });
});

const decodeMail = (raw) => String(raw || '')
  .replace(/=\r?\n/g, '')
  .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

const extractOtp = (rawMessage) => {
  const decoded = decodeMail(rawMessage);
  return decoded.match(/Code:\s*(\d{6})/i)?.[1] ||
    decoded.match(/code de connexion[\s\S]{0,260}?(\d{6})/i)?.[1] ||
    '';
};

const listOtpMessageIds = async (socket, state) => {
  await sendImap(socket, state, 'SELECT INBOX');
  const search = await sendImap(socket, state, 'UID SEARCH SUBJECT "Votre code de connexion Seconde Vie"');
  return (search.match(/\* SEARCH\s+(.+)/i)?.[1] || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => Number(id))
    .filter(Number.isFinite);
};

const latestOtpUidForAlias = async (email) => withImap(async (socket, state) => {
  const ids = (await listOtpMessageIds(socket, state)).slice(-40).reverse();
  for (const id of ids) {
    const header = await sendImap(socket, state, `UID FETCH ${id} BODY.PEEK[HEADER.FIELDS (TO SUBJECT DATE)]`);
    if (header.toLowerCase().includes(email.toLowerCase())) return id;
  }
  return 0;
});

const waitForFreshOtp = async ({ email, minUid }) => {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const found = await withImap(async (socket, state) => {
      const ids = (await listOtpMessageIds(socket, state))
        .filter((id) => id > minUid)
        .sort((a, b) => b - a);

      for (const id of ids) {
        const header = await sendImap(socket, state, `UID FETCH ${id} BODY.PEEK[HEADER.FIELDS (TO SUBJECT DATE)]`);
        if (!header.toLowerCase().includes(email.toLowerCase())) continue;
        const raw = await sendImap(socket, state, `UID FETCH ${id} BODY.PEEK[]`);
        const code = extractOtp(raw);
        if (code) return { id, code };
      }
      return null;
    });

    if (found?.code) return found;
    await new Promise((resolve) => setTimeout(resolve, 4_000));
  }
  throw new Error(`OTP not received/read for ${email}`);
};

const openLoginDialog = async (page) => {
  await page.goto(`${baseUrl}/?e2e_run=auth-email-otp-${encodeURIComponent(runId)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await page.waitForTimeout(1_200);
  await page.getByRole('button', { name: /Ouvrir la connexion/i }).first().click({ timeout: 30_000 });
  const dialog = page.getByRole('dialog', { name: /Connexion Seconde Vie/i });
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  return dialog;
};

const requestAndVerifyOtp = async (page, email, label) => {
  const minUid = await latestOtpUidForAlias(email);
  const dialog = await openLoginDialog(page);

  await dialog.locator('input[name="email"], input[type="email"]').first().fill(email);
  await dialog.getByRole('button', { name: /Recevoir mon code/i }).click();
  await expect(dialog.getByText(/Code envoye|Code envoyé/i)).toBeVisible({ timeout: 30_000 });
  result.steps.push({ label, phase: 'otp_sent', minUid });

  const { id: otpUid, code } = await waitForFreshOtp({ email, minUid });
  result.steps.push({ label, phase: 'otp_received', otpUid });

  for (let index = 0; index < 6; index += 1) {
    await dialog.locator(`[data-otp-index="${index}"]`).fill(code[index]);
  }

  await dialog.getByRole('button', { name: /Se connecter/i }).click();
  await expect(
    dialog.getByText(/Email verifie|Email vérifié|Connexion ouverte|Connexion reussie|Connexion réussie/i)
  ).toBeVisible({ timeout: 45_000 });
  result.steps.push({ label, phase: 'otp_verified' });

  const user = await page.waitForFunction(() => (
    window.__svAuthUser
      ? {
          uid: window.__svAuthUser.uid,
          email: window.__svAuthUser.email,
          emailVerified: window.__svAuthUser.emailVerified ?? null,
        }
      : null
  ), null, { timeout: 30_000 }).then((handle) => handle.jsonValue());

  if (!user?.uid || String(user.email || '').toLowerCase() !== email.toLowerCase()) {
    throw new Error(`${label}: browser auth user mismatch`);
  }

  result.steps.push({ label, phase: 'browser_user', user });
  await dialog.getByRole('button', { name: /Continuer/i }).click({ timeout: 5_000 }).catch(() => null);
  await dialog.getByRole('button', { name: /Fermer la connexion/i }).click({ timeout: 5_000 }).catch(() => null);
  return user;
};

const browser = await chromium.launch({ headless });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    locale: 'fr-FR',
  });
  await context.addInitScript((token) => {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = token;
  }, appCheckDebugToken);

  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') result.consoleErrors.push(redactSensitiveText(message.text()).slice(0, 240));
  });

  const firstUser = await requestAndVerifyOtp(page, freshAlias, 'fresh_create');

  await page.getByRole('button', { name: /Se deconnecter|Se déconnecter|Quitter/i }).first().click({ timeout: 15_000 });
  await page.waitForTimeout(1_500);
  const signedOut = await page.evaluate(() => !window.__svAuthUser);
  result.steps.push({ label: 'fresh_create', phase: 'signed_out', signedOut });
  if (!signedOut) throw new Error('User did not sign out after fresh auth flow');

  const secondUser = await requestAndVerifyOtp(page, freshAlias, 'existing_login');
  result.sameUidOnSecondLogin = firstUser.uid === secondUser.uid;
  if (!result.sameUidOnSecondLogin) throw new Error('Existing login returned a different uid');

  result.status = 'passed';
  await context.close();
} catch (error) {
  result.status = 'failed';
  result.error = redactSensitiveText(error?.message || String(error));
  await browser.contexts()[0]?.pages()[0]?.screenshot({ path: screenshotPath, fullPage: true }).catch(() => null);
  throw error;
} finally {
  writeResult();
  await browser.close();
  console.log(`Auth email OTP E2E result written to ${resultPath}`);
}
