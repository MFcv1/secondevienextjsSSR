'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const {
    normalizeFinancialHistorySource,
    planFinancialHistorySource
} = require('./financialHistoryDomain');

const db = admin.firestore();
const RUNTIME_SERVICE_ACCOUNT =
    'order-stats-projector@secondevienextjsssr.iam.gserviceaccount.com';

function deletionEventTimestamp(event) {
    const date = event?.time ? new Date(event.time) : null;
    return date && Number.isFinite(date.getTime())
        ? admin.firestore.Timestamp.fromDate(date)
        : (event.data?.before?.updateTime || null);
}

function correlationId(eventId) {
    return crypto.createHash('sha256').update(String(eventId || 'missing'))
        .digest('hex').slice(0, 16);
}

function checkedTotal(value, delta, code) {
    const total = Number(value || 0) + Number(delta || 0);
    if (!Number.isSafeInteger(total)) throw new Error(code);
    return total;
}

function createFinancialHistoryProjector(sourceKind) {
    return async (event) => {
        const startedAt = Date.now();
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        const nextContribution = normalizeFinancialHistorySource(sourceKind, after);
        const previousContribution = normalizeFinancialHistorySource(sourceKind, before);
        const dateKey = nextContribution?.dateKey || previousContribution?.dateKey;
        if (!dateKey) return null;
        if (nextContribution && previousContribution && nextContribution.dateKey !== previousContribution.dateKey) {
            throw new Error('ADMIN_FINANCE_HISTORY_DATE_IMMUTABLE');
        }
        const sourceUpdateTime = event.data?.after?.exists
            ? event.data.after.updateTime
            : deletionEventTimestamp(event);
        if (!sourceUpdateTime) throw new Error('ADMIN_FINANCE_HISTORY_EVENT_INVALID');

        const result = await db.runTransaction(async (transaction) => {
            const dayRef = db.doc(`admin_finance_history_days/${dateKey}`);
            const daySnapshot = await transaction.get(dayRef);
            const day = daySnapshot.exists ? daySnapshot.data() : {};
            const plan = planFinancialHistorySource({
                existingSource: day.sources?.[sourceKind] || null,
                nextContribution,
                sourceUpdateTime,
                eventId: event.id
            });
            if (plan.outcome === 'noop') return plan;

            const monthKey = dateKey.slice(0, 7);
            const yearKey = dateKey.slice(0, 4);
            const monthRef = db.doc(`admin_finance_history_months/${monthKey}`);
            const yearRef = db.doc(`admin_finance_history_years/${yearKey}`);
            let month = null;
            let year = null;
            if (plan.deltaCents !== 0) {
                [month, year] = await Promise.all([
                    transaction.get(monthRef),
                    transaction.get(yearRef)
                ]);
            }

            transaction.set(dayRef, {
                schemaVersion: 1,
                dateKey,
                totalRevenueCents: checkedTotal(
                    day.totalRevenueCents,
                    plan.deltaCents,
                    'ADMIN_FINANCE_HISTORY_DAY_OVERFLOW'
                ),
                sources: {
                    ...(day.sources || {}),
                    [sourceKind]: plan.nextSource
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                revision: Math.max(0, Number(day.revision || 0)) + 1
            });
            if (plan.deltaCents !== 0) {
                const writeAggregate = (snapshot, ref, keyName, keyValue, overflowCode) => {
                    const current = snapshot.exists ? snapshot.data() : {};
                    transaction.set(ref, {
                        schemaVersion: 1,
                        [keyName]: keyValue,
                        totalRevenueCents: checkedTotal(
                            current.totalRevenueCents,
                            plan.deltaCents,
                            overflowCode
                        ),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        revision: Math.max(0, Number(current.revision || 0)) + 1
                    });
                };
                writeAggregate(month, monthRef, 'monthKey', monthKey, 'ADMIN_FINANCE_HISTORY_MONTH_OVERFLOW');
                writeAggregate(year, yearRef, 'yearKey', yearKey, 'ADMIN_FINANCE_HISTORY_YEAR_OVERFLOW');
            }
            return plan;
        });

        logger.info('admin_finance_history_projection_completed', {
            schemaVersion: 1,
            sourceKind,
            correlationId: correlationId(event.id),
            outcome: result.outcome,
            deltaCents: result.deltaCents,
            durationMs: Date.now() - startedAt,
            sourceLagMs: Math.max(0, Date.now() - sourceUpdateTime.toMillis())
        });
        return null;
    };
}

const commonOptions = {
    region: 'europe-west1',
    retry: true,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: RUNTIME_SERVICE_ACCOUNT
};

const projectLegacyFinancialHistoryGen2 = onDocumentWritten({
    ...commonOptions,
    document: 'sales_stats_daily/{dateKey}'
}, createFinancialHistoryProjector('legacy'));

const projectCommerceFinancialHistoryGen2 = onDocumentWritten({
    ...commonOptions,
    document: 'commerce_financial_daily/{dayId}'
}, createFinancialHistoryProjector('commerce'));

module.exports = {
    createFinancialHistoryProjector,
    projectCommerceFinancialHistoryGen2,
    projectLegacyFinancialHistoryGen2
};
