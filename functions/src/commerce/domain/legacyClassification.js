'use strict';

const crypto = require('node:crypto');
const { canonicalize, hashPayload } = require('./idempotency');

const LEGACY_CLASSES = Object.freeze({
    READ_ONLY: 'legacy_terminal_read_only',
    SAFE_TO_ADOPT: 'safe_to_adopt',
    NEEDS_REVIEW: 'needs_review'
});

const TERMINAL_STATUSES = new Set([
    'canceled',
    'cancelled',
    'completed',
    'refunded',
    'shipped'
]);

const FINANCIAL_STATUSES = new Set([
    'canceled',
    'cancelled',
    'completed',
    'paid',
    'payment_failed',
    'pending_payment',
    'refund_failed',
    'refund_pending',
    'refunded',
    'shipped'
]);

function classificationError(code, detail) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function normalizeStatus(value) {
    return typeof value === 'string'
        ? value.normalize('NFC').trim().toLowerCase()
        : 'unknown';
}

function timestampValue(value) {
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }
    if (value instanceof Date) return value.toISOString();
    return value;
}

function normalizeForHash(value) {
    const timestamp = timestampValue(value);
    if (timestamp !== value) return timestamp;
    if (Array.isArray(value)) return value.map(normalizeForHash);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([key, entry]) => [key, normalizeForHash(entry)])
        );
    }
    return value;
}

function sourceHash(order) {
    return crypto
        .createHash('sha256')
        .update(canonicalize(normalizeForHash(order)))
        .digest('hex');
}

function expectedAmountCents(order) {
    if (Number.isSafeInteger(order?.totalCents)) return order.totalCents;
    if (Number.isFinite(order?.total)) return Math.round(Number(order.total) * 100);
    return null;
}

function validateStripeEvidence(order, evidence) {
    const reasons = [];
    const paymentIntentId = order?.stripePaymentIntentId || null;
    const connectedAccountId = order?.stripeConnectedAccountId || null;
    if (!paymentIntentId) return { valid: false, reasons: ['payment_intent_missing'] };
    if (!evidence || evidence.error || !evidence.paymentIntent) {
        return {
            valid: false,
            reasons: [evidence?.error ? 'stripe_read_failed' : 'stripe_evidence_missing']
        };
    }
    const paymentIntent = evidence.paymentIntent;
    if (paymentIntent.id !== paymentIntentId) reasons.push('payment_intent_mismatch');
    const amountCents = expectedAmountCents(order);
    if (amountCents === null) reasons.push('amount_unproven');
    else if (paymentIntent.amount !== amountCents) reasons.push('amount_mismatch');
    if (String(paymentIntent.currency || '').toUpperCase() !== 'EUR') {
        reasons.push('currency_mismatch');
    }
    if ((evidence.connectedAccountId || null) !== connectedAccountId) {
        reasons.push('connected_account_mismatch');
    }
    return { valid: reasons.length === 0, reasons };
}

