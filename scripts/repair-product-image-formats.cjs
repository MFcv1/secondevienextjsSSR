#!/usr/bin/env node
'use strict';

// Bounded repair of the three September 2026 PNG imports. Preparation writes
// private local backups only. Commit creates immutable files, then uses one
// conditional batch; it never deletes media or edits prices, stock or orders.
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const admin = require('firebase-admin');
const sharp = require('sharp');
const PROJECT = 'secondevienextjsssr';
const BUCKET = `${PROJECT}.firebasestorage.app`;
const IDS = [
  'product-f6c608a1-b1d8-4d8c-88b3-5e43a0f4f914',
  'product-2b9b2ab2-c701-4640-99d5-76a35aebb672',
  'product-56af4d4e-54ee-4fd8-8510-4e949f2ab3e0',
];
const SPECS = [['thumb320', 320, 73], ['thumb384', 384, 74], ['thumb', 480, 74],
  ['card', 768, 82], ['detailFast', 900, 78], ['medium', 1024, 80], ['large', 1440, 82], ['full', 1920, 85]];
const sha = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const fingerprint = (value) => sha(JSON.stringify(value));
const refPath = (id) => `artifacts/secondevie/public/data/furniture/${id}`;
const command = process.argv[2];
const planPath = process.argv[3];
if (!['prepare', 'commit', 'rollback'].includes(command)
    || (command !== 'prepare' && !planPath)) throw new Error('Use prepare, commit <private-plan>, or rollback <private-plan>');

const app = admin.initializeApp({ projectId: PROJECT, storageBucket: BUCKET,
  credential: admin.credential.applicationDefault() });
const db = app.firestore();
const bucket = app.storage().bucket();
const readPlan = async () => {
  const plan = JSON.parse(await fs.readFile(planPath, 'utf8'));
  if (plan.project !== PROJECT || plan.bucket !== BUCKET || plan.products.length !== 3
      || plan.products.some((p, index) => p.id !== IDS[index])) throw new Error('Unexpected repair scope');
  return plan;
};

async function main() {
  const control = (await db.doc('sys_commerce_control/current').get()).data() || {};
  // Read the current control; do not change it as part of an image repair.
  console.log(JSON.stringify({ project: PROJECT, command, newCheckoutMode: control.newCheckoutMode,
    adminMutationMode: control.adminMutationMode, offlinePaymentMode: control.offlinePaymentMode, products: IDS.length }));
  if (control.newCheckoutMode !== 'v2_all' || control.adminMutationMode !== 'v2' || control.offlinePaymentMode !== 'off') throw new Error('Unexpected sandbox commerce control');
  if (command === 'prepare') {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'secondevie-image-repair-'));
    await fs.chmod(directory, 0o700);
    const plan = { project: PROJECT, bucket: BUCKET, preparedAt: new Date().toISOString(), products: [] };
    for (const id of IDS) {
      const snap = await db.doc(refPath(id)).get();
      const data = snap.data();
      if (!data || data.status !== 'published' || !data.images?.length || data.images.length > 16) throw new Error('Unexpected product state');
      const product = { id, before: data.imageVariants, after: [], files: [],
        updateTime: { seconds: snap.updateTime.seconds, nanoseconds: snap.updateTime.nanoseconds } };
      let sourceBytes = 0;
      let outputBytes = 0;
      for (let index = 0; index < data.images.length; index += 1) {
        const source = new URL(data.imageVariants?.[index]?.full || data.images[index]);
        const match = source.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
        if (source.hostname !== 'firebasestorage.googleapis.com' || !match || decodeURIComponent(match[1]) !== BUCKET) throw new Error('Unexpected source bucket');
        const [buffer] = await bucket.file(decodeURIComponent(match[2])).download();
        sourceBytes += buffer.length;
        const next = { ...data.imageVariants[index] };
        for (const [key, width, quality] of SPECS) {
          const bytes = await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).webp({ quality, effort: 4 }).toBuffer();
          if ((await sharp(bytes).metadata()).format !== 'webp') throw new Error('Invalid encoded format');
          const hash = sha(bytes);
          const name = `furniture/format-repair/${id}/${index}_${key}_${hash.slice(0, 20)}.webp`;
          const token = crypto.randomUUID();
          const local = path.join(directory, `${id}_${index}_${key}.webp`);
          await fs.writeFile(local, bytes, { mode: 0o600 });
          next[key] = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(name)}?alt=media&token=${token}`;
          product.files.push({ name, token, local, hash, bytes: bytes.length });
          outputBytes += bytes.length;
        }
        product.after.push(next);
      }
      plan.products.push(product);
      console.log(JSON.stringify({ id, images: data.images.length, files: product.files.length, sourceBytes, outputBytes }));
    }
    const target = path.join(directory, 'plan.json');
    await fs.writeFile(target, JSON.stringify(plan), { mode: 0o600 });
    console.log(JSON.stringify({ prepared: target, cloudWrites: 0 }));
    return;
  }
  const plan = await readPlan();
  const snapshots = await db.getAll(...IDS.map((id) => db.doc(refPath(id))));
  const expected = command === 'rollback' ? 'after' : 'before';
  for (let index = 0; index < snapshots.length; index += 1) {
    if (fingerprint(snapshots[index].data()?.imageVariants) !== fingerprint(plan.products[index][expected])) throw new Error('Images changed since preparation; refusing overwrite');
  }
  if (command === 'commit') {
    for (const product of plan.products) {
      for (const file of product.files) {
        const buffer = await fs.readFile(file.local);
        if (sha(buffer) !== file.hash) throw new Error('Local artifact changed');
        const target = bucket.file(file.name);
        const [exists] = await target.exists();
        if (exists) {
          const [metadata] = await target.getMetadata();
          if (metadata.metadata?.repairHash !== file.hash || metadata.metadata?.firebaseStorageDownloadTokens !== file.token) throw new Error('Immutable target collision');
        } else {
          await target.save(buffer, { resumable: false, preconditionOpts: { ifGenerationMatch: 0 }, metadata: {
            contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable',
            metadata: { firebaseStorageDownloadTokens: file.token, repairHash: file.hash },
          } });
        }
      }
      console.log(JSON.stringify({ uploaded: product.id, files: product.files.length }));
    }
  }
  const batch = db.batch();
  snapshots.forEach((snap, index) => batch.update(snap.ref, {
    imageVariants: plan.products[index][command === 'rollback' ? 'before' : 'after'],
  }, { lastUpdateTime: snap.updateTime }));
  await batch.commit();
  const after = await db.getAll(...IDS.map((id) => db.doc(refPath(id))));
  if (after.some((snap, index) => fingerprint(snap.data().imageVariants)
    !== fingerprint(plan.products[index][command === 'rollback' ? 'before' : 'after']))) throw new Error('Repair readback mismatch');
  console.log(JSON.stringify({ completed: command, products: IDS.length, deletedFiles: 0 }));
}
main().catch((error) => { console.error(`Image format repair failed (${error.code || error.name}); no automatic replay. Inspect scope and private plan.`); process.exitCode = 1; })
  .finally(() => app.delete());
