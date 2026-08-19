#!/usr/bin/env node

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import sharp from 'sharp';

const PROJECT = 'secondevienextjsssr';
const APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const PHASE = process.argv.find((value) => value.startsWith('--phase='))?.split('=')[1];
const fail = (code) => { throw new Error(code); };

if (!['callables', 'callables-resume', 'callables-after-invoice-failure', 'trigger', 'trigger-noop'].includes(PHASE)) fail('G6_PROOF_PHASE_INVALID');
if ((process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID) !== PROJECT) fail('G6_PROOF_PROJECT_MISMATCH');
if (!APP_ID || !API_KEY || !SERVICE_ACCOUNT_JSON) fail('G6_PROOF_FIXTURE_MISSING');
const serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);
if (serviceAccount.project_id !== PROJECT || !serviceAccount.client_email || !serviceAccount.private_key) {
  fail('G6_PROOF_SERVICE_ACCOUNT_INVALID');
}
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: PROJECT });

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage().bucket('secondevienextjsssr.firebasestorage.app');
const ownerAccess = await db.collection('sys_admin_access').where('active', '==', true).where('role', '==', 'owner').limit(2).get();
if (ownerAccess.size !== 1) fail('G6_PROOF_OWNER_AMBIGUOUS');
const owner = await auth.getUser(ownerAccess.docs[0].id);
if (owner.emailVerified !== true || owner.customClaims?.admin !== true || owner.customClaims?.superAdmin !== true) {
  fail('G6_PROOF_OWNER_INVALID');
}

const appCheck = await admin.appCheck().createToken(APP_ID, { ttlMillis: 30 * 60 * 1000 });
const exchange = async (user) => {
  const custom = await auth.createCustomToken(user.uid, { authMethod: 'passkey', authAssurance: 'aal2', userVerified: true });
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Firebase-AppCheck': appCheck.token },
    body: JSON.stringify({ token: custom, returnSecureToken: true })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.idToken) fail('G6_PROOF_TOKEN_EXCHANGE_FAILED');
  return payload.idToken;
};
const ownerToken = await exchange(owner);

const call = async (target, data = {}, options = {}) => {
  const headers = { 'content-type': 'application/json' };
  const idToken = Object.hasOwn(options, 'idToken') ? options.idToken : ownerToken;
  const checkToken = Object.hasOwn(options, 'appCheck') ? options.appCheck : appCheck.token;
  if (idToken) headers.authorization = `Bearer ${idToken}`;
  if (checkToken) headers['X-Firebase-AppCheck'] = checkToken;
  const response = await fetch(`https://europe-west1-${PROJECT}.cloudfunctions.net/${target}`, {
    method: 'POST', headers, body: JSON.stringify({ data })
  });
  return { status: response.status, body: await response.json().catch(() => null) };
};
const result = async (target, data, options) => {
  const response = await call(target, data, options);
  if (response.status !== 200 || response.body?.error) fail(`G6_PROOF_CALL_FAILED:${target}:${response.status}`);
  return response.body.result;
};
const snapshot = async (ref) => {
  const value = await ref.get();
  return { exists: value.exists, data: value.exists ? value.data() : null };
};
const restore = async (ref, before) => before.exists ? ref.set(before.data) : ref.delete();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (probe, predicate, code, attempts = 30) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const value = await probe();
    if (predicate(value)) return value;
    await sleep(10_000);
  }
  fail(code);
};

async function proveRuntimeRefusals() {
  const classes = [
    ['getCatalogPublicationStatusGen2', true],
    ['sendTestEmailGen2', true],
    ['getBillingGuideOperatorStatusGen2', true],
    ['getManualInvoiceWorkspaceAdminGen2', true],
    ['createQuoteRequestGen2', false],
    ['drawNewsletterRewardGen2', false]
  ];
  for (const [target, authRequired] of classes) {
    const appCheckDenied = await call(target, {}, { appCheck: '' });
    if (appCheckDenied.status !== 401) fail(`G6_PROOF_APP_CHECK_REFUSAL_MISSING:${target}`);
    if (authRequired) {
      const authDenied = await call(target, {}, { idToken: '' });
      if (authDenied.status !== 401) fail(`G6_PROOF_AUTH_REFUSAL_MISSING:${target}`);
    }
  }
  for (const target of ['getQuoteRequestAdminGen2', 'listMyNewsletterRewardsGen2']) {
    const denied = await call(target, {}, { idToken: '' });
    if (denied.status !== 401) fail(`G6_PROOF_AUTH_REFUSAL_MISSING:${target}`);
  }
}

