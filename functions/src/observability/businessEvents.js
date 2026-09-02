'use strict';

const admin = require('firebase-admin');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { hashOpaque, structuredLog } = require('../../helpers/observability');
const {
    buildFinanceProjection,
    compareTimestamps
} = require('../admin/dashboardProjection');
const {
    INCIDENT_SCHEMA_VERSION,
    applyIncidentSummaryDelta,
    buildIncidentSummaryDelta,
    classifyIncidentCode,
    incidentStateAffectsSummary,
    normalizeIncidentState
} = require('./incidentProjection');

const REGION = 'europe-west1';
const SERVICE_ACCOUNT = 'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com';
const RUNTIME = Object.freeze({
    region: REGION,
    retry: true,
    serviceAccount: SERVICE_ACCOUNT,
    cpu: 1,
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    timeoutSeconds: 60,
    memory: '256MiB'
});
const TERMINAL_OUTBOX = new Set([
    'sent', 'failed', 'dead_letter', 'delivery_unknown', 'suppressed_test', 'suppressed_stale'
]);
const INBOX_STATES = new Set(['received', 'processed', 'failed', 'dead_letter']);

function toTimestamp(value) {
    if (value && typeof value.toMillis === 'function') return value;
    const millis = Date.parse(value || '');
    return admin.firestore.Timestamp.fromMillis(Number.isFinite(millis) ? millis : Date.now());
}

function sourceEventId(sourceRef, eventType, version) {
    return hashOpaque(`business-event:v1:${sourceRef}:${eventType}:${version || '1'}`);
}

async function createBusinessEvent({ sourceRef, eventType, aggregateId, correlationId, occurredAt, outcome, refs, payload }) {
    const eventId = sourceEventId(sourceRef, eventType, correlationId || occurredAt || '1');
    const document = {
        schemaVersion: 1,
        eventId,
        eventType,
        occurredAt: toTimestamp(occurredAt),
        recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        aggregateType: aggregateId ? 'order' : 'system',
        aggregateId: aggregateId || null,
        correlationId: correlationId || eventId,
        source: {
            kind: sourceRef.split('/')[0],
            ref: sourceRef,
            service: 'commerce',
            function: process.env.K_SERVICE || null,
            region: process.env.K_REGION || process.env.FUNCTION_REGION || REGION,
            revision: process.env.K_REVISION || null
        },
        outcome: {
            status: outcome || 'recorded'
        },
        refs: refs || {},
        payload: payload || {},
        retentionClass: eventType.startsWith('financial.') ? 'financial-critical' : 'business-critical'
    };
    try {
        await admin.firestore().collection('business_events').doc(eventId).create(document);
    } catch (error) {
        if (Number(error?.code) === 6 || String(error?.code || '').includes('already-exists')) return;
        structuredLog('error', 'business_event_write_failed', {
            eventType,
            sourceRefHash: hashOpaque(sourceRef),
            errorClass: String(error?.code || error?.name || 'unknown').slice(0, 120)
        });
        throw error;
    }
}

async function projectFinanceDashboard() {
    const totalRef = admin.firestore().doc('commerce_financial_totals/EUR');
    const projectionRef = admin.firestore().doc('admin_dashboard/finance');
    const totalSnapshot = await totalRef.get();
    if (!totalSnapshot.exists) throw Object.assign(new Error('ADMIN_FINANCE_SOURCE_MISSING'), { code: 'ADMIN_FINANCE_SOURCE_MISSING' });
    return admin.firestore().runTransaction(async (transaction) => {
        const current = await transaction.get(projectionRef);
        if (compareTimestamps(totalSnapshot.updateTime, current.data()?.sourceUpdateTime) <= 0) {
            return { outcome: 'already_current', sourceUpdateTime: totalSnapshot.updateTime };
        }
        const revision = Math.max(0, Number(current.data()?.revision || 0)) + 1;
        transaction.set(projectionRef, buildFinanceProjection(totalSnapshot.data(), {
            sourceUpdateTime: totalSnapshot.updateTime,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            revision
        }));
        return { outcome: 'projected', sourceUpdateTime: totalSnapshot.updateTime };
    });
}

