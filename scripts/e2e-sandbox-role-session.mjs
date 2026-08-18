import crypto from 'node:crypto';
import admin from 'firebase-admin';
import { chromium, expect } from '@playwright/test';

const SANDBOX_URL = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';
const SANDBOX_PROJECT_ID = 'secondevienextjsssr';
const ROLE_EMAILS = Object.freeze({
  admin: 'loa.gto15@gmail.com',
  client: 'pvml7008@gmail.com',
});

const readArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) || fallback;
};

const role = readArg('role').trim().toLowerCase();
const expectedQuote = readArg('expect-quote').trim().toUpperCase();
const expectedUserCount = readArg('expect-user-count').trim();
const probeCallable = readArg('probe-callable').trim();
const baseUrl = readArg('base-url', process.env.NEXT_BASE_URL || SANDBOX_URL).replace(/\/$/, '');
const headed = process.argv.includes('--headed');
const keepOpen = process.argv.includes('--keep-open');
const projectId = process.env.FIREBASE_PROJECT_ID
  || process.env.VITE_FIREBASE_PROJECT_ID
  || SANDBOX_PROJECT_ID;
const firebaseAppId = process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '';
const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';

if (!Object.hasOwn(ROLE_EMAILS, role)) {
  throw new Error('Role requis: --role=client ou --role=admin.');
}
if (projectId !== SANDBOX_PROJECT_ID) {
  throw new Error(`Projet refuse: ${projectId}. Ce rail est reserve au sandbox.`);
}
if (baseUrl !== SANDBOX_URL && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl)) {
  throw new Error(`Cible refusee: ${baseUrl}. Ce rail est reserve au sandbox ou a localhost.`);
}
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON manque dans l environnement local ignore par Git.');
}
if (!firebaseAppId) {
  throw new Error('VITE_FIREBASE_APP_ID manque pour le jeton App Check de recette.');
}
if (probeCallable && ![
  'logUserConnectionGen2',
  'ensureAdminAccessRegistryGen2',
  'sendGuestCheckoutOtpGen2',
].includes(probeCallable)) {
  throw new Error('Callable de probe sandbox non autorise.');
}
if (probeCallable && !firebaseApiKey) {
  throw new Error('VITE_FIREBASE_API_KEY manque pour la probe Auth sandbox.');
}
if (expectedQuote && !/^DEV-\d{8}-[A-Z0-9]{4,12}$/.test(expectedQuote)) {
  throw new Error('Reference devis invalide pour la recette.');
}
if (expectedUserCount && !/^\d{1,9}$/.test(expectedUserCount)) {
  throw new Error('Compteur utilisateurs attendu invalide pour la recette.');
}
if (keepOpen && !headed) {
  throw new Error('--keep-open exige --headed.');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
  });
}

const auth = admin.auth();
const db = admin.firestore();
const email = ROLE_EMAILS[role];
const user = await auth.getUserByEmail(email);
const claims = user.customClaims || {};
const adminAccessSnap = await db.collection('sys_admin_access').doc(user.uid).get();
const adminAccess = adminAccessSnap.exists ? adminAccessSnap.data() : null;

if (user.emailVerified !== true) {
  throw new Error(`${role}: l adresse de recette doit etre verifiee dans Firebase Auth.`);
}
if (role === 'client') {
  if (claims.admin === true || claims.superAdmin === true || adminAccess?.active === true) {
    throw new Error('CLIENT_ROLE_CONTAMINATED: le compte client possede un droit administrateur.');
  }
} else {
  if (claims.admin !== true && claims.superAdmin !== true) {
    throw new Error('ADMIN_CLAIM_MISSING: aucun claim administrateur actif.');
  }
  if (adminAccess?.active !== true) {
    throw new Error('ADMIN_REGISTRY_INACTIVE: le registre administrateur est absent ou inactif.');
  }
}

const developerClaims = role === 'admin'
  ? { authMethod: 'passkey', authAssurance: 'aal2', userVerified: true }
  : { authMethod: 'email_otp', authAssurance: 'aal1', userVerified: false };
