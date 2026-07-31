'use strict';

const CARRIERS = Object.freeze({
    colissimo: Object.freeze({
        label: 'Colissimo / La Poste',
        trackingUrl: 'https://www.laposte.fr/outils/suivre-vos-envois'
    }),
    chronopost: Object.freeze({
        label: 'Chronopost',
        trackingUrl: 'https://www.chronopost.fr/fr/suivi-colis'
    }),
    mondial_relay: Object.freeze({
        label: 'Mondial Relay',
        trackingUrl: 'https://www.mondialrelay.fr/suivi-de-colis/'
    }),
    other: Object.freeze({
        label: 'Autre transporteur',
        trackingUrl: null
    })
});

function normalizeOptionalText(value, maxLength) {
    if (value == null) return null;
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    if (!normalized || normalized.length > maxLength) return null;
    return normalized;
}

function isCarrierCode(value) {
    return typeof value === 'string' && Object.hasOwn(CARRIERS, value);
}

function resolveShippingTracking(fulfillmentSummary = {}) {
    const trackingNumber = normalizeOptionalText(
        fulfillmentSummary.trackingNumber,
        120
    );
    if (!trackingNumber) {
        return Object.freeze({
            mode: 'untracked',
            carrierCode: null,
            carrierLabel: null,
            trackingNumber: null,
            trackingUrl: null
        });
    }
    const carrierCode = isCarrierCode(fulfillmentSummary.carrierCode)
        ? fulfillmentSummary.carrierCode
        : 'other';
    const carrier = CARRIERS[carrierCode];
    const customCarrierName = normalizeOptionalText(
        fulfillmentSummary.carrierName,
        80
    );
    return Object.freeze({
        mode: 'tracked',
        carrierCode,
        carrierLabel: carrierCode === 'other'
            ? (customCarrierName || carrier.label)
            : carrier.label,
        trackingNumber,
        trackingUrl: carrier.trackingUrl
    });
}

module.exports = {
    CARRIERS,
    isCarrierCode,
    resolveShippingTracking
};
