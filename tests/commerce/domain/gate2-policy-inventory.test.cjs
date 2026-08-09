'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    aggregateCheckoutLines,
    validateCheckoutInput
} = require('../../../functions/src/commerce/domain/checkoutInput');
const {
    MAX_HOLD_DURATION_SECONDS,
    assertPinnedPolicy,
    resolveCheckoutExpiry,
    resolveDelivery,
    resolvePolicyForCheckout,
    validateCommercePolicy
} = require('../../../functions/src/commerce/domain/policy');
const {
    canonicalInventoryIdentity,
    createInventoryKey
} = require('../../../functions/src/commerce/domain/inventoryKey');
const {
    assertPinnedConnectedAccount,
    pinConnectedAccount
} = require('../../../functions/src/commerce/domain/connectPolicy');
const { effectIdFor } = require('../../../functions/src/commerce/domain/reservationRepository');

function makeControl(overrides = {}) {
    return {
        newCheckoutMode: 'v2_fixture',
        legacyMode: 'disabled',
        adminMutationMode: 'v2',
        offlinePaymentMode: 'off',
        activePolicyVersion: 'policy-gate2',
        fixtureScopeVersion: 'fixture-gate2',
        fixtureScopeRef: 'commerce_fixture_scopes/fixture-gate2',
        controlRevision: 2,
        ...overrides
    };
}

function makePolicy(overrides = {}) {
    return {
        schemaVersion: 2,
        version: 'policy-gate2',
        active: true,
        currency: 'EUR',
        offlinePaymentEnabled: false,
        stripeConnectedAccountId: 'acct_gate2ready01',
        holdDurationSeconds: 1800,
        deliveryModes: [{
            id: 'delivery-home',
            active: true,
            shippingCents: 1500,
            countries: ['FR'],
            postalPrefixes: ['75', '92']
        }],
        ...overrides
    };
}

function makeCheckout(overrides = {}) {
    return {
        clientOrderId: 'client-order-gate2',
        items: [{
            cartLineId: 'cart-line-gate2',
            cartRevision: 1,
            productId: 'product-gate2',
            collectionName: 'furniture',
            variantId: null,
            quantity: 1
        }],
        deliveryModeId: 'delivery-home',
        shippingAddress: {
            fullName: 'Client Gate Deux',
            line1: '10 rue du Test',
            line2: '',
            postalCode: '75001',
            city: 'Paris',
            country: 'FR'
        },
        ...overrides
    };
}

test('checkout input is allowlisted, versioned and hashed without client prices', () => {
    const first = validateCheckoutInput(makeCheckout());
    const second = validateCheckoutInput({
        shippingAddress: makeCheckout().shippingAddress,
        deliveryModeId: 'delivery-home',
        items: makeCheckout().items,
        clientOrderId: 'client-order-gate2'
    });
    assert.equal(first.requestHash, second.requestHash);
    assert.match(first.value.items[0].inventoryKey, /^[a-f0-9]{64}$/);
    assert.throws(
        () => validateCheckoutInput({
            ...makeCheckout(),
            totalCents: 1
        }),
        { code: 'COMMERCE_CHECKOUT_FIELD_FORBIDDEN' }
    );
    assert.throws(
        () => validateCheckoutInput({
            ...makeCheckout(),
            items: [{ ...makeCheckout().items[0], price: 0.01 }]
        }),
        { code: 'COMMERCE_CHECKOUT_FIELD_FORBIDDEN' }
    );
});

test('repeated SKU lines aggregate by canonical inventory key and retain allocations', () => {
    const input = makeCheckout();
    input.items.push({
        ...input.items[0],
        cartLineId: 'cart-line-gate2-b',
        cartRevision: 4,
        quantity: 2
    });
    const { value } = validateCheckoutInput(input);
    const groups = aggregateCheckoutLines(value.items);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].quantity, 3);
    assert.equal(groups[0].lineAllocations.length, 2);
});

