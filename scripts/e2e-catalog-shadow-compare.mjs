import {
  HOSTED_URL,
  LEGACY_CATALOG_URL,
  SANDBOX_PROJECT,
  assertSandbox,
  fetchJson,
  initializeSandbox,
  normalizeLegacyProducts,
  parseArgs,
  readPreparedOrCurrentRelease,
  readSourceProjection,
  stableEqual,
  writeEvidence,
} from './catalog-sandbox-lib.mjs';

const args = parseArgs();
const projectId = String(args.project || SANDBOX_PROJECT);
assertSandbox(projectId, HOSTED_URL);
const requiredBuilds = Number(args['require-builds'] || 1);
const { db, bucket } = initializeSandbox({ projectId });

const [{ documents, projection, inventory }, materialized, legacy, builds] = await Promise.all([
  readSourceProjection(db),
  readPreparedOrCurrentRelease({ db, bucket }),
  fetchJson(LEGACY_CATALOG_URL),
  db.collection('sys_catalog_publication_builds').where('state', 'in', ['prepared', 'published']).limit(100).get(),
]);

if (!legacy.response.ok) throw new Error(`Legacy catalog HTTP ${legacy.response.status}`);
const legacyProducts = normalizeLegacyProducts(legacy.body?.collections?.furniture || []);
const snapshotProducts = materialized.release.files['catalog-full.json']?.products || [];
const snapshotCards = materialized.release.files['catalog-cards.json']?.products || [];
const snapshotInventory = materialized.release.files['inventory-overview.json']?.overview || null;
const searchProducts = materialized.release.files['search-index.json']?.products || [];

const checks = {
  sourceVsSnapshot: stableEqual(projection.full, snapshotProducts),
  sourceCardsVsSnapshot: stableEqual(projection.cards, snapshotCards),
  sourceVsLegacyAllowlist: stableEqual(projection.full, legacyProducts),
  inventory: stableEqual(inventory, snapshotInventory),
  searchIds: stableEqual(projection.full.map(({ id }) => id), searchProducts.map(({ id }) => id)),
  manifestProductCount: materialized.release.manifest.productCount === projection.full.length,
  completedBuilds: builds.size >= requiredBuilds,
};
const evidence = {
  ok: Object.values(checks).every(Boolean),
  projectId,
  sourceDocuments: documents.length,
  publicProducts: projection.full.length,
  snapshotRevision: materialized.release.pointer.revision,
  snapshotSource: materialized.source,
  completedBuilds: builds.size,
  requiredBuilds,
  aggregateSha256: projection.aggregateSha256,
  checks,
};
evidence.evidencePath = writeEvidence('catalog-shadow-parity', evidence);
console.log(JSON.stringify(evidence, null, 2));
if (!evidence.ok) process.exitCode = 1;
