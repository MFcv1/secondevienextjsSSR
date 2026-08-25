'use client';

import { getMillis } from '../../../../utils/time.js';
import { formatShippingAddress } from '../../../../utils/shippingAddress.js';
import { adaptCommerceOrder } from '../../../commerce/orderAdapter.js';
import orderReferenceHelpers from '../../../../../shared/orderReference.cjs';

const { getOrderReference } = orderReferenceHelpers;

/**
 * Couche de presentation des ventes : uniquement des fonctions pures.
 * Elle derive ce que l'ecran montre a partir des champs deja servis par
 * `listOrdersAdminV2`. Aucune lecture, aucune ecriture, aucun DOM.
 */

// ── Normalisation ────────────────────────────────────────────────────────────

export const normalizeAdminOrder = (order) => {
    const adapted = adaptCommerceOrder(order, order?.id || null);
    if (order?.schemaVersion !== 2) {
        return {
            ...order,
            ...adapted,
            shipping: order?.shipping || {},
        };
    }

    const customerEmail = order.customerSnapshot?.email || order.userEmail || '';
    const shipping = {
        ...(order.shippingSnapshot || {}),
        email: order.shippingSnapshot?.email || customerEmail,
    };
    return {
        ...order,
        ...adapted,
        shipping,
        userEmail: customerEmail,
        total: Number.isSafeInteger(adapted.totalCents) ? adapted.totalCents / 100 : null,
        paymentMethod: 'stripe_elements',
        stripePaymentIntentId: order.payment?.paymentIntentId || null,
        items: (order.items || []).map((item) => ({
            ...item,
            name: item.name || item.titleSnapshot || item.productId || 'Article',
            price: Number.isSafeInteger(item.unitAmountCents)
                ? item.unitAmountCents / 100
                : (Number.isFinite(Number(item.price)) ? Number(item.price) : null),
        })),
    };
};

export const normalizeAdminOrders = (orders = []) => orders.map(normalizeAdminOrder);

// ── Formats ──────────────────────────────────────────────────────────────────

const priceFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const shortDateYearFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' });
const clockFormatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const fullFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'medium' });
const dayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export const formatPrice = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? priceFormatter.format(amount) : 'Prix indisponible';
};

export const formatDateTime = (timestamp) => {
    const millis = getMillis(timestamp);
    return millis ? fullFormatter.format(new Date(millis)) : 'Date indisponible';
};

export const formatShortDate = (timestamp) => {
    const millis = getMillis(timestamp);
    if (!millis) return '—';
    const date = new Date(millis);
    return date.getFullYear() === new Date().getFullYear()
        ? shortDateFormatter.format(date)
        : shortDateYearFormatter.format(date);
};

export const formatClock = (timestamp) => {
    const millis = getMillis(timestamp);
    return millis ? clockFormatter.format(new Date(millis)) : '';
};

