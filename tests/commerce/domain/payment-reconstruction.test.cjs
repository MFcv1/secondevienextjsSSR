'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { resolveAvailability, projectAvailability } = require('../../../functions/src/catalog/availability');
const { buildInventoryOverview } = require('../../../functions/src/catalog/inventoryProjection');
const { resolveCheckoutResumeTerminalCode } = require('../../../functions/src/commerce/domain/checkoutCoordinator');

test('local delivery is disabled outside 13 or until a complete postcode; pickup and carrier stay available', async () => {
    const { deliveryUnavailableReason } = await import('../../../src/kit/commerce/deliveryEligibility.js');
    assert.equal(deliveryUnavailableReason('idf', '13001'), '');
    assert.equal(deliveryUnavailableReason('idf', ' 13008 '), '');
    assert.match(deliveryUnavailableReason('idf', '14123'), /Bouches-du-Rhône/);
    assert.match(deliveryUnavailableReason('idf', ''), /code postal/);
    assert.match(deliveryUnavailableReason('idf', '13'), /code postal/);
    assert.equal(deliveryUnavailableReason('retrait', '14123'), '');
    assert.equal(deliveryUnavailableReason('transporteur', '14123'), '');
});

test('historical committed reservation proves sale, hold does not; incomplete evidence is unknown', async () => {
    const product = { status: 'published', stock: 0 };
    assert.equal(resolveAvailability(product), 'unavailable');
    assert.equal(resolveAvailability(product, [{ heldQty: 1 }]), 'reserved');
    assert.equal(resolveAvailability(product, [{ committedQty: 1, restockedQty: 0 }]), 'sold');
    assert.equal(resolveAvailability(product, [{ committedQty: 1, restockedQty: 1 }]), 'unavailable');
    assert.equal(resolveAvailability(product, [{ committedQty: 1 }], false), 'unavailable');
    assert.equal(resolveAvailability({ ...product, stock: 1 }, [{ committedQty: 1 }]), 'available');
    const reads = [];
    const db = { collection(name) {
        assert.equal(name, 'inventory_reservations');
        return { where(field, operator, value) {
            assert.equal(field, 'productId'); assert.equal(operator, '=='); reads.push(value);
            return { limit(bound) {
                assert.equal(bound, 51);
                return { get: async () => ({ docs: [{ data: () => ({ collectionName: 'furniture', committedQty: 1 }) }] }) };
            } };
        } };
    } };
    const projection = await projectAvailability(db, [{ id: 'old-sale', data: product }, { id: 'available', data: { ...product, stock: 1 } }]);
    assert.deepEqual(reads, ['old-sale']);
    assert.equal(projection[0].data.availability, 'sold');
    assert.equal(buildInventoryOverview(projection).soldItems, 1);
    assert.equal(buildInventoryOverview([{ data: { ...product, availability: 'reserved' } }]).soldItems, 0);
});

test('elapsed deadline blocks the secret without declaring payment canceled; durable paid wins', () => {
    const order = { checkout: { expiresAt: '2026-09-06T12:15:00Z' }, payment: { status: 'processing' } };
    assert.equal(resolveCheckoutResumeTerminalCode(order, {}, Date.parse('2026-09-06T12:14:59Z')), null);
    assert.equal(resolveCheckoutResumeTerminalCode(order, {}, Date.parse('2026-09-06T12:15:00Z')), 'COMMERCE_CHECKOUT_DEADLINE_REACHED');
    assert.equal(order.payment.status, 'processing');
    assert.equal(resolveCheckoutResumeTerminalCode({ ...order, payment: { status: 'succeeded' } }, {}, Date.parse('2026-09-06T12:16:00Z')), 'COMMERCE_CHECKOUT_TERMINAL_PAID');
});

test('local deploy target explicitly selects CloudEvent transport without capacity changes', async () => {
    const { GCLOUD_GEN2_TARGETS } = await import('../../../scripts/deploy-functions-targeted.mjs');
    const target = GCLOUD_GEN2_TARGETS.onCommerceReservationWrittenGen2;
    assert.ok(target.environmentVariables.includes('FUNCTION_SIGNATURE_TYPE=cloudevent'));
    assert.equal(target.retry, true);
    assert.equal(target.maxInstances, '1');
    assert.equal(target.minInstances, '0');
    assert.equal(target.documentPathPattern, 'inventory_reservations/{reservationId}');
});

test('reservation event handler rejects a missing CloudEvent change instead of acknowledging silently', async () => {
    const admin = require('../../../functions/node_modules/firebase-admin');
    if (!admin.apps.length) admin.initializeApp({ projectId: 'demo-secondevie-commerce' });
    const { enqueueReservationWrite } = require('../../../functions/src/commerce/commerceEventDispatch');
    await assert.rejects(enqueueReservationWrite({ value: {} }), /COMMERCE_RESERVATION_EVENT_INVALID/);
    assert.equal(await enqueueReservationWrite({ data: { before: { exists: false }, after: { exists: false } }, params: { reservationId: 'reservation-local' } }), null);
});

test('submission gate blocks retries on expired and unknown results, but allows known refusal', async () => {
    const { createPaymentSubmission } = await import('../../../src/kit/commerce/paymentSubmission.js');
    const states = [];
    let calls = 0;
    let results = 0;
    const expired = createPaymentSubmission({ expiresAt: '2026-09-06T12:15:00Z', now: () => Date.parse('2026-09-06T12:15:00Z'), confirm: () => { calls++; }, onState: (state) => states.push(state), onResult: () => results++ });
    await expired(); await expired();
    assert.equal(calls, 0); assert.equal(results, 1); assert.deepEqual(states, ['verification']);
    const unknown = createPaymentSubmission({ confirm: async () => { calls++; throw new Error('response lost'); }, onState: () => {}, onResult: () => results++ });
    await unknown(); await unknown(); assert.equal(calls, 1);
});

test('owner resume descriptor cannot cross UID; pending deadline copy never calls it sold', async () => {
    const { isPendingCheckout, pendingCheckoutMessage, prepareOwnedCheckoutResume } = await import('../../../src/kit/commerce/pendingCheckout.js');
    const order = { id: 'order-local-0001', userId: 'owner-local-0001', schemaVersion: 2, checkout: { status: 'active', expiresAt: '2026-09-06T12:15:00Z' }, payment: { status: 'awaiting_method' } };
    assert.equal(isPendingCheckout(order), true);
    assert.throws(() => prepareOwnedCheckoutResume(order, 'owner-local-0002'), /ACCESS_DENIED/);
    assert.match(pendingCheckoutMessage(order, Date.parse('2026-09-06T12:14:00Z')), /réservées/);
    assert.match(pendingCheckoutMessage(order, Date.parse('2026-09-06T12:16:00Z')), /vérification/);
    assert.equal(isPendingCheckout({ ...order, payment: { status: 'succeeded' } }), false);
});
