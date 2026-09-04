'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChevronDown, Download, Loader2, Search } from 'lucide-react';
import { downloadCsv } from './exportCsv';
import {
    archiveOrderAdmin,
    COMMERCE_V2_ADMIN_ORDER_COMMANDS_ENABLED,
    markOrderDeliveredAdmin,
    markOrderPickedUpAdmin,
    markOrderPreparingAdmin,
    markOrderReadyForPickupAdmin,
    markOrderShippedAdmin,
    updateOrderTrackingAdmin,
} from '../commerce/commerceCommandClient';
import {
    COMMERCE_V2_ADMIN_READERS_ENABLED,
    getOrderTimelineAdminV2,
    listOrdersAdminV2,
} from '../commerce/commerceV2Client';
import { getAdminCachedData } from './adminDataCache';
import {
    ADMIN_ORDERS_FIRST_PAGE_KEY,
    loadAdminOrdersFirstPage,
} from './adminCommerceData';
import ConfirmDialog from './components/orders/ConfirmDialog';
import OrderDetailPanel from './components/orders/OrderDetailPanel';
import OrderModalShell from './components/orders/OrderModalShell';
import OrderRow from './components/orders/OrderRow';
import OrdersOverviewPanel from './components/orders/OrdersOverviewPanel';
import ShipmentDialog from './components/orders/ShipmentDialog';
import {
    ORDER_SEGMENTS,
    buildActionPlan,
    buildCsvRows,
    buildFallbackTimeline,
    buildOrdersSummary,
    filterOrders,
    getAllowedActions,
    normalizeAdminOrders,
} from './components/orders/orderPresentation';
import { mutedTextClass, surfaceClass } from './components/orders/orderTones';

const WIDE_VIEWPORT = '(min-width: 1280px)';

export const preloadAdminOrdersWorkspace = () => loadAdminOrdersFirstPage();

/** Le detail vit en colonne sur grand ecran, en feuille en dessous. */
const useWideViewport = () => {
    const [isWide, setIsWide] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return undefined;
        const media = window.matchMedia(WIDE_VIEWPORT);
        const sync = () => setIsWide(media.matches);
        sync();
        media.addEventListener('change', sync);
        return () => media.removeEventListener('change', sync);
    }, []);
    return isWide;
};

