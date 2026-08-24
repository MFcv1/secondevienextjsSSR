/**
 * EMAIL: Transporteur + Triggers de commande
 * 
 * - onOrderCreated: Email admin + client à la création
 * - onOrderUpdated: Email client pour expédition et livraison
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { getSiteUrl } = require('../../helpers/config');
const { checkActiveStrongAdmin, normalizeFirestoreId } = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    TRANSACTIONAL_EMAIL_SECRETS,
    buildEmailIdempotencyKey,
    getTransactionalEmailRuntime
} = require('./transactionalEmailRuntime');
const { createLegacyOrderEmailDelivery } = require('./legacyOrderEmailDelivery');
const {
    EMAIL_COLORS,
    EMAIL_FONT_STACK,
    renderCallout,
    renderEmailShell,
    renderSummaryGrid
} = require('./emailDesignSystem');

const db = admin.firestore();
const REFUND_EMAIL_STATUSES = new Set(['refund_pending', 'refunded', 'refund_failed']);
const V2_EMAIL_OUTBOX_REQUIRED = 2;
const LEGACY_ORDER_EMAIL_RUNTIME_SERVICE_ACCOUNT =
    'legacy-order-email-worker@secondevienextjsssr.iam.gserviceaccount.com';
const MANUAL_EMAIL_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: 'email-manual-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    enforceAppCheck: true,
    secrets: TRANSACTIONAL_EMAIL_SECRETS
});
let cachedLegacyEmailDelivery = null;

function getLegacyEmailDelivery() {
    if (!cachedLegacyEmailDelivery) {
        const emailRuntime = getTransactionalEmailRuntime();
        cachedLegacyEmailDelivery = {
            provider: emailRuntime.provider,
            fromAddress: emailRuntime.fromAddress,
            deliver: createLegacyOrderEmailDelivery({
                db,
                sender: emailRuntime.sender,
                provider: emailRuntime.provider
            })
        };
    }
    return cachedLegacyEmailDelivery;
}

function logLegacyEmailDelivery(kind, outcome) {
    console.log('legacy_order_email_delivery', {
        kind,
        status: outcome.status,
        correlation: outcome.deliveryId.slice(0, 16)
    });
}

function operationalErrorSummary(error) {
    return {
        name: String(error?.name || 'Error').slice(0, 80),
        code: String(error?.code || 'unknown').slice(0, 120)
    };
}

function orderDisplayReference(orderId, order = {}) {
    const number = Number(order.orderNumber);
    return Number.isSafeInteger(number) && number > 0
        ? `CMD-${number}`
        : `CMD-${String(orderId || '').slice(0, 8).toUpperCase()}`;
}

function escapeHtml(unsafe) {
    if (!unsafe || typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function getShippingPostalCode(shipping = {}) {
    return String(shipping.postalCode || shipping.zip || '').trim();
}

function formatShippingInfo(shipping = {}) {
    const address = shipping.address || shipping.street || '';
    const cityLine = [getShippingPostalCode(shipping), shipping.city].filter(Boolean).join(' ');
    return [address, cityLine].filter(Boolean).map(escapeHtml).join(', ') || 'Non specifie';
}

/**
 * Envoi des emails de confirmation (Admin + Client)
 * Extrait en helper pour être réutilisé par onOrderCreated et onOrderUpdated
 */
