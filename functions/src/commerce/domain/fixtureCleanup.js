'use strict';

const PROTECTED_COLLECTIONS = new Set([
    'commerce_financial_facts',
    'commerce_product_audits',
    'inventory_movements',
    'orders'
]);

const AUXILIARY_COLLECTIONS = new Set([
    'commerce_checkout_identities',
    'commerce_command_results',
    'commerce_order_access_tokens',
    'commerce_outbox',
    'commerce_webhook_inbox',
    'inventory_reservations'
]);

function cleanupError(code, detail) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function planFixtureCleanup({ runId, documents, dryRun = true }) {
    if (typeof runId !== 'string' || !/^run_[A-Za-z0-9_-]{8,80}$/.test(runId)) {
        throw cleanupError('COMMERCE_FIXTURE_CLEANUP_RUN_INVALID');
    }
    if (!Array.isArray(documents)) throw cleanupError('COMMERCE_FIXTURE_CLEANUP_INPUT_INVALID');
    const actions = [];
    for (const entry of documents) {
        if (
            !entry ||
            typeof entry.collection !== 'string' ||
            typeof entry.id !== 'string' ||
            entry.testContext?.runId !== runId
        ) {
            continue;
        }
        if (PROTECTED_COLLECTIONS.has(entry.collection)) {
            actions.push({
                collection: entry.collection,
                id: entry.id,
                action: 'preserve',
                reason: 'financial_or_audit_proof'
            });
            continue;
        }
        if (!AUXILIARY_COLLECTIONS.has(entry.collection)) {
            actions.push({
                collection: entry.collection,
                id: entry.id,
                action: 'quarantine',
                reason: 'unknown_fixture_collection'
            });
            continue;
        }
        const terminal = ['dead_letter', 'delivery_unknown', 'failed', 'released', 'sent', 'used']
            .includes(entry.status);
        actions.push({
            collection: entry.collection,
            id: entry.id,
            action: terminal ? 'quarantine' : 'preserve',
            reason: terminal ? 'terminal_auxiliary' : 'non_terminal_auxiliary'
        });
    }
    return Object.freeze({
        schemaVersion: 2,
        runId,
        dryRun,
        writes: 0,
        deletes: 0,
        actions: actions.sort((left, right) => (
            left.collection.localeCompare(right.collection) ||
            left.id.localeCompare(right.id)
        ))
    });
}

module.exports = {
    AUXILIARY_COLLECTIONS,
    PROTECTED_COLLECTIONS,
    planFixtureCleanup
};
