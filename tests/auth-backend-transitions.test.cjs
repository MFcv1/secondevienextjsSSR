const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const Module = require('node:module');
const path = require('node:path');
const { test } = require('node:test');

const customerLoginOtpPath = path.resolve(__dirname, '../functions/src/auth/customerLoginOtp.js');
const adminManagementPath = path.resolve(__dirname, '../functions/src/auth/adminManagement.js');

class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function callableFunctionsMock() {
  const https = {
    HttpsError,
    onCall: (handler) => handler
  };
  const functions = { https };
  functions.runWith = () => functions;
  functions.region = () => functions;
  return functions;
}

async function withModuleMocks({ entryPath, mocks, run }) {
  const originalLoad = Module._load;
  delete require.cache[entryPath];
  Module._load = function loadWithMocks(request, parent, isMain) {
    if (Object.hasOwn(mocks, request)) return mocks[request];
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const loaded = require(entryPath);
    return await run(loaded);
  } finally {
    Module._load = originalLoad;
    delete require.cache[entryPath];
  }
}

test('valid customer OTP is consumed once before minting its Firebase custom token', async () => {
  const email = 'client@example.test';
  const code = '123456';
  const hmacSecret = 'fixture-only-hmac-secret';
  const otpHash = crypto
    .createHmac('sha256', hmacSecret)
    .update(`customer-login:${email}:${code}`)
    .digest('hex');
  const calls = {
    transactionUpdates: [],
    operationUpdates: [],
    profileWrites: [],
    customTokens: []
  };
  const otpRef = {
    path: 'fixture-otp-ref',
    update: async (value) => calls.operationUpdates.push(value)
  };
  const db = {
    doc: () => otpRef,
    runTransaction: async (handler) => handler({
      get: async (ref) => {
        assert.equal(ref, otpRef);
        return {
          exists: true,
          data: () => ({
            otpHash,
            expiresAtMillis: Date.now() + 60_000,
            attempts: 0
          })
        };
      },
      update: (...args) => calls.transactionUpdates.push(args)
    }),
    collection: (name) => {
      assert.equal(name, 'users');
      return {
        doc: (uid) => ({
          set: async (...args) => calls.profileWrites.push([uid, ...args])
        })
      };
    }
  };
  const firestore = () => db;
  firestore.FieldValue = {
    delete: () => 'FIELD_DELETE',
    increment: (value) => ({ increment: value }),
    serverTimestamp: () => 'SERVER_TIMESTAMP'
  };
  const adminMock = {
    firestore,
    auth: () => ({
      getUserByEmail: async () => ({ uid: 'uid-client', email, emailVerified: true }),
      createCustomToken: async (...args) => {
        calls.customTokens.push(args);
        return 'fixture-custom-token';
      }
    })
  };
  const functions = callableFunctionsMock();
  const regionalFunctions = () => functions;

  await withModuleMocks({
    entryPath: customerLoginOtpPath,
    mocks: {
      'firebase-admin': adminMock,
      '../../helpers/runtime': { functions, regionalFunctions, logFunctionPerf: () => 0 },
      '../../helpers/secrets': {
        GMAIL_EMAIL: { value: () => 'fixture@example.test' },
        GMAIL_PASSWORD: { value: () => 'fixture-smtp-password' },
        OTP_HMAC_SECRET: { value: () => hmacSecret }
      },
      '../../helpers/config': { getSiteUrl: () => 'https://example.test' },
      '../analytics/constants': {
        timestampFromNow: () => 'FIXTURE_EXPIRY',
        SYSTEM_DOC_RETENTION_DAYS: 1
      },
      nodemailer: { createTransport: () => ({ sendMail: async () => undefined }) }
    },
    run: async ({ verifyCustomerLoginOtp }) => {
      const result = await verifyCustomerLoginOtp({ email, code });
      assert.deepEqual(result, { success: true, token: 'fixture-custom-token' });
    }
  });

  assert.equal(calls.transactionUpdates.length, 1);
  assert.equal(calls.transactionUpdates[0][0], otpRef);
  assert.equal(calls.transactionUpdates[0][1].status, 'issuing');
  assert.equal(calls.transactionUpdates[0][1].operationStage, 'user');
  assert.equal(calls.transactionUpdates[0][1].otpHash, 'FIELD_DELETE');
  assert.equal(calls.operationUpdates[0].operationUid, 'uid-client');
  assert.equal(calls.operationUpdates[1].status, 'token_issued');
  assert.equal(calls.operationUpdates[1].usedAtMillis > 0, true);
  assert.deepEqual(calls.customTokens, [['uid-client', {
    signInProvider: 'email_otp',
    authMethod: 'email_otp',
    authAssurance: 'aal1',
    userVerified: false
  }]]);
  assert.equal(calls.profileWrites.length, 1);
  assert.equal(calls.profileWrites[0][0], 'uid-client');
  assert.equal(Object.hasOwn(calls.profileWrites[0][1], 'role'), false);
});

