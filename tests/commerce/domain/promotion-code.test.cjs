'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    calculatePromotionDiscount,
    createNewsletterPromotion,
    createPromotionDefinition,
    normalizePromotionCode,
    promotionCodeHash
} = require('../../../functions/src/commerce/domain/promotionCode');
const {
    createPromotionHandlers
} = require('../../../functions/src/commerce/v2PromotionCodes');

const NOW = '2026-08-13T08:00:00.000Z';

test('promotion codes are normalized and hashed without trusting the browser', () => {
    assert.equal(normalizePromotionCode('  sv15-abcd23 '), 'SV15-ABCD23');
    assert.match(promotionCodeHash('SV15-ABCD23'), /^[a-f0-9]{64}$/);
    assert.throws(() => normalizePromotionCode('../admin'), /Code promotionnel invalide/);
});

test('admin promotions are bounded by dates, scope and usage limits', () => {
    const promotion = createPromotionDefinition({
        name: 'Sélection recette',
        code: 'RECETTE-15',
        percentage: 15,
        scopeType: 'products',
        productIds: ['product-eligible-0001'],
        maxRedemptions: 10,
        maxPerCustomer: 1,
        minSubtotalEuros: 50,
        maxDiscountEuros: 20,
        startsAt: '2026-08-13T00:00:00.000Z',
        expiresAt: '2026-09-13T00:00:00.000Z'
    }, { actorUid: 'admin-uid', now: NOW });
    const result = calculatePromotionDiscount(promotion, {
        ownerEmailHash: null,
        now: NOW,
        lines: [
            { productId: 'product-eligible-0001', unitAmountCents: 20_000, quantity: 1 },
            { productId: 'product-other-00002', unitAmountCents: 10_000, quantity: 1 }
        ]
    });
    assert.deepEqual(result, {
        discountCents: 2_000,
        eligibleCents: 20_000,
        eligibleProductIds: ['product-eligible-0001']
    });
    assert.equal(promotion.limits.maxPerCustomer, 1);
});

test('newsletter codes are single-use and bound to the claimed email', () => {
    const reward = {
        code: 'SV15-Z9K7PX',
        percentage: 15,
        emailHash: 'a'.repeat(64),
        status: 'active',
        createdAt: { toDate: () => new Date('2026-08-12T00:00:00.000Z') },
        expiresAt: { toDate: () => new Date('2026-09-12T00:00:00.000Z') }
    };
    const promotion = createNewsletterPromotion(reward, { rewardId: 'reward_123', now: NOW });
    assert.deepEqual(promotion.limits, { maxRedemptions: 1, maxPerCustomer: 1 });
    assert.throws(() => calculatePromotionDiscount(promotion, {
        ownerEmailHash: 'b'.repeat(64),
        now: NOW,
        lines: [{ productId: 'product-eligible-0001', unitAmountCents: 10_000, quantity: 1 }]
    }), (error) => error.code === 'COMMERCE_PROMOTION_AUDIENCE_DENIED');
});

test('expired, premature, irrelevant and excessive promotions fail closed', () => {
    const base = createPromotionDefinition({
        name: 'Code borné',
        code: 'BORNE-10',
        percentage: 10,
        scopeType: 'products',
        productIds: ['product-eligible-0001'],
        maxRedemptions: 5,
        maxPerCustomer: 1,
        minSubtotalEuros: 0,
        maxDiscountEuros: '',
        startsAt: '2026-08-13T09:00:00.000Z',
        expiresAt: '2026-08-14T09:00:00.000Z'
    }, { actorUid: 'admin-uid', now: NOW });
    assert.throws(() => calculatePromotionDiscount(base, {
        ownerEmailHash: null,
        now: NOW,
        lines: [{ productId: 'product-eligible-0001', unitAmountCents: 10_000, quantity: 1 }]
    }), (error) => error.code === 'COMMERCE_PROMOTION_NOT_STARTED');
    assert.throws(() => calculatePromotionDiscount({ ...base, startsAt: '2026-08-12T00:00:00.000Z' }, {
        ownerEmailHash: null,
        now: '2026-08-15T00:00:00.000Z',
        lines: [{ productId: 'product-eligible-0001', unitAmountCents: 10_000, quantity: 1 }]
    }), (error) => error.code === 'COMMERCE_PROMOTION_EXPIRED');
});

test('admin creation is authorized, control-plane gated and audited server-side', async () => {
    let created = null;
    let authorized = 0;
    let audited = null;
    const db = {
        doc: (documentPath) => ({ path: documentPath }),
        runTransaction: async (run) => run({
            get: async (ref) => ref.path === 'sys_commerce_control/current'
                ? { exists: true, data: () => ({ newCheckoutMode: 'v2_all', adminMutationMode: 'v2' }) }
                : { exists: false, data: () => null },
            create: (ref, value) => { created = { ref, value }; }
        })
    };
    const handlers = createPromotionHandlers({
        db,
        authorizeAdmin: async () => { authorized += 1; },
        audit: async (event, _context, details) => { audited = { event, details }; },
        now: () => NOW,
        codeFactory: () => 'SERVEUR-10'
    });
    const result = await handlers.createAdmin({
        name: 'Creation serveur',
        percentage: 10,
        scopeType: 'all',
        productIds: [],
        maxRedemptions: 5,
        maxPerCustomer: 1,
        minSubtotalEuros: 0,
        maxDiscountEuros: '',
        startsAt: '2026-08-13T00:00:00.000Z',
        expiresAt: '2026-09-13T00:00:00.000Z'
    }, { auth: { uid: 'admin-uid' } });
    assert.equal(authorized, 1);
    assert.equal(created.value.code, 'SERVEUR-10');
    assert.equal(created.ref.path, `commerce_promotion_codes/${created.value.codeHash}`);
    assert.equal(result.promotion.percentage, 10);
    assert.equal(audited.event, 'commerce.promotion_created');
    assert.equal(audited.details.promotionId, created.value.codeHash);
});
