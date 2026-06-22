import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';
import { chromium, expect } from '@playwright/test';

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
if (!process.env.E2E_PROOF_TOKEN) {
  const proofTokenPath = path.join(process.cwd(), 'logs', 'e2e-proof-token.txt');
  if (fs.existsSync(proofTokenPath)) {
    process.env.E2E_PROOF_TOKEN = fs.readFileSync(proofTokenPath, 'utf8').trim();
  }
}

const HOSTED_URL = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';
const baseUrl = (process.env.NEXT_BASE_URL || HOSTED_URL).replace(/\/$/, '');
const email = process.env.E2E_EMAIL;
const mailboxUser = process.env.E2E_MAILBOX_USER || email;
const passwordProvided = Boolean(process.env.E2E_PASSWORD);
const password = process.env.E2E_PASSWORD || `SvTest-${Date.now()}-Aa1!`;
const headless = String(process.env.E2E_HEADLESS || 'false').toLowerCase() === 'true';
const appCheckDebugToken = process.env.E2E_APPCHECK_DEBUG_TOKEN || '';
const checkoutMode = String(
  process.env.E2E_CHECKOUT_MODE || (passwordProvided ? 'verified-user' : 'guest-otp')
).trim().toLowerCase();
const otpCode = String(process.env.E2E_OTP_CODE || '').replace(/\D/g, '').slice(0, 6);
const sendOtpOnly = String(process.env.E2E_SEND_OTP_ONLY || 'false').toLowerCase() === 'true';
const confirmStripePayment = String(process.env.E2E_CONFIRM_STRIPE || 'true').toLowerCase() !== 'false';
const stripeCardNumber = String(process.env.E2E_STRIPE_CARD || '4242424242424242').replace(/\s/g, '');
const expectStripeFailure = String(process.env.E2E_EXPECT_STRIPE_FAILURE || 'false').toLowerCase() === 'true';
const targetProductId = String(process.env.E2E_STRIPE_PRODUCT_ID || 'sv-e2e-stripe-refund-product').trim();
const skipProductsPattern = String(process.env.E2E_SKIP_PRODUCTS_REGEX || '').trim();
const skipProductsRegex = skipProductsPattern ? new RegExp(skipProductsPattern, 'i') : null;
const allowNonSandboxTarget = String(process.env.E2E_ALLOW_NON_SANDBOX || 'false').toLowerCase() === 'true';
const proofToken = process.env.E2E_PROOF_TOKEN || '';
const proofUrl = process.env.E2E_PROOF_URL || 'https://us-central1-secondevienextjsssr.cloudfunctions.net/e2eCheckoutProof';
const gmailAppPassword = String(process.env.E2E_GMAIL_APP_PASSWORD || '').replace(/\s/g, '');