const AdminOrders = ({ darkMode = false, focusOrderId = null, mutationsEnabled = false }) => {
    const cachedPage = getAdminCachedData(ADMIN_ORDERS_FIRST_PAGE_KEY);
    const orderCommandsEnabled = mutationsEnabled && COMMERCE_V2_ADMIN_ORDER_COMMANDS_ENABLED;
    const isWide = useWideViewport();

    const [orders, setOrders] = useState(() => normalizeAdminOrders(cachedPage?.orders || []));
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [segment, setSegment] = useState('all');
    const [search, setSearch] = useState('');
    const [orderLimit, setOrderLimit] = useState(50);
    const [isLoading, setIsLoading] = useState(!cachedPage);
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [nextCursor, setNextCursor] = useState(null);
    const [orderTimelines, setOrderTimelines] = useState({});
    const [timelineLoadingId, setTimelineLoadingId] = useState(null);
    const [shipmentDialog, setShipmentDialog] = useState(null);
    const [shipmentError, setShipmentError] = useState('');
    const [confirmRequest, setConfirmRequest] = useState(null);
    const [actionError, setActionError] = useState('');
    const listRef = useRef(null);

    useEffect(() => {
        setIsLoading(!getAdminCachedData(ADMIN_ORDERS_FIRST_PAGE_KEY));
        if (COMMERCE_V2_ADMIN_READERS_ENABLED) {
            let cancelled = false;
            loadAdminOrdersFirstPage()
                .then((result) => {
                    if (cancelled) return;
                    setOrders(normalizeAdminOrders(result.orders || []));
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
            setOrders(normalizeAdminOrders(snap.docs.map((document) => ({ id: document.id, ...document.data() }))));
            setIsLoading(false);
        });
        return () => unsub();
    }, [orderLimit]);

    const loadOrderTimeline = useCallback(async (order) => {
        if (orderTimelines[order.id] || timelineLoadingId === order.id) return;
        setTimelineLoadingId(order.id);
        try {
            const result = await getOrderTimelineAdminV2(order.id);
            setOrderTimelines((current) => ({ ...current, [order.id]: result.timeline || [] }));
        } catch (error) {
            console.error('Admin order timeline read failed:', error);
            setOrderTimelines((current) => ({ ...current, [order.id]: buildFallbackTimeline(order) }));
        } finally {
            setTimelineLoadingId(null);
        }
    }, [orderTimelines, timelineLoadingId]);

    const selectOrder = useCallback((order) => {
        setSelectedOrderId(order.id);
        setActionError('');
        loadOrderTimeline(order);
    }, [loadOrderTimeline]);

    // Arrivee depuis une notification : la commande visee s'ouvre d'elle-meme.
    useEffect(() => {
        if (!focusOrderId || selectedOrderId) return;
        const target = orders.find((order) => order.id === focusOrderId);
        if (target) selectOrder(target);
    }, [focusOrderId, orders, selectOrder, selectedOrderId]);

    const summary = useMemo(() => buildOrdersSummary(orders), [orders]);
    const visibleOrders = useMemo(
        () => filterOrders(orders, { segment, search }),
        [orders, search, segment]
    );
    const selectedOrder = useMemo(
        () => orders.find((order) => order.id === selectedOrderId) || null,
        [orders, selectedOrderId]
    );
    const actionPlan = useMemo(
        () => (selectedOrder ? buildActionPlan(selectedOrder, { enabled: orderCommandsEnabled }) : { primary: null, secondary: [] }),
        [orderCommandsEnabled, selectedOrder]
    );

    const loadMoreOrders = async () => {
        if (!COMMERCE_V2_ADMIN_READERS_ENABLED || !nextCursor || isLoading) return;
        setIsLoading(true);
        try {
            const result = await listOrdersAdminV2({ pageSize: 50, cursor: nextCursor });
            setOrders((current) => [...current, ...normalizeAdminOrders(result.orders || [])]);
            setNextCursor(result.nextCursor || null);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshOrder = async (order) => {
        const result = await loadAdminOrdersFirstPage({ force: true });
        setOrders(normalizeAdminOrders(result.orders || []));
        setNextCursor(result.nextCursor || null);
        const timeline = await getOrderTimelineAdminV2(order.id);
        setOrderTimelines((current) => ({ ...current, [order.id]: timeline.timeline || [] }));
    };

    const applyOrderCommand = (order, actionId) => {
        switch (actionId) {
            case 'fulfillment_prepare': return markOrderPreparingAdmin(order);
            case 'fulfillment_ready': return markOrderReadyForPickupAdmin(order);
            case 'fulfillment_pickup': return markOrderPickedUpAdmin(order);
            case 'fulfillment_deliver': return markOrderDeliveredAdmin(order);
            case 'archive_order': return archiveOrderAdmin(order);
            default: return Promise.reject(new Error('COMMERCE_ACTION_UNSUPPORTED'));
        }
    };

    const runOrderAction = async (order, actionId) => {
        if (!orderCommandsEnabled) return;
        if (!getAllowedActions(order).has(actionId)) return;
        let commandApplied = false;
        try {
            setActionError('');
            setActiveOrderId(order.id);
            await applyOrderCommand(order, actionId);
            commandApplied = true;
            await refreshOrder(order);
            setConfirmRequest(null);
        } catch (error) {
            console.error('Order command failed:', error);
            setActionError(commandApplied
                ? 'Commande appliquée, mais l’actualisation a échoué. Rechargez la page avant toute nouvelle action.'
                : `Commande non appliquée : ${error.message || error}`);
            setConfirmRequest(null);
        } finally {
            setActiveOrderId(null);
        }
    };

    const runShipmentAction = async (shipment) => {
        const dialog = shipmentDialog;
        if (!dialog || activeOrderId === dialog.order.id) return;
        let commandApplied = false;
        try {
            setShipmentError('');
            setActiveOrderId(dialog.order.id);
            if (dialog.mode === 'update') {
                await updateOrderTrackingAdmin(dialog.order, shipment);
            } else {
                await markOrderShippedAdmin(dialog.order, shipment);
            }
            commandApplied = true;
            await refreshOrder(dialog.order);
            setShipmentDialog(null);
        } catch (error) {
            console.error('Shipment command failed:', error);
            setShipmentError(commandApplied
                ? 'La commande a été appliquée, mais l’actualisation a échoué. Fermez puis actualisez avant toute nouvelle action.'
                : `La commande n’a pas été appliquée : ${error.message || error}`);
        } finally {
            setActiveOrderId(null);
        }
    };

    const handleAction = (action) => {
        if (!selectedOrder) return;
        if (action.id === 'fulfillment_ship' || action.id === 'fulfillment_update_tracking') {
            setShipmentError('');
            setShipmentDialog({ order: selectedOrder, mode: action.id === 'fulfillment_ship' ? 'ship' : 'update' });
            return;
        }
        if (action.confirm) {
            setConfirmRequest({ order: selectedOrder, action });
            return;
        }
        runOrderAction(selectedOrder, action.id);
    };

    // Navigation clavier dans la liste, comme dans une boite de reception.
    const handleListKeyDown = (event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const index = visibleOrders.findIndex((order) => order.id === selectedOrderId);
        const nextIndex = event.key === 'ArrowDown'
            ? Math.min(visibleOrders.length - 1, index + 1)
            : Math.max(0, index <= 0 ? 0 : index - 1);
        const target = visibleOrders[nextIndex];
        if (!target) return;
        selectOrder(target);
        listRef.current?.querySelectorAll('[data-order-row]')[nextIndex]?.focus();
    };

    const exportToCsv = () => {
        const scope = segment === 'all' && !search.trim() ? 'Commandes_chargees' : 'Commandes_filtrees';
        downloadCsv(buildCsvRows(visibleOrders), scope);
    };

    const detailProps = selectedOrder ? {
        actionError,
        actionPlan,
        busy: activeOrderId === selectedOrder.id,
        commandsEnabled: orderCommandsEnabled,
        darkMode,
        onAction: handleAction,
        order: selectedOrder,
        timeline: orderTimelines[selectedOrder.id],
        timelineLoading: timelineLoadingId === selectedOrder.id,
    } : null;

    const segmentCounts = { ...summary, all: summary.total };
    const hasMoreOrders = COMMERCE_V2_ADMIN_READERS_ENABLED
        ? Boolean(nextCursor)
        : orders.length >= orderLimit;

    return (
        <section className="flex min-h-0 w-full max-w-full flex-col xl:h-full" aria-label="Ventes">
            <div className="mb-5 flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 items-center gap-2.5">
                    <label className="relative min-w-0 flex-1 lg:max-w-[340px]">
                        <span className="sr-only">Rechercher dans les commandes chargées</span>
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} strokeWidth={1.5} />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Rechercher dans les commandes chargées…"
                            className={`w-full rounded-[14px] border-none py-3 pl-10 pr-4 text-[12px] font-semibold outline-none ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:ring-2 ${darkMode ? 'bg-black/20 text-white ring-white/10 placeholder:text-stone-700 focus:ring-white/25' : 'bg-white text-stone-950 ring-black/[0.055] placeholder:text-stone-400 focus:ring-stone-300'}`}
                        />
                    </label>
                    <button
                        type="button"
                        onClick={exportToCsv}
                        disabled={visibleOrders.length === 0}
                        aria-label={`Exporter ${visibleOrders.length} commande${visibleOrders.length !== 1 ? 's' : ''} au format CSV`}
                        className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[11px] font-extrabold ring-1 transition-colors duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 ${darkMode ? 'text-stone-300 ring-white/12 hover:bg-white/[0.07] hover:text-white' : 'bg-white text-stone-600 ring-black/[0.07] hover:text-stone-950'}`}
                    >
                        <Download size={14} strokeWidth={1.8} />
                        <span className="hidden sm:inline">Exporter {visibleOrders.length}</span>
                    </button>
                </div>

                <div className={`inline-flex w-full rounded-[20px] p-1.5 lg:w-auto ${darkMode ? 'bg-white/[0.055]' : 'bg-stone-200/65'}`} role="group" aria-label="Filtrer les commandes">
                    {ORDER_SEGMENTS.map(({ id, label }) => {
                        const active = segment === id;
                        const count = segmentCounts[id] || 0;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setSegment(id)}
                                aria-pressed={active}
                                className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[15px] px-3 text-[11.5px] font-extrabold transition-colors duration-200 active:scale-[0.99] lg:flex-none ${active ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white') : (darkMode ? 'text-stone-500 hover:text-white' : 'text-stone-500 hover:text-stone-950')}`}
                            >
                                {label}
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                                    id === 'todo' && count > 0 && !active
                                        ? 'bg-amber-500/15 text-amber-600'
                                        : active
                                            ? (darkMode ? 'bg-stone-950/10 text-stone-600' : 'bg-white/15 text-white/70')
                                            : (darkMode ? 'text-stone-600' : 'text-stone-400')
                                }`}>
                                    {isLoading && orders.length === 0 ? '…' : count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className={`mb-3 -mt-2 shrink-0 text-[10.5px] leading-4 ${mutedTextClass(darkMode)}`} aria-live="polite">
                {orders.length} commande{orders.length !== 1 ? 's' : ''} chargée{orders.length !== 1 ? 's' : ''}
                {hasMoreOrders ? ' sur un historique plus large' : ''}. Recherche, compteurs et export portent sur ce périmètre.
            </p>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(390px,33%)] 2xl:gap-6">
                <div className={`min-h-0 overflow-hidden rounded-[26px] border ${surfaceClass(darkMode)}`}>
                    <div className="flex h-full min-h-[520px] flex-col p-4 sm:p-5 xl:min-h-0 xl:p-5 2xl:p-6">
                        <div className={`hidden shrink-0 grid-cols-[minmax(180px,2fr)_1.25fr_1.5fr_.75fr_.9fr] gap-2 px-2.5 pb-2 text-[10px] font-extrabold uppercase tracking-[0.1em] lg:grid ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                            <span>Commande</span>
                            <span>Panier</span>
                            <span>État</span>
                            <span>Date</span>
                            <span className="text-right">Total</span>
                        </div>

                        <div
                            ref={listRef}
                            data-native-scroll-region="true"
                            role="region"
                            aria-label="Liste des commandes chargées"
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 custom-scrollbar"
                        >
                            {isLoading && orders.length === 0 ? (
                                <div className="space-y-2 px-1 py-1" aria-busy="true" aria-label="Chargement des commandes">
                                    {Array.from({ length: 8 }, (_, index) => (
                                        <div
                                            key={index}
                                            className={`h-12 animate-pulse rounded-[14px] ${darkMode ? 'bg-white/[0.035]' : 'bg-stone-950/[0.03]'}`}
                                        />
                                    ))}
                                </div>
                            ) : visibleOrders.length === 0 ? (
                                <div className={`grid h-full min-h-48 place-items-center rounded-[16px] text-center ring-1 ${darkMode ? 'text-stone-600 ring-white/10' : 'text-stone-400 ring-black/[0.05]'}`}>
                                    <div>
                                        <p className="text-[13px] font-bold">
                                            {orders.length === 0 ? 'Aucune commande pour le moment.' : 'Aucune commande dans ce filtre.'}
                                        </p>
                                        {orders.length > 0 && (search || segment !== 'all') ? (
                                            <button
                                                type="button"
                                                onClick={() => { setSearch(''); setSegment('all'); }}
                                                className="mt-2 text-[10px] font-bold text-emerald-600"
                                            >
                                                Réinitialiser
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ) : (
                                <ul className={`divide-y ${darkMode ? 'divide-white/[0.06]' : 'divide-black/[0.05]'}`}>
                                    {visibleOrders.map((order) => (
                                        <OrderRow
                                            key={order.id}
                                            darkMode={darkMode}
                                            onKeyDown={handleListKeyDown}
                                            onSelect={selectOrder}
                                            order={order}
                                            selected={order.id === selectedOrderId}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>

                        {hasMoreOrders ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (COMMERCE_V2_ADMIN_READERS_ENABLED) {
                                        loadMoreOrders();
                                    } else {
                                        setOrderLimit((previous) => previous + 50);
                                    }
                                }}
                                className={`mt-2 flex shrink-0 items-center justify-center gap-2 rounded-full py-2.5 text-[10px] font-extrabold ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${darkMode ? 'text-stone-400 ring-white/10 hover:bg-white/5' : 'text-stone-500 ring-black/[0.06] hover:bg-stone-50'}`}
                            >
                                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} strokeWidth={1.8} />}
                                Charger les commandes antérieures
                            </button>
                        ) : null}
                    </div>
                </div>

                <aside className={`hidden min-h-0 overflow-hidden rounded-[26px] border xl:block ${surfaceClass(darkMode)}`}>
                    {isWide && detailProps ? (
                        <div key={selectedOrder.id} className="sales-detail h-full">
                            <OrderDetailPanel {...detailProps} />
                        </div>
                    ) : (
                        <OrdersOverviewPanel
                            darkMode={darkMode}
                            onSelectSegment={setSegment}
                            segment={segment}
                            summary={summary}
                        />
                    )}
                </aside>
            </div>

            {!isWide && detailProps ? (
                <OrderModalShell
                    darkMode={darkMode}
                    variant="sheet"
                    locked={activeOrderId === selectedOrder.id}
                    onClose={() => setSelectedOrderId(null)}
                >
                    <OrderDetailPanel {...detailProps} variant="sheet" onClose={() => setSelectedOrderId(null)} />
                </OrderModalShell>
            ) : null}

            {shipmentDialog ? (
                <ShipmentDialog
                    key={`${shipmentDialog.order.id}-${shipmentDialog.mode}`}
                    darkMode={darkMode}
                    mode={shipmentDialog.mode}
                    order={shipmentDialog.order}
                    pending={activeOrderId === shipmentDialog.order.id}
                    error={shipmentError}
                    onClose={() => {
                        if (activeOrderId === shipmentDialog.order.id) return;
                        setShipmentDialog(null);
                        setShipmentError('');
                    }}
                    onSubmit={runShipmentAction}
                />
            ) : null}

            {confirmRequest ? (
                <ConfirmDialog
                    darkMode={darkMode}
                    confirm={confirmRequest.action.confirm}
                    icon={confirmRequest.action.icon}
                    order={confirmRequest.order}
                    pending={activeOrderId === confirmRequest.order.id}
                    onCancel={() => setConfirmRequest(null)}
                    onConfirm={() => runOrderAction(confirmRequest.order, confirmRequest.action.id)}
                />
            ) : null}

            <p className={`mt-3 shrink-0 text-[10.5px] leading-4 xl:hidden ${mutedTextClass(darkMode)}`}>
                Touchez une commande pour ouvrir son parcours et l’action attendue.
            </p>
        </section>
    );
};

export default AdminOrders;