test('inventory identity is versioned, normalized and variant-safe', () => {
    const withoutVariant = createInventoryKey({
        collectionName: 'furniture',
        productId: 'produit-é',
        variantId: null
    });
    const normalized = createInventoryKey({
        collectionName: 'furniture',
        productId: 'produit-e\u0301',
        variantId: null
    });
    const withVariant = createInventoryKey({
        collectionName: 'furniture',
        productId: 'produit-é',
        variantId: 'variant-0001'
    });
    assert.equal(withoutVariant, normalized);
    assert.notEqual(withoutVariant, withVariant);
    assert.match(canonicalInventoryIdentity({
        collectionName: 'furniture',
        productId: 'product-gate2'
    }), /^v1\|/);
    assert.throws(
        () => createInventoryKey({ collectionName: 'unknown', productId: 'product-gate2' }),
        { code: 'COMMERCE_INVENTORY_COLLECTION_FORBIDDEN' }
    );
});

test('policy and delivery are fail-closed and pinned by immutable version', () => {
    const policy = makePolicy();
    assert.equal(validateCommercePolicy(policy), true);
    assert.equal(
        resolveCheckoutExpiry(policy, '2026-07-26T12:00:00.000Z'),
        '2026-07-26T12:30:00.000Z'
    );
    assert.strictEqual(resolvePolicyForCheckout(makeControl(), policy, { fixture: true }), policy);
    assert.equal(resolveDelivery(policy, 'delivery-home', makeCheckout().shippingAddress).shippingCents, 1500);
    assert.equal(assertPinnedPolicy({ checkout: { policyVersion: 'policy-gate2' } }, policy), true);
    assert.throws(
        () => resolvePolicyForCheckout(makeControl({ newCheckoutMode: 'unknown' }), policy, { fixture: true }),
        { code: 'COMMERCE_CHECKOUT_MODE_OFF' }
    );
    assert.throws(
        () => validateCommercePolicy(makePolicy({
            deliveryModes: [{ ...makePolicy().deliveryModes[0], shippingCents: 1.5 }]
        })),
        { code: 'COMMERCE_POLICY_DELIVERY_INVALID' }
    );
    for (const holdDurationSeconds of [undefined, 0, 1.5, MAX_HOLD_DURATION_SECONDS + 1]) {
        assert.throws(
            () => validateCommercePolicy(makePolicy({ holdDurationSeconds })),
            { code: 'COMMERCE_POLICY_HOLD_INVALID' }
        );
    }
    assert.throws(
        () => resolveCheckoutExpiry(policy, 'not-a-date'),
        { code: 'COMMERCE_POLICY_CLOCK_INVALID' }
    );
    assert.throws(
        () => resolveDelivery(policy, 'delivery-home', {
            ...makeCheckout().shippingAddress,
            postalCode: '13001'
        }),
        { code: 'COMMERCE_DELIVERY_OUT_OF_ZONE' }
    );
});

test('Connect readiness is pinned and a later account switch cannot reroute history', () => {
    const policy = makePolicy();
    const pinned = pinConnectedAccount(policy, {
        accountId: 'acct_gate2ready01',
        active: true,
        activeRevision: 7,
        chargesEnabled: true,
        detailsSubmitted: true
    });
    assert.equal(pinned.accountId, policy.stripeConnectedAccountId);
    assert.equal(assertPinnedConnectedAccount({
        payment: { connectedAccountId: pinned.accountId }
    }, 'acct_gate2ready01'), true);
    assert.throws(
        () => assertPinnedConnectedAccount({
            payment: { connectedAccountId: pinned.accountId }
        }, 'acct_replacement99'),
        { code: 'COMMERCE_CONNECT_PIN_MISMATCH' }
    );
    assert.throws(
        () => pinConnectedAccount(policy, {
            accountId: 'acct_gate2ready01',
            active: false,
            chargesEnabled: true,
            detailsSubmitted: true
        }),
        { code: 'COMMERCE_CONNECT_ACCOUNT_NOT_READY' }
    );
});

test('movement effect identity is deterministic per operation/order/inventory key', () => {
    const key = createInventoryKey({
        collectionName: 'furniture',
        productId: 'product-gate2'
    });
    assert.equal(effectIdFor('hold', 'order-gate2', key), effectIdFor('hold', 'order-gate2', key));
    assert.notEqual(effectIdFor('hold', 'order-gate2', key), effectIdFor('release', 'order-gate2', key));
});