async function proveCatalog() {
  const initial = await result('getCatalogPublicationStatusGen2', {});
  if (!initial.current?.healthy || !initial.previous?.healthy || initial.mode !== 'active') fail('G6_PROOF_CATALOG_FIXTURE_INVALID');
  const fromRevision = Number(initial.current.revision);
  const rollbackRevision = Number(initial.previous.revision);
  if (!fromRevision || !rollbackRevision || fromRevision === rollbackRevision) fail('G6_PROOF_CATALOG_POINTERS_INVALID');
  await result('rollbackCatalogSnapshotGen2', {
    target: 'previous', confirmText: `ROLLBACK CATALOGUE ${fromRevision} VERS ${rollbackRevision}`
  });
  await waitFor(
    () => result('getCatalogPublicationStatusGen2', {}),
    (value) => Number(value.current?.revision) === rollbackRevision,
    'G6_PROOF_CATALOG_ROLLBACK_TIMEOUT'
  );
  const rebuild = await result('rebuildCatalogSnapshotGen2', { confirmText: 'RECONSTRUIRE CATALOGUE' });
  const restored = await waitFor(
    () => result('getCatalogPublicationStatusGen2', {}),
    (value) => value.mode === 'active' && value.buildState === 'healthy'
      && Number(value.current?.revision) === Number(rebuild.revision) && value.current?.healthy === true,
    'G6_PROOF_CATALOG_REBUILD_TIMEOUT',
    42
  );
  return { rollbackRevision, restoredRevision: Number(restored.current.revision) };
}

async function proveCatalogReadOnly() {
  const [status, control] = await Promise.all([
    result('getCatalogPublicationStatusGen2', {}),
    db.doc('sys_catalog_publication/secondevie').get()
  ]);
  if (!status.current?.healthy || status.mode !== 'active') fail('G6_PROOF_CATALOG_READ_ONLY_INVALID');
  const response = await fetch('https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/api/catalog/version');
  const served = await response.json().catch(() => null);
  if (!response.ok
    || Number(served?.revision) !== Number(status.current.revision)
    || String(served?.aggregateSha256 || '') !== String(control.data()?.currentAggregateSha256 || '')) {
    fail('G6_PROOF_CATALOG_READ_ONLY_STALE');
  }
  return { revision: Number(served.revision), aggregateSha256: served.aggregateSha256 };
}

