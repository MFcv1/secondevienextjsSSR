#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import admin from 'firebase-admin';

const PROJECT = 'secondevienextjsssr';
const CLIENT_EMAIL = 'pvml7008@gmail.com';
const APP_ID = process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const TARGETS = Object.freeze({
  sync: 'syncSuperAdminClaimGen2',
  add: 'addAdminUserGen2',
  remove: 'removeAdminUserGen2',
});

const fail = (code) => { throw new Error(code); };
const project = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
if (project !== PROJECT) fail('G5_AUTH_ADMIN_PROOF_PROJECT_MISMATCH');
if (!APP_ID || !API_KEY || !SERVICE_ACCOUNT_JSON) fail('G5_AUTH_ADMIN_PROOF_FIXTURE_MISSING');
if (!/^1:\d+:web:[a-f0-9]+$/i.test(APP_ID)) fail('G5_AUTH_ADMIN_PROOF_APP_ID_INVALID');
if (!/^AIza[A-Za-z0-9_-]{20,}$/.test(API_KEY)) fail('G5_AUTH_ADMIN_PROOF_API_KEY_INVALID');

const serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);
if (serviceAccount.project_id !== PROJECT || !serviceAccount.client_email || !serviceAccount.private_key) {
  fail('G5_AUTH_ADMIN_PROOF_SERVICE_ACCOUNT_INVALID');
}
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: PROJECT });
}

const operatorTokenResult = spawnSync('gcloud', ['auth', 'print-access-token'], {
  encoding: null,
  stdio: ['ignore', 'pipe', 'pipe'],
});
const framedOperatorToken = operatorTokenResult.stdout;
if (
  operatorTokenResult.status !== 0 || !Buffer.isBuffer(framedOperatorToken)
  || framedOperatorToken.length < 2 || framedOperatorToken.at(-1) !== 0x0a
) fail('G5_AUTH_ADMIN_PROOF_OPERATOR_TOKEN_UNREADABLE');
const operatorTokenBytes = framedOperatorToken.subarray(0, framedOperatorToken.length - 1);
if (operatorTokenBytes.includes(0x0a) || operatorTokenBytes.includes(0x0d)) {
  fail('G5_AUTH_ADMIN_PROOF_OPERATOR_TOKEN_FRAMING_INVALID');
}
const operatorToken = operatorTokenBytes.toString('ascii');
if (!Buffer.from(operatorToken, 'ascii').equals(operatorTokenBytes)) {
  fail('G5_AUTH_ADMIN_PROOF_OPERATOR_TOKEN_BYTES_INVALID');
}
const secretResponse = await fetch(
  `https://secretmanager.googleapis.com/v1/projects/${PROJECT}/secrets/SUPER_ADMIN_EMAIL/versions/3:access`,
  { headers: { authorization: `Bearer ${operatorToken}` } },
);
const secretPayload = await secretResponse.json().catch(() => null);
if (!secretResponse.ok || typeof secretPayload?.payload?.data !== 'string') {
  fail('G5_AUTH_ADMIN_PROOF_OWNER_SECRET_UNREADABLE');
}
const ownerSecretBytes = Buffer.from(secretPayload.payload.data, 'base64');
if (
  ownerSecretBytes.length === 0
  || !Buffer.from(ownerSecretBytes.toString('utf8'), 'utf8').equals(ownerSecretBytes)
  || ownerSecretBytes.includes(0x00)
) fail('G5_AUTH_ADMIN_PROOF_OWNER_SECRET_BYTES_INVALID');

const auth = admin.auth();
const db = admin.firestore();
const ownerAccessQuery = await db.collection('sys_admin_access')
  .where('active', '==', true)
  .where('role', '==', 'owner')
  .limit(2)
  .get();
