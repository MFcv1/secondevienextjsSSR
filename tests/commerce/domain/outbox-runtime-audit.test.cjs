'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { createOutboxWorker } = require('../../../functions/src/commerce/domain/outboxWorker');

test('the actual outbox sender adapter preserves ambiguous acknowledgements through the worker', async () => {
    const source = fs.readFileSync(require.resolve('../../../functions/src/commerce/v2Operations.js'), 'utf8');
    const runtimeSource = source.slice(source.indexOf('function createOutboxRuntime('), source.indexOf('async function upsertImmutableDocument('));
    const effects = [];
    const factory = vm.runInNewContext(`${runtimeSource}; createOutboxRuntime`, {
        createClock: () => ({ now: () => '2026-09-07T10:00:00Z', nowMillis: () => 1 }),
        createEmailSender: () => ({ provider: 'gmail', send: async () => ({ id: null }) }),
        createOutboxRepository: () => ({
            claim: async () => ({ outboxId: 'email-audit', status: 'processing', template: 'order-paid', payloadSnapshot: { orderId: 'order-audit' } }),
            markSent: async () => effects.push('sent'),
            markFailed: async () => effects.push('retry'),
            markDeliveryUnknown: async () => effects.push('unknown')
        }),
        createOutboxWorker, outboxRefs: () => ({}), crypto: require('node:crypto'),
        db: { doc: () => ({ get: async () => ({ exists: true, data: () => ({}) }) }) },
        normalizeFirestoreId: value => value,
        GMAIL_EMAIL: { value: () => 'sender@example.test' },
        messageFor: () => ({}), ambiguousGmailError: () => false,
        operationsError: code => Object.assign(new Error(code), { code }),
        createFirestoreWorkerQueries: () => ({}), createBoundedWorkerSweeper: () => ({})
    });
    await assert.rejects(factory().worker.process('email-audit'), { code: 'COMMERCE_OUTBOX_PROVIDER_RESPONSE_INVALID' });
    assert.deepEqual(effects, ['unknown']);
});
