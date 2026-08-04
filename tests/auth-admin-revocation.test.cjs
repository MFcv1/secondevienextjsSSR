const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const { test } = require('node:test');

const adminManagementPath = path.resolve(__dirname, '../functions/src/auth/adminManagement.js');

class HttpsError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

function functionsMock() {
  const https = { HttpsError, onCall: (handler) => handler };
  const functions = { https };
  functions.runWith = () => functions;
  functions.region = () => functions;
  return functions;
}

async function loadRemovalHarness({
  role = 'admin',
  failFirstRevoke = false,
  registryExists = true,
  registryActive = true
} = {}) {
  const state = {
    registryExists,
    registry: { uid: 'uid-target', active: registryActive, role, version: 1 },
    whitelist: {
      'uid-target': {
        uid: 'uid-target',
        email: 'target@example.test',
        role,
        status: 'active',
        superAdmin: role === 'owner'
      }
    },
    profile: { role },
    claims: { admin: true, superAdmin: role === 'owner', existing: true },
    order: [],
    audits: [],
    revokeAttempts: 0
  };
  const deleted = Symbol('delete');
  const apply = (target, patch) => {
    for (const [key, value] of Object.entries(patch)) {
      if (value === deleted) delete target[key];
      else target[key] = value;
    }
  };

  const metadataRef = {
    get: async () => ({ exists: true, data: () => ({ users: { ...state.whitelist } }) }),
    set: async (patch) => {
      state.order.push('whitelist-archived');
      apply(state.whitelist, patch.users || {});
    },
    update: async () => undefined
  };
  const registryRef = {
    get: async () => ({ exists: state.registryExists, data: () => ({ ...state.registry }) }),
    set: async (patch) => {
      state.registryExists = true;
      if (patch.active === false) state.order.push('registry-inactive');
      if (patch.revocationState === 'completed') state.order.push('registry-completed');
      apply(state.registry, patch);
    }
  };
  const profileRef = {
    set: async (patch) => {
      state.order.push('profile-updated');
      apply(state.profile, patch);
    },
    update: async (patch) => apply(state.profile, patch)
  };
  const db = {
    doc: (docPath) => {
      if (docPath === 'sys_metadata/admin_users') return metadataRef;
      throw new Error(`Unexpected doc ${docPath}`);
    },
    collection: (name) => ({
      doc: () => name === 'sys_admin_access' ? registryRef : profileRef
    })
  };
  const firestore = () => db;
  firestore.FieldValue = {
    delete: () => deleted,
    serverTimestamp: () => 'SERVER_TIMESTAMP'
  };
  const adminMock = {
    firestore,
    auth: () => ({
      getUser: async () => ({ uid: 'uid-target', customClaims: { ...state.claims } }),
      getUserByEmail: async () => ({ uid: 'uid-target' }),
      setCustomUserClaims: async (_uid, claims) => {
        state.order.push('claims-removed');
        state.claims = { ...claims };
      },
      revokeRefreshTokens: async () => {
        state.order.push('tokens-revoke-attempt');
        state.revokeAttempts += 1;
        if (failFirstRevoke && state.revokeAttempts === 1) {
          throw new Error('transient revoke failure');
        }
      }
    })
  };
  const securityMock = {
    assertConfirmText: () => undefined,
    checkStrongSuperAdmin: () => undefined,
    checkStrongAdmin: () => ({ assurance: { level: 'aal2' } }),
    checkActiveStrongAdmin: async () => undefined,
    getSuperAdminEmail: () => '',
    normalizeEmail: (value) => String(value || '').trim().toLowerCase(),
    writeSecurityAudit: async (event, _context, payload) => {
      state.audits.push({ event, payload });
    }
  };

  const originalLoad = Module._load;
  delete require.cache[adminManagementPath];
  Module._load = function loadWithMocks(request, parent, isMain) {
    if (request === 'firebase-functions/v1') return functionsMock();
    if (request === 'firebase-admin') return adminMock;
    if (request === '../../helpers/security') return securityMock;
    if (request === '../../helpers/secrets') return { SUPER_ADMIN_EMAIL: { value: () => '' } };
    if (request === '../analytics/constants') {
      return { timestampFromNow: () => 'EXPIRY', SYSTEM_DOC_RETENTION_DAYS: 1 };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const { removeAdminUser, ensureAdminAccessRegistry } = require(adminManagementPath);
    return {
      state,
      remove: () => removeAdminUser(
        { uid: 'uid-target', email: 'target@example.test', confirmText: 'RETIRER ADMIN' },
        { auth: { uid: 'uid-owner', token: { email: 'owner@example.test' } } }
      ),
      ensure: () => ensureAdminAccessRegistry(
        {},
        {
          auth: {
            uid: 'uid-target',
            token: { email: 'target@example.test', email_verified: true }
          }
        }
      ),
      close: () => {
        Module._load = originalLoad;
        delete require.cache[adminManagementPath];
      }
    };
  } catch (error) {
    Module._load = originalLoad;
    delete require.cache[adminManagementPath];
    throw error;
  }
}

test('admin revocation converges and remains idempotent when repeated', async () => {
  const harness = await loadRemovalHarness();
  try {
    assert.deepEqual(await harness.remove(), { success: true });
    assert.deepEqual(await harness.remove(), { success: true });
    assert.equal(harness.state.registry.active, false);
    assert.equal(harness.state.registry.revocationState, 'completed');
    assert.equal(harness.state.claims.admin, false);
    assert.equal(harness.state.claims.superAdmin, false);
    assert.equal(harness.state.profile.role, 'user');
    assert.equal(Object.hasOwn(harness.state.whitelist, 'uid-target'), false);
    assert.equal(harness.state.revokeAttempts, 2);
  } finally {
    harness.close();
  }
});

test('failed token revocation is resumed without restoring registry access', async () => {
  const harness = await loadRemovalHarness({ failFirstRevoke: true });
  try {
    await assert.rejects(harness.remove(), { code: 'internal' });
    assert.equal(harness.state.registry.active, false);
    assert.equal(harness.state.claims.admin, false);
    assert.equal(harness.state.profile.role, 'admin');

    assert.deepEqual(await harness.remove(), { success: true });
    assert.equal(harness.state.registry.active, false);
    assert.equal(harness.state.registry.revocationState, 'completed');
    assert.equal(harness.state.profile.role, 'user');
    assert.equal(harness.state.revokeAttempts, 2);
    assert.ok(harness.state.audits.some(({ event }) => event === 'admin.revoke_failed'));
    assert.ok(harness.state.audits.some(({ event }) => event === 'admin.revoke_completed'));
  } finally {
    harness.close();
  }
});

test('owner registry cannot be revoked', async () => {
  const harness = await loadRemovalHarness({ role: 'owner' });
  try {
    await assert.rejects(harness.remove(), { code: 'failed-precondition' });
    assert.equal(harness.state.registry.active, true);
    assert.equal(harness.state.revokeAttempts, 0);
    assert.equal(harness.state.claims.superAdmin, true);
  } finally {
    harness.close();
  }
});

test('active legacy admin can self-migrate only when the UID registry is absent', async () => {
  const harness = await loadRemovalHarness({ registryExists: false });
  try {
    assert.deepEqual(await harness.ensure(), {
      success: true,
      migrated: true,
      role: 'admin'
    });
    assert.equal(harness.state.registryExists, true);
    assert.equal(harness.state.registry.active, true);
    assert.equal(harness.state.registry.role, 'admin');
  } finally {
    harness.close();
  }
});

test('self-migration never reactivates an inactive UID registry', async () => {
  const harness = await loadRemovalHarness({ registryExists: true, registryActive: false });
  try {
    await assert.rejects(harness.ensure(), (error) => (
      error.code === 'permission-denied'
      && error.details?.reason === 'admin-access-inactive'
    ));
    assert.equal(harness.state.registry.active, false);
  } finally {
    harness.close();
  }
});
