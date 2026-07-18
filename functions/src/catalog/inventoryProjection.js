function buildInventoryOverview(sourceDocuments = [], options = {}) {
    let totalStockValue = 0;
    let totalItemsForSale = 0;
    let totalItems = 0;
    let soldItems = 0;
    let publishedItems = 0;

    sourceDocuments.forEach(({ data = {} }) => {
        totalItems += 1;
        const price = Number(data.currentPrice || data.startingPrice || 0);
        const stock = data.stock !== undefined ? Number(data.stock) : 1;
        if (data.status === 'published') publishedItems += 1;
        if (data.sold || stock <= 0) soldItems += 1;
        if (!data.sold && stock > 0) {
            totalItemsForSale += 1;
            totalStockValue += price * stock;
        }
    });

    return {
        totalStockValue,
        totalItemsForSale,
        totalItems,
        soldItems,
        publishedItems,
        ...(options.lastUpdatedAt !== undefined ? { lastUpdatedAt: options.lastUpdatedAt } : {}),
        ...(options.expireAt !== undefined ? { expireAt: options.expireAt } : {})
    };
}

module.exports = { buildInventoryOverview };