test('customer OTP resumes one failed token mint without storing a token', async () => {
  const email = 'retry@example.test';
  const code = '654321';
  const hmacSecret = 'fixture-only-hmac-secret';
  const deleted = Symbol('deleted');
  const increment = (value) => ({ __increment: value });
  const state = {
    otpHash: crypto.createHmac('sha256', hmacSecret).update(`customer-login:${email}:${code}`).digest('hex'),
    expiresAtMillis: Date.now() + 60_000,
    operationExpiresAtMillis: Date.now() + 60_000,
    attempts: 0,
    status: 'active',
    retryCount: 0,
    tokenIssueCount: 0
  };
  const applyState = (patch) => {
    for (const [key, value] of Object.entries(patch)) {
      if (value === deleted) delete state[key];
      else if (value && typeof value === 'object' && Object.hasOwn(value, '__increment')) {
        state[key] = Number(state[key] || 0) + value.__increment;
      } else state[key] = value;
    }
  };
  const otpRef = { update: async (patch) => applyState(patch) };
  let mintAttempts = 0;
  let releaseRetryMint;
  const retryMintGate = new Promise((resolve) => { releaseRetryMint = resolve; });
  const db = {
    doc: () => otpRef,
    runTransaction: async (handler) => handler({
      get: async () => ({ exists: true, data: () => ({ ...state }) }),
      update: (_ref, patch) => applyState(patch)
    }),
    collection: () => ({ doc: () => ({ set: async () => undefined }) })
  };
  const firestore = () => db;
  firestore.FieldValue = {
    delete: () => deleted,
    increment,
    serverTimestamp: () => 'SERVER_TIMESTAMP'
  };
  const adminMock = {
    firestore,
    auth: () => ({
      getUserByEmail: async () => ({ uid: 'uid-retry', email, emailVerified: true }),
      createCustomToken: async () => {
        mintAttempts += 1;
        if (mintAttempts === 1) {
          const error = new Error('transient mint failure');
          error.code = 'auth/internal-error';
          throw error;
        }
        await retryMintGate;
        return 'fixture-retried-token';
      }
    })
  };
  const functions = callableFunctionsMock();

  await withModuleMocks({
    entryPath: customerLoginOtpPath,
    mocks: {
      'firebase-admin': adminMock,
      '../../helpers/runtime': { functions, regionalFunctions: () => functions, logFunctionPerf: () => 0 },
      '../../helpers/secrets': {
        GMAIL_EMAIL: { value: () => 'fixture@example.test' },
        GMAIL_PASSWORD: { value: () => 'fixture-smtp-password' },
        OTP_HMAC_SECRET: { value: () => hmacSecret }
      },
      '../../helpers/config': { getSiteUrl: () => 'https://example.test' },
      '../analytics/constants': {
        timestampFromNow: () => 'FIXTURE_EXPIRY',
        SYSTEM_DOC_RETENTION_DAYS: 1
      },
      nodemailer: { createTransport: () => ({ sendMail: async () => undefined }) }
    },
    run: async ({ verifyCustomerLoginOtp }) => {
      await assert.rejects(
        verifyCustomerLoginOtp({ email, code }),
        { code: 'unavailable' }
      );
      assert.equal(state.status, 'failed_retryable');
      assert.equal(state.operationUid, 'uid-retry');

      const retryPromise = verifyCustomerLoginOtp({ email, code });
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(state.status, 'issuing');
      await assert.rejects(
        verifyCustomerLoginOtp({ email, code }),
        { code: 'unavailable' }
      );
      releaseRetryMint();
      const result = await retryPromise;
      assert.deepEqual(result, { success: true, token: 'fixture-retried-token' });
      await assert.rejects(
        verifyCustomerLoginOtp({ email, code }),
        { code: 'failed-precondition' }
      );
      await assert.rejects(
        verifyCustomerLoginOtp({ email, code: '111111' }),
        { code: 'failed-precondition' }
      );
    }
  });

  assert.equal(mintAttempts, 2);
  assert.equal(state.status, 'token_issued');
  assert.equal(state.retryCount, 1);
  assert.equal(state.tokenIssueCount, 1);
  assert.equal(Object.hasOwn(state, 'token'), false);
});

