import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Loader2,
    Package,
    RotateCcw,
    Search,
} from 'lucide-react';
import { db } from '../config/firebase';
import { getMillis } from '../../utils/time';
import {
    cancelReturnAdmin,
    COMMERCE_V2_ADMIN_RETURN_COMMANDS_ENABLED,
    decideCustomerReturnRequestAdmin,
    markReturnReceivedAdmin,
    openReturnAdmin,
    requestRefundAdmin,
    resolveReturnAdmin,
    restockReturnLinesAdmin,
    writeOffReturnLinesAdmin,
} from '../commerce/commerceCommandClient';
import {
    COMMERCE_V2_ADMIN_READERS_ENABLED,
    listCustomerReturnRequestsAdminV2,
    listOrdersAdminV2,
    listReturnsAdminV2,
} from '../commerce/commerceV2Client';
import { getAdminCachedData } from './adminDataCache';
import {
    ADMIN_RETURNS_FIRST_PAGE_KEY,
    loadAdminReturnsFirstPage,
} from './adminCommerceData';
import { adaptCommerceOrder } from '../commerce/orderAdapter';
import orderReferenceHelpers from '../../../shared/orderReference.cjs';

const { getOrderReference } = orderReferenceHelpers;

const REFUNDABLE_STATUSES = new Set(['paid', 'shipped', 'completed']);
const REFUND_TRACKED_STATUSES = new Set(['refund_pending', 'refunded', 'refund_failed']);

const STATUS_COPY = {
    paid: { label: 'Payée', tone: 'emerald', icon: CheckCircle },
    shipped: { label: 'Expédiée', tone: 'indigo', icon: Package },
    completed: { label: 'Livrée', tone: 'emerald', icon: CheckCircle },
    refund_pending: { label: 'En attente Stripe', tone: 'amber', icon: Clock },
    refunded: { label: 'Remboursée', tone: 'sky', icon: CheckCircle },
    refund_failed: { label: 'À vérifier', tone: 'red', icon: AlertTriangle },
    needs_review: { label: 'À vérifier', tone: 'red', icon: AlertTriangle },
};

const toneClasses = {
    emerald: {
        light: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        dark: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    },
    indigo: {
        light: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        dark: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    },
    amber: {
        light: 'bg-amber-50 text-amber-700 border-amber-100',
        dark: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    },
    sky: {
        light: 'bg-sky-50 text-sky-700 border-sky-100',
        dark: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    },
    red: {
        light: 'bg-red-50 text-red-700 border-red-100',
        dark: 'bg-red-500/10 text-red-300 border-red-500/20',
    },
    stone: {
        light: 'bg-stone-100 text-stone-600 border-stone-200',
        dark: 'bg-white/5 text-stone-300 border-white/10',
    },
};

function formatDate(timestamp) {
    const millis = getMillis(timestamp);
    return millis ? new Date(millis).toLocaleString('fr-FR') : '-';
}

function formatShortDate(timestamp) {
    const millis = getMillis(timestamp);
    return millis
        ? new Date(millis).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
        : '-';
}

function formatAmount(order) {
    const refundAmount = Number(order.refundAmount);
    if (Number.isFinite(refundAmount) && refundAmount > 0) {
        return `${(refundAmount / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${String(order.refundCurrency || 'eur').toUpperCase()}`;
    }
    const total = Number(order.total);
    return Number.isFinite(total) ? `${total.toLocaleString('fr-FR')} EUR` : '-';
}

function getOrderEmail(order) {
    return order.userEmail
        || order.customerSnapshot?.email
        || order.shippingSnapshot?.email
        || order.shipping?.email
        || '';
}

function getItemsLabel(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) return 'Produit non renseigne';
    return items
        .map((item) => `${item.quantity || 1}x ${item.titleSnapshot || item.name || 'Article'}`)
        .join(', ');
}

function getRequestItemsLabel(request) {
    const requested = new Map(
        (request.lines || []).map((line) => [line.lineId, line.quantity])
    );
    const items = request.order?.items || [];
    const labels = items
        .filter((item) => requested.has(item.lineId))
        .map((item) => `${requested.get(item.lineId)}× ${item.titleSnapshot || item.name || 'Article'}`);
    return labels.length > 0 ? labels.join(', ') : 'Article non renseigné';
}

function isStripeRefundCandidate(order) {
    const paymentIntentId = order?.payment?.paymentIntentId
        || order?.stripePaymentIntentId;
    const stripePayment = order?.schemaVersion === 2
        ? order?.payment?.provider === 'stripe'
        : order?.paymentMethod !== 'deferred';
    const captured = order?.schemaVersion === 2
        ? order?.payment?.status === 'succeeded'
        : false;
    return Boolean(paymentIntentId)
        && stripePayment
        && (
            captured ||
            REFUNDABLE_STATUSES.has(order?.status)
            || REFUND_TRACKED_STATUSES.has(order?.status)
            || Number(order?.refundAggregate?.requestedCents || 0) > 0
            || Boolean(order?.stripeRefundId)
        );
}

function normalizeAdminOrder(order) {
    const adapted = adaptCommerceOrder(order, order.id);
    const shipping = order.shipping || order.shippingSnapshot || {};
    const latestRefundAttempt = order.latestRefundAttempt || null;
    return {
        ...order,
        ...adapted,
        shipping,
        latestRefundAttempt,
        userEmail: getOrderEmail(order),
        stripePaymentIntentId: order.stripePaymentIntentId
            || order.payment?.paymentIntentId
            || null,
        stripeRefundId: order.stripeRefundId
            || latestRefundAttempt?.refundId
            || null,
        refundUpdatedAt: order.refundUpdatedAt
            || latestRefundAttempt?.updatedAt
            || null,
    };
}

function returnStatusLabel(status) {
    switch (status) {
        case 'pending': return 'Retour ouvert';
        case 'received': return 'Reçu à l’atelier';
        case 'resolved': return 'Retour clôturé';
        case 'canceled': return 'Retour annulé';
        default: return status || 'État inconnu';
    }
}

function returnLineSummary(returnCase, order) {
    return (returnCase.lines || []).map((line) => {
        const disposed = Number(line.restockedQty || 0) + Number(line.writtenOffQty || 0);
        const orderLine = (order?.items || []).find((item) => item.lineId === line.lineId);
        const label = orderLine?.titleSnapshot || orderLine?.name || line.lineId;
        return `${label} · ${line.receivedQty}/${line.requestedQty} reçu · ${disposed} traité`;
    });
}

