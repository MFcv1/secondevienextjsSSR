import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';
import legacyClassification from '../functions/src/commerce/domain/legacyClassification.js';
import fixtureScopeDomain from '../functions/src/commerce/domain/fixtureScope.js';

const {
  FINANCIAL_STATUSES,
  buildClassificationLine,
  normalizeStatus,
  summarizeClassification
} = legacyClassification;
const { validateFixtureScope } = fixtureScopeDomain;

const SANDBOX_PROJECT = 'secondevienextjsssr';
const TOOL_VERSION = 'gate6-legacy-classifier-v1';
const DEFAULT_OUTPUT = 'logs/commerce/gate6/classification-manifest.json';
const DEFAULT_CHECKPOINT = 'logs/commerce/gate6/classification-checkpoint.json';

function parseArgs(argv) {
  const result = new Map();
  for (const argument of argv) {
    if (!argument.startsWith('--')) throw new Error(`Argument inconnu: ${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    result.set(key, parts.length ? parts.join('=') : 'true');
  }
  return result;
}

function positiveInteger(value, fallback, maximum) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`Entier invalide: ${value}`);
  }
  return parsed;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function currentCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
}

function assertTarget({ projectId, environment }) {
  if (environment !== 'sandbox' || projectId !== SANDBOX_PROJECT) {
    throw new Error('GATE6_TARGET_MUST_BE_EXACT_SANDBOX');
  }
}

function assertWriteAuthorization(args, { projectId, environment }) {
  assertTarget({ projectId, environment });
  if (args.get('confirm') !== `CLASSIFY_LEGACY_${projectId}`) {
    throw new Error(`Le mode ecriture exige --confirm=CLASSIFY_LEGACY_${projectId}`);
  }
  const backup = args.get('backup');
  if (!backup || !existsSync(path.resolve(backup))) {
    throw new Error('Le mode ecriture exige --backup=<export-ou-sauvegarde-existante>');
  }
  throw new Error('GATE6_ADOPTION_EXECUTION_DEFERRED');
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
  const firebaseConfigPath = path.join(
    os.homedir(),
    '.config',
    'configstore',
    'firebase-tools.json'
  );
  if (!existsSync(firebaseConfigPath)) return applicationDefault();
  const firebaseConfig = await readJson(firebaseConfigPath);
  if (!firebaseConfig?.tokens?.refresh_token) return applicationDefault();
  const email = firebaseConfig?.user?.email;
  if (typeof email !== 'string' || !email) return applicationDefault();
  const credentialPath = path.join(
    os.homedir(),
    '.config',
    'firebase',
    `${email.replace('@', '_').replace('.', '_')}_application_default_credentials.json`
  );
  if (!existsSync(credentialPath)) return applicationDefault();
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;
  return applicationDefault();
}

async function stripeGet(pathname, connectedAccountId) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: 'stripe_secret_missing' };
  }
  const headers = {
    authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`
  };
  if (connectedAccountId) headers['stripe-account'] = connectedAccountId;
  const response = await fetch(`https://api.stripe.com${pathname}`, { headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      error: `stripe_http_${response.status}`,
      type: typeof body?.error?.type === 'string' ? body.error.type : null
    };
  }
  return { value: body };
}

async function readStripeEvidence(order) {
  const paymentIntentId = order?.stripePaymentIntentId || null;
  const connectedAccountId = order?.stripeConnectedAccountId || null;
  if (!paymentIntentId) return { error: 'payment_intent_missing', connectedAccountId };
  const paymentIntentResult = await stripeGet(
    `/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`,
    connectedAccountId
  );
  if (paymentIntentResult.error) {
    return { ...paymentIntentResult, connectedAccountId };
  }
  const refundResult = await stripeGet(
    `/v1/refunds?payment_intent=${encodeURIComponent(paymentIntentId)}&limit=100`,
    connectedAccountId
  );
  return {
    paymentIntent: paymentIntentResult.value,
    connectedAccountId,
    refunds: refundResult.value?.data || [],
    ...(refundResult.error ? { refundReadError: refundResult.error } : {})
  };
}

function publicStripeProof(evidence) {
  if (!evidence || evidence.error) {
    return { read: false, error: evidence?.error || 'not_requested' };
  }
  return {
    read: true,
    paymentIntentStatus: evidence.paymentIntent?.status || null,
    paymentIntentLivemode: evidence.paymentIntent?.livemode === true,
    refundStatuses: (evidence.refunds || []).map((refund) => refund.status || 'unknown').sort(),
    connectedAccount: evidence.connectedAccountId ? 'pinned' : 'platform'
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.get('project');
  const environment = args.get('env') || 'sandbox';
  const dryRun = args.get('commit') !== 'true';
  const pageSize = positiveInteger(args.get('page-size'), 50, 250);
  const outputPath = args.get('manifest') || DEFAULT_OUTPUT;
  const checkpointPath = args.get('checkpoint') || DEFAULT_CHECKPOINT;
  const resume = args.get('resume') === 'true';
  const stripeRead = args.get('stripe-read') !== 'false';
  assertTarget({ projectId, environment });
  if (!dryRun) assertWriteAuthorization(args, { projectId, environment });

  const app = getApps().find((entry) => entry.name === 'gate6-classifier') || initializeApp({
    credential: await resolveCredential(),
    projectId
  }, 'gate6-classifier');
  const db = getFirestore(app);
  const checkpoint = resume && existsSync(path.resolve(checkpointPath))
    ? await readJson(path.resolve(checkpointPath))
    : null;
  if (checkpoint && (
    checkpoint.projectId !== projectId ||
    checkpoint.toolVersion !== TOOL_VERSION ||
    checkpoint.complete === true
  )) {
    throw new Error('GATE6_CHECKPOINT_INCOMPATIBLE');
  }

  const controlSnapshot = await db.doc('sys_commerce_control/current').get();
  const control = controlSnapshot.exists ? controlSnapshot.data() : null;
  if (control?.newCheckoutMode && control.newCheckoutMode !== 'off') {
    throw new Error('GATE6_REQUIRES_NEW_CHECKOUT_MODE_OFF');
  }

  let query = db.collection('orders').orderBy(FieldPath.documentId()).limit(pageSize);
  if (checkpoint?.lastOrderId) query = query.startAfter(checkpoint.lastOrderId);
  const lines = [];
  let v2Existing = 0;
  let pages = 0;
  let lastOrderId = checkpoint?.lastOrderId || null;

  while (true) {
    const snapshot = await query.get();
    if (snapshot.empty) break;
    pages += 1;
    for (const document of snapshot.docs) {
      lastOrderId = document.id;
      const order = document.data();
      if (order.schemaVersion === 2) {
        v2Existing += 1;
        continue;
      }
      const status = normalizeStatus(order.status);
      const evidence = stripeRead && FINANCIAL_STATUSES.has(status)
        ? await readStripeEvidence(order)
        : null;
      const line = buildClassificationLine({
        orderId: document.id,
        order,
        updateTime: document.updateTime,
        stripeEvidence: evidence
      });
      lines.push({
        ...line,
        stripeProof: publicStripeProof(evidence)
      });
    }
    await writeJson(checkpointPath, {
      schemaVersion: 1,
      toolVersion: TOOL_VERSION,
      projectId,
      environment,
      lastOrderId,
      pages,
      complete: false
    });
    if (snapshot.size < pageSize) break;
    query = db.collection('orders')
      .orderBy(FieldPath.documentId())
      .startAfter(lastOrderId)
      .limit(pageSize);
  }

  const counters = summarizeClassification(lines);
  const fixtureScopePath = args.get('fixture-scope');
  const fixtureScope = fixtureScopePath
    ? validateFixtureScope(await readJson(path.resolve(fixtureScopePath)))
    : null;
  const fixtureScopesSnapshot = await db.collection('commerce_fixture_scopes').get();
  const remoteScopes = fixtureScopesSnapshot.docs.map((document) => {
    const data = document.data();
    const normalized = validateFixtureScope({
      ...data,
      expiresAt: data.expiresAt?.toDate
        ? data.expiresAt.toDate().toISOString()
        : data.expiresAt
    });
    if (document.id !== normalized.fixtureScopeVersion) {
      throw new Error('GATE6_FIXTURE_SCOPE_ID_MISMATCH');
    }
    return {
      fixtureScopeVersion: normalized.fixtureScopeVersion,
      policyVersion: normalized.policyVersion,
      scopeHash: normalized.scopeHash,
      uidCount: normalized.uids.length,
      inventoryKeyCount: normalized.inventoryKeys.length,
      expiresAt: normalized.expiresAt
    };
  }).sort((left, right) => left.fixtureScopeVersion.localeCompare(right.fixtureScopeVersion));
  const sortedLines = [...lines].sort((left, right) => left.orderId.localeCompare(right.orderId));
  const classificationDigest = sha256(JSON.stringify(sortedLines));
  const manifest = {
    schemaVersion: 1,
    toolVersion: TOOL_VERSION,
    mode: 'dry-run',
    projectId,
    environment,
    sourceCollection: 'orders',
    releaseCommit: currentCommit(),
    control: {
      exists: controlSnapshot.exists,
      newCheckoutMode: control?.newCheckoutMode || 'off',
      legacyMode: control?.legacyMode || 'reconcile_only',
      adminMutationMode: control?.adminMutationMode || 'read_only',
      controlRevision: Number.isSafeInteger(control?.controlRevision)
        ? control.controlRevision
        : null
    },
    checkpoint: {
      resumed: Boolean(checkpoint),
      lastOrderId,
      pages,
      complete: true
    },
    counters: {
      ...counters,
      v2Existing
    },
    fixtureRegistry: {
      remoteScopeCount: fixtureScopesSnapshot.size,
      remoteScopes,
      preparedScope: fixtureScope
    },
    classificationDigest,
    lines: sortedLines
  };
  await writeJson(outputPath, manifest);
  await writeJson(checkpointPath, {
    schemaVersion: 1,
    toolVersion: TOOL_VERSION,
    projectId,
    environment,
    lastOrderId,
    pages,
    complete: true,
    classificationDigest
  });
  console.log(JSON.stringify({
    status: 'OK',
    mode: manifest.mode,
    projectId,
    environment,
    control: manifest.control,
    counters: manifest.counters,
    fixtureRegistry: {
      remoteScopeCount: manifest.fixtureRegistry.remoteScopeCount,
      preparedScopeVersion: fixtureScope?.fixtureScopeVersion || null
    },
    classificationDigest,
    manifest: path.relative(process.cwd(), path.resolve(outputPath)),
    checkpoint: path.relative(process.cwd(), path.resolve(checkpointPath))
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'ERROR',
    code: error?.code || error?.message || 'GATE6_CLASSIFIER_FAILED'
  }));
  process.exitCode = 1;
});
