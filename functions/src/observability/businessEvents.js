'use strict';

const admin = require('firebase-admin');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { hashOpaque, structuredLog } = require('../../helpers/observability');

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

const journalCommerceIncidentGen2 = onDocumentCreated(
    { ...RUNTIME, document: 'commerce_incidents/{incidentId}' },
    async (event) => {
        const data = event.data?.data() || {};
        await createBusinessEvent({
            sourceRef: event.data.ref.path,
            eventType: `incident.${String(data.code || 'unknown').slice(0, 80)}`,
            aggregateId: data.orderId || null,
            correlationId: event.params.incidentId,
            occurredAt: data.createdAt || data.updatedAt || event.data.createTime,
            outcome: data.status === 'closed' ? 'resolved' : 'needs_review',
            refs: { paymentKeyHash: hashOpaque(data.providerObjectId) },
            payload: { severity: data.severity || 'warning' }
        });
    }
);

const journalOutboxStatusGen2 = onDocumentWritten(
    { ...RUNTIME, document: 'commerce_outbox/{outboxId}' },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        if (!after || before?.status === after.status || !TERMINAL_OUTBOX.has(after.status)) return;
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
        if (!after || before?.status === after.status || !INBOX_STATES.has(after.status)) return;
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
    journalCommerceIncidentGen2,
    journalFinancialFactGen2,
    journalInventoryMovementGen2,
    journalOrderEventGen2,
    journalOutboxStatusGen2,
    journalWebhookStatusGen2,
    sourceEventId
};
