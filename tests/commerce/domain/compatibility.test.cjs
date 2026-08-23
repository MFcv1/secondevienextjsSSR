'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    V2_HANDLER_REQUIRED_CODE,
    assertLegacyOrderDocument,
    isV2Order
} = require('../../../functions/src/commerce/legacyContainment');

const repositoryRoot = path.resolve(__dirname, '..', '..', '..');

function read(relativePath) {
    return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

test('legacy handler barrier refuses schemaVersion 2 explicitly', () => {
    assert.equal(isV2Order({ schemaVersion: 2 }), true);
    assert.throws(
        () => assertLegacyOrderDocument(null, { schemaVersion: 2 }, 'test-handler'),
        { code: V2_HANDLER_REQUIRED_CODE }
    );
    assert.doesNotThrow(() => assertLegacyOrderDocument(null, { status: 'paid' }, 'test-handler'));
});

test('legacy mutation endpoints are removed after the Gen2 cutover', () => {
    const functionsIndex = read('functions/index.js');
    assert.doesNotMatch(functionsIndex, /cleanupPendingPayments/);
    for (const file of ['cancelOrder.js', 'refundOrder.js', 'stripeWebhook.js']) {
        assert.equal(fs.existsSync(path.join(repositoryRoot, 'functions/src/commerce', file)), false, file);
    }
});

test('legacy email and statistics triggers ignore v2 roots', () => {
    const emails = read('functions/src/email/orderEmails.js');
    const stats = read('functions/src/commerce/orderStats.js');
    assert.match(emails, /Number\(order\.schemaVersion \|\| 0\) >= V2_EMAIL_OUTBOX_REQUIRED/);
    assert.match(emails, /Number\(orderAfter\.schemaVersion \|\| 0\) >= V2_EMAIL_OUTBOX_REQUIRED/);
    assert.match(stats, /Number\(currentOrder\.schemaVersion \|\| 0\) < V2_STATS_PROJECTION_REQUIRED/);
    assert.match(stats, /order_stats_projections\/\$\{orderId\}/);
});
