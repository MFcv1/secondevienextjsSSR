'use strict';

const { getOrderReference } = require('../shared/orderReference.cjs');

const {
    EMAIL_COLORS,
    EMAIL_FONT_STACK,
    escapeHtml,
    renderCallout,
    renderEmailShell,
    renderSummaryGrid
} = require('./emailDesignSystem');
const {
    resolveShippingTracking
} = require('../commerce/domain/shippingTracking');

function formatMoney(amountCents, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: String(currency || 'EUR').toUpperCase()
    }).format(Number(amountCents || 0) / 100);
}

function orderReference(order) {
    return getOrderReference(order);
}

function deliveryLabel(order) {
    const modeId = order?.deliverySnapshot?.id;
    if (modeId === 'delivery-pickup') return 'Retrait à l’atelier';
    if (modeId === 'delivery-local') return 'Livraison Marseille & alentours';
    if (modeId === 'delivery-carrier') return 'Transporteur spécialisé';
    return Number(order?.amounts?.shippingCents || 0) === 0 ? 'Livraison offerte' : 'Livraison';
}

function customerName(order) {
    return String(order?.shippingSnapshot?.fullName || '').trim();
}

function customerGreeting(order) {
    const name = customerName(order);
    return name ? `Bonjour ${name}, ` : '';
}

function statusColor(role) {
    if (role === 'danger') return EMAIL_COLORS.danger;
    if (role === 'info') return EMAIL_COLORS.info;
    if (role === 'warning') return EMAIL_COLORS.warning;
    return EMAIL_COLORS.success;
}

function addressLines(order) {
    const shipping = order?.shippingSnapshot || {};
    return [
        shipping.fullName,
        shipping.line1,
        shipping.line2,
        [shipping.postalCode, shipping.city].filter(Boolean).join(' '),
        shipping.country,
        shipping.phone
    ].filter(Boolean).map(String);
}

function renderItems(order) {
    const rows = (order?.items || []).map((item) => {
        const quantity = Number(item.quantity || 1);
        const amount = Number(item.unitAmountCents || 0) * quantity;
        return `
            <tr>
                <td style="padding:14px 0;border-bottom:1px solid ${EMAIL_COLORS.line};color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:14px;line-height:1.45;font-weight:400;">
                    <strong>${escapeHtml(item.titleSnapshot || 'Pièce restaurée')}</strong><br>
                    <span style="color:${EMAIL_COLORS.muted};font-size:12px;">Quantité ${quantity}</span>
                </td>
                <td style="padding:14px 0;border-bottom:1px solid ${EMAIL_COLORS.line};color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:14px;line-height:1.45;font-weight:600;text-align:right;white-space:nowrap;">
                    ${escapeHtml(formatMoney(amount, order.currency))}
                </td>
            </tr>
        `;
    }).join('');
    return `
        <h2 style="margin:0;color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:17px;line-height:1.3;font-weight:650;letter-spacing:-.25px;">La pièce concernée</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:9px;">${rows}</table>
    `;
}

function renderAddress(order) {
    const lines = addressLines(order);
    return `
        <div style="margin-top:20px;padding-top:18px;border-top:1px solid ${EMAIL_COLORS.line};">
            <div style="color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.4;font-weight:650;">${escapeHtml(deliveryLabel(order))}</div>
            <div style="margin-top:6px;color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.55;font-weight:400;">${lines.map(escapeHtml).join('<br>')}</div>
        </div>
    `;
}

function textItems(order) {
    return (order?.items || []).map((item) => {
        const quantity = Number(item.quantity || 1);
        return `${quantity} × ${item.titleSnapshot || 'Pièce restaurée'} — ${formatMoney(Number(item.unitAmountCents || 0) * quantity, order.currency)}`;
    });
}

function baseData({ order, payload, siteUrl }) {
    const orderId = order.id || payload.orderId;
    const amountCents = Number(payload.amountCents ?? order.amounts?.totalCents ?? 0);
    const currency = payload.currency || order.currency || 'EUR';
    const isGuestPaymentLink = order.checkout?.channel === 'admin_payment_link';
    return {
        orderId,
        reference: orderReference(order),
        amountLabel: formatMoney(amountCents, currency),
        ordersUrl: isGuestPaymentLink
            ? `${siteUrl.replace(/\/$/, '')}/`
            : `${siteUrl.replace(/\/$/, '')}/mes-commandes`,
        adminUrl: `${siteUrl.replace(/\/$/, '')}/admin?order_id=${encodeURIComponent(orderId)}`,
        amountCents,
        currency,
        isGuestPaymentLink
    };
}

