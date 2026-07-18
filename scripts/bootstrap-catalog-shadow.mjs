import {
  CONTROL_PATH,
  SANDBOX_PROJECT,
  assertSandbox,
  initializeSandbox,
  parseArgs,
  writeEvidence,
} from './catalog-sandbox-lib.mjs';

const args = parseArgs();
const projectId = String(args.project || SANDBOX_PROJECT);
assertSandbox(projectId);
if (args.commit !== true && args.commit !== 'true') {
  throw new Error('Bootstrap is write-capable; rerun with --commit for the confirmed sandbox project');
}

const { db } = initializeSandbox({ projectId });
const ref = db.doc(CONTROL_PATH);
const beforeSnap = await ref.get();
const now = new Date();
if (!beforeSnap.exists) {
  await ref.create({
    schemaVersion: 1,
    projectionContractVersion: 1,
    mode: 'shadow',
    dirty: true,
    desiredRevision: 1,
    publishedRevision: 0,
    revalidatedRevision: 0,
    dirtySince: now,
    quietUntil: now,
    queuedTaskName: null,
    queuedFor: null,
    leaseToken: null,
    leaseOwner: null,
    leaseTargetRevision: null,
    leaseAcquiredAt: null,
    leaseExpiresAt: null,
    buildState: 'queued',
    preparedRevision: null,
    currentManifestPath: null,
    currentManifestSha256: null,
    currentPointerGeneration: null,
    previousRevision: null,
    previousManifestPath: null,
    previousManifestSha256: null,
    consecutiveFailures: 0,
    lastError: null,
    lastMutationAt: now,
    updatedAt: now,
  });
} else {
  const before = beforeSnap.data();
  if (!['legacy', 'shadow', 'paused'].includes(before.mode)) {
    throw new Error(`Refusing to replace active publication mode ${before.mode}`);
  }
  await ref.set({
    mode: 'shadow',
    dirty: true,
    desiredRevision: Number(before.desiredRevision || 0) + 1,
    dirtySince: before.dirtySince || now,
    quietUntil: now,
    buildState: 'queued',
    lastMutationAt: now,
    updatedAt: now,
  }, { merge: true });
}
const after = (await ref.get()).data();
const evidence = {
  ok: after.mode === 'shadow' && after.dirty === true,
  projectId,
  created: !beforeSnap.exists,
  desiredRevision: Number(after.desiredRevision),
  mode: after.mode,
};
evidence.evidencePath = writeEvidence('catalog-shadow-bootstrap', evidence);
console.log(JSON.stringify(evidence, null, 2));
if (!evidence.ok) process.exitCode = 1;
