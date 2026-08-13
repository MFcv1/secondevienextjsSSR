'use strict';

const crypto = require('node:crypto');

const MAX_PERCENTAGE = 50;
const MAX_REDEMPTIONS = 100_000;

function promotionError(code, message = code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function normalizePromotionCode(value) {
    const code = String(value || '').normalize('NFKC').trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{4,31}$/.test(code)) {
        throw promotionError('COMMERCE_PROMOTION_CODE_INVALID', 'Code promotionnel invalide.');
    }
    return code;
}

function promotionCodeHash(value) {
    return crypto.createHash('sha256').update(normalizePromotionCode(value)).digest('hex');
}

function normalizeProductIds(value) {
    if (!Array.isArray(value)) throw promotionError('COMMERCE_PROMOTION_SCOPE_INVALID');
    const ids = [...new Set(value.map((item) => String(item || '').trim()))].sort();
    if (ids.length === 0 || ids.length > 100 || ids.some((id) => !/^[A-Za-z0-9_-]{8,160}$/.test(id))) {
        throw promotionError('COMMERCE_PROMOTION_SCOPE_INVALID');
    }
    return ids;
}

function normalizeIso(value, field, { nullable = false } = {}) {
    if ((value === null || value === undefined || value === '') && nullable) return null;
    const millis = Date.parse(value);
    if (!Number.isSafeInteger(millis)) throw promotionError('COMMERCE_PROMOTION_DATE_INVALID', field);
    return new Date(millis).toISOString();
}

function createPromotionDefinition(input, { actorUid, now, codeFactory = null } = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw promotionError('COMMERCE_PROMOTION_INPUT_INVALID');
    }
    const generated = typeof codeFactory === 'function' ? codeFactory() : input.code;
    const code = normalizePromotionCode(input.code || generated);
    const name = String(input.name || '').normalize('NFC').trim();
    const percentage = Number(input.percentage);
    const scopeType = input.scopeType === 'products' ? 'products' : 'all';
    const maxRedemptions = Number(input.maxRedemptions);
    const maxPerCustomer = Number(input.maxPerCustomer);
    const minSubtotalCents = Math.round(Number(input.minSubtotalEuros || 0) * 100);
    const maxDiscountCents = input.maxDiscountEuros === '' || input.maxDiscountEuros == null
        ? null
        : Math.round(Number(input.maxDiscountEuros) * 100);
    const startsAt = normalizeIso(input.startsAt || now, 'startsAt');
    const expiresAt = normalizeIso(input.expiresAt, 'expiresAt');
    if (!name || name.length > 120) throw promotionError('COMMERCE_PROMOTION_NAME_INVALID');
    if (!Number.isInteger(percentage) || percentage < 1 || percentage > MAX_PERCENTAGE) {
        throw promotionError('COMMERCE_PROMOTION_PERCENTAGE_INVALID');
    }
    if (!Number.isInteger(maxRedemptions) || maxRedemptions < 1 || maxRedemptions > MAX_REDEMPTIONS) {
        throw promotionError('COMMERCE_PROMOTION_LIMIT_INVALID');
    }
    if (!Number.isInteger(maxPerCustomer) || maxPerCustomer < 1 || maxPerCustomer > maxRedemptions) {
        throw promotionError('COMMERCE_PROMOTION_CUSTOMER_LIMIT_INVALID');
    }
    if (!Number.isSafeInteger(minSubtotalCents) || minSubtotalCents < 0) {
        throw promotionError('COMMERCE_PROMOTION_MINIMUM_INVALID');
    }
    if (maxDiscountCents !== null && (!Number.isSafeInteger(maxDiscountCents) || maxDiscountCents < 1)) {
        throw promotionError('COMMERCE_PROMOTION_CAP_INVALID');
    }
    if (Date.parse(expiresAt) <= Date.parse(startsAt)) {
        throw promotionError('COMMERCE_PROMOTION_DATE_INVALID');
    }
    return {
        schemaVersion: 1,
        code,
        codeHash: promotionCodeHash(code),
        name,
        source: 'admin',
        status: 'active',
        discount: { type: 'percentage', percentage },
        scope: {
            type: scopeType,
            productIds: scopeType === 'products' ? normalizeProductIds(input.productIds) : []
        },
        audience: { type: 'public' },
        limits: { maxRedemptions, maxPerCustomer },
        constraints: { minSubtotalCents, maxDiscountCents },
        usage: { reserved: 0, committed: 0 },
        startsAt,
        expiresAt,
        createdBy: actorUid,
        createdAt: now,
        updatedAt: now
    };
}

