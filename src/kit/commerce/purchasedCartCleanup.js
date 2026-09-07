import { isPurchasedCartLineUnchanged } from './checkoutRecovery.js';

export async function clearPurchasedRemoteCart({ db, firestore, ownerUid, purchasedCartLines }) {
    const purchasedByLineId = new Map(purchasedCartLines.map((line) => [line.cartLineId, line]));
    const snapshot = await firestore.getDocs(firestore.collection(db, 'users', ownerUid, 'cart'));
    // The listing only selects candidates. A concurrent re-add must survive the
    // cleanup, including a write committed after this listing was received.
    for (const candidate of snapshot.docs) {
        const purchased = purchasedByLineId.get(candidate.data().cartLineId);
        if (!purchased) continue;
        await firestore.runTransaction(db, async (transaction) => {
            const current = await transaction.get(candidate.ref);
            if (current.exists() && isPurchasedCartLineUnchanged(current.data(), purchased)) {
                transaction.delete(candidate.ref);
            }
        });
    }
}
