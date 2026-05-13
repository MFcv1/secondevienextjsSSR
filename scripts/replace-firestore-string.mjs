import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...valueParts] = arg.replace(/^--/, '').split('=');
    return [key, valueParts.join('=') || 'true'];
  })
);

const projectId = args.get('project');
const from = args.get('from');
const to = args.get('to');
const dryRun = args.get('dry-run') === 'true';
const rootCollections = (args.get('collections') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (!projectId || !from || !to) {
  throw new Error('Usage: node scripts/replace-firestore-string.mjs --project=<project> --from=<text> --to=<text> [--dry-run=true] [--collections=a,b]');
}

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();

let docsSeen = 0;
let docsChanged = 0;
let replacements = 0;
let batches = 0;
let pendingBatch = db.batch();
let pendingWrites = 0;

function replaceValue(value) {
  if (typeof value === 'string') {
    if (!value.includes(from)) return { value, count: 0 };
    const nextValue = value.split(from).join(to);
    return { value: nextValue, count: value.split(from).length - 1 };
  }

  if (Array.isArray(value)) {
    let count = 0;
    const nextArray = value.map((item) => {
      const result = replaceValue(item);
      count += result.count;
      return result.value;
    });
    return { value: nextArray, count };
  }

  if (value && typeof value === 'object' && typeof value.toDate !== 'function') {
    let count = 0;
    const nextObject = {};
    for (const [key, nested] of Object.entries(value)) {
      const result = replaceValue(nested);
      count += result.count;
      nextObject[key] = result.value;
    }
    return { value: nextObject, count };
  }

  return { value, count: 0 };
}

async function flushBatch() {
  if (!pendingWrites) return;
  if (!dryRun) await pendingBatch.commit();
  batches += 1;
  pendingBatch = db.batch();
  pendingWrites = 0;
}

async function queueSet(ref, data) {
  if (!dryRun) {
    pendingBatch.set(ref, data);
    pendingWrites += 1;
    if (pendingWrites >= 450) await flushBatch();
  }
}

async function scanDocument(ref) {
  const snap = await ref.get();
  if (snap.exists) {
    docsSeen += 1;
    const result = replaceValue(snap.data());
    if (result.count > 0) {
      docsChanged += 1;
      replacements += result.count;
      await queueSet(ref, result.value);
      console.log(`${dryRun ? 'Would update' : 'Updated'} ${ref.path}: ${result.count}`);
    }
  }

  const subCollections = await ref.listCollections();
  for (const subCollection of subCollections) {
    await scanCollection(subCollection);
  }
}

async function scanCollection(collectionRef) {
  const docs = await collectionRef.listDocuments();
  for (const docRef of docs) {
    await scanDocument(docRef);
  }
}

const collections = rootCollections.length
  ? rootCollections.map((name) => db.collection(name))
  : await db.listCollections();

console.log(`Replace Firestore strings in ${projectId}`);
console.log(`Mode: ${dryRun ? 'dry-run' : 'write'}`);
console.log(`From: ${from}`);
console.log(`To: ${to}`);
console.log(`Root collections: ${collections.map((collection) => collection.id).join(', ') || '(none)'}`);

for (const collection of collections) {
  await scanCollection(collection);
}

await flushBatch();

console.log(JSON.stringify({
  projectId,
  dryRun,
  docsSeen,
  docsChanged,
  replacements,
  batches
}, null, 2));
