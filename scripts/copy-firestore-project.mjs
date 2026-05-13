import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...valueParts] = arg.replace(/^--/, '').split('=');
    return [key, valueParts.join('=') || 'true'];
  })
);

const sourceProject = args.get('source');
const targetProject = args.get('target');
const dryRun = args.get('dry-run') === 'true';
const rootCollections = (args.get('collections') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (!sourceProject || !targetProject) {
  throw new Error('Usage: node scripts/copy-firestore-project.mjs --source=<project> --target=<project> [--dry-run=true] [--collections=a,b]');
}

if (sourceProject === targetProject) {
  throw new Error('Source and target projects must be different.');
}

function appFor(projectId, name) {
  return getApps().find((app) => app.name === name) || initializeApp({
    credential: applicationDefault(),
    projectId
  }, name);
}

const sourceDb = getFirestore(appFor(sourceProject, 'source'));
const targetDb = getFirestore(appFor(targetProject, 'target'));

let docsSeen = 0;
let docsWritten = 0;
let batches = 0;
let pendingBatch = targetDb.batch();
let pendingWrites = 0;

async function flushBatch() {
  if (!pendingWrites) return;
  if (!dryRun) await pendingBatch.commit();
  batches += 1;
  pendingBatch = targetDb.batch();
  pendingWrites = 0;
}

async function queueSet(targetRef, data) {
  docsWritten += 1;
  if (!dryRun) {
    pendingBatch.set(targetRef, data);
    pendingWrites += 1;
    if (pendingWrites >= 450) await flushBatch();
  }
}

async function copyDocument(sourceRef, targetRef) {
  const snap = await sourceRef.get();
  if (snap.exists) {
    docsSeen += 1;
    await queueSet(targetRef, snap.data());
  }

  const subCollections = await sourceRef.listCollections();
  for (const subCollection of subCollections) {
    await copyCollection(subCollection, targetRef.collection(subCollection.id));
  }
}

async function copyCollection(sourceCollection, targetCollection) {
  const docs = await sourceCollection.listDocuments();
  for (const sourceDocRef of docs) {
    await copyDocument(sourceDocRef, targetCollection.doc(sourceDocRef.id));
  }
}

const collections = rootCollections.length
  ? rootCollections.map((name) => sourceDb.collection(name))
  : await sourceDb.listCollections();

console.log(`Copy Firestore ${sourceProject} -> ${targetProject}`);
console.log(`Mode: ${dryRun ? 'dry-run' : 'write'}`);
console.log(`Root collections: ${collections.map((collection) => collection.id).join(', ') || '(none)'}`);

for (const collection of collections) {
  console.log(`Copying collection: ${collection.id}`);
  await copyCollection(collection, targetDb.collection(collection.id));
}

await flushBatch();

console.log(JSON.stringify({
  sourceProject,
  targetProject,
  dryRun,
  docsSeen,
  docsWritten,
  batches
}, null, 2));
