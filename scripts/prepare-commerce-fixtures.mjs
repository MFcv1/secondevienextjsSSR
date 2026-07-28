import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import fixtureScopeDomain from '../functions/src/commerce/domain/fixtureScope.js';
import inventoryKeyDomain from '../functions/src/commerce/domain/inventoryKey.js';

const { validateFixtureScope } = fixtureScopeDomain;
const { createInventoryKey } = inventoryKeyDomain;
const PROJECT_ID = 'secondevienextjsssr';
const SCOPE_VERSION = 'fixture_gate6_20260728';
const POLICY_VERSION = 'fixture_policy_20260728';
const FIXTURE_UID = 'fixture_gate6_20260728_uid';
const DEFAULT_REPORT = 'logs/commerce/gate6/fixture-preparation.json';

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) throw new Error(`Argument inconnu: ${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  const absolute = path.resolve(filePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function resolveCredential() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return applicationDefault();
  const firebaseConfigPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!existsSync(firebaseConfigPath)) return applicationDefault();
  const config = await readJson(firebaseConfigPath);
  const email = config?.user?.email;
  if (typeof email !== 'string' || !email) return applicationDefault();
  const credentialPath = path.join(
    os.homedir(),
    '.config',
    'firebase',
    `${email.replace('@', '_').replace('.', '_')}_application_default_credentials.json`
  );
  if (existsSync(credentialPath)) process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;
  return applicationDefault();
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function stripeAccountProof(accountId, db, connectState) {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('GATE6_STRIPE_SECRET_MISSING');
  if (
    !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ||
    connectState?.livemode === true ||
    connectState?.chargesEnabled !== true ||
    connectState?.detailsSubmitted !== true
  ) {
    throw new Error('GATE6_STRIPE_ACCOUNT_NOT_SANDBOX_READY');
  }
  const orders = await db.collection('orders')
    .where('stripeConnectedAccountId', '==', accountId)
    .limit(10)
    .get();
  const paymentIntentId = orders.docs
    .map((document) => document.data()?.stripePaymentIntentId)
    .find((value) => typeof value === 'string');
  if (!paymentIntentId) throw new Error('GATE6_STRIPE_ACCOUNT_PROOF_MISSING');
  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`,
    {
      headers: {
        authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'stripe-account': accountId
      }
    }
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GATE6_STRIPE_ACCOUNT_PROOF_${response.status}`);
  if (body.id !== paymentIntentId || body.livemode === true) {
    throw new Error('GATE6_STRIPE_ACCOUNT_NOT_SANDBOX_READY');
  }
  return { livemode: false, paymentIntentProved: true };
}

function fixtureProducts() {
  return [1, 2, 10].map((stock, index) => {
    const productId = `fixture_gate6_stock${stock}_0${index + 1}`;
    const identity = { collectionName: 'furniture', productId, variantId: null };
    return {
      identity,
      inventoryKey: createInventoryKey(identity),
      data: {
        id: productId,
        schemaVersion: 2,
        name: `Fixture Gate 6 stock ${stock}`,
        description: 'Produit technique isole reserve aux preuves commerce sandbox.',
        status: 'published',
        e2eOnly: true,
        e2ePurpose: SCOPE_VERSION,
        fixtureScopeVersion: SCOPE_VERSION,
        currentPrice: 10 + index,
        stock,
        inventoryVersion: 1,
        commerceVersion: 1,
        priceOnRequest: false,
        seoIndexable: false
      }
    };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.get('project');
  const environment = args.get('env') || 'sandbox';
  const commit = args.get('commit') === 'true';
  const backupPath = args.get('backup');
  const reportPath = args.get('report') || DEFAULT_REPORT;
  if (projectId !== PROJECT_ID || environment !== 'sandbox') {
    throw new Error('GATE6_TARGET_MUST_BE_EXACT_SANDBOX');
  }
  if (!backupPath || !existsSync(path.resolve(backupPath))) {
    throw new Error('GATE6_BACKUP_MANIFEST_REQUIRED');
  }
  const classification = await readJson(path.resolve(backupPath));
  if (
    classification.projectId !== PROJECT_ID ||
    classification.environment !== 'sandbox' ||
    classification.mode !== 'dry-run' ||
    classification.counters?.nonTerminalUnclassified !== 0 ||
    classification.control?.newCheckoutMode !== 'off'
  ) {
    throw new Error('GATE6_CLASSIFICATION_MANIFEST_INVALID');
  }
  if (commit && args.get('confirm') !== `PREPARE_GATE6_FIXTURES_${PROJECT_ID}`) {
    throw new Error(`Commit exige --confirm=PREPARE_GATE6_FIXTURES_${PROJECT_ID}`);
  }

  const app = getApps().find((entry) => entry.name === 'gate6-fixtures') || initializeApp({
    credential: await resolveCredential(),
    projectId
  }, 'gate6-fixtures');
  const db = getFirestore(app);
  const auth = getAuth(app);
  const connectSnapshot = await db.doc('sys_metadata/stripe_connect').get();
  const accountId = connectSnapshot.exists ? connectSnapshot.data()?.activeAccountId : null;
  if (typeof accountId !== 'string' || !/^acct_[A-Za-z0-9]{8,}$/.test(accountId)) {
    throw new Error('GATE6_ACTIVE_CONNECT_ACCOUNT_MISSING');
  }
  const stripe = await stripeAccountProof(accountId, db, connectSnapshot.data());
  const products = fixtureProducts();
  const expiresAt = new Date('2026-09-30T22:00:00.000Z');
  const scope = validateFixtureScope({
    schemaVersion: 2,
    fixtureScopeVersion: SCOPE_VERSION,
    environment: 'sandbox',
    projectId: PROJECT_ID,
    policyVersion: POLICY_VERSION,
    active: true,
    uids: [FIXTURE_UID],
    inventoryKeys: products.map((product) => product.inventoryKey),
    fixtureProducts: products.map((product) => product.identity),
    expiresAt: expiresAt.toISOString()
  });
  const now = Timestamp.now();
  const documents = [
    ...products.map((product) => ({
      path: `furniture/${product.identity.productId}`,
      data: { ...product.data, createdAt: now, updatedAt: now }
    })),
    {
      path: `commerce_connect_accounts/${accountId}`,
      data: {
        schemaVersion: 2,
        accountId,
        active: true,
        activeRevision: 1,
        chargesEnabled: true,
        detailsSubmitted: true,
        livemode: false,
        fixtureScopeVersion: SCOPE_VERSION,
        verifiedAt: now
      }
    },
    {
      path: `commerce_policy_versions/${POLICY_VERSION}`,
      data: {
        schemaVersion: 2,
        version: POLICY_VERSION,
        active: true,
        currency: 'EUR',
        offlinePaymentEnabled: false,
        stripeConnectedAccountId: accountId,
        holdDurationSeconds: 1800,
        deliveryModes: [{
          id: 'fixture_delivery_fr',
          active: true,
          shippingCents: 0,
          countries: ['FR']
        }],
        fixtureScopeVersion: SCOPE_VERSION,
        createdAt: now
      }
    },
    {
      path: `commerce_fixture_scopes/${SCOPE_VERSION}`,
      data: {
        ...scope,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: now,
        immutable: true
      }
    },
    {
      path: 'sys_commerce_control/current',
      data: {
        newCheckoutMode: 'off',
        legacyMode: 'reconcile_only',
        adminMutationMode: 'read_only',
        offlinePaymentMode: 'off',
        activePolicyVersion: POLICY_VERSION,
        fixtureScopeVersion: SCOPE_VERSION,
        fixtureScopeRef: `commerce_fixture_scopes/${SCOPE_VERSION}`,
        controlRevision: 1,
        updatedAt: now,
        updatedBy: 'gate6-fixture-preparation'
      }
    }
  ];

  let authUserExists = true;
  try {
    await auth.getUser(FIXTURE_UID);
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') throw error;
    authUserExists = false;
  }
  const existing = [];
  for (const document of documents) {
    const snapshot = await db.doc(document.path).get();
    existing.push({
      path: document.path,
      exists: snapshot.exists,
      existingHash: snapshot.exists ? digest(snapshot.data()) : null
    });
  }
  const backup = {
    schemaVersion: 1,
    projectId,
    environment,
    classificationDigest: classification.classificationDigest,
    controlMode: classification.control.newCheckoutMode,
    authUser: { uid: FIXTURE_UID, exists: authUserExists },
    targets: existing
  };
  await writeJson(reportPath, {
    mode: commit ? 'commit' : 'dry-run',
    status: commit ? 'pending' : 'ready',
    backup,
    fixture: {
      fixtureScopeVersion: scope.fixtureScopeVersion,
      policyVersion: scope.policyVersion,
      scopeHash: scope.scopeHash,
      uidCount: scope.uids.length,
      inventoryKeyCount: scope.inventoryKeys.length,
      stocks: products.map((product) => product.data.stock),
      expiresAt: scope.expiresAt,
      stripeLivemode: stripe.livemode === true
    }
  });
  if (!commit) {
    console.log(JSON.stringify({
      status: 'READY',
      mode: 'dry-run',
      projectId,
      newCheckoutMode: 'off',
      existingTargets: existing.filter((target) => target.exists).length,
      authUserExists,
      fixtureScopeVersion: scope.fixtureScopeVersion,
      scopeHash: scope.scopeHash,
      stocks: products.map((product) => product.data.stock),
      stripeLivemode: stripe.livemode === true,
      report: path.relative(process.cwd(), path.resolve(reportPath))
    }, null, 2));
    return;
  }
  if (authUserExists || existing.some((target) => target.exists)) {
    throw new Error('GATE6_FIXTURE_TARGET_ALREADY_EXISTS');
  }

  let createdUser = false;
  try {
    await auth.createUser({
      uid: FIXTURE_UID,
      disabled: false,
      displayName: 'Gate 6 Commerce Fixture'
    });
    createdUser = true;
    await db.runTransaction(async (transaction) => {
      const refs = documents.map((document) => db.doc(document.path));
      const snapshots = await Promise.all(refs.map((reference) => transaction.get(reference)));
      if (snapshots.some((snapshot) => snapshot.exists)) {
        throw new Error('GATE6_FIXTURE_TARGET_CHANGED');
      }
      documents.forEach((document, index) => transaction.create(refs[index], document.data));
    });
  } catch (error) {
    if (createdUser) await auth.deleteUser(FIXTURE_UID).catch(() => {});
    throw error;
  }
  const finalReport = await readJson(path.resolve(reportPath));
  await writeJson(reportPath, {
    ...finalReport,
    status: 'created',
    writes: {
      authUsersCreated: 1,
      firestoreDocumentsCreated: documents.length,
      ordersTouched: 0,
      stockCorrections: 0,
      checkoutActivated: false
    }
  });
  console.log(JSON.stringify({
    status: 'CREATED',
    projectId,
    fixtureScopeVersion: scope.fixtureScopeVersion,
    authUsersCreated: 1,
    firestoreDocumentsCreated: documents.length,
    ordersTouched: 0,
    stockCorrections: 0,
    newCheckoutMode: 'off',
    report: path.relative(process.cwd(), path.resolve(reportPath))
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'ERROR',
    code: error?.code || error?.message || 'GATE6_FIXTURE_PREPARATION_FAILED'
  }));
  process.exitCode = 1;
});
