'use strict';

const crypto = require('node:crypto');

const REWARD_PERCENTAGES = Object.freeze([5, 10, 15]);
const REWARD_WEIGHTS = Object.freeze([
    { percentage: 5, ceiling: 55 },
    { percentage: 10, ceiling: 85 },
    { percentage: 15, ceiling: 100 }
]);

function domainError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function normalizeEmail(value) {
    const email = String(value || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        throw domainError('NEWSLETTER_EMAIL_INVALID', 'Adresse e-mail invalide.');
    }
    return email;
}

function normalizePlayId(value) {
    const playId = String(value || '').trim().toLowerCase();
    if (!/^[a-f0-9-]{32,64}$/.test(playId)) {
        throw domainError('NEWSLETTER_PLAY_ID_INVALID', 'Partie invalide.');
    }
    return playId;
}

function normalizeCardIndex(value) {
    const cardIndex = Number(value);
    if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex > 2) {
        throw domainError('NEWSLETTER_CARD_INVALID', 'Carte invalide.');
    }
    return cardIndex;
}

function normalizeConsent(value) {
    if (value !== true) {
        throw domainError('NEWSLETTER_CONSENT_REQUIRED', 'Votre accord est nécessaire pour vous abonner.');
    }
    return true;
}

function sha256(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function rewardPlayId(playId) {
    return `play_${sha256(normalizePlayId(playId)).slice(0, 40)}`;
}

function rewardDocumentId(playId) {
    return `reward_${sha256(normalizePlayId(playId)).slice(0, 40)}`;
}

function subscriberDocumentId(email) {
    return `subscriber_${sha256(normalizeEmail(email)).slice(0, 40)}`;
}

function drawRewardPercentage(randomValue) {
    const value = Number(randomValue);
    if (!Number.isInteger(value) || value < 0 || value >= 100) {
        throw domainError('NEWSLETTER_RANDOM_INVALID', 'Tirage invalide.');
    }
    return REWARD_WEIGHTS.find((tier) => value < tier.ceiling)?.percentage || 5;
}

function createRewardCode(percentage, randomBytes = crypto.randomBytes) {
    if (!REWARD_PERCENTAGES.includes(Number(percentage))) {
        throw domainError('NEWSLETTER_REWARD_INVALID', 'Gain invalide.');
    }
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(6);
    let suffix = '';
    for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
    return `SV${Number(percentage)}-${suffix}`;
}

function serializeReward(id, reward = {}) {
    const toIso = (value) => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        if (typeof value.toDate === 'function') return value.toDate().toISOString();
        return null;
    };
    return {
        rewardId: id,
        code: String(reward.code || ''),
        percentage: Number(reward.percentage || 0),
        status: reward.status || 'active',
        campaign: reward.campaign || 'newsletter_welcome_2026',
        emailStatus: reward.emailDelivery?.status || 'pending',
        createdAt: toIso(reward.createdAt),
        expiresAt: toIso(reward.expiresAt)
    };
}

module.exports = {
    REWARD_PERCENTAGES,
    createRewardCode,
    drawRewardPercentage,
    normalizeCardIndex,
    normalizeConsent,
    normalizeEmail,
    normalizePlayId,
    rewardDocumentId,
    rewardPlayId,
    serializeReward,
    sha256,
    subscriberDocumentId
};
