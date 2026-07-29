import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Package, Clock, CheckCircle, Mail, ChevronDown, ChevronUp, Download, Loader2, Truck, XCircle, RotateCcw } from 'lucide-react';
import { downloadCsv } from './exportCsv';
import { formatShippingAddress } from '../../utils/shippingAddress';
import { getMillis } from '../../utils/time';
import {
    archiveOrderAdmin,
    COMMERCE_V2_ADMIN_ORDER_COMMANDS_ENABLED,
    markOrderDeliveredAdmin,
    markOrderPickedUpAdmin,
    markOrderPreparingAdmin,
    markOrderReadyForPickupAdmin,
    markOrderShippedAdmin,
} from '../commerce/commerceCommandClient';
import {
    COMMERCE_V2_ADMIN_READERS_ENABLED,
    getOrderTimelineAdminV2,
    listOrdersAdminV2,
} from '../commerce/commerceV2Client';
import { getAdminCachedData, loadAdminCachedData } from './adminDataCache';

const AdminOrders = ({ darkMode = false, mutationsEnabled = false }) => {
    const cachedPage = getAdminCachedData('admin-orders:first-page');
    const orderCommandsEnabled = mutationsEnabled && COMMERCE_V2_ADMIN_ORDER_COMMANDS_ENABLED;
    const [orders, setOrders] = useState(cachedPage?.orders || []);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [orderLimit, setOrderLimit] = useState(50);
    const [isLoading, setIsLoading] = useState(!cachedPage);
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [nextCursor, setNextCursor] = useState(null);
    const [orderTimelines, setOrderTimelines] = useState({});
    const [timelineLoadingId, setTimelineLoadingId] = useState(null);

    useEffect(() => {
        setIsLoading(!getAdminCachedData('admin-orders:first-page'));
        if (COMMERCE_V2_ADMIN_READERS_ENABLED) {
            let cancelled = false;
            loadAdminCachedData(
                'admin-orders:first-page',
                () => listOrdersAdminV2({ pageSize: 50 })
            )
                .then((result) => {
                    if (cancelled) return;
                    setOrders(result.orders || []);
                    setNextCursor(result.nextCursor || null);
                    setIsLoading(false);
                })
                .catch((error) => {
                    if (cancelled) return;
                    console.error('Admin v2 orders read failed:', error);
                    setIsLoading(false);
                });
            return () => {
                cancelled = true;
            };
        }
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(orderLimit));

        const unsub = onSnapshot(q, (snap) => {
            console.log(`🔥 FIRESTORE READ: Chargement de ${snap.docs.length} commandes`);
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setIsLoading(false);
        });
        return () => unsub();
    }, [orderLimit]);

    const loadMoreOrders = async () => {
        if (!COMMERCE_V2_ADMIN_READERS_ENABLED || !nextCursor || isLoading) return;
        setIsLoading(true);
        try {
            const result = await listOrdersAdminV2({
                pageSize: 50,
                cursor: nextCursor
            });
            setOrders((current) => [...current, ...(result.orders || [])]);
            setNextCursor(result.nextCursor || null);
        } finally {
            setIsLoading(false);
        }
    };

    const allowedActions = (order) => new Set(
        Array.isArray(order?.allowedActions) ? order.allowedActions : []
    );

    const runOrderAction = async (order, action, confirmation) => {
        if (!orderCommandsEnabled) return;
        if (!allowedActions(order).has(action)) return;
        if (confirmation && !window.confirm(confirmation)) return;
        try {
            setActiveOrderId(order.id);
            if (action === 'fulfillment_ship') {
                const trackingNumber = window.prompt(
                    'Numero de suivi (facultatif).',
                    order.fulfillmentSummary?.trackingNumber || ''
                );
                if (trackingNumber === null) return;
                await markOrderShippedAdmin(order, trackingNumber);
            } else if (action === 'fulfillment_prepare') {
                await markOrderPreparingAdmin(order);
            } else if (action === 'fulfillment_ready') {
                await markOrderReadyForPickupAdmin(order);
            } else if (action === 'fulfillment_pickup') {
                await markOrderPickedUpAdmin(order);
            } else if (action === 'fulfillment_deliver') {
                await markOrderDeliveredAdmin(order);
            } else if (action === 'archive_order') {
                await archiveOrderAdmin(order);
            }
        } catch (error) {
            console.error('Order command failed:', error);
            alert(`Commande non appliquee : ${error.message || error}`);
        } finally {
            setActiveOrderId(null);
        }
    };

    const formatPrice = (price) => `${price} €`;
    const formatDate = (timestamp) => {
        const millis = getMillis(timestamp);
        if (!millis) return 'Date indisponible';
        return new Date(millis).toLocaleString('fr-FR', {
            dateStyle: 'medium',
            timeStyle: 'medium',
        });
    };

    const fallbackTimeline = (order) => {
        const events = [
            { type: 'order_created', at: order.createdAt },
            { type: 'payment_succeeded', at: order.payment?.succeededAt || order.paidAt },
        ].filter((event) => getMillis(event.at));
        const status = String(order.status || '');
        if (
            ['cancelled', 'canceled', 'cancelled_by_client'].includes(status) ||
            order.payment?.status === 'canceled'
        ) {
            events.push({
                type: 'order_cancelled',
                at: order.cancelledAt || order.canceledAt || order.updatedAt,
            });
        }
        if (
            ['refund_pending', 'refunded', 'refund_failed'].includes(status) ||
            Number(order.refundAggregate?.requestedCents || 0) > 0
        ) {
            events.push({
                type: status === 'refund_pending' ? 'refund_requested' :
                    (status === 'refund_failed' ? 'refund_failed' : 'refund_succeeded'),
                at: order.refundUpdatedAt || order.updatedAt,
            });
        }
        return events
            .filter((event) => getMillis(event.at))
            .sort((left, right) => getMillis(left.at) - getMillis(right.at));
    };

    const loadOrderTimeline = async (order) => {
        if (orderTimelines[order.id] || timelineLoadingId === order.id) return;
        setTimelineLoadingId(order.id);
        try {
            const result = await getOrderTimelineAdminV2(order.id);
            setOrderTimelines((current) => ({
                ...current,
                [order.id]: result.timeline || [],
            }));
        } catch (error) {
            console.error('Admin order timeline read failed:', error);
            setOrderTimelines((current) => ({
                ...current,
                [order.id]: fallbackTimeline(order),
            }));
        } finally {
            setTimelineLoadingId(null);
        }
    };

    const toggleOrder = (order) => {
        const willOpen = expandedOrder !== order.id;
        setExpandedOrder(willOpen ? order.id : null);
        if (willOpen) loadOrderTimeline(order);
    };

    const timelineMeta = (event) => {
        switch (event.type) {
            case 'order_created': return { label: 'Commande créée', icon: Package, tone: 'text-stone-500 bg-stone-100' };
            case 'payment_succeeded': return { label: 'Paiement confirmé', icon: CheckCircle, tone: 'text-emerald-700 bg-emerald-50' };
            case 'order_cancelled': return { label: 'Commande annulée', icon: XCircle, tone: 'text-red-700 bg-red-50' };
            case 'refund_requested': return { label: 'Remboursement demandé', icon: RotateCcw, tone: 'text-amber-700 bg-amber-50' };
            case 'refund_succeeded': return { label: 'Remboursement confirmé', icon: RotateCcw, tone: 'text-sky-700 bg-sky-50' };
            case 'refund_failed': return { label: 'Remboursement à vérifier', icon: XCircle, tone: 'text-red-700 bg-red-50' };
            default: return { label: 'Événement', icon: Clock, tone: 'text-stone-500 bg-stone-100' };
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'shipped': return { color: 'text-indigo-500', bg: 'bg-indigo-500', bgLight: 'bg-indigo-50', bgDark: 'bg-indigo-900/40', label: 'Expédiée' };
            case 'completed': return { color: 'text-emerald-600', bg: 'bg-emerald-500', bgLight: 'bg-emerald-50', bgDark: 'bg-emerald-900/40', label: 'Terminée' };
            case 'paid': return { color: 'text-emerald-600', bg: 'bg-emerald-500', bgLight: 'bg-emerald-50', bgDark: 'bg-emerald-900/40', label: 'Payee' };
            case 'refund_pending': return { color: 'text-amber-600', bg: 'bg-amber-500', bgLight: 'bg-amber-50', bgDark: 'bg-amber-900/40', label: 'Remboursement en cours' };
            case 'refunded': return { color: 'text-sky-600', bg: 'bg-sky-500', bgLight: 'bg-sky-50', bgDark: 'bg-sky-900/40', label: 'Remboursée' };
            case 'refund_failed': return { color: 'text-red-600', bg: 'bg-red-500', bgLight: 'bg-red-50', bgDark: 'bg-red-900/40', label: 'Remboursement a verifier' };
            case 'payment_failed': return { color: 'text-red-600', bg: 'bg-red-500', bgLight: 'bg-red-50', bgDark: 'bg-red-900/40', label: 'Paiement echoue' };
            case 'cancelled':
            case 'canceled':
            case 'cancelled_by_client': return { color: 'text-red-600', bg: 'bg-red-500', bgLight: 'bg-red-50', bgDark: 'bg-red-900/40', label: 'Annulée' };
            default: return { color: 'text-amber-600', bg: 'bg-amber-500', bgLight: 'bg-amber-50', bgDark: 'bg-amber-900/40', label: 'En attente' };
        }
    };

    const exportToCsv = () => {
        const data = orders.map(order => ({
            'ID Commande': order.id,
            'Date et heure': formatDate(order.createdAt),
            'Paiement confirmé le': formatDate(order.payment?.succeededAt || order.paidAt),
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
            'Articles': order.items?.map(i => `${i.quantity || 1}x ${i.name}`).join(', ') || ''
        }));

        downloadCsv(data, 'Commandes');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className={`text-2xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-stone-900'}`}>Commandes ({orders.length})</h2>
                    <button
                        onClick={exportToCsv}
                        className={`group flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 shadow-xl ${
                            darkMode 
                                ? 'bg-white/5 border-white/5 text-white/70 hover:bg-white hover:text-stone-900 shadow-black/20' 
                                : 'bg-stone-50 border-stone-100 text-stone-500 hover:bg-stone-900 hover:text-white shadow-stone-200/40'
                        }`}
                    >
                        <Download size={15} className="group-hover:-translate-y-0.5 transition-transform" /> 
                        Export CSV
                    </button>
                </div>
                <div className="flex gap-2 text-xs font-bold uppercase tracking-widest text-stone-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> En cours</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Expédiées</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Terminées</span>
                </div>
            </div>

            <div className={`grid gap-4 pr-2 overflow-y-auto scrollbar-thin ${darkMode ? 'scrollbar-thumb-stone-700 scrollbar-track-stone-900/20' : 'scrollbar-thumb-stone-200 scrollbar-track-stone-50'} max-h-[750px] custom-scrollbar`}>
                {orders.map(order => {
                    const badge = getStatusBadge(order.status);

                    return (
                        <div key={order.id} className={`ring-1 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-shadow will-change-transform ${darkMode ? 'bg-stone-800 ring-stone-700/50' : 'bg-white ring-stone-100'}`}>
                            {/* Header de la commande */}
                            <button
                                type="button"
                                onClick={() => toggleOrder(order)}
                                aria-expanded={expandedOrder === order.id}
                                className="flex w-full cursor-pointer flex-col justify-between gap-4 p-5 text-left md:p-6 sm:flex-row sm:items-center"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white ${badge.bg}`}>
                                        {order.status === 'shipped' ? <Truck size={18} /> : ((order.status === 'completed' || order.status === 'paid') ? <CheckCircle size={18} /> : (order.status?.includes('cancelled') || order.status === 'canceled' || order.status === 'payment_failed' ? <XCircle size={18} /> : <Clock size={18} />))}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`font-bold truncate text-sm md:text-base ${darkMode ? 'text-white' : 'text-stone-900'}`}>{order.shipping?.fullName || 'Client Inconnu'}</h3>
                                        <p className="text-[10px] md:text-xs text-stone-400 font-medium uppercase tracking-widest leading-relaxed">
                                            {formatDate(order.createdAt)} <span className="hidden sm:inline">•</span> <br className="sm:hidden" /> {formatPrice(order.total)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-none pt-4 sm:pt-0">
                                    <span className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest ${darkMode ? badge.bgDark + ' ' + badge.color : badge.bgLight + ' ' + badge.color}`}>
                                        {badge.label}
                                    </span>
                                    {expandedOrder === order.id ? <ChevronUp size={16} className="text-stone-300" /> : <ChevronDown size={16} className="text-stone-300" />}
                                </div>
                            </button>

                            {/* Détails déroulants */}
                            {expandedOrder === order.id && (
                                <div className={`px-6 pb-6 pt-0 border-t ${darkMode ? 'border-stone-700 bg-stone-900/20' : 'border-stone-50 bg-stone-50/50'}`}>
                                    <div className="mt-6">
                                        <h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-stone-400">
                                            <Clock size={12} /> Historique horodaté
                                        </h4>
                                        <div className={`rounded-2xl ring-1 ring-inset ${darkMode ? 'bg-stone-900/40 ring-stone-700' : 'bg-white ring-stone-100'}`}>
                                            {timelineLoadingId === order.id ? (
                                                <div className="flex items-center gap-2 px-4 py-4 text-xs text-stone-400">
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Chargement des événements…
                                                </div>
                                            ) : Array.isArray(orderTimelines[order.id]) && orderTimelines[order.id].length > 0 ? (
                                                <ol className="divide-y divide-stone-100">
                                                    {orderTimelines[order.id].map((event, index) => {
                                                        const meta = timelineMeta(event);
                                                        const Icon = meta.icon;
                                                        return (
                                                            <li key={`${event.type}-${getMillis(event.at)}-${index}`} className="flex items-center gap-3 px-4 py-3">
                                                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-white/5 text-stone-300' : meta.tone}`}>
                                                                    <Icon size={14} />
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className={`text-sm font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{meta.label}</p>
                                                                    <time className="text-xs tabular-nums text-stone-400" dateTime={new Date(getMillis(event.at)).toISOString()}>
                                                                        {formatDate(event.at)}
                                                                    </time>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ol>
                                            ) : (
                                                <p className="px-4 py-4 text-xs text-stone-400">
                                                    L’historique précis n’est pas disponible pour cette ancienne commande.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6 mt-6">

                                        {/* Panier */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 flex items-center gap-2"><Package size={12} /> Contenu du panier</h4>
                                            <div className={`p-4 rounded-2xl ring-1 ring-inset space-y-2 ${darkMode ? 'bg-stone-900/40 ring-stone-700' : 'bg-white ring-stone-100'}`}>
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                        <span className={`font-medium ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{item.name}</span>
                                                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>{formatPrice(item.price)}</span>
                                                    </div>
                                                ))}
                                                <div className={`border-t pt-2 mt-2 flex justify-between font-black ${darkMode ? 'border-stone-700 text-white' : 'border-stone-100 text-stone-900'}`}>
                                                    <span>Total</span>
                                                    <span>{formatPrice(order.total)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info Client & Actions */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 flex items-center gap-2"><Mail size={12} /> Contact & Livraison</h4>
                                            <div className={`p-4 rounded-2xl ring-1 ring-inset text-sm space-y-1 ${darkMode ? 'bg-stone-900/40 ring-stone-700 text-stone-400' : 'bg-white ring-stone-100 text-stone-600'}`}>
                                                <p><strong className={darkMode ? 'text-stone-200' : 'text-stone-900'}>Compte:</strong> {order.userEmail}</p>
                                                <p><strong className={darkMode ? 'text-stone-200' : 'text-stone-900'}>Livraison:</strong> {order.shipping?.email}</p>
                                                <p><strong className={darkMode ? 'text-stone-200' : 'text-stone-900'}>Tél:</strong> {order.shipping?.phone}</p>
                                                <p><strong className={darkMode ? 'text-stone-200' : 'text-stone-900'}>Adresse:</strong> {formatShippingAddress(order.shipping) || 'Non renseignee'}</p>
                                                <p><strong className={darkMode ? 'text-stone-200' : 'text-stone-900'}>Paiement:</strong> {order.paymentMethod === 'deferred' ? 'Différé (Virement/Chèque)' : 'Stripe'}</p>
                                                {order.stripePaymentIntentId ? (
                                                    <p><strong className={darkMode ? 'text-stone-200' : 'text-stone-900'}>PaymentIntent:</strong> <span className="font-mono text-[11px] break-all">{order.stripePaymentIntentId}</span></p>
                                                ) : null}
                                                {order.checkoutAuthMethod ? (
                                                    <p><strong className={darkMode ? 'text-stone-200' : 'text-stone-900'}>Verification:</strong> {order.checkoutAuthMethod}</p>
                                                ) : null}
                                                {order.emailProof ? (
                                                    <p><strong className={darkMode ? 'text-stone-200' : 'text-stone-900'}>Emails:</strong> client {order.emailProof?.client?.sent ? 'envoye' : 'non confirme'} / admin {order.emailProof?.admin?.sent ? 'envoye' : 'non confirme'}</p>
                                                ) : null}
                                                <p className="text-[10px] opacity-50 mt-2 font-mono">UID: {order.userId}</p>
                                                <div className="flex flex-col gap-3 pt-6">
                                                    {orderCommandsEnabled && order.schemaVersion === 2 ? (
                                                        <>
                                                            {allowedActions(order).has('fulfillment_prepare') ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        runOrderAction(order, 'fulfillment_prepare');
                                                                    }}
                                                                    disabled={activeOrderId === order.id}
                                                                    className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 py-3.5 text-[10px] font-black uppercase tracking-widest text-stone-700 disabled:opacity-50"
                                                                >
                                                                    <Package size={16} />
                                                                    Mettre en preparation
                                                                </button>
                                                            ) : null}
                                                            {allowedActions(order).has('fulfillment_ready') ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        runOrderAction(order, 'fulfillment_ready');
                                                                    }}
                                                                    disabled={activeOrderId === order.id}
                                                                    className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 py-3.5 text-[10px] font-black uppercase tracking-widest text-stone-700 disabled:opacity-50"
                                                                >
                                                                    <CheckCircle size={16} />
                                                                    Prete au retrait
                                                                </button>
                                                            ) : null}
                                                            {allowedActions(order).has('fulfillment_ship') ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        runOrderAction(order, 'fulfillment_ship');
                                                                    }}
                                                                    disabled={activeOrderId === order.id}
                                                                    className="group flex items-center justify-center gap-2 rounded-2xl bg-stone-900 py-3.5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                                                                >
                                                                    {activeOrderId === order.id ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                                                                    Confirmer l&apos;expedition
                                                                </button>
                                                            ) : null}
                                                            {allowedActions(order).has('fulfillment_pickup') ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        runOrderAction(
                                                                            order,
                                                                            'fulfillment_pickup',
                                                                            'Confirmer le retrait physique ?'
                                                                        );
                                                                    }}
                                                                    disabled={activeOrderId === order.id}
                                                                    className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-100 bg-emerald-50 py-3.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 disabled:opacity-50"
                                                                >
                                                                    <CheckCircle size={16} />
                                                                    Confirmer le retrait
                                                                </button>
                                                            ) : null}
                                                            {allowedActions(order).has('fulfillment_deliver') ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        runOrderAction(
                                                                            order,
                                                                            'fulfillment_deliver',
                                                                            'Confirmer la livraison physique ?'
                                                                        );
                                                                    }}
                                                                    disabled={activeOrderId === order.id}
                                                                    className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-100 bg-emerald-50 py-3.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 disabled:opacity-50"
                                                                >
                                                                    <CheckCircle size={16} />
                                                                    Confirmer la livraison
                                                                </button>
                                                            ) : null}
                                                            {allowedActions(order).has('archive_order') ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        runOrderAction(
                                                                            order,
                                                                            'archive_order',
                                                                            'Archiver cette commande sans supprimer son historique ?'
                                                                        );
                                                                    }}
                                                                    disabled={activeOrderId === order.id}
                                                                    className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 py-3.5 text-[10px] font-black uppercase tracking-widest text-stone-600 disabled:opacity-50"
                                                                >
                                                                    <Package size={16} />
                                                                    Archiver
                                                                </button>
                                                            ) : null}
                                                        </>
                                                    ) : (
                                                        <p className={`rounded-2xl border px-4 py-3 text-xs ${darkMode ? 'border-white/10 text-stone-400' : 'border-stone-200 text-stone-500'}`}>
                                                            Actions commerce neutralisees. Aucun statut ni stock n&apos;est modifie depuis le navigateur.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                        </div>
                    );
                })}

                {orders.length === 0 && !isLoading && (
                    <div className={`text-center py-20 rounded-3xl border border-dashed ${darkMode ? 'bg-stone-800/50 border-stone-700' : 'bg-white border-stone-100'}`}>
                        <p className="text-stone-400 font-medium">Aucune commande pour le moment.</p>
                    </div>
                )}

                {/* Load More Button */}
                {(COMMERCE_V2_ADMIN_READERS_ENABLED ? Boolean(nextCursor) : orders.length >= orderLimit) && (
                    <button
                        onClick={() => {
                            if (COMMERCE_V2_ADMIN_READERS_ENABLED) {
                                loadMoreOrders();
                            } else {
                                setOrderLimit(prev => prev + 50);
                            }
                        }}
                        className={`group w-full py-6 rounded-3xl border-2 border-dashed transition-all duration-300 flex items-center justify-center gap-3 ${
                            darkMode 
                                ? 'border-white/5 text-white/30 hover:border-white/20 hover:text-white hover:bg-white/5 shadow-2xl shadow-black/20' 
                                : 'border-stone-100 text-stone-400 hover:border-stone-300 hover:text-stone-900 hover:bg-stone-50'
                        }`}
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Charger les commandes antérieures</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
