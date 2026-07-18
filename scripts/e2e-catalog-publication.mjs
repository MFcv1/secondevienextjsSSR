import { FieldValue } from 'firebase-admin/firestore';
import {
  APP_ID,
  CONTROL_PATH,
  HOSTED_URL,
  SANDBOX_PROJECT,
  assertSandbox,
  initializeSandbox,
  parseArgs,
  readPreparedOrCurrentRelease,
  writeEvidence,
} from './catalog-sandbox-lib.mjs';

const args = parseArgs();
const projectId = String(args.project || SANDBOX_PROJECT);
assertSandbox(projectId);
if (args.commit !== true && args.commit !== 'true') {
  throw new Error('Publication E2E is write-capable; rerun with --commit after reviewing the sandbox target');
}
const { db, bucket } = initializeSandbox({ projectId });
const probeRef = db.doc(`artifacts/${APP_ID}/public/data/furniture/_e2e_catalog_publication_probe`);
const original = await probeRef.get();
if (original.exists) throw new Error('Publication probe already exists; refusing to overwrite an unknown document');
const beforeControl = (await db.doc(CONTROL_PATH).get()).data() || {};

const waitForBuild = async (minimumRevision, timeoutMs = 180000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = (await db.doc(CONTROL_PATH).get()).data() || {};
    const completed = Math.max(Number(value.preparedRevision || 0), Number(value.publishedRevision || 0));
    if (completed >= minimumRevision && !value.leaseToken) return value;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Timed out waiting for catalog revision ${minimumRevision}`);
};

const waitForDesiredRevision = async (minimumExclusive, timeoutMs = 90000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = (await db.doc(CONTROL_PATH).get()).data() || {};
    if (Number(value.desiredRevision || 0) > minimumExclusive) return Number(value.desiredRevision);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for desired revision after ${minimumExclusive}`);
};

const stages = [];
const readHostedCanaryProduct = async () => {
  const response = await fetch(`${HOSTED_URL}/api/catalog?id=${encodeURIComponent(probeRef.id)}&__e2e=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'x-catalog-canary': 'snapshot' },
  });
  const body = await response.json();
  return { status: response.status, product: body?.product || null };
};

const waitForSnapshotProduct = async (
  expectedPrice,
  expectedStock,
  expectedPresent = true,
  minimumRevision = 0,
  timeoutMs = 180000,
) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const materialized = await readPreparedOrCurrentRelease({ db, bucket });
    const revision = Number(materialized.release.pointer.revision);
    const product = materialized.release.files['catalog-full.json']?.products?.find((item) => item.id === probeRef.id);
    const valuesMatch = !product
      || (Number(product.currentPrice) === expectedPrice && Number(product.stock) === expectedStock);
    if (revision > minimumRevision && Boolean(product) === expectedPresent && valuesMatch) {
      const hosted = await readHostedCanaryProduct();
      const hostedValuesMatch = !hosted.product
        || (Number(hosted.product.currentPrice) === expectedPrice && Number(hosted.product.stock) === expectedStock);
      const hostedMatches = expectedPresent
        ? hosted.status === 200 && Boolean(hosted.product) && hostedValuesMatch
        : hosted.status === 404 && !hosted.product;
      if (!hostedMatches) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      return {
        revision,
        manifestSha256: materialized.release.pointer.manifestSha256,
        present: Boolean(product),
        price: product ? Number(product.currentPrice) : null,
        stock: product ? Number(product.stock) : null,
        hostedCanaryStatus: hosted.status,
        hostedCanaryMatches: true,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Timed out waiting for probe convergence after snapshot revision ${minimumRevision}`);
};

let previousDesiredRevision = Number(beforeControl.desiredRevision || 0);
let previousSnapshotRevision = Math.max(
  Number(beforeControl.preparedRevision || 0),
  Number(beforeControl.publishedRevision || 0),
);
try {
  await probeRef.set({
    status: 'published',
    name: 'Catalog publication E2E probe',
    description: 'Temporary sandbox fixture removed by the publication E2E.',
    category: 'catalog-e2e',
    stock: 2,
    sold: false,
    currentPrice: 101,
    seoIndexable: false,
    images: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  previousDesiredRevision = await waitForDesiredRevision(previousDesiredRevision);
  await waitForBuild(previousDesiredRevision);
  const created = await waitForSnapshotProduct(101, 2, true, previousSnapshotRevision);
  stages.push({ operation: 'create', ...created });
  previousSnapshotRevision = created.revision;
  previousDesiredRevision = Number((await db.doc(CONTROL_PATH).get()).data()?.desiredRevision || previousDesiredRevision);

  await probeRef.update({ currentPrice: 202, updatedAt: FieldValue.serverTimestamp() });
  previousDesiredRevision = await waitForDesiredRevision(previousDesiredRevision);
  await waitForBuild(previousDesiredRevision);
  const repriced = await waitForSnapshotProduct(202, 2, true, previousSnapshotRevision);
  stages.push({ operation: 'price', ...repriced });
  previousSnapshotRevision = repriced.revision;
  previousDesiredRevision = Number((await db.doc(CONTROL_PATH).get()).data()?.desiredRevision || previousDesiredRevision);

  await probeRef.update({ stock: 0, sold: true, updatedAt: FieldValue.serverTimestamp() });
  previousDesiredRevision = await waitForDesiredRevision(previousDesiredRevision);
  await waitForBuild(previousDesiredRevision);
  const sold = await waitForSnapshotProduct(202, 0, true, previousSnapshotRevision);
  stages.push({ operation: 'stock', ...sold });
  previousSnapshotRevision = sold.revision;
  previousDesiredRevision = Number((await db.doc(CONTROL_PATH).get()).data()?.desiredRevision || previousDesiredRevision);
  } finally {
  if ((await probeRef.get()).exists) {
    await probeRef.delete();
    previousDesiredRevision = await waitForDesiredRevision(previousDesiredRevision);
    await waitForBuild(previousDesiredRevision);
    const deleted = await waitForSnapshotProduct(null, null, false, previousSnapshotRevision);
    stages.push({ operation: 'delete', ...deleted });
    previousSnapshotRevision = deleted.revision;
    previousDesiredRevision = Number((await db.doc(CONTROL_PATH).get()).data()?.desiredRevision || previousDesiredRevision);
  }
}

const afterControl = (await db.doc(CONTROL_PATH).get()).data() || {};
const evidence = {
  ok: stages.length === 4
    && new Set(stages.map((stage) => stage.revision)).size === 4
    && new Set(stages.map((stage) => stage.manifestSha256)).size === 4
    && Math.max(Number(afterControl.preparedRevision || 0), Number(afterControl.publishedRevision || 0)) >= previousDesiredRevision,
  projectId,
  beforeRevision: Number(beforeControl.desiredRevision || 0),
  finalRevision: previousDesiredRevision,
  finalBuildState: afterControl.buildState || null,
  sourceRestored: true,
  stages,
};
evidence.evidencePath = writeEvidence('catalog-publication', evidence);
console.log(JSON.stringify(evidence, null, 2));
if (!evidence.ok) process.exitCode = 1;
