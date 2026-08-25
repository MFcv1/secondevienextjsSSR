'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    buildOrderDiagnostic,
    handler,
    recoveryAssessment,
    resolveOrderIds
} = require('../../../functions/src/observability/diagnosticTimeline');

function doc(id, data) {
    return { id, exists: true, data: () => data };
}

class Query {
    constructor(documents = []) {
        this.documents = documents;
        this.filters = [];
        this.maximum = null;
        this.order = null;
    }
    where(field, operator, value) {
        assert.equal(operator, '==');
        this.filters.push([field, value]);
        return this;
    }
    orderBy(field, direction = 'asc') {
        this.order = [field, direction];
        return this;
    }
    limit(maximum) {
        this.maximum = maximum;
        return this;
    }
    async get() {
        const at = (value, field) => field.split('.').reduce((current, key) => current?.[key], value);
        let documents = this.documents.filter((entry) => this.filters.every(([field, value]) => at(entry.data(), field) === value));
        if (this.order) {
            const [field, direction] = this.order;
            documents = [...documents].sort((left, right) => String(at(left.data(), field) || '').localeCompare(String(at(right.data(), field) || '')) * (direction === 'desc' ? -1 : 1));
        }
        if (this.maximum !== null) documents = documents.slice(0, this.maximum);
        return { docs: documents, size: documents.length, empty: documents.length === 0 };
    }
}

function fakeDb({ orderId = 'order-console-0001', order = {}, subcollections = {}, collections = {} } = {}) {
    const orderData = {
        schemaVersion: 2,
        orderNumber: 132,
        status: 'paid',
        stateVersion: 4,
        payment: { status: 'succeeded' },
        fulfillmentSummary: { status: 'unfulfilled' },
        refundAggregate: { status: 'none' },
        createdAt: '2026-08-24T10:00:00.000Z',
        updatedAt: '2026-08-24T10:05:00.000Z',
        ...order
    };
    return {
        doc(documentPath) {
            if (documentPath !== `orders/${orderId}`) {
                return { async get() { return { id: documentPath.split('/').pop(), exists: false, data: () => null }; } };
            }
            return {
                async get() { return doc(orderId, orderData); },
                collection(name) { return new Query(subcollections[name] || []); }
            };
        },
        collection(name) { return new Query(collections[name] || []); }
    };
}

function baseCollections(orderId = 'order-console-0001') {
    return {
        commerce_financial_facts: [doc('fact-1', { orderId, type: 'capture', effectiveAt: '2026-08-24T10:04:00.000Z', amountCents: 14000, currency: 'EUR', effectId: 'effect-capture-1' })],
        inventory_movements: [doc('movement-1', { orderId, type: 'commit', createdAt: '2026-08-24T10:03:00.000Z', quantity: 1, effectId: 'effect-stock-1' })],
        commerce_outbox: [doc('outbox-1', { aggregateId: orderId, template: 'payment_confirmation', createdAt: '2026-08-24T10:05:00.000Z', status: 'sent', effectId: 'effect-mail-1' })],
        commerce_incidents: [],
        business_events: [doc('business-webhook-1', { aggregateId: orderId, eventType: 'webhook.processed', occurredAt: '2026-08-24T10:02:00.000Z', source: { kind: 'webhook', ref: 'commerce_webhook_inbox/inbox-1' }, outcome: { status: 'processed' }, correlationId: 'evt-console-1' })]
    };
}

test('R00 timeline fusionne et ordonne toutes les familles checkout attendues', async () => {
    const orderId = 'order-console-0001';
    const diagnostic = await buildOrderDiagnostic(fakeDb({
        orderId,
        subcollections: {
            events: [doc('event-1', { action: 'checkout_created', createdAt: '2026-08-24T10:00:00.000Z', commandId: 'command-console-1' })],
            payment_attempts: [doc('attempt-1', { status: 'attached', updatedAt: '2026-08-24T10:01:00.000Z', commandId: 'command-console-1' })],
            refunds: [], returns: [],
            documents: [doc('document-1', { kind: 'sandbox_payment_receipt', issuedAt: '2026-08-24T10:04:30.000Z' })]
        },
        collections: baseCollections(orderId)
    }), orderId);
    assert.deepEqual([...new Set(diagnostic.timeline.map((event) => event.source))].sort(), [
        'Stripe', 'commande', 'document', 'fait financier', 'inventaire', 'outbox', 'webhook'
    ].sort());
    assert.deepEqual(diagnostic.timeline.map((event) => event.at), [...diagnostic.timeline.map((event) => event.at)].sort());
    assert.equal(diagnostic.order.orderNumber, 132);
});