if (ownerAccessQuery.size !== 1) fail('G5_AUTH_ADMIN_PROOF_OWNER_REGISTRY_AMBIGUOUS');
const owner = await auth.getUser(ownerAccessQuery.docs[0].id);
const client = await auth.getUserByEmail(CLIENT_EMAIL);
if (
  owner.emailVerified !== true || owner.customClaims?.admin !== true || owner.customClaims?.superAdmin !== true
  || client.emailVerified !== true || client.customClaims?.admin === true || client.customClaims?.superAdmin === true
) fail('G5_AUTH_ADMIN_PROOF_ROLE_FIXTURES_INVALID');

const reconcileSinceIndex = process.argv.indexOf('--reconcile-since');
if (reconcileSinceIndex >= 0) {
  const reconcileSince = process.argv[reconcileSinceIndex + 1];
  if (!/^2026-08-19T\d{2}:\d{2}:\d{2}Z$/.test(reconcileSince || '')) {
    fail('G5_AUTH_ADMIN_PROOF_RECONCILE_WINDOW_INVALID');
  }
  const auditSnapshot = await db.collection('sys_audit_security')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(reconcileSince)))
    .orderBy('createdAt', 'asc')
    .limit(30)
    .get();
  const audits = auditSnapshot.docs.map((document) => document.data());
  const syncAudit = audits.find((entry) => entry.eventType === 'admin.sync_super_admin_claim');
  const addAudit = audits.find((entry) => entry.eventType === 'admin.add_admin_user');
  const revokeAudit = audits.find((entry) => entry.eventType === 'admin.revoke_completed');
  const temporaryUid = addAudit?.payload?.targetUid;
  if (
    !syncAudit || !temporaryUid || temporaryUid === owner.uid
    || revokeAudit?.payload?.targetUid !== temporaryUid
    || revokeAudit?.payload?.progress?.refreshTokensRevoked !== true
  ) fail('G5_AUTH_ADMIN_PROOF_RECONCILE_AUDIT_INCOMPLETE');
  const [access, profile, legacy, temporaryAuth] = await Promise.all([
    db.doc(`sys_admin_access/${temporaryUid}`).get(),
    db.doc(`users/${temporaryUid}`).get(),
    db.doc('sys_metadata/admin_users').get(),
    auth.getUser(temporaryUid).then(() => true).catch((error) => {
      if (error?.code === 'auth/user-not-found') return false;
      throw error;
    }),
  ]);
  if (access.exists || profile.exists || legacy.data()?.users?.[temporaryUid] || temporaryAuth) {
    fail('G5_AUTH_ADMIN_PROOF_RECONCILE_FIXTURE_REMAINS');
  }
  process.stdout.write(`${JSON.stringify({
    project: PROJECT,
    targets: Object.values(TARGETS),
    reconciledOnly: true,
    syncAuditPresent: true,
    addAuditPresent: true,
    revokeAuditPresent: true,
    refreshTokensRevoked: true,
    fixturesRestored: true,
    tokensPersisted: false,
  }, null, 2)}\n`);
  process.exit(0);
}

const ownerAccessRef = db.doc(`sys_admin_access/${owner.uid}`);
const ownerProfileRef = db.doc(`users/${owner.uid}`);
const legacyRef = db.doc('sys_metadata/admin_users');
const [ownerAccessBefore, ownerProfileBefore, legacyBefore] = await Promise.all([
  ownerAccessRef.get(),
  ownerProfileRef.get(),
  legacyRef.get(),
]);
if (!ownerAccessBefore.exists || ownerAccessBefore.data()?.active !== true || ownerAccessBefore.data()?.role !== 'owner') {
  fail('G5_AUTH_ADMIN_PROOF_OWNER_REGISTRY_INVALID');
}

const legacyUsers = legacyBefore.data()?.users || {};
for (const entry of Object.values(legacyUsers)) {
  if (!entry?.uid || entry.uid.startsWith('pending_') || entry.status !== 'active') continue;
  const access = await db.doc(`sys_admin_access/${entry.uid}`).get();
  if (!access.exists) fail('G5_AUTH_ADMIN_PROOF_SYNC_WOULD_MIGRATE_LEGACY_ADMIN');
}