function createNewsletterPromotion(reward, { rewardId, now }) {
    const code = normalizePromotionCode(reward?.code);
    const percentage = Number(reward?.percentage);
    const expiresAt = typeof reward?.expiresAt?.toDate === 'function'
        ? reward.expiresAt.toDate().toISOString()
        : normalizeIso(reward?.expiresAt, 'expiresAt');
    if (![5, 10, 15].includes(percentage) || !/^[a-f0-9]{64}$/.test(String(reward?.emailHash || ''))) {
        throw promotionError('COMMERCE_PROMOTION_NEWSLETTER_INVALID');
    }
    return {
        schemaVersion: 1,
        code,
        codeHash: promotionCodeHash(code),
        name: `Avantage newsletter ${percentage} %`,
        source: 'newsletter',
        sourceRewardId: rewardId,
        status: reward.status === 'active' ? 'active' : 'inactive',
        discount: { type: 'percentage', percentage },
        scope: { type: 'all', productIds: [] },
        audience: { type: 'email', emailHash: reward.emailHash },
        limits: { maxRedemptions: 1, maxPerCustomer: 1 },
        constraints: { minSubtotalCents: 0, maxDiscountCents: null },
        usage: { reserved: 0, committed: 0 },
        startsAt: typeof reward?.createdAt?.toDate === 'function'
            ? reward.createdAt.toDate().toISOString()
            : (reward.createdAt || now),
        expiresAt,
        createdBy: 'newsletter_reward',
        createdAt: now,
        updatedAt: now
    };
}

function millis(value) {
    if (typeof value?.toMillis === 'function') return value.toMillis();
    return Date.parse(value);
}

function calculatePromotionDiscount(promotion, { lines, ownerEmailHash, now }) {
    if (promotion?.schemaVersion !== 1 || promotion.status !== 'active') {
        throw promotionError('COMMERCE_PROMOTION_INACTIVE');
    }
    const nowMillis = Date.parse(now);
    if (nowMillis < millis(promotion.startsAt)) throw promotionError('COMMERCE_PROMOTION_NOT_STARTED');
    if (nowMillis >= millis(promotion.expiresAt)) throw promotionError('COMMERCE_PROMOTION_EXPIRED');
    if (promotion.audience?.type === 'email' && promotion.audience.emailHash !== ownerEmailHash) {
        throw promotionError('COMMERCE_PROMOTION_AUDIENCE_DENIED');
    }
    const allowed = new Set(promotion.scope?.productIds || []);
    const eligibleLines = (lines || []).filter((line) => (
        promotion.scope?.type === 'all' || allowed.has(line.productId)
    ));
    const eligibleCents = eligibleLines.reduce(
        (sum, line) => sum + (line.unitAmountCents * line.quantity),
        0
    );
    if (eligibleCents <= 0) throw promotionError('COMMERCE_PROMOTION_NOT_APPLICABLE');
    if (eligibleCents < Number(promotion.constraints?.minSubtotalCents || 0)) {
        throw promotionError('COMMERCE_PROMOTION_MINIMUM_NOT_REACHED');
    }
    let discountCents = Math.floor(
        eligibleCents * Number(promotion.discount?.percentage || 0) / 100
    );
    const cap = promotion.constraints?.maxDiscountCents;
    if (Number.isSafeInteger(cap)) discountCents = Math.min(discountCents, cap);
    if (!Number.isSafeInteger(discountCents) || discountCents <= 0 || discountCents > eligibleCents) {
        throw promotionError('COMMERCE_PROMOTION_DISCOUNT_INVALID');
    }
    return { discountCents, eligibleCents, eligibleProductIds: [...new Set(eligibleLines.map((line) => line.productId))] };
}

module.exports = {
    calculatePromotionDiscount,
    createNewsletterPromotion,
    createPromotionDefinition,
    normalizePromotionCode,
    promotionCodeHash
};
