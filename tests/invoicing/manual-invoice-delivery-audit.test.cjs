'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const functions = require('firebase-functions/v1');

function harness({ deliveryStatus, emailStatus, acknowledgement = { id: 'mail-local', provider: 'fake' }, persistFailure = false, failAfterCommit = false } = {}) {
    const invoicePath = 'admin_invoices/invoice-local';
    const deliveryPath = `${invoicePath}/deliveries/send-local`;
    const records = new Map([[invoicePath, { status: 'issued', emailStatus: emailStatus || deliveryStatus || 'not_sent' }]]);
    if (deliveryStatus) records.set(deliveryPath, { status: deliveryStatus, recipientHash: crypto.createHash('sha256').update('client@example.test').digest('hex') });
    let sends = 0;
    let failPersistence = persistFailure;
    const reference = path => ({ path, collection: name => ({ doc: id => reference(`${path}/${name}/${id}`) }) });
    const db = {
        collection: name => ({ doc: id => reference(`${name}/${id}`) }),
        async runTransaction(callback) {
            const writes = [];
            const result = await callback({
                get: async ref => ({ exists: records.has(ref.path), data: () => records.get(ref.path) }),
                set: (ref, data) => writes.push([ref.path, data]),
                update: (ref, data) => writes.push([ref.path, { ...records.get(ref.path), ...data }]),
            });
            const finalizing = writes.some(([path, data]) => path === deliveryPath && data.status === 'sent');
            if (finalizing && failPersistence) {
                failPersistence = false;
                if (failAfterCommit) writes.forEach(([path, data]) => records.set(path, data));
                throw new Error('persistence acknowledgement lost');
            }
            writes.forEach(([path, data]) => records.set(path, data));
            return result;
        },
    };
    const timestamp = { toDate: () => new Date('2026-09-07T10:00:00Z') };
    const secret = { value: () => 'local-placeholder' };
    const context = vm.createContext({
        db, crypto, functions, console: { error() {} },
        INVOICES_COLLECTION: 'admin_invoices',
        admin: { firestore: { Timestamp: { now: () => timestamp }, FieldValue: { serverTimestamp: () => timestamp } } },
        checkActiveStrongAdmin: async () => {}, normalizeFirestoreId: value => value,
        email: value => { if (!value?.includes('@')) throw new Error('invalid email'); return value; },
        callableError: error => error,
        GMAIL_EMAIL: secret, GMAIL_PASSWORD: secret, RESEND_API_KEY: secret, RESEND_FROM_EMAIL: secret, TRANSACTIONAL_EMAIL_PROVIDER: secret,
        invoiceEmail: () => ({}),
        createTransactionalEmailRuntime: () => ({ fromAddress: 'local@example.test', sender: { send: async () => { sends++; return acknowledgement; } } }),
    });
    const source = fs.readFileSync(new URL('../../functions/src/invoicing/manualInvoices.js', `file://${__filename}`), 'utf8');
    vm.runInContext(source.slice(source.indexOf('async function issueInvoice('), source.indexOf('const getManualInvoiceWorkspaceAdmin ='))
        + '\nmaterializeIssuedInvoice = async () => ({ filename: "local.pdf", sha256: "local-hash", size: 1 });', context);
    const invoke = data => context.sendManualInvoiceHandler({ invoiceId: 'invoice-local', sendRequestId: 'send-local', recipient: 'client@example.test', ...data }, { auth: { uid: 'admin-local' } });
    return { invoke, records, invoicePath, deliveryPath, sends: () => sends };
}

test('invoice duplicate or uncertain delivery cannot overwrite the existing claim, even with a new request ID', async () => {
    for (const deliveryStatus of ['sending', 'delivery_unknown']) {
        const h = harness({ deliveryStatus });
        await assert.rejects(h.invoke(), { code: 'failed-precondition' });
        await assert.rejects(h.invoke({ sendRequestId: 'send-another' }), { code: 'failed-precondition' });
        assert.equal(h.records.get(h.deliveryPath).status, deliveryStatus);
        assert.equal(h.records.size, 2);
        assert.equal(h.sends(), 0);
    }
});

test('invoice send refuses recipient changes on the same request and invalid requests create no delivery', async () => {
    const h = harness({ deliveryStatus: 'sent' });
    await assert.rejects(h.invoke({ recipient: 'other@example.test' }), { code: 'failed-precondition' });
    assert.equal((await h.invoke()).alreadySent, true);
    assert.equal(h.sends(), 0);
    const invalid = harness();
    await assert.rejects(invalid.invoke({ recipient: 'invalid' }), /invalid email/);
    assert.equal(invalid.records.size, 1);
    assert.equal(invalid.records.get(invalid.invoicePath).emailStatus, 'not_sent');
});

test('invoice acknowledgement gaps freeze delivery; lost database response preserves an already committed success', async () => {
    for (const options of [{ acknowledgement: null }, { persistFailure: true }, { persistFailure: true, failAfterCommit: true }]) {
        const h = harness(options);
        await assert.rejects(h.invoke());
        const expected = options.failAfterCommit ? 'sent' : 'delivery_unknown';
        assert.equal(h.records.get(h.deliveryPath).status, expected);
        assert.equal(h.records.get(h.invoicePath).emailStatus, expected);
        if (expected === 'sent') assert.equal((await h.invoke()).alreadySent, true);
        else await assert.rejects(h.invoke(), { code: 'failed-precondition' });
        assert.equal(h.sends(), 1);
    }
});