const appCheckToken = await admin.appCheck().createToken(APP_ID, { ttlMillis: 30 * 60 * 1000 });
const exchangeToken = async (user, claims) => {
  const customToken = await auth.createCustomToken(user.uid, claims);
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Firebase-AppCheck': appCheckToken.token },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.idToken) fail('G5_AUTH_ADMIN_PROOF_TOKEN_EXCHANGE_FAILED');
  return payload.idToken;
};

const strongClaims = Object.freeze({ authMethod: 'passkey', authAssurance: 'aal2', userVerified: true });
const [ownerIdToken, clientIdToken] = await Promise.all([
  exchangeToken(owner, strongClaims),
  exchangeToken(client, strongClaims),
]);
const ownerDecoded = await auth.verifyIdToken(ownerIdToken, true);
if (
  ownerDecoded.email !== owner.email || ownerDecoded.email_verified !== true
  || ownerDecoded.admin !== true || ownerDecoded.superAdmin !== true
  || ownerDecoded.authAssurance !== 'aal2' || ownerDecoded.userVerified !== true
) fail('G5_AUTH_ADMIN_PROOF_OWNER_TOKEN_INVALID');

const call = async (target, data, { idToken = ownerIdToken, checkToken = appCheckToken.token } = {}) => {
  const headers = { 'content-type': 'application/json' };
  if (idToken) headers.authorization = `Bearer ${idToken}`;
  if (checkToken) headers['X-Firebase-AppCheck'] = checkToken;
  const response = await fetch(`https://europe-west1-${PROJECT}.cloudfunctions.net/${target}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  return { status: response.status, payload: await response.json().catch(() => null) };
};

const snapshotData = (snapshot) => snapshot.exists ? snapshot.data() : null;
const restoreSnapshot = async (ref, snapshot) => {
  if (snapshot.exists) await ref.set(snapshot.data());
  else await ref.delete();
};

const fixtureTag = Date.now();
const temporaryEmail = `codex.gen2.admin.${fixtureTag}@example.com`;
let temporaryUser = null;
let temporaryAccessRef = null;
let temporaryProfileRef = null;
let proof = null;

try {
  const missingAppCheck = await call(TARGETS.sync, {}, { checkToken: '' });
  if (missingAppCheck.status !== 401) fail('G5_AUTH_ADMIN_PROOF_APP_CHECK_REFUSAL_MISSING');

  const deniedNonOwner = await call(TARGETS.add, {
    email: temporaryEmail,
    name: 'Gen2 denied fixture',
    confirmText: 'AJOUTER ADMIN',
  }, { idToken: clientIdToken });
  if (deniedNonOwner.status !== 403 || deniedNonOwner.payload?.error?.status !== 'PERMISSION_DENIED') {
    fail('G5_AUTH_ADMIN_PROOF_NON_OWNER_REFUSAL_MISSING');
  }

  const sync = await call(TARGETS.sync, {});
  if (sync.status !== 200 || sync.payload?.result?.success !== true) fail('G5_AUTH_ADMIN_PROOF_SYNC_FAILED');

  temporaryUser = await auth.createUser({
    email: temporaryEmail,
    emailVerified: true,
    displayName: 'Gen2 admin fixture',
  });
  temporaryAccessRef = db.doc(`sys_admin_access/${temporaryUser.uid}`);
  temporaryProfileRef = db.doc(`users/${temporaryUser.uid}`);
  const tokensValidBefore = (await auth.getUser(temporaryUser.uid)).tokensValidAfterTime;

  const add = await call(TARGETS.add, {
    email: temporaryEmail,
    name: 'Gen2 admin fixture',
    confirmText: 'AJOUTER ADMIN',
  });
  if (add.status !== 200 || add.payload?.result?.success !== true || add.payload?.result?.uid !== temporaryUser.uid) {
    fail('G5_AUTH_ADMIN_PROOF_ADD_FAILED');
  }

  const [addedUser, addedAccess, addedProfile, addedLegacy] = await Promise.all([
    auth.getUser(temporaryUser.uid),
    temporaryAccessRef.get(),
    temporaryProfileRef.get(),
    legacyRef.get(),
  ]);
  if (
    addedUser.customClaims?.admin !== true || addedUser.customClaims?.superAdmin !== false
    || addedAccess.data()?.active !== true || addedAccess.data()?.role !== 'admin'
    || addedProfile.data()?.role !== 'admin' || addedProfile.data()?.superAdmin !== false
    || addedLegacy.data()?.users?.[temporaryUser.uid]?.status !== 'active'
  ) fail('G5_AUTH_ADMIN_PROOF_ADD_STATE_INVALID');

  const remove = await call(TARGETS.remove, {
    uid: temporaryUser.uid,
    email: temporaryEmail,
    confirmText: 'RETIRER ADMIN',
  });
  if (remove.status !== 200 || remove.payload?.result?.success !== true) fail('G5_AUTH_ADMIN_PROOF_REMOVE_FAILED');

  const [removedUser, removedAccess, removedProfile, removedLegacy] = await Promise.all([
    auth.getUser(temporaryUser.uid),
    temporaryAccessRef.get(),
    temporaryProfileRef.get(),
    legacyRef.get(),
  ]);
  if (
    removedUser.customClaims?.admin !== false || removedUser.customClaims?.superAdmin !== false
    || removedAccess.data()?.active !== false || removedAccess.data()?.revocationState !== 'completed'
    || removedProfile.data()?.role !== 'user' || removedProfile.data()?.superAdmin !== false
    || removedLegacy.data()?.users?.[temporaryUser.uid]
    || !removedUser.tokensValidAfterTime || removedUser.tokensValidAfterTime === tokensValidBefore
  ) fail('G5_AUTH_ADMIN_PROOF_REMOVE_STATE_INVALID');

  proof = {
    project: PROJECT,
    targets: Object.values(TARGETS),
    missingAppCheckHttpStatus: missingAppCheck.status,
    nonOwnerHttpStatus: deniedNonOwner.status,
    syncHttpStatus: sync.status,
    addHttpStatus: add.status,
    addClaimsAndRegistryVerified: true,
    removeHttpStatus: remove.status,
    registryInactive: true,
    claimsRemoved: true,
    refreshTokensRevoked: true,
    profileDemoted: true,
    whitelistArchived: true,
    ownerSecretBytesVerified: true,
    tokensPersisted: false,
  };
} finally {
  await Promise.all([
    restoreSnapshot(ownerAccessRef, ownerAccessBefore),
    restoreSnapshot(ownerProfileRef, ownerProfileBefore),
    restoreSnapshot(legacyRef, legacyBefore),
  ]);
  await auth.setCustomUserClaims(owner.uid, owner.customClaims || null);
  if (temporaryAccessRef) await temporaryAccessRef.delete();
  if (temporaryProfileRef) await temporaryProfileRef.delete();
  if (temporaryUser) await auth.deleteUser(temporaryUser.uid).catch(() => undefined);
}

const [ownerAccessAfter, ownerProfileAfter, legacyAfter, ownerAfter] = await Promise.all([
  ownerAccessRef.get(),
  ownerProfileRef.get(),
  legacyRef.get(),
  auth.getUser(owner.uid),
]);
assert.deepEqual(snapshotData(ownerAccessAfter), snapshotData(ownerAccessBefore));
assert.deepEqual(snapshotData(ownerProfileAfter), snapshotData(ownerProfileBefore));
assert.deepEqual(snapshotData(legacyAfter), snapshotData(legacyBefore));
assert.deepEqual(ownerAfter.customClaims || null, owner.customClaims || null);

process.stdout.write(`${JSON.stringify({ ...proof, fixturesRestored: true }, null, 2)}\n`);
