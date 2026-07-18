import 'server-only';

import { unstable_cache } from 'next/cache';
import { getAdminStorage } from './firebaseAdmin';
import catalogValidation from './materializedCatalogValidation.cjs';

const SNAPSHOT_ROOT = 'catalog-projection/v1';
const POINTER_REVALIDATE_SECONDS = 15;
const RELEASE_REVALIDATE_SECONDS = 31536000;
let lastKnownGood = null;

const getSnapshotBucket = () => {
  const storage = getAdminStorage();
  if (!storage) throw new Error('CATALOG_STORAGE_UNAVAILABLE');
  return storage.bucket(process.env.CATALOG_SNAPSHOT_BUCKET || undefined);
};

const readObject = async (path) => {
  const file = getSnapshotBucket().file(path);
  const [buffer] = await file.download();
  const body = buffer.toString('utf8');
  return { body, value: JSON.parse(body), path };
};

const readCurrentPointerCached = unstable_cache(
  async () => (await readObject(`${SNAPSHOT_ROOT}/pointers/current.json`)).value,
  ['catalog-materialized-pointer'],
  { revalidate: POINTER_REVALIDATE_SECONDS, tags: ['catalog:pointer'] }
);

const readPreviousPointerCached = unstable_cache(
  async () => (await readObject(`${SNAPSHOT_ROOT}/pointers/previous.json`)).value,
  ['catalog-materialized-previous-pointer'],
  { revalidate: POINTER_REVALIDATE_SECONDS, tags: ['catalog:pointer'] }
);

const readReleaseObjectCached = unstable_cache(
  async (path) => readObject(path),
  ['catalog-materialized-release'],
  { revalidate: RELEASE_REVALIDATE_SECONDS, tags: ['catalog'] }
);

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
  lastKnownGood = snapshot;
  return snapshot;
};

export const getMaterializedCatalogSnapshot = async () => {
  let current = null;
  try {
    current = await readCurrentPointerCached();
    return await loadRelease(current);
  } catch (currentError) {
    try {
      const previous = current?.previous?.manifestPath
        ? { ...current.previous, projectionContractVersion: current.projectionContractVersion }
        : await readPreviousPointerCached();
      return await loadRelease(previous);
    } catch (previousError) {
      if (lastKnownGood) return lastKnownGood;
      const error = new Error('CATALOG_NO_HEALTHY_SNAPSHOT');
      error.cause = { currentError, previousError };
      throw error;
    }
  }
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
  const snapshot = await getMaterializedCatalogSnapshot();
  const normalizedCategories = [...new Set(categories.map((value) => String(value || '').trim()).filter(Boolean))].slice(0, 10);
  const parsedCursor = decodeCursor(cursor);
  if (cursor && !parsedCursor) throw new Error('INVALID_CATALOG_CURSOR');
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

export const getMaterializedProduct = async (id) => {
  const snapshot = await getMaterializedCatalogSnapshot();
  return snapshot.full.find((product) => product.id === id) || null;
};

export const __resetMaterializedCatalogForTests = () => {
  lastKnownGood = null;
};
