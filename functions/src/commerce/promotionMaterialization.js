'use strict';

const {
    createNewsletterPromotion,
    normalizePromotionCode,
    promotionCodeHash
} = require('./domain/promotionCode');

async function ensurePromotionMaterialized(db, rawCode, now = new Date().toISOString()) {
    const code = normalizePromotionCode(rawCode);
    const codeHash = promotionCodeHash(code);
    const promotionRef = db.doc(`commerce_promotion_codes/${codeHash}`);
    const existing = await promotionRef.get();
    if (existing.exists) return { code, codeHash };

    const rewards = await db.collection('newsletter_rewards')
        .where('code', '==', code)
        .limit(2)
        .get();
    if (rewards.size !== 1) return { code, codeHash };
    const rewardSnapshot = rewards.docs[0];
    const definition = createNewsletterPromotion(rewardSnapshot.data(), {
        rewardId: rewardSnapshot.id,
        now
    });
    try {
        await promotionRef.create(definition);
    } catch (error) {
        if (error?.code !== 6 && error?.code !== 'already-exists') throw error;
    }
    return { code, codeHash };
}

module.exports = { ensurePromotionMaterialized };
