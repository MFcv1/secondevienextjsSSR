import { getCartDocumentId, readGuestCart, writeGuestCart } from './guestCart';
import { isPurchasedCartLineUnchanged } from './checkoutRecovery';

// Serialize consumers so the panel and checkout cannot import the same guest
// snapshot into different accounts while authentication is changing.
let migration = Promise.resolve();

export function migrateGuestCartToUserCart(db, firestore, user, isCurrent = () => true) {
  const run = async () => {
    if (!user || !isCurrent()) return false;
    const guestItems = readGuestCart();
    for (const item of guestItems) {
      if (!isCurrent()) return false;
      const cartDocId = getCartDocumentId(item);
      if (!cartDocId) continue;
      const cartRef = firestore.doc(db, 'users', user.uid, 'cart', cartDocId);
      const imported = await firestore.runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(cartRef);
        if (!isCurrent()) return false;
        if (!snapshot.exists()) {
          const { id: _id, ...payload } = item;
          transaction.set(cartRef, { ...payload, addedAt: firestore.serverTimestamp() }, { merge: true });
        }
        return true;
      });
      if (imported) {
        writeGuestCart(readGuestCart().filter((current) => !isPurchasedCartLineUnchanged(current, item)));
      }
    }
    return guestItems.length > 0;
  };
  const result = migration.then(run);
  migration = result.catch(() => {});
  return result;
}