test('customer OTP resumes after a transient user lookup failure', async () => {
  const email = 'user-retry@example.test';
  const code = '246810';
  const hmacSecret = 'fixture-only-hmac-secret';
  const deleted = Symbol('deleted');
  const state = {
    otpHash: crypto.createHmac('sha256', hmacSecret).update(`customer-login:${email}:${code}`).digest('hex'),
    expiresAtMillis: Date.now() + 60_000,
    operationExpiresAtMillis: Date.now() + 60_000,
    attempts: 0,
    status: 'active',
    retryCount: 0,
    tokenIssueCount: 0
  };
  const applyState = (patch) => {
    for (const [key, value] of Object.entries(patch)) {
      if (value === deleted) delete state[key];
      else if (value && typeof value === 'object' && Object.hasOwn(value, '__increment')) {
        state[key] = Number(state[key] || 0) + value.__increment;
      } else state[key] = value;
    }
  };
  const otpRef = { update: async (patch) => applyState(patch) };
  const db = {
    doc: () => otpRef,
    runTransaction: async (handler) => handler({
      get: async () => ({ exists: true, data: () => ({ ...state }) }),
      update: (_ref, patch) => applyState(patch)
    }),
    collection: () => ({ doc: () => ({ set: async () => undefined }) })
  };
  const firestore = () => db;
  firestore.FieldValue = {
    delete: () => deleted,
    increment: (value) => ({ __increment: value }),
    serverTimestamp: () => 'SERVER_TIMESTAMP'
  };
  let lookupAttempts = 0;
  const adminMock = {
    firestore,
    auth: () => ({
      getUserByEmail: async () => {
        lookupAttempts += 1;
        if (lookupAttempts === 1) {
          const error = new Error('transient lookup failure');
          error.code = 'auth/internal-error';
          throw error;
        }
        return { uid: 'uid-user-retry', email, emailVerified: true };
      },
      createCustomToken: async () => 'fixture-user-retry-token'
    })
  };
  const functions = callableFunctionsMock();

  await withModuleMocks({
    entryPath: customerLoginOtpPath,
    mocks: {
      'firebase-admin': adminMock,
      '../../helpers/runtime': { functions, regionalFunctions: () => functions, logFunctionPerf: () => 0 },
      '../../helpers/secrets': {
        GMAIL_EMAIL: { value: () => 'fixture@example.test' },
        GMAIL_PASSWORD: { value: () => 'fixture-smtp-password' },
        OTP_HMAC_SECRET: { value: () => hmacSecret }
      },
      '../../helpers/config': { getSiteUrl: () => 'https://example.test' },
      '../analytics/constants': {
        timestampFromNow: () => 'FIXTURE_EXPIRY',
        SYSTEM_DOC_RETENTION_DAYS: 1
      },
      nodemailer: { createTransport: () => ({ sendMail: async () => undefined }) }
    },
    run: async ({ verifyCustomerLoginOtp }) => {
      await assert.rejects(verifyCustomerLoginOtp({ email, code }), { code: 'unavailable' });
      assert.equal(state.status, 'failed_retryable');
      assert.equal(state.operationUid, undefined);

      const result = await verifyCustomerLoginOtp({ email, code });
      assert.deepEqual(result, { success: true, token: 'fixture-user-retry-token' });
    }
  });

  assert.equal(lookupAttempts, 2);
  assert.equal(state.operationUid, 'uid-user-retry');
  assert.equal(state.status, 'token_issued');
  assert.equal(state.retryCount, 1);
});

