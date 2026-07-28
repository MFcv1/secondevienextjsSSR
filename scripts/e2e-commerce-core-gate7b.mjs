import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';
import { createRequire } from 'node:module';
import admin from 'firebase-admin';
import { chromium } from '@playwright/test';

const requireFromFunctions = createRequire(
  new URL('../functions/package.json', import.meta.url)
);
const Stripe = requireFromFunctions('stripe');
const {
  createCancellationRuntime,
  createRefundRuntime,
  createReturnRuntime
} = requireFromFunctions('./src/commerce/domain/v2Runtime');
const {
  createOrderCommandRepository
} = requireFromFunctions('./src/commerce/domain/orderCommandRepository');

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const SCOPE_ID = 'fixture_gate6_20260728';
const APP_ID = 'secondevie';
const APP_URL = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';
const FUNCTIONS_BASE = `https://europe-west1-${PROJECT_ID}.cloudfunctions.net`;
const args = new Map(process.argv.slice(2).map((value) => {
  if (!value.startsWith('--')) throw new Error(`GATE7B_ARGUMENT_INVALID:${value}`);
  const [key, ...rest] = value.slice(2).split('=');
  return [key, rest.length ? rest.join('=') : 'true'];
}));
const releaseId = args.get('release');
const runOrdinal = Number(args.get('run'));
const commit = args.get('commit') === 'true';
let failureCleanup = async () => ({ canceled: 0, preserved: 0 });

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function id(prefix, runId) {
  return `${prefix}_${crypto.createHash('sha256').update(`${runId}:${prefix}`)
    .digest('hex').slice(0, 24)}`;
}

function timestamp(value) {
  return typeof value?.toDate === 'function' ? value.toDate().toISOString() : value;
}

function accessSecret(name) {
  const value = execFileSync(
    'pnpm',
    [
      '--silent',
      'exec',
      'firebase',
      'functions:secrets:access',
      name,
      '--project',
      PROJECT_ID
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }
  ).trim();
  invariant(value.length >= 8, `GATE7B_SECRET_UNAVAILABLE:${name}`);
  return value;
}