test('R05 create_unknown puis attached partage la correlation de tentative', async () => {
    const orderId = 'order-console-0005';
    const diagnostic = await buildOrderDiagnostic(fakeDb({
        orderId,
        subcollections: {
            events: [], refunds: [], returns: [], documents: [],
            payment_attempts: [
                doc('attempt-unknown', { status: 'create_unknown', updatedAt: '2026-08-24T10:01:00.000Z', commandId: 'command-attempt-5' }),
                doc('attempt-attached', { status: 'attached', updatedAt: '2026-08-24T10:02:00.000Z', commandId: 'command-attempt-5' })
            ]
        }, collections: baseCollections(orderId)
    }), orderId);
    assert.deepEqual(diagnostic.timeline.filter((event) => event.source === 'Stripe').map((event) => event.correlationId), ['command-attempt-5', 'command-attempt-5']);
});

test('R08 webhook received puis processed est visible sans doublon de source', async () => {
    const orderId = 'order-console-0008';
    const collections = baseCollections(orderId);
    collections.business_events = [
        doc('webhook-received', { aggregateId: orderId, eventType: 'webhook.received', occurredAt: '2026-08-24T10:01:00.000Z', source: { kind: 'webhook', ref: 'inbox/one' }, outcome: { status: 'received' }, correlationId: 'evt-8' }),
        doc('webhook-processed', { aggregateId: orderId, eventType: 'webhook.processed', occurredAt: '2026-08-24T10:02:00.000Z', source: { kind: 'webhook', ref: 'inbox/two' }, outcome: { status: 'processed' }, correlationId: 'evt-8' })
    ];
    const diagnostic = await buildOrderDiagnostic(fakeDb({ orderId, collections }), orderId);
    const webhook = diagnostic.timeline.filter((event) => event.source === 'webhook');
    assert.deepEqual(webhook.map((event) => event.status), ['received', 'processed']);
    assert.equal(new Set(webhook.map((event) => event.id)).size, 2);
});

test('R09 ordre arrivee webhook ne fait pas regresser le verdict de reprise', async () => {
    const orderId = 'order-console-0009';
    const collections = baseCollections(orderId);
    collections.business_events = [
        doc('late-processing', { aggregateId: orderId, eventType: 'payment.processing', occurredAt: '2026-08-24T10:06:00.000Z', source: { kind: 'webhook', ref: 'inbox/late' }, outcome: { status: 'processing' } }),
        doc('success', { aggregateId: orderId, eventType: 'payment.succeeded', occurredAt: '2026-08-24T10:05:00.000Z', source: { kind: 'webhook', ref: 'inbox/success' }, outcome: { status: 'succeeded' } })
    ];
    const diagnostic = await buildOrderDiagnostic(fakeDb({ orderId, collections }), orderId);
    assert.equal(diagnostic.order.paymentStatus, 'succeeded');
    assert.equal(diagnostic.recovery.status, 'safe');
});

test('R11 retry worker expose attemptCount et resultat final', async () => {
    const orderId = 'order-console-0011';
    const collections = baseCollections(orderId);
    collections.business_events = [doc('worker-retry', { aggregateId: orderId, eventType: 'worker.processed', occurredAt: '2026-08-24T10:03:00.000Z', source: { kind: 'webhook', ref: 'inbox/retry' }, outcome: { status: 'processed' }, payload: { attemptCount: 2 } })];
    const diagnostic = await buildOrderDiagnostic(fakeDb({ orderId, collections }), orderId);
    assert.equal(
        diagnostic.timeline.find((event) => event.id === 'journal:worker-retry')?.attemptCount,
        2
    );
    const uiSource = fs.readFileSync(
        path.resolve(__dirname, '../../../src/kit/admin/AdminIncidentConsole.jsx'),
        'utf8'
    );
    assert.match(uiSource, /event\.attemptCount/);
});

test('R12 dead_letter et delivery_unknown bloquent le verdict de reprise', () => {
    const order = { status: 'paid', payment: { status: 'succeeded' } };
    for (const status of ['dead_letter', 'delivery_unknown']) {
        const recovery = recoveryAssessment(order, [], [doc('outbox', { status })]);
        assert.equal(recovery.status, 'blocked');
    }
});

test('R17 101 evenements retourne les 100 plus recents et truncated true', async () => {
    const orderId = 'order-console-0017';
    const events = Array.from({ length: 101 }, (_, index) => doc(`event-${String(index).padStart(3, '0')}`, {
        action: `action-${index}`,
        createdAt: new Date(Date.parse('2026-08-24T10:00:00.000Z') + index * 1000).toISOString()
    }));
    const diagnostic = await buildOrderDiagnostic(fakeDb({ orderId, subcollections: { events } }), orderId);
    assert.equal(diagnostic.timeline.length, 100);
    assert.equal(diagnostic.truncated, true);
});