test('admin removal clears active claims, profile role and whitelist entry', async () => {
  const calls = {
    claims: [],
    revocations: [],
    registryWrites: [],
    profileUpdates: [],
    whitelistUpdates: [],
    audits: [],
    order: []
  };
  const adminMetadataRef = {
    get: async () => ({
      exists: true,
      data: () => ({
        users: {
          'uid-admin': {
            uid: 'uid-admin',
            email: 'admin@example.test',
            role: 'admin',
            superAdmin: false
          }
        }
      })
    }),
    update: async (...args) => calls.whitelistUpdates.push(args),
    set: async (...args) => calls.whitelistUpdates.push(args)
  };
  const db = {
    doc: (docPath) => {
      if (docPath === 'sys_metadata/admin_users') return adminMetadataRef;
      return { get: async () => ({ exists: false }), set: async () => undefined };
    },
    collection: (name) => ({
      doc: (uid) => {
        if (name === 'sys_admin_access') {
          return {
            get: async () => ({ exists: true, data: () => ({ active: true, role: 'admin' }) }),
            set: async (...args) => {
              calls.order.push(args[0].active === false ? 'registry-inactive' : 'registry-update');
              calls.registryWrites.push([name, uid, ...args]);
            }
          };
        }
        return {
          update: async (...args) => calls.profileUpdates.push([name, uid, ...args]),
          set: async (...args) => {
            calls.order.push('profile-updated');
            calls.profileUpdates.push([name, uid, ...args]);
          }
        };
      }
    })
  };
  const firestore = () => db;
  firestore.FieldValue = {
    delete: () => 'FIELD_DELETE',
    serverTimestamp: () => 'SERVER_TIMESTAMP'
  };
  const adminMock = {
    firestore,
    auth: () => ({
      getUser: async () => ({
        uid: 'uid-admin',
        customClaims: { admin: true, superAdmin: false, existing: true }
      }),
      getUserByEmail: async () => ({ uid: 'uid-admin' }),
      setCustomUserClaims: async (...args) => {
        calls.order.push('claims-removed');
        calls.claims.push(args);
      },
      revokeRefreshTokens: async (...args) => {
        calls.order.push('tokens-revoked');
        calls.revocations.push(args);
      }
    })
  };
  const functions = callableFunctionsMock();
  const securityMock = {
    assertConfirmText: () => undefined,
    checkIsAdmin: () => undefined,
    checkRecentSuperAdmin: () => undefined,
    checkRecentActiveStrongSuperAdmin: async () => undefined,
    checkActiveStrongAdmin: async () => undefined,
    getSuperAdminEmail: () => '',
    normalizeEmail: (value) => String(value || '').trim().toLowerCase(),
    writeSecurityAudit: async (...args) => calls.audits.push(args)
  };

  await withModuleMocks({
    entryPath: adminManagementPath,
    mocks: {
      'firebase-functions/v1': functions,
      'firebase-admin': adminMock,
      '../../helpers/security': securityMock,
      '../../helpers/secrets': { SUPER_ADMIN_EMAIL: { value: () => '' } },
      '../analytics/constants': {
        timestampFromNow: () => 'FIXTURE_EXPIRY',
        SYSTEM_DOC_RETENTION_DAYS: 1
      }
    },
    run: async ({ removeAdminUser }) => {
      const result = await removeAdminUser(
        { uid: 'uid-admin', email: 'admin@example.test', confirmText: 'RETIRER ADMIN' },
        { auth: { uid: 'uid-owner', token: { email: 'owner@example.test' } } }
      );
      assert.deepEqual(result, { success: true });
    }
  });

  assert.deepEqual(calls.claims, [[
    'uid-admin',
    { admin: false, superAdmin: false, existing: true }
  ]]);
  assert.deepEqual(calls.revocations, [['uid-admin']]);
  assert.equal(calls.registryWrites[0][2].active, false);
  assert.equal(calls.registryWrites.at(-1)[2].revocationState, 'completed');
  assert.deepEqual(calls.profileUpdates[0].slice(0, 3), ['users', 'uid-admin', {
    role: 'user',
    superAdmin: false,
    updatedAt: 'SERVER_TIMESTAMP'
  }]);
  assert.deepEqual(calls.whitelistUpdates, [[{
    users: { 'uid-admin': 'FIELD_DELETE' }
  }, { merge: true }]]);
  assert.deepEqual(calls.audits.map((entry) => entry[0]), [
    'admin.revoke_started',
    'admin.revoke_completed'
  ]);
  assert.deepEqual(calls.order.slice(0, 4), [
    'registry-inactive',
    'claims-removed',
    'tokens-revoked',
    'profile-updated'
  ]);
});
