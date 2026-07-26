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

test('legacy cleaner and webhook fence v2 before legacy mutations', () => {
    const cleaner = read('functions/src/commerce/cleanupPendingPayments.js');
    const webhook = read('functions/src/commerce/stripeWebhook.js');
    assert.match(cleaner, /if \(isV2Order\(order\)\)/);
    assert.match(cleaner, /assertLegacyOrderDocument\(null, freshOrder/);
    assert.ok((webhook.match(/assertLegacyOrderDocument\(null,/g) || []).length >= 5);
});

test('legacy email and statistics triggers ignore v2 roots', () => {
    const emails = read('functions/src/email/orderEmails.js');
    const stats = read('functions/src/commerce/orderStats.js');
    assert.match(emails, /order\.schemaVersion === V2_EMAIL_OUTBOX_REQUIRED/);
    assert.match(emails, /orderAfter\.schemaVersion === V2_EMAIL_OUTBOX_REQUIRED/);
    assert.match(stats, /after\?\.schemaVersion === V2_STATS_PROJECTION_REQUIRED/);
});