function customerRequestStatus(request) {
    switch (request.status) {
        case 'pending_review': return { label: 'À examiner', tone: 'amber' };
        case 'return_authorized': return { label: 'Retour autorisé', tone: 'sky' };
        case 'refund_initiated': return { label: 'Remboursement lancé', tone: 'amber' };
        case 'completed': return { label: 'Terminée', tone: 'emerald' };
        case 'refund_failed': return { label: 'À vérifier', tone: 'red' };
        case 'rejected': return { label: 'Refusée', tone: 'stone' };
        default: return { label: request.status || 'Inconnue', tone: 'stone' };
    }
}

function customerRequestReason(reason) {
    return {
        changed_mind: 'Changement d’avis',
        damaged: 'Meuble endommagé',
        not_as_expected: 'Ne correspond pas aux attentes',
        other: 'Autre motif'
    }[reason] || 'Motif non renseigné';
}

function customerRequestStep(request) {
    if (request.status === 'rejected') return 'Demande refusée';
    if (request.status === 'completed') return 'Remboursement terminé';
    if (request.status === 'refund_failed') return 'Remboursement à vérifier';
    if (request.status === 'refund_initiated') return 'Traitement Stripe en cours';
    if (request.canRefundAfterReturn) return 'Prêt à rembourser';
    if (request.status === 'return_authorized') {
        return request.returnCase?.status === 'received'
            ? 'Inspection en cours'
            : 'En attente du meuble';
    }
    return request.order?.fulfillmentSummary?.custody === 'merchant'
        ? 'Décision requise · à l’atelier'
        : 'Décision requise · meuble expédié';
}

function isRefundPending(order) {
    return order.status === 'refund_pending'
        || order.refundAggregate?.status === 'pending';
}

function isRefundIssue(order) {
    return order.status === 'refund_failed'
        || order.refundAggregate?.status === 'needs_review'
        || order.latestRefundAttempt?.status === 'failed'
        || order.refundAttemptReadError;
}

function hasActiveReturn(order) {
    return (order.returnCases || []).some(
        (returnCase) => ['pending', 'received'].includes(returnCase.status)
    );
}

function returnActionLabel(action) {
    return {
        receive_return: 'Réceptionner',
        restock_return: 'Remettre en stock',
        write_off_return: 'Sortir du stock',
        resolve_return: 'Clôturer le retour',
        cancel_return: 'Annuler le retour'
    }[action] || action;
}

function getStatusMeta(order) {
    if (order.refundAttemptReadError) {
        return {
            label: 'À vérifier',
            tone: 'red',
            icon: AlertTriangle
        };
    }
    if (order.refundAggregate?.status === 'partial') {
        return {
            label: 'Partiellement remboursée',
            tone: 'sky',
            icon: CheckCircle
        };
    }
    return STATUS_COPY[order.status] || { label: order.status || 'À traiter', tone: 'stone', icon: Clock };
}

