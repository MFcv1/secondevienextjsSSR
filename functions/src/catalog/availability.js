'use strict';

function resolveAvailability(product, reservations = [], complete = true) {
    if (product.sold === true) return 'sold';
    if (Number(product.stock) > 0) return 'available';
    if (!complete) return 'unavailable';
    if (reservations.some((entry) => Number(entry.heldQty) > 0)) return 'reserved';
    if (reservations.some((entry) => Number(entry.committedQty) > Number(entry.restockedQty || 0))) return 'sold';
    return 'unavailable';
}

// Historical V2 sales did not always set furniture.sold. Resolve only exhausted
// products, with a bounded evidence query, without migrating orders or facts.
async function projectAvailability(db, sourceDocuments) {
    const result = new Array(sourceDocuments.length);
    let nextIndex = 0;
    async function readNext() {
        while (nextIndex < sourceDocuments.length) {
            const index = nextIndex++;
            const source = sourceDocuments[index];
            let reservations = [];
            let complete = true;
            if (source.data.status === 'published' && source.data.sold !== true && Number(source.data.stock) <= 0) {
                const page = await db.collection('inventory_reservations').where('productId', '==', source.id).limit(51).get();
                complete = page.docs.length <= 50;
                reservations = page.docs.map((doc) => doc.data()).filter((entry) => entry.collectionName === 'furniture');
            }
            result[index] = { ...source, data: { ...source.data, availability: resolveAvailability(source.data, reservations, complete) } };
        }
    }
    // Bound concurrent evidence reads without serializing the entire catalogue.
    await Promise.all(Array.from({ length: Math.min(8, sourceDocuments.length) }, readNext));
    return result;
}

module.exports = { resolveAvailability, projectAvailability };
