'use strict';

const SAFE_CONTROL = Object.freeze({
    newCheckoutMode: 'off',
    legacyMode: 'reconcile_only',
    adminMutationMode: 'read_only',
    offlinePaymentMode: 'off',
    activePolicyVersion: null,
    fixtureScopeVersion: null,
    fixtureScopeRef: null,
    controlRevision: null
});

const CONTROL_VALUES = Object.freeze({
    newCheckoutMode: new Set(['off', 'v2_fixture', 'v2_all']),
    legacyMode: new Set(['reconcile_only', 'disabled']),
    adminMutationMode: new Set(['read_only', 'v2']),
    offlinePaymentMode: new Set(['off', 'v2'])
});

function policyError(code, field) {
    const error = new Error(field ? `${code}:${field}` : code);
    error.code = code;
    if (field) error.field = field;
    return error;
}

function isCompleteControl(value) {
    return Boolean(
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        CONTROL_VALUES.newCheckoutMode.has(value.newCheckoutMode) &&
        CONTROL_VALUES.legacyMode.has(value.legacyMode) &&
        CONTROL_VALUES.adminMutationMode.has(value.adminMutationMode) &&
        CONTROL_VALUES.offlinePaymentMode.has(value.offlinePaymentMode) &&
        Number.isSafeInteger(value.controlRevision) &&
        value.controlRevision >= 0
    );
}

function normalizeCommerceControl(value) {
    if (!isCompleteControl(value)) return { ...SAFE_CONTROL };
    return {
        newCheckoutMode: value.newCheckoutMode,
        legacyMode: value.legacyMode,
        adminMutationMode: value.adminMutationMode,
        offlinePaymentMode: value.offlinePaymentMode,
        activePolicyVersion: value.activePolicyVersion || null,
        fixtureScopeVersion: value.fixtureScopeVersion || null,
        fixtureScopeRef: value.fixtureScopeRef || null,
        controlRevision: value.controlRevision
    };
}

function mayCreateV2Checkout(control, { fixture = false } = {}) {
    const normalized = normalizeCommerceControl(control);
    if (!normalized.activePolicyVersion) return false;
    if (normalized.newCheckoutMode === 'v2_all') return true;
    return fixture && normalized.newCheckoutMode === 'v2_fixture' && Boolean(normalized.fixtureScopeVersion);
}

function validateCommercePolicy(policy) {
    if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
        throw policyError('COMMERCE_POLICY_INVALID');
    }
    if (
        policy.schemaVersion !== 2 ||
        typeof policy.version !== 'string' ||
        !/^[A-Za-z0-9_-]{3,80}$/.test(policy.version) ||
        policy.active !== true ||
        policy.currency !== 'EUR' ||
        policy.offlinePaymentEnabled !== false
    ) {
        throw policyError('COMMERCE_POLICY_INVALID');
    }
    if (
        typeof policy.stripeConnectedAccountId !== 'string' ||
        !/^acct_[A-Za-z0-9]{8,}$/.test(policy.stripeConnectedAccountId)
    ) {
        throw policyError('COMMERCE_POLICY_CONNECT_INVALID');
    }
    if (!Array.isArray(policy.deliveryModes) || policy.deliveryModes.length === 0 || policy.deliveryModes.length > 10) {
        throw policyError('COMMERCE_POLICY_DELIVERY_INVALID');
    }
    const modeIds = new Set();
    for (const mode of policy.deliveryModes) {
        if (
            !mode ||
            typeof mode.id !== 'string' ||
            !/^[A-Za-z0-9_-]{3,80}$/.test(mode.id) ||
            modeIds.has(mode.id) ||
            typeof mode.active !== 'boolean' ||
            !Number.isSafeInteger(mode.shippingCents) ||
            mode.shippingCents < 0 ||
            !Array.isArray(mode.countries) ||
            mode.countries.length === 0 ||
            mode.countries.some((country) => !/^[A-Z]{2}$/.test(country)) ||
            (mode.postalPrefixes !== undefined && (
                !Array.isArray(mode.postalPrefixes) ||
                mode.postalPrefixes.some((prefix) => typeof prefix !== 'string' || prefix.length < 1 || prefix.length > 12)
            ))
        ) {
            throw policyError('COMMERCE_POLICY_DELIVERY_INVALID', mode?.id || 'unknown');
        }
        modeIds.add(mode.id);
    }
    return true;
}

function resolvePolicyForCheckout(control, policy, { fixture = false } = {}) {
    if (!mayCreateV2Checkout(control, { fixture })) {
        throw policyError('COMMERCE_CHECKOUT_MODE_OFF');
    }
    validateCommercePolicy(policy);
    const normalizedControl = normalizeCommerceControl(control);
    if (normalizedControl.activePolicyVersion !== policy.version) {
        throw policyError('COMMERCE_POLICY_VERSION_MISMATCH');
    }
    return policy;
}

function resolveDelivery(policy, deliveryModeId, address) {
    validateCommercePolicy(policy);
    const mode = policy.deliveryModes.find((entry) => entry.id === deliveryModeId);
    if (!mode || mode.active !== true) throw policyError('COMMERCE_DELIVERY_MODE_INACTIVE');
    if (!mode.countries.includes(address.country)) throw policyError('COMMERCE_DELIVERY_OUT_OF_ZONE');
    if (
        Array.isArray(mode.postalPrefixes) &&
        mode.postalPrefixes.length > 0 &&
        !mode.postalPrefixes.some((prefix) => address.postalCode.startsWith(prefix))
    ) {
        throw policyError('COMMERCE_DELIVERY_OUT_OF_ZONE');
    }
    return {
        id: mode.id,
        shippingCents: mode.shippingCents,
        policyVersion: policy.version
    };
}

function assertPinnedPolicy(order, policy) {
    validateCommercePolicy(policy);
    if (order.checkout?.policyVersion !== policy.version) {
        throw policyError('COMMERCE_POLICY_PIN_MISMATCH');
    }
    return true;
}

module.exports = {
    SAFE_CONTROL,
    assertPinnedPolicy,
    isCompleteControl,
    mayCreateV2Checkout,
    normalizeCommerceControl,
    resolveDelivery,
    resolvePolicyForCheckout,
    validateCommercePolicy
};
