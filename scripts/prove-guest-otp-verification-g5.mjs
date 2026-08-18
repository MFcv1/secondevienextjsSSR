import crypto from 'node:crypto';
import readline from 'node:readline';
import admin from 'firebase-admin';

const PROJECT = 'secondevienextjsssr';
const EMAIL = 'pvml7008@gmail.com';
const REGION = 'europe-west1';
const SEND_TARGET = 'sendGuestCheckoutOtpGen2';
const VERIFY_TARGET = 'verifyGuestCheckoutOtpGen2';

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) throw new Error('SERVICE_ACCOUNT_MISSING');
const firebaseAppId = process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '';
const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
if (!firebaseAppId || !firebaseApiKey) throw new Error('FIREBASE_PUBLIC_CONFIG_MISSING');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT,
  });
}

const auth = admin.auth();
const db = admin.firestore();
const user = await auth.getUserByEmail(EMAIL);
if (user.emailVerified !== true) throw new Error('FIXTURE_EMAIL_NOT_VERIFIED');
const claims = user.customClaims || {};
const adminAccess = await db.collection('sys_admin_access').doc(user.uid).get();
if (claims.admin === true || claims.superAdmin === true || adminAccess.data()?.active === true) {
  throw new Error('FIXTURE_CLIENT_ROLE_CONTAMINATED');
}

const appCheck = await admin.appCheck().createToken(firebaseAppId, { ttlMillis: 20 * 60 * 1000 });
const customToken = await auth.createCustomToken(user.uid, {
  authMethod: 'email_otp',
  authAssurance: 'aal1',
  userVerified: false,
});
const authResponse = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseApiKey}`,
  {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Firebase-AppCheck': appCheck.token,
    },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  },
);
if (!authResponse.ok) throw new Error(`CUSTOM_TOKEN_EXCHANGE_FAILED_${authResponse.status}`);
const authPayload = await authResponse.json();
if (!authPayload?.idToken) throw new Error('ID_TOKEN_MISSING');

const callable = async (name, data) => {
  const response = await fetch(`https://${REGION}-${PROJECT}.cloudfunctions.net/${name}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${authPayload.idToken}`,
      'content-type': 'application/json',
      'X-Firebase-AppCheck': appCheck.token,
    },
    body: JSON.stringify({ data }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.result?.success !== true) {
    const status = String(payload?.error?.status || 'UNKNOWN').replace(/[^A-Z_]/g, '');
    throw new Error(`CALLABLE_${name}_FAILED_${response.status}_${status}`);
  }
  return { status: response.status, result: payload.result };
};

const emailHash = crypto.createHash('sha256').update(EMAIL).digest('hex');
const otpRef = db.collection('sys_ratelimit').doc(`guest_checkout_otp_${emailHash}`);
const before = await otpRef.get();
const send = await callable(SEND_TARGET, { email: EMAIL });

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

process.stdout.write(`${JSON.stringify({
  status: 'OTP_PROOF_READY',
  project: PROJECT,
  recipient: 'bounded client fixture',
  sendTarget: SEND_TARGET,
  sendHttpStatus: send.status,
  beforeUpdateTime: before.updateTime?.toDate().toISOString() || null,
  publicKeySpkiBase64: publicKey.toString('base64'),
  secretsDisplayed: false,
}, null, 2)}\n`);

const input = readline.createInterface({ input: process.stdin, terminal: false });
const encryptedLine = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('ENCRYPTED_OTP_TIMEOUT')), 5 * 60 * 1000);
  input.once('line', (line) => {
    clearTimeout(timeout);
    resolve(String(line || '').trim());
  });
});
input.close();

let otp = crypto.privateDecrypt({
  key: privateKey,
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: 'sha256',
}, Buffer.from(encryptedLine, 'base64')).toString('utf8');
if (!/^\d{6}$/.test(otp)) throw new Error('DECRYPTED_OTP_INVALID');

const verification = await callable(VERIFY_TARGET, { email: EMAIL, code: otp });
otp = '';
let checkoutOtpToken = verification.result.checkoutOtpToken;
if (!checkoutOtpToken || typeof checkoutOtpToken !== 'string') throw new Error('CHECKOUT_TOKEN_MISSING');
checkoutOtpToken = '';

const after = await otpRef.get();
const afterData = after.data() || {};
if (afterData.otpHash || !afterData.verifiedTokenHash || afterData.verifiedUid !== user.uid) {
  throw new Error('OTP_VERIFICATION_STATE_INVALID');
}

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  project: PROJECT,
  sendTarget: SEND_TARGET,
  verifyTarget: VERIFY_TARGET,
  verifyHttpStatus: verification.status,
  verificationSuccess: true,
  afterUpdateTime: after.updateTime?.toDate().toISOString() || null,
  attemptsAfter: afterData.attempts ?? null,
  otpHashDeleted: !afterData.otpHash,
  verifiedTokenHashPresent: Boolean(afterData.verifiedTokenHash),
  verifiedUidMatchesFixture: afterData.verifiedUid === user.uid,
  otpDisplayed: false,
  checkoutTokenDisplayed: false,
  tokenPersistedByHarness: false,
}, null, 2)}\n`);
