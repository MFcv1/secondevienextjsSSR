'use strict';

const BILLING_GUIDE_MODES = Object.freeze(['disabled', 'test', 'live', 'completed']);
const BILLING_GUIDE_STEPS = Object.freeze([
    'welcome',
    'google_billing',
    'billing_id',
    'technical_access',
    'waiting_for_operator'
]);

const BILLING_ACCOUNT_ID_PATTERN = /^[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$/;

function normalizeBillingGuideMode(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return BILLING_GUIDE_MODES.includes(normalized) ? normalized : 'disabled';
}

function normalizeBillingGuideStep(value) {
    const normalized = String(value || '').trim();
    if (!BILLING_GUIDE_STEPS.includes(normalized)) {
        throw new TypeError('Etape onboarding inconnue.');
    }
    return normalized;
}

function getBillingGuideStepRank(stepId) {
    return BILLING_GUIDE_STEPS.indexOf(normalizeBillingGuideStep(stepId));
}

function normalizeBillingAccountId(value) {
    const normalized = String(value || '').trim().toUpperCase();
    if (!BILLING_ACCOUNT_ID_PATTERN.test(normalized)) {
        throw new TypeError('Identifiant de compte de facturation invalide.');
    }
    return normalized;
}

function isBillingGuideEligible({ mode, isSuperAdmin, uid, testUid, liveUid }) {
    const normalizedMode = normalizeBillingGuideMode(mode);
    if (isSuperAdmin || !uid) return false;
    if (normalizedMode === 'test') return Boolean(testUid) && uid === testUid;
    if (normalizedMode === 'live') return Boolean(liveUid) && uid === liveUid;
    return false;
}

function assertBillingGuideTransition({ currentRank = 0, furthestRank = 0, nextStepId }) {
    const nextRank = getBillingGuideStepRank(nextStepId);
    const safeFurthestRank = Math.max(Number(currentRank) || 0, Number(furthestRank) || 0);
    if (nextRank > safeFurthestRank + 1) {
        throw new TypeError('Les etapes doivent etre validees dans l ordre.');
    }
    return nextRank;
}

module.exports = {
    BILLING_ACCOUNT_ID_PATTERN,
    BILLING_GUIDE_MODES,
    BILLING_GUIDE_STEPS,
    assertBillingGuideTransition,
    getBillingGuideStepRank,
    isBillingGuideEligible,
    normalizeBillingAccountId,
    normalizeBillingGuideMode,
    normalizeBillingGuideStep
};
