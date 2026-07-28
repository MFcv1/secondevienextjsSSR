'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');
const {
    LEGACY_CLASSES,
    buildAdoptionPlan,
    buildClassificationLine,
    classifyLegacyOrder,
    sourceHash,
    summarizeClassification
} = require('../../../functions/src/commerce/domain/legacyClassification');
const {
    authorizeFixtureRequest,
    validateFixtureScope
} = require('../../../functions/src/commerce/domain/fixtureScope');
const { createInventoryKey } = require('../../../functions/src/commerce/domain/inventoryKey');

const paymentIntent = {
    id: 'pi_gate6_paid_0001',
    amount: 12500,
    currency: 'eur',
    status: 'succeeded'
};

function paidOrder(overrides = {}) {
    return {
        status: 'paid',
        total: 125,
        stripePaymentIntentId: paymentIntent.id,
        stripeConnectedAccountId: 'acct_gate6ready01',
        ...overrides
    };
}

test('Gate 6: la classification est deterministe, sans PII dans la ligne', () => {
    const order = paidOrder({ userEmail: 'client@example.test' });
    const input = {
        orderId: 'legacy-order-1',
        order,
        updateTime: new Date('2026-07-28T12:00:00.000Z'),
        stripeEvidence: {
            paymentIntent,
            connectedAccountId: 'acct_gate6ready01'
        }
    };
    const first = buildClassificationLine(input);
    const second = buildClassificationLine(input);
    assert.deepEqual(first, second);
    assert.equal(first.classification, LEGACY_CLASSES.NEEDS_REVIEW);
    assert.ok(first.reasons.includes('allocation_unproven'));
    assert.equal(Object.hasOwn(first, 'userEmail'), false);
    assert.equal(first.sourceHash, sourceHash(order));
});

test('Gate 6: un terminal annule prouve reste legacy read-only', () => {
    const result = classifyLegacyOrder({
        order: paidOrder({ status: 'canceled' }),
        stripeEvidence: {
            paymentIntent: { ...paymentIntent, status: 'canceled' },
            connectedAccountId: 'acct_gate6ready01'
        }
    });
    assert.equal(result.classification, LEGACY_CLASSES.READ_ONLY);
    assert.equal(result.terminal, true);
});

test('Gate 6: une preuve Stripe incomplete ne produit jamais safe_to_adopt', () => {
    const result = classifyLegacyOrder({
        order: paidOrder(),
        stripeEvidence: { error: 'not_found' }
    });
    assert.equal(result.classification, LEGACY_CLASSES.NEEDS_REVIEW);
    assert.equal(result.adoptionCandidate, false);
});

test('Gate 6: le plan adoption eventuel est idempotent et delta stock zero', () => {
    const line = buildClassificationLine({
        orderId: 'legacy-order-safe',
        order: paidOrder({ legacyAllocationProof: { verified: true } }),
        updateTime: new Date('2026-07-28T12:00:00.000Z'),
        stripeEvidence: {
            paymentIntent,
            connectedAccountId: 'acct_gate6ready01'
        }
    });
    assert.equal(line.classification, LEGACY_CLASSES.SAFE_TO_ADOPT);
    const first = buildAdoptionPlan(line);
    const second = buildAdoptionPlan(line);
    assert.deepEqual(first, second);
    assert.equal(first.inventory.deltaStock, 0);
    assert.equal(first.execution, 'deferred');
});

test('Gate 6: les compteurs imposent total source egal classes', () => {
    const lines = [
        { classification: LEGACY_CLASSES.READ_ONLY, terminal: true },
        { classification: LEGACY_CLASSES.SAFE_TO_ADOPT, terminal: false },
        { classification: LEGACY_CLASSES.NEEDS_REVIEW, terminal: false }
    ];
    assert.deepEqual(summarizeClassification(lines), {
        source: 3,
        legacy_terminal_read_only: 1,
        safe_to_adopt: 1,
        needs_review: 1,
        nonTerminal: 2,
        nonTerminalUnclassified: 0
    });
});

function fixtureScope(overrides = {}) {
    const fixtureProduct = {
        collectionName: 'furniture',
        productId: 'fixture_gate6_stock1_01',
        variantId: null
    };
    return {
        schemaVersion: 2,
        fixtureScopeVersion: 'fixture_gate6_20260728',
        environment: 'sandbox',
        projectId: 'secondevienextjsssr',
        policyVersion: 'fixture_policy_20260728',
        active: true,
        uids: ['fixtureUidGate60001'],
        inventoryKeys: [createInventoryKey(fixtureProduct)],
        fixtureProducts: [fixtureProduct],
        expiresAt: '2026-08-15T00:00:00.000Z',
        ...overrides
    };
}

test('Gate 6: le registre fixture est borne et strictement lie aux fixtures', () => {
    const scope = validateFixtureScope(fixtureScope(), {
        now: new Date('2026-07-28T00:00:00.000Z')
    });
    assert.equal(scope.active, true);
    assert.match(scope.scopeHash, /^[a-f0-9]{64}$/);
    assert.equal(authorizeFixtureRequest(scope, {
        uid: 'fixtureUidGate60001',
        inventoryKeys: scope.inventoryKeys,
        fixtureScopeVersion: scope.fixtureScopeVersion,
        runId: 'run_gate6_0001',
        now: new Date('2026-07-28T00:00:00.000Z')
    }).fixtureScopeVersion, scope.fixtureScopeVersion);
});

test('Gate 6: un scope ne peut pas viser un inventoryKey client', () => {
    assert.throws(
        () => validateFixtureScope(fixtureScope({
            fixtureProducts: [{
                collectionName: 'furniture',
                productId: 'client_product_01',
                variantId: null
            }]
        }), {
            now: new Date('2026-07-28T00:00:00.000Z')
        }),
        /COMMERCE_FIXTURE_SCOPE_INVALID/
    );
});

test('Gate 6: le classificateur refuse un mode ecriture sans confirmation', () => {
    const result = spawnSync(process.execPath, [
        path.resolve('scripts/classify-legacy-commerce.mjs'),
        '--project=secondevienextjsssr',
        '--env=sandbox',
        '--commit',
        '--backup=package.json'
    ], {
        cwd: process.cwd(),
        encoding: 'utf8'
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Le mode ecriture exige --confirm/);
});

test('Gate 6: les outils refusent toute cible autre que le sandbox exact', () => {
    const result = spawnSync(process.execPath, [
        path.resolve('scripts/prepare-commerce-fixtures.mjs'),
        '--project=production-interdite',
        '--env=production',
        '--backup=package.json'
    ], {
        cwd: process.cwd(),
        encoding: 'utf8'
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /GATE6_TARGET_MUST_BE_EXACT_SANDBOX/);
});