/** Repere humain : « Aujourd'hui », « Hier », puis la date longue. */
export const formatDayLabel = (timestamp) => {
    const millis = getMillis(timestamp);
    if (!millis) return 'Date indisponible';
    const startOfDay = (value) => {
        const date = new Date(value);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    };
    const days = Math.round((startOfDay(Date.now()) - startOfDay(millis)) / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    return dayFormatter.format(new Date(millis));
};

export const orderReference = (orderOrId) => {
    return getOrderReference(typeof orderOrId === 'object' ? orderOrId : null);
};

// ── Etat logistique et commercial ────────────────────────────────────────────

const FULFILLMENT_STAGE = {
    unfulfilled: 1,
    preparing: 2,
    ready_for_pickup: 3,
    shipped: 3,
    picked_up: 4,
    delivered: 4,
};

const FULFILLMENT_LABEL = {
    unfulfilled: 'À préparer',
    preparing: 'En préparation',
    ready_for_pickup: 'Prête au retrait',
    shipped: 'Expédiée',
    picked_up: 'Retirée',
    delivered: 'Livrée',
    canceled: 'Annulée',
};

const EXCEPTIONS = {
    needs_review: { label: 'À vérifier', tone: 'danger' },
    payment_failed: { label: 'Paiement échoué', tone: 'danger' },
    refund_failed: { label: 'Remboursement à vérifier', tone: 'danger' },
    refund_pending: { label: 'Remboursement en cours', tone: 'progress' },
    refunded: { label: 'Remboursée', tone: 'info' },
    cancelled: { label: 'Annulée', tone: 'danger' },
    canceled: { label: 'Annulée', tone: 'danger' },
    cancelled_by_client: { label: 'Annulée par le client', tone: 'danger' },
    pending_payment: { label: 'En attente de paiement', tone: 'progress' },
};

export const isOrderPaid = (order) => (
    order?.payment?.status === 'succeeded'
    || ['paid', 'shipped', 'completed'].includes(String(order?.status || ''))
);

export const resolveFulfillmentStatus = (order) => {
    const raw = order?.fulfillmentSummary?.status;
    if (raw) return raw;
    if (order?.status === 'completed') return 'delivered';
    if (order?.status === 'shipped') return 'shipped';
    return 'unfulfilled';
};

/**
 * Un seul indicateur au lieu de deux badges concurrents : soit une avancee
 * en quatre temps, soit une pastille d'exception qui garde l'etape logistique
 * en information secondaire.
 */
export const isRefundUnsettled = (order) => (
    ['pending', 'needs_review'].includes(String(order?.refundAggregate?.status || ''))
);

/**
 * Un remboursement a echoue et n'est pas encore solde.
 * `hasFailure` est collant cote domaine : il reste vrai apres une reprise
 * reussie. On n'alerte donc que tant que l'agregat n'est pas retombe sur
 * `full` ou `partial`, sinon la commande resterait a vie « a verifier ».
 */
export const hasOpenRefundFailure = (order) => (
    order?.refundAggregate?.hasFailure === true && isRefundUnsettled(order)
);

export const getOrderJourney = (order) => {
    const status = String(order?.status || '');
    const fulfillment = resolveFulfillmentStatus(order);
    const paid = isOrderPaid(order);
    const stage = paid ? (FULFILLMENT_STAGE[fulfillment] || 1) : 0;
    const fulfillmentLabel = FULFILLMENT_LABEL[fulfillment] || null;
    const refundStatus = String(order?.refundAggregate?.status || '');
    const exception = hasOpenRefundFailure(order) ? EXCEPTIONS.refund_failed : EXCEPTIONS[status];

    if (exception) {
        return {
            kind: 'exception',
            stage,
            label: exception.label,
            tone: exception.tone,
            detail: paid && fulfillment !== 'unfulfilled' ? fulfillmentLabel : null,
        };
    }

    const label = stage <= 1 ? 'Payée' : fulfillmentLabel || 'Payée';
    return {
        kind: 'progress',
        stage: Math.max(stage, 1),
        label,
        tone: stage >= 4 ? 'positive' : stage === 3 ? (fulfillment === 'shipped' ? 'transit' : 'info') : stage === 2 ? 'progress' : 'positive',
        // Un remboursement partiel laisse le statut a « payée » : sans ce
        // rappel, rien a l'ecran ne dirait qu'une partie a ete rendue.
        detail: refundStatus === 'partial' ? 'Remboursement partiel' : null,
    };
};

export const JOURNEY_STEPS = ['Payée', 'Préparation', 'Acheminement', 'Finalisée'];

// ── Segments ─────────────────────────────────────────────────────────────────

export const ORDER_SEGMENTS = [
    { id: 'todo', label: 'À traiter' },
    { id: 'waiting', label: 'En attente' },
    { id: 'done', label: 'Clôturées' },
    { id: 'all', label: 'Toutes' },
];

/**
 * Remboursement solde alors que le meuble n'a pas quitte la boutique.
 * La garde physique est l'autorite; le libelle logistique seul ne suffit pas
 * a prouver ou se trouve la piece.
 */
export const isRefundedWithGoodsOnSite = (order) => (
    String(order?.refundAggregate?.status || '') === 'full'
    && order?.fulfillmentSummary?.custody === 'merchant'
);

export const getOrderSegment = (order) => {
    const status = String(order?.status || '');
    if (['needs_review', 'refund_pending', 'refund_failed', 'payment_failed'].includes(status)) return 'todo';
    if (hasOpenRefundFailure(order)) return 'todo';

    const fulfillment = resolveFulfillmentStatus(order);
    // Argent rendu mais meuble encore en boutique : le dossier n'est pas clos,
    // il reste a le recuperer ou a le remettre en vente.
    if (status === 'refunded') {
        return isRefundedWithGoodsOnSite(order) ? 'todo' : 'done';
    }
    if (['cancelled', 'canceled', 'cancelled_by_client'].includes(status)) return 'done';
    if (['picked_up', 'delivered', 'canceled'].includes(fulfillment)) return 'done';
    if (isOrderPaid(order) && ['unfulfilled', 'preparing'].includes(fulfillment)) return 'todo';
    return 'waiting';
};

// ── Panier, livraison, recherche ─────────────────────────────────────────────

export const summarizeItems = (order) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    if (items.length === 0) return { label: 'Panier indisponible', extra: 0, units: 0 };
    const units = items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);
    return {
        label: items[0]?.name || 'Article',
        extra: items.length - 1,
        units,
    };
};

