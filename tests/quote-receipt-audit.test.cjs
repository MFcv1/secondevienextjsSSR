'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function harness({ status, acknowledgement = { id: 'local-message', provider: 'fake' }, persistFailure = false, failAfterCommit = false } = {}) {
    let record = { intakeStatus: 'submitted', confirmationEmail: status ? { status, eventId: 'event-local', startedAt: { toMillis: () => 1 } } : {} };
    let sends = 0;
    let shouldFail = persistFailure;
    const db = { async runTransaction(run) {
        let next;
        const result = await run({
            get: async () => ({ exists: true, data: () => record }),
            set: (_ref, data) => { next = { ...record, ...data }; },
        });
        if (shouldFail && next?.confirmationEmail.status === 'sent') {
            shouldFail = false;
            if (failAfterCommit) record = next;
            throw new Error('database response lost');
        }
        if (next) record = next;
        return result;
    } };
    const secret = { value: () => 'local-placeholder' };
    const scope = vm.createContext({
        db, console: { error() {} }, EMAIL_CLAIM_LEASE_MS: 120000,
        admin: { firestore: { Timestamp: { now: () => ({ toMillis: () => 1000000 }) }, FieldValue: { serverTimestamp: () => 'timestamp' } } },
        TRANSACTIONAL_EMAIL_PROVIDER: secret, GMAIL_EMAIL: secret, GMAIL_PASSWORD: secret, RESEND_API_KEY: secret, RESEND_FROM_EMAIL: secret,
        quoteReceiptEmail: () => ({}),
        createTransactionalEmailRuntime: () => ({ fromAddress: 'local@example.test', sender: { send: async () => { sends++; return acknowledgement; } } }),
    });
    const source = fs.readFileSync(new URL('../functions/src/quotes/quoteRequests.js', `file://${__filename}`), 'utf8');
    vm.runInContext(source.slice(source.indexOf('async function sendQuoteReceiptEmail('), source.indexOf('const createQuoteRequest =')), scope);
    return {
        invoke: () => scope.sendQuoteReceiptEmail({ before: { data: () => ({ intakeStatus: 'draft' }) }, after: { data: () => record, id: 'quote-local', ref: {} } }, { eventId: 'event-local' }),
        record: () => record, sends: () => sends,
    };
}

test('quote receipt with an expired send claim is frozen instead of delivered again', async () => {
    const h = harness({ status: 'sending' });
    await h.invoke();
    await h.invoke();
    assert.equal(h.record().confirmationEmail.status, 'delivery_unknown');
    assert.equal(h.sends(), 0);
});

test('quote receipt preserves provider ambiguity and durable success across database failures', async () => {
    for (const options of [{ acknowledgement: null }, { persistFailure: true }, { persistFailure: true, failAfterCommit: true }]) {
        const h = harness(options);
        await h.invoke();
        assert.equal(h.record().confirmationEmail.status, options.failAfterCommit ? 'sent' : 'delivery_unknown');
        await h.invoke();
        assert.equal(h.sends(), 1);
    }
});