function customerTemplate({
    order,
    payload,
    siteUrl,
    subject,
    eyebrow,
    title,
    intro,
    status,
    role,
    callout,
    actionLabel = 'Voir ma commande',
    includeAddress = false,
    detail = null
}) {
    const data = baseData({ order, payload, siteUrl });
    const contentHtml = `${renderItems(order)}${includeAddress ? renderAddress(order) : ''}`;
    const calloutData = callout(data);
    return {
        to: order.customerSnapshot?.email || order.userEmail,
        subject: subject(data),
        text: [
            `${customerGreeting(order)}${intro(data)}`,
            `Commande ${data.reference}`,
            `Statut : ${status}`,
            `Montant : ${data.amountLabel}`,
            ...textItems(order),
            includeAddress ? `Livraison : ${deliveryLabel(order)}` : null,
            ...(includeAddress ? addressLines(order) : []),
            detail,
            calloutData.detail || null,
            `Consulter : ${data.ordersUrl}`
        ].filter(Boolean).join('\n'),
        html: renderEmailShell({
            preheader: `${data.reference} · ${status} · ${data.amountLabel}`,
            eyebrow,
            title,
            intro: `${customerGreeting(order)}${intro(data)}`,
            summaryHtml: renderSummaryGrid([
                { label: 'Commande', value: data.reference },
                { label: 'Statut', value: status, color: statusColor(role) },
                { label: 'Montant', value: data.amountLabel }
            ]),
            contentHtml,
            calloutHtml: renderCallout({
                ...calloutData,
                role,
                detail: calloutData.detail || detail
            }),
            actionLabel: data.isGuestPaymentLink ? 'Voir la galerie' : actionLabel,
            actionUrl: data.ordersUrl,
            footer: 'Message transactionnel Seconde Vie. Les documents du sandbox ne constituent ni facture ni avoir fiscal.'
        })
    };
}

function renderAdminContact(order) {
    const email = order.customerSnapshot?.email || order.userEmail || 'Non renseigné';
    const address = addressLines(order);
    return `
        <h2 style="margin:0;color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:17px;line-height:1.3;font-weight:650;letter-spacing:-.25px;">Client et exécution</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:9px;">
            <tr><td style="padding:7px 0;color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:13px;">Client</td><td style="padding:7px 0;text-align:right;color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.4;font-weight:600;">${escapeHtml(customerName(order) || 'Non renseigné')}</td></tr>
            <tr><td style="padding:7px 0;color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:13px;">E-mail</td><td style="padding:7px 0;text-align:right;color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.4;font-weight:600;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:7px 0;color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:13px;">Livraison</td><td style="padding:7px 0;text-align:right;color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.4;font-weight:600;">${escapeHtml(deliveryLabel(order))}</td></tr>
        </table>
        <div style="margin-top:13px;padding-top:14px;border-top:1px solid ${EMAIL_COLORS.line};color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.55;font-weight:400;">${address.map(escapeHtml).join('<br>')}</div>
        <div style="margin-top:22px;">${renderItems(order)}</div>
    `;
}