async function callable(name, data, tokens) {
  const response = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${tokens.idToken}`,
      'X-Firebase-AppCheck': tokens.appCheckToken,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ data })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const error = new Error(`GATE7B_CALLABLE_FAILED:${name}:${response.status}`);
    error.details = payload.error?.details || null;
    throw error;
  }
  return payload.result;
}

async function tokenForUid(
  auth,
  uid,
  apiKey,
  appCheckToken,
  developerClaims = undefined
) {
  const customToken = await auth.createCustomToken(uid, developerClaims);
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    }
  );
  const payload = await response.json().catch(() => ({}));
  invariant(response.ok && payload.idToken, 'GATE7B_AUTH_TOKEN_EXCHANGE_FAILED');
  return { idToken: payload.idToken, appCheckToken };
}

function refs(db) {
  return {
    order: (orderId) => db.doc(`orders/${orderId}`),
    commandResult: (commandId) => db.doc(`commerce_command_results/${commandId}`),
    auditEvent: (orderId, eventId) => db.doc(`orders/${orderId}/events/${eventId}`)
  };
}

function checkoutInput(product, runId, label, quantity = 1) {
  return {
    clientOrderId: id(`client_${label}`, runId),
    items: [{
      cartLineId: id(`line_${label}`, runId),
      cartRevision: 1,
      productId: product.productId,
      collectionName: product.collectionName,
      variantId: product.variantId,
      quantity
    }],
    deliveryModeId: 'fixture_delivery_fr',
    shippingAddress: {
      fullName: 'Test Gate 7B',
      line1: '1 rue du Test',
      line2: '',
      postalCode: '75001',
      city: 'Paris',
      country: 'FR'
    }
  };
}

async function waitFor(getter, predicate, code, timeoutMs = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await getter();
    if (predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(code);
}

function createImapClient({ user, pass }) {
  const socket = tls.connect(993, 'imap.gmail.com', {
    servername: 'imap.gmail.com'
  });
  let buffer = '';
  let sequence = 0;
  const pending = new Map();
  socket.setEncoding('utf8');
  socket.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      for (const [tag, state] of pending) {
        state.lines.push(line);
        if (!line.startsWith(`${tag} `)) continue;
        pending.delete(tag);
        if (line.includes(`${tag} OK`)) state.resolve(state.lines.join('\n'));
        else state.reject(new Error('GATE7B_IMAP_COMMAND_FAILED'));
      }
    }
  });
  const ready = new Promise((resolve, reject) => {
    socket.once('secureConnect', resolve);
    socket.once('error', reject);
  });
  return {
    async send(command) {
      await ready;
      const tag = `A${String(++sequence).padStart(3, '0')}`;
      return new Promise((resolve, reject) => {
        pending.set(tag, { resolve, reject, lines: [] });
        socket.write(`${tag} ${command}\r\n`);
      });
    },
    close() {
      socket.end();
    },
    user,
    pass
  };
}

function decodeQuotedPrintable(value) {
  const binary = String(value || '')
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/gi, (_match, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)));
  return Buffer.from(binary, 'latin1').toString('utf8');
}

function readableEmailBody(message) {
  const decoded = /Content-Transfer-Encoding:\s*quoted-printable/i.test(message)
    ? decodeQuotedPrintable(message)
    : message;
  return decoded
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/\s+/g, ' ');
}

async function readLatestOtp({ user, pass, email, notBefore }) {
  const imap = createImapClient({ user, pass });
  const escape = (value) => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  try {
    await imap.send(`LOGIN "${escape(user)}" "${escape(pass)}"`);
    await imap.send('SELECT "INBOX"');
    const search = await imap.send('UID SEARCH ALL');
    const ids = (search.match(/\* SEARCH ([0-9 ]+)/)?.[1] || '')
      .trim().split(/\s+/).filter(Boolean).slice(-20).reverse();
    for (const uid of ids) {
      const message = await imap.send(`UID FETCH ${uid} (BODY.PEEK[])`);
      if (!message.toLowerCase().includes(email.toLowerCase())) continue;
      const dateMatch = message.match(/^Date:\s*(.+)$/mi);
      if (dateMatch && Date.parse(dateMatch[1]) < notBefore - 60_000) continue;
      const code = readableEmailBody(message)
        .match(/(?:code[^0-9]{0,200})(\d{6})/i)?.[1];
      if (code) return code;
    }
  } finally {
    await imap.send('LOGOUT').catch(() => {});
    imap.close();
  }
  throw new Error('GATE7B_OTP_NOT_FOUND');
}

async function main() {
  invariant(
    args.get('project') === PROJECT_ID &&
      args.get('env') === ENVIRONMENT &&
      /^release_gate7a_[A-Za-z0-9_-]{16,}$/.test(String(releaseId || '')) &&
      [1, 2].includes(runOrdinal),
    'GATE7B_TARGET_INVALID'
  );
  invariant(commit, 'GATE7B_COMMIT_REQUIRED');
  invariant(
    args.get('confirm') === `RUN_GATE7B_${runOrdinal}_${PROJECT_ID}`,
    'GATE7B_CONFIRMATION_INVALID'
  );
  for (const key of [
    'FIREBASE_SERVICE_ACCOUNT_JSON',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_APP_ID',
    'STRIPE_SECRET_KEY',
    'GMAIL_EMAIL',
    'GMAIL_PASSWORD'
  ]) invariant(process.env[key], `GATE7B_ENV_MISSING:${key}`);

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID
    });
  }
  const db = admin.firestore();
  const auth = admin.auth();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const connectWebhookSecret = process.env.STRIPE_CONNECT_WH_SECRET ||
    accessSecret('STRIPE_CONNECT_WH_SECRET');
  const appCheck = await admin.appCheck().createToken(
    process.env.VITE_FIREBASE_APP_ID,
    { ttlMillis: 30 * 60 * 1000 }
  );
  const runId = `run_gate7b_${runOrdinal}_${Date.now()}`;
  const reportPath = path.resolve(
    args.get('report') || `logs/commerce/gate7b/${runId}.json`
  );
  const report = {
    schemaVersion: 1,
    projectId: PROJECT_ID,
    environment: ENVIRONMENT,
    releaseId,
    runId,
    runOrdinal,
    startedAt: new Date().toISOString(),
    scenarios: []
  };
  const record = (name, evidence) => {
    report.scenarios.push({ name, status: 'passed', evidence });
  };

  const [controlSnap, scopeSnap, operationsSnap, releaseSnap, hosted] =
    await Promise.all([
      db.doc('sys_commerce_control/current').get(),
      db.doc(`commerce_fixture_scopes/${SCOPE_ID}`).get(),
      db.doc('sys_commerce_operations/current').get(),
      db.doc(`commerce_release_manifests/${releaseId}`).get(),
      fetch(APP_URL, { redirect: 'manual' })
    ]);
  invariant(controlSnap.exists && scopeSnap.exists && operationsSnap.exists &&
    releaseSnap.exists, 'GATE7B_PREFLIGHT_EVIDENCE_MISSING');
  const control = controlSnap.data();
  const scope = scopeSnap.data();
  const operations = operationsSnap.data();
  const release = releaseSnap.data();
  invariant(
    control.newCheckoutMode === 'v2_fixture' &&
      control.fixtureScopeVersion === SCOPE_ID &&
      control.releaseManifestId === releaseId &&
      control.adminMutationMode === 'read_only' &&
      control.offlinePaymentMode === 'off' &&
      scope.active === true &&
      scope.projectId === PROJECT_ID &&
      release.immutable === true &&
      operations.status === 'healthy' &&
      hosted.status === 200,
    'GATE7B_PREFLIGHT_INVARIANT_FAILED'
  );
  const accountId = release.commerce?.stripeConnectedAccountId ||
    (await db.doc(`commerce_policy_versions/${scope.policyVersion}`).get())
      .data()?.stripeConnectedAccountId;
  invariant(/^acct_[A-Za-z0-9]+$/.test(String(accountId || '')),
    'GATE7B_CONNECT_ACCOUNT_MISSING');
  const account = await stripe.accounts.retrieve(accountId);
  invariant(account.livemode !== true && account.charges_enabled === true,
    'GATE7B_CONNECT_NOT_TEST_READY');

  const fixtureUid = scope.uids[0];
  const fixtureAlias = String(process.env.GMAIL_EMAIL).replace(
    '@',
    `+gate7b-${runOrdinal}-${Date.now()}@`
  );
  await auth.updateUser(fixtureUid, {
    email: fixtureAlias,
    emailVerified: true,
    disabled: false
  });
  const fixtureTokens = await tokenForUid(
    auth,
    fixtureUid,
    process.env.VITE_FIREBASE_API_KEY,
    appCheck.token
  );
  const adminEmail = process.env.E2E_ADMIN_EMAIL ||
    process.env.SUPER_ADMIN_EMAIL ||
    'loa.gto15@gmail.com';
  const adminUser = await auth.getUserByEmail(adminEmail);
  const adminTokens = await tokenForUid(
    auth,
    adminUser.uid,
    process.env.VITE_FIREBASE_API_KEY,
    appCheck.token,
    {
      authMethod: 'passkey',
      authAssurance: 'aal2',
      userVerified: true
    }
  );
  await callable('getCommerceOperationsStatusAdmin', {}, adminTokens);
  record('preflight', {
    hostedStatus: hosted.status,
    controlRevision: control.controlRevision,
    operationsStatus: operations.status,
    fixtureUidMatched: true,
    appCheckAndAal2: true,
    stripeConnectLivemode: false
  });

  const products = Object.fromEntries(scope.fixtureProducts.map((product) => [
    product.productId.match(/stock(\d+)/)?.[1],
    product
  ]));
  invariant(products['1'] && products['2'] && products['10'],
    'GATE7B_FIXTURE_PRODUCTS_INCOMPLETE');

  const createCheckout = (label, product, quantity = 1) => callable(
    'createCheckoutV2',
    {
      input: checkoutInput(product, runId, label, quantity),
      fixture: { runId, fixtureScopeVersion: SCOPE_ID }
    },
    fixtureTokens
  );
  const orderData = async (orderId) => {
    const snapshot = await db.doc(`orders/${orderId}`).get();
    return snapshot.exists ? { ...snapshot.data(), id: snapshot.id } : null;
  };
  const dispatchPaymentIntent = async (paymentIntentId, connectedAccountId) => {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      {},
      { stripeAccount: connectedAccountId }
    );
    invariant(paymentIntent.livemode === false, 'GATE7B_PAYMENT_LIVEMODE_TRUE');
    const raw = JSON.stringify({
      id: id('evt', `${runId}:${paymentIntent.id}:${paymentIntent.status}`),
      object: 'event',
      api_version: '2024-06-20',
      created: Math.floor(Date.now() / 1000),
      data: { object: paymentIntent },
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: `payment_intent.${paymentIntent.status === 'succeeded'
        ? 'succeeded'
        : 'updated'}`,
      account: connectedAccountId
    });
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: raw,
      secret: connectWebhookSecret
    });
    const response = await fetch(`${FUNCTIONS_BASE}/stripeConnectWebhookV2`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signature
      },
      body: raw
    });
    invariant(response.ok, `GATE7B_WEBHOOK_FAILED:${response.status}`);
    return paymentIntent;
  };
  const cancelRuntime = createCancellationRuntime({
    db,
    stripe,
    appId: APP_ID
  });
  const refundRuntime = createRefundRuntime({ db, stripe, appId: APP_ID });
  const returnRuntime = createReturnRuntime({ db, appId: APP_ID });
  const orderCommands = createOrderCommandRepository({
    db: { runTransaction: (operation) => db.runTransaction(operation) },
    refs: refs(db),
    clock: { now: () => new Date().toISOString() }
  });
  const adminActor = { uid: adminUser.uid, role: 'admin', aal2: true };
  const cancel = (checkout, label) => cancelRuntime.cancellations
    .requestCancellation({
      orderId: checkout.orderId,
      commandId: id(`cancel_${label}`, runId),
      ownerUid: fixtureUid,
      reason: `Gate 7B ${label}`
    });
  failureCleanup = async () => {
    const runOrders = await db.collection('orders')
      .where('testContext.runId', '==', runId)
      .get();
    let canceledCount = 0;
    let preservedCount = 0;
    for (const document of runOrders.docs) {
      const order = document.data();
      if (order.checkout?.status !== 'active') {
        preservedCount += 1;
        continue;
      }
      const result = await cancelRuntime.cancellations.requestCancellation({
        orderId: document.id,
        commandId: id(`failure_cleanup_${document.id}`, runId),
        ownerUid: order.userId,
        reason: 'Gate 7B interrupted run cleanup'
      });
      if (result.outcome === 'canceled') canceledCount += 1;
    }
    return { canceled: canceledCount, preserved: preservedCount };
  };
  const confirm = (checkout, paymentMethod) => stripe.paymentIntents.confirm(
    checkout.paymentIntentId,
    {
      payment_method: paymentMethod,
      return_url: `${APP_URL}/checkout`
    },
    { stripeAccount: checkout.connectedAccountId }
  );
  const pay = async (checkout, paymentMethod = 'pm_card_visa') => {
    const paymentIntent = await confirm(checkout, paymentMethod);
    invariant(paymentIntent.livemode === false, 'GATE7B_PAYMENT_LIVEMODE_TRUE');
    await dispatchPaymentIntent(
      checkout.paymentIntentId,
      checkout.connectedAccountId
    );
    return waitFor(
      () => orderData(checkout.orderId),
      (order) => order?.payment?.status === 'succeeded',
      'GATE7B_PAYMENT_NOT_DURABLE'
    );
  };

  const accepted = await createCheckout('accepted', products['10']);
  const acceptedPaid = await pay(accepted);
  const resumed = await callable(
    'resumeCheckoutV2',
    { orderId: accepted.orderId },
    fixtureTokens
  );
  invariant(
    resumed.orderId === accepted.orderId &&
      resumed.paymentIntentId === accepted.paymentIntentId,
    'GATE7B_RESUME_IDENTITY_CHANGED'
  );
  const clientOrders = await callable('listMyOrdersV2', { limit: 50 }, fixtureTokens);
  invariant(
    JSON.stringify(clientOrders).includes(accepted.orderId),
    'GATE7B_CLIENT_ORDER_MISSING'
  );
  record('accepted_resume_client_access', {
    orderId: accepted.orderId,
    paymentIntentId: accepted.paymentIntentId,
    accountId: accepted.connectedAccountId,
    durableStatus: acceptedPaid.payment.status,
    sameResumeIdentity: true
  });

  const retryCheckout = await createCheckout('decline_retry', products['10']);
  let declineObserved = false;
  try {
    await confirm(retryCheckout, 'pm_card_chargeDeclined');
  } catch (error) {
    declineObserved = error?.raw?.code === 'card_declined' ||
      error?.code === 'card_declined';
  }
  invariant(declineObserved, 'GATE7B_DECLINE_NOT_OBSERVED');
  const beforeRetry = await orderData(retryCheckout.orderId);
  invariant(
    beforeRetry.payment.status !== 'succeeded' &&
      beforeRetry.checkout.status === 'active',
    'GATE7B_DECLINE_RELEASED_OR_SUCCEEDED'
  );
  const retryPaid = await pay(retryCheckout);
  invariant(
    retryPaid.payment.paymentIntentId === retryCheckout.paymentIntentId,
    'GATE7B_RETRY_PAYMENT_INTENT_CHANGED'
  );
  record('decline_then_same_intent_success', {
    orderId: retryCheckout.orderId,
    paymentIntentId: retryCheckout.paymentIntentId,
    declineObserved,
    durableStatus: retryPaid.payment.status
  });

  const dismissCheckout = await createCheckout('dismiss_resume', products['10']);
  const dismissResume = await callable(
    'resumeCheckoutV2',
    { orderId: dismissCheckout.orderId },
    fixtureTokens
  );
  invariant(
    dismissResume.paymentIntentId === dismissCheckout.paymentIntentId,
    'GATE7B_DISMISS_RESUME_MUTATED_IDENTITY'
  );
  const canceled = await cancel(dismissCheckout, 'dismiss');
  invariant(canceled.outcome === 'canceled', 'GATE7B_CANCEL_NOT_CONFIRMED');
  record('dismiss_back_and_explicit_cancel', {
    orderId: dismissCheckout.orderId,
    paymentIntentId: dismissCheckout.paymentIntentId,
    sameResumeIdentity: true,
    cancelOutcome: canceled.outcome
  });

  const concurrencyResults = await Promise.allSettled([
    createCheckout('stock1_a', products['1']),
    createCheckout('stock1_b', products['1'])
  ]);
  const winners = concurrencyResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
  invariant(winners.length === 1, 'GATE7B_STOCK1_CONCURRENCY_NOT_SERIALIZED');
  await cancel(winners[0], 'stock1_winner');
  record('stock_one_concurrency', {
    winnerOrderId: winners[0].orderId,
    successes: winners.length,
    failures: concurrencyResults.length - winners.length
  });

  const threeDs = await createCheckout('three_ds', products['10']);
  const browser = await chromium.launch({ headless: true });
  let threeDsResult;
  try {
    const page = await browser.newPage();
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    if (typeof await page.evaluate(() => window.Stripe) !== 'function') {
      await page.addScriptTag({ url: 'https://js.stripe.com/v3/' });
    }
    await page.waitForFunction(() => typeof window.Stripe === 'function');
    const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ||
      process.env.VITE_STRIPE_PUBLIC_KEY;
    invariant(stripePublicKey, 'GATE7B_STRIPE_PUBLIC_KEY_MISSING');
    const threeDsPrepared = await page.evaluate(async ({
      key,
      accountId: stripeAccount,
      clientSecret
    }) => {
      const stripeClient = window.Stripe(key, { stripeAccount });
      window.__gate7bStripeClient = stripeClient;
      const prepared = await stripeClient.confirmCardPayment(
        clientSecret,
        { payment_method: 'pm_card_threeDSecure2Required' },
        { handleActions: false }
      );
      return {
        errorCode: prepared.error?.code || null,
        paymentIntentStatus: prepared.paymentIntent?.status || null
      };
    }, {
      key: stripePublicKey,
      accountId: threeDs.connectedAccountId,
      clientSecret: threeDs.clientSecret
    });
    invariant(
      threeDsPrepared.errorCode === null &&
        threeDsPrepared.paymentIntentStatus === 'requires_action',
      `GATE7B_3DS_NOT_PREPARED:${threeDsPrepared.errorCode || threeDsPrepared.paymentIntentStatus}`
    );
    await page.evaluate((clientSecret) => {
      window.__gate7bActionState = { settled: false };
      window.__gate7bPromise = window.__gate7bStripeClient
        .confirmCardPayment(clientSecret)
        .then((result) => {
          window.__gate7bActionState = {
            settled: true,
            errorCode: result.error?.code || null,
            errorType: result.error?.type || null,
            paymentIntentStatus: result.paymentIntent?.status || null
          };
          return result;
        });
    }, threeDs.clientSecret);
    let challengeState;
    try {
      challengeState = await waitFor(async () => {
        const action = await page.evaluate(() => window.__gate7bActionState);
        if (action?.settled) return { action };
        for (const frame of page.frames()) {
          const challenge = frame.getByRole('button', {
            name: /complete|authorize|confirmer|autoriser/i
          });
          if (await challenge.isVisible().catch(() => false)) {
            await challenge.click();
            return { clicked: true };
          }
        }
        return null;
      }, Boolean, 'GATE7B_3DS_CHALLENGE_NOT_FOUND', 45_000);
    } catch (error) {
      if (error?.message !== 'GATE7B_3DS_CHALLENGE_NOT_FOUND') throw error;
      const frames = [];
      for (const frame of page.frames()) {
        frames.push({
          url: frame.url().slice(0, 180),
          buttons: await frame.locator('button, input[type="submit"]')
            .evaluateAll((elements) => elements.slice(0, 8).map((element) => ({
              text: String(element.textContent || element.value || '').trim().slice(0, 80),
              ariaLabel: String(element.getAttribute('aria-label') || '').slice(0, 80),
              visible: Boolean(element.offsetWidth || element.offsetHeight)
            }))).catch(() => [])
        });
      }
      throw new Error(
        `GATE7B_3DS_CHALLENGE_NOT_FOUND:${JSON.stringify(frames)}`
      );
    }
    invariant(
      challengeState.clicked === true,
      `GATE7B_3DS_ACTION_SETTLED:${challengeState.action?.errorCode || challengeState.action?.paymentIntentStatus}`
    );
    threeDsResult = await page.evaluate(() => window.__gate7bPromise);
  } finally {
    await browser.close();
  }
  invariant(
    threeDsResult?.paymentIntent?.status === 'succeeded',
    'GATE7B_3DS_NOT_SUCCEEDED'
  );
  await dispatchPaymentIntent(
    threeDs.paymentIntentId,
    threeDs.connectedAccountId
  );
  const threeDsPaid = await waitFor(
    () => orderData(threeDs.orderId),
    (order) => order?.payment?.status === 'succeeded',
    'GATE7B_3DS_NOT_DURABLE'
  );
  record('three_ds_success_and_resume', {
    orderId: threeDs.orderId,
    paymentIntentId: threeDs.paymentIntentId,
    durableStatus: threeDsPaid.payment.status
  });

  const threeDsAbandon = await createCheckout('three_ds_abandon', products['10']);
  const abandonBrowser = await chromium.launch({ headless: true });
  try {
    const page = await abandonBrowser.newPage();
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    if (typeof await page.evaluate(() => window.Stripe) !== 'function') {
      await page.addScriptTag({ url: 'https://js.stripe.com/v3/' });
    }
    await page.waitForFunction(() => typeof window.Stripe === 'function');
    const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ||
      process.env.VITE_STRIPE_PUBLIC_KEY;
    invariant(stripePublicKey, 'GATE7B_STRIPE_PUBLIC_KEY_MISSING');
    const abandonedPrepared = await page.evaluate(async ({
      key,
      accountId: stripeAccount,
      clientSecret
    }) => {
      const stripeClient = window.Stripe(key, { stripeAccount });
      const prepared = await stripeClient.confirmCardPayment(
        clientSecret,
        { payment_method: 'pm_card_threeDSecure2Required' },
        { handleActions: false }
      );
      return {
        errorCode: prepared.error?.code || null,
        paymentIntentStatus: prepared.paymentIntent?.status || null
      };
    }, {
      key: stripePublicKey,
      accountId: threeDsAbandon.connectedAccountId,
      clientSecret: threeDsAbandon.clientSecret
    });
    invariant(
      abandonedPrepared.errorCode === null &&
        abandonedPrepared.paymentIntentStatus === 'requires_action',
      `GATE7B_3DS_ABANDON_NOT_PREPARED:${abandonedPrepared.errorCode || abandonedPrepared.paymentIntentStatus}`
    );
  } finally {
    await abandonBrowser.close();
  }
  const abandonedIntent = await stripe.paymentIntents.retrieve(
    threeDsAbandon.paymentIntentId,
    {},
    { stripeAccount: threeDsAbandon.connectedAccountId }
  );
  const abandonedOrder = await orderData(threeDsAbandon.orderId);
  const abandonedResume = await callable(
    'resumeCheckoutV2',
    { orderId: threeDsAbandon.orderId },
    fixtureTokens
  );
  invariant(
    abandonedIntent.status === 'requires_action' &&
      abandonedOrder.payment.status !== 'succeeded' &&
      abandonedResume.paymentIntentId === threeDsAbandon.paymentIntentId,
    'GATE7B_3DS_ABANDON_FALSE_SUCCESS'
  );
  const abandonedCancellation = await cancel(threeDsAbandon, 'three_ds_abandon');
  invariant(
    abandonedCancellation.outcome === 'canceled',
    'GATE7B_3DS_ABANDON_CANCEL_FAILED'
  );
  record('three_ds_abandon_without_false_success', {
    orderId: threeDsAbandon.orderId,
    paymentIntentId: threeDsAbandon.paymentIntentId,
    paymentIntentStatusBeforeCancel: abandonedIntent.status,
    durablePaymentStatusBeforeCancel: abandonedOrder.payment.status,
    sameResumeIdentity: true,
    cancelOutcome: abandonedCancellation.outcome
  });

  const refundCheckout = await createCheckout('refund', products['2']);
  const refundableOrder = await pay(refundCheckout);
  const refundAmount = refundableOrder.amounts.capturedCents;
  const refund = await refundRuntime.refunds.requestRefund({
    orderId: refundCheckout.orderId,
    refundRequestId: id('refund', runId),
    amountCents: refundAmount,
    actor: adminActor,
    reason: 'Gate 7B refund before fulfillment'
  });
  invariant(refund.outcome === 'succeeded', 'GATE7B_REFUND_NOT_SUCCEEDED');
  const refundedOrder = await orderData(refundCheckout.orderId);
  invariant(
    refundedOrder.refundAggregate.succeededCents === refundAmount,
    'GATE7B_REFUND_FACT_NOT_APPLIED'
  );

  let fulfillmentOrder = await orderData(accepted.orderId);
  const executeOrder = async (action, label, payload = {}) => {
    const result = await orderCommands.execute({
      orderId: accepted.orderId,
      action,
      command: {
        commandId: id(`fulfillment_${label}`, runId),
        expectedVersion: fulfillmentOrder.stateVersion
      },
      actor: adminActor,
      reason: `Gate 7B ${label}`,
      payload
    });
    fulfillmentOrder = await orderData(accepted.orderId);
    return result;
  };
  await executeOrder('fulfillment_ship', 'ship', {
    trackingNumber: id('tracking', runId)
  });
  await executeOrder('fulfillment_deliver', 'deliver');
  const line = fulfillmentOrder.items[0];
  const opened = await returnRuntime.returns.create({
    orderId: accepted.orderId,
    returnRequestId: id('return', runId),
    requestedLines: [{ lineId: line.lineId, quantity: 1 }],
    actor: adminActor,
    reason: 'Gate 7B physical return'
  });
  let returnCase = opened.returnCase;
  const applyReturn = async (event, label) => {
    const result = await returnRuntime.returns.apply({
      orderId: accepted.orderId,
      returnId: returnCase.returnId,
      commandId: id(`return_${label}`, runId),
      expectedVersion: returnCase.stateVersion,
      event,
      actor: adminActor,
      reason: `Gate 7B ${label}`
    });
    returnCase = (await db.doc(
      `orders/${accepted.orderId}/returns/${returnCase.returnId}`
    ).get()).data();
    return result;
  };
  await applyReturn({
    type: 'receive',
    lines: [{ lineId: line.lineId, quantity: 1 }]
  }, 'receive');
  await applyReturn({
    type: 'restock',
    lines: [{ lineId: line.lineId, quantity: 1 }]
  }, 'restock');
  await applyReturn({ type: 'resolve' }, 'resolve');
  invariant(returnCase.status === 'resolved', 'GATE7B_RETURN_NOT_RESOLVED');
  record('refund_fact_and_physical_restock', {
    refundOrderId: refundCheckout.orderId,
    refundId: refund.refundId,
    refundedCents: refundAmount,
    returnOrderId: accepted.orderId,
    returnId: returnCase.returnId,
    returnStatus: returnCase.status
  });

  const otpStartedAt = Date.now();
  await callable('sendGuestCheckoutOtp', { email: fixtureAlias }, fixtureTokens);
  const otp = await waitFor(
    () => readLatestOtp({
      user: process.env.GMAIL_EMAIL,
      pass: String(process.env.GMAIL_PASSWORD).replace(/\s/g, ''),
      email: fixtureAlias,
      notBefore: otpStartedAt
    }).catch(() => null),
    Boolean,
    'GATE7B_OTP_DELIVERY_TIMEOUT',
    90_000
  );
  const verifiedOtp = await callable(
    'verifyGuestCheckoutOtp',
    { email: fixtureAlias, code: otp },
    fixtureTokens
  );
  invariant(
    verifiedOtp.success === true && verifiedOtp.checkoutOtpToken,
    'GATE7B_OTP_VERIFICATION_FAILED'
  );
  const guestCheckout = await createCheckout('guest_otp', products['10']);
  const guestResume = await callable(
    'resumeCheckoutV2',
    { orderId: guestCheckout.orderId },
    fixtureTokens
  );
  await cancel(guestCheckout, 'guest_otp');
  record('guest_otp_resume', {
    orderId: guestCheckout.orderId,
    paymentIntentId: guestCheckout.paymentIntentId,
    otpVerified: true,
    sameResumeIdentity: guestResume.paymentIntentId === guestCheckout.paymentIntentId
  });

  const adminOrders = await callable(
    'listOrdersAdminV2',
    { limit: 100 },
    adminTokens
  );
  invariant(
    JSON.stringify(adminOrders).includes(accepted.orderId),
    'GATE7B_ADMIN_ORDER_MISSING'
  );
  record('admin_client_coherence', {
    clientOrderVisible: true,
    adminOrderVisible: true
  });

  await callable('rebuildCommerceOperationsAdmin', {}, adminTokens);
  const finalStatus = await callable(
    'getCommerceOperationsStatusAdmin',
    {},
    adminTokens
  );
  const runReservations = await db.collection('inventory_reservations')
    .where('testContext.runId', '==', runId).get();
  const nonTerminalReservations = runReservations.docs.filter((document) =>
    document.data().status === 'held'
  );
  const runInbox = await db.collection('commerce_webhook_inbox')
    .where('testContext.runId', '==', runId).get();
  const incompleteInbox = runInbox.docs.filter((document) =>
    document.data().status !== 'processed'
  );
  invariant(
    nonTerminalReservations.length === 0 &&
      incompleteInbox.length === 0 &&
      finalStatus.operations?.status === 'healthy',
    'GATE7B_FINAL_DRAIN_NOT_CLEAN'
  );
  record('final_drain', {
    nonTerminalReservations: 0,
    incompleteInbox: 0,
    operationsStatus: finalStatus.operations.status
  });

  report.status = 'passed';
  report.completedAt = new Date().toISOString();
  report.release = {
    sourceRevision: release.sourceRevision,
    appHosting: release.appHosting,
    functions: release.functions,
    rulesHash: release.firestore?.rulesHash,
    indexesHash: release.firestore?.indexesHash
  };
  report.snapshots = {
    before: {
      operationsEvaluatedAt: timestamp(operations.evaluatedAt),
      projectionHash: operations.projection?.projectionHash || null
    },
    after: {
      operationsEvaluatedAt: timestamp(finalStatus.operations?.evaluatedAt),
      projectionHash: finalStatus.operations?.projection?.projectionHash || null
    }
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    runId,
    runOrdinal,
    releaseId,
    scenarios: report.scenarios.length,
    reportPath: path.relative(process.cwd(), reportPath)
  }));
}

main().catch(async (error) => {
  const cleanup = await failureCleanup().catch((cleanupError) => ({
    error: String(cleanupError?.message || cleanupError)
  }));
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.message || error),
    cleanup
  }));
  process.exitCode = 1;
});
