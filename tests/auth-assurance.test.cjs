const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { test } = require('node:test');

const securityPath = path.resolve(__dirname, '../functions/helpers/security.js');

class HttpsError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

function loadSecurity(adminAccess = { exists: true, data: { active: true, role: 'admin' } }) {
  const originalLoad = Module._load;
  delete require.cache[securityPath];
  Module._load = function loadWithMocks(request, parent, isMain) {
    if (request === 'firebase-functions/v1') return { https: { HttpsError } };
    if (request === 'firebase-admin') return {
      firestore: () => ({
        collection: (name) => {
          assert.equal(name, 'sys_admin_access');
          return {
            doc: (uid) => {
              assert.equal(uid, 'uid-test');
              return {
                get: async () => ({
                  exists: adminAccess.exists,
                  data: () => adminAccess.data
                })
              };
            }
          };
        }
      })
    };
    if (request === './config') return { PRODUCT_COLLECTIONS: ['furniture'] };
    if (request === './secrets') {
      return { SUPER_ADMIN_EMAIL: { value: () => 'owner@example.test' } };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return require(securityPath);
  } finally {
    Module._load = originalLoad;
  }
}

const now = () => Math.floor(Date.now() / 1000);
const context = (token) => ({ auth: { uid: 'uid-test', token } });
const adminToken = (extra = {}) => ({
  admin: true,
  email: 'admin@example.test',
  email_verified: true,
  auth_time: now(),
  firebase: { sign_in_provider: 'custom' },
  ...extra,
});

test('OTP admin remains AAL1 and is denied strong admin access', () => {
  const { checkStrongAdmin, getAuthAssurance } = loadSecurity();
  const caller = context(adminToken({
    signInProvider: 'email_otp',
    authMethod: 'email_otp',
    authAssurance: 'aal1',
    userVerified: false,
  }));

  assert.equal(getAuthAssurance(caller).level, 'aal1');
  assert.throws(() => checkStrongAdmin(caller), (error) => (
    error.code === 'failed-precondition'
    && error.details?.reason === 'strong-auth-required'
  ));
});

test('verified passkey admin is accepted as AAL2 without a time window', () => {
  const { checkStrongAdmin, getAuthAssurance } = loadSecurity();
  const caller = context(adminToken({
    signInProvider: 'passkey',
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
  }));

  assert.deepEqual(getAuthAssurance(caller), {
    level: 'aal2', method: 'passkey', userVerified: true,
  });
  assert.equal(checkStrongAdmin(caller).assurance.level, 'aal2');
});

test('an older passkey session remains AAL2 while the Firebase session is valid', () => {
  const { checkStrongAdmin } = loadSecurity();
  const caller = context(adminToken({
    auth_time: now() - 901,
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
  }));

  assert.equal(checkStrongAdmin(caller).assurance.method, 'passkey');
});

test('Google admin is accepted as AAL2 by the documented operational policy', () => {
  const { checkStrongAdmin } = loadSecurity();
  const caller = context(adminToken({ firebase: { sign_in_provider: 'google.com' } }));
  assert.equal(checkStrongAdmin(caller).assurance.method, 'google');
});

test('Google authorizes admin mutations without a passkey step-up', async () => {
  const { checkActiveStrongAdmin } = loadSecurity();
  const caller = context(adminToken({ firebase: { sign_in_provider: 'google.com' } }));
  const result = await checkActiveStrongAdmin(caller);
  assert.equal(result.assurance.method, 'google');
  assert.equal(result.access.active, true);
});

test('strong authentication never replaces the admin role check', () => {
  const { checkStrongAdmin } = loadSecurity();
  const caller = context(adminToken({
    admin: false,
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
  }));
  assert.throws(() => checkStrongAdmin(caller), { code: 'permission-denied' });
});

test('active registry is required even when a current AAL2 token still has admin claims', async () => {
  const { checkActiveStrongAdmin } = loadSecurity({
    exists: true,
    data: { active: false, role: 'admin' }
  });
  const caller = context(adminToken({
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
  }));

  await assert.rejects(checkActiveStrongAdmin(caller), (error) => (
    error.code === 'permission-denied'
    && error.details?.reason === 'admin-access-inactive'
  ));
});

test('active registry and AAL2 token authorize an admin callable', async () => {
  const { checkActiveStrongAdmin } = loadSecurity();
  const caller = context(adminToken({
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
  }));

  const result = await checkActiveStrongAdmin(caller);
  assert.equal(result.access.active, true);
  assert.equal(result.assurance.level, 'aal2');
});

test('token minting and Firebase rules carry the same AAL contract', () => {
  const passkeys = fs.readFileSync(path.resolve(__dirname, '../functions/src/auth/passkeys.js'), 'utf8');
  const otp = fs.readFileSync(path.resolve(__dirname, '../functions/src/auth/customerLoginOtp.js'), 'utf8');
  const firestoreRules = fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8');
  const storageRules = fs.readFileSync(path.resolve(__dirname, '../storage.rules'), 'utf8');

  assert.match(passkeys, /authMethod:\s*'passkey'[\s\S]*authAssurance:\s*'aal2'[\s\S]*userVerified:\s*true/);
  assert.match(otp, /authMethod:\s*'email_otp'[\s\S]*authAssurance:\s*'aal1'[\s\S]*userVerified:\s*false/);
  assert.match(firestoreRules, /function isStrongArtisan\(\)/);
  assert.match(firestoreRules, /function hasActiveAdminAccess\(\)/);
  assert.doesNotMatch(firestoreRules, /hasRecentVerifiedPasskey|isRecentPasskeyArtisan|auth_time/);
  assert.match(firestoreRules, /documents\/sys_admin_access\/\$\(request\.auth\.uid\)/);
  assert.doesNotMatch(firestoreRules, /allow (?:read|write|create|update|delete|read, write|read, update, delete): if isArtisan\(\)/);
  assert.match(storageRules, /request\.auth\.token\.authAssurance == 'aal2'/);
  assert.match(storageRules, /request\.auth\.token\.userVerified == true/);
  assert.match(storageRules, /request\.auth\.token\.authMethod == 'passkey'/);
  assert.doesNotMatch(storageRules, /auth_time|900/);
  assert.match(storageRules, /match \/furniture\/\{allPaths=\*\*\}/);
  assert.match(storageRules, /firestore\.exists\(\/databases\/\(default\)\/documents\/sys_admin_access\/\$\(request\.auth\.uid\)\)/);
  assert.match(storageRules, /request\.auth\.token\.firebase\.sign_in_provider == 'google\.com'/);
  assert.match(storageRules, /topLevel != 'furniture'/);
});

test('admin authorization has no hidden recent-passkey gate', () => {
  const sources = [
    '../functions/helpers/security.js',
    '../functions/src/auth/adminManagement.js',
    '../functions/src/commerce/v2OrderCommands.js',
    '../functions/src/commerce/v2RefundCommands.js',
    '../functions/src/commerce/v2ReturnCommands.js',
    '../functions/src/commerce/v2CustomerReturnRequests.js',
    '../functions/src/commerce/v2AdminPaymentLinks.js',
    '../functions/src/commerce/v2DeliveryPolicyAdmin.js',
    '../functions/src/commerce/stripeConnect.js',
    '../functions/src/catalog/catalogMaintenance.js',
    '../functions/src/maintenance/tools.js',
    '../src/kit/config/firebaseLazy.js'
  ].map((relativePath) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8')).join('\n');
  assert.doesNotMatch(sources, /checkRecent|recent-strong-auth-required|verified-passkey-required|maxAgeSeconds\s*=\s*900/);
  assert.match(sources, /checkActiveStrongAdmin/);
});
