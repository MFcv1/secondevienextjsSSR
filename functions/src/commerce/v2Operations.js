'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { APP_ID, getSiteUrl } = require('../../helpers/config');
const {
    GMAIL_EMAIL,
    GMAIL_PASSWORD,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    TRANSACTIONAL_EMAIL_PROVIDER
} = require('../../helpers/secrets');
const {
    checkActiveStrongAdmin,
    normalizeFirestoreId
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    createTransactionalEmailSender
} = require('../email/transactionalEmail');
const {
    renderCommerceEmail
} = require('../email/commerceEmailTemplates');
const {
    buildPaymentReceipt,
    buildRefundConfirmation
} = require('./domain/commerceDocuments');
const {
    materializeCommerceDocumentArtifact
} = require('./domain/commerceDocumentArtifact');
const {
    buildFinancialProjection
} = require('./domain/financialProjection');
const {
    buildFinancialRollupDelta
} = require('./domain/financialRollup');
const {
    createFirestoreWorkerQueries
} = require('./domain/firestoreWorkerQueries');
const {
    planFixtureCleanup
} = require('./domain/fixtureCleanup');
const {
    effectiveCommerceHealth,
    evaluateCommerceHealth
} = require('./domain/operationsHealth');
const {
    createOutboxRepository
} = require('./domain/outboxRepository');
const {
    createOutboxWorker
} = require('./domain/outboxWorker');
const {
    createBoundedWorkerSweeper
} = require('./domain/boundedWorkerSweeper');
const {
    assertWorkerRunComplete,
    buildWorkerRunSummary
} = require('./domain/workerRunHealth');

const db = admin.firestore();
const OUTBOX_SECRETS = [GMAIL_EMAIL, GMAIL_PASSWORD, RESEND_API_KEY];
const COMMERCE_OPERATIONS_RUNTIME_SERVICE_ACCOUNT =
    'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com';
const MAX_FACTS = 5000;
const MAX_ORDERS = 500;
const FIXTURE_COLLECTIONS = [
    'commerce_checkout_identities',
    'commerce_command_results',
    'commerce_financial_facts',
    'commerce_incidents',
    'commerce_order_access_tokens',
    'commerce_outbox',
    'commerce_webhook_inbox',
    'inventory_movements',
    'inventory_reservations',
    'orders'
];

function operationsError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function createClock() {
    return Object.freeze({
        now: () => new Date().toISOString(),
        nowMillis: () => Date.now()
    });
}

function outboxRefs() {
    return {
        outbox: (outboxId) => db.doc(`commerce_outbox/${outboxId}`)
    };
}

function createEmailSender() {
    const provider = String(TRANSACTIONAL_EMAIL_PROVIDER.value() || 'gmail').toLowerCase();
    return createTransactionalEmailSender({
        provider,
        gmail: {
            user: GMAIL_EMAIL.value(),
            password: GMAIL_PASSWORD.value()
        },
        resend: {
            apiKey: RESEND_API_KEY.value()
        }
    });
}

function escapeEmailHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatMoney(amountCents, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: String(currency || 'EUR').toUpperCase()
    }).format(Number(amountCents || 0) / 100);
}

function orderReference(orderId) {
    return `CMD-${String(orderId || '').slice(0, 10).toUpperCase()}`;
}

function deliveryLabel(order) {
    const modeId = order?.deliverySnapshot?.id;
    if (modeId === 'delivery-pickup') return 'Retrait à l’atelier (Marseille)';
    if (modeId === 'delivery-local') return 'Livraison Marseille & alentours';
    if (modeId === 'delivery-carrier') return 'Transporteur spécialisé';
    return Number(order?.amounts?.shippingCents || 0) === 0
        ? 'Livraison offerte'
        : 'Livraison';
}

function addressLines(order) {
    const shipping = order?.shippingSnapshot || {};
    return [
        shipping.fullName,
        shipping.line1,
        shipping.line2,
        [shipping.postalCode, shipping.city].filter(Boolean).join(' '),
        shipping.country
    ].filter(Boolean).map((value) => String(value));
}

function itemText(order) {
    return (order?.items || []).map((item) => (
        `${Number(item.quantity || 1)} × ${item.titleSnapshot || 'Pièce restaurée'} — ` +
        formatMoney(Number(item.unitAmountCents || 0) * Number(item.quantity || 1), order.currency)
    ));
}