const DELIVERY_MODES = {
    'delivery-pickup': 'Retrait à l’atelier',
    'delivery-local': 'Livraison Marseille & alentours',
    'delivery-carrier': 'Transporteur spécialisé',
};

export const getDeliveryModeId = (order) => order?.deliverySnapshot?.id || null;

export const getDeliveryModeLabel = (order) => {
    const known = DELIVERY_MODES[getDeliveryModeId(order)];
    if (known) return known;
    return Number(order?.amounts?.shippingCents || 0) === 0 ? 'Livraison offerte' : 'Livraison';
};

export const isPickupOrder = (order) => getDeliveryModeId(order) === 'delivery-pickup';

export const getPaymentLabel = (order) => (
    order?.paymentMethod === 'deferred' ? 'Différé (virement ou chèque)' : 'Carte bancaire (Stripe)'
);

const normalizeText = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const buildSearchIndex = (order) => normalizeText([
    order?.shipping?.fullName,
    order?.userEmail,
    order?.shipping?.email,
    order?.shipping?.phone,
    order?.id,
    orderReference(order),
    order?.shipping?.city,
    formatShippingAddress(order?.shipping),
    order?.shipmentTracking?.trackingNumber,
    order?.shipmentTracking?.carrierLabel,
    ...(Array.isArray(order?.items) ? order.items.map((item) => item.name) : []),
].filter(Boolean).join(' '));

export const matchesSearch = (order, normalizedQuery) => (
    !normalizedQuery || buildSearchIndex(order).includes(normalizedQuery)
);

export const normalizeSearchQuery = (value) => normalizeText(value).trim();

export const filterOrders = (orders = [], { segment = 'all', search = '' } = {}) => {
    const normalizedQuery = normalizeSearchQuery(search);
    const filtered = orders.filter((order) => (
        (segment === 'all' || getOrderSegment(order) === segment)
        && matchesSearch(order, normalizedQuery)
    ));
    if (segment !== 'all') return filtered;

    const priority = { todo: 0, waiting: 1, done: 2 };
    return filtered
        .map((order, index) => ({ index, order }))
        .sort((left, right) => (
            priority[getOrderSegment(left.order)] - priority[getOrderSegment(right.order)]
            || left.index - right.index
        ))
        .map(({ order }) => order);
};