const redactSensitiveText = (value) => {
  let text = String(value ?? '');
  const replacements = [
    [/(E2E_PASSWORD|password|pass|motDePasse|mot_de_passe)(["'\s:=]+)([^"',\s&]+)/gi, '$1$2<redacted>'],
    [/(E2E_APPCHECK_DEBUG_TOKEN|appCheckDebugToken|FIREBASE_APPCHECK_DEBUG_TOKEN)(["'\s:=]+)([^"',\s&]+)/gi, '$1$2<redacted>'],
    [/(idToken|refreshToken|accessToken|Authorization|authorization)(["'\s:=]+)(Bearer\s+)?([^"',\s&]+)/gi, '$1$2$3<redacted>'],
    [/(clientSecret|client_secret|payment_intent_client_secret)(["'\s:=]+)([^"',\s&]+)/gi, '$1$2<redacted>'],
    [/([?&]payment_intent_client_secret=)[^&\s]+/gi, '$1<redacted>'],
    [/([?&]client_secret=)[^&\s]+/gi, '$1<redacted>'],
    [/Bearer\s+[A-Za-z0-9._\-]+/g, 'Bearer <redacted>'],
    [/eyJ[A-Za-z0-9._\-]+/g, '<jwt-redacted>'],
    [/([A-Za-z0-9_-]{8}-[A-Za-z0-9_-]{4}-[A-Za-z0-9_-]{4}-[A-Za-z0-9_-]{4}-[A-Za-z0-9_-]{12})/g, '<uuid-redacted>'],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  return text;
};

const redactSensitiveValue = (value) => {
  if (typeof value === 'string') return redactSensitiveText(value);
  if (Array.isArray(value)) return value.map(redactSensitiveValue);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (/password|token|authorization|clientsecret|client_secret|secret/i.test(key)) {
      return [key, item ? '<redacted>' : item];
    }
    return [key, redactSensitiveValue(item)];
  }));
};

const writeResult = () => {
  fs.writeFileSync(resultPath, JSON.stringify(redactSensitiveValue(result), null, 2));
};

const buildFailureText = (error) => [
  error?.message || String(error || ''),
  ...(result.console || []).map((entry) => `${entry.type}: ${entry.text}`),
  ...(result.requestFailures || []).map((entry) => `${entry.url} ${entry.failure}`),
  ...(result.identityToolkitResponses || []).map((entry) => `${entry.status} ${entry.body}`),
].join('\n');

const classifyKnownFailure = (error) => {
  const text = buildFailureText(error);
  const rules = [
    {
      code: 'app-check-debug-token-blocked',
      status: 'known-blocked-app-check',
      pattern: /app\s*check|appcheck|debug token|exchangeDebugToken|throttle/i,
      guidance: 'Register E2E_APPCHECK_DEBUG_TOKEN in Firebase Console App Check sandbox, then rerun the smoke/E2E.',
    },
    {
      code: 'otp-rate-limited-or-missing',
      status: 'known-blocked-otp',
      pattern: /trop de codes|too_many_attempts|quota|otp|code.*validation|missing-e2e-otp-code|missing-e2e-login-otp-code|otp-sent-awaiting-code/i,
      guidance: 'Use a fresh Gmail alias, provide E2E_GMAIL_APP_PASSWORD, or rerun after the OTP rate limit cools down.',
    },
    {
      code: 'seed-product-missing',
      status: 'known-blocked-seed-product',
      pattern: /Dedicated E2E product|e2e:seed-stripe-product|No available product/i,
      guidance: 'Run npm run e2e:seed-stripe-product against the sandbox before the hosted checkout E2E.',
    },
    {
      code: 'proof-token-missing-or-rejected',
      status: 'known-blocked-proof-token',
      pattern: /missing-e2e-proof-token|Checkout proof failed: HTTP (401|403)/i,
      guidance: 'Provide logs/e2e-proof-token.txt or E2E_PROOF_TOKEN locally; do not commit or print the token.',
    },
    {
      code: 'expected-stripe-card-failure',
      status: 'known-stripe-failure',
      pattern: /erreur de paiement|fonds insuffisants|paiement.*echou|paiement.*echec|paiement.*refus|card.*declined|payment.*fail/i,
      guidance: 'Expected only when E2E_EXPECT_STRIPE_FAILURE=true; otherwise inspect Stripe/payment UI.',
      when: () => expectStripeFailure,
    },
  ];

  for (const rule of rules) {
    if (rule.when && !rule.when()) continue;
    if (!rule.pattern.test(text)) continue;
    return {
      code: rule.code,
      status: rule.status,
      guidance: rule.guidance,
    };
  }

  return null;
};

const allowedCheckoutModes = new Set(['verified-user', 'guest-otp']);
const isSandboxOrLocalTarget = (
  baseUrl === HOSTED_URL ||
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
);

if (!email) {
  console.error('Missing E2E_EMAIL. Example: $env:E2E_EMAIL="client-test@example.com"; npm run e2e:hosted-stripe');
  process.exit(1);
}

if (!allowedCheckoutModes.has(checkoutMode)) {
  console.error(`Unsupported E2E_CHECKOUT_MODE="${checkoutMode}". Use verified-user or guest-otp.`);
  process.exit(1);
}

if (checkoutMode === 'verified-user' && !passwordProvided) {
  console.error('E2E_CHECKOUT_MODE=verified-user requires E2E_PASSWORD for a pre-verified Firebase user.');
  process.exit(1);
}

if (!isSandboxOrLocalTarget && !allowNonSandboxTarget) {
  console.error(`Refusing to run checkout E2E against non-sandbox target: ${baseUrl}`);
  console.error('Set E2E_ALLOW_NON_SANDBOX=true only for a known sandbox/staging target with Stripe test keys.');
  process.exit(1);
}

const logDir = path.join(process.cwd(), 'logs');
fs.mkdirSync(logDir, { recursive: true });

const runId = new Date().toISOString().replace(/[:.]/g, '-');
const resultPath = path.join(logDir, `hosted-stripe-e2e-${runId}.json`);

const waitForSettled = async (page) => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);
};

const galleryUrl = () => {
  if (!targetProductId) return `${baseUrl}/galerie`;
  return `${baseUrl}/galerie?e2e_run=${encodeURIComponent(runId)}`;
};

const clickFirstVisible = async (locators, label) => {
  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const item = locator.nth(index);
      if (await item.isVisible().catch(() => false)) {
        await item.click();
        return;
      }
    }
  }
  throw new Error(`Unable to click ${label}`);
};

const clickEnabledButtonContaining = async (page, text, label) => {
  const clicked = await page.evaluate((needle) => {
    const normalizedNeedle = String(needle).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const buttons = Array.from(document.querySelectorAll('button'));
    if (buttons.some((candidate) => {
      const normalizedText = (candidate.textContent || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return normalizedText.includes('securisation');
    })) return true;
    const button = buttons.find((candidate) => {
      const normalizedText = (candidate.textContent || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return !candidate.disabled && normalizedText.includes(normalizedNeedle);
    });
    if (!button) return false;
    button.scrollIntoView({ block: 'center', inline: 'center' });
    button.click();
    return true;
  }, text);
  if (!clicked) {
    result.checkoutButtonDebug = await page.evaluate(() => ({
      buttons: Array.from(document.querySelectorAll('button')).map((button) => ({
        text: (button.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
        disabled: button.disabled,
        visible: Boolean(button.offsetParent)
      })).filter((button) => button.text || button.visible).slice(-20),
      requiredFields: Array.from(document.querySelectorAll('input[required], select[required], textarea[required]')).map((field) => ({
        id: field.id || '',
        name: field.name || '',
        type: field.type || '',
        checked: field.type === 'checkbox' ? field.checked : undefined,
        hasValue: field.type === 'checkbox' ? undefined : Boolean(field.value)
      }))
    }));
    throw new Error(`Unable to click ${label}`);
  }
};

const waitForStripeIntentOpening = async (page) => {
  await Promise.race([
    page.waitForSelector('iframe[src*="stripe.com"], iframe[name^="__privateStripeFrame"]', { timeout: 45_000, state: 'attached' }),
    page.getByText(/securisation|chargement/i).first().waitFor({ timeout: 10_000 }).catch(() => null),
  ]).catch(() => null);
};

const extractStockFromText = (text) => {
  const match = String(text || '').match(/Stock\s*:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
};

const pickCartButton = async (page) => {
  await page.waitForSelector('[data-gallery-cart-button]', { timeout: 30_000 });
  const buttons = await page.locator('[data-gallery-cart-button]').elementHandles();
  const candidates = [];
  let targetCandidate = null;

  for (const button of buttons) {
    const raw = await button.getAttribute('data-cart-item');
    if (!raw) continue;
    try {
      const item = JSON.parse(raw);
      const name = String(item.name || item.title || '');
      const price = Number(item.price || item.currentPrice || item.startingPrice || 0);
      const cardText = await button.evaluate((node) => {
        const card = node.closest('[data-gallery-product-card]') || node.closest('article') || node.parentElement;
        return card?.innerText || '';
      });
      const stock = extractStockFromText(cardText);
      const isKnownUnavailable = skipProductsRegex ? skipProductsRegex.test(name.trim()) : false;
      const id = String(item.id || item.originalId || '').trim();

      if (price <= 0 || isKnownUnavailable || stock === 0) continue;

      const candidate = {
        button,
        id,
        name,
        stock,
        score: [
          id === targetProductId ? 1000 : 0,
          Number.isFinite(stock) && stock >= 2 ? 50 : 0,
          Number.isFinite(stock) && stock >= 1 ? 25 : 0,
          price > 0 ? 10 : 0,
        ].reduce((total, value) => total + value, 0),
      };
      if (targetProductId && id === targetProductId) targetCandidate = candidate;
      candidates.push(candidate);
    } catch {
      continue;
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const selected = targetProductId ? targetCandidate : candidates[0];
  if (!selected) {
    throw new Error(targetProductId
      ? `Dedicated E2E product "${targetProductId}" was not found with positive price and visible stock. Run npm run e2e:seed-stripe-product first.`
      : 'No available product with positive price and visible stock was found for checkout.');
  }

  result.selectedProduct = {
    id: selected.id,
    name: selected.name,
    stock: selected.stock,
    stockBefore: selected.stock,
    score: selected.score,
  };
  return selected.button;
};

const clickCartButton = async (button) => {
  await button.evaluate((node) => {
    node.scrollIntoView({ block: 'center', inline: 'center' });
  });
  await button.click({ force: true }).catch(async () => {
    await button.evaluate((node) => node.click());
  });
};

const clearCartViaFirestoreRest = async (page) => page.evaluate(async () => {
  const readStoredUser = () => new Promise((resolve) => {
    const readFromValue = (value) => {
      if (!value?.uid || !value?.stsTokenManager?.accessToken) return null;
      return {
        uid: value.uid,
        token: value.stsTokenManager.accessToken,
      };
    };

    const localKey = Object.keys(window.localStorage).find((key) => key.startsWith('firebase:authUser:'));
    if (localKey) {
      const user = readFromValue(JSON.parse(window.localStorage.getItem(localKey) || '{}'));
      if (user) {
        resolve(user);
        return;
      }
    }

    if (!window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open('firebaseLocalStorageDb');
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
        db.close();
        resolve(null);
        return;
      }
      const transaction = db.transaction('firebaseLocalStorage', 'readonly');
      const store = transaction.objectStore('firebaseLocalStorage');
      const getAll = store.getAll();
      getAll.onerror = () => {
        db.close();
        resolve(null);
      };
      getAll.onsuccess = () => {
        db.close();
        const row = (getAll.result || []).find((entry) => (
          String(entry?.fbase_key || entry?.key || '').startsWith('firebase:authUser:')
        ));
        resolve(readFromValue(row?.value) || null);
      };
    };
  });

  const storedUser = await readStoredUser();
  if (!storedUser) return { cleared: false, reason: 'missing-auth-user' };

  const base = `https://firestore.googleapis.com/v1/projects/secondevienextjsssr/databases/(default)/documents/users/${storedUser.uid}/cart`;
  const headers = { Authorization: `Bearer ${storedUser.token}` };
  const listResponse = await fetch(base, { headers });
  if (!listResponse.ok) {
    return {
      cleared: false,
      reason: `list-failed-${listResponse.status}`,
      body: await listResponse.text().catch(() => ''),
    };
  }

  const payload = await listResponse.json();
  const documents = payload.documents || [];
  await Promise.all(documents.map((document) => (
    fetch(`https://firestore.googleapis.com/v1/${document.name}`, { method: 'DELETE', headers })
  )));

  return { cleared: true, deleted: documents.length };
});

const addCartItemViaFirestoreRest = async (page, cartSource) => {
  const rawItem = typeof cartSource?.getAttribute === 'function'
    ? await cartSource.getAttribute('data-cart-item')
    : JSON.stringify(cartSource || {});
  if (!rawItem) return { added: false, reason: 'missing-cart-payload' };
  const item = JSON.parse(rawItem);

  return page.evaluate(async (cartItem) => {
    const readStoredUser = () => new Promise((resolve) => {
      const readFromValue = (value) => {
        if (!value?.uid || !value?.stsTokenManager?.accessToken) return null;
        return {
          uid: value.uid,
          token: value.stsTokenManager.accessToken,
        };
      };

      const localKey = Object.keys(window.localStorage).find((key) => key.startsWith('firebase:authUser:'));
      if (localKey) {
        const user = readFromValue(JSON.parse(window.localStorage.getItem(localKey) || '{}'));
        if (user) {
          resolve(user);
          return;
        }
      }

      if (!window.indexedDB) {
        resolve(null);
        return;
      }

      const request = window.indexedDB.open('firebaseLocalStorageDb');
      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
          db.close();
          resolve(null);
          return;
        }
        const transaction = db.transaction('firebaseLocalStorage', 'readonly');
        const store = transaction.objectStore('firebaseLocalStorage');
        const getAll = store.getAll();
        getAll.onerror = () => {
          db.close();
          resolve(null);
        };
        getAll.onsuccess = () => {
          db.close();
          const row = (getAll.result || []).find((entry) => (
            String(entry?.fbase_key || entry?.key || '').startsWith('firebase:authUser:')
          ));
          resolve(readFromValue(row?.value) || null);
        };
      };
    });

    const storedUser = await readStoredUser();
    if (!storedUser) return { added: false, reason: 'missing-auth-user' };

    const encodePart = (value) => encodeURIComponent(String(value || '').trim()).replace(/\./g, '%2E');
    const productId = cartItem.originalId || cartItem.productId || cartItem.id;
    if (!productId) return { added: false, reason: 'missing-product-id' };
    const collectionName = cartItem.collectionName || 'furniture';
    const docId = `cart_${encodePart(collectionName)}_${encodePart(productId)}`;
    const numberField = (value) => {
      const numeric = Number(value || 0);
      return Number.isInteger(numeric) ? { integerValue: String(numeric) } : { doubleValue: numeric };
    };
    const body = {
      fields: {
        originalId: { stringValue: String(productId) },
        collectionName: { stringValue: String(collectionName) },
        name: { stringValue: String(cartItem.name || cartItem.title || 'Piece Seconde Vie') },
        price: numberField(cartItem.price || cartItem.currentPrice || cartItem.startingPrice || 0),
        stock: numberField(cartItem.stock || 0),
        sold: { booleanValue: Boolean(cartItem.sold) },
        priceOnRequest: { booleanValue: Boolean(cartItem.priceOnRequest) },
        image: { stringValue: String(cartItem.image || cartItem.imageUrl || '') },
        material: { stringValue: String(cartItem.material || 'Bois') },
        quantity: numberField(cartItem.quantity || 1),
        addedAt: { timestampValue: new Date().toISOString() },
      },
    };
    const url = `https://firestore.googleapis.com/v1/projects/secondevienextjsssr/databases/(default)/documents/users/${storedUser.uid}/cart/${docId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${storedUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return {
        added: false,
        reason: `write-failed-${response.status}`,
        body: await response.text().catch(() => ''),
      };
    }
    return { added: true, docId };
  }, item);
};

const loadTargetCartItemViaFirestoreRest = async (page) => page.evaluate(async (productId) => {
  const readStoredUser = () => new Promise((resolve) => {
    const readFromValue = (value) => {
      if (!value?.uid || !value?.stsTokenManager?.accessToken) return null;
      return { token: value.stsTokenManager.accessToken };
    };
    const localKey = Object.keys(window.localStorage).find((key) => key.startsWith('firebase:authUser:'));
    if (localKey) {
      const user = readFromValue(JSON.parse(window.localStorage.getItem(localKey) || '{}'));
      if (user) {
        resolve(user);
        return;
      }
    }
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open('firebaseLocalStorageDb');
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
        db.close();
        resolve(null);
        return;
      }
      const transaction = db.transaction('firebaseLocalStorage', 'readonly');
      const store = transaction.objectStore('firebaseLocalStorage');
      const getAll = store.getAll();
      getAll.onerror = () => {
        db.close();
        resolve(null);
      };
      getAll.onsuccess = () => {
        db.close();
        const row = (getAll.result || []).find((entry) => (
          String(entry?.fbase_key || entry?.key || '').startsWith('firebase:authUser:')
        ));
        resolve(readFromValue(row?.value) || null);
      };
    };
  });

  const storedUser = await readStoredUser();
  if (!storedUser) return null;
  const url = `https://firestore.googleapis.com/v1/projects/secondevienextjsssr/databases/(default)/documents/artifacts/secondevie/public/data/furniture/${encodeURIComponent(productId)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${storedUser.token}` } });
  if (!response.ok) return null;
  const document = await response.json();
  const fields = document.fields || {};
  const readString = (name) => fields[name]?.stringValue || '';
  const readNumber = (name) => Number(fields[name]?.integerValue || fields[name]?.doubleValue || 0);
  const readBool = (name) => Boolean(fields[name]?.booleanValue);
  return {
    id: productId,
    originalId: productId,
    collectionName: 'furniture',
    name: readString('name') || readString('title') || '[TEST STRIPE SANDBOX] Produit refund repetable',
    price: readNumber('currentPrice') || readNumber('startingPrice'),
    stock: readNumber('stock'),
    sold: readBool('sold'),
    priceOnRequest: readBool('priceOnRequest'),
    image: '',
    material: readString('material') || 'Bois',
    quantity: 1,
  };
}, targetProductId);

const loginWithE2EHook = async (page) => {
  if (!passwordProvided) return false;

  const hookReady = await page.waitForFunction(() => (
    typeof window.__svE2ELoginWithEmail === 'function'
  ), null, { timeout: 10_000 }).catch(() => null);
  if (!hookReady) return false;

  const loginResult = await page.evaluate(async ({ loginEmail, loginPassword }) => (
    window.__svE2ELoginWithEmail({ email: loginEmail, password: loginPassword })
  ), { loginEmail: email, loginPassword: password });

  if (!loginResult?.uid) return false;
  result.browserPasswordLogin = {
    uid: loginResult.uid,
    email: loginResult.email,
    emailVerified: Boolean(loginResult.emailVerified),
  };
  await syncBrowserAuthEvent(page);
  return true;
};

const ensureLoggedIn = async (page) => {
  if (await loginWithE2EHook(page)) {
    return true;
  }

  await clickFirstVisible([
    page.getByRole('button', { name: /Ouvrir la connexion/i }),
    page.locator('button').filter({ hasText: /^Connexion$/i }),
  ], 'open login');

  const loginDialog = page.getByRole('dialog', { name: /Connexion Seconde Vie/i });
  await expect(loginDialog).toBeVisible({ timeout: 30_000 });

  const emailInput = loginDialog.locator('input[name="email"], input[type="email"]').first();
  await emailInput.fill(email);

  const passwordInput = loginDialog.locator('input[name="password"], input[type="password"]').first();
  if (passwordProvided && await passwordInput.isVisible({ timeout: 1_500 }).catch(() => false)) {
    await passwordInput.fill(password);
    await clickFirstVisible([
      loginDialog.getByRole('button', { name: /^Connexion$/i }),
      loginDialog.locator('button[type="submit"]').filter({ hasText: /Connexion/i }),
    ], 'login submit');
    await expect(loginDialog).toBeHidden({ timeout: 30_000 });
    await syncBrowserAuthEvent(page);
    return true;
  }

  const otpRequestedAt = Date.now();
  await clickFirstVisible([
    loginDialog.getByRole('button', { name: /Recevoir mon code|Envoyer le code/i }),
    loginDialog.locator('button[type="submit"]').filter({ hasText: /Recevoir mon code|Envoyer le code/i }),
  ], 'request login OTP');

  const loginOtpCode = otpCode || await waitForGmailOtp({ afterTimestamp: otpRequestedAt });
  if (!/^\d{6}$/.test(loginOtpCode)) {
    throw new Error('missing-e2e-login-otp-code');
  }

  for (let index = 0; index < 6; index += 1) {
    await loginDialog.locator(`[data-otp-index="${index}"]`).fill(loginOtpCode[index]);
  }
  await clickFirstVisible([
    loginDialog.getByRole('button', { name: /^Se connecter$/i }),
    loginDialog.locator('button[type="submit"]').filter({ hasText: /Se connecter/i }),
  ], 'login OTP submit');
  if (await loginDialog.getByText(/Connexion reussie|Connexion réussie/i).isVisible({ timeout: 15_000 }).catch(() => false)) {
    await clickFirstVisible([
      loginDialog.getByRole('button', { name: /Continuer/i }),
      loginDialog.locator('button').filter({ hasText: /Continuer/i }),
    ], 'continue after login');
  }
  if (await loginDialog.isVisible({ timeout: 1_500 }).catch(() => false)) {
    await clickFirstVisible([
      loginDialog.getByRole('button', { name: /Fermer la connexion/i }),
      loginDialog.locator('button[aria-label="Fermer la connexion"]'),
    ], 'close login modal after auth');
  }
  await expect(loginDialog).toBeHidden({ timeout: 30_000 });
  await syncBrowserAuthEvent(page);
  return true;
};

const clearCartIfNeeded = async (page) => {
  const restClearResult = await clearCartViaFirestoreRest(page);
  result.cartClear = restClearResult;
  if (restClearResult.cleared) return;

  await clickFirstVisible([
    page.getByRole('button', { name: /^Panier$/i }),
  ], 'open cart');
  await page.waitForTimeout(1_000);

  const removeButtons = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /^$/ });
  const trashButtons = page.locator('button[class*="hover:text-red"], button[class*="hover:bg-red"]');
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const count = await trashButtons.count().catch(() => 0);
    if (count === 0) break;
    await trashButtons.first().click().catch(() => null);
    await page.waitForTimeout(500);
  }
  await expect(trashButtons).toHaveCount(0, { timeout: 10_000 }).catch(() => null);

  if (await page.getByText(/Votre panier/i).isVisible({ timeout: 2_000 }).catch(() => false)) {
    await page.mouse.click(80, 520).catch(() => null);
    await expect(page.getByText(/Votre panier/i)).toBeHidden({ timeout: 5_000 }).catch(() => null);
  }

  await removeButtons.count().catch(() => 0);
};

const syncBrowserAuthEvent = async (page) => {
  const readStoredUser = async () => page.evaluate(async () => {
    const readFromValue = (value) => {
      if (!value?.uid || !value?.stsTokenManager?.accessToken) return null;
      return {
        uid: value.uid,
        email: value.email,
        stsTokenManager: {
          accessToken: value.stsTokenManager.accessToken,
        },
      };
    };

    if (window.__svAuthUser?.uid && typeof window.__svAuthUser.getIdToken === 'function') {
      const token = await window.__svAuthUser.getIdToken().catch(() => '');
      if (token) {
        return {
          uid: window.__svAuthUser.uid,
          email: window.__svAuthUser.email,
          stsTokenManager: { accessToken: token },
        };
      }
    }

    const readIndexedDbUser = () => new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const request = window.indexedDB.open('firebaseLocalStorageDb');
      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
          db.close();
          resolve(null);
          return;
        }
        const transaction = db.transaction('firebaseLocalStorage', 'readonly');
        const store = transaction.objectStore('firebaseLocalStorage');
        const getAll = store.getAll();
        getAll.onerror = () => {
          db.close();
          resolve(null);
        };
        getAll.onsuccess = () => {
          db.close();
          const row = (getAll.result || []).find((entry) => (
            String(entry?.fbase_key || entry?.key || '').startsWith('firebase:authUser:')
          ));
          resolve(row?.value || null);
        };
      };
    });

    const key = Object.keys(window.localStorage).find((item) => item.startsWith('firebase:authUser:'));
    if (key) {
      const user = readFromValue(JSON.parse(window.localStorage.getItem(key) || '{}'));
      if (user) return user;
    }

    return readFromValue(await readIndexedDbUser());
  });

  let storedUser = null;
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    storedUser = await readStoredUser();
    if (storedUser?.uid && storedUser?.stsTokenManager?.accessToken) break;
    await page.waitForTimeout(500);
  }

  if (!storedUser?.uid) {
    const authStorageDebug = await page.evaluate(async () => {
      const localStorageKeys = Object.keys(window.localStorage);
      const databases = typeof window.indexedDB.databases === 'function'
        ? await window.indexedDB.databases().catch(() => [])
        : [];
      const firebaseLocalStorageRows = await new Promise((resolve) => {
        if (!window.indexedDB) {
          resolve([]);
          return;
        }
        const request = window.indexedDB.open('firebaseLocalStorageDb');
        request.onerror = () => resolve([]);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
            db.close();
            resolve([]);
            return;
          }
          const transaction = db.transaction('firebaseLocalStorage', 'readonly');
          const store = transaction.objectStore('firebaseLocalStorage');
          const getAll = store.getAll();
          getAll.onerror = () => {
            db.close();
            resolve([]);
          };
          getAll.onsuccess = () => {
            db.close();
            resolve((getAll.result || []).map((entry) => ({
              keys: Object.keys(entry || {}),
              fbase_key: entry?.fbase_key || null,
              key: entry?.key || null,
              valueKeys: entry?.value ? Object.keys(entry.value) : [],
              valueUid: entry?.value?.uid || null,
              valueEmail: entry?.value?.email || null,
            })));
          };
        };
      });
      return {
        hasWindowAuthUser: Boolean(window.__svAuthUser?.uid),
        hasWindowAuthToken: Boolean(await window.__svAuthUser?.getIdToken?.().catch(() => '')),
        localStorageKeys,
        indexedDbNames: databases.map((database) => database.name).filter(Boolean),
        firebaseLocalStorageRows,
      };
    });
    result.authStorageDebug = authStorageDebug;
    throw new Error('Firebase browser auth user was not persisted after login');
  }

  await page.evaluate((storedUserValue) => {
    const user = {
      uid: storedUserValue.uid,
      email: storedUserValue.email,
      isAnonymous: false,
      getIdToken: () => Promise.resolve(storedUserValue.stsTokenManager?.accessToken || ''),
    };
    window.__svAuthUser = user;
    window.dispatchEvent(new CustomEvent('sv:auth-user-changed', { detail: { user } }));
  }, storedUser);
};