function StatusBadge({ order, darkMode }) {
    const meta = getStatusMeta(order);
    const Icon = meta.icon;
    const classes = toneClasses[meta.tone] || toneClasses.stone;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black ${darkMode ? classes.dark : classes.light}`}>
            <Icon size={13} />
            {meta.label}
        </span>
    );
}

const AdminReturns = ({ darkMode = false, mutationsEnabled = false }) => {
    const cachedPage = getAdminCachedData(ADMIN_RETURNS_FIRST_PAGE_KEY);
    const returnCommandsEnabled = mutationsEnabled && COMMERCE_V2_ADMIN_RETURN_COMMANDS_ENABLED;
    const [orders, setOrders] = useState(
        (cachedPage?.orders || []).map(normalizeAdminOrder)
    );
    const [returnCases, setReturnCases] = useState(cachedPage?.returns || []);
    const [customerRequests, setCustomerRequests] = useState(cachedPage?.requests || []);
    const [ordersCursor, setOrdersCursor] = useState(null);
    const [returnsCursor, setReturnsCursor] = useState(null);
    const [requestsCursor, setRequestsCursor] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(!cachedPage);
    const [search, setSearch] = useState('');
    const [view, setView] = useState('attention');
    const [operation, setOperation] = useState(null);
    const [notice, setNotice] = useState(null);
    const [refundDraft, setRefundDraft] = useState(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [decisionDraft, setDecisionDraft] = useState(null);
    const [returnDraft, setReturnDraft] = useState(null);

    const applyFirstPage = useCallback(({
        ordersOutcome,
        returnsOutcome,
        requestsOutcome,
        orders: loadedOrders,
        returns: loadedReturns,
        requests: loadedRequests
    }, { reportErrors = true } = {}) => {
        if (ordersOutcome.status === 'fulfilled') {
            const ordersResult = ordersOutcome.value;
            setOrders(loadedOrders.map(normalizeAdminOrder));
            setOrdersCursor(ordersResult.nextCursor || null);
        }
        if (returnsOutcome.status === 'fulfilled') {
            const returnsResult = returnsOutcome.value;
            setReturnCases(loadedReturns);
            setReturnsCursor(returnsResult.nextCursor || null);
        }
        if (requestsOutcome.status === 'fulfilled') {
            setCustomerRequests(loadedRequests);
            setRequestsCursor(requestsOutcome.value.nextCursor || null);
        }
        if (!reportErrors) return;
        if (ordersOutcome.status === 'rejected') {
            console.error('Admin v2 orders read failed:', ordersOutcome.reason);
            setNotice({
                type: 'error',
                text: 'Les commandes ne peuvent pas etre chargees pour le moment.'
            });
        } else if (returnsOutcome.status === 'rejected') {
            console.error('Admin v2 physical returns read failed:', returnsOutcome.reason);
            setNotice({
                type: 'error',
                text: 'Les remboursements sont affiches, mais le detail des retours physiques est momentanement indisponible.'
            });
        } else if (requestsOutcome.status === 'rejected') {
            console.error('Admin customer return requests read failed:', requestsOutcome.reason);
            setNotice({
                type: 'error',
                text: 'Les remboursements sont affiches, mais les nouvelles demandes client sont momentanement indisponibles.'
            });
        } else {
            setNotice(null);
        }
    }, []);

    const refreshFirstPage = useCallback(async () => {
        const page = await loadAdminReturnsFirstPage({ force: true });
        applyFirstPage(page, { reportErrors: false });
        if (page.ordersOutcome.status === 'rejected') {
            throw page.ordersOutcome.reason;
        }
        return page;
    }, [applyFirstPage]);

    useEffect(() => {
        setLoading(!getAdminCachedData(ADMIN_RETURNS_FIRST_PAGE_KEY));
        if (COMMERCE_V2_ADMIN_READERS_ENABLED) {
            let cancelled = false;
            loadAdminReturnsFirstPage().then((page) => {
                if (cancelled) return;
                applyFirstPage(page);
                setLoading(false);
            });
            return () => {
                cancelled = true;
            };
        }
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(200));
        const unsub = onSnapshot(q, (snap) => {
            setOrders(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error('Refund orders snapshot error:', error);
            setNotice({ type: 'error', text: `Lecture commandes impossible: ${error.message || error}` });
            setLoading(false);
        });
        return () => unsub();
    }, [applyFirstPage]);

    const refundOrders = useMemo(() => {
        const returnsByOrder = new Map();
        for (const returnCase of returnCases) {
            const current = returnsByOrder.get(returnCase.orderId) || [];
            current.push(returnCase);
            returnsByOrder.set(returnCase.orderId, current);
        }
        return orders
            .map((order) => ({
                ...order,
                returnCases: returnsByOrder.get(order.id) || []
            }))
            .filter(isStripeRefundCandidate);
    }, [orders, returnCases]);

    const visibleCustomerRequests = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return customerRequests
            .filter((request) => {
                if (view === 'attention') {
                    return request.status === 'pending_review'
                        || request.status === 'refund_failed'
                        || request.canRefundAfterReturn;
                }
                if (view === 'returns') return request.status === 'return_authorized';
                if (view === 'stripe') {
                    return ['refund_initiated', 'refund_failed'].includes(request.status);
                }
                if (view === 'history') {
                    return ['completed', 'rejected'].includes(request.status);
                }
                if (view === 'eligible') return false;
                return true;
            })
            .filter((request) => {
                if (!needle) return true;
                const order = request.order || {};
                return [
                    request.requestId,
                    request.orderId,
                    getOrderReference(order),
                    order.customerSnapshot?.email,
                    order.shippingSnapshot?.fullName,
                    getRequestItemsLabel(request),
                    customerRequestReason(request.reason),
                    request.note
                ].some((value) => String(value || '').toLowerCase().includes(needle));
            });
    }, [customerRequests, search, view]);

    const visibleRefundOrders = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return refundOrders
            .filter((order) => {
                if (view === 'attention') {
                    return isRefundIssue(order)
                        || (order.returnCases || []).some(
                            (returnCase) => (returnCase.allowedActions || []).length > 0
                        );
                }
                if (view === 'returns') return hasActiveReturn(order);
                if (view === 'stripe') return isRefundPending(order) || isRefundIssue(order);
                if (view === 'history') {
                    return order.status === 'refunded'
                        || (order.returnCases || []).some(
                            (returnCase) => ['resolved', 'canceled'].includes(returnCase.status)
                        );
                }
                if (view === 'eligible') {
                    return (order.allowedActions || []).includes('request_refund')
                        && !hasActiveReturn(order)
                        && !isRefundPending(order)
                        && !isRefundIssue(order);
                }
                return true;
            })
            .filter((order) => {
                if (!needle) return true;
                return [
                    order.id,
                    order.shipping?.fullName,
                    getOrderEmail(order),
                    order.stripePaymentIntentId,
                    order.stripeRefundId,
                    getItemsLabel(order),
                ].some((value) => String(value || '').toLowerCase().includes(needle));
            });
    }, [refundOrders, search, view]);

    const loadMoreV2 = async () => {
        if (
            !COMMERCE_V2_ADMIN_READERS_ENABLED ||
            loadingMore ||
            (!ordersCursor && !returnsCursor && !requestsCursor)
        ) return;
        setLoadingMore(true);
        setNotice(null);
        try {
            const [ordersResult, returnsResult, requestsResult] = await Promise.all([
                ordersCursor
                    ? listOrdersAdminV2({ pageSize: 50, cursor: ordersCursor })
                    : Promise.resolve({ orders: [], nextCursor: null }),
                returnsCursor
                    ? listReturnsAdminV2({ pageSize: 50, cursor: returnsCursor })
                    : Promise.resolve({ returns: [], nextCursor: null }),
                requestsCursor
                    ? listCustomerReturnRequestsAdminV2({ pageSize: 50, cursor: requestsCursor })
                    : Promise.resolve({ requests: [], nextCursor: null })
            ]);
            setOrders((current) => {
                const merged = new Map(current.map((order) => [order.id, order]));
                for (const order of ordersResult.orders || []) {
                    merged.set(order.id, normalizeAdminOrder(order));
                }
                return Array.from(merged.values());
            });
            setReturnCases((current) => {
                const merged = new Map(
                    current.map((returnCase) => [returnCase.returnId, returnCase])
                );
                for (const returnCase of returnsResult.returns || []) {
                    merged.set(returnCase.returnId, returnCase);
                }
                return Array.from(merged.values());
            });
            setOrdersCursor(ordersResult.nextCursor || null);
            setReturnsCursor(returnsResult.nextCursor || null);
            setCustomerRequests((current) => {
                const merged = new Map(current.map((request) => [request.requestId, request]));
                for (const request of requestsResult.requests || []) {
                    merged.set(request.requestId, request);
                }
                return Array.from(merged.values());
            });
            setRequestsCursor(requestsResult.nextCursor || null);
        } catch (error) {
            console.error('Admin v2 returns pagination failed:', error);
            setNotice({
                type: 'error',
                text: 'La suite des retours ne peut pas etre chargee pour le moment.'
            });
        } finally {
            setLoadingMore(false);
        }
    };

    const stats = useMemo(() => {
        const requestsToReview = customerRequests.filter(
            (request) => request.status === 'pending_review'
                || request.status === 'refund_failed'
                || request.canRefundAfterReturn
        );
        const ordersToReview = refundOrders.filter(isRefundIssue);
        const actionableReturns = returnCases.filter(
            (returnCase) => ['pending', 'received'].includes(returnCase.status)
                && (returnCase.allowedActions || []).length > 0
        );
        const activeReturns = returnCases.filter(
            (returnCase) => ['pending', 'received'].includes(returnCase.status)
        );
        const pendingStripe = refundOrders.filter(isRefundPending);
        const history = customerRequests.filter(
            (request) => ['completed', 'rejected'].includes(request.status)
        );
        const distinctOrders = (...groups) => new Set(
            groups.flat().map((entry) => entry.orderId || entry.id).filter(Boolean)
        ).size;
        return {
            attention: distinctOrders(requestsToReview, ordersToReview, actionableReturns),
            returns: distinctOrders(activeReturns),
            stripe: distinctOrders(pendingStripe, ordersToReview),
            history: distinctOrders(history, refundOrders.filter(
                (order) => order.status === 'refunded'
            )),
            eligible: distinctOrders(refundOrders.filter(
                (order) => (order.allowedActions || []).includes('request_refund')
            )),
            all: distinctOrders(customerRequests, refundOrders)
        };
    }, [refundOrders, returnCases, customerRequests]);

    const submitCustomerRequestDecision = async (event) => {
        event.preventDefault();
        if (!decisionDraft) return;
        const { request, decision, reason } = decisionDraft;
        setDecisionDraft(null);
        await runAction(request.orderId, `customer-${decision}`, async () => {
            const result = await decideCustomerReturnRequestAdmin(
                request,
                decision,
                reason
            );
            if (decision === 'refund_now' || decision === 'refund_after_return') {
                return result?.outcome === 'succeeded'
                    ? 'Remboursement confirme par Stripe.'
                    : 'Remboursement lance. Le suivi Stripe reste visible dans ce dossier.';
            }
            if (decision === 'authorize_return') {
                return 'Retour autorise. Le remboursement restera bloque jusqu a la reception et l inspection.';
            }
            return 'Demande refusee et decision enregistree.';
        });
    };

    const openCustomerDecision = (request, decision) => {
        const defaultReason = decision === 'refund_now'
            ? 'Remboursement direct, piece encore a l atelier'
            : decision === 'authorize_return'
                ? 'Retour autorise avant remboursement'
                : decision === 'refund_after_return'
                    ? 'Retour recu et inspecte, remboursement autorise'
                    : 'Demande refusee apres examen';
        setDecisionDraft({ request, decision, reason: defaultReason });
        setNotice(null);
    };

    const runAction = async (orderId, action, runner) => {
        setOperation(`${action}:${orderId}`);
        setNotice(null);
        try {
            const result = await runner();
            try {
                await refreshFirstPage();
                setNotice({ type: 'success', text: result });
            } catch (refreshError) {
                console.error('Admin returns refresh failed:', refreshError);
                setNotice({
                    type: 'success',
                    text: `${result} Actualisation indisponible: rechargez la page pour voir le nouvel etat.`
                });
            }
        } catch (error) {
            console.error(`Refund action ${action} failed:`, error);
            setNotice({
                type: 'error',
                text: 'Cette action n a pas pu etre terminee. Rechargez les donnees avant de reessayer.'
            });
        } finally {
            setOperation(null);
        }
    };

    const handleResumeRefund = async (order) => {
        const attempt = order.latestRefundAttempt;
        if (
            !attempt?.resumable ||
            !attempt.refundRequestId ||
            !Number.isSafeInteger(attempt.amountCents) ||
            attempt.amountCents <= 0
        ) {
            setNotice({
                type: 'error',
                text: 'La reference de reprise est absente. Ce dossier doit etre verifie.'
            });
            return;
        }
        await runAction(order.id, 'refund-sync', async () => {
            const result = await requestRefundAdmin(
                order,
                attempt.amountCents,
                'Rapprochement Stripe depuis gestion retours',
                attempt.refundRequestId
            );
            setSearch(order.id);
            return result?.outcome === 'succeeded'
                ? 'Remboursement confirme par Stripe.'
                : 'Remboursement toujours en attente chez Stripe.';
        });
    };

    const handleManualRefresh = async () => {
        setRefreshing(true);
        setNotice(null);
        try {
            await refreshFirstPage();
        } catch (error) {
            console.error('Admin returns manual refresh failed:', error);
            setNotice({
                type: 'error',
                text: 'Les donnees ne peuvent pas etre actualisees pour le moment.'
            });
        } finally {
            setRefreshing(false);
        }
    };

    const openRefundDialog = (order) => {
        const remainingCents = Number(order.amounts?.totalCents || 0)
            - Number(order.refundAggregate?.succeededCents || 0)
            - Number(order.refundAggregate?.pendingCents || 0);
        setRefundDraft({ order, remainingCents: Math.max(remainingCents, 0) });
        setRefundAmount((Math.max(remainingCents, 0) / 100).toFixed(2));
        setNotice(null);
    };

    const submitRefund = async (event) => {
        event.preventDefault();
        if (!refundDraft) return;
        const amountCents = Math.round(Number(refundAmount.replace(',', '.')) * 100);
        if (
            !Number.isSafeInteger(amountCents) ||
            amountCents <= 0 ||
            amountCents > refundDraft.remainingCents
        ) {
            setNotice({ type: 'error', text: 'Montant de remboursement invalide.' });
            return;
        }

        const { order } = refundDraft;
        setRefundDraft(null);
        await runAction(order.id, 'refund', async () => {
            const res = await requestRefundAdmin(
                order,
                amountCents,
                'Remboursement admin depuis gestion retours'
            );
            setSearch(order.id);
            if (res?.outcome === 'succeeded') {
                return `Remboursement confirme par Stripe. Reference: ${res.refundId}.`;
            }
            if (res?.outcome === 'failed') {
                return 'Stripe a refuse le remboursement. Le dossier est a verifier.';
            }
            return `Remboursement cree et encore en attente chez Stripe. Reference: ${res?.refundId || 'indisponible'}.`;
        });
    };

    const openReturnDraft = (order) => {
        const lines = (order.items || [])
            .filter((line) => line.lineId)
            .map((line) => ({
                lineId: line.lineId,
                label: line.titleSnapshot || line.name || line.lineId,
                maximum: Number(line.quantity || 0),
                quantity: Number(line.quantity || 0)
            }));
        setReturnDraft({
            type: 'open',
            order,
            action: 'open_return',
            reason: 'Retour administrateur',
            lines
        });
        setNotice(null);
    };

    const openReturnTransitionDraft = (returnCase, action, order) => {
        const needsLines = ['receive_return', 'restock_return', 'write_off_return'].includes(action);
        const lines = needsLines
            ? (returnCase.lines || []).map((line) => {
                const maximum = action === 'receive_return'
                    ? line.requestedQty - line.receivedQty
                    : line.receivedQty - line.restockedQty - line.writtenOffQty;
                const orderLine = (order.items || []).find((item) => item.lineId === line.lineId);
                return {
                    lineId: line.lineId,
                    label: orderLine?.titleSnapshot || orderLine?.name || line.lineId,
                    maximum,
                    quantity: Math.max(maximum, 0)
                };
            }).filter((line) => line.maximum > 0)
            : [];
        setReturnDraft({
            type: 'transition',
            order,
            returnCase,
            action,
            reason: returnActionLabel(action),
            lines
        });
        setNotice(null);
    };

    const updateReturnDraftLine = (lineId, rawQuantity) => {
        const quantity = Number(rawQuantity);
        setReturnDraft((current) => ({
            ...current,
            lines: current.lines.map((line) => (
                line.lineId === lineId ? { ...line, quantity } : line
            ))
        }));
    };

    const submitReturnDraft = async (event) => {
        event.preventDefault();
        if (!returnDraft) return;
        const reason = returnDraft.reason.trim();
        const lines = returnDraft.lines
            .filter((line) => Number.isSafeInteger(line.quantity) && line.quantity > 0)
            .map((line) => ({ lineId: line.lineId, quantity: line.quantity }));
        const invalidQuantity = returnDraft.lines.some(
            (line) => !Number.isSafeInteger(line.quantity)
                || line.quantity < 0
                || line.quantity > line.maximum
        );
        if (!reason || invalidQuantity || (returnDraft.lines.length > 0 && lines.length === 0)) {
            setNotice({ type: 'error', text: 'Vérifiez le motif et les quantités.' });
            return;
        }
        const draft = returnDraft;
        setReturnDraft(null);
        await runAction(draft.order.id, draft.action, async () => {
            if (draft.type === 'open') {
                const result = await openReturnAdmin(draft.order, lines, reason);
                return `Dossier retour ouvert : ${result?.returnCase?.returnId || 'confirmé'}.`;
            }
            if (draft.action === 'cancel_return') {
                await cancelReturnAdmin(draft.returnCase, reason);
            } else if (draft.action === 'resolve_return') {
                await resolveReturnAdmin(draft.returnCase, reason);
            } else if (draft.action === 'receive_return') {
                await markReturnReceivedAdmin(draft.returnCase, lines, reason);
            } else if (draft.action === 'restock_return') {
                await restockReturnLinesAdmin(draft.returnCase, lines, reason);
            } else if (draft.action === 'write_off_return') {
                await writeOffReturnLinesAdmin(draft.returnCase, lines, reason);
            }
            return `${returnActionLabel(draft.action)} : opération enregistrée.`;
        });
    };

    const panelClass = darkMode
        ? 'border-white/10 bg-[#111111] text-white'
        : 'border-stone-200 bg-white text-stone-900';
    const mutedText = darkMode ? 'text-stone-400' : 'text-stone-500';
    const softPanel = darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/70';
    const fieldClass = darkMode
        ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-stone-600'
        : 'border-stone-200 bg-stone-50 text-stone-950 placeholder:text-stone-400';
    const secondaryButton = darkMode
        ? 'border-white/10 text-stone-200 hover:bg-white/[0.06]'
        : 'border-stone-200 text-stone-700 hover:bg-stone-100';
    const primaryButton = darkMode
        ? 'bg-white text-stone-950 hover:bg-stone-200'
        : 'bg-stone-950 text-white hover:bg-stone-800';
    const viewOptions = [
        { id: 'attention', label: 'À traiter', count: stats.attention },
        { id: 'returns', label: 'Retours en cours', count: stats.returns },
        { id: 'stripe', label: 'Stripe', count: stats.stripe },
        { id: 'eligible', label: 'Remboursement manuel', count: stats.eligible },
        { id: 'history', label: 'Historique', count: stats.history },
        { id: 'all', label: 'Tout', count: stats.all }
    ];
    const visibleCount = new Set([
        ...visibleCustomerRequests.map((request) => request.orderId),
        ...visibleRefundOrders.map((order) => order.id)
    ]).size;

    return (
        <div className="space-y-5">
            {decisionDraft ? (
                <div className="fixed inset-0 z-[125] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <form onSubmit={submitCustomerRequestDecision} className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${panelClass}`}>
                        <p className={`text-xs font-semibold ${mutedText}`}>Commande {getOrderReference(decisionDraft.request.order)}</p>
                        <h3 className="mt-1 text-xl font-black tracking-tight">
                            {decisionDraft.decision === 'refund_now' ? 'Rembourser maintenant' :
                                decisionDraft.decision === 'authorize_return' ? 'Autoriser le retour' :
                                    decisionDraft.decision === 'refund_after_return' ? 'Rembourser après inspection' :
                                        'Refuser la demande'}
                        </h3>
                        <label className="mt-5 block text-sm font-bold">
                            Motif
                            <textarea
                                value={decisionDraft.reason}
                                onChange={(event) => setDecisionDraft((current) => ({ ...current, reason: event.target.value.slice(0, 500) }))}
                                rows={3}
                                className={`mt-2 w-full resize-none rounded-lg border px-3 py-3 text-sm font-medium outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 ${fieldClass}`}
                            />
                        </label>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={() => setDecisionDraft(null)} className={`rounded-lg border px-4 py-2.5 text-sm font-bold transition active:translate-y-px ${secondaryButton}`}>Annuler</button>
                            <button type="submit" className={`rounded-lg px-4 py-2.5 text-sm font-bold transition active:translate-y-px ${decisionDraft.decision === 'reject' ? 'bg-red-700 text-white hover:bg-red-800' : primaryButton}`}>Confirmer</button>
                        </div>
                    </form>
                </div>
            ) : null}

            {refundDraft ? (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="refund-dialog-title"
                >
                    <form
                        onSubmit={submitRefund}
                        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${panelClass}`}
                    >
                        <p className={`text-xs font-semibold ${mutedText}`}>Commande {getOrderReference(refundDraft.order)}</p>
                        <h3 id="refund-dialog-title" className="mt-1 text-xl font-black tracking-tight">
                            Remboursement Stripe
                        </h3>
                        <label className="mt-5 block">
                            <span className="text-sm font-bold">
                                Montant à rembourser
                            </span>
                            <div className={`mt-2 flex items-center rounded-lg border px-4 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15 ${fieldClass}`}>
                                <input
                                    value={refundAmount}
                                    onChange={(event) => setRefundAmount(event.target.value)}
                                    inputMode="decimal"
                                    aria-describedby="refund-amount-help"
                                    className="min-w-0 flex-1 bg-transparent py-3 text-lg font-black outline-none"
                                />
                                <span className={`text-sm font-black ${mutedText}`}>EUR</span>
                            </div>
                        </label>
                        <p id="refund-amount-help" className={`mt-2 text-xs ${mutedText}`}>
                            Maximum disponible : {(refundDraft.remainingCents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} EUR
                        </p>
                        <p className={`mt-4 text-xs ${mutedText}`}>Le stock reste inchangé.</p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setRefundDraft(null)}
                                className={`rounded-lg border px-4 py-2.5 text-sm font-bold transition active:translate-y-px ${secondaryButton}`}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className={`rounded-lg px-4 py-2.5 text-sm font-bold transition active:translate-y-px ${primaryButton}`}
                            >
                                Rembourser {refundAmount || '0'} EUR
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {returnDraft ? (
                <div className="fixed inset-0 z-[125] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="return-dialog-title">
                    <form onSubmit={submitReturnDraft} className={`max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 shadow-2xl ${panelClass}`}>
                        <p className={`text-xs font-semibold ${mutedText}`}>Commande {getOrderReference(returnDraft.order)}</p>
                        <h3 id="return-dialog-title" className="mt-1 text-xl font-black tracking-tight">
                            {returnDraft.type === 'open' ? 'Ouvrir un retour' : returnActionLabel(returnDraft.action)}
                        </h3>
                        {returnDraft.lines.length > 0 ? (
                            <div className={`mt-5 divide-y rounded-xl border ${darkMode ? 'divide-white/10 border-white/10' : 'divide-stone-200 border-stone-200'}`}>
                                {returnDraft.lines.map((line) => (
                                    <div key={line.lineId} className="grid grid-cols-[minmax(0,1fr)_84px] items-center gap-4 px-4 py-3">
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-bold">{line.label}</span>
                                            <span className={`mt-0.5 block font-mono text-[10px] ${mutedText}`}>Maximum {line.maximum}</span>
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            max={line.maximum}
                                            step="1"
                                            aria-label={`Quantité pour ${line.label}`}
                                            value={line.quantity}
                                            onChange={(event) => updateReturnDraftLine(line.lineId, event.target.value)}
                                            className={`w-full rounded-lg border px-3 py-2 text-right text-sm font-black outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 ${fieldClass}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : null}
                        <label className="mt-5 block text-sm font-bold">
                            Motif
                            <textarea
                                value={returnDraft.reason}
                                onChange={(event) => setReturnDraft((current) => ({ ...current, reason: event.target.value.slice(0, 500) }))}
                                rows={3}
                                className={`mt-2 w-full resize-none rounded-lg border px-3 py-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 ${fieldClass}`}
                            />
                        </label>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={() => setReturnDraft(null)} className={`rounded-lg border px-4 py-2.5 text-sm font-bold transition active:translate-y-px ${secondaryButton}`}>Annuler</button>
                            <button type="submit" className={`rounded-lg px-4 py-2.5 text-sm font-bold transition active:translate-y-px ${primaryButton}`}>Confirmer</button>
                        </div>
                    </form>
                </div>
            ) : null}

            <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className={`text-3xl font-black tracking-tighter md:text-4xl ${darkMode ? 'text-white' : 'text-stone-950'}`}>Retours</h2>
                        {!loading && stats.attention > 0 ? (
                            <span className={`rounded-md px-2 py-1 text-xs font-black tabular-nums ${darkMode ? 'bg-amber-300 text-stone-950' : 'bg-amber-400 text-stone-950'}`}>{stats.attention}</span>
                        ) : null}
                    </div>
                    <p className={`mt-1 text-sm ${mutedText}`}>Demandes, retours physiques et remboursements.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <label className={`flex min-w-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 sm:min-w-[280px] ${fieldClass}`}>
                        <Search size={16} className="shrink-0" />
                        <span className="sr-only">Rechercher un dossier</span>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Meuble, client, commande…"
                            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${secondaryButton}`}
                    >
                        <RotateCcw size={15} className={refreshing ? 'animate-spin' : ''} />
                        Actualiser
                    </button>
                </div>
            </header>

            <nav className={`flex gap-1 overflow-x-auto rounded-xl border p-1 ${darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-100/70'}`} aria-label="Filtrer les retours">
                {viewOptions.map((option) => {
                    const active = view === option.id;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setView(option.id)}
                            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition active:translate-y-px ${active
                                ? (darkMode ? 'bg-white text-stone-950 shadow-sm' : 'bg-white text-stone-950 shadow-sm')
                                : (darkMode ? 'text-stone-400 hover:bg-white/[0.05] hover:text-white' : 'text-stone-500 hover:bg-white/70 hover:text-stone-900')}`}
                        >
                            {option.label}
                            <span className={`min-w-5 rounded px-1.5 py-0.5 text-center text-[10px] tabular-nums ${active ? 'bg-stone-100 text-stone-700' : (darkMode ? 'bg-white/[0.06]' : 'bg-stone-200/70')}`}>
                                {loading && !cachedPage ? '—' : option.count}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {notice ? (
                <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                    notice.type === 'success'
                        ? (darkMode ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-100 bg-emerald-50 text-emerald-700')
                        : (darkMode ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-red-100 bg-red-50 text-red-700')
                }`} role="status">
                    {notice.text}
                </div>
            ) : null}

            <div className="flex items-center justify-between gap-4">
                <p className={`text-xs tabular-nums ${mutedText}`}>
                    {loading && !cachedPage ? 'Chargement…' : `${visibleCount} dossier${visibleCount > 1 ? 's' : ''}`}
                </p>
                {!returnCommandsEnabled ? <span className={`text-xs font-semibold ${mutedText}`}>Lecture seule</span> : null}
            </div>

            {loading && !cachedPage ? (
                <div className={`overflow-hidden rounded-2xl border ${panelClass}`} aria-label="Chargement des dossiers">
                    {[0, 1, 2].map((index) => (
                        <div key={index} className={`grid animate-pulse gap-4 border-b px-5 py-6 last:border-b-0 md:grid-cols-[minmax(0,1fr)_180px_120px] ${darkMode ? 'border-white/10' : 'border-stone-100'}`}>
                            <div className={`h-10 rounded-lg ${darkMode ? 'bg-white/[0.06]' : 'bg-stone-100'}`} />
                            <div className={`h-10 rounded-lg ${darkMode ? 'bg-white/[0.06]' : 'bg-stone-100'}`} />
                            <div className={`h-10 rounded-lg ${darkMode ? 'bg-white/[0.06]' : 'bg-stone-100'}`} />
                        </div>
                    ))}
                </div>
            ) : null}

            {!loading && visibleCustomerRequests.length > 0 ? (
                <section className={`overflow-hidden rounded-2xl border ${panelClass}`}>
                    <div className={`flex items-center justify-between border-b px-5 py-3.5 ${darkMode ? 'border-white/10' : 'border-stone-100'}`}>
                        <h3 className="text-sm font-black">Demandes client</h3>
                        <span className={`text-xs tabular-nums ${mutedText}`}>{visibleCustomerRequests.length}</span>
                    </div>
                    <div className={`divide-y ${darkMode ? 'divide-white/10' : 'divide-stone-100'}`}>
                        {visibleCustomerRequests.map((request) => {
                            const status = customerRequestStatus(request);
                            const classes = toneClasses[status.tone] || toneClasses.stone;
                            const order = request.order || {};
                            const activeOperation = operation?.endsWith(`:${request.orderId}`);
                            return (
                                <article key={request.requestId} className={`grid gap-4 px-5 py-5 transition md:grid-cols-[minmax(0,1.3fr)_minmax(190px,0.65fr)] lg:grid-cols-[minmax(0,1.4fr)_minmax(210px,0.65fr)_minmax(190px,0.55fr)] lg:items-center ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-stone-50/70'}`}>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-md border px-2 py-1 text-[10px] font-black ${darkMode ? classes.dark : classes.light}`}>{status.label}</span>
                                            <span className={`text-xs ${mutedText}`}>{formatShortDate(request.createdAt)}</span>
                                        </div>
                                        <p className="mt-2 truncate text-base font-black tracking-tight">{getRequestItemsLabel(request)}</p>
                                        <p className={`mt-1 truncate text-xs ${mutedText}`}>
                                            {order.shippingSnapshot?.fullName || 'Client non renseigné'} · {order.customerSnapshot?.email || 'Email absent'}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="text-xs font-bold">{customerRequestReason(request.reason)}</span>
                                            <span className={`font-mono text-[10px] ${mutedText}`}>{getOrderReference(request.order)}</span>
                                        </div>
                                        {request.note ? (
                                            <details className="mt-2 text-xs">
                                                <summary className={`cursor-pointer font-semibold ${mutedText}`}>Message du client</summary>
                                                <p className={`mt-2 max-w-2xl leading-5 ${mutedText}`}>{request.note}</p>
                                            </details>
                                        ) : null}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${mutedText}`}>Étape</p>
                                        <p className="mt-1.5 text-sm font-black">{customerRequestStep(request)}</p>
                                        {request.returnCase ? <p className={`mt-1 text-xs ${mutedText}`}>{returnStatusLabel(request.returnCase.status)}</p> : null}
                                    </div>
                                    <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-1 lg:justify-end">
                                        {returnCommandsEnabled ? (
                                            <>
                                                {request.canRefundNow ? <button type="button" disabled={activeOperation} onClick={() => openCustomerDecision(request, 'refund_now')} className={`rounded-lg px-3.5 py-2.5 text-xs font-bold transition active:translate-y-px disabled:opacity-50 ${primaryButton}`}>Rembourser</button> : null}
                                                {request.canAuthorizeReturn ? <button type="button" disabled={activeOperation} onClick={() => openCustomerDecision(request, 'authorize_return')} className={`rounded-lg border px-3.5 py-2.5 text-xs font-bold transition active:translate-y-px disabled:opacity-50 ${secondaryButton}`}>Autoriser le retour</button> : null}
                                                {request.canRefundAfterReturn ? <button type="button" disabled={activeOperation} onClick={() => openCustomerDecision(request, 'refund_after_return')} className={`rounded-lg px-3.5 py-2.5 text-xs font-bold transition active:translate-y-px disabled:opacity-50 ${primaryButton}`}>Rembourser</button> : null}
                                                {request.canReject ? <button type="button" disabled={activeOperation} onClick={() => openCustomerDecision(request, 'reject')} className="rounded-lg px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-500/10 active:translate-y-px disabled:opacity-50">Refuser</button> : null}
                                            </>
                                        ) : null}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
            </section>
            ) : null}

            {!loading && visibleRefundOrders.length > 0 ? (
                <section className={`overflow-hidden rounded-2xl border ${panelClass}`}>
                    <div className={`flex items-center justify-between border-b px-5 py-3.5 ${darkMode ? 'border-white/10' : 'border-stone-100'}`}>
                        <h3 className="text-sm font-black">Dossiers</h3>
                        <span className={`text-xs tabular-nums ${mutedText}`}>{visibleRefundOrders.length}</span>
                    </div>
                    <div className={darkMode ? 'divide-y divide-white/10' : 'divide-y divide-stone-100'}>
                        {visibleRefundOrders.map((order) => {
                            const email = getOrderEmail(order);
                            const allowedActions = new Set(
                                Array.isArray(order.allowedActions) ? order.allowedActions : []
                            );
                            const canRefund = allowedActions.has('request_refund');
                            const canResumeRefund = order.status === 'refund_pending'
                                && order.latestRefundAttempt?.resumable === true;
                            const canOpenReturn = allowedActions.has('open_return');
                            const activeOperation = operation?.endsWith(`:${order.id}`) ? operation.split(':')[0] : null;
                            return (
                                <article key={order.id} className={`grid gap-4 px-5 py-5 transition md:grid-cols-[minmax(0,1.35fr)_minmax(170px,0.65fr)_120px] lg:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.6fr)_120px_minmax(170px,0.55fr)] lg:items-center ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-stone-50/70'}`}>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusBadge order={order} darkMode={darkMode} />
                                            {order.stockRestoredAfterRefund ? (
                                                <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
                                                    Stock remis
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-2 truncate text-base font-black tracking-tight">{getItemsLabel(order)}</p>
                                        <p className={`mt-1 truncate text-xs ${mutedText}`}>{order.shipping?.fullName || 'Client inconnu'} · {email || 'Email absent'}</p>
                                        <p className={`mt-1 font-mono text-[10px] ${mutedText}`}>{getOrderReference(order)} · {formatShortDate(order.createdAt)}</p>
                                    </div>

                                    <div>
                                        <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${mutedText}`}>Suivi</p>
                                        <p className="mt-1.5 text-sm font-black">
                                            {isRefundIssue(order) ? 'À vérifier' :
                                                isRefundPending(order) ? 'Stripe en cours' :
                                                    hasActiveReturn(order) ? 'Retour physique' :
                                                        order.status === 'refunded' ? 'Remboursé' : 'Éligible'}
                                        </p>
                                        {hasActiveReturn(order) ? <p className={`mt-1 text-xs ${mutedText}`}>{order.returnCases.filter((returnCase) => ['pending', 'received'].includes(returnCase.status)).map((returnCase) => returnStatusLabel(returnCase.status)).join(', ')}</p> : null}
                                    </div>

                                    <div>
                                        <p className="text-sm font-black">{formatAmount(order)}</p>
                                        <p className={`mt-1 text-[11px] ${mutedText}`}>sur {Number(order.total || 0).toLocaleString('fr-FR')} EUR</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 md:col-span-3 lg:col-span-1 lg:justify-end">
                                        {returnCommandsEnabled && order.schemaVersion === 2 ? (
                                            <>
                                                {canResumeRefund ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResumeRefund(order)}
                                                        disabled={Boolean(activeOperation)}
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-3.5 py-2.5 text-xs font-bold text-stone-950 transition hover:bg-amber-300 active:translate-y-px disabled:cursor-wait disabled:opacity-60"
                                                    >
                                                        {activeOperation === 'refund-sync' ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                                        Vérifier Stripe
                                                    </button>
                                                ) : null}
                                                {canRefund ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openRefundDialog(order)}
                                                        disabled={Boolean(activeOperation)}
                                                        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${primaryButton}`}
                                                    >
                                                        {activeOperation === 'refund' ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                                        Rembourser
                                                    </button>
                                                ) : null}
                                                {canOpenReturn ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openReturnDraft(order)}
                                                        disabled={Boolean(activeOperation)}
                                                        className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${secondaryButton}`}
                                                    >
                                                        {activeOperation === 'return' ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                                                        Ouvrir un retour
                                                    </button>
                                                ) : null}
                                            </>
                                        ) : null}
                                    </div>

                                    {(Array.isArray(order.returnCases) && order.returnCases.length > 0) || order.stripePaymentIntentId ? (
                                        <details className={`rounded-xl border md:col-span-3 lg:col-span-4 ${softPanel}`}>
                                            <summary className="cursor-pointer px-4 py-3 text-xs font-bold">Détails du dossier</summary>
                                            <div className={`border-t p-4 ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
                                                <div className={`grid gap-2 text-[11px] md:grid-cols-2 ${mutedText}`}>
                                                    <p className="break-all font-mono">PaymentIntent : {order.stripePaymentIntentId || '-'}</p>
                                                    <p className="break-all font-mono">Remboursement : {order.stripeRefundId || '-'}</p>
                                                    <p>Synchronisé : {formatDate(order.refundUpdatedAt)}</p>
                                                    {order.latestRefundAttempt?.providerStatus ? <p>Stripe : {order.latestRefundAttempt.providerStatus}</p> : null}
                                                    {order.refundAttemptReadError ? <p className="font-bold text-red-500">Référence de rapprochement indisponible.</p> : null}
                                                    {order.refundFailureReason ? <p className="font-bold text-red-500">{order.refundFailureReason}</p> : null}
                                                </div>
                                                {Array.isArray(order.returnCases) && order.returnCases.length > 0 ? (
                                                    <div className={`mt-4 space-y-3 border-t pt-4 ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
                                            {order.returnCases.map((returnCase) => (
                                                <div key={returnCase.returnId}>
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-xs font-black">{returnStatusLabel(returnCase.status)}</span>
                                                        <span className={`font-mono text-[10px] ${mutedText}`}>#{returnCase.returnId}</span>
                                                    </div>
                                                    <div className={`mt-2 space-y-1 text-[11px] ${mutedText}`}>
                                                        {returnLineSummary(returnCase, order).map((summary) => (
                                                            <p key={summary}>{summary}</p>
                                                        ))}
                                                    </div>
                                                    {returnCommandsEnabled && (returnCase.allowedActions || []).length > 0 ? (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {(returnCase.allowedActions || []).map((action) => (
                                                            <button
                                                                key={action}
                                                                type="button"
                                                                onClick={() => openReturnTransitionDraft(returnCase, action, order)}
                                                                disabled={Boolean(activeOperation)}
                                                                className={`rounded-lg border px-3 py-2 text-xs font-bold transition active:translate-y-px disabled:opacity-50 ${secondaryButton}`}
                                                            >
                                                                {returnActionLabel(action)}
                                                            </button>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </details>
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {!loading && visibleCount === 0 ? (
                <div className={`rounded-2xl border px-6 py-14 text-center ${panelClass}`}>
                    <p className="text-lg font-black">Aucun dossier ici</p>
                    <p className={`mt-1 text-sm ${mutedText}`}>{search ? 'Essayez une autre recherche.' : 'Cette vue est à jour.'}</p>
                </div>
            ) : null}

            {COMMERCE_V2_ADMIN_READERS_ENABLED && (ordersCursor || returnsCursor || requestsCursor) ? (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={loadMoreV2}
                        disabled={loadingMore}
                        className={`rounded-lg border px-5 py-2.5 text-sm font-bold transition active:translate-y-px disabled:opacity-50 ${secondaryButton}`}
                    >
                        {loadingMore ? 'Chargement…' : 'Charger la suite'}
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default AdminReturns;