/** Compteurs et encours calcules sur les commandes reellement chargees. */
export const buildOrdersSummary = (orders = []) => {
    const summary = {
        total: orders.length,
        todo: 0,
        waiting: 0,
        done: 0,
        grossCapturedAmount: 0,
    };
    for (const order of orders) {
        const segment = getOrderSegment(order);
        summary[segment] += 1;
        const capturedCents = Number(order?.amounts?.capturedCents);
        if (Number.isSafeInteger(capturedCents)) {
            summary.grossCapturedAmount += capturedCents / 100;
            continue;
        }
        const amount = Number(order?.total);
        if (isOrderPaid(order) && Number.isFinite(amount)) summary.grossCapturedAmount += amount;
    }
    return summary;
};

// ── Historique ───────────────────────────────────────────────────────────────

const TIMELINE_META = {
    order_created: { label: 'Commande créée', icon: 'package', tone: 'neutral' },
    payment_succeeded: { label: 'Paiement confirmé', icon: 'check', tone: 'positive' },
    order_cancelled: { label: 'Commande annulée', icon: 'cross', tone: 'danger' },
    refund_requested: { label: 'Remboursement demandé', icon: 'refund', tone: 'progress' },
    refund_succeeded: { label: 'Remboursement confirmé', icon: 'refund', tone: 'info' },
    refund_failed: { label: 'Remboursement à vérifier', icon: 'cross', tone: 'danger' },
    fulfillment_prepare: { label: 'Mise en préparation', icon: 'package', tone: 'progress' },
    fulfillment_ready: { label: 'Prête au retrait', icon: 'check', tone: 'info' },
    fulfillment_pickup: { label: 'Retrait confirmé', icon: 'check', tone: 'positive' },
    fulfillment_ship: { label: 'Expédition confirmée', icon: 'truck', tone: 'transit' },
    fulfillment_update_tracking: { label: 'Suivi transporteur mis à jour', icon: 'truck', tone: 'info' },
    fulfillment_deliver: { label: 'Livraison confirmée', icon: 'check', tone: 'positive' },
};

export const getTimelineMeta = (event) => (
    TIMELINE_META[event?.type] || { label: 'Événement', icon: 'clock', tone: 'neutral' }
);

/** Repli pour les commandes anterieures a l'historique evenementiel. */
export const buildFallbackTimeline = (order) => {
    const events = [
        { type: 'order_created', at: order?.createdAt },
        { type: 'payment_succeeded', at: order?.payment?.succeededAt || order?.paidAt },
    ];
    const status = String(order?.status || '');
    if (
        ['cancelled', 'canceled', 'cancelled_by_client'].includes(status)
        || order?.payment?.status === 'canceled'
    ) {
        events.push({
            type: 'order_cancelled',
            at: order?.cancelledAt || order?.canceledAt || order?.updatedAt,
        });
    }
    if (
        ['refund_pending', 'refunded', 'refund_failed'].includes(status)
        || Number(order?.refundAggregate?.requestedCents || 0) > 0
    ) {
        events.push({
            type: status === 'refund_pending'
                ? 'refund_requested'
                : (status === 'refund_failed' ? 'refund_failed' : 'refund_succeeded'),
            at: order?.refundUpdatedAt || order?.updatedAt,
        });
    }
    return events
        .filter((event) => getMillis(event.at))
        .sort((left, right) => getMillis(left.at) - getMillis(right.at));
};

// ── Actions ──────────────────────────────────────────────────────────────────

export const getAllowedActions = (order) => new Set(
    Array.isArray(order?.allowedActions) ? order.allowedActions : []
);

export const isFulfillmentBlockedByRefund = (order) => (
    ['pending', 'needs_review', 'full'].includes(String(order?.refundAggregate?.status || ''))
);

/**
 * Une seule action primaire, contextualisee par le mode de livraison :
 * en retrait atelier, la suite naturelle est « prête au retrait »,
 * sinon c'est l'expedition.
 */