const escapeImapString = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const createImapClient = async ({ user, pass }) => new Promise((resolve, reject) => {
  const socket = tls.connect(993, 'imap.gmail.com', { servername: 'imap.gmail.com' });
  socket.setEncoding('utf8');

  let buffer = '';
  let tagIndex = 0;
  let ready = false;
  const pending = [];

  const cleanup = () => {
    socket.removeAllListeners();
    socket.end();
  };

  const runPending = () => {
    if (!ready || pending.length === 0) return;
    const next = pending.shift();
    next();
  };

  const send = (command) => new Promise((commandResolve, commandReject) => {
    const execute = () => {
      const tag = `A${String(++tagIndex).padStart(4, '0')}`;
      const chunks = [];
      const onData = (chunk) => {
        buffer += chunk;
        const taggedIndex = buffer.indexOf(`${tag} `);
        if (taggedIndex === -1) return;
        chunks.push(buffer.slice(0, taggedIndex));
        const lineEnd = buffer.indexOf('\n', taggedIndex);
        if (lineEnd === -1) return;
        const taggedLine = buffer.slice(taggedIndex, lineEnd + 1);
        chunks.push(taggedLine);
        buffer = buffer.slice(lineEnd + 1);
        socket.off('data', onData);
        runPending();
        if (/\bOK\b/i.test(taggedLine)) commandResolve(chunks.join(''));
        else commandReject(new Error(`IMAP command failed: ${taggedLine.trim()}`));
      };
      socket.on('data', onData);
      socket.write(`${tag} ${command}\r\n`);
    };
    pending.push(execute);
    runPending();
  });

  socket.on('error', (error) => {
    cleanup();
    reject(error);
  });
  const onGreetingData = (chunk) => {
    buffer += chunk;
    if (!ready && /^\* OK/im.test(buffer)) {
      ready = true;
      buffer = '';
      socket.off('data', onGreetingData);
      resolve({ send, cleanup });
      runPending();
    }
  };
  socket.on('data', onGreetingData);
});