function adminTemplate({
    order,
    payload,
    siteUrl,
    senderEmail,
    subject,
    eyebrow,
    title,
    intro,
    status,
    role,
    callout
}) {
    const data = baseData({ order, payload, siteUrl });
    const paymentIntentId = order.payment?.paymentIntentId || payload.paymentIntentId || null;
    const refundId = payload.refundId || null;
    const providerDetail = refundId
        ? `Refund Stripe : ${refundId}`
        : paymentIntentId
            ? `PaymentIntent : ${paymentIntentId}`
            : null;
    return {
        to: senderEmail,
        subject: subject(data),
        text: [
            intro(data),
            `Commande ${data.reference}`,
            `Statut : ${status}`,
            `Montant : ${data.amountLabel}`,
            `Client : ${customerName(order) || 'Non renseigné'}`,
            `Email : ${order.customerSnapshot?.email || order.userEmail || 'Non renseigné'}`,
            `Livraison : ${deliveryLabel(order)}`,
            ...addressLines(order),
            ...textItems(order),
            providerDetail,
            `Ouvrir : ${data.adminUrl}`
        ].filter(Boolean).join('\n'),
        html: renderEmailShell({
            preheader: `${data.reference} · ${status} · action back-office`,
            eyebrow,
            title,
            intro: intro(data),
            summaryHtml: renderSummaryGrid([
                { label: 'Commande', value: data.reference },
                { label: 'Statut', value: status, color: statusColor(role) },
                { label: 'Montant', value: data.amountLabel }
            ]),
            contentHtml: renderAdminContact(order),
            calloutHtml: renderCallout({
                ...callout(data),
                role,
                detail: providerDetail
            }),
            actionLabel: 'Ouvrir dans le back-office',
            actionUrl: data.adminUrl,
            footer: 'Notification opérationnelle réservée à l’administration Seconde Vie.',
            titleAlign: 'left'
        })
    };
}

const CUSTOMER_TEMPLATES = Object.freeze({
    'commerce-document-copy': {
        subject: ({ reference }) => `Votre document ${reference} · Seconde Vie`,
        eyebrow: 'Document de commande',
        title: 'Votre document est prêt.',
        intro: () => 'la copie demandée depuis votre espace client est prête.',
        status: 'Disponible',
        role: 'info',
        actionLabel: 'Retrouver mes documents',
        callout: () => ({
            title: 'Deux façons de le retrouver',
            body: 'Ouvrez la pièce jointe de cet e-mail ou revenez dans la section Documents de votre espace client.'
        }),
        detail: ({ documentLabel }) => documentLabel || null
    },
    'order-paid': {
        subject: ({ reference }) => `Commande ${reference} confirmée · Seconde Vie`,
        eyebrow: 'Paiement confirmé',
        title: 'Votre commande est confirmée.',
        intro: () => 'votre paiement est confirmé et votre commande est enregistrée.',
        status: 'Payée',
        role: 'success',
        includeAddress: true,
        callout: () => ({
            title: 'La suite',
            body: 'L’atelier prépare maintenant votre pièce. Vous recevrez un message lors de la prochaine étape.'
        })
    },
    'order-preparing': {
        subject: ({ reference }) => `${reference} est en préparation · Seconde Vie`,
        eyebrow: 'Préparation atelier',
        title: 'Votre commande est en préparation.',
        intro: () => 'la préparation de votre commande a commencé à l’atelier.',
        status: 'En préparation',
        role: 'info',
        callout: () => ({
            title: 'Préparation en cours',
            body: 'Nous vérifions la pièce, sa protection et les modalités de remise avant son départ.'
        })
    },
    'order-ready-for-pickup': {
        subject: ({ reference }) => `${reference} est prête à être retirée · Seconde Vie`,
        eyebrow: 'Retrait atelier',
        title: 'Votre commande est prête à être retirée.',
        intro: () => 'votre commande est prête pour son retrait à l’atelier.',
        status: 'Prête au retrait',
        role: 'success',
        includeAddress: true,
        callout: () => ({
            title: 'Avant de vous déplacer',
            body: 'Répondez à cet email pour convenir du créneau de retrait et éviter toute attente.'
        })
    },
    'order-picked-up': {
        subject: ({ reference }) => `${reference} a été retirée · Seconde Vie`,
        eyebrow: 'Commande remise',
        title: 'Votre commande a été retirée.',
        intro: () => 'le retrait de votre commande est confirmé.',
        status: 'Terminée',
        role: 'success',
        callout: () => ({
            title: 'Merci pour votre confiance',
            body: 'Conservez vos documents de commande dans votre espace client. L’atelier reste disponible si nécessaire.'
        })
    },
    'order-shipped': {
        subject: ({ reference }) => `${reference} est expédiée · Seconde Vie`,
        eyebrow: 'Expédition confirmée',
        title: 'Votre commande a été expédiée.',
        intro: () => 'votre commande a quitté l’atelier et son expédition est confirmée.',
        status: 'Expédiée',
        role: 'info',
        callout: () => ({
            title: 'Suivi de livraison',
            body: 'Le transporteur vous communiquera les détails de remise. Vérifiez l’état extérieur avant de confirmer la réception.'
        }),
        detail: ({ shipmentTracking }) => shipmentTracking.mode === 'tracked'
            ? [
                shipmentTracking.carrierLabel,
                `suivi ${shipmentTracking.trackingNumber}`,
                shipmentTracking.trackingUrl
            ].filter(Boolean).join(' · ')
            : 'Cette expédition ne possède pas de numéro de suivi. Le transporteur communiquera directement les modalités de remise.'
    },
    'order-tracking-updated': {
        subject: ({ reference }) => `Suivi mis à jour · ${reference} · Seconde Vie`,
        eyebrow: 'Suivi de livraison',
        title: 'Votre suivi a été mis à jour.',
        intro: () => 'le suivi transporteur de votre commande vient d’être mis à jour.',
        status: 'Expédiée',
        role: 'info',
        callout: () => ({
            title: 'Informations actualisées',
            body: 'Retrouvez également ces informations dans votre espace client.'
        }),
        detail: ({ shipmentTracking }) => shipmentTracking.mode === 'tracked'
            ? [
                shipmentTracking.carrierLabel,
                `suivi ${shipmentTracking.trackingNumber}`,
                shipmentTracking.trackingUrl
            ].filter(Boolean).join(' · ')
            : 'Le suivi a été retiré. Le transporteur communiquera directement les modalités de remise.'
    },
    'order-delivered': {
        subject: ({ reference }) => `${reference} est livrée · Seconde Vie`,
        eyebrow: 'Livraison terminée',
        title: 'Votre commande a été livrée.',
        intro: () => 'la livraison de votre commande est confirmée.',
        status: 'Terminée',
        role: 'success',
        callout: () => ({
            title: 'Une question après livraison ?',
            body: 'Répondez à cet email en indiquant votre référence de commande. L’atelier retrouvera immédiatement votre dossier.'
        })
    },
    'order-refunded': {
        subject: ({ reference }) => `Remboursement ${reference} confirmé · Seconde Vie`,
        eyebrow: 'Remboursement confirmé',
        title: 'Votre remboursement est confirmé.',
        intro: () => 'Stripe a confirmé le remboursement sur le moyen de paiement utilisé lors de l’achat.',
        status: 'Remboursée',
        role: 'success',
        callout: ({ refundId }) => ({
            title: 'Crédit bancaire en cours',
            body: 'Selon votre banque, le crédit peut prendre quelques jours ouvrables avant d’apparaître.',
            detail: refundId ? `Référence Stripe : ${refundId}` : null
        })
    },
    'order-refund-failed': {
        subject: ({ reference }) => `Remboursement ${reference} à vérifier · Seconde Vie`,
        eyebrow: 'Vérification nécessaire',
        title: 'Votre remboursement est en cours de vérification.',
        intro: () => 'Stripe n’a pas confirmé le remboursement. Aucun nouveau débit n’a été créé.',
        status: 'À vérifier',
        role: 'danger',
        callout: () => ({
            title: 'L’atelier reprend le dossier',
            body: 'Vous n’avez aucune action à effectuer. Nous vérifions la situation avant toute nouvelle tentative.'
        })
    }
});

