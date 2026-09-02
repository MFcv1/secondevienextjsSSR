import 'server-only';

import { unstable_cache } from 'next/cache';
import { getAdminStorage } from './firebaseAdmin';
import { publicEnv } from './env';
import catalogValidation from './materializedCatalogValidation.cjs';

const SNAPSHOT_ROOT = 'catalog-projection/v1';
const RELEASE_REVALIDATE_SECONDS = 31536000;
let lastFallbackLog = { key: '', at: 0 };
let buildFixturePromise = null;

const getBuildFixture = async () => {
  if (process.env.CATALOG_BUILD_FIXTURE !== 'true') return null;
  buildFixturePromise ||= import('../../../tests/catalog/fixtures/build-snapshot.cjs')
    .then((module) => module.default || module);
  return buildFixturePromise;
};

const getSnapshotBucket = () => {
  const storage = getAdminStorage();
  if (!storage) throw new Error('CATALOG_STORAGE_UNAVAILABLE');
  return storage.bucket(publicEnv.catalogSnapshotBucket);
};

const readObject = async (path) => {
  const file = getSnapshotBucket().file(path);
  const [buffer] = await file.download();
  const body = buffer.toString('utf8');
  return { body, value: JSON.parse(body), path };
};

const readReleaseObjectCached = unstable_cache(
  async (path) => readObject(path),
  ['catalog-materialized-release'],
  { revalidate: RELEASE_REVALIDATE_SECONDS }
);

export const readFreshCurrentPointer = async () => (await readObject(`${SNAPSHOT_ROOT}/pointers/current.json`)).value;
export const readFreshFallbackPointer = async (name) => {
  if (!['previous', 'last-known-good'].includes(name)) throw new Error('CATALOG_FALLBACK_POINTER_INVALID');
  return (await readObject(`${SNAPSHOT_ROOT}/pointers/${name}.json`)).value;
};

const pointerReaders = () => [
  ['current', readFreshCurrentPointer],
  ['previous', () => readFreshFallbackPointer('previous')],
  ['last-known-good', () => readFreshFallbackPointer('last-known-good')],
];

const loadRelease = async (pointer) => {
  if (!pointer?.manifestPath) throw new Error('CATALOG_POINTER_INVALID');
  const manifestObject = await readReleaseObjectCached(pointer.manifestPath);
  const manifest = manifestObject.value;
  const prefix = pointer.manifestPath.replace(/\/manifest\.json$/, '');

  const [fullObject, cardsObject] = await Promise.all([
    readReleaseObjectCached(`${prefix}/catalog-full.json`),
    readReleaseObjectCached(`${prefix}/catalog-cards.json`)
  ]);
  const snapshot = catalogValidation.validateMaterializedRelease({
    pointer,
    manifestBody: manifestObject.body,
    manifest,
    fullBody: fullObject.body,
    fullBundle: fullObject.value,
    cardsBody: cardsObject.body,
    cardsBundle: cardsObject.value,
  });
  return snapshot;
};

export const getMaterializedCatalogSnapshot = async () => {
  const buildFixture = await getBuildFixture();
  if (buildFixture) return buildFixture;

  const candidates = pointerReaders();
  const failures = [];
  for (const [name, readPointer] of candidates) {
    try {
      const snapshot = await loadRelease(await readPointer());
      if (name !== 'current') {
        const key = `${name}:${failures.map(({ name: failedName, code }) => `${failedName}:${code}`).join(',')}`;
        const now = Date.now();
        if (lastFallbackLog.key !== key || now - lastFallbackLog.at >= 300000) {
          console.error('[catalog] fallback snapshot served', { source: name, failures });
          lastFallbackLog = { key, at: now };
        }
      }
      return snapshot;
    } catch (error) {
      failures.push({ name, code: error?.message || 'UNKNOWN' });
    }
  }
  const failureSummary = failures.map(({ name, code }) => `${name}:${code}`).join(',');
  const error = new Error(`CATALOG_NO_HEALTHY_SNAPSHOT:${failureSummary}`);
  error.failures = failures;
  throw error;
};

const timestampTuple = (value) => {
  if (value && Number.isFinite(Number(value.seconds))) {
    return [Number(value.seconds), Number(value.nanoseconds || 0)];
  }
  const millis = Date.parse(value);
  return Number.isFinite(millis) ? [Math.floor(millis / 1000), (millis % 1000) * 1e6] : [0, 0];
};

const encodeCursor = (product) => {
  const [seconds, nanoseconds] = timestampTuple(product.createdAt);
  return Buffer.from(JSON.stringify({ createdAt: { seconds, nanoseconds }, id: product.id })).toString('base64url');
};

const decodeCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const seconds = Number(value?.createdAt?.seconds);
    const nanoseconds = Number(value?.createdAt?.nanoseconds || 0);
    if (!Number.isFinite(seconds) || !Number.isFinite(nanoseconds)) return null;
    return { seconds, nanoseconds, id: typeof value.id === 'string' ? value.id : '' };
  } catch {
    return null;
  }
};

const isAfterCursor = (product, cursor) => {
  const [seconds, nanoseconds] = timestampTuple(product.createdAt);
  if (seconds < cursor.seconds) return true;
  if (seconds > cursor.seconds) return false;
  if (nanoseconds < cursor.nanoseconds) return true;
  if (nanoseconds > cursor.nanoseconds) return false;
  return cursor.id ? String(product.id).localeCompare(cursor.id) > 0 : false;
};

export const queryMaterializedCatalog = async ({ scope = 'full', limit = null, categories = [], cursor = '' } = {}) => {
  const normalizedCategories = [...new Set(categories.map((value) => String(value || '').trim()).filter(Boolean))].slice(0, 10);
  const parsedCursor = decodeCursor(cursor);
  if (cursor && !parsedCursor) throw new Error('INVALID_CATALOG_CURSOR');
  const snapshot = await getMaterializedCatalogSnapshot();
  let products = scope === 'cards' ? snapshot.cards : snapshot.full;
  if (normalizedCategories.length) {
    const allowed = new Set(normalizedCategories);
    products = products.filter((product) => allowed.has(product.category));
  }
  if (parsedCursor) products = products.filter((product) => isAfterCursor(product, parsedCursor));
  const boundedLimit = limit ? Math.max(1, Math.min(Number(limit), 120)) : null;
  const hasMore = Boolean(boundedLimit && products.length > boundedLimit);
  const page = boundedLimit ? products.slice(0, boundedLimit) : products;
  return {
    snapshot,
    products: page,
    categories: normalizedCategories,
    cursor: cursor || null,
    nextCursor: hasMore && page.length ? encodeCursor(page[page.length - 1]) : null,
    limit: boundedLimit,
    scope
  };
};

export const getMaterializedProductResult = async (id) => {
  const snapshot = await getMaterializedCatalogSnapshot();
  return {
    snapshot,
    product: snapshot.full.find((product) => product.id === id) || null,
  };
};

export const getMaterializedProduct = async (id, options) => (await getMaterializedProductResult(id, options)).product;
