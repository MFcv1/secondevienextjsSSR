'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSharedAdminReader, operations } = require('../functions/src/admin/sharedReader.cjs');
class HttpsError extends Error { constructor(code) { super(code); this.code = code; } }

test('shared admin reader authorizes every request, reuses code and never caches private results', async () => {
    let allowed = true;
    let authorizations = 0;
    let loaded = 0;
    let reads = 0;
    const reader = createSharedAdminReader({ HttpsError,
        authorize: async () => { authorizations++; if (!allowed) throw new HttpsError('permission-denied'); },
        operations: { read: () => { loaded++; return async (_, context) => { reads++; return context.auth.uid; }; } }
    });
    assert.equal(await reader({ operation: 'read', data: {} }, { auth: { uid: 'one' } }), 'one');
    assert.equal(await reader({ operation: 'read', data: {} }, { auth: { uid: 'two' } }), 'two');
    allowed = false;
    await assert.rejects(reader({ operation: 'read', data: {} }, {}), error => error.code === 'permission-denied');
    assert.deepEqual({ authorizations, loaded, reads }, { authorizations: 3, loaded: 1, reads: 2 });
});

test('shared admin reader excludes mutations, exports and public operations', async () => {
    const reader = createSharedAdminReader({ HttpsError, authorize: async () => {} });
    for (const name of ['__proto__', 'constructor', 'createCheckoutV2', 'prepareManualInvoicePdfAdmin', 'createPromotionCodeAdmin']) {
        assert.ok(!operations.includes(name));
        await assert.rejects(reader({ operation: name, data: {} }, {}), error => error.code === 'invalid-argument');
    }
});
