import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const require = createRequire(import.meta.url);
const projection = require('../functions/src/catalog/publicProjection');
const { buildInventoryOverview } = require('../functions/src/catalog/inventoryProjection');

export const SANDBOX_PROJECT = 'secondevienextjsssr';
export const APP_ID = 'secondevie';
export const HOSTED_URL = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';
export const LEGACY_CATALOG_URL = 'https://us-central1-secondevienextjsssr.cloudfunctions.net/publicCatalog';
export const SNAPSHOT_BUCKET = 'secondevienextjsssr-catalog-europe-west4';
export const CONTROL_PATH = 'sys_catalog_publication/secondevie';

export const parseArgs = () => Object.fromEntries(process.argv.slice(2).map((entry) => {
  const [key, ...rest] = entry.replace(/^--/, '').split('=');
  return [key, rest.length ? rest.join('=') : true];
}));

export const assertSandbox = (projectId, baseUrl = HOSTED_URL) => {
  if (projectId !== SANDBOX_PROJECT) throw new Error(`Refusing non-sandbox project: ${projectId}`);
  if (baseUrl !== HOSTED_URL) throw new Error(`Refusing non-sandbox URL: ${baseUrl}`);
};

export const initializeSandbox = ({ projectId = SANDBOX_PROJECT, bucketName = SNAPSHOT_BUCKET } = {}) => {
  assertSandbox(projectId);
  const app = getApps().find((candidate) => candidate.name === 'catalog-sandbox-e2e') || initializeApp({
    projectId,
    credential: applicationDefault(),
    storageBucket: bucketName,
  }, 'catalog-sandbox-e2e');
  return { app, db: getFirestore(app), bucket: getStorage(app).bucket(bucketName) };
};

export const sha256 = (input) => crypto.createHash('sha256').update(input).digest('hex');

export const readStorageJson = async (bucket, objectPath) => {
  const file = bucket.file(objectPath);
  const [buffer] = await file.download();
  const [metadata] = await file.getMetadata();
  return {
    buffer,
    value: JSON.parse(buffer.toString('utf8')),
    generation: String(metadata.generation),
    objectPath,
  };
};

export const verifyRelease = async (bucket, pointer) => {
  if (!pointer?.manifestPath || !pointer?.manifestSha256) throw new Error('Snapshot pointer is incomplete');
  const manifestObject = await readStorageJson(bucket, pointer.manifestPath);
  if (sha256(manifestObject.buffer) !== pointer.manifestSha256) throw new Error('Manifest checksum mismatch');
  const manifest = manifestObject.value;
  if (Number(manifest.revision) !== Number(pointer.revision)) throw new Error('Manifest revision mismatch');
  const prefix = pointer.manifestPath.replace(/\/manifest\.json$/, '');
  const files = {};
  for (const [name, expected] of Object.entries(manifest.files || {})) {
    const object = await readStorageJson(bucket, `${prefix}/${name}`);
    if (sha256(object.buffer) !== expected.sha256) throw new Error(`Checksum mismatch: ${name}`);
    if (object.buffer.length !== Number(expected.bytes)) throw new Error(`Size mismatch: ${name}`);
    files[name] = object.value;
  }
  return { pointer, manifest, files };
};

export const readPreparedOrCurrentRelease = async ({ db, bucket }) => {
  const controlSnap = await db.doc(CONTROL_PATH).get();
  const control = controlSnap.exists ? controlSnap.data() : {};
  if (control.mode === 'shadow' && control.preparedManifestPath && control.preparedManifestSha256) {
    const prepared = {
      schemaVersion: 1,
      projectionContractVersion: 1,
      revision: Number(control.preparedRevision),
      manifestPath: control.preparedManifestPath,
      manifestSha256: control.preparedManifestSha256,
    };
    return { control, source: 'prepared', release: await verifyRelease(bucket, prepared) };
  }
  const current = await readStorageJson(bucket, 'catalog-projection/v1/pointers/current.json');
  return { control, source: 'current', release: await verifyRelease(bucket, current.value), pointerGeneration: current.generation };
};

export const readSourceProjection = async (db) => {
  const source = await db.collection(`artifacts/${APP_ID}/public/data/furniture`).get();
  const documents = source.docs.map((snap) => ({ id: snap.id, data: snap.data() }));
  return {
    documents,
    projection: projection.buildPublicProjection(documents),
    inventory: buildInventoryOverview(documents),
  };
};

export const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, { cache: 'no-store', ...options });
  const text = response.status === 304 ? '' : await response.text();
  let body = null;
  if (text) body = JSON.parse(text);
  return { response, body, text };
};

export const normalizeLegacyProducts = (items = []) => items
  .filter(projection.isPublicProduct)
  .map((item) => projection.toPublicProduct(item.id, item))
  .sort(projection.compareCreatedAtDescending);

export const stableEqual = (left, right) => projection.stableStringify(left) === projection.stableStringify(right);

export const writeEvidence = (name, value) => {
  const directory = path.join(process.cwd(), 'logs');
  fs.mkdirSync(directory, { recursive: true });
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(directory, `${name}-${runId}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return filePath;
};

export { projection, buildInventoryOverview };