async function ensureCapturedOrderCount(factId, fact) {
    if (fact?.type !== 'capture') return { outcome: 'not_capture' };
    const ledgerRef = admin.firestore().doc(`admin_finance_capture_projections/${factId}`);
    const totalRef = admin.firestore().doc('commerce_financial_totals/EUR');
    return admin.firestore().runTransaction(async (transaction) => {
        const [ledger, total] = await Promise.all([
            transaction.get(ledgerRef), transaction.get(totalRef)
        ]);
        if (ledger.exists) return { outcome: 'already_counted' };
        if (!total.exists) throw Object.assign(new Error('ADMIN_FINANCE_SOURCE_MISSING'), {
            code: 'ADMIN_FINANCE_SOURCE_MISSING'
        });
        transaction.set(totalRef, {
            captureCount: admin.firestore.FieldValue.increment(1),
            capturedOrderCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        transaction.create(ledgerRef, {
            schemaVersion: 1,
            factId,
            sourceUpdateTime: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { outcome: 'counted' };
    });
}

async function markFinanceProjectionUnavailable(error) {
    const incidentRef = admin.firestore().doc('commerce_incidents/admin-dashboard-finance-projection');
    const projectionRef = admin.firestore().doc('admin_dashboard/finance');
    const batch = admin.firestore().batch();
    batch.set(incidentRef, {
        schemaVersion: 2,
        code: 'operations_projectionDivergences',
        category: 'projection',
        severity: 'critical',
        status: 'open',
        source: 'admin_dashboard_finance_projector',
        errorClass: String(error?.code || error?.name || 'unknown').slice(0, 120),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    batch.set(projectionRef, {
        schemaVersion: 0,
        availability: 'unavailable',
        source: 'commerce_financial_totals_projection',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    await batch.commit();
}

async function upsertSourceIncident({ sourceKind, sourceId, code, active, occurredAt }) {
    const classification = classifyIncidentCode(code);
    const incidentId = `${sourceKind}-${hashOpaque(sourceId).slice(0, 32)}`;
    const reference = admin.firestore().doc(`commerce_incidents/${incidentId}`);
    const observedAt = toTimestamp(occurredAt);
    await admin.firestore().runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        const current = snapshot.exists ? snapshot.data() : null;
        transaction.set(reference, {
            schemaVersion: 2,
            code: classification.code,
            severity: classification.severity,
            category: classification.category,
            status: active ? 'open' : 'closed',
            source: `commerce_${sourceKind}`,
            sourceKeyHash: hashOpaque(sourceId),
            lastSeenAt: observedAt,
            occurrenceCount: Math.max(0, Number(current?.occurrenceCount || 0)) + 1,
            ...(active
                ? { openedAt: current?.openedAt || observedAt, resolvedAt: null }
                : { resolvedAt: observedAt }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    });
}

const journalOrderEventGen2 = onDocumentCreated(
    { ...RUNTIME, document: 'orders/{orderId}/events/{eventId}' },
    async (event) => {
        const data = event.data?.data() || {};
        const eventType = `order.${String(data.action || data.type || 'changed').slice(0, 80)}`;
        await createBusinessEvent({
            sourceRef: event.data.ref.path,
            eventType,
            aggregateId: event.params.orderId,
            correlationId: String(data.commandId || data.eventId || event.params.eventId).slice(0, 180),
            occurredAt: data.createdAt || event.data.createTime,
            outcome: 'succeeded',
            payload: {
                stateVersionBefore: Number.isSafeInteger(data.stateVersionBefore) ? data.stateVersionBefore : null,
                stateVersionAfter: Number.isSafeInteger(data.stateVersionAfter) ? data.stateVersionAfter : null,
                actorType: data.actor?.role || null,
                assurance: data.actor?.aal2 === true ? 'aal2' : null
            }
        });
    }
);

const journalFinancialFactGen2 = onDocumentCreated(
    { ...RUNTIME, document: 'commerce_financial_facts/{factId}' },
    async (event) => {
        const projectionStartedAt = Date.now();
        const data = event.data?.data() || {};
        await createBusinessEvent({
            sourceRef: event.data.ref.path,
            eventType: `financial.${String(data.type || 'unknown').slice(0, 40)}`,
            aggregateId: data.orderId || null,
            correlationId: String(data.commandId || data.effectId || event.params.factId).slice(0, 180),
            occurredAt: data.effectiveAt || event.data.createTime,
            outcome: data.status || 'succeeded',
            refs: { paymentKeyHash: hashOpaque(data.providerObjectId) },
            payload: {
                amountCents: Number.isSafeInteger(data.amountCents) ? data.amountCents : null,
                currency: data.currency || null
            }
        });
        try {
            await ensureCapturedOrderCount(event.params.factId, data);
            const result = await projectFinanceDashboard();
            structuredLog('info', 'admin_dashboard_projection_completed', {
                domain: 'finance',
                outcome: result.outcome,
                durationMs: Date.now() - projectionStartedAt,
                sourceLagMs: Math.max(0, Date.now() - result.sourceUpdateTime.toMillis())
            });
        } catch (error) {
            if (String(error?.code || '').startsWith('ADMIN_FINANCE_') ||
                String(error?.code || '').startsWith('ADMIN_DASHBOARD_')) {
                await markFinanceProjectionUnavailable(error);
                structuredLog('error', 'admin_finance_projection_contract_failed', {
                    errorClass: String(error.code).slice(0, 120)
                });
                return;
            }
            throw error;
        }
    }
);

const journalInventoryMovementGen2 = onDocumentCreated(
    { ...RUNTIME, document: 'inventory_movements/{movementId}' },
    async (event) => {
        const data = event.data?.data() || {};
        await createBusinessEvent({
            sourceRef: event.data.ref.path,
            eventType: `inventory.${String(data.type || 'movement').slice(0, 40)}`,
            aggregateId: data.orderId || null,
            correlationId: String(data.commandId || data.effectId || event.params.movementId).slice(0, 180),
            occurredAt: data.createdAt || event.data.createTime,
            outcome: 'succeeded',
            payload: {
                quantity: Number.isSafeInteger(data.quantity) ? data.quantity : null,
                availableDelta: Number.isSafeInteger(data.availableDelta) ? data.availableDelta : null
            }
        });
    }
);

async function projectIncidentSummary(event, before, after) {
    const incidentId = event.params.incidentId;
    const summaryRef = admin.firestore().doc('admin_incident_summary/current');
    const ledgerRef = admin.firestore().doc(`admin_incident_projections/${incidentId}`);
    const deletionTime = event.time ? new Date(event.time) : null;
    const sourceUpdateTime = event.data?.after?.exists
        ? event.data.after.updateTime
        : (deletionTime && Number.isFinite(deletionTime.getTime())
            ? admin.firestore.Timestamp.fromDate(deletionTime)
            : event.data?.before?.updateTime);
    return admin.firestore().runTransaction(async (transaction) => {
        const [summarySnapshot, ledgerSnapshot] = await Promise.all([
            transaction.get(summaryRef),
            transaction.get(ledgerRef)
        ]);
        const ledger = ledgerSnapshot.exists ? ledgerSnapshot.data() : null;
        if (compareTimestamps(sourceUpdateTime, ledger?.sourceUpdateTime) <= 0) {
            return { outcome: 'already_current', sourceUpdateTime };
        }
        const previousState = ledger
            ? {
                status: ledger.active ? 'open' : 'closed',
                severity: ledger.severity,
                category: ledger.category,
                code: ledger.code
            }
            : before;
        const delta = buildIncidentSummaryDelta(previousState, after);
        if (!incidentStateAffectsSummary(previousState, after)) {
            const state = normalizeIncidentState(after);
            transaction.set(ledgerRef, {
                schemaVersion: INCIDENT_SCHEMA_VERSION,
                incidentId,
                sourceUpdateTime,
                deleted: !after,
                active: state.active,
                severity: state.severity,
                category: state.category,
                code: state.code,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { outcome: 'tombstoned_no_summary_change', sourceUpdateTime };
        }
        const summary = summarySnapshot.exists ? summarySnapshot.data() : {};
        const { activeCritical, activeWarnings, activeTotal } = applyIncidentSummaryDelta(summary, delta);
        const revision = Math.max(0, Number(summary.revision || 0)) + 1;
        transaction.set(summaryRef, {
            schemaVersion: INCIDENT_SCHEMA_VERSION,
            activeCritical,
            activeWarnings,
            activeTotal,
            latestOpenedAt: delta.opened ? sourceUpdateTime : (summary.latestOpenedAt || null),
            latestResolvedAt: delta.resolved ? sourceUpdateTime : (summary.latestResolvedAt || null),
            latestCategory: delta.state.active ? delta.state.category : (summary.latestCategory || null),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            revision
        });
        transaction.set(ledgerRef, {
            schemaVersion: INCIDENT_SCHEMA_VERSION,
            incidentId,
            sourceUpdateTime,
            deleted: !after,
            active: delta.state.active,
            severity: delta.state.severity,
            category: delta.state.category,
            code: delta.state.code,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { outcome: 'projected', sourceUpdateTime };
    });
}

const journalCommerceIncidentGen2 = onDocumentWritten(
    { ...RUNTIME, document: 'commerce_incidents/{incidentId}' },
    async (event) => {
        const projectionStartedAt = Date.now();
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        if (!incidentStateAffectsSummary(before, after) && after) return;
        const state = normalizeIncidentState(after || before);
        if (state.known === false) {
            structuredLog('error', 'commerce_incident_code_unknown', {
                incidentIdHash: hashOpaque(event.params.incidentId),
                code: state.code
            });
        }
        const projectionResult = await projectIncidentSummary(event, before, after);
        structuredLog('info', 'admin_dashboard_projection_completed', {
            domain: 'incidents',
            outcome: projectionResult.outcome,
            durationMs: Date.now() - projectionStartedAt,
            sourceLagMs: Math.max(0, Date.now() - projectionResult.sourceUpdateTime.toMillis())
        });
        const data = after || before || {};
        const classification = classifyIncidentCode(data.code);
        const sourceDocument = event.data?.after?.exists ? event.data.after : event.data.before;
        await createBusinessEvent({
            sourceRef: sourceDocument.ref.path,
            eventType: `incident.${String(data.code || 'unknown').slice(0, 80)}`,
            aggregateId: data.orderId || null,
            correlationId: `${event.params.incidentId}:${sourceUpdateTimeKey(event)}`,
            occurredAt: data.createdAt || data.updatedAt || event.data?.after?.updateTime || event.data?.before?.updateTime,
            outcome: normalizeIncidentState(after).active ? 'needs_review' : 'resolved',
            refs: { paymentKeyHash: hashOpaque(data.providerObjectId) },
            payload: {
                severity: data.severity || classification.severity,
                category: data.category || classification.category
            }
        });
    }
);

function sourceUpdateTimeKey(event) {
    const timestamp = event.data?.after?.updateTime || event.data?.before?.updateTime;
    const seconds = timestamp?.seconds ?? timestamp?._seconds ?? 0;
    const nanos = timestamp?.nanoseconds ?? timestamp?._nanoseconds ?? 0;
    return `${seconds}-${nanos}`;
}

const journalOutboxStatusGen2 = onDocumentWritten(
    { ...RUNTIME, document: 'commerce_outbox/{outboxId}' },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        if (!after || before?.status === after.status) return;
        const incidentCodeByStatus = {
            failed: 'operations_failedOutbox',
            dead_letter: 'operations_deadLetterOutbox',
            delivery_unknown: 'operations_deliveryUnknown'
        };
        const afterIsIncident = ['failed', 'dead_letter', 'delivery_unknown'].includes(after.status);
        const beforeWasIncident = ['failed', 'dead_letter', 'delivery_unknown'].includes(before?.status);
        if (afterIsIncident || beforeWasIncident) {
            await upsertSourceIncident({
                sourceKind: 'outbox',
                sourceId: event.params.outboxId,
                code: incidentCodeByStatus[after.status] || incidentCodeByStatus[before?.status],
                active: afterIsIncident,
                occurredAt: after.sentAt || after.suppressedAt || after.deliveryUnknownAt || event.data.after.updateTime
            });
        }
        if (!TERMINAL_OUTBOX.has(after.status)) return;
        await createBusinessEvent({
            sourceRef: event.data.after.ref.path,
            eventType: `email.${after.status}`,
            aggregateId: after.aggregateId || after.payloadSnapshot?.orderId || null,
            correlationId: String(after.effectId || event.params.outboxId).slice(0, 180),
            occurredAt: after.sentAt || after.suppressedAt || after.deliveryUnknownAt || event.data.after.updateTime,
            outcome: ['sent', 'suppressed_test', 'suppressed_stale'].includes(after.status) ? 'succeeded' : after.status,
            refs: { outboxId: event.params.outboxId },
            payload: { template: after.template || null, attemptCount: Number(after.attemptCount || 0) }
        });
    }
);

const journalWebhookStatusGen2 = onDocumentWritten(
    { ...RUNTIME, document: 'commerce_webhook_inbox/{inboxId}' },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        if (!after || before?.status === after.status) return;
        if (['failed', 'dead_letter'].includes(after.status) || ['failed', 'dead_letter'].includes(before?.status)) {
            await upsertSourceIncident({
                sourceKind: 'webhook',
                sourceId: event.params.inboxId,
                code: 'operations_dueInbox',
                active: ['failed', 'dead_letter'].includes(after.status),
                occurredAt: after.processedAt || after.receivedAt || event.data.after.updateTime
            });
        }
        if (!INBOX_STATES.has(after.status)) return;
        const orderId = after.verifiedPayloadSnapshot?.data?.object?.metadata?.orderId || null;
        await createBusinessEvent({
            sourceRef: event.data.after.ref.path,
            eventType: `webhook.${after.status}`,
            aggregateId: orderId,
            correlationId: String(after.eventId || event.params.inboxId).slice(0, 180),
            occurredAt: after.processedAt || after.receivedAt || event.data.after.updateTime,
            outcome: after.status === 'processed' ? 'succeeded' : after.status,
            refs: { paymentKeyHash: hashOpaque(after.objectId), inboxId: event.params.inboxId },
            payload: { providerEventType: after.type || null, attemptCount: Number(after.attemptCount || 0) }
        });
    }
);

module.exports = {
    createBusinessEvent,
    markFinanceProjectionUnavailable,
    ensureCapturedOrderCount,
    projectFinanceDashboard,
    projectIncidentSummary,
    upsertSourceIncident,
    journalCommerceIncidentGen2,
    journalFinancialFactGen2,
    journalInventoryMovementGen2,
    journalOrderEventGen2,
    journalOutboxStatusGen2,
    journalWebhookStatusGen2,
    sourceEventId
};
