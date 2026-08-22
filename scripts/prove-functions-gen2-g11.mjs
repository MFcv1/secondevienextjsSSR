#!/usr/bin/env node

import crypto from 'node:crypto';
import admin from 'firebase-admin';

const PROJECT = 'secondevienextjsssr';
const REGION = 'europe-west1';
const TARGET = 'deleteSessionGen2';
const ADMIN_EMAIL = 'loa.gto15@gmail.com';
const APP_ID = process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '';
const API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';

const fail = (message) => { throw new Error(message); };
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== PROJECT) fail('G11_PROJECT_REFUSED');
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON || !APP_ID || !API_KEY) fail('G11_SANDBOX_CREDENTIALS_MISSING');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT
  });
}

const auth = admin.auth();
const db = admin.firestore();
const user = await auth.getUserByEmail(ADMIN_EMAIL);
const access = await db.collection('sys_admin_access').doc(user.uid).get();
if ((user.customClaims?.admin !== true && user.customClaims?.superAdmin !== true) || access.data()?.active !== true) {
  fail('G11_ADMIN_PRECONDITION_FAILED');
}

const appCheck = await admin.appCheck().createToken(APP_ID, { ttlMillis: 30 * 60 * 1000 });
const customToken = await auth.createCustomToken(user.uid, {
  authMethod: 'passkey',
  authAssurance: 'aal2',
  userVerified: true
});
const authResponse = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Firebase-AppCheck': appCheck.token },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  }
);
if (!authResponse.ok) fail('G11_CUSTOM_TOKEN_EXCHANGE_FAILED');
const authPayload = await authResponse.json();
if (!authPayload.idToken) fail('G11_ID_TOKEN_MISSING');

const endpoint = `https://${REGION}-${PROJECT}.cloudfunctions.net/${TARGET}`;
const operationId = `g11_dry_${crypto.randomUUID()}`;
const sessionId = `g11-dry-run-${crypto.randomUUID()}`;
const operationHash = crypto.createHash('sha256').update(operationId).digest('hex');
const auditRef = db.collection('sys_audit_security').doc(`maintenance_delete_session_${operationHash}`);
const auditBefore = await auditRef.get();
if (auditBefore.exists) fail('G11_DRY_RUN_AUDIT_COLLISION');

const body = JSON.stringify({
  data: {
    mode: 'dry_run',
    sessionId,
    operationId,
    confirmation: { action: 'DELETE_ANALYTICS_SESSION', sessionId }
  }
});
const call = async ({ idToken = authPayload.idToken, appCheckToken = appCheck.token } = {}) => {
  const headers = { 'content-type': 'application/json' };
  if (idToken) headers.authorization = `Bearer ${idToken}`;
  if (appCheckToken) headers['X-Firebase-AppCheck'] = appCheckToken;
  const response = await fetch(endpoint, { method: 'POST', headers, body });
  return {
    status: response.status,
    payload: await response.json().catch(() => null)
  };
};

const withoutAppCheck = await call({ appCheckToken: '' });
const invalidAppCheck = await call({ appCheckToken: 'invalid-g11-token' });
if (withoutAppCheck.status !== 401 || invalidAppCheck.status !== 401) {
  fail('G11_APP_CHECK_NEGATIVE_PROBE_FAILED');
}
const dryRun = await call();
if (
  dryRun.status !== 200
  || dryRun.payload?.result?.mode !== 'dry_run'
  || dryRun.payload?.result?.wouldDelete !== false
  || dryRun.payload?.result?.batch?.size !== 0
  || dryRun.payload?.result?.batch?.limit !== 1
) fail('G11_DRY_RUN_PROBE_FAILED');

const auditAfter = await auditRef.get();
if (auditAfter.exists) fail('G11_DRY_RUN_WROTE_AUDIT');

process.stdout.write(JSON.stringify({
  status: 'passed',
  project: PROJECT,
  target: TARGET,
  withoutAppCheckHttp: withoutAppCheck.status,
  invalidAppCheckHttp: invalidAppCheck.status,
  dryRunHttp: dryRun.status,
  wouldDelete: false,
  batchSize: 0,
  auditWritten: false,
  destructiveInvocationCount: 0
}, null, 2));