export const buildActionPlan = (order, { enabled = true } = {}) => {
    if (!enabled || order?.schemaVersion !== 2) return { primary: null, secondary: [] };
    const allowed = getAllowedActions(order);
    const catalogue = {
        fulfillment_prepare: { id: 'fulfillment_prepare', label: 'Mettre en préparation', icon: 'package' },
        fulfillment_ready: { id: 'fulfillment_ready', label: 'Prête au retrait', icon: 'check' },
        fulfillment_ship: { id: 'fulfillment_ship', label: 'Confirmer l’expédition', icon: 'truck' },
        fulfillment_update_tracking: { id: 'fulfillment_update_tracking', label: 'Modifier le suivi', icon: 'truck' },
        fulfillment_pickup: {
            id: 'fulfillment_pickup',
            label: 'Confirmer le retrait',
            icon: 'check',
            confirm: {
                title: 'Confirmer le retrait ?',
                body: 'La commande passera en « retirée » et le client en sera informé.',
                action: 'Confirmer le retrait',
            },
        },
        fulfillment_deliver: {
            id: 'fulfillment_deliver',
            label: 'Confirmer la livraison',
            icon: 'check',
            confirm: {
                title: 'Confirmer la livraison ?',
                body: 'La commande passera en « livrée » et le client en sera informé.',
                action: 'Confirmer la livraison',
            },
        },
        archive_order: {
            id: 'archive_order',
            label: 'Archiver',
            icon: 'archive',
            confirm: {
                title: 'Archiver cette commande ?',
                body: 'Le dossier sort des commandes actives. Son historique reste consultable.',
                action: 'Archiver',
            },
        },
    };

    const fulfillment = resolveFulfillmentStatus(order);
    const fulfillmentBlocked = isFulfillmentBlockedByRefund(order);
    const preferShipping = !isPickupOrder(order);
    const priorityOrder = [
        fulfillment === 'unfulfilled' ? 'fulfillment_prepare' : null,
        fulfillment === 'preparing' ? (preferShipping ? 'fulfillment_ship' : 'fulfillment_ready') : null,
        'fulfillment_pickup',
        'fulfillment_deliver',
        'fulfillment_ship',
        'fulfillment_ready',
        'fulfillment_update_tracking',
        'fulfillment_prepare',
        'archive_order',
    ].filter(Boolean);

    const available = priorityOrder.filter((id, index, list) => (
        allowed.has(id) && list.indexOf(id) === index
        && !(fulfillmentBlocked && id.startsWith('fulfillment_'))
    ));
    const [primaryId, ...secondaryIds] = available;
    return {
        primary: primaryId ? catalogue[primaryId] : null,
        secondary: secondaryIds.map((id) => catalogue[id]),
    };
};

// ── Export comptable ─────────────────────────────────────────────────────────

/** Colonnes figees : ce fichier est repris en comptabilite. */
export const buildCsvRows = (orders = []) => orders.map((order) => ({
    'Référence commande': orderReference(order),
    'Date et heure': formatDateTime(order.createdAt),
    'Paiement confirmé le': formatDateTime(order.payment?.succeededAt || order.paidAt),
    'Client': order.shipping?.fullName || 'N/A',
    'Email': order.shipping?.email || 'N/A',
    'Téléphone': order.shipping?.phone || 'N/A',
    'Adresse': formatShippingAddress(order.shipping),
    'Méthode Paiement': order.paymentMethod === 'deferred' ? 'Différé' : 'Carte (Stripe)',
    'Stripe PaymentIntent': order.stripePaymentIntentId || '',
    'Verification Checkout': order.checkoutAuthMethod || '',
    'Email Client Envoye': order.emailProof?.client?.sent ? 'oui' : 'non',
    'Email Admin Envoye': order.emailProof?.admin?.sent ? 'oui' : 'non',
    'Statut': order.status,
    'Total (€)': order.total,
    'Articles': order.items?.map((item) => `${item.quantity || 1}x ${item.name}`).join(', ') || '',
}));