test('console ne retourne jamais e-mail adresse telephone IP token secret ou payload outbox', async () => {
    const orderId = 'order-console-privacy';
    const forbidden = ['person@example.test', '0600000000', '192.0.2.42', 'token-test-value', 'payload-private'];
    const diagnostic = await buildOrderDiagnostic(fakeDb({
        orderId,
        order: { customerSnapshot: { email: forbidden[0], phone: forbidden[1] }, token: forbidden[3] },
        collections: {
            ...baseCollections(orderId),
            commerce_outbox: [doc('private-outbox', { aggregateId: orderId, status: 'failed', template: 'payment_confirmation', createdAt: '2026-08-24T10:05:00.000Z', payloadSnapshot: { body: forbidden[4] }, ip: forbidden[2] })]
        }
    }), orderId);
    const serialized = JSON.stringify(diagnostic);
    for (const value of forbidden) assert.equal(serialized.includes(value), false);
});

test('recherche correlation reste bornee a dix commandes et cent evenements', async () => {
    const events = Array.from({ length: 15 }, (_, index) => doc(`event-${index}`, { aggregateId: `order-${index}`, correlationId: 'correlation-bounded' }));
    const db = fakeDb({ collections: { business_events: events } });
    const ids = await resolveOrderIds(db, { kind: 'correlation', value: 'correlation-bounded' });
    assert.equal(ids.length, 10);
});

test('echec audit de consultation ne retourne aucune timeline', async () => {
    let timelineReads = 0;
    const db = fakeDb();
    const originalDoc = db.doc;
    db.doc = (documentPath) => {
        const reference = originalDoc(documentPath);
        if (documentPath === 'orders/order-console-0001') {
            const originalCollection = reference.collection;
            reference.collection = (...args) => {
                timelineReads += 1;
                return originalCollection(...args);
            };
        }
        return reference;
    };
    await assert.rejects(handler(
        { kind: 'order', value: 'order-console-0001' },
        {},
        {
            authorize: async () => true,
            audit: async () => false,
            getDb: () => db,
            hash: () => 'hash-test'
        }
    ), (error) => error.details?.reason === 'OBSERVABILITY_AUDIT_UNAVAILABLE');
    assert.equal(timelineReads, 0);
});

test('recherche humaine courante, nue et legacy resout le meme orderNumber', async () => {
    const db = fakeDb({
        collections: {
            orders: [doc('order-console-0001', { orderNumber: 20260001 })]
        }
    });
    for (const value of ['C20260001', 'c20260001', '20260001', 'CMD-20260001', 'cmd-20260001']) {
        const ids = await resolveOrderIds(db, { kind: 'order', value });
        assert.deepEqual(ids, ['order-console-0001']);
    }
});

test('recherche technique par orderId reste disponible', async () => {
    const db = fakeDb();
    const ids = await resolveOrderIds(db, { kind: 'order', value: 'order-console-0001' });
    assert.deepEqual(ids, ['order-console-0001']);
});

test('webhook historique traite apparait dans la timeline', async () => {
    const orderId = 'order-console-historical-webhook';
    const db = fakeDb({
        orderId,
        order: { payment: { status: 'succeeded', paymentIntentId: 'pi_historical_webhook' } },
        collections: {
            commerce_webhook_inbox: [doc('inbox-history', {
                objectId: 'pi_historical_webhook',
                eventId: 'evt_historical_webhook',
                type: 'payment_intent.succeeded',
                status: 'processed',
                attemptCount: 2,
                receivedAt: '2026-08-24T10:00:00.000Z',
                processedAt: '2026-08-24T10:01:00.000Z',
                verifiedPayloadSnapshot: { privateFixtureValue: 'must-not-leak' }
            })]
        }
    });
    const diagnostic = await buildOrderDiagnostic(db, orderId);
    assert.equal(diagnostic.timeline.some((event) => event.source === 'webhook'), true);
    assert.equal(JSON.stringify(diagnostic).includes('must-not-leak'), false);
});

test('recherche invalide produit un audit hashe', async () => {
    const audits = [];
    await assert.rejects(handler(
        { kind: 'order', value: '/' },
        {},
        {
            authorize: async () => true,
            audit: async (...args) => { audits.push(args); return true; },
            getDb: () => { throw new Error('Firestore ne doit pas etre lu'); },
            hash: () => 'hash-invalid-search'
        }
    ), { code: 'invalid-argument' });
    assert.equal(audits.length, 1);
    assert.equal(audits[0][0], 'observability.timeline_invalid');
    assert.deepEqual(audits[0][2], {
        searchType: 'order',
        searchHash: 'hash-invalid-search',
        inputLength: 1
    });
    assert.equal(JSON.stringify(audits).includes('"/"'), false);
});