const customToken = await auth.createCustomToken(user.uid, developerClaims);
const appCheckToken = await admin.appCheck().createToken(firebaseAppId, { ttlMillis: 30 * 60 * 1000 });
let callableProbe = null;
if (probeCallable) {
  const probeCustomToken = await auth.createCustomToken(user.uid, developerClaims);
  const authResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseApiKey}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Firebase-AppCheck': appCheckToken.token,
      },
      body: JSON.stringify({ token: probeCustomToken, returnSecureToken: true }),
    },
  );
  if (!authResponse.ok) throw new Error('Echange Custom Token de probe refuse.');
  const authPayload = await authResponse.json();
  if (!authPayload?.idToken) throw new Error('ID Token de probe absent.');
  const callableResponse = await fetch(
    `https://europe-west1-${SANDBOX_PROJECT_ID}.cloudfunctions.net/${probeCallable}`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${authPayload.idToken}`,
        'content-type': 'application/json',
        'X-Firebase-AppCheck': appCheckToken.token,
      },
      body: JSON.stringify({
        data: probeCallable === 'sendGuestCheckoutOtpGen2'
          ? { email: ROLE_EMAILS.client }
          : {},
      }),
    },
  );
  const callablePayload = await callableResponse.json().catch(() => null);
  if (!callableResponse.ok || callablePayload?.result?.success !== true) {
    const callableStatus = String(callablePayload?.error?.status || 'UNKNOWN').replace(/[^A-Z_]/g, '');
    throw new Error(`Callable de probe sandbox refuse (${callableResponse.status}/${callableStatus}).`);
  }
  callableProbe = {
    name: probeCallable,
    httpStatus: callableResponse.status,
    success: true,
    migrated: typeof callablePayload?.result?.migrated === 'boolean' ? callablePayload.result.migrated : null,
    role: ['owner', 'admin'].includes(callablePayload?.result?.role) ? callablePayload.result.role : null,
  };
}
const runId = `sandbox_role_${role}_${crypto.randomUUID()}`;
const targetPath = role === 'admin' ? '/admin' : '/mes-commandes';
const browser = await chromium.launch({ headless: !headed });

try {
  const context = await browser.newContext({ locale: 'fr-FR' });
  await context.route('https://identitytoolkit.googleapis.com/**', async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        'X-Firebase-AppCheck': appCheckToken.token,
      },
    });
  });
  await context.route('**/*.cloudfunctions.net/**', async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        'X-Firebase-AppCheck': appCheckToken.token,
      },
    });
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}${targetPath}?e2e_run=${encodeURIComponent(runId)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await page.waitForFunction(() => typeof window.__svE2ELoginWithCustomToken === 'function', null, {
    timeout: 30_000,
  });

  const signedIn = await page.evaluate(async ({ token, method }) => (
    window.__svE2ELoginWithCustomToken({ token, method })
  ), { token: customToken, method: role === 'admin' ? 'passkey' : 'email_otp' });

  if (signedIn?.uid !== user.uid || String(signedIn?.email || '').toLowerCase() !== email) {
    throw new Error(`${role}: la session navigateur ne correspond pas au compte attendu.`);
  }

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForFunction(({ expectedEmail, expectAdmin }) => (
    String(window.__svAuthUser?.email || '').toLowerCase() === expectedEmail
      && window.__svAuthIsAdmin === expectAdmin
  ), { expectedEmail: email, expectAdmin: role === 'admin' }, { timeout: 45_000 });

  if (role === 'admin') {
    await expect(page.getByText('Acces admin refuse')).toHaveCount(0);
    await expect(page.getByText('Confirmez votre identite')).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: "Navigation de l'administration" })).toBeVisible({ timeout: 45_000 });
    if (expectedUserCount) {
      const userCountLabel = page.getByText('Clients inscrits', { exact: true });
      await expect(userCountLabel).toBeVisible({ timeout: 45_000 });
      await expect(page.getByLabel('Clients inscrits en cours de chargement')).toHaveCount(0, { timeout: 45_000 });
      const userCountCard = userCountLabel.locator('..').locator('..').locator('..');
      await expect(userCountCard.getByText(expectedUserCount, { exact: true })).toBeVisible({ timeout: 15_000 });
    }
    if (expectedQuote) {
      await page.getByRole('button', { name: 'Devis', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Demandes de restauration' })).toBeVisible({ timeout: 30_000 });
      const quoteCard = page.getByRole('button').filter({ hasText: expectedQuote });
      await expect(quoteCard).toBeVisible({ timeout: 30_000 });
      await quoteCard.click();
      await expect(page.getByText(expectedQuote, { exact: true }).last()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText('Recette Client', { exact: true }).last()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/RECETTE SANDBOX/).last()).toBeVisible({ timeout: 30_000 });
    }
  } else {
    await expect(page.getByRole('complementary', { name: 'Navigation de l’espace client' })).toBeVisible({ timeout: 45_000 });
  }

  process.stdout.write(JSON.stringify({
    status: 'passed',
    role,
    email,
    target: `${baseUrl}${targetPath}`,
    sessionType: 'ephemeral_custom_token',
    realLoginCeremonyTested: false,
    callableProbe,
    userCountVerified: expectedUserCount ? Number(expectedUserCount) : null,
    quoteVerified: Boolean(expectedQuote),
  }, null, 2));

  if (keepOpen) {
    process.stdout.write('\nSession ouverte. Fermez la fenetre pour terminer.\n');
    await new Promise((resolve) => browser.on('disconnected', resolve));
  } else {
    await context.close();
  }
} finally {
  if (browser.isConnected()) await browser.close();
}
