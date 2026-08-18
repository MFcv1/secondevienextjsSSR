#!/usr/bin/env node

import admin from 'firebase-admin';

const PROJECT = 'secondevienextjsssr';
const CLIENT_EMAIL = 'pvml7008@gmail.com';
const ORIGIN = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';
const GENERATE_TARGET = 'generatePasskeyRegistrationOptionsGen2';
const VERIFY_TARGET = 'verifyPasskeyRegistrationGen2';

const fail = (code) => { throw new Error(code); };
const project = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const appId = process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (project !== PROJECT) fail('G5_PASSKEY_PROOF_PROJECT_MISMATCH');
if (!appId || !apiKey || !serviceAccountJson) fail('G5_PASSKEY_PROOF_FIXTURE_MISSING');
if (!/^1:\d+:web:[a-f0-9]+$/i.test(appId)) fail('G5_PASSKEY_PROOF_APP_ID_INVALID');
if (!/^AIza[A-Za-z0-9_-]{20,}$/.test(apiKey)) fail('G5_PASSKEY_PROOF_API_KEY_INVALID');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CLIENT_EMAIL)) fail('G5_PASSKEY_PROOF_EMAIL_INVALID');

const serviceAccount = JSON.parse(serviceAccountJson);
if (serviceAccount.project_id !== PROJECT || !serviceAccount.client_email || !serviceAccount.private_key) {
  fail('G5_PASSKEY_PROOF_SERVICE_ACCOUNT_INVALID');
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: PROJECT });
}

const auth = admin.auth();
const db = admin.firestore();
const user = await auth.getUserByEmail(CLIENT_EMAIL);
if (!user.emailVerified || user.customClaims?.admin === true || user.customClaims?.superAdmin === true) {
  fail('G5_PASSKEY_PROOF_CLIENT_FIXTURE_INVALID');
}

const challengeRef = db.doc(`users/${user.uid}/passkey_challenges/registration`);
const before = await challengeRef.get();
const beforeData = before.exists ? before.data() : null;
const appCheckToken = await admin.appCheck().createToken(appId, { ttlMillis: 30 * 60 * 1000 });
const customToken = await auth.createCustomToken(user.uid, {
  authMethod: 'email_otp',
  authAssurance: 'aal1',
  userVerified: false,
});

const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'X-Firebase-AppCheck': appCheckToken.token },
  body: JSON.stringify({ token: customToken, returnSecureToken: true }),
});
const authPayload = await authResponse.json().catch(() => null);
if (!authResponse.ok || !authPayload?.idToken) fail('G5_PASSKEY_PROOF_TOKEN_EXCHANGE_FAILED');

const call = async (target, data, { authToken = authPayload.idToken, checkToken = appCheckToken.token } = {}) => {
  const headers = { 'content-type': 'application/json' };
  if (authToken) headers.authorization = `Bearer ${authToken}`;
  if (checkToken) headers['X-Firebase-AppCheck'] = checkToken;
  const response = await fetch(`https://europe-west1-${PROJECT}.cloudfunctions.net/${target}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  return { status: response.status, payload: await response.json().catch(() => null) };
};

let proof = null;
try {
  const missingAppCheck = await call(GENERATE_TARGET, { origin: ORIGIN }, { checkToken: '' });
  if (missingAppCheck.status !== 401) fail('G5_PASSKEY_PROOF_APP_CHECK_REFUSAL_MISSING');

  const generated = await call(GENERATE_TARGET, { origin: ORIGIN });
  const options = generated.payload?.result?.options;
  if (
    generated.status !== 200 || !options?.challenge || options?.rp?.id !== new URL(ORIGIN).hostname
    || options?.authenticatorSelection?.userVerification !== 'required'
  ) fail('G5_PASSKEY_PROOF_OPTIONS_INVALID');

  const invalidRegistration = await call(VERIFY_TARGET, {
    response: {
      id: 'invalid_registration_credential',
      rawId: 'invalid_registration_credential',
      type: 'public-key',
      response: {
        clientDataJSON: 'invalid_client_data',
        attestationObject: 'invalid_attestation',
      },
    },
  });
  if (invalidRegistration.status !== 403 || invalidRegistration.payload?.error?.status !== 'PERMISSION_DENIED') {
    fail('G5_PASSKEY_PROOF_INVALID_REGISTRATION_NOT_REJECTED');
  }

  proof = {
    project: PROJECT,
    generateTarget: GENERATE_TARGET,
    verifyTarget: VERIFY_TARGET,
    missingAppCheckHttpStatus: missingAppCheck.status,
    positiveOptionsHttpStatus: generated.status,
    userVerification: options.authenticatorSelection.userVerification,
    invalidRegistrationHttpStatus: invalidRegistration.status,
    invalidRegistrationStatus: invalidRegistration.payload.error.status,
    tokensPersisted: false,
  };
} finally {
  if (before.exists) await challengeRef.set(beforeData);
  else await challengeRef.delete();
}

process.stdout.write(`${JSON.stringify({ ...proof, fixtureRestored: true }, null, 2)}\n`);
