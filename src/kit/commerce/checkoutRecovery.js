import { COMMERCE_V2_UI_ENABLED } from './commerceUiFlags.js';

export const CHECKOUT_RECOVERY_CONTRACT_VERSION = 1;
export const COMMERCE_V2_RECOVERY_ENABLED =
    COMMERCE_V2_UI_ENABLED;
export const CHECKOUT_RECOVERY_STORAGE_KEY = 'secondevie:checkout-recovery:v1';

const TERMINAL_CHECKOUT_REASONS = Object.freeze({
    COMMERCE_CHECKOUT_TERMINAL_PAID: 'paid',
    COMMERCE_CHECKOUT_TERMINAL_EXPIRED: 'expired',
    COMMERCE_CHECKOUT_TERMINAL_CANCELED: 'canceled'
});

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

export function getCheckoutRecoveryTerminalReason(error) {
    const code = String(error?.details?.reason || '');
    return TERMINAL_CHECKOUT_REASONS[code] || null;
}

export function getCheckoutRecoveryTerminalMessage(reason) {
    if (reason === 'paid') {
        return 'Cette commande est déjà confirmée. Votre panier a été actualisé avant un nouveau paiement.';
    }
    if (reason === 'expired') {
        return 'Votre réservation a expiré. Vérifiez votre panier, puis recommencez le paiement.';
    }
    if (reason === 'canceled') {
        return 'Cette réservation a été annulée. Vérifiez votre panier, puis recommencez le paiement.';
    }
    return '';
}

export function getCheckoutRecoveryTerminalCartLines(reason, descriptor) {
    if (reason !== 'paid' || !Array.isArray(descriptor?.cartLines)) return [];
    return descriptor.cartLines;
}

export function getCheckoutRecoveryOrderItems(result) {
    if (!Array.isArray(result?.items) || result.items.length === 0 || result.items.length > 50) {
        throw new Error('COMMERCE_RECOVERY_ORDER_ITEMS_INVALID');
    }
    return result.items.map((line) => {
        if (
            typeof line?.name !== 'string' || !line.name.trim() || line.name.length > 200 ||
            typeof line?.productId !== 'string' || !line.productId ||
            !Number.isSafeInteger(line?.unitAmountCents) || line.unitAmountCents <= 0 ||
            !Number.isSafeInteger(line?.quantity) || line.quantity <= 0
        ) {
            throw new Error('COMMERCE_RECOVERY_ORDER_ITEMS_INVALID');
        }
        return Object.freeze({
            id: line.cartLineId || line.productId,
            originalId: line.productId,
            name: line.name.trim(),
            price: line.unitAmountCents / 100,
            quantity: line.quantity
        });
    });
}

export function isPurchasedCartLineUnchanged(currentLine, purchasedLine) {
    return Boolean(
        currentLine &&
        purchasedLine &&
        currentLine.cartLineId === purchasedLine.cartLineId &&
        currentLine.cartRevision === purchasedLine.cartRevision
    );
}
