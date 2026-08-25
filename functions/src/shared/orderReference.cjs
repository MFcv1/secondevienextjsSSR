'use strict';

const ORDER_REFERENCE_UNAVAILABLE = 'Référence indisponible';
const ORDER_REFERENCE_PATTERN = /^(?:C|CMD-)?([1-9][0-9]{0,14})$/i;

function isValidOrderNumber(value) {
    return Number.isSafeInteger(value) && value > 0;
}

function formatOrderReference(orderNumber, fallback = ORDER_REFERENCE_UNAVAILABLE) {
    return isValidOrderNumber(orderNumber) ? `C${orderNumber}` : fallback;
}

function getOrderReference(order, fallback = ORDER_REFERENCE_UNAVAILABLE) {
    return formatOrderReference(order?.orderNumber, fallback);
}

function parseOrderReference(value) {
    const match = ORDER_REFERENCE_PATTERN.exec(String(value ?? '').trim());
    if (!match) return null;
    const orderNumber = Number(match[1]);
    return isValidOrderNumber(orderNumber) ? orderNumber : null;
}

module.exports = {
    ORDER_REFERENCE_UNAVAILABLE,
    formatOrderReference,
    getOrderReference,
    isValidOrderNumber,
    parseOrderReference
};
