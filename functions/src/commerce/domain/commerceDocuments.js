'use strict';

const { deterministicEffectId } = require('./commerceEffects');
const { hashPayload } = require('./idempotency');

function documentError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot?.exists === 'function'
        ? snapshot.exists()
        : snapshot?.exists === true;
}

function shouldCreateImmutableDocument(snapshot, document) {
    if (!snapshotExists(snapshot)) return true;
    const existing = snapshot.data();
    if (
        existing?.documentId !== document.documentId ||
        existing?.orderId !== document.orderId ||
        existing?.ownerUid !== document.ownerUid ||
        existing?.kind !== document.kind ||
        existing?.contentHash !== document.contentHash
    ) {
        throw documentError('COMMERCE_DOCUMENT_IMMUTABILITY_CONFLICT');
    }
    return false;
}

function assertOrder(order) {
    if (
        !order ||
        order.schemaVersion !== 2 ||
        typeof order.id !== 'string' ||
        typeof order.userId !== 'string' ||
        order.currency !== 'EUR'
    ) {
        throw documentError('COMMERCE_DOCUMENT_ORDER_INVALID');
    }
}

function factsForOrder(facts, orderId, type) {
    return facts.filter((fact) => (
        fact?.schemaVersion === 2 &&
        fact.orderId === orderId &&
        fact.type === type &&
        Number.isSafeInteger(fact.amountCents) &&
        fact.amountCents > 0
    ));
}

function buildPaymentReceipt({ order, facts, issuedAt }) {
    assertOrder(order);
    const captures = factsForOrder(facts, order.id, 'capture');
    const capturedCents = captures.reduce((sum, fact) => sum + fact.amountCents, 0);
    if (order.payment?.status !== 'succeeded' || capturedCents <= 0) {
        throw documentError('COMMERCE_PAYMENT_RECEIPT_NOT_ADMISSIBLE');
    }
    const sourceEffectIds = captures.map((fact) => fact.effectId).sort();
    const documentId = deterministicEffectId(['sandbox-payment-receipt', order.id, ...sourceEffectIds]);
    const content = {
        schemaVersion: 2,
        documentId,
        orderId: order.id,
        ownerUid: order.userId,
        kind: 'sandbox_payment_receipt',
        legalStatus: 'non_fiscal_sandbox',
        currency: order.currency,
        capturedCents,
        sourceEffectIds,
        issuedAt
    };
    return Object.freeze({ ...content, contentHash: hashPayload(content) });
}

function buildRefundConfirmation({ order, facts, refundId, issuedAt }) {
    assertOrder(order);
    if (typeof refundId !== 'string' || !refundId) {
        throw documentError('COMMERCE_REFUND_CONFIRMATION_INVALID');
    }
    const refunds = factsForOrder(facts, order.id, 'refund')
        .filter((fact) => fact.providerObjectId === refundId);
    const refundedCents = refunds.reduce((sum, fact) => sum + fact.amountCents, 0);
    if (refundedCents <= 0) {
        throw documentError('COMMERCE_REFUND_CONFIRMATION_NOT_ADMISSIBLE');
    }
    const sourceEffectIds = refunds.map((fact) => fact.effectId).sort();
    const documentId = deterministicEffectId([
        'sandbox-refund-confirmation',
        order.id,
        refundId,
        ...sourceEffectIds
    ]);
    const content = {
        schemaVersion: 2,
        documentId,
        orderId: order.id,
        ownerUid: order.userId,
        kind: 'sandbox_refund_confirmation',
        legalStatus: 'non_fiscal_sandbox',
        currency: order.currency,
        refundedCents,
        providerRefundId: refundId,
        sourceEffectIds,
        fulfillmentPreserved: true,
        issuedAt
    };
    return Object.freeze({ ...content, contentHash: hashPayload(content) });
}

module.exports = {
    buildPaymentReceipt,
    buildRefundConfirmation,
    shouldCreateImmutableDocument
};
