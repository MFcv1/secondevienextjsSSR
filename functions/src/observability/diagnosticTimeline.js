'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const {
    checkActiveStrongAdmin,
    writeSecurityAudit
} = require('../../helpers/security');
const { hashOpaque, runObserved } = require('../../helpers/observability');

const REGION = 'europe-west1';
const MAX_EVENTS = 100;

function invalid(message) {
    return new functions.https.HttpsError('invalid-argument', message);
}

function iso(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (typeof value === 'string' && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
    if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
    return null;
}

function normalizeSearch(data = {}) {
    const value = String(data.value || '').trim();
    if (value.length < 3 || value.length > 180) throw invalid('Recherche invalide.');
    const requestedKind = String(data.kind || 'auto');
    const kind = requestedKind === 'auto'
        ? value.includes('@')
            ? 'customer_email'
            : value.startsWith('pi_')
                ? 'payment'
                : value.startsWith('re_')
                    ? 'refund'
                    : 'order'
        : requestedKind;
    if (!['order', 'payment', 'refund', 'customer_email', 'correlation'].includes(kind)) {
        throw invalid('Type de recherche invalide.');
    }
    if (kind === 'customer_email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toLowerCase())) {
        throw invalid('Adresse de recherche invalide.');
    }
    if (kind !== 'customer_email' && !/^[A-Za-z0-9_:.-]+$/.test(value)) {
        throw invalid('Identifiant de recherche invalide.');
    }
    return { kind, value: kind === 'customer_email' ? value.toLowerCase() : value };
}

async function resolveOrderIds(db, search) {
    if (search.kind === 'order') {
        const snapshot = await db.doc(`orders/${search.value}`).get();
        return snapshot.exists ? [snapshot.id] : [];
    }
    if (search.kind === 'correlation') {
        const events = await db.collection('business_events')
            .where('correlationId', '==', search.value)
            .limit(10)
            .get();
        return [...new Set(events.docs.map((doc) => doc.data()?.aggregateId).filter(Boolean))];
    }
    if (search.kind === 'payment' || search.kind === 'refund') {
        const [orders, facts] = await Promise.all([
            search.kind === 'payment'
                ? db.collection('orders').where('payment.paymentIntentId', '==', search.value).limit(10).get()
                : Promise.resolve({ docs: [] }),
            db.collection('commerce_financial_facts').where('providerObjectId', '==', search.value).limit(10).get()
        ]);
        return [...new Set([
            ...orders.docs.map((doc) => doc.id),
            ...facts.docs.map((doc) => doc.data()?.orderId)
        ].filter(Boolean))];
    }
    const [legacy, current] = await Promise.all([
        db.collection('orders').where('userEmail', '==', search.value).limit(10).get(),
        db.collection('orders').where('customerSnapshot.email', '==', search.value).limit(10).get()
    ]);
    return [...new Set([...legacy.docs, ...current.docs].map((doc) => doc.id))];
}

function timelineEvent({ id, type, at, source, status = 'recorded', severity = 'info', detail = null, correlationId = null }) {
    return {
        id,
        type: String(type || 'unknown').slice(0, 120),
        at: iso(at),
        source,
        status,
        severity,
        detail,
        correlationId
    };
}

function recoveryAssessment(order, incidents, outbox) {
    const reasons = [];
    const openIncidents = incidents.filter((doc) => doc.data()?.status === 'open');
    const ambiguousEmails = outbox.filter((doc) => ['delivery_unknown', 'dead_letter'].includes(doc.data()?.status));
    if (order?.status === 'needs_review' || order?.payment?.status === 'needs_review') {
        reasons.push('La commande demande une vérification humaine.');
    }
    if (openIncidents.length) reasons.push(`${openIncidents.length} incident(s) ouvert(s).`);
    if (ambiguousEmails.length) reasons.push('Un e-mail est en échec définitif ou de livraison inconnue.');
    if (reasons.length) return { status: 'blocked', label: 'Reprise à vérifier', reasons };
    if (['processing', 'refund_pending'].includes(order?.status) || order?.payment?.status === 'processing') {
        return {
            status: 'review',
            label: 'Processus encore en cours',
            reasons: ['Attendre la prochaine réconciliation avant une reprise manuelle.']
        };
    }
    return {
        status: 'safe',
        label: 'Aucune ambiguïté détectée',
        reasons: ['Les états connus sont cohérents. Toute reprise reste idempotente côté serveur.']
    };
}

async function buildOrderDiagnostic(db, orderId) {
    const orderRef = db.doc(`orders/${orderId}`);
    const [
        orderSnapshot,
        orderEvents,
        attempts,
        refunds,
        returns,
        documents,
        facts,
        movements,
        outbox,
        incidents,
        businessEvents
    ] = await Promise.all([
        orderRef.get(),
        orderRef.collection('events').orderBy('createdAt', 'asc').limit(MAX_EVENTS).get(),
        orderRef.collection('payment_attempts').limit(20).get(),
        orderRef.collection('refunds').limit(20).get(),
        orderRef.collection('returns').limit(20).get(),
        orderRef.collection('documents').limit(20).get(),
        db.collection('commerce_financial_facts').where('orderId', '==', orderId).limit(50).get(),
        db.collection('inventory_movements').where('orderId', '==', orderId).limit(50).get(),
        db.collection('commerce_outbox').where('aggregateId', '==', orderId).limit(50).get(),
        db.collection('commerce_incidents').where('orderId', '==', orderId).limit(50).get(),
        db.collection('business_events').where('aggregateId', '==', orderId).orderBy('occurredAt', 'asc').limit(MAX_EVENTS).get()
    ]);
    if (!orderSnapshot.exists) return null;
    const order = orderSnapshot.data() || {};
    const events = [];
    for (const doc of orderEvents.docs) {
        const data = doc.data();
        events.push(timelineEvent({
            id: `order:${doc.id}`,
            type: `Commande · ${data.action || data.type || 'mise à jour'}`,
            at: data.createdAt,
            source: 'commande',
            status: 'succeeded',
            detail: data.reason || null,
            correlationId: data.commandId || data.eventId || doc.id
        }));
    }
    for (const doc of attempts.docs) {
        const data = doc.data();
        events.push(timelineEvent({
            id: `attempt:${doc.id}`,
            type: `Paiement · ${data.status || 'tentative'}`,
            at: data.updatedAt || data.createdAt,
            source: 'Stripe',
            status: data.status || 'recorded',
            severity: ['failed', 'needs_review'].includes(data.status) ? 'error' : 'info',
            correlationId: data.commandId || doc.id
        }));
    }
    for (const doc of facts.docs) {
        const data = doc.data();
        events.push(timelineEvent({
            id: `fact:${doc.id}`,
            type: `Finance · ${data.type}`,
            at: data.effectiveAt,
            source: 'fait financier',
            status: 'succeeded',
            detail: Number.isSafeInteger(data.amountCents) ? `${(data.amountCents / 100).toFixed(2)} ${data.currency}` : null,
            correlationId: data.commandId || data.effectId
        }));
    }
    for (const doc of refunds.docs) {
        const data = doc.data();
        events.push(timelineEvent({
            id: `refund:${doc.id}`,
            type: `Remboursement · ${data.status || 'demande'}`,
            at: data.updatedAt || data.createdAt,
            source: 'remboursement',
            status: data.status || 'recorded',
            severity: ['failed', 'needs_review'].includes(data.status) ? 'error' : 'info',
            correlationId: data.commandId || data.refundRequestId || doc.id
        }));
    }
    for (const doc of movements.docs) {
        const data = doc.data();
        events.push(timelineEvent({
            id: `stock:${doc.id}`,
            type: `Stock · ${data.type || 'mouvement'}`,
            at: data.createdAt,
            source: 'inventaire',
            status: 'succeeded',
            detail: Number.isSafeInteger(data.quantity) ? `Quantité ${data.quantity}` : null,
            correlationId: data.commandId || data.effectId
        }));
    }
    for (const doc of outbox.docs) {
        const data = doc.data();
        events.push(timelineEvent({
            id: `email:${doc.id}`,
            type: `E-mail · ${data.template || 'transactionnel'}`,
            at: data.sentAt || data.suppressedAt || data.createdAt,
            source: 'outbox',
            status: data.status || 'recorded',
            severity: ['failed', 'dead_letter', 'delivery_unknown'].includes(data.status) ? 'error' : 'info',
            correlationId: data.effectId || doc.id
        }));
    }
    for (const doc of incidents.docs) {
        const data = doc.data();
        events.push(timelineEvent({
            id: `incident:${doc.id}`,
            type: `Incident · ${data.code || 'inconnu'}`,
            at: data.updatedAt || data.createdAt,
            source: 'réconciliation',
            status: data.status || 'open',
            severity: data.status === 'closed' ? 'warning' : 'error',
            correlationId: doc.id
        }));
    }
    for (const doc of returns.docs) {
        const data = doc.data();
        events.push(timelineEvent({
            id: `return:${doc.id}`,
            type: `Retour · ${data.status || 'ouvert'}`,
            at: data.updatedAt || data.createdAt,
            source: 'retour',
            status: data.status || 'recorded',
            correlationId: data.commandId || doc.id
        }));
    }
    for (const doc of documents.docs) {
        const data = doc.data();
        events.push(timelineEvent({
            id: `document:${doc.id}`,
            type: `Document · ${data.kind || 'créé'}`,
            at: data.issuedAt || data.createdAt,
            source: 'document',
            status: 'succeeded',
            correlationId: doc.id
        }));
    }
    for (const doc of businessEvents.docs) {
        const data = doc.data();
        if (events.some((entry) => data.source?.ref && entry.id.endsWith(data.source.ref.split('/').pop()))) continue;
        events.push(timelineEvent({
            id: `journal:${doc.id}`,
            type: String(data.eventType || 'Événement').replaceAll('.', ' · '),
            at: data.occurredAt,
            source: data.source?.kind || 'journal',
            status: data.outcome?.status || 'recorded',
            severity: ['failed', 'dead_letter', 'delivery_unknown', 'needs_review'].includes(data.outcome?.status) ? 'error' : 'info',
            correlationId: data.correlationId || null
        }));
    }
    events.sort((left, right) => String(left.at || '').localeCompare(String(right.at || '')));
    return {
        order: {
            id: orderId,
            schemaVersion: order.schemaVersion || 1,
            status: order.status || 'unknown',
            stateVersion: Number.isSafeInteger(order.stateVersion) ? order.stateVersion : null,
            paymentStatus: order.payment?.status || order.paymentStatus || null,
            fulfillmentStatus: order.fulfillmentSummary?.status || null,
            refundStatus: order.refundAggregate?.status || null,
            createdAt: iso(order.createdAt),
            updatedAt: iso(order.updatedAt)
        },
        recovery: recoveryAssessment(order, incidents.docs, outbox.docs),
        timeline: events.slice(-MAX_EVENTS),
        truncated: events.length > MAX_EVENTS || orderEvents.size === MAX_EVENTS || businessEvents.size === MAX_EVENTS
    };
}

async function handler(data, context) {
    await checkActiveStrongAdmin(context);
    const search = normalizeSearch(data);
    const db = admin.firestore();
    const orderIds = await resolveOrderIds(db, search);
    await writeSecurityAudit('observability.timeline_viewed', context, {
        searchType: search.kind,
        searchHash: hashOpaque(search.value),
        matchCount: orderIds.length
    });
    const matches = await Promise.all(orderIds.slice(0, 10).map((orderId) => buildOrderDiagnostic(db, orderId)));
    return {
        success: true,
        search: { kind: search.kind, valueHash: hashOpaque(search.value) },
        matches: matches.filter(Boolean),
        truncated: orderIds.length > 10
    };
}

const getDiagnosticTimelineAdminGen2 = onCall({
    region: REGION,
    enforceAppCheck: true,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '512MiB',
    timeoutSeconds: 60
}, (request) => runObserved(
    'getDiagnosticTimelineAdminGen2',
    request,
    (data) => handler(data, request)
));

module.exports = {
    buildOrderDiagnostic,
    getDiagnosticTimelineAdminGen2,
    handler,
    normalizeSearch,
    recoveryAssessment,
    resolveOrderIds
};