const parseEmailDate = (rawMessage) => {
  const match = String(rawMessage || '').match(/^Date:\s*(.+)$/im);
  if (!match) return 0;
  const timestamp = Date.parse(match[1].trim());
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const extractOtpFromMail = (rawMessage, afterTimestamp) => {
  const messageDate = parseEmailDate(rawMessage);
  if (messageDate && afterTimestamp && messageDate < afterTimestamp - 5_000) return '';
  const decoded = String(rawMessage || '').replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return '';
    }
  });
  const body = decoded.split(/\r?\n\r?\n/).slice(1).join('\n');
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const candidates = [
    /votre code de validation seconde vie est\s*:?\s*(\d{6})/i,
    /votre code de connexion seconde vie est\s*:?\s*(\d{6})/i,
    /code de validation(?:\s|&nbsp;|[^\d]){0,120}(\d{6})/i,
    /code de connexion(?:\s|&nbsp;|[^\d]){0,120}(\d{6})/i,
  ];
  for (const pattern of candidates) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
};

const readLatestOtpFromGmail = async ({ user, pass, afterTimestamp }) => {
  const imap = await createImapClient({ user, pass });
  try {
    await imap.send(`LOGIN "${escapeImapString(user)}" "${escapeImapString(pass)}"`);
    await imap.send('SELECT "INBOX"');
    const searchResponse = await imap.send('UID SEARCH ALL');
    const searchLine = searchResponse.split(/\r?\n/).find((line) => /^\* SEARCH/i.test(line)) || '';
    const uids = searchLine.replace(/^\* SEARCH\s*/i, '').trim().split(/\s+/).filter(Boolean).slice(-20).reverse();
    for (const uid of uids) {
      const response = await imap.send(`UID FETCH ${uid} (BODY.PEEK[])`);
      const code = extractOtpFromMail(response, afterTimestamp);
      if (code) return code;
    }
    return '';
  } finally {
    await imap.send('LOGOUT').catch(() => null);
    imap.cleanup();
  }
};

