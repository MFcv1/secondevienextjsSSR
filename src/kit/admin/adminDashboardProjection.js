const CRITICAL_DOCUMENT_IDS = Object.freeze(['finance', 'orders', 'activity']);

function isTimestamp(value) {
    return Boolean(value) && (
        typeof value.toMillis === 'function' ||
        (Number.isSafeInteger(value.seconds) && Number.isSafeInteger(value.nanoseconds))
    );
}

function integer(value, { allowNegative = false } = {}) {
    return Number.isSafeInteger(value) && (allowNegative || value >= 0);
}

function validateFinance(data) {
    return data?.schemaVersion === 1 && data.currency === 'EUR' &&
        integer(data.capturedCents) && integer(data.refundedCents) &&
        integer(data.netCents, { allowNegative: true }) &&
        data.netCents === data.capturedCents - data.refundedCents &&
        integer(data.capturedOrderCount) && integer(data.sourceFactCount) &&
        integer(data.revision) && isTimestamp(data.sourceUpdateTime) && isTimestamp(data.updatedAt);
}

function validateOrders(data) {
    return data?.schemaVersion === 1 &&
        ['totalOrders', 'paidOrders', 'shippedOrders', 'pendingOrders', 'cancelledOrders']
            .every((key) => integer(data[key])) &&
        data.totalOrders === data.paidOrders + data.shippedOrders + data.pendingOrders &&
        integer(data.revision) && isTimestamp(data.latestObservedSourceUpdateTime) && isTimestamp(data.updatedAt);
}

function validateActivity(data) {
    const users = data?.users;
    const catalog = data?.catalog;
    return data?.schemaVersion === 1 && integer(data.revision) && isTimestamp(data.updatedAt) &&
        users && integer(users.registeredUsers) && integer(users.sourceRevision) && isTimestamp(users.sourceUpdatedAt) &&
        catalog && integer(catalog.stockValueCents) && integer(catalog.sourceRevision) && isTimestamp(catalog.sourceUpdatedAt);
}

const VALIDATORS = Object.freeze({ finance: validateFinance, orders: validateOrders, activity: validateActivity });

function validateCriticalSnapshot(snapshot, previousRevisions = {}) {
    const documents = Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data()]));
    const domains = {};
    for (const id of CRITICAL_DOCUMENT_IDS) {
        const data = documents[id];
        const regressive = integer(previousRevisions[id]) && integer(data?.revision) &&
            data.revision < previousRevisions[id];
        domains[id] = data && VALIDATORS[id](data) && !regressive
            ? { status: 'ready', data }
            : { status: 'unavailable', data: null };
    }
    return {
        domains,
        fromCache: snapshot.metadata?.fromCache === true,
        serverConfirmed: snapshot.metadata?.fromCache === false,
        revisions: Object.fromEntries(CRITICAL_DOCUMENT_IDS.map((id) => [
            id,
            domains[id].status === 'ready' ? domains[id].data.revision : previousRevisions[id]
        ]))
    };
}

function validateInsights(data) {
    if (![1, 2].includes(data?.schemaVersion) || data.windowDays !== 30 || !integer(data.revision) ||
        !isTimestamp(data.coverageThrough) || !isTimestamp(data.updatedAt)) return null;
    if (!data.quote || !['visits', 'starts', 'submitted'].every((key) => integer(data.quote[key]))) return null;
    if (data.schemaVersion === 2 && (
        !data.quoteWindows || !['30d', '3m', '6m', '1y'].every((period) => (
            data.quoteWindows[period] &&
            ['visits', 'starts', 'submitted'].every((key) => integer(data.quoteWindows[period][key]))
        ))
    )) return null;
    if (!['ready', 'not_materialized'].includes(data.productsState)) return null;
    if (!Array.isArray(data.products) || data.products.length > 5) return null;
    if (data.productsState === 'not_materialized' && data.products.length !== 0) return null;
    if (data.productsState === 'ready' && !data.products.every((product) => (
        typeof product?.id === 'string' && product.id.length > 0 && product.id.length <= 160 &&
        integer(product.views) && integer(product.viewers) &&
        (!product.dailyViews || (
            Array.isArray(product.dailyViews) && product.dailyViews.length <= 30 && product.dailyViews.every((value) => integer(value))
        ))
    ))) return null;
    return data;
}

export {
    CRITICAL_DOCUMENT_IDS,
    validateActivity,
    validateCriticalSnapshot,
    validateFinance,
    validateInsights,
    validateOrders
};
