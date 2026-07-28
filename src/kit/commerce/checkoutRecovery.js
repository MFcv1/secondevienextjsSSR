export const CHECKOUT_RECOVERY_CONTRACT_VERSION = 1;
export const COMMERCE_V2_RECOVERY_ENABLED = false;
export const CHECKOUT_RECOVERY_STORAGE_KEY = 'secondevie:checkout-recovery:v1';

const FORBIDDEN_FIELDS = Object.freeze([
    'clientSecret',
    'checkoutOtpToken',
    'otp',
    'total',
    'totalCents',
    'price'
]);

function assertIdentifier(value, field) {
    if (typeof value !== 'string' || value.length < 8 || value.length > 160) {
        throw new Error(`COMMERCE_RECOVERY_INVALID:${field}`);
    }
}

export function createCheckoutRecoveryDescriptor({
    ownerUid,
    clientOrderId,
    orderId,
    cartLines
}) {
    assertIdentifier(ownerUid, 'ownerUid');
    assertIdentifier(clientOrderId, 'clientOrderId');
    assertIdentifier(orderId, 'orderId');
    if (!Array.isArray(cartLines) || cartLines.length === 0 || cartLines.length > 50) {
        throw new Error('COMMERCE_RECOVERY_INVALID:cartLines');
    }
    const lines = cartLines.map((line) => {
        assertIdentifier(line.cartLineId, 'cartLineId');
        if (!Number.isSafeInteger(line.cartRevision) || line.cartRevision < 0) {
            throw new Error('COMMERCE_RECOVERY_INVALID:cartRevision');
        }
        return Object.freeze({
            cartLineId: line.cartLineId,
            cartRevision: line.cartRevision
        });
    });
    return Object.freeze({
        contractVersion: CHECKOUT_RECOVERY_CONTRACT_VERSION,
        namespace: `uid:${ownerUid}`,
        ownerUid,
        clientOrderId,
        orderId,
        cartLines: Object.freeze(lines)
    });
}

export function validateCheckoutRecoveryDescriptor(descriptor, activeUid) {
    if (!descriptor || descriptor.contractVersion !== CHECKOUT_RECOVERY_CONTRACT_VERSION) return false;
    if (descriptor.ownerUid !== activeUid || descriptor.namespace !== `uid:${activeUid}`) return false;
    if (FORBIDDEN_FIELDS.some((field) => Object.hasOwn(descriptor, field))) return false;
    try {
        createCheckoutRecoveryDescriptor(descriptor);
        return true;
    } catch {
        return false;
    }
}

export function writeCheckoutRecoveryDescriptor(
    descriptor,
    { enabled = COMMERCE_V2_RECOVERY_ENABLED } = {}
) {
    if (!enabled || typeof window === 'undefined') return false;
    if (!validateCheckoutRecoveryDescriptor(descriptor, descriptor?.ownerUid)) {
        throw new Error('COMMERCE_RECOVERY_INVALID');
    }
    window.localStorage.setItem(
        CHECKOUT_RECOVERY_STORAGE_KEY,
        JSON.stringify(descriptor)
    );
    return true;
}

export function readCheckoutRecoveryDescriptor(
    activeUid,
    { enabled = COMMERCE_V2_RECOVERY_ENABLED } = {}
) {
    if (!enabled || typeof window === 'undefined') return null;
    try {
        const descriptor = JSON.parse(
            window.localStorage.getItem(CHECKOUT_RECOVERY_STORAGE_KEY) || 'null'
        );
        return validateCheckoutRecoveryDescriptor(descriptor, activeUid)
            ? descriptor
            : null;
    } catch {
        return null;
    }
}

export function clearCheckoutRecoveryDescriptor(
    { enabled = COMMERCE_V2_RECOVERY_ENABLED } = {}
) {
    if (!enabled || typeof window === 'undefined') return;
    window.localStorage.removeItem(CHECKOUT_RECOVERY_STORAGE_KEY);
}

export function isPurchasedCartLineUnchanged(currentLine, purchasedLine) {
    return Boolean(
        currentLine &&
        purchasedLine &&
        currentLine.cartLineId === purchasedLine.cartLineId &&
        currentLine.cartRevision === purchasedLine.cartRevision
    );
}
