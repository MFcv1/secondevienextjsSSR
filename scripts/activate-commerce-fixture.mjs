import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID = 'secondevienextjsssr';
const SCOPE_VERSION = 'fixture_gate6_20260728';

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

async function resolveCredential() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return applicationDefault();
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!existsSync(configPath)) return applicationDefault();
  const config = await readJson(configPath);
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.get('project');
  const environment = args.get('env') || 'sandbox';
  const releaseId = args.get('release');
  const commit = args.get('commit') === 'true';
  if (
    projectId !== PROJECT_ID ||
    environment !== 'sandbox' ||
    !/^release_gate7a_[A-Za-z0-9_-]{16,}$/.test(String(releaseId || ''))
  ) throw new Error('GATE7A_ACTIVATION_TARGET_INVALID');
  if (commit && args.get('confirm') !== `ACTIVATE_GATE7A_FIXTURE_${PROJECT_ID}`) {
    throw new Error(`Commit exige --confirm=ACTIVATE_GATE7A_FIXTURE_${PROJECT_ID}`);
  }
  const app = getApps().find((entry) => entry.name === 'gate7a-activate') || initializeApp({
    credential: await resolveCredential(),
    projectId
  }, 'gate7a-activate');
  const db = getFirestore(app);
  const refs = {
    control: db.doc('sys_commerce_control/current'),
    scope: db.doc(`commerce_fixture_scopes/${SCOPE_VERSION}`),
    operations: db.doc('sys_commerce_operations/current'),
    release: db.doc(`commerce_release_manifests/${releaseId}`)
  };
  const result = await db.runTransaction(async (transaction) => {
    const [controlSnapshot, scopeSnapshot, operationsSnapshot, releaseSnapshot] = await Promise.all([
      transaction.get(refs.control),
      transaction.get(refs.scope),
      transaction.get(refs.operations),
      transaction.get(refs.release)
    ]);
    if (!controlSnapshot.exists || !scopeSnapshot.exists || !operationsSnapshot.exists || !releaseSnapshot.exists) {
      throw new Error('GATE7A_ACTIVATION_EVIDENCE_MISSING');
    }
    const control = controlSnapshot.data();
    const scope = scopeSnapshot.data();
    const operations = operationsSnapshot.data();
    const release = releaseSnapshot.data();
    if (
      !['off', 'v2_fixture'].includes(control.newCheckoutMode) ||
      control.adminMutationMode !== 'read_only' ||
      control.offlinePaymentMode !== 'off' ||
      control.fixtureScopeVersion !== SCOPE_VERSION ||
      control.activePolicyVersion !== scope.policyVersion ||
      scope.active !== true ||
      scope.environment !== 'sandbox' ||
      scope.projectId !== PROJECT_ID ||
      operations.status !== 'healthy' ||
      release.immutable !== true ||
      release.projectId !== PROJECT_ID ||
      release.environment !== 'sandbox' ||
      release.commerce?.fixtureScopeVersion !== SCOPE_VERSION ||
      release.commerce?.operationsHealthHash !== operations.healthHash
    ) throw new Error('GATE7A_ACTIVATION_INVARIANT_FAILED');
    const next = {
      ...control,
      newCheckoutMode: 'v2_fixture',
      controlRevision: control.controlRevision + 1,
      releaseManifestId: releaseId,
      updatedAt: Timestamp.now(),
      updatedBy: 'gate7a-fixture-activation'
    };
    if (commit) transaction.set(refs.control, next);
    return {
      previousMode: control.newCheckoutMode,
      nextMode: next.newCheckoutMode,
      previousRevision: control.controlRevision,
      nextRevision: next.controlRevision,
      fixtureScopeVersion: SCOPE_VERSION,
      releaseId
    };
  });
  const reportPath = args.get('report') || 'logs/commerce/gate7a/fixture-activation.json';
  const absolute = path.resolve(reportPath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, `${JSON.stringify({
    mode: commit ? 'commit' : 'dry-run',
    projectId,
    environment,
    ...result
  }, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    ok: true,
    mode: commit ? 'commit' : 'dry-run',
    ...result,
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
