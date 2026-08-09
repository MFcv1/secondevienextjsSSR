'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    buildNextPolicy,
    createDeliveryPolicyHandlers,
    normalizeDeliverySettings,
    publicDeliveryProjection,
    settingsFromPolicy
} = require('../../../functions/src/commerce/v2DeliveryPolicyAdmin');

const policy = () => ({
    schemaVersion: 2,
    version: 'policy-source',
    active: true,
    currency: 'EUR',
    offlinePaymentEnabled: false,
    stripeConnectedAccountId: 'acct_deliverypolicy01',
    holdDurationSeconds: 1800,
    deliveryModes: [
        { id: 'delivery-pickup', active: true, shippingCents: 0, countries: ['FR'] },
        { id: 'delivery-local', active: true, shippingCents: 4900, countries: ['FR'], postalPrefixes: ['13'] },
        { id: 'delivery-carrier', active: true, shippingCents: 9000, countries: ['FR'] }
    ]
});

const settings = () => ({
    retrait: { id: 'retrait', active: true, label: 'Retrait atelier', sub: 'Sur rendez-vous', price: 0 },
    idf: { id: 'idf', active: false, label: 'Livraison locale', sub: 'Par nos soins', price: 55.5 },
    transporteur: { id: 'transporteur', active: true, label: 'Transporteur', sub: 'France entière', price: 92 }
});

test('delivery settings create a new immutable policy while preserving zones and Connect', () => {
    const normalized = normalizeDeliverySettings(settings());
    const next = buildNextPolicy(policy(), normalized, 'policy-next');
    assert.equal(next.version, 'policy-next');
    assert.equal(next.stripeConnectedAccountId, 'acct_deliverypolicy01');
    assert.equal(next.holdDurationSeconds, 1800);
    assert.equal(next.deliveryModes[1].active, false);
    assert.equal(next.deliveryModes[1].shippingCents, 5550);
    assert.deepEqual(next.deliveryModes[1].postalPrefixes, ['13']);
    assert.equal(policy().version, 'policy-source');
});

test('public delivery projection stays compatible with checkout legacy aliases', () => {
    const projection = publicDeliveryProjection(normalizeDeliverySettings(settings()));
    assert.deepEqual(Object.keys(projection), ['retrait', 'idf', 'transporteur']);
    assert.equal(projection.transporteur.price, 92);
    assert.equal(projection.idf.active, false);
});

test('policy is authoritative for active state and price while metadata supplies copy', () => {
    const loaded = settingsFromPolicy(policy(), {
        idf: { label: 'Livraison personnalisée', sub: 'Créneau confirmé' }
    });
    assert.equal(loaded.idf.price, 49);
    assert.equal(loaded.idf.active, true);
    assert.equal(loaded.idf.label, 'Livraison personnalisée');
    assert.equal(loaded.idf.sub, 'Créneau confirmé');
});

test('invalid delivery settings are rejected before any write', () => {
    assert.throws(() => normalizeDeliverySettings({
        ...settings(),
        transporteur: { ...settings().transporteur, price: -1 }
    }), { code: 'COMMERCE_DELIVERY_POLICY_INPUT_INVALID' });
    assert.throws(() => normalizeDeliverySettings(Object.fromEntries(
        Object.entries(settings()).map(([key, value]) => [key, { ...value, active: false }])
    )), { code: 'COMMERCE_DELIVERY_POLICY_INPUT_INVALID' });
});

function fakeDatabase() {
    const documents = new Map([
        ['sys_commerce_control/current', {
            newCheckoutMode: 'v2_all', legacyMode: 'disabled', adminMutationMode: 'v2',
            offlinePaymentMode: 'off', activePolicyVersion: 'policy-source',
            fixtureScopeVersion: null, fixtureScopeRef: null, controlRevision: 4
        }],
        ['commerce_policy_versions/policy-source', policy()],
        ['sys_metadata/delivery', publicDeliveryProjection(normalizeDeliverySettings(settings()))]
    ]);
    const ref = (path) => ({ path });
    const snapshot = (path) => ({
        exists: documents.has(path),
        data: () => documents.get(path)
    });
    return {
        documents,
        doc: ref,
        runTransaction: async (run) => run({
            get: async (target) => snapshot(target.path),
            create: (target, value) => {
                if (documents.has(target.path)) throw new Error('already exists');
                documents.set(target.path, value);
            },
            update: (target, value) => documents.set(target.path, {
                ...documents.get(target.path),
                ...value
            }),
            set: (target, value) => documents.set(target.path, value)
        })
    };
}

test('save handler atomically rotates policy and public delivery projection', async () => {
    const db = fakeDatabase();
    const audits = [];
    const handlers = createDeliveryPolicyHandlers({
        db,
        versionFactory: () => 'policy-next',
        authorize: async () => ({ access: { active: true } }),
        audit: async (...args) => audits.push(args)
    });
    const result = await handlers.save({
        settings: settings(),
        sourcePolicyVersion: 'policy-source',
        expectedControlRevision: 4
    }, { auth: { uid: 'admin-google', token: {} } });
    assert.equal(result.policyVersion, 'policy-next');
    assert.equal(db.documents.get('sys_commerce_control/current').activePolicyVersion, 'policy-next');
    assert.equal(db.documents.get('sys_commerce_control/current').controlRevision, 5);
    assert.equal(db.documents.get('commerce_policy_versions/policy-next').sourcePolicyVersion, 'policy-source');
    assert.equal(db.documents.get('sys_metadata/delivery').idf.price, 55.5);
    assert.equal(audits[0][0], 'commerce.delivery_policy_updated');
});

test('get handler reads control, policy and public copy from one consistent transaction', async () => {
    const db = fakeDatabase();
    const handlers = createDeliveryPolicyHandlers({
        db,
        authorize: async () => ({ access: { active: true } }),
        audit: async () => undefined
    });
    const result = await handlers.get({}, { auth: { uid: 'admin-google', token: {} } });
    assert.equal(result.policyVersion, 'policy-source');
    assert.equal(result.controlRevision, 4);
    assert.equal(result.settings.idf.price, 49);
    assert.equal(result.settings.idf.label, 'Livraison locale');
});

test('save handler rejects a stale editor without creating a policy', async () => {
    const db = fakeDatabase();
    const handlers = createDeliveryPolicyHandlers({
        db,
        versionFactory: () => 'policy-should-not-exist',
        authorize: async () => ({ access: { active: true } }),
        audit: async () => undefined
    });
    await assert.rejects(handlers.save({
        settings: settings(),
        sourcePolicyVersion: 'policy-source',
        expectedControlRevision: 3
    }, { auth: { uid: 'admin-google', token: {} } }), (error) => (
        error.code === 'aborted'
        && error.details?.reason === 'COMMERCE_DELIVERY_POLICY_STALE'
    ));
    assert.equal(db.documents.has('commerce_policy_versions/policy-should-not-exist'), false);
});