function renderCommerceEmail({
    template,
    order,
    payload = {},
    senderEmail,
    siteUrl
}) {
    const normalizedOrder = { ...order, id: order.id || payload.orderId };
    if (template === 'customer-return-requested-admin') {
        const reasonLabels = {
            changed_mind: 'Le client a changé d’avis',
            damaged: 'La pièce est signalée endommagée',
            not_as_expected: 'La pièce ne correspond pas aux attentes',
            other: 'Autre motif'
        };
        return adminTemplate({
            order: normalizedOrder,
            payload,
            siteUrl,
            senderEmail,
            subject: ({ reference }) => `Nouvelle demande de retour · ${reference}`,
            eyebrow: 'Demande client',
            title: 'Nouvelle demande de retour.',
            intro: ({ reference }) => `${reference} fait l’objet d’une demande de retour ou de remboursement.`,
            status: 'À examiner',
            role: 'warning',
            callout: () => ({
                title: 'Choisir le bon parcours',
                body: normalizedOrder.fulfillmentSummary?.custody === 'merchant'
                    ? 'La pièce est encore indiquée à l’atelier : le remboursement direct peut être choisi dans le back-office.'
                    : 'La pièce a quitté l’atelier : autorisez le retour, puis remboursez seulement après réception et inspection.',
                detail: reasonLabels[payload.reason] || reasonLabels.other
            })
        });
    }
    if (template === 'order-paid-admin') {
        return adminTemplate({
            order: normalizedOrder,
            payload,
            siteUrl,
            senderEmail,
            subject: ({ reference }) => `Nouvelle commande ${reference} · ${formatMoney(payload.amountCents, payload.currency)}`,
            eyebrow: 'Nouvelle commande payée',
            title: 'Nouvelle commande payée.',
            intro: ({ reference }) => `Le paiement de ${reference} est confirmé. La commande peut entrer en préparation.`,
            status: 'Payée',
            role: 'success',
            callout: () => ({
                title: 'Action recommandée',
                body: 'Vérifiez les coordonnées et passez la commande en préparation depuis le back-office.'
            })
        });
    }
    if (template === 'order-refunded-admin') {
        return adminTemplate({
            order: normalizedOrder,
            payload,
            siteUrl,
            senderEmail,
            subject: ({ reference }) => `Remboursement confirmé · ${reference}`,
            eyebrow: 'Remboursement Stripe',
            title: 'Remboursement confirmé.',
            intro: ({ reference }) => `${reference} a été remboursée sans remise en stock automatique.`,
            status: 'Remboursée',
            role: 'success',
            callout: () => ({
                title: 'Stock inchangé',
                body: 'Le remboursement financier ne remet pas la pièce en vente. Une disposition physique reste nécessaire.'
            })
        });
    }
    if (template === 'order-refund-failed-admin') {
        return adminTemplate({
            order: normalizedOrder,
            payload,
            siteUrl,
            senderEmail,
            subject: ({ reference }) => `Action requise · remboursement ${reference}`,
            eyebrow: 'Incident remboursement',
            title: 'Remboursement à vérifier.',
            intro: ({ reference }) => `Le remboursement de ${reference} n’a pas été confirmé.`,
            status: 'À vérifier',
            role: 'danger',
            callout: () => ({
                title: 'Ne pas relancer à l’aveugle',
                body: 'Ouvrez le dossier et vérifiez la tentative Stripe avant toute reprise afin d’éviter un double remboursement.'
            })
        });
    }
    const copy = CUSTOMER_TEMPLATES[template];
    if (!copy) {
        const error = new Error('COMMERCE_OUTBOX_TEMPLATE_UNSUPPORTED');
        error.code = 'COMMERCE_OUTBOX_TEMPLATE_UNSUPPORTED';
        throw error;
    }
    const data = baseData({ order: normalizedOrder, payload, siteUrl });
    const shipmentTracking = resolveShippingTracking({
        carrierCode: payload.carrierCode || normalizedOrder.fulfillmentSummary?.carrierCode || null,
        carrierName: payload.carrierName || normalizedOrder.fulfillmentSummary?.carrierName || null,
        trackingNumber: payload.trackingNumber || normalizedOrder.fulfillmentSummary?.trackingNumber || null
    });
    return customerTemplate({
        order: normalizedOrder,
        payload: {
            ...payload,
            trackingNumber: payload.trackingNumber || normalizedOrder.fulfillmentSummary?.trackingNumber || null,
            refundId: payload.refundId || null
        },
        siteUrl,
        subject: copy.subject,
        eyebrow: copy.eyebrow,
        title: copy.title,
        intro: copy.intro,
        status: copy.status,
        role: copy.role,
        callout: (templateData) => copy.callout({
            ...templateData,
            refundId: payload.refundId || null
        }),
        actionLabel: copy.actionLabel,
        includeAddress: copy.includeAddress,
        detail: copy.detail ? copy.detail({
            ...data,
            shipmentTracking,
            documentLabel: payload.documentKind === 'sandbox_refund_confirmation'
                ? 'Confirmation de remboursement · document sandbox non fiscal'
                : payload.documentKind === 'sandbox_payment_receipt'
                    ? 'Reçu de paiement · document sandbox non fiscal'
                    : null
        }) : null
    });
}

module.exports = {
    CUSTOMER_TEMPLATES,
    deliveryLabel,
    formatMoney,
    orderReference,
    renderCommerceEmail
};