async function proveBilling() {
  const [status, operator] = await Promise.all([
    result('getBillingGuideStatusGen2', {}),
    result('getBillingGuideOperatorStatusGen2', {})
  ]);
  if (status.mode === 'disabled') {
    if (status.mode !== 'disabled' || status.required !== false || operator.mode !== 'disabled' || operator.journey !== null) {
      fail('G6_PROOF_BILLING_DISABLED_READ_INVALID');
    }
    for (const [target, data] of [
      ['saveBillingGuideProgressGen2', { stepId: 'google_billing', confirmations: { billingCreated: true } }],
      ['completeBillingGuideAdminGen2', { targetUid: owner.uid, confirmText: 'VALIDER LA FACTURATION' }],
      ['resetBillingGuideTestGen2', { targetUid: owner.uid, confirmText: 'REINITIALISER LE TEST' }]
    ]) {
      const denied = await call(target, data);
      if (![400, 403].includes(denied.status)) fail(`G6_PROOF_BILLING_DISABLED_MUTATION_ALLOWED:${target}`);
    }
    return;
  }
  if (status.mode !== 'test' || process.env.BILLING_GUIDE_MODE !== 'test' || !process.env.BILLING_GUIDE_TEST_UID) fail('G6_PROOF_BILLING_MODE_INVALID');
  const targetUid = process.env.BILLING_GUIDE_TEST_UID;
  const targetUser = await auth.getUser(targetUid);
  const targetAccess = await db.doc(`sys_admin_access/${targetUid}`).get();
  if (!targetAccess.exists || targetAccess.data()?.active !== true || targetUser.emailVerified !== true) fail('G6_PROOF_BILLING_TARGET_INVALID');
  const targetToken = await exchange(targetUser);
  const ref = db.doc(`sys_billing_onboarding/${targetUid}`);
  const before = await snapshot(ref);
  try {
    await ref.delete();
    await result('getBillingGuideStatusGen2', {}, { idToken: targetToken });
    const steps = [
      ['google_billing', { billingCreated: true }],
      ['billing_id', { billingCreated: true, billingIdConfirmed: true }],
      ['technical_access', { billingCreated: true, billingIdConfirmed: true }],
      ['waiting_for_operator', { billingCreated: true, billingIdConfirmed: true, technicalAccessGranted: true }]
    ];
    for (const [stepId, confirmations] of steps) {
      await result('saveBillingGuideProgressGen2', {
        stepId, confirmations, billingAccountId: 'ABCDEF-GHIJKL-MNOPQR'
      }, { idToken: targetToken });
    }
    const operator = await result('getBillingGuideOperatorStatusGen2', {});
    if (operator.journey?.uid !== targetUid || operator.journey?.status !== 'waiting_for_operator') fail('G6_PROOF_BILLING_OPERATOR_STATE_INVALID');
    await result('completeBillingGuideAdminGen2', { targetUid, confirmText: 'VALIDER LA FACTURATION' });
    await result('resetBillingGuideTestGen2', { targetUid, confirmText: 'REINITIALISER LE TEST' });
  } finally {
    await restore(ref, before);
  }
}

async function proveManualInvoice() {
  const profileRef = db.doc('admin_business_profiles/invoicing');
  const profileBefore = await snapshot(profileRef);
  const invoiceId = `g6_${crypto.randomUUID().replaceAll('-', '')}`;
  const invoiceRef = db.doc(`admin_invoices/${invoiceId}`);
  const year = new Date().getUTCFullYear().toString();
  const sequenceRef = db.doc(`admin_invoice_sequences/${year}`);
  const sequenceBefore = await snapshot(sequenceRef);
  let storagePath = null;
  try {
    await result('getManualInvoiceWorkspaceAdminGen2', {});
    const invoice = {
      seller: { businessName: 'Seconde Vie', legalName: 'Seconde Vie Recette EI', siren: '123456789', siret: '12345678901234', address1: '10 rue de la Recette', postalCode: '13001', city: 'Marseille', country: 'France', email: owner.email, vatMode: 'franchise' },
      customer: { customerType: 'individual', firstName: 'Recette', lastName: 'Gen2', address1: '2 rue du Test', postalCode: '13001', city: 'Marseille', country: 'France', email: owner.email },
      lines: [{ lineId: 'g6_line_1', name: 'Meuble de recette G6', description: 'Fixture reversible', quantity: 1, unitPriceCents: 100 }],
      issueDate: `${year}-08-19`, saleDate: `${year}-08-19`, dueDate: `${year}-08-19`, paymentTerms: 'Paiement comptant'
    };
    const saved = await result('saveManualInvoiceDraftAdminGen2', { invoiceId, invoice });
    if (saved.invoice?.invoiceId !== invoiceId) fail('G6_PROOF_INVOICE_SAVE_INVALID');
    const pdf = await result('prepareManualInvoicePdfAdminGen2', { invoiceId });
    if (!pdf.document?.sha256 || pdf.document?.size <= 0) fail('G6_PROOF_INVOICE_PDF_INVALID');
    const sent = await result('sendManualInvoiceAdminGen2', { invoiceId, sendRequestId: `g6-send-${crypto.randomUUID()}`, recipient: owner.email });
    if (sent.invoice?.emailStatus !== 'sent') fail('G6_PROOF_INVOICE_SEND_INVALID');
    const artifacts = await invoiceRef.collection('artifacts').limit(2).get();
    if (artifacts.size !== 1) fail('G6_PROOF_INVOICE_ARTIFACT_INVALID');
    storagePath = artifacts.docs[0].data().storagePath;
  } finally {
    if (storagePath) await storage.file(storagePath).delete({ ignoreNotFound: true });
    const deliveries = await invoiceRef.collection('deliveries').get();
    const artifacts = await invoiceRef.collection('artifacts').get();
    await Promise.all([...deliveries.docs, ...artifacts.docs].map((doc) => doc.ref.delete()));
    await invoiceRef.delete();
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(sequenceRef);
      if (current.exists && current.data()?.lastInvoiceId === invoiceId) {
        if (sequenceBefore.exists) transaction.set(sequenceRef, sequenceBefore.data);
        else transaction.delete(sequenceRef);
      }
    });
    await restore(profileRef, profileBefore);
  }
}

