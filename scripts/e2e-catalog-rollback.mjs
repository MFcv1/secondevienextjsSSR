import {
  SANDBOX_PROJECT,
  assertSandbox,
  initializeSandbox,
  parseArgs,
  readStorageJson,
  verifyRelease,
  writeEvidence,
} from './catalog-sandbox-lib.mjs';

const args = parseArgs();
const projectId = String(args.project || SANDBOX_PROJECT);
assertSandbox(projectId);
const { bucket } = initializeSandbox({ projectId });
const currentObject = await readStorageJson(bucket, 'catalog-projection/v1/pointers/current.json');
const current = await verifyRelease(bucket, currentObject.value);
const previousPointer = currentObject.value.previous?.manifestPath
  ? { ...currentObject.value.previous, schemaVersion: 1, projectionContractVersion: 1 }
  : (await readStorageJson(bucket, 'catalog-projection/v1/pointers/previous.json')).value;
const previous = await verifyRelease(bucket, previousPointer);

const evidence = {
  ok: Number(previous.pointer.revision) < Number(current.pointer.revision),
  mode: 'verification-only',
  projectId,
  currentRevision: Number(current.pointer.revision),
  previousRevision: Number(previous.pointer.revision),
  currentGeneration: currentObject.generation,
  currentManifestSha256: current.pointer.manifestSha256,
  previousManifestSha256: previous.pointer.manifestSha256,
};
evidence.evidencePath = writeEvidence('catalog-rollback-verification', evidence);
console.log(JSON.stringify(evidence, null, 2));
if (!evidence.ok) process.exitCode = 1;
