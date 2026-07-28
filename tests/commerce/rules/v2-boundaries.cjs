'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment
} = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc } = require('firebase/firestore');

const PROJECT_ID = 'demo-secondevie-commerce';
const FIRESTORE_PORT = 8185;
const repositoryRoot = path.resolve(__dirname, '..', '..', '..');

function assertEmulatorBoundary() {
    if (
        process.env.GCLOUD_PROJECT !== PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT !== PROJECT_ID ||
        process.env.FIRESTORE_EMULATOR_HOST !== `127.0.0.1:${FIRESTORE_PORT}`
    ) {
        throw new Error('Commerce v2 Rules tests require the fixed demo emulator');
    }
}

async function withEnvironment(run) {
    assertEmulatorBoundary();
    const environment = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            host: '127.0.0.1',
            port: FIRESTORE_PORT,
            rules: fs.readFileSync(path.join(repositoryRoot, 'firestore.rules'), 'utf8')
        }
    });
    try {
        await environment.clearFirestore();
        return await run(environment);
    } finally {
        await environment.cleanup();
    }
}

async function seed(environment, entries) {
    await environment.withSecurityRulesDisabled(async (context) => {
        for (const [documentPath, value] of entries) {
            await setDoc(doc(context.firestore(), documentPath), value);
        }
    });
}

function strongAdmin(environment) {
    return environment.authenticatedContext('admin-v2', {
        admin: true,
        email: 'admin-v2@example.test',
        email_verified: true,
        firebase: { sign_in_provider: 'google.com' }
    });
}

const scenarios = {
    'owner-v2-root-read-remains-allowed': async (context) => withEnvironment(async (environment) => {
        await seed(environment, [[
            'orders/order-v2-readable',
            {
                schemaVersion: 2,
                userId: 'owner-v2',
                userEmail: 'owner-v2@example.test',
                checkoutAuthMethod: 'authenticated'
            }
        ]]);
        const owner = environment.authenticatedContext('owner-v2', {
            email: 'owner-v2@example.test',
            email_verified: true,
            firebase: { sign_in_provider: 'password' }
        }).firestore();
        const snapshot = await assertSucceeds(getDoc(doc(owner, 'orders/order-v2-readable')));
        context.equal(snapshot.exists(), true, 'v2 root preserves the owner read contract');
    }),

    'order-v2-subcollections-are-backend-only': async (context) => withEnvironment(async (environment) => {
        await seed(environment, [['sys_admin_access/admin-v2', { active: true }]]);
        const admin = strongAdmin(environment).firestore();
        for (const collection of ['payment_attempts', 'refunds', 'returns', 'fulfillments', 'events']) {
            const documentPath = `orders/order-v2/${collection}/proof`;
            await seed(environment, [[documentPath, { schemaVersion: 2 }]]);
            await assertFails(getDoc(doc(admin, documentPath)));
            await assertFails(setDoc(doc(admin, `${documentPath}-write`), { schemaVersion: 2 }));
        }
        context.ok(true, 'every order v2 subcollection is explicitly backend-only');
    }),

    'owner-can-read-immutable-commerce-documents-only': async (context) => withEnvironment(async (environment) => {
        await seed(environment, [
            ['orders/order-v2-document', {
                schemaVersion: 2,
                userId: 'owner-v2-document'
            }],
            ['orders/order-v2-document/documents/payment-proof', {
                schemaVersion: 2,
                kind: 'sandbox_payment_receipt'
            }]
        ]);
        const owner = environment.authenticatedContext('owner-v2-document').firestore();
        const stranger = environment.authenticatedContext('stranger-v2-document').firestore();
        const documentPath = 'orders/order-v2-document/documents/payment-proof';
        await assertSucceeds(getDoc(doc(owner, documentPath)));
        await assertFails(getDoc(doc(stranger, documentPath)));
        await assertFails(setDoc(doc(owner, `${documentPath}-write`), { schemaVersion: 2 }));
        context.ok(true, 'only the order owner can read immutable generated documents');
    }),

    'commerce-v2-internal-collections-are-backend-only': async (context) => withEnvironment(async (environment) => {
        await seed(environment, [['sys_admin_access/admin-v2', { active: true }]]);
        const admin = strongAdmin(environment).firestore();
        const collections = [
            'inventory_reservations',
            'inventory_movements',
            'commerce_webhook_inbox',
            'commerce_outbox',
            'commerce_incidents',
            'commerce_financial_facts',
            'commerce_financial_projections',
            'commerce_release_manifests',
            'commerce_order_access_tokens',
            'commerce_checkout_identities',
            'commerce_connect_accounts',
            'commerce_return_allocations',
            'commerce_fixture_scopes'
        ];
        for (const collection of collections) {
            const documentPath = `${collection}/proof`;
            await seed(environment, [[documentPath, { schemaVersion: 2 }]]);
            await assertFails(getDoc(doc(admin, documentPath)));
            await assertFails(setDoc(doc(admin, `${collection}/write-proof`), { schemaVersion: 2 }));
        }
        const productAuditPath = 'commerce_product_audits/furniture_product/events/proof';
        await seed(environment, [[productAuditPath, { schemaVersion: 2 }]]);
        await assertFails(getDoc(doc(admin, productAuditPath)));
        await assertFails(setDoc(doc(
            admin,
            'commerce_product_audits/furniture_product/events/write-proof'
        ), { schemaVersion: 2 }));
        await seed(environment, [['sys_commerce_operations/current', { status: 'healthy' }]]);
        await assertFails(getDoc(doc(admin, 'sys_commerce_operations/current')));
        await assertFails(setDoc(doc(admin, 'sys_commerce_operations/current'), { status: 'forged' }));
        context.ok(true, 'all v2 internal collections deny client and admin SDK access');
    }),

    'gate2-policy-is-private-and-public-projection-is-read-only': async (context) => withEnvironment(async (environment) => {
        await seed(environment, [
            ['sys_admin_access/admin-v2', { active: true }],
            ['commerce_policy_versions/policy-gate2', { schemaVersion: 2, active: true }],
            ['sys_commerce_public/current', {
                activePolicyVersion: 'policy-gate2',
                controlRevision: 2
            }]
        ]);
        const admin = strongAdmin(environment).firestore();
        const visitor = environment.unauthenticatedContext().firestore();
        await assertFails(getDoc(doc(admin, 'commerce_policy_versions/policy-gate2')));
        await assertFails(setDoc(doc(admin, 'commerce_policy_versions/policy-write'), { schemaVersion: 2 }));
        const publicSnapshot = await assertSucceeds(getDoc(doc(visitor, 'sys_commerce_public/current')));
        await assertFails(setDoc(doc(visitor, 'sys_commerce_public/current'), { activePolicyVersion: 'forged' }));
        context.equal(publicSnapshot.data().activePolicyVersion, 'policy-gate2', 'only sanitized projection is readable');
    })
};

module.exports = { scenarios };
