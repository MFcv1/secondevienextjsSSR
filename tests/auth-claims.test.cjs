const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const { test } = require('node:test');

const grantAdminPath = path.resolve(__dirname, '../functions/src/auth/grantAdmin.js');
const securityPath = path.resolve(__dirname, '../functions/helpers/security.js');

function createFirebaseFunctionsMock() {
  return {
    auth: {
      user: () => ({
        onCreate: (handler) => handler
      })
    }
  };
}

function createFirebaseAdminMock({ adminUsersExists, adminUsersData }) {
  const calls = {
    setCustomUserClaims: [],
    adminDocSet: [],
    adminDocUpdate: [],
    userDocSet: []
  };

  const adminDoc = {
    get: async () => ({
      exists: adminUsersExists,
      data: () => adminUsersData
    }),
    set: async (...args) => calls.adminDocSet.push(args),
    update: async (...args) => calls.adminDocUpdate.push(args)
  };

  const userDoc = {
    set: async (...args) => calls.userDocSet.push(args)
  };

  const firestore = () => ({
    doc: (docPath) => {
      assert.equal(docPath, 'sys_metadata/admin_users');
      return adminDoc;
    },
    collection: (collectionName) => {
      assert.equal(collectionName, 'users');
      return {
        doc: () => userDoc
      };
    }
  });
  firestore.FieldValue = {
    delete: () => ({ __fieldValue: 'delete' }),
    serverTimestamp: () => ({ __fieldValue: 'serverTimestamp' })
  };

  return {
    calls,
    admin: {
      firestore,
      auth: () => ({
        setCustomUserClaims: async (...args) => calls.setCustomUserClaims.push(args)
      })
    }
  };
}

async function runGrantAdminOnAuth({ superAdminEmail, adminUsersExists, adminUsersData, user }) {
  const previousSuperAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  process.env.SUPER_ADMIN_EMAIL = superAdminEmail || '';

  delete require.cache[grantAdminPath];
  delete require.cache[securityPath];

  const functionsMock = createFirebaseFunctionsMock();
  const { admin: adminMock, calls } = createFirebaseAdminMock({
    adminUsersExists,
    adminUsersData
  });

  const originalLoad = Module._load;
  Module._load = function loadWithFirebaseMocks(request, parent, isMain) {
    if (request === 'firebase-functions/v1') return functionsMock;
    if (request === 'firebase-admin') return adminMock;
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const { grantAdminOnAuth } = require(grantAdminPath);
    await grantAdminOnAuth(user);
    return calls;
  } finally {
    Module._load = originalLoad;
    delete require.cache[grantAdminPath];
    delete require.cache[securityPath];
    if (previousSuperAdminEmail === undefined) {
      delete process.env.SUPER_ADMIN_EMAIL;
    } else {
      process.env.SUPER_ADMIN_EMAIL = previousSuperAdminEmail;
    }
  }
}

test('unverified configured super-admin email receives no admin claims', async () => {
  const calls = await runGrantAdminOnAuth({
    superAdminEmail: 'owner@example.com',
    adminUsersExists: false,
    adminUsersData: {},
    user: {
      uid: 'uid-super-unverified',
      email: 'Owner@Example.com',
      emailVerified: false,
      customClaims: { existing: true }
    }
  });

  assert.deepEqual(calls.setCustomUserClaims, []);
  assert.deepEqual(calls.adminDocSet, []);
  assert.deepEqual(calls.adminDocUpdate, []);
  assert.deepEqual(calls.userDocSet, []);
});

test('unverified pending admin email receives no admin claims', async () => {
  const calls = await runGrantAdminOnAuth({
    superAdminEmail: 'owner@example.com',
    adminUsersExists: true,
    adminUsersData: {
      users: {
        pending_123: {
          email: 'pending@example.com',
          name: 'Pending Admin',
          addedBy: 'owner@example.com',
          status: 'pending'
        }
      }
    },
    user: {
      uid: 'uid-pending-unverified',
      email: 'Pending@Example.com',
      emailVerified: false,
      customClaims: { existing: true }
    }
  });

  assert.deepEqual(calls.setCustomUserClaims, []);
  assert.deepEqual(calls.adminDocSet, []);
  assert.deepEqual(calls.adminDocUpdate, []);
  assert.deepEqual(calls.userDocSet, []);
});
