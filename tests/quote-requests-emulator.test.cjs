'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
// Use the same dependency instance as the Functions runtime under test.
const admin = require('../functions/node_modules/firebase-admin');
const sharp = require('../functions/node_modules/sharp');

const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId || !process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
  throw new Error('Quote emulator test requires Firestore and Storage emulators.');
}

admin.initializeApp({
  projectId,
  storageBucket: `${projectId}.appspot.com`,
});

const {
  createQuoteRequestHandler,
  finalizeQuoteRequestHandler,
  listQuoteRequestsAdminHandler,
  updateQuoteRequestAdminHandler,
  uploadQuoteRequestPhotoHandler,
} = require('../functions/src/quotes/quoteRequests');

const db = admin.firestore();
const publicContext = {
  auth: null,
  rawRequest: {
    ip: '127.0.0.77',
    headers: { 'x-forwarded-for': '127.0.0.77' },
  },
};
const adminContext = {
  auth: {
    uid: 'quote-admin-1',
    token: {
      admin: true,
      firebase: { sign_in_provider: 'google.com' },
    },
  },
};

test('devis: création, photo privée, finalisation et suivi admin restent cohérents', async () => {
  await db.doc('sys_admin_access/quote-admin-1').set({ active: true, role: 'admin' });
  const clientRequestId = crypto.randomUUID();
  const uploadToken = crypto.randomBytes(32).toString('hex');
  const payload = {
    clientRequestId,
    uploadToken,
    expectedPhotoCount: 1,
    consent: true,
    customer: {
      firstName: 'Camille',
      lastName: 'Test',
      email: `camille.${clientRequestId.slice(0, 8)}@example.test`,
      phone: '06 12 34 56 78',
      location: 'Marseille',
    },
    project: {
      furnitureType: 'commode',
      condition: 'Rayures ou marques visibles',
      dimensions: { height: '90', width: '110', depth: '45', weight: '30' },
      description: 'Une commode à restaurer.',
      notes: 'Accès simple.',
      severity: 'Modérés',
      serviceIds: ['poncage', 'defauts'],
    },
  };

  const created = await createQuoteRequestHandler(payload, publicContext);
  assert.match(created.quoteId, /^quote_[a-f0-9]{32}$/);
  assert.match(created.requestNumber, /^DEV-/);

  const jpeg = await sharp({
    create: { width: 32, height: 24, channels: 3, background: '#b08b68' },
  }).jpeg().toBuffer();
  const uploaded = await uploadQuoteRequestPhotoHandler({
    quoteId: created.quoteId,
    uploadToken,
    photoId: crypto.randomBytes(16).toString('hex'),
    fileName: 'commode.jpg',
    contentType: 'image/jpeg',
    base64: jpeg.toString('base64'),
  });
  assert.equal(uploaded.photoCount, 1);

  const finalized = await finalizeQuoteRequestHandler({ quoteId: created.quoteId, uploadToken });
  assert.equal(finalized.success, true);
  assert.equal(finalized.photoCount, 1);

  const stored = await db.doc(`quote_requests/${created.quoteId}`).get();
  assert.equal(stored.data().intakeStatus, 'submitted');
  assert.equal(stored.data().project.indicativeEstimate.maxCents, 21000);
  assert.equal(stored.data().photos.length, 1);
  const [exists] = await admin.storage().bucket().file(stored.data().photos[0].storagePath).exists();
  assert.equal(exists, true);

  const workspace = await listQuoteRequestsAdminHandler({}, adminContext);
  const listed = workspace.quotes.find((quote) => quote.quoteId === created.quoteId);
  assert.equal(listed.customer.email, payload.customer.email);
  assert.equal(listed.photos, undefined);

  const updated = await updateQuoteRequestAdminHandler({
    quoteId: created.quoteId,
    expectedVersion: listed.version,
    status: 'in_review',
    internalNotes: 'Rappeler mardi matin.',
  }, adminContext);
  assert.equal(updated.quote.status, 'in_review');
  assert.equal(updated.quote.internalNotes, 'Rappeler mardi matin.');
  assert.equal(updated.quote.version, listed.version + 1);

  const audits = await db.collection('sys_audit_quotes').where('quoteId', '==', created.quoteId).get();
  assert.equal(audits.size, 3);
});
