import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

loadLocalEnvFile(path.join(process.cwd(), '.env.sandbox'));
loadLocalEnvFile(path.join(process.cwd(), 'logs', 'e2e-mail.env'));
loadLocalEnvFile(path.join(process.cwd(), 'logs', 'e2e-admin.env'));

const baseUrl = (process.env.NEXT_BASE_URL || HOSTED_URL).replace(/\/$/, '');
const adminEmail = process.env.E2E_REVALIDATE_EMAIL || process.env.E2E_ADMIN_EMAIL || 'loa.gto15@gmail.com';
const adminUid = process.env.E2E_REVALIDATE_ADMIN_UID || process.env.E2E_ADMIN_UID || '';
const adminPassword = process.env.E2E_REVALIDATE_PASSWORD || process.env.E2E_ADMIN_PASSWORD || '';
const mailboxUser = process.env.E2E_MAILBOX_USER || process.env.E2E_EMAIL || 'loa.gto15@gmail.com';
const gmailAppPassword = String(process.env.E2E_GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
const appCheckDebugToken = process.env.E2E_APPCHECK_DEBUG_TOKEN || '';
const firebaseApiKey = process.env.E2E_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '';
const firebaseProjectId = process.env.E2E_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '';
if (firebaseProjectId && !process.env.GOOGLE_CLOUD_QUOTA_PROJECT) {
  process.env.GOOGLE_CLOUD_QUOTA_PROJECT = firebaseProjectId;
}
const signerServiceAccount = process.env.E2E_ADMIN_SIGNER_SERVICE_ACCOUNT || (firebaseProjectId ? `${firebaseProjectId}@appspot.gserviceaccount.com` : '');
const headless = String(process.env.E2E_HEADLESS || 'true').toLowerCase() !== 'false';
const allowNonSandboxTarget = String(process.env.E2E_ALLOW_NON_SANDBOX || 'false').toLowerCase() === 'true';
const allowProdAdminToken = String(process.env.E2E_ALLOW_PROD_ADMIN_TOKEN || 'false').toLowerCase() === 'true';

const logDir = path.join(process.cwd(), 'logs');
fs.mkdirSync(logDir, { recursive: true });
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const resultPath = path.join(logDir, `revalidate-catalog-e2e-${runId}.json`);
const screenshotPath = path.join(logDir, `revalidate-catalog-e2e-${runId}.png`);

const isSandboxOrLocalTarget = (
  baseUrl === HOSTED_URL ||
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
);

if (!isSandboxOrLocalTarget && !allowNonSandboxTarget) {
  console.error(`Refusing to run revalidation E2E against non-sandbox target: ${baseUrl}`);
  process.exit(1);
}
if (adminUid && !isSandboxOrLocalTarget && !allowProdAdminToken) {
  console.error(`Refusing to mint an automated admin token against non-sandbox target: ${baseUrl}`);
  process.exit(1);
}
if (!adminUid && !adminPassword && !gmailAppPassword) {
  console.error('Missing E2E_GMAIL_APP_PASSWORD in environment or logs/e2e-mail.env.');
  process.exit(1);
}
if (!adminUid && !appCheckDebugToken) {
  console.error('Missing E2E_APPCHECK_DEBUG_TOKEN in environment or logs/e2e-mail.env.');
  process.exit(1);
}
if (adminUid && !firebaseApiKey) {
  console.error('Missing E2E_FIREBASE_API_KEY / NEXT_PUBLIC_FIREBASE_API_KEY / VITE_FIREBASE_API_KEY for custom token exchange.');
  process.exit(1);
}

const result = {
  baseUrl,
  adminEmail,
  runId,
  status: 'started',
  steps: [],
  checkedRoutes: [],
  revalidation: null,
  consoleErrors: [],
};

const redactSensitiveText = (value) => String(value ?? '')
  .replace(/(E2E_GMAIL_APP_PASSWORD|E2E_APPCHECK_DEBUG_TOKEN|E2E_FIREBASE_API_KEY|NEXT_PUBLIC_FIREBASE_API_KEY|VITE_FIREBASE_API_KEY)(["'\s:=]+)([^"',\s&]+)/gi, '$1$2<redacted>')
  .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer <redacted>')
  .replace(/"idToken"\s*:\s*"[^"]+"/g, '"idToken":"<redacted>"')
  .replace(/"refreshToken"\s*:\s*"[^"]+"/g, '"refreshToken":"<redacted>"')
  .replace(/\b[A-Za-z0-9_-]{80,}\b/g, '<token-redacted>')
  .replace(/\b\d{6}\b/g, '<otp-redacted>');

const classifyKnownError = (error) => {
  const message = error?.message || String(error);
  if (/iam\.serviceAccounts\.signBlob/i.test(message)) {
    return 'known-iam-signblob-missing';
  }
  if (/Project .* has been deleted/i.test(message)) {
    return 'known-adc-project-mismatch';
  }
  if (/Failed to determine service account/i.test(message)) {
    return 'known-adc-signer-missing';
  }
  if (/admin_requires_google_or_passkey/i.test(message)) {
    return 'known-admin-otp-blocked';
  }
  return 'unexpected';
};

const parseServiceAccountCredential = () => {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    const parsed = JSON.parse(rawJson);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return cert(parsed);
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return cert({
      projectId: firebaseProjectId || undefined,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }

  return applicationDefault();
};

const getAdminTokenFromCustomToken = async () => {
  const credential = parseServiceAccountCredential();
  result.steps.push({
    phase: 'admin_token_project',
    projectId: firebaseProjectId || '<default>',
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? 'service_account_json'
      : process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
        ? 'service_account_fields'
        : 'application_default',
    signerServiceAccount: signerServiceAccount || '<default>',
  });

  const app = initializeApp({
    ...(firebaseProjectId ? { projectId: firebaseProjectId } : {}),
    ...(signerServiceAccount ? { serviceAccountId: signerServiceAccount } : {}),
    credential,
  }, `e2e-revalidate-${runId}`);
  const auth = getAuth(app);
  const user = await auth.getUser(adminUid);
  const customClaims = user.customClaims || {};
  const isAdmin = customClaims.admin === true || customClaims.superAdmin === true;
  if (!isAdmin) {
    throw new Error(`E2E admin uid ${adminUid} does not have admin/superAdmin custom claims`);
  }
  if (user.emailVerified !== true) {
    throw new Error(`E2E admin uid ${adminUid} email is not verified`);
  }

  const customToken = await auth.createCustomToken(adminUid);
  const exchangeResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(firebaseApiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const payload = await exchangeResponse.json().catch(() => ({}));
  if (!exchangeResponse.ok || !payload.idToken) {
    throw new Error(`Custom token exchange failed: HTTP ${exchangeResponse.status} ${redactSensitiveText(JSON.stringify(payload))}`);
  }

  result.steps.push({
    phase: 'admin_custom_token',
    user: {
      uid: user.uid,
      email: user.email || '',
      emailVerified: user.emailVerified,
      claims: {
        admin: customClaims.admin === true,
        superAdmin: customClaims.superAdmin === true,
      },
    },
  });

  return payload.idToken;
};

const getAdminTokenFromPassword = async () => {
  if (!adminEmail || !adminPassword) return '';

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(firebaseApiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        returnSecureToken: true,
      }),
    }
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.idToken) {
    throw new Error(`Admin password sign-in failed: HTTP ${response.status} ${redactSensitiveText(JSON.stringify(payload))}`);
  }

  result.steps.push({
    phase: 'admin_password_token',
    email: adminEmail,
    localId: payload.localId || '',
  });
  return payload.idToken;
};

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
    if (new RegExp(`${tag} OK`, 'i').test(buffer)) resolve(buffer);
    else reject(new Error(redactSensitiveText(buffer.slice(-600))));
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
      await sendImap(socket, state, `LOGIN "${escapeImapString(mailboxUser)}" "${escapeImapString(gmailAppPassword)}"`);
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

const latestOtpUidForEmail = async (email) => withImap(async (socket, state) => {
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
  await page.goto(`${baseUrl}/?e2e_run=revalidate-catalog-${encodeURIComponent(runId)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await page.waitForTimeout(1_200);
  await page.getByRole('button', { name: /Ouvrir la connexion/i }).first().click({ timeout: 30_000 });
  const dialog = page.getByRole('dialog', { name: /Connexion Seconde Vie/i });
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  return dialog;
};

const loginAndGetIdToken = async (page) => {
  const passwordToken = await getAdminTokenFromPassword();
  if (passwordToken) return passwordToken;
  if (adminUid) return getAdminTokenFromCustomToken();

  const minUid = await latestOtpUidForEmail(adminEmail);
  const dialog = await openLoginDialog(page);

  await dialog.locator('input[name="email"], input[type="email"]').first().fill(adminEmail);
  await dialog.getByRole('button', { name: /Recevoir mon code/i }).click();
  await expect(dialog.getByText(/Code envoye|Code envoy/i)).toBeVisible({ timeout: 30_000 });
  result.steps.push({ phase: 'otp_sent', minUid });

  const { id: otpUid, code } = await waitForFreshOtp({ email: adminEmail, minUid });
  result.steps.push({ phase: 'otp_received', otpUid });

  for (let index = 0; index < 6; index += 1) {
    await dialog.locator(`[data-otp-index="${index}"]`).fill(code[index]);
  }
  await dialog.getByRole('button', { name: /Se connecter/i }).click();

  const loginOutcome = await Promise.race([
    dialog.getByText(/Email verifie|Email v.rifi.|Connexion ouverte/i).waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'success'),
    dialog.getByText(/Connexion par code reservee|Connexion par code r.serv.e|Utilisez Google, passkey ou l acces admin/i).waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'admin_requires_google_or_passkey'),
  ]);
  if (loginOutcome !== 'success') {
    result.steps.push({ phase: 'otp_rejected', reason: loginOutcome });
    throw new Error(`${loginOutcome}: ${adminEmail}`);
  }

  const authData = await page.waitForFunction(async () => {
    const user = window.__svAuthUser;
    if (!user?.uid || !user.getIdToken) return null;
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified ?? null,
      idToken: await user.getIdToken(true),
    };
  }, null, { timeout: 30_000 }).then((handle) => handle.jsonValue());

  if (!authData?.idToken) throw new Error('Unable to extract Firebase ID token after OTP login');
  result.steps.push({
    phase: 'browser_user',
    user: {
      uid: authData.uid,
      email: authData.email,
      emailVerified: authData.emailVerified,
    },
  });
  return authData.idToken;
};

const readSitemapTargets = async () => {
  const response = await fetch(`${baseUrl}/sitemap.xml`, { headers: { accept: 'application/xml,text/xml,*/*' } });
  if (!response.ok) throw new Error(`Initial sitemap fetch failed: HTTP ${response.status}`);
  const xml = await response.text();
  const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1]);

  const findReachablePath = async (candidates, fallback = '') => {
    for (const url of candidates.slice(0, 40)) {
      const pathname = new URL(url).pathname;
      const check = await fetch(`${baseUrl}${pathname}`, { headers: { accept: 'text/html,*/*' } }).catch(() => null);
      if (check?.ok) return pathname;
      result.steps.push({ phase: 'sitemap_candidate_skipped', path: pathname, status: check?.status || 0 });
    }
    return fallback;
  };

  const categoryPath = await findReachablePath(
    urls.filter((url) => /\/categorie\//.test(url)),
    '/categorie/meubles'
  );
  const productPath = await findReachablePath(
    urls.filter((url) => /\/produit\//.test(url)),
    ''
  );

  return {
    categoryPath,
    productPath,
  };
};

const checkRoute = async (pathToCheck, pattern) => {
  const response = await fetch(`${baseUrl}${pathToCheck}`, { headers: { accept: 'text/html,application/xml,*/*' } });
  const text = await response.text();
  const ok = response.ok && (!pattern || pattern.test(text));
  const entry = {
    path: pathToCheck,
    status: response.status,
    bytes: text.length,
    ok,
  };
  result.checkedRoutes.push(entry);
  if (!ok) throw new Error(`Route check failed for ${pathToCheck}: HTTP ${response.status}`);
};

let browser = null;
let context = null;
let page = null;
try {
  const { categoryPath, productPath } = await readSitemapTargets();
  if (!productPath) throw new Error('No product URL found in sitemap for revalidation proof');
  result.steps.push({ phase: 'sitemap_targets', categoryPath, productPath });

  if (!adminUid) {
    browser = await chromium.launch({ headless });
    context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      locale: 'fr-FR',
    });
    await context.addInitScript((token) => {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = token;
    }, appCheckDebugToken);

    page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') result.consoleErrors.push(redactSensitiveText(message.text()).slice(0, 240));
    });
  }

  const idToken = await loginAndGetIdToken(page);
  const revalidateResponse = await fetch(`${baseUrl}/api/revalidate-catalog`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${idToken}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      reason: `e2e_revalidate_catalog_${runId}`,
      paths: [categoryPath, productPath],
    }),
  });
  const revalidatePayload = await revalidateResponse.json().catch(() => ({}));
  result.revalidation = {
    status: revalidateResponse.status,
    ok: revalidateResponse.ok,
    payload: revalidatePayload,
  };
  if (!revalidateResponse.ok || revalidatePayload?.ok !== true) {
    throw new Error(`Revalidation API failed: HTTP ${revalidateResponse.status} ${redactSensitiveText(JSON.stringify(revalidatePayload))}`);
  }

  await checkRoute('/', /Seconde Vie|Galerie|meuble/i);
  await checkRoute('/galerie', /Seconde Vie|Galerie|meuble/i);
  await checkRoute(categoryPath, /categorie|cat.gorie|Seconde Vie|meuble/i);
  await checkRoute(productPath, /produit|Seconde Vie|€|EUR/i);
  await checkRoute('/sitemap.xml', /<urlset|<url>/i);

  result.status = 'passed';
  await context?.close();
} catch (error) {
  result.status = 'failed';
  result.failureClass = classifyKnownError(error);
  result.error = redactSensitiveText(error?.message || String(error));
  await page?.screenshot({ path: screenshotPath, fullPage: true }).catch(() => null);
  throw error;
} finally {
  writeResult();
  await browser?.close();
  console.log(`Revalidation E2E result written to ${resultPath}`);
}