function itemRowsHtml(order) {
    return (order?.items || []).map((item) => {
        const title = escapeEmailHtml(item.titleSnapshot || 'Pièce restaurée');
        const quantity = Number(item.quantity || 1);
        const total = formatMoney(Number(item.unitAmountCents || 0) * quantity, order.currency);
        return `
            <tr>
                <td style="padding:14px 0;border-bottom:1px solid #e7e5e4;color:#1c1917;font-size:15px;line-height:1.45;">
                    <strong>${title}</strong><br>
                    <span style="color:#78716c;font-size:13px;">Quantité ${quantity}</span>
                </td>
                <td style="padding:14px 0;border-bottom:1px solid #e7e5e4;color:#1c1917;font-size:15px;text-align:right;white-space:nowrap;">
                    ${escapeEmailHtml(total)}
                </td>
            </tr>
        `;
    }).join('');
}

function premiumEmailShell({
    eyebrow,
    title,
    intro,
    reference,
    statusLabel,
    amountLabel,
    detailsHtml,
    calloutHtml,
    actionLabel,
    actionUrl
}) {
    return `
        <!doctype html>
        <html lang="fr">
        <body style="margin:0;background:#f3f1ec;color:#1c1917;font-family:Arial,Helvetica,sans-serif;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeEmailHtml(intro)}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f1ec;">
                <tr>
                    <td align="center" style="padding:28px 14px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e7e5e4;border-radius:24px;overflow:hidden;">
                            <tr>
                                <td style="background:#1c1917;padding:28px 32px;color:#ffffff;">
                                    <div style="font-family:Georgia,serif;font-size:25px;letter-spacing:-0.4px;">Seconde Vie<span style="color:#d97706;">.</span></div>
                                    <div style="margin-top:6px;color:#d6d3d1;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;">Mobilier restauré à Marseille</div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:34px 32px 18px;">
                                    <div style="color:#a16207;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${escapeEmailHtml(eyebrow)}</div>
                                    <h1 style="margin:10px 0 12px;font-family:Georgia,serif;font-size:34px;line-height:1.08;font-weight:500;letter-spacing:-0.6px;">${escapeEmailHtml(title)}</h1>
                                    <p style="margin:0;color:#57534e;font-size:16px;line-height:1.65;">${escapeEmailHtml(intro)}</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 32px 0;">
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:16px;">
                                        <tr>
                                            <td style="padding:18px 20px;">
                                                <div style="color:#78716c;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;">Commande</div>
                                                <div style="margin-top:5px;font-weight:700;font-size:15px;">${escapeEmailHtml(reference)}</div>
                                            </td>
                                            <td style="padding:18px 20px;text-align:center;border-left:1px solid #e7e5e4;border-right:1px solid #e7e5e4;">
                                                <div style="color:#78716c;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;">Statut</div>
                                                <div style="margin-top:5px;color:#166534;font-weight:700;font-size:15px;">${escapeEmailHtml(statusLabel)}</div>
                                            </td>
                                            <td style="padding:18px 20px;text-align:right;">
                                                <div style="color:#78716c;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;">Montant</div>
                                                <div style="margin-top:5px;font-weight:700;font-size:15px;white-space:nowrap;">${escapeEmailHtml(amountLabel)}</div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr><td style="padding:24px 32px 0;">${detailsHtml}</td></tr>
                            <tr><td style="padding:20px 32px 0;">${calloutHtml}</td></tr>
                            <tr>
                                <td style="padding:26px 32px 36px;">
                                    <a href="${escapeEmailHtml(actionUrl)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:14px;font-weight:700;">${escapeEmailHtml(actionLabel)}</a>
                                    <p style="margin:24px 0 0;color:#78716c;font-size:12px;line-height:1.6;">Message automatique envoyé depuis le sandbox Seconde Vie. Ce document ne constitue ni une facture ni un avoir fiscal.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

function messageFor(entry, order, senderEmail) {
    if (entry?.template) {
        return {
            from: `Seconde Vie <${senderEmail}>`,
            replyTo: senderEmail,
            ...renderCommerceEmail({
                template: entry.template,
                order,
                payload: entry.payloadSnapshot || {},
                senderEmail,
                siteUrl: getSiteUrl()
            })
        };
    }
    const recipient = order?.customerSnapshot?.email || order?.userEmail || null;
    if (typeof recipient !== 'string' || !recipient.includes('@')) {
        throw operationsError('COMMERCE_OUTBOX_RECIPIENT_MISSING');
    }
    const amount = Number(entry.payloadSnapshot?.amountCents || 0);
    const currency = entry.payloadSnapshot?.currency || order.currency || 'EUR';
    const amountLabel = formatMoney(amount, currency);
    const reference = orderReference(order.id || entry.payloadSnapshot?.orderId);
    const customerName = String(order.shippingSnapshot?.fullName || '').trim();
    const greeting = customerName ? `Bonjour ${customerName}, ` : '';
    const siteUrl = getSiteUrl().replace(/\/$/, '');
    const ordersUrl = `${siteUrl}/mes-commandes`;
    const address = addressLines(order);
    const lines = itemText(order);
    const rows = itemRowsHtml(order);
    const shared = {
        from: `Seconde Vie <${senderEmail}>`,
        to: recipient,
        bcc: senderEmail,
        replyTo: senderEmail
    };
    if (entry.template === 'order-paid') {
        const shippingCents = Number(order.amounts?.shippingCents || 0);
        const detailsHtml = `
            <h2 style="margin:0;font-size:18px;">Votre pièce</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">${rows}</table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr><td style="padding:5px 0;color:#78716c;font-size:14px;">${escapeEmailHtml(deliveryLabel(order))}</td><td style="padding:5px 0;text-align:right;font-size:14px;">${escapeEmailHtml(formatMoney(shippingCents, currency))}</td></tr>
                <tr><td style="padding:9px 0 0;font-weight:700;font-size:16px;">Total payé</td><td style="padding:9px 0 0;text-align:right;font-weight:700;font-size:18px;">${escapeEmailHtml(amountLabel)}</td></tr>
            </table>
        `;
        const calloutHtml = `
            <div style="background:#f5f5f4;border-left:4px solid #d97706;border-radius:12px;padding:18px 20px;">
                <div style="font-weight:700;margin-bottom:7px;">${escapeEmailHtml(deliveryLabel(order))}</div>
                <div style="color:#57534e;font-size:14px;line-height:1.6;">${address.map(escapeEmailHtml).join('<br>')}</div>
            </div>
        `;
        return {
            ...shared,
            subject: `Commande ${reference} confirmée · Seconde Vie`,
            text: [
                `${greeting}votre paiement est confirmé.`,
                `Commande ${reference} — ${amountLabel}`,
                ...lines,
                `${deliveryLabel(order)} — ${formatMoney(shippingCents, currency)}`,
                ...address,
                `Suivre la commande : ${ordersUrl}`,
                'Sandbox : ce message ne constitue pas une facture.'
            ].filter(Boolean).join('\n'),
            html: premiumEmailShell({
                eyebrow: 'Paiement confirmé',
                title: 'Votre pièce est réservée.',
                intro: `${greeting}le paiement Stripe est confirmé et votre commande est maintenant enregistrée.`,
                reference,
                statusLabel: 'Payée',
                amountLabel,
                detailsHtml,
                calloutHtml,
                actionLabel: 'Voir ma commande',
                actionUrl: ordersUrl
            })
        };
    }
    if (entry.template === 'order-refunded') {
        const refundId = entry.payloadSnapshot?.refundId || null;
        const detailsHtml = `
            <h2 style="margin:0;font-size:18px;">Récapitulatif du remboursement</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">${rows}</table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr><td style="padding:9px 0 0;font-weight:700;font-size:16px;">Montant remboursé</td><td style="padding:9px 0 0;text-align:right;font-weight:700;font-size:18px;">${escapeEmailHtml(amountLabel)}</td></tr>
            </table>
        `;
        const calloutHtml = `
            <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:12px;padding:18px 20px;">
                <div style="color:#166534;font-weight:700;margin-bottom:7px;">Remboursement confirmé par Stripe</div>
                <div style="color:#3f3f46;font-size:14px;line-height:1.6;">Le crédit est renvoyé sur le moyen de paiement initial. Selon votre banque, son apparition peut prendre quelques jours ouvrables.</div>
                ${refundId ? `<div style="margin-top:10px;color:#78716c;font-size:11px;">Référence Stripe : ${escapeEmailHtml(refundId)}</div>` : ''}
            </div>
        `;
        return {
            ...shared,
            subject: `Remboursement ${reference} confirmé · Seconde Vie`,
            text: [
                `${greeting}votre remboursement Stripe est confirmé.`,
                `Commande ${reference} — ${amountLabel} remboursés`,
                ...lines,
                refundId ? `Référence Stripe : ${refundId}` : null,
                'Le crédit peut prendre quelques jours ouvrables selon votre banque.',
                `Consulter le dossier : ${ordersUrl}`,
                'Sandbox : ce message ne constitue pas un avoir fiscal.'
            ].filter(Boolean).join('\n'),
            html: premiumEmailShell({
                eyebrow: 'Remboursement confirmé',
                title: 'Le remboursement est en route.',
                intro: `${greeting}Stripe a confirmé le remboursement sur le moyen de paiement utilisé lors de l’achat.`,
                reference,
                statusLabel: 'Remboursée',
                amountLabel,
                detailsHtml,
                calloutHtml,
                actionLabel: 'Consulter le dossier',
                actionUrl: ordersUrl
            })
        };
    }
    throw operationsError('COMMERCE_OUTBOX_TEMPLATE_UNSUPPORTED');
}

function ambiguousGmailError(error, provider) {
    return provider === 'gmail' && (
        ['ECONNRESET', 'ESOCKET', 'ETIMEDOUT', 'GMAIL_SEND_FAILED'].includes(error?.code)
    );
}

function createOutboxRuntime() {
    const clock = createClock();
    const sender = createEmailSender();
    const repository = createOutboxRepository({
        db: { runTransaction: (run) => db.runTransaction(run) },
        refs: outboxRefs()
    });
    const worker = createOutboxWorker({
        repository,
        ids: { leaseToken: () => crypto.randomUUID() },
        clock,
        send: async (entry) => {
            const orderId = normalizeFirestoreId(
                entry.payload?.orderId || entry.aggregateId || entry.payloadSnapshot?.orderId,
                'Commande outbox'
            );
            const orderSnapshot = await db.doc(`orders/${orderId}`).get();
            if (!orderSnapshot.exists) throw operationsError('COMMERCE_OUTBOX_ORDER_MISSING');
            try {
                const order = { id: orderId, ...orderSnapshot.data() };
                const message = messageFor(
                    {
                        template: entry.template,
                        payloadSnapshot: entry.payload
                    },
                    order,
                    sender.provider === 'resend'
                        ? RESEND_FROM_EMAIL.value()
                        : GMAIL_EMAIL.value()
                );
                if (entry.template === 'commerce-document-copy') {
                    const documentId = normalizeFirestoreId(
                        entry.payload?.documentId,
                        'Document outbox'
                    );
                    const documentRef = db.doc(`orders/${orderId}/documents/${documentId}`);
                    const documentSnapshot = await documentRef.get();
                    if (!documentSnapshot.exists) {
                        throw operationsError('COMMERCE_OUTBOX_DOCUMENT_MISSING');
                    }
                    const artifact = await materializeCommerceDocumentArtifact({
                        bucket: admin.storage().bucket(),
                        artifactRef: documentRef.collection('artifacts').doc('current'),
                        order,
                        document: documentSnapshot.data()
                    });
                    message.attachments = [{
                        filename: artifact.filename,
                        content: artifact.buffer,
                        contentType: artifact.contentType
                    }];
                }
                const result = await sender.send(
                    message,
                    { idempotencyKey: entry.idempotencyKey }
                );
                if (!result?.id) throw operationsError('COMMERCE_OUTBOX_PROVIDER_RESPONSE_INVALID');
                return { providerMessageId: result.id };
            } catch (error) {
                if (ambiguousGmailError(error, sender.provider)) {
                    error.code = 'GMAIL_DELIVERY_UNKNOWN';
                    error.deliveryUnknown = true;
                }
                throw error;
            }
        }
    });
    const queries = createFirestoreWorkerQueries({ db });
    const sweeper = (listEligible) => createBoundedWorkerSweeper({
        listEligible,
        processItem: (item) => worker.process(item.id),
        clock,
        pageSize: 25,
        maxPages: 4
    });
    return {
        due: sweeper(queries.listDueOutbox),
        expiredLeases: sweeper(queries.listExpiredOutboxLeases)
    };
}

async function upsertImmutableDocument(reference, document) {
    try {
        await reference.create(document);
        return 'created';
    } catch (error) {
        if (error?.code !== 6 && error?.code !== 'already-exists') throw error;
        const existing = await reference.get();
        if (!existing.exists || existing.data()?.contentHash !== document.contentHash) {
            throw operationsError('COMMERCE_DOCUMENT_IMMUTABILITY_CONFLICT');
        }
        return 'reused';
    }
}

async function rebuildDocuments(facts) {
    const factsByOrder = new Map();
    for (const fact of facts) {
        if (!factsByOrder.has(fact.orderId)) factsByOrder.set(fact.orderId, []);
        factsByOrder.get(fact.orderId).push(fact);
    }
    const orders = await db.collection('orders')
        .where('schemaVersion', '==', 2)
        .limit(MAX_ORDERS)
        .get();
    let created = 0;
    let reused = 0;
    for (const snapshot of orders.docs) {
        const order = { id: snapshot.id, ...snapshot.data() };
        const orderFacts = factsByOrder.get(snapshot.id) || [];
        if (order.payment?.status === 'succeeded') {
            const receipt = buildPaymentReceipt({
                order,
                facts: orderFacts,
                issuedAt: order.payment.succeededAt || new Date().toISOString()
            });
            const result = await upsertImmutableDocument(
                snapshot.ref.collection('documents').doc(receipt.documentId),
                receipt
            );
            if (result === 'created') created += 1;
            else reused += 1;
        }
        const reversedRefundIds = new Set(
            orderFacts
                .filter((fact) => fact.type === 'refund_reversal')
                .map((fact) => fact.providerObjectId)
        );
        const refundIds = [...new Set(
            orderFacts
                .filter((fact) => fact.type === 'refund' && !reversedRefundIds.has(
                    fact.providerObjectId
                ))
                .map((fact) => fact.providerObjectId)
        )];
        for (const refundId of refundIds) {
            const confirmation = buildRefundConfirmation({
                order,
                facts: orderFacts,
                refundId,
                issuedAt: orderFacts.find((fact) => fact.providerObjectId === refundId)?.effectiveAt
            });
            const result = await upsertImmutableDocument(
                snapshot.ref.collection('documents').doc(confirmation.documentId),
                confirmation
            );
            if (result === 'created') created += 1;
            else reused += 1;
        }
    }
    return { scannedOrders: orders.size, created, reused };
}

async function countQuery(query) {
    const snapshot = await query.limit(100).get();
    return snapshot.size;
}

async function connectDriftCount() {
    const [legacy, control] = await Promise.all([
        db.doc('sys_metadata/stripe_connect').get(),
        db.doc('sys_commerce_control/current').get()
    ]);
    const activeAccountId = legacy.exists ? legacy.data()?.activeAccountId : null;
    const policyVersion = control.exists ? control.data()?.activePolicyVersion : null;
    if (!activeAccountId || !policyVersion) return 1;
    const [account, policy] = await Promise.all([
        db.doc(`commerce_connect_accounts/${activeAccountId}`).get(),
        db.doc(`commerce_policy_versions/${policyVersion}`).get()
    ]);
    if (!account.exists || !policy.exists) return 1;
    return (
        account.data()?.active !== true ||
        account.data()?.chargesEnabled !== true ||
        account.data()?.detailsSubmitted !== true ||
        account.data()?.livemode === true ||
        policy.data()?.stripeConnectedAccountId !== activeAccountId
    ) ? 1 : 0;
}

async function buildHealth(projection) {
    const nowMillis = Date.now();
    const now = new Date(nowMillis).toISOString();
    const openIncidentsPromise = db.collection('commerce_incidents')
        .where('status', '==', 'open')
        .limit(101)
        .get();
    const [
        dueInbox,
        expiredInboxLeases,
        deadLetterOutbox,
        deliveryUnknown,
        expiredHolds,
        openIncidents,
        connectDrift
    ] = await Promise.all([
        countQuery(db.collection('commerce_webhook_inbox')
            .where('status', 'in', ['received', 'failed'])
            .where('nextAttemptAt', '<=', nowMillis)),
        countQuery(db.collection('commerce_webhook_inbox')
            .where('status', '==', 'processing')
            .where('processingUntil', '<=', nowMillis)),
        countQuery(db.collection('commerce_outbox').where('status', '==', 'dead_letter')),
        countQuery(db.collection('commerce_outbox').where('status', '==', 'delivery_unknown')),
        countQuery(db.collection('inventory_reservations')
            .where('status', '==', 'held')
            .where('expiresAt', '<=', now)),
        openIncidentsPromise,
        connectDriftCount()
    ]);
    const openIncidentData = openIncidents.docs.map((document) => ({
        id: document.id,
        ...document.data()
    }));
    const incidentCodes = openIncidentData.map((incident) => incident.code);
    const orphanPayments = incidentCodes
        .filter((code) => ['payment_orphan', 'payment_intent_orphan'].includes(code))
        .length;
    const refundStockDivergences = incidentCodes
        .filter((code) => ['refund_stock_divergence', 'inventory_conflict'].includes(code))
        .length;
    return evaluateCommerceHealth({
        dueInbox,
        expiredInboxLeases,
        deadLetterOutbox,
        deliveryUnknown,
        expiredHolds,
        orphanPayments,
        refundStockDivergences,
        connectDrift,
        projectionDivergences: projection.divergences.length,
        primaryIncidents: openIncidentData,
        primaryIncidentsTruncated: openIncidents.size > 100
    }, { evaluatedAt: new Date().toISOString() });
}

async function persistHealthIncidents(health) {
    const batch = db.batch();
    for (const [code, count] of Object.entries(health.counters)) {
        const reference = db.doc(`commerce_incidents/operations-${code}`);
        batch.set(reference, {
            schemaVersion: 2,
            code: `operations_${code}`,
            status: count > 0 ? 'open' : 'closed',
            count,
            source: 'commerce_operations_reconciler',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    await batch.commit();
}

async function persistFinancialRollups(facts, projection, builtAt) {
    const counts = new Map();
    for (const fact of facts) {
        if (fact?.status && fact.status !== 'succeeded') continue;
        const delta = buildFinancialRollupDelta(fact);
        const dayId = `${delta.dateKey}_${delta.currency}`;
        counts.set(dayId, (counts.get(dayId) || 0) + 1);
        counts.set(delta.currency, (counts.get(delta.currency) || 0) + 1);
    }
    const writes = [];
    for (const [currency, amounts] of Object.entries(projection.currencies)) {
        writes.push({
            reference: db.doc(`commerce_financial_totals/${currency}`),
            data: {
                schemaVersion: 2,
                currency,
                ...amounts,
                factCount: counts.get(currency) || 0,
                rebuiltAt: builtAt,
                updatedAt: builtAt
            }
        });
    }
    for (const day of Object.values(projection.days)) {
        const dayId = `${day.date}_${day.currency}`;
        writes.push({
            reference: db.doc(`commerce_financial_daily/${dayId}`),
            data: {
                schemaVersion: 2,
                dateKey: day.date,
                currency: day.currency,
                capturedCents: day.capturedCents,
                refundedCents: day.refundedCents,
                netCents: day.netCents,
                factCount: counts.get(dayId) || 0,
                rebuiltAt: builtAt,
                updatedAt: builtAt
            }
        });
    }
    let repairedDocuments = 0;
    let newerDocumentsPreserved = 0;
    for (let offset = 0; offset < writes.length; offset += 100) {
        const chunk = writes.slice(offset, offset + 100);
        const result = await db.runTransaction(async (transaction) => {
            const snapshots = await Promise.all(
                chunk.map((write) => transaction.get(write.reference))
            );
            let repaired = 0;
            let preserved = 0;
            snapshots.forEach((snapshot, index) => {
                const write = chunk[index];
                const currentFactCount = snapshot.exists
                    ? Number(snapshot.data()?.factCount || 0)
                    : -1;
                if (currentFactCount > write.data.factCount) {
                    preserved += 1;
                    return;
                }
                transaction.set(write.reference, write.data);
                repaired += 1;
            });
            return { repaired, preserved };
        });
        repairedDocuments += result.repaired;
        newerDocumentsPreserved += result.preserved;
    }
    return {
        totalDocuments: Object.keys(projection.currencies).length,
        dailyDocuments: Object.keys(projection.days).length,
        repairedDocuments,
        newerDocumentsPreserved
    };
}

async function runOperationsRebuild() {
    const factsSnapshot = await db.collection('commerce_financial_facts').limit(MAX_FACTS).get();
    const facts = factsSnapshot.docs.map((document) => document.data());
    const builtAt = new Date().toISOString();
    const projection = buildFinancialProjection(facts, { builtAt });
    await db.doc('commerce_financial_projections/current').set(projection);
    const [documents, financialRollups] = await Promise.all([
        rebuildDocuments(facts),
        persistFinancialRollups(facts, projection, builtAt)
    ]);
    const health = await buildHealth(projection);
    await Promise.all([
        db.doc('sys_commerce_operations/current').set({
            ...health,
            projection: {
                source: projection.source,
                projectionHash: projection.projectionHash,
                factCount: projection.factCount,
                builtAt,
                divergenceCount: projection.divergences.length,
                currencies: projection.currencies
            },
            documents,
            financialRollups,
            appId: APP_ID
        }),
        persistHealthIncidents(health)
    ]);
    const healthLog = {
        schemaVersion: health.schemaVersion,
        status: health.status,
        primaryOpenIncidentCount: health.primaryOpenIncidentCount,
        incidentSampleCodes: health.incidentSampleCodes,
        truncated: health.truncated,
        validUntil: health.validUntil
    };
    if (health.status === 'stop') console.error('commerce_health_unhealthy', healthLog);
    else if (health.status === 'warning') console.warn('commerce_health_unhealthy', healthLog);
    else console.info('commerce_health_healthy', healthLog);
    return { projection, health, documents, financialRollups };
}

async function runOutboxDispatcher({
    logger = console,
    nowMillis = () => Date.now(),
    runId = () => crypto.randomUUID()
} = {}) {
    const startedAtMillis = nowMillis();
    const runtime = createOutboxRuntime();
    const due = await runtime.due.run();
    const expiredLeases = await runtime.expiredLeases.run();
    const summary = buildWorkerRunSummary({
        worker: 'commerce_outbox',
        runId: runId(),
        startedAtMillis,
        finishedAtMillis: nowMillis(),
        results: [
            { name: 'due', result: due },
            { name: 'expired_leases', result: expiredLeases }
        ]
    });
    if (summary.status === 'incomplete') logger.error('commerce_worker_incomplete', summary);
    else logger.info('commerce_worker_completed', summary);
    assertWorkerRunComplete(summary);
    return { due, expiredLeases };
}

const PAID_ORDER_STATUSES = [
    'paid',
    'completed',
    'refunded',
    'refund_pending',
    'refund_failed'
];
const CANCELLED_ORDER_STATUSES = [
    'cancelled',
    'cancelled_by_client',
    'canceled'
];

async function countOrders(query) {
    const snapshot = await query.count().get();
    return Number(snapshot.data().count || 0);
}

async function buildAdminOrderSummary() {
    const orders = db.collection('orders');
    const [allOrders, cancelledOrders, paidOrders, shippedOrders] = await Promise.all([
        countOrders(orders),
        countOrders(orders.where('status', 'in', CANCELLED_ORDER_STATUSES)),
        countOrders(orders.where('status', 'in', PAID_ORDER_STATUSES)),
        countOrders(orders.where('status', '==', 'shipped'))
    ]);
    const totalOrders = Math.max(0, allOrders - cancelledOrders);
    const pendingOrders = Math.max(0, totalOrders - paidOrders - shippedOrders);
    return {
        totalOrders,
        paidOrders,
        shippedOrders,
        pendingOrders,
        cancelledOrders,
        countedAt: new Date().toISOString()
    };
}

async function buildAdminFinancialSummary() {
    const snapshot = await db.doc('commerce_financial_totals/EUR').get();
    if (!snapshot.exists) return null;
    const amounts = snapshot.data();
    return {
        currencies: {
            EUR: {
                capturedCents: Number(amounts.capturedCents || 0),
                refundedCents: Number(amounts.refundedCents || 0),
                netCents: Number(amounts.netCents || 0)
            }
        },
        countedAt: amounts.updatedAt || new Date().toISOString(),
        source: 'commerce_financial_totals'
    };
}

async function buildAdminFinancialDaily() {
    const snapshot = await db.collection('commerce_financial_daily')
        .orderBy('dateKey', 'desc')
        .limit(366)
        .get();
    return snapshot.docs
        .map((document) => {
            const day = document.data();
            return {
                dateKey: day.dateKey,
                currency: day.currency,
                capturedCents: Number(day.capturedCents || 0),
                refundedCents: Number(day.refundedCents || 0),
                netCents: Number(day.netCents || 0)
            };
        })
        .sort((left, right) => String(left.dateKey).localeCompare(String(right.dateKey)));
}

const commerceOutboxDispatcher = regionalFunctions()
    .runWith({
        secrets: OUTBOX_SECRETS,
        timeoutSeconds: 300,
        memory: '512MB',
        maxInstances: 1
    })
    .pubsub.schedule('every 2 minutes')
    .onRun(runOutboxDispatcher);

const commerceOperationsReconciler = regionalFunctions()
    .runWith({
        serviceAccount: COMMERCE_OPERATIONS_RUNTIME_SERVICE_ACCOUNT,
        timeoutSeconds: 300,
        memory: '512MB',
        maxInstances: 1
    })
    .pubsub.schedule('every 60 minutes')
    .onRun(runOperationsRebuild);

const getCommerceOperationsStatusAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(async (_data, context) => {
        await checkActiveStrongAdmin(context);
        const [operations, control, orderSummary, financialSummary, financialDaily] = await Promise.all([
            db.doc('sys_commerce_operations/current').get(),
            db.doc('sys_commerce_control/current').get(),
            buildAdminOrderSummary(),
            buildAdminFinancialSummary(),
            buildAdminFinancialDaily()
        ]);
        const operationsData = operations.exists ? operations.data() : null;
        return {
            success: true,
            operations: operationsData ? {
                ...operationsData,
                effective: effectiveCommerceHealth(operationsData)
            } : null,
            orderSummary,
            financialSummary,
            financialDaily,
            control: control.exists ? {
                newCheckoutMode: control.data()?.newCheckoutMode || 'off',
                adminMutationMode: control.data()?.adminMutationMode || 'read_only',
                fixtureScopeVersion: control.data()?.fixtureScopeVersion || null,
                controlRevision: control.data()?.controlRevision || null
            } : null
        };
    });

const rebuildCommerceOperationsAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true, timeoutSeconds: 300, memory: '512MB' })
    .https.onCall(async (_data, context) => {
        await checkActiveStrongAdmin(context);
        const result = await runOperationsRebuild();
        return {
            success: true,
            projectionHash: result.projection.projectionHash,
            factCount: result.projection.factCount,
            healthStatus: result.health.status,
            documents: result.documents,
            financialRollups: result.financialRollups
        };
    });

const cleanupFixtureRunAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true, timeoutSeconds: 180, memory: '512MB' })
    .https.onCall(async (data, context) => {
        await checkActiveStrongAdmin(context);
        const runId = normalizeFirestoreId(data?.runId, 'Run fixture');
        if (!runId.startsWith('run_')) {
            throw new functions.https.HttpsError('invalid-argument', 'Run fixture invalide.');
        }
        const dryRun = data?.commit !== true;
        if (!dryRun && data?.confirm !== `QUARANTINE_${runId}`) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'Confirmation de quarantaine fixture invalide.'
            );
        }
        const documents = [];
        let boundedLimitReached = false;
        for (const collection of FIXTURE_COLLECTIONS) {
            const snapshot = await db.collection(collection)
                .where('testContext.runId', '==', runId)
                .limit(100)
                .get();
            if (snapshot.size === 100) boundedLimitReached = true;
            for (const document of snapshot.docs) {
                documents.push({
                    collection,
                    id: document.id,
                    status: document.data()?.status || null,
                    testContext: document.data()?.testContext || null
                });
            }
        }
        const plan = planFixtureCleanup({ runId, documents, dryRun });
        if (!dryRun) {
            const quarantine = plan.actions.filter((entry) => entry.action === 'quarantine');
            for (let offset = 0; offset < quarantine.length; offset += 400) {
                const batch = db.batch();
                for (const entry of quarantine.slice(offset, offset + 400)) {
                    batch.set(db.doc(`${entry.collection}/${entry.id}`), {
                        fixtureCleanup: {
                            schemaVersion: 2,
                            status: 'quarantined',
                            runId,
                            reason: entry.reason,
                            operationId: `cleanup_${runId}`
                        },
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
                await batch.commit();
            }
        }
        return {
            success: true,
            complete: !boundedLimitReached,
            plan
        };
    });

module.exports = {
    buildAdminFinancialDaily,
    buildAdminFinancialSummary,
    buildAdminOrderSummary,
    cleanupFixtureRunAdmin,
    commerceOperationsReconciler,
    commerceOutboxDispatcher,
    getCommerceOperationsStatusAdmin,
    messageFor,
    rebuildCommerceOperationsAdmin,
    persistFinancialRollups,
    runOperationsRebuild,
    runOutboxDispatcher
};
