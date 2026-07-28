import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID = 'secondevienextjsssr';
const BACKEND_ID = 'secondevie-next-sandbox';
const APP_REGION = 'europe-west4';
const FUNCTIONS_REGION = 'europe-west1';
const FIXTURE_SCOPE_VERSION = 'fixture_gate6_20260728';
const REQUIRED_FUNCTIONS = [
  'cleanupFixtureRunAdmin',
  'commerceOperationsReconciler',
  'commerceOutboxDispatcher',
  'createCheckoutV2',
  'getCommerceOperationsStatusAdmin',
  'rebuildCommerceOperationsAdmin',
  'stripeConnectWebhookV2',
  'stripeWebhookV2'
];

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) throw new Error(`Argument inconnu: ${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
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

function gitValue(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).trim();
}

async function fileHash(filePath) {
  return sha256(await readFile(path.resolve(filePath)));
}

async function apiGet(url, token) {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GATE7A_CLOUD_READ_${response.status}`);
  return body;
}

async function apiList(url, token, field, pageSize = 100) {
  const values = [];
  let pageToken = '';
  do {
    const requestUrl = new URL(url);
    requestUrl.searchParams.set('pageSize', String(pageSize));
    if (pageToken) requestUrl.searchParams.set('pageToken', pageToken);
    const page = await apiGet(requestUrl, token);
    values.push(...(page[field] || []));
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  return values;
}

function shortResourceName(value) {
  return String(value || '').split('/').pop();
}

async function readCloudState(token, { rolloutId, buildId }) {
  const encodedDatabase = encodeURIComponent('(default)');
  const appHostingBase = `https://firebaseapphosting.googleapis.com/v1beta/projects/${PROJECT_ID}/locations/${APP_REGION}/backends/${BACKEND_ID}`;
  const [functions, indexes, rollouts, builds] = await Promise.all([
    apiList(
      `https://cloudfunctions.googleapis.com/v2/projects/${PROJECT_ID}/locations/-/functions`,
      token,
      'functions',
      500
    ),
    apiList(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${encodedDatabase}/collectionGroups/-/indexes`,
      token,
      'indexes',
      0
    ),
    apiList(`${appHostingBase}/rollouts`, token, 'rollouts'),
    apiList(`${appHostingBase}/builds`, token, 'builds')
  ]);
  const deployedFunctions = functions.map((entry) => ({
    name: shortResourceName(entry.name),
    region: String(entry.name || '').split('/locations/')[1]?.split('/')[0] || null,
    state: entry.state || null,
    updateTime: entry.updateTime || null
  }));
  for (const functionName of REQUIRED_FUNCTIONS) {
    const deployed = deployedFunctions.find((entry) => entry.name === functionName);
    if (!deployed || deployed.region !== FUNCTIONS_REGION || deployed.state !== 'ACTIVE') {
      throw new Error(`GATE7A_FUNCTION_NOT_ACTIVE:${functionName}`);
    }
  }
  const requiredIndex = indexes.find((entry) => {
    const collectionGroup = String(entry.name || '').split('/collectionGroups/')[1]?.split('/')[0];
    const fieldPaths = (entry.fields || []).map((field) => field.fieldPath);
    return collectionGroup === 'commerce_outbox' &&
      fieldPaths.includes('status') &&
      fieldPaths.includes('processingUntil');
  });
  if (!requiredIndex || requiredIndex.state !== 'READY') {
    throw new Error('GATE7A_OUTBOX_LEASE_INDEX_NOT_READY');
  }
  const rollout = rollouts.find((entry) => shortResourceName(entry.name) === rolloutId);
  const build = builds.find((entry) => shortResourceName(entry.name) === buildId);
  if (!rollout || !build) throw new Error('GATE7A_APP_RELEASE_NOT_FOUND');
  if (!['SUCCEEDED', 'ACTIVE'].includes(rollout.state) || build.state !== 'READY') {
    throw new Error('GATE7A_APP_RELEASE_NOT_READY');
  }
  return {
    appHosting: {
      backendId: BACKEND_ID,
      region: APP_REGION,
      rolloutId,
      rolloutState: rollout.state,
      buildId,
      buildState: build.state
    },
    functions: deployedFunctions
      .filter((entry) => REQUIRED_FUNCTIONS.includes(entry.name))
      .sort((left, right) => left.name.localeCompare(right.name)),
    indexes: {
      outboxLeaseIndex: shortResourceName(requiredIndex.name),
      state: requiredIndex.state
    }
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.get('project');
  const environment = args.get('env') || 'sandbox';
  const rolloutId = args.get('app-rollout');
  const buildId = args.get('app-build');
  const commit = args.get('commit') === 'true';
  if (
    projectId !== PROJECT_ID ||
    environment !== 'sandbox' ||
    !/^(?:rollout|build)-[A-Za-z0-9_-]{8,}$/.test(String(rolloutId || '')) ||
    !/^build-[A-Za-z0-9_-]{8,}$/.test(String(buildId || ''))
  ) throw new Error('GATE7A_TARGET_OR_APP_RELEASE_INVALID');
  if (commit && args.get('confirm') !== `CREATE_GATE7A_RELEASE_${PROJECT_ID}`) {
    throw new Error(`Commit exige --confirm=CREATE_GATE7A_RELEASE_${PROJECT_ID}`);
  }

  const credential = await resolveCredential();
  const app = getApps().find((entry) => entry.name === 'gate7a-release') || initializeApp({
    credential,
    projectId
  }, 'gate7a-release');
  const db = getFirestore(app);
  const accessToken = (await credential.getAccessToken()).access_token;
  const cloud = await readCloudState(accessToken, { rolloutId, buildId });
  const [controlSnapshot, policySnapshot, scopeSnapshot, operationsSnapshot] = await Promise.all([
    db.doc('sys_commerce_control/current').get(),
    db.doc('commerce_policy_versions/fixture_policy_20260728').get(),
    db.doc(`commerce_fixture_scopes/${FIXTURE_SCOPE_VERSION}`).get(),
    db.doc('sys_commerce_operations/current').get()
  ]);
  if (!controlSnapshot.exists || !policySnapshot.exists || !scopeSnapshot.exists || !operationsSnapshot.exists) {
    throw new Error('GATE7A_RUNTIME_EVIDENCE_MISSING');
  }
  const control = controlSnapshot.data();
  const operations = operationsSnapshot.data();
  if (
    !['off', 'v2_fixture'].includes(control.newCheckoutMode) ||
    control.fixtureScopeVersion !== FIXTURE_SCOPE_VERSION ||
    operations.status !== 'healthy'
  ) throw new Error('GATE7A_CONTROL_OR_HEALTH_NOT_READY');

  const gitCommit = gitValue(['rev-parse', 'HEAD']);
  const workingTreePatchHash = sha256(gitValue(['diff', '--binary', 'HEAD']));
  const content = {
    schemaVersion: 2,
    projectId,
    environment,
    sourceRevision: { gitCommit, workingTreePatchHash },
    appHosting: cloud.appHosting,
    functions: cloud.functions,
    firestore: {
      rulesHash: await fileHash('firestore.rules'),
      indexesHash: await fileHash('firestore.indexes.json'),
      requiredIndexes: cloud.indexes,
      ttl: {
        enabledForCommerce: false,
        decision: 'disabled_gate7a_manual_retention'
      }
    },
    commerce: {
      policyVersion: policySnapshot.data().version,
      stripeConnectedAccountId: policySnapshot.data().stripeConnectedAccountId,
      fixtureScopeVersion: scopeSnapshot.data().fixtureScopeVersion,
      controlRevision: control.controlRevision,
      operationsHealthHash: operations.healthHash,
      projectionHash: operations.projection?.projectionHash || null
    },
    regions: {
      appHosting: APP_REGION,
      functionsPrimary: FUNCTIONS_REGION,
      legacyWebhookAndCleaner: 'us-central1',
      migrationPlanned: false
    }
  };
  const contentHash = sha256(JSON.stringify(content));
  const releaseId = `release_gate7a_${gitCommit.slice(0, 12)}_${contentHash.slice(0, 12)}`;
  const manifest = {
    ...content,
    releaseId,
    contentHash,
    immutable: true,
    verifiedAt: new Date().toISOString()
  };
  if (commit) {
    const reference = db.doc(`commerce_release_manifests/${releaseId}`);
    try {
      await reference.create({
        ...manifest,
        verifiedAt: Timestamp.now()
      });
    } catch (error) {
      if (error?.code !== 6 && error?.code !== 'already-exists') throw error;
      const existing = await reference.get();
      if (!existing.exists || existing.data()?.contentHash !== contentHash) {
        throw new Error('GATE7A_RELEASE_MANIFEST_IMMUTABILITY_CONFLICT');
      }
    }
  }
  const reportPath = args.get('report') || `logs/commerce/gate7a/${releaseId}.json`;
  await writeJson(reportPath, {
    mode: commit ? 'commit' : 'dry-run',
    ...manifest
  });
  console.log(JSON.stringify({
    ok: true,
    mode: commit ? 'commit' : 'dry-run',
    releaseId,
    contentHash,
    reportPath
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.message || error)
  }));
  process.exitCode = 1;
});
