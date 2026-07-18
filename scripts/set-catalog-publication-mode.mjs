import {
  CONTROL_PATH,
  SANDBOX_PROJECT,
  assertSandbox,
  initializeSandbox,
  parseArgs,
  writeEvidence,
} from './catalog-sandbox-lib.mjs';

const TRANSITIONS = new Set([
  'shadow:snapshot_canary',
  'snapshot_canary:snapshot',
  'snapshot_canary:shadow',
  'snapshot_canary:paused',
  'snapshot:rollback',
  'snapshot:paused',
  'rollback:snapshot',
  'rollback:shadow',
  'paused:shadow',
]);

const args = parseArgs();
const projectId = String(args.project || SANDBOX_PROJECT);
const from = String(args.from || '').trim();
const to = String(args.to || '').trim();
assertSandbox(projectId);
if (args.commit !== true && args.commit !== 'true') {
  throw new Error('Mode transition is write-capable; rerun with --commit for the confirmed sandbox');
}
if (!TRANSITIONS.has(`${from}:${to}`)) throw new Error(`Refusing catalog transition ${from}:${to}`);

const { db } = initializeSandbox({ projectId });
const ref = db.doc(CONTROL_PATH);
const result = await db.runTransaction(async (transaction) => {
  const snap = await transaction.get(ref);
  if (!snap.exists) throw new Error('Catalog publication control does not exist');
  const before = snap.data();
  if (before.mode !== from) throw new Error(`Expected mode ${from}, found ${before.mode}`);
  if (before.leaseToken) throw new Error('Refusing mode transition while a build lease is active');
  const now = new Date();
  const desiredRevision = Number(before.desiredRevision || 0) + 1;
  transaction.set(ref, {
    mode: to,
    dirty: true,
    desiredRevision,
    dirtySince: now,
    quietUntil: now,
    queuedTaskName: null,
    queuedFor: null,
    buildState: 'queued',
    lastMutationAt: now,
    updatedAt: now,
  }, { merge: true });
  return {
    from,
    to,
    desiredRevision,
    previousPublishedRevision: Number(before.publishedRevision || 0),
    previousPreparedRevision: Number(before.preparedRevision || 0),
  };
});

const evidence = { ok: true, projectId, ...result };
evidence.evidencePath = writeEvidence('catalog-mode-transition', evidence);
console.log(JSON.stringify(evidence, null, 2));