async function proveManualEmail() {
  await result('sendTestEmailGen2', {});
  const orderId = `g6_refund_${crypto.randomUUID().replaceAll('-', '')}`;
  const orderRef = db.doc(`orders/${orderId}`);
  try {
    await orderRef.create({
      schemaVersion: 1,
      status: 'refund_failed',
      userEmail: owner.email,
      shipping: { email: owner.email, fullName: 'Recette Gen2' },
      items: [{ name: 'Meuble fixture G6', quantity: 1 }],
      refundAmount: 100,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const sent = await result('sendRefundStatusEmailAdminGen2', { orderId });
    if (sent.status !== 'refund_failed') fail('G6_PROOF_REFUND_EMAIL_INVALID');
  } finally {
    await orderRef.delete();
  }
}

async function proveNewsletter() {
  const playId = crypto.randomUUID();
  const playHash = crypto.createHash('sha256').update(playId).digest('hex').slice(0, 40);
  const playRef = db.doc(`newsletter_reward_plays/play_${playHash}`);
  const rewardRef = db.doc(`newsletter_rewards/reward_${playHash}`);
  const email = owner.email.toLowerCase();
  const emailHash = crypto.createHash('sha256').update(email).digest('hex');
  const subscriberRef = db.doc(`newsletter_subscribers/subscriber_${emailHash.slice(0, 40)}`);
  const subscriberBefore = await snapshot(subscriberRef);
  let promotionRef = null;
  try {
    const draw = await result('drawNewsletterRewardGen2', { playId, cardIndex: 0 });
    if (![5, 10, 15].includes(draw.percentage)) fail('G6_PROOF_NEWSLETTER_DRAW_INVALID');
    const claim = await result('claimNewsletterRewardGen2', { playId, email, consent: true });
    if (!claim.reward?.code || claim.reward?.emailStatus !== 'sent') fail('G6_PROOF_NEWSLETTER_CLAIM_INVALID');
    promotionRef = db.doc(`commerce_promotion_codes/${crypto.createHash('sha256').update(claim.reward.code).digest('hex')}`);
    const listed = await result('listMyNewsletterRewardsGen2', {});
    if (!listed.rewards?.some((reward) => reward.rewardId === rewardRef.id)) fail('G6_PROOF_NEWSLETTER_LIST_INVALID');
  } finally {
    await Promise.all([playRef.delete(), rewardRef.delete(), promotionRef?.delete()].filter(Boolean));
    await restore(subscriberRef, subscriberBefore);
  }
}

async function proveQuoteTrigger() {
  const requestId = crypto.randomUUID();
  const uploadToken = crypto.randomBytes(32).toString('hex');
  let quoteId = null;
  let storagePath = null;
  try {
    const created = await result('createQuoteRequestGen2', {
      clientRequestId: requestId,
      uploadToken,
      expectedPhotoCount: 1,
      consent: true,
      customer: { firstName: 'Recette', lastName: 'Gen2', email: owner.email, phone: '0612345678', location: 'Marseille' },
      project: { furnitureType: 'commode', condition: 'Rayures ou marques visibles', dimensions: { height: '90', width: '100', depth: '45', weight: '30' }, description: 'Fixture reversible G6', notes: '', severity: 'Modérés', serviceIds: ['poncage'] }
    });
    quoteId = created.quoteId;
    const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#7a6b5c' } }).jpeg().toBuffer();
    const photoId = crypto.randomBytes(16).toString('hex');
    await result('uploadQuoteRequestPhotoGen2', { quoteId, uploadToken, photoId, fileName: 'g6.jpg', contentType: 'image/jpeg', base64: image.toString('base64') });
    storagePath = `quote-requests/v1/${quoteId}/${photoId}.webp`;
    const listed = await result('listQuoteRequestsAdminGen2', {});
    if (!listed.quotes?.some((quote) => quote.quoteId === quoteId)) fail('G6_PROOF_QUOTE_LIST_INVALID');
    const detail = await result('getQuoteRequestAdminGen2', { quoteId });
    await result('updateQuoteRequestAdminGen2', { quoteId, expectedVersion: detail.quote.version, status: 'qualifying', internalNotes: 'Fixture G6' });
    await result('finalizeQuoteRequestGen2', { quoteId, uploadToken });
    const sent = await waitFor(
      async () => (await db.doc(`quote_requests/${quoteId}`).get()).data()?.confirmationEmail,
      (delivery) => delivery?.status === 'sent',
      'G6_PROOF_QUOTE_EMAIL_TIMEOUT', 18
    );
    if (!sent.providerMessageId || !sent.eventId) fail('G6_PROOF_QUOTE_EMAIL_PROOF_INVALID');
  } finally {
    if (storagePath) await storage.file(storagePath).delete({ ignoreNotFound: true });
    if (quoteId) {
      const audits = await db.collection('sys_audit_quotes').where('quoteId', '==', quoteId).get();
      await Promise.all(audits.docs.map((doc) => doc.ref.delete()));
      await db.doc(`quote_requests/${quoteId}`).delete();
    }
  }
}

async function proveQuoteTriggerNoop() {
  const quoteId = `quote_g6_noop_${crypto.randomUUID().replaceAll('-', '')}`;
  const ref = db.doc(`quote_requests/${quoteId}`);
  const marker = `g6-noop-${crypto.randomUUID()}`;
  try {
    await ref.create({
      schemaVersion: 1,
      intakeStatus: 'submitted',
      status: 'new',
      confirmationEmail: { status: 'sent', eventId: marker, provider: 'g6-noop', providerMessageId: marker },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await ref.update({ updatedAt: admin.firestore.FieldValue.serverTimestamp(), g6NoopProbe: true });
    await sleep(35_000);
    const current = (await ref.get()).data()?.confirmationEmail;
    if (current?.status !== 'sent' || current?.eventId !== marker || current?.providerMessageId !== marker) {
      fail('G6_PROOF_QUOTE_NOOP_CLAIM_CHANGED');
    }
  } finally {
    await ref.delete();
  }
}

if (PHASE === 'callables') {
  await proveRuntimeRefusals();
  const catalog = await proveCatalog();
  await proveBilling();
  await proveManualInvoice();
  await proveManualEmail();
  await proveNewsletter();
  process.stdout.write(`${JSON.stringify({ project: PROJECT, phase: PHASE, runtimeClasses: 6, catalog, fixturesRestored: true, realEmailUpperBound: 4, tokensPersisted: false }, null, 2)}\n`);
} else if (PHASE === 'callables-resume') {
  const catalog = await proveCatalogReadOnly();
  await proveBilling();
  await proveManualInvoice();
  await proveManualEmail();
  await proveNewsletter();
  process.stdout.write(`${JSON.stringify({ project: PROJECT, phase: PHASE, runtimeRefusalsReused: true, catalogDrillReused: true, catalog, fixturesRestored: true, realEmailCount: 4, tokensPersisted: false }, null, 2)}\n`);
} else if (PHASE === 'callables-after-invoice-failure') {
  await proveManualInvoice();
  await proveManualEmail();
  await proveNewsletter();
  process.stdout.write(`${JSON.stringify({ project: PROJECT, phase: PHASE, priorProofsReused: true, fixturesRestored: true, realEmailCount: 4, tokensPersisted: false }, null, 2)}\n`);
} else if (PHASE === 'trigger') {
  await proveQuoteTrigger();
  process.stdout.write(`${JSON.stringify({ project: PROJECT, phase: PHASE, quoteFixtureRestored: true, coexistenceEmailCount: 1, tokensPersisted: false }, null, 2)}\n`);
} else {
  await proveQuoteTriggerNoop();
  process.stdout.write(`${JSON.stringify({ project: PROJECT, phase: PHASE, quoteFixtureRestored: true, coexistenceNoop: true, additionalEmailCount: 0, tokensPersisted: false }, null, 2)}\n`);
}
