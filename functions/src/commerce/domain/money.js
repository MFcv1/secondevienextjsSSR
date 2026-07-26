'use strict';

const AMOUNT_FIELDS = Object.freeze([
    'itemsCents',
    'shippingCents',
    'discountCents',
    'taxCents',
    'totalCents',
    'capturedCents',
    'refundedCents',
    'netCents'
]);

function moneyError(code, field) {
    const error = new Error(field ? `${code}:${field}` : code);
    error.code = code;
    if (field) error.field = field;
    return error;
}

function assertCents(value, field, { allowNegative = false } = {}) {
    if (!Number.isSafeInteger(value) || (!allowNegative && value < 0)) {
        throw moneyError('COMMERCE_MONEY_INVALID_CENTS', field);
    }
    return value;
}

function eurosToCents(value, field = 'amount') {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
        throw moneyError('COMMERCE_MONEY_INVALID_EUROS', field);
    }
    const cents = Math.round(numeric * 100);
    if (!Number.isSafeInteger(cents) || Math.abs(numeric - (cents / 100)) > 1e-9) {
        throw moneyError('COMMERCE_MONEY_INVALID_EUROS', field);
    }
    return cents;
}

function buildAmounts({
    itemsCents,
    shippingCents = 0,
    discountCents = 0,
    taxCents = 0,
    capturedCents = 0,
    refundedCents = 0
}) {
    for (const [field, value] of Object.entries({
        itemsCents,
        shippingCents,
        discountCents,
        taxCents,
        capturedCents,
        refundedCents
    })) {
        assertCents(value, field);
    }
    const totalCents = itemsCents + shippingCents + taxCents - discountCents;
    assertCents(totalCents, 'totalCents');
    const netCents = capturedCents - refundedCents;
    assertCents(netCents, 'netCents');
    const amounts = {
        itemsCents,
        shippingCents,
        discountCents,
        taxCents,
        totalCents,
        capturedCents,
        refundedCents,
        netCents
    };
    validateMoneyInvariants(amounts);
    return amounts;
}

function validateMoneyInvariants(amounts) {
    if (!amounts || typeof amounts !== 'object' || Array.isArray(amounts)) {
        throw moneyError('COMMERCE_MONEY_INVALID_SHAPE');
    }
    for (const field of AMOUNT_FIELDS) assertCents(amounts[field], field);

    const expectedTotal = amounts.itemsCents +
        amounts.shippingCents +
        amounts.taxCents -
        amounts.discountCents;
    if (expectedTotal !== amounts.totalCents) {
        throw moneyError('COMMERCE_MONEY_TOTAL_MISMATCH', 'totalCents');
    }
    if (amounts.refundedCents > amounts.capturedCents) {
        throw moneyError('COMMERCE_MONEY_REFUND_EXCEEDS_CAPTURE', 'refundedCents');
    }
    if (amounts.netCents !== amounts.capturedCents - amounts.refundedCents) {
        throw moneyError('COMMERCE_MONEY_NET_MISMATCH', 'netCents');
    }
    return true;
}

function assertHistoricalAmountsUnchanged(before, after) {
    for (const field of ['itemsCents', 'shippingCents', 'discountCents', 'taxCents', 'totalCents']) {
        if (before[field] !== after[field]) {
            throw moneyError('COMMERCE_MONEY_HISTORY_IMMUTABLE', field);
        }
    }
    return true;
}

module.exports = {
    AMOUNT_FIELDS,
    assertCents,
    assertHistoricalAmountsUnchanged,
    buildAmounts,
    eurosToCents,
    validateMoneyInvariants
};
