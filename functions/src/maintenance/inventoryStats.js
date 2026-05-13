const admin = require('firebase-admin');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { APP_ID } = require('../../helpers/config');
const { timestampFromNow, ANALYTICS_ROLLUP_RETENTION_DAYS } = require('../analytics/constants');

const db = admin.firestore();

async function recomputeInventoryOverview() {
    const snapshot = await db.collection(`artifacts/${APP_ID}/public/data/furniture`).get();

    let totalStockValue = 0;
    let totalItemsForSale = 0;
    let totalItems = 0;
    let soldItems = 0;
    let publishedItems = 0;

    snapshot.forEach((docSnap) => {
        totalItems += 1;
        const data = docSnap.data();
        const price = Number(data.currentPrice || data.startingPrice || 0);
        const stock = data.stock !== undefined ? Number(data.stock) : 1;

        if (data.status === 'published') publishedItems += 1;
        if (data.sold || stock <= 0) soldItems += 1;

        if (!data.sold && stock > 0) {
            totalItemsForSale += 1;
            totalStockValue += price * stock;
        }
    });

    await db.doc('inventory_stats/overview').set({
        totalStockValue,
        totalItemsForSale,
        totalItems,
        soldItems,
        publishedItems,
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        expireAt: timestampFromNow(ANALYTICS_ROLLUP_RETENTION_DAYS)
    }, { merge: true });
}

exports.onInventorySourceWrite = onDocumentWritten(
    { document: 'artifacts/{appId}/public/data/{collection}/{docId}', region: 'europe-west1' },
    async (event) => {
        if (event.params.collection !== 'furniture') return null;
        await recomputeInventoryOverview();
        return null;
    }
);
