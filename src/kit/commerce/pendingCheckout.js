import { createCheckoutRecoveryDescriptor, writeCheckoutRecoveryDescriptor } from './checkoutRecovery.js';

export const isPendingCheckout = (order) => order?.schemaVersion === 2
    && order.checkout?.status !== 'closed' && order.payment?.status !== 'succeeded';

export const pendingCheckoutMessage = (order, now = Date.now()) => {
    if (order?.checkout?.closeReason === 'expired') return 'Réservation expirée';
    const deadline = Date.parse(order?.checkout?.expiresAt);
    if (!Number.isFinite(deadline) || deadline <= now || ['processing', 'requires_action', 'needs_review'].includes(order?.payment?.status)) {
        return 'Paiement en cours de vérification. Consultez le dossier avant toute nouvelle tentative.';
    }
    return `Vos pièces sont réservées jusqu’à ${new Date(deadline).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Aucun paiement n’a encore été effectué.`;
};

export function prepareOwnedCheckoutResume(order, ownerUid) {
    if (!ownerUid || order.userId !== ownerUid) throw new Error('COMMERCE_CHECKOUT_ACCESS_DENIED');
    writeCheckoutRecoveryDescriptor(createCheckoutRecoveryDescriptor({
        ownerUid,
        orderId: order.id,
        clientOrderId: order.checkout.clientOrderId,
        cartLines: order.items.map((line) => ({ cartLineId: line.cartLineId || line.lineId, cartRevision: line.cartRevision })),
    }));
}