const waitForGmailOtp = async ({ afterTimestamp }) => {
  if (!gmailAppPassword) return '';
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < 90_000) {
    try {
      const code = await readLatestOtpFromGmail({
        user: mailboxUser,
        pass: gmailAppPassword,
        afterTimestamp,
      });
      if (code) return code;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  if (lastError) {
    result.mailOtpError = lastError.message || String(lastError);
  }
  return '';
};

const createAccountIfNeeded = async (page) => {
  const loginDialog = page.getByRole('dialog', { name: /Connexion Seconde Vie/i });
  await expect(loginDialog).toBeVisible({ timeout: 30_000 });

  if (passwordProvided) {
    await loginDialog.locator('input[name="email"]').fill(email);
    await loginDialog.locator('input[name="password"]').fill(password);
    await clickFirstVisible([
      loginDialog.getByRole('button', { name: /^Connexion$/i }),
      loginDialog.locator('button[type="submit"]').filter({ hasText: /Connexion/i }),
    ], 'login submit');
    await expect(loginDialog).toBeHidden({ timeout: 30_000 });
    await syncBrowserAuthEvent(page);
    return;
  }

  await clickFirstVisible([
    page.getByRole('button', { name: /Creer un compte client|Créer un compte client/i }),
    page.locator('button').filter({ hasText: /Creer un compte client|Créer un compte client/i }),
  ], 'create account switch');

  await loginDialog.locator('input[name="email"]').fill(email);
  await loginDialog.locator('input[name="password"]').fill(password);
  await loginDialog.locator('input[name="confirmPassword"]').fill(password);
  await clickFirstVisible([
    page.getByRole('button', { name: /Creer mon compte|Créer mon compte/i }),
    page.locator('button[type="submit"]').filter({ hasText: /Creer mon compte|Créer mon compte/i }),
  ], 'create account submit');

  const alreadyExistsToast = page.getByText(/deja associe|déjà associé|Connectez-vous/i);
  if (await alreadyExistsToast.isVisible({ timeout: 5_000 }).catch(() => false)) {
    if (!passwordProvided) {
      throw new Error('Account already exists. Rerun with E2E_PASSWORD for repeatable login.');
    }
    await clickFirstVisible([
      page.locator('button').filter({ hasText: /deja un compte|déjà un compte|J.ai deja|J.ai déjà/i }),
    ], 'switch to login');
    await loginDialog.locator('input[name="email"]').fill(email);
    await loginDialog.locator('input[name="password"]').fill(password);
    await clickFirstVisible([
      loginDialog.getByRole('button', { name: /^Connexion$/i }),
      loginDialog.locator('button[type="submit"]').filter({ hasText: /Connexion/i }),
    ], 'login submit');
    await expect(loginDialog).toBeHidden({ timeout: 30_000 });
    await syncBrowserAuthEvent(page);
    return;
  }

  await expect(page.getByText(/Verifiez vos emails|Vérifiez vos emails/i)).toBeVisible({ timeout: 30_000 });
  await clickFirstVisible([
    page.getByRole('button', { name: /C'est compris/i }),
    page.locator('button').filter({ hasText: /C'est compris/i }),
  ], 'account success close');
  await syncBrowserAuthEvent(page);
};

const handleGuestOtpIfNeeded = async (page) => {
  const otpInput = page.locator('#checkout-otp-code');
  const otpVisible = await otpInput.isVisible({ timeout: checkoutMode === 'guest-otp' ? 15_000 : 1_500 }).catch(() => false);
  if (checkoutMode !== 'guest-otp' && !otpVisible) return true;
  await expect(otpInput).toBeVisible({ timeout: 15_000 });
  const otpRequestedAfter = Date.now();
  result.guestOtp = {
    required: true,
    sent: false,
    verified: false,
    hasProvidedCode: otpCode.length === 6,
    canReadMailbox: Boolean(gmailAppPassword),
  };

  if (!otpCode && !gmailAppPassword && !sendOtpOnly) {
    result.guestOtp.reason = 'missing-e2e-otp-code';
    return false;
  }

  if (!otpCode) {
    await clickFirstVisible([
      page.getByRole('button', { name: /Envoyer le code|Renvoyer un code/i }),
      page.locator('button').filter({ hasText: /Envoyer le code|Renvoyer un code/i }),
    ], 'send guest checkout OTP');

    result.guestOtp.sent = true;
    await expect(page.getByRole('button', { name: /Envoyer le code|Renvoyer un code/i }).first()).toBeEnabled({ timeout: 30_000 });
  }

  if (!otpCode) {
    const mailboxCode = await waitForGmailOtp({ afterTimestamp: otpRequestedAfter });
    if (!mailboxCode) {
      result.guestOtp.reason = 'otp-sent-awaiting-code';
      return false;
    }
    result.guestOtp.readFromMailbox = true;
    await otpInput.click();
    await otpInput.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await otpInput.type(mailboxCode, { delay: 25 });
  } else {
    await otpInput.click();
    await otpInput.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await otpInput.type(otpCode, { delay: 25 });
  }

  await expect(page.getByRole('button', { name: /Valider/i }).first()).toBeEnabled({ timeout: 10_000 });
  await clickFirstVisible([
    page.getByRole('button', { name: /Valider/i }),
    page.locator('button').filter({ hasText: /Valider/i }),
  ], 'verify guest checkout OTP');

  await expect(page.getByText(/Email verifie|Email vérifié/i).first()).toBeVisible({ timeout: 30_000 });
  result.guestOtp.verified = true;
  return true;
};

const fillCheckout = async (page) => {
  await page.goto(`${baseUrl}/checkout`, { waitUntil: 'domcontentloaded' });
  await waitForSettled(page);
  if (checkoutMode === 'verified-user') {
    await syncBrowserAuthEvent(page);
  }

  await expect(page.locator('#checkout-fullName')).toBeVisible({ timeout: 30_000 });
  await page.locator('#checkout-fullName').fill('Client Test Seconde Vie');
  await page.locator('#checkout-phone').fill('0600000000');
  await page.locator('#checkout-email').fill(email);
  await page.locator('#checkout-address').fill('1 Rue de la Paix');
  await page.locator('#checkout-zip').fill('75002');
  await page.locator('#checkout-city').fill('Paris');
  await page.getByText(/Retrait . l'atelier|Retrait à l'atelier/i).click({ timeout: 10_000 }).catch(() => {});

  const rgpd = page.locator('input[type="checkbox"]').last();
  if (!(await rgpd.isChecked().catch(() => false))) {
    await page.locator('label').filter({ hasText: /J'accepte les conditions/i }).click();
  }

  const canProceedAfterOtp = await handleGuestOtpIfNeeded(page);
  if (!canProceedAfterOtp) return false;

  await page.getByText(/Carte \/ Wallets/i).click({ timeout: 10_000 }).catch(() => {});
  await clickEnabledButtonContaining(page, 'paiement', 'checkout payment button');
  await waitForStripeIntentOpening(page);
  if (await Promise.resolve(true)) return true;
  await clickFirstVisible([
    page.getByRole('button', { name: /Proceder au paiement securise|Procéder au paiement sécurisé/i }),
    page.locator('button').filter({ hasText: /paiement/i }),
  ], 'checkout payment button').catch(() => clickEnabledButtonContaining(page, 'paiement', 'checkout payment button'));
  return true;
};

const fillStripePaymentElement = async (page) => {
  const emailVerificationError = page.getByText(/verifier votre email|vérifier votre email/i);
  if (await emailVerificationError.isVisible({ timeout: 8_000 }).catch(() => false)) {
    throw new Error('Checkout blocked: Firebase user email must be verified before payment.');
  }

  const stockError = page.getByText(/Article indisponible|Stock epuis|Stock épuis/i);
  if (await stockError.isVisible({ timeout: 2_000 }).catch(() => false)) {
    throw new Error('Checkout blocked: selected cart item is out of stock.');
  }

  await page.waitForSelector('iframe[src*="stripe.com"], iframe[name^="__privateStripeFrame"]', { timeout: 45_000, state: 'attached' });
  await page.waitForTimeout(2_000);

  const fillStrategies = ([
    { pattern: /card number|numero de carte|numéro de carte/i, value: '4242424242424242' },
    { pattern: /expiration|date d'expiration|expiry/i, value: '1234' },
    { pattern: /security code|code de securite|code de sécurité|cvc/i, value: '123' },
    { pattern: /zip|postal|code postal/i, value: '75002' },
  ]).map((strategy) => (
    strategy.pattern.source.includes('card number')
      ? { ...strategy, value: stripeCardNumber }
      : strategy
  ));

  for (const { pattern, value } of fillStrategies) {
    let filled = false;
    for (const frame of page.frames()) {
      const candidates = [
        frame.getByLabel(pattern),
        frame.getByPlaceholder(pattern),
        frame.locator('input').filter({ hasText: pattern }),
      ];
      for (const candidate of candidates) {
        const count = await candidate.count().catch(() => 0);
        for (let index = 0; index < count; index += 1) {
          const field = candidate.nth(index);
          if (!(await field.isVisible().catch(() => false))) continue;
          await field.fill(value).catch(async () => {
            await field.click();
            await field.pressSequentially(value);
          });
          filled = true;
          break;
        }
        if (filled) break;
      }
      if (filled) break;
    }
    if (!filled && pattern.source.includes('card number')) {
      throw new Error('Stripe card field was not found');
    }
  }

  result.stripe = {
    paymentElementReady: true,
    confirmSkipped: !confirmStripePayment,
    testCard: stripeCardNumber.replace(/(.{4})/g, '$1 ').trim(),
    expectFailure: expectStripeFailure,
  };

  if (!confirmStripePayment) return false;

  await clickFirstVisible([
    page.getByRole('button', { name: /Payer/i }),
    page.locator('button[type="submit"]').filter({ hasText: /Payer/i }),
  ], 'Stripe pay button');

  return true;
};

const fetchCheckoutProof = async () => {
  if (!proofToken) {
    result.proof = { skipped: true, reason: 'missing-e2e-proof-token' };
    return;
  }

  const response = await fetch(proofUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-e2e-proof-token': proofToken,
    },
    body: JSON.stringify({
      email,
      stockBefore: result.selectedProduct?.stockBefore,
      productId: result.selectedProduct?.id || targetProductId || null,
      selectedProduct: result.selectedProduct?.name || null,
    }),
  });

  const body = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(body);
  } catch {
    payload = { raw: body.slice(0, 2000) };
  }

  result.proof = {
    status: response.status,
    ok: response.ok,
    url: proofUrl,
    payload,
  };

  if (!response.ok) {
    throw new Error(`Checkout proof failed: HTTP ${response.status}`);
  }

  return result.proof;
};

const waitForFailedPaymentProof = async () => {
  let proof = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    proof = await fetchCheckoutProof();
    const payload = proof?.payload || {};
    const stockRestored = payload.order?.stockReserved === false
      && Array.isArray(payload.stock)
      && payload.stock.every((item) => item.exists && item.sold === false);
    if (payload.order?.status === 'payment_failed' && stockRestored) {
      return proof;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  return proof;
};

const browser = await chromium.launch({ headless });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  locale: 'fr-FR',
});

if (appCheckDebugToken) {
  await context.addInitScript((token) => {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = token === 'true' ? true : token;
  }, appCheckDebugToken);
}

const page = await context.newPage();

const result = {
  baseUrl,
  email,
  checkoutMode,
  generatedPassword: false,
  password: passwordProvided ? '<provided>' : null,
  targetProductId,
  skipProductsRegex: skipProductsPattern || null,
  sendOtpOnly,
  confirmStripePayment,
  expectStripeFailure,
  sandboxGuard: {
    isSandboxOrLocalTarget,
    allowNonSandboxTarget,
  },
  runId,
  status: 'started',
  console: [],
  requestFailures: [],
};

page.on('console', (message) => {
  result.console.push({ type: message.type(), text: redactSensitiveText(message.text()) });
});

page.on('requestfailed', (request) => {
  result.requestFailures.push({
    url: redactSensitiveText(request.url()),
    method: request.method(),
    failure: request.failure()?.errorText || 'unknown',
  });
});

page.on('response', async (response) => {
  const url = response.url();
  if (!url.includes('identitytoolkit.googleapis.com')) return;
  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '<unavailable>';
  }
  result.identityToolkitResponses = result.identityToolkitResponses || [];
  result.identityToolkitResponses.push({
    url: redactSensitiveText(url),
    status: response.status(),
    body: redactSensitiveText(body.slice(0, 1200)),
  });
});

try {
  await page.goto(galleryUrl(), { waitUntil: 'domcontentloaded' });
  await waitForSettled(page);

  const loggedInBeforeCart = checkoutMode === 'verified-user'
    ? await ensureLoggedIn(page)
    : false;
  if (loggedInBeforeCart) {
    await clearCartIfNeeded(page);
    await page.goto(galleryUrl(), { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    await syncBrowserAuthEvent(page);
  }

  let cartButton = null;
  try {
    cartButton = await pickCartButton(page);
  } catch (error) {
    if (!(checkoutMode === 'verified-user' && loggedInBeforeCart && targetProductId)) {
      throw error;
    }
    const fallbackCartItem = await loadTargetCartItemViaFirestoreRest(page);
    if (!fallbackCartItem || Number(fallbackCartItem.price || 0) <= 0 || Number(fallbackCartItem.stock || 0) <= 0) {
      throw error;
    }
    result.selectedProduct = {
      id: fallbackCartItem.id,
      name: fallbackCartItem.name,
      stock: fallbackCartItem.stock,
      stockBefore: fallbackCartItem.stock,
      score: 1000,
      source: 'firestore-rest-fallback',
    };
    cartButton = fallbackCartItem;
  }
  if (checkoutMode === 'verified-user' && loggedInBeforeCart) {
    const cartSeed = await addCartItemViaFirestoreRest(page, cartButton);
    result.cartSeed = cartSeed;
    if (!cartSeed.added) {
      throw new Error(`Unable to seed verified-user cart: ${cartSeed.reason || 'unknown'}`);
    }
    const checkoutReady = await fillCheckout(page);
    if (!checkoutReady) {
      result.status = 'checkout-not-ready';
      result.finalUrl = redactSensitiveText(page.url());
    } else {
      const stripeSubmitted = await fillStripePaymentElement(page);
      if (!stripeSubmitted) {
        result.status = 'stripe-ready-confirm-skipped';
        result.finalUrl = redactSensitiveText(page.url());
      } else if (expectStripeFailure) {
        await expect(page.getByText(/erreur de paiement|fonds insuffisants|paiement.*echou|paiement.*echec|paiement.*refus|carte.*refus|payment.*fail|declined/i).first()).toBeVisible({ timeout: 60_000 });
        await waitForFailedPaymentProof();
        result.status = 'payment-failure-passed';
        result.finalUrl = redactSensitiveText(page.url());
      } else {
        await expect(page.getByText(/Paiement valide|Paiement valid.|Paiement confirme|Paiement confirmÃ©|Votre commande est confirmee|Votre commande est confirm.e|Votre commande est validee|Votre commande est validÃ©e/i).first()).toBeVisible({ timeout: 60_000 });
        await fetchCheckoutProof();
        result.status = 'passed';
        result.finalUrl = redactSensitiveText(page.url());
      }
    }
  } else {

  await clickCartButton(cartButton);
  if (checkoutMode !== 'guest-otp' && !loggedInBeforeCart) {
    await createAccountIfNeeded(page);
  }

  if (!(await page.getByText(/Votre panier/i).isVisible({ timeout: 5_000 }).catch(() => false))) {
    await clickFirstVisible([
      page.getByRole('button', { name: /^Panier$/i }),
    ], 'open cart after product add');
  }

  await expect(page.getByText(/Votre panier/i)).toBeVisible({ timeout: 30_000 });
  await clickFirstVisible([
    page.getByRole('button', { name: /Commander/i }),
    page.getByRole('button', { name: /Voir le panier/i }),
  ], 'cart checkout button');

  await waitForSettled(page);
  const checkoutReady = await fillCheckout(page);
  if (sendOtpOnly) {
    result.status = result.guestOtp?.sent ? 'otp-sent-awaiting-code' : 'otp-smoke-complete';
    result.finalUrl = redactSensitiveText(page.url());
  } else if (!checkoutReady) {
    result.status = result.guestOtp?.sent ? 'otp-sent-awaiting-code' : 'otp-code-required';
    result.finalUrl = redactSensitiveText(page.url());
  } else {
    const stripeSubmitted = await fillStripePaymentElement(page);
    if (!stripeSubmitted) {
      result.status = 'stripe-ready-confirm-skipped';
      result.finalUrl = redactSensitiveText(page.url());
    } else if (expectStripeFailure) {
      await expect(page.getByText(/erreur de paiement|fonds insuffisants|paiement.*echou|paiement.*echec|paiement.*refus|carte.*refus|payment.*fail|declined/i).first()).toBeVisible({ timeout: 60_000 });
      await waitForFailedPaymentProof();
      result.status = 'payment-failure-passed';
      result.finalUrl = redactSensitiveText(page.url());
    } else {
      await expect(page.getByText(/Paiement valide|Paiement valid.|Paiement confirme|Paiement confirmé|Votre commande est confirmee|Votre commande est confirm.e|Votre commande est validee|Votre commande est validée/i).first()).toBeVisible({ timeout: 60_000 });
      await fetchCheckoutProof();
      result.status = 'passed';
      result.finalUrl = redactSensitiveText(page.url());
    }
  }
  }
} catch (error) {
  const knownFailure = classifyKnownFailure(error);
  result.status = knownFailure?.status || 'failed';
  if (knownFailure) {
    result.knownFailure = knownFailure;
  }
  result.error = error?.message || String(error);
  result.finalUrl = redactSensitiveText(page.url());
  await page.screenshot({ path: path.join(logDir, `hosted-stripe-e2e-${runId}.png`), fullPage: true }).catch(() => {});
  if (!knownFailure) {
    throw error;
  }
  console.warn(`Known E2E blocker classified as ${knownFailure.code}: ${knownFailure.guidance}`);
} finally {
  writeResult();
  await browser.close();
  console.log(`E2E result written to ${resultPath}`);
}