function classifyLegacyOrder({ order, stripeEvidence = null }) {
    if (!order || typeof order !== 'object' || Array.isArray(order)) {
        throw classificationError('COMMERCE_LEGACY_ORDER_INVALID');
    }
    if (order.schemaVersion === 2) {
        throw classificationError('COMMERCE_LEGACY_ORDER_V2_FORBIDDEN');
    }
    const status = normalizeStatus(order.status);
    const reasons = [];
    const stripe = FINANCIAL_STATUSES.has(status)
        ? validateStripeEvidence(order, stripeEvidence)
        : { valid: false, reasons: ['financial_status_unknown'] };
    reasons.push(...stripe.reasons);

    if (['canceled', 'cancelled'].includes(status) && stripe.valid) {
        if (stripeEvidence.paymentIntent.status !== 'canceled') {
            reasons.push('payment_intent_not_canceled');
        } else {
            return {
                classification: LEGACY_CLASSES.READ_ONLY,
                status,
                terminal: true,
                reasons: ['terminal_canceled_proved'],
                adoptionCandidate: false
            };
        }
    }

    if (['completed', 'shipped'].includes(status) && stripe.valid) {
        if (stripeEvidence.paymentIntent.status === 'succeeded') {
            return {
                classification: LEGACY_CLASSES.READ_ONLY,
                status,
                terminal: true,
                reasons: [`terminal_${status}_legacy_fulfillment`],
                adoptionCandidate: false
            };
        }
        reasons.push('payment_not_succeeded');
    }

    if (status === 'refunded') {
        reasons.push('refund_and_physical_disposition_require_review');
    }
    if (['pending_payment', 'paid'].includes(status) && stripe.valid) {
        const expectedStripeStatus = status === 'paid' ? 'succeeded' : null;
        if (expectedStripeStatus && stripeEvidence.paymentIntent.status !== expectedStripeStatus) {
            reasons.push('stripe_status_mismatch');
        } else if (order.legacyAllocationProof?.verified === true) {
            return {
                classification: LEGACY_CLASSES.SAFE_TO_ADOPT,
                status,
                terminal: false,
                reasons: ['stripe_and_allocation_proved'],
                adoptionCandidate: true
            };
        } else {
            reasons.push('allocation_unproven');
        }
    }

    if (!FINANCIAL_STATUSES.has(status)) reasons.push('legacy_status_unknown');
    return {
        classification: LEGACY_CLASSES.NEEDS_REVIEW,
        status,
        terminal: TERMINAL_STATUSES.has(status),
        reasons: [...new Set(reasons.length ? reasons : ['manual_review_required'])].sort(),
        adoptionCandidate: false
    };
}

function buildClassificationLine({
    orderId,
    order,
    updateTime,
    stripeEvidence = null
}) {
    if (typeof orderId !== 'string' || !orderId) {
        throw classificationError('COMMERCE_LEGACY_ORDER_ID_INVALID');
    }
    const hash = sourceHash(order);
    const result = classifyLegacyOrder({ order, stripeEvidence });
    return Object.freeze({
        orderId,
        sourceHash: hash,
        sourceUpdateTime: timestampValue(updateTime) || null,
        precondition: {
            sourceHash: hash,
            sourceUpdateTime: timestampValue(updateTime) || null
        },
        ...result
    });
}

function buildAdoptionPlan(line) {
    if (line?.classification !== LEGACY_CLASSES.SAFE_TO_ADOPT) {
        throw classificationError('COMMERCE_LEGACY_ADOPTION_NOT_SAFE');
    }
    const effectId = hashPayload({
        type: 'legacy_adoption',
        orderId: line.orderId,
        sourceHash: line.sourceHash
    });
    return Object.freeze({
        schemaVersion: 2,
        orderId: line.orderId,
        precondition: { ...line.precondition },
        inventory: {
            deltaStock: 0,
            effectId,
            reason: 'legacy_allocation_already_applied'
        },
        execution: 'deferred'
    });
}

function summarizeClassification(lines) {
    const counters = {
        source: lines.length,
        legacy_terminal_read_only: 0,
        safe_to_adopt: 0,
        needs_review: 0,
        nonTerminal: 0,
        nonTerminalUnclassified: 0
    };
    for (const line of lines) {
        if (Object.hasOwn(counters, line.classification)) counters[line.classification] += 1;
        if (!line.terminal) counters.nonTerminal += 1;
        if (!line.terminal && !Object.values(LEGACY_CLASSES).includes(line.classification)) {
            counters.nonTerminalUnclassified += 1;
        }
    }
    const classified = counters.legacy_terminal_read_only +
        counters.safe_to_adopt +
        counters.needs_review;
    if (classified !== counters.source) {
        throw classificationError('COMMERCE_LEGACY_CLASSIFICATION_TOTAL_MISMATCH');
    }
    return counters;
}

module.exports = {
    FINANCIAL_STATUSES,
    LEGACY_CLASSES,
    buildAdoptionPlan,
    buildClassificationLine,
    classifyLegacyOrder,
    normalizeForHash,
    normalizeStatus,
    sourceHash,
    summarizeClassification,
    validateStripeEvidence
};