async function sendNewOrderEmails(orderId, order) {
    const emailDelivery = getLegacyEmailDelivery();
    const adminEmail = emailDelivery.fromAddress;

    const clientEmail = order.userEmail || order.shipping?.email;
    const SITE_URL = getSiteUrl();

    const safeEmail = escapeHtml(clientEmail || "inconnu");
    const itemsHtml = (order.items || []).map(item =>
        `<li>${item.quantity || 1}x <b>${escapeHtml(item.name || "Article")}</b> - ${item.price}€</li>`
    ).join('');

    const shippingInfo = order.shipping ? formatShippingInfo(order.shipping) : "Non specifie";
    const reference = orderDisplayReference(orderId, order);
    const amountLabel = `${Number(order.total || 0).toLocaleString('fr-FR')} €`;
    const paymentLabel = order.paymentMethod === 'stripe' || order.status === 'paid'
        ? 'Carte bancaire · validée'
        : 'Règlement à finaliser';
    const orderContentHtml = `
        <div style="color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:14px;line-height:1.65;">
            <div style="color:${EMAIL_COLORS.text};font-size:17px;line-height:1.3;font-weight:650;letter-spacing:-.25px;">Articles</div>
            <ul style="margin:10px 0 0;padding-left:20px;">${itemsHtml}</ul>
        </div>
    `;

    // Email Admin
    const adminMailOptions = {
        from: `Seconde Vie <${adminEmail}>`,
        to: adminEmail,
        subject: `Nouvelle commande ${reference} · ${amountLabel}`,
        text: [
            `Nouvelle commande ${reference}`,
            `Client : ${clientEmail || 'inconnu'}`,
            `Total : ${amountLabel}`,
            `Paiement : ${paymentLabel}`,
            `Livraison : ${String(shippingInfo).replace(/<[^>]+>/g, '')}`,
            `${SITE_URL}/admin`
        ].join('\n'),
        html: renderEmailShell({
            preheader: `${reference} · ${amountLabel} · nouvelle commande`,
            eyebrow: 'Nouvelle commande',
            title: 'Nouvelle commande.',
            intro: `${order.shipping?.fullName || 'Un client'} vient de confirmer une commande. Vérifiez le règlement et les modalités de livraison.`,
            summaryHtml: renderSummaryGrid([
                { label: 'Commande', value: reference },
                { label: 'Paiement', value: paymentLabel, color: order.status === 'paid' ? EMAIL_COLORS.success : EMAIL_COLORS.warning },
                { label: 'Total', value: amountLabel }
            ]),
            contentHtml: `${orderContentHtml}
                <div style="margin-top:20px;padding-top:18px;border-top:1px solid ${EMAIL_COLORS.line};color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.55;">
                    <strong style="display:block;margin-bottom:6px;color:${EMAIL_COLORS.text};font-weight:650;">${safeEmail}</strong>
                    ${shippingInfo}
                </div>`,
            calloutHtml: renderCallout({
                title: 'À vérifier dans le back-office',
                body: 'Contrôlez le paiement, les coordonnées client et la prochaine étape avant de traiter la commande.',
                role: order.status === 'paid' ? 'success' : 'warning'
            }),
            actionLabel: 'Ouvrir le back-office',
            actionUrl: `${SITE_URL}/admin`,
            footer: 'Notification opérationnelle réservée à l’administration Seconde Vie.',
            titleAlign: 'left'
        })
    };

    // Instructions paiement différé (si applicable)
    const paymentInstructions = (order.paymentMethod === 'deferred' || order.paymentMethod === 'manual' || order.status === 'pending_payment')
        ? renderCallout({
            title: 'Règlement à finaliser',
            body: 'Effectuez le règlement par virement ou selon le moyen convenu avec l’atelier. La commande sera préparée après réception.',
            role: 'warning'
        })
        : renderCallout({
            title: 'Commande confirmée',
            body: 'L’atelier va maintenant vérifier votre pièce et préparer la prochaine étape.',
            role: 'success'
        });

    // Email Client
    const clientMailOptions = clientEmail ? {
        from: `Seconde Vie <${adminEmail}>`,
        to: clientEmail,
        subject: `Commande ${reference} confirmée · Seconde Vie`,
        text: [
            `Bonjour ${order.shipping?.fullName || ''},`,
            `Votre commande ${reference} est confirmée.`,
            `Total : ${amountLabel}`,
            `Paiement : ${paymentLabel}`,
            `Livraison : ${String(shippingInfo).replace(/<[^>]+>/g, '')}`
        ].join('\n'),
        html: renderEmailShell({
            preheader: `${reference} · ${amountLabel} · commande confirmée`,
            eyebrow: 'Commande confirmée',
            title: 'Votre commande est confirmée.',
            intro: `Bonjour ${order.shipping?.fullName || ''}, votre commande est bien enregistrée auprès de l’atelier.`,
            summaryHtml: renderSummaryGrid([
                { label: 'Commande', value: reference },
                { label: 'Paiement', value: paymentLabel, color: order.status === 'paid' ? EMAIL_COLORS.success : EMAIL_COLORS.warning },
                { label: 'Total', value: amountLabel }
            ]),
            contentHtml: `${orderContentHtml}
                <div style="margin-top:20px;padding-top:18px;border-top:1px solid ${EMAIL_COLORS.line};color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.55;">
                    <strong style="display:block;margin-bottom:6px;color:${EMAIL_COLORS.text};font-weight:650;">Livraison</strong>
                    ${shippingInfo}
                </div>`,
            calloutHtml: paymentInstructions,
            footer: 'Confirmation transactionnelle Seconde Vie. Conservez cette référence pour toute question.'
        })
    } : null;

    const emailProof = {
        attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
        admin: { to: adminEmail, sent: false },
        client: { to: clientEmail || null, sent: false }
    };

    const adminOutcome = await emailDelivery.deliver({
        orderId,
        kind: 'order-created-admin',
        message: adminMailOptions
    });
    logLegacyEmailDelivery('order-created-admin', adminOutcome);
    emailProof.admin.sent = adminOutcome.status === 'sent';
    emailProof.admin.provider = emailDelivery.provider;
    emailProof.admin.deliveryStatus = adminOutcome.status;

    if (clientMailOptions) {
        const clientOutcome = await emailDelivery.deliver({
            orderId,
            kind: 'order-created-client',
            message: clientMailOptions
        });
        logLegacyEmailDelivery('order-created-client', clientOutcome);
        emailProof.client.sent = clientOutcome.status === 'sent';
        emailProof.client.provider = emailDelivery.provider;
        emailProof.client.deliveryStatus = clientOutcome.status;
    }

    await db.collection('orders').doc(orderId).set({
        emailProof,
        emailProofUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch((error) => {
        console.error("Email proof write error:", operationalErrorSummary(error));
    });
}

function formatRefundAmount(order) {
    const amount = Number(order.refundAmount);
    if (Number.isFinite(amount) && amount > 0) {
        const currency = String(order.refundCurrency || 'eur').toUpperCase();
        return `${(amount / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
    }
    const total = Number(order.total);
    return Number.isFinite(total) ? `${total.toLocaleString('fr-FR')} EUR` : 'montant de la commande';
}

function getRefundEmailCopy(order) {
    if (order.status === 'refunded') {
        return {
            subject: 'Votre remboursement est confirme',
            title: 'Votre remboursement est confirmé.',
            body: 'Stripe a confirme le remboursement. Selon votre banque, le credit peut encore prendre quelques jours ouvrables avant d apparaitre sur votre compte.'
        };
    }

    if (order.status === 'refund_failed') {
        return {
            subject: 'Information sur votre remboursement',
            title: 'Votre remboursement est à vérifier.',
            body: 'Une verification est necessaire cote atelier ou cote Stripe. Nous revenons vers vous des que la situation est debloquee.'
        };
    }

    return {
        subject: 'Votre remboursement a ete initie',
        title: 'Votre remboursement est en cours.',
        body: 'Le remboursement a ete lance via Stripe sur le moyen de paiement initial. Le credit apparait generalement sous 5 a 10 jours ouvrables selon votre banque.'
    };
}

exports.sendTestEmail = regionalFunctions().runWith({ enforceAppCheck: true, secrets: TRANSACTIONAL_EMAIL_SECRETS }).https.onCall(async (data, context) => {
    await checkActiveStrongAdmin(context);

    let emailRuntime;
    try {
        emailRuntime = getTransactionalEmailRuntime();
    } catch (error) {
        console.error('Email diagnostic provider configuration error:', operationalErrorSummary(error));
        throw new functions.https.HttpsError('failed-precondition', 'Configuration email incomplète.');
    }

    const adminEmail = emailRuntime.fromAddress;
    const recipient = context.auth?.token?.email || adminEmail;
    const SITE_URL = getSiteUrl();

    await emailRuntime.sender.send({
        from: `Diagnostic Seconde Vie <${adminEmail}>`,
        to: recipient,
        subject: 'Diagnostic e-mail Seconde Vie',
        text: `Le transport des e-mails Seconde Vie est opérationnel.\n${SITE_URL}`,
        html: renderEmailShell({
            preheader: 'Le transport des e-mails Seconde Vie est opérationnel.',
            eyebrow: 'Diagnostic technique',
            title: 'Tout fonctionne.',
            intro: 'Le fournisseur transactionnel a accepté ce message de diagnostic.',
            summaryHtml: renderSummaryGrid([
                { label: 'État', value: 'Opérationnel', color: EMAIL_COLORS.success },
                { label: 'Environnement', value: 'Sandbox' }
            ]),
            calloutHtml: renderCallout({
                title: 'Contrôle terminé',
                body: 'La réception de ce message confirme le parcours d’envoi jusqu’à cette boîte.',
                role: 'success'
            }),
            actionLabel: 'Ouvrir le sandbox',
            actionUrl: SITE_URL,
            footer: 'Message de diagnostic réservé à l’administration Seconde Vie.'
        })
    }, {
        idempotencyKey: buildEmailIdempotencyKey('email-diagnostic', context.auth?.uid, Date.now())
    });

    return { success: true, to: recipient, provider: emailRuntime.provider };
});

exports.sendRefundStatusEmailAdmin = regionalFunctions().runWith({ enforceAppCheck: true, secrets: TRANSACTIONAL_EMAIL_SECRETS }).https.onCall(async (data, context) => {
    await checkActiveStrongAdmin(context);
    const orderId = normalizeFirestoreId(data?.orderId, 'ID commande');
    const orderRef = db.collection('orders').doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'Commande introuvable.');
    }

    const order = snap.data();
    if (!REFUND_EMAIL_STATUSES.has(order.status)) {
        throw new functions.https.HttpsError('failed-precondition', 'La commande n est pas dans un statut de remboursement.');
    }
    if (!order.stripeRefundId && order.status !== 'refund_failed') {
        throw new functions.https.HttpsError('failed-precondition', 'Aucune reference refund Stripe disponible.');
    }
    const force = data?.force === true;
    if (!force
        && order.refundEmailProof?.sent === true
        && order.refundEmailProof?.status === order.status
        && (order.refundEmailProof?.stripeRefundId || null) === (order.stripeRefundId || null)) {
        return {
            success: true,
            skipped: true,
            to: order.refundEmailProof.to || order.userEmail || order.shipping?.email || null,
            status: order.status || null
        };
    }

    const clientEmail = order.userEmail || order.shipping?.email;
    if (!clientEmail) {
        throw new functions.https.HttpsError('failed-precondition', 'Aucun email client disponible pour cette commande.');
    }

    let emailRuntime;
    try {
        emailRuntime = getTransactionalEmailRuntime();
    } catch (error) {
        console.error('Refund email provider configuration error:', operationalErrorSummary(error));
        throw new functions.https.HttpsError('failed-precondition', 'Configuration email incomplete.');
    }

    const adminEmail = emailRuntime.fromAddress;
    const copy = getRefundEmailCopy(order);
    const refundId = order.stripeRefundId || null;
    const itemsHtml = (order.items || []).map(item =>
        `<li>${item.quantity || 1}x <b>${escapeHtml(item.name || "Article")}</b></li>`
    ).join('');
    const reference = orderDisplayReference(orderId, order);
    const amountLabel = formatRefundAmount(order);
    const refundRole = order.status === 'refunded'
        ? 'success'
        : order.status === 'refund_failed'
            ? 'danger'
            : 'info';
    const statusLabel = order.status === 'refunded'
        ? 'Confirmé'
        : order.status === 'refund_failed'
            ? 'À vérifier'
            : 'En cours';

    await emailRuntime.sender.send({
        from: `Seconde Vie <${adminEmail}>`,
        to: clientEmail,
        subject: copy.subject,
        text: [
            `Bonjour ${order.shipping?.fullName || ''},`,
            copy.body,
            `Commande : ${reference}`,
            `Montant : ${amountLabel}`,
            refundId ? `Référence Stripe : ${refundId}` : null
        ].filter(Boolean).join('\n'),
        html: renderEmailShell({
            preheader: `${reference} · remboursement ${statusLabel.toLowerCase()}`,
            eyebrow: 'Suivi du remboursement',
            title: copy.title,
            intro: `Bonjour ${order.shipping?.fullName || ''}, ${copy.body}`,
            summaryHtml: renderSummaryGrid([
                { label: 'Commande', value: reference },
                { label: 'Statut', value: statusLabel, color: EMAIL_COLORS[refundRole] },
                { label: 'Montant', value: amountLabel }
            ]),
            contentHtml: itemsHtml ? `
                <div style="color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:14px;line-height:1.65;">
                    <div style="color:${EMAIL_COLORS.text};font-size:17px;line-height:1.3;font-weight:650;letter-spacing:-.25px;">Pièces concernées</div>
                    <ul style="margin:10px 0 0;padding-left:20px;">${itemsHtml}</ul>
                </div>` : '',
            calloutHtml: renderCallout({
                title: order.status === 'refunded' ? 'Crédit bancaire en cours' : 'Dossier suivi par l’atelier',
                body: order.status === 'refunded'
                    ? 'Selon votre banque, le crédit peut prendre quelques jours ouvrables avant d’apparaître.'
                    : 'Aucune action supplémentaire n’est nécessaire de votre côté pour le moment.',
                role: refundRole,
                detail: refundId ? `Référence Stripe : ${refundId}` : null
            }),
            footer: 'Message transactionnel Seconde Vie concernant votre commande.'
        })
    }, {
        idempotencyKey: buildEmailIdempotencyKey(
            'refund-status',
            orderId,
            order.status,
            order.stripeRefundId,
            force ? Date.now() : 'canonical'
        )
    });

    await orderRef.set({
        refundEmailProof: {
            to: clientEmail,
            sent: true,
            status: order.status || null,
            stripeRefundId: order.stripeRefundId || null,
            provider: emailRuntime.provider,
            sentAt: admin.firestore.FieldValue.serverTimestamp()
        },
        refundEmailProofUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, to: clientEmail, status: order.status || null, provider: emailRuntime.provider };
});

exports.sendTestEmailGen2 = onCall(
    MANUAL_EMAIL_GEN2_RUNTIME,
    async (request) => exports.sendTestEmail.run(request.data, request)
);
exports.sendRefundStatusEmailAdminGen2 = onCall(
    MANUAL_EMAIL_GEN2_RUNTIME,
    async (request) => exports.sendRefundStatusEmailAdmin.run(request.data, request)
);

// --- TRIGGER: Nouvelle Commande ---
exports.onOrderCreated = onDocumentCreated(
    {
        document: 'orders/{orderId}',
        region: 'europe-west1',
        secrets: TRANSACTIONAL_EMAIL_SECRETS,
        serviceAccount: LEGACY_ORDER_EMAIL_RUNTIME_SERVICE_ACCOUNT,
        cpu: 1,
        concurrency: 1,
        minInstances: 0,
        maxInstances: 1,
        memory: '256MiB',
        timeoutSeconds: 60,
        retry: true
    },
    async (event) => {
        const order = event.data?.data();
        if (!order) return null;
        if (Number(order.schemaVersion || 0) >= V2_EMAIL_OUTBOX_REQUIRED) return null;

        // Si c'est une commande Stripe Elements "pending", on NE FAIT RIEN pour l'instant.
        // L'email sera envoyé via onOrderUpdated une fois le paiement confirmé (status => 'paid')
        if (order.paymentMethod === 'stripe_elements' && order.status === 'pending_payment') {
            console.log('legacy_order_email_deferred', { reason: 'pending_payment' });
            return null;
        }

        // Pour les autres cas (paiement différé, ou ancienne commande stripe_checkout direct en paid)
        await sendNewOrderEmails(event.params.orderId, order);
        return null;
    }
);

// --- TRIGGER: Mise à jour commande (confirmation paiement, expédition, livraison) ---
exports.onOrderUpdated = onDocumentUpdated(
    {
        document: 'orders/{orderId}',
        region: 'europe-west1',
        secrets: TRANSACTIONAL_EMAIL_SECRETS,
        serviceAccount: LEGACY_ORDER_EMAIL_RUNTIME_SERVICE_ACCOUNT,
        cpu: 1,
        concurrency: 1,
        minInstances: 0,
        maxInstances: 1,
        memory: '256MiB',
        timeoutSeconds: 60,
        retry: true
    },
    async (event) => {
        const orderBefore = event.data?.before?.data();
        const orderAfter = event.data?.after?.data();
        if (!orderBefore || !orderAfter) return null;
        if (
            Number(orderBefore.schemaVersion || 0) >= V2_EMAIL_OUTBOX_REQUIRED ||
            Number(orderAfter.schemaVersion || 0) >= V2_EMAIL_OUTBOX_REQUIRED
        ) return null;
        const orderId = event.params.orderId;
        const clientEmail = orderAfter.userEmail || orderAfter.shipping?.email;

        // --- 1. EMAIL DE CONFIRMATION (Stripe Elements: pending_payment → paid) ---
        if (orderBefore.status === 'pending_payment' && orderAfter.status === 'paid') {
            console.log('legacy_order_email_transition', { transition: 'pending_payment_to_paid' });
            await sendNewOrderEmails(orderId, orderAfter);
        }

        if (!clientEmail) return null;

        const emailDelivery = getLegacyEmailDelivery();
        const adminEmail = emailDelivery.fromAddress;
        const reference = orderDisplayReference(orderId, orderAfter);

        // --- 2. SHIPPED ---
        if (orderAfter.status === 'shipped' && orderBefore.status !== 'shipped') {
            const outcome = await emailDelivery.deliver({
                orderId,
                kind: 'order-shipped',
                message: {
                    from: `Seconde Vie <${adminEmail}>`,
                    to: clientEmail,
                    subject: `${reference} est expédiée · Seconde Vie`,
                    text: [
                        `Bonjour ${orderAfter.shipping?.fullName || ''},`,
                        `Votre commande ${reference} vient d’être expédiée.`,
                        orderAfter.trackingNumber ? `Numéro de suivi : ${orderAfter.trackingNumber}` : null
                    ].filter(Boolean).join('\n'),
                    html: renderEmailShell({
                        preheader: `${reference} vient d’être expédiée.`,
                        eyebrow: 'Expédition confirmée',
                        title: 'Votre commande a été expédiée.',
                        intro: `Bonjour ${orderAfter.shipping?.fullName || ''}, votre commande vient de quitter l’atelier.`,
                        summaryHtml: renderSummaryGrid([
                            { label: 'Commande', value: reference },
                            { label: 'Statut', value: 'Expédiée', color: EMAIL_COLORS.info }
                        ]),
                        calloutHtml: renderCallout({
                            title: orderAfter.trackingNumber ? 'Suivi disponible' : 'Remise par le transporteur',
                            body: orderAfter.trackingNumber
                                ? 'Conservez ce numéro pour suivre l’acheminement de votre commande.'
                                : 'Le transporteur vous communiquera directement les modalités de remise.',
                            role: 'info',
                            detail: orderAfter.trackingNumber ? `Numéro de suivi : ${orderAfter.trackingNumber}` : null
                        }),
                        footer: 'Message transactionnel Seconde Vie concernant la livraison de votre commande.'
                    })
                }
            });
            logLegacyEmailDelivery('order-shipped', outcome);
        }

        // --- COMPLETED (Delivered) ---
        if (orderAfter.status === 'completed' && orderBefore.status !== 'completed') {
            const outcome = await emailDelivery.deliver({
                orderId,
                kind: 'order-completed',
                message: {
                    from: `Seconde Vie <${adminEmail}>`,
                    to: clientEmail,
                    subject: `${reference} est livrée · Seconde Vie`,
                    text: [
                        `Bonjour ${orderAfter.shipping?.fullName || ''},`,
                        `Votre commande ${reference} a été livrée.`,
                        'Merci pour votre confiance.'
                    ].join('\n'),
                    html: renderEmailShell({
                        preheader: `${reference} a été livrée.`,
                        eyebrow: 'Livraison terminée',
                        title: 'Votre commande a été livrée.',
                        intro: `Bonjour ${orderAfter.shipping?.fullName || ''}, la livraison de votre commande est confirmée. Merci pour votre confiance.`,
                        summaryHtml: renderSummaryGrid([
                            { label: 'Commande', value: reference },
                            { label: 'Statut', value: 'Livrée', color: EMAIL_COLORS.success }
                        ]),
                        calloutHtml: renderCallout({
                            title: 'Une question après livraison ?',
                            body: 'Répondez simplement à cet e-mail avec votre référence. L’atelier retrouvera votre dossier.',
                            role: 'success'
                        }),
                        footer: 'Message transactionnel Seconde Vie concernant votre commande.'
                    })
                }
            });
            logLegacyEmailDelivery('order-completed', outcome);
        }

        return null;
    }
);
