import { useEffect, useMemo, useState } from 'react';
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
    markReturnReceivedAdmin,
    openReturnAdmin,
    requestRefundAdmin,
    resolveReturnAdmin,
    restockReturnLinesAdmin,
    writeOffReturnLinesAdmin,
} from '../commerce/commerceCommandClient';
import {
    COMMERCE_V2_ADMIN_READERS_ENABLED,
    listOrdersAdminV2,
    listReturnsAdminV2,
} from '../commerce/commerceV2Client';
import { getAdminCachedData, loadAdminCachedData } from './adminDataCache';
import { adaptCommerceOrder } from '../commerce/orderAdapter';

const REFUNDABLE_STATUSES = new Set(['paid', 'shipped', 'completed']);
const REFUND_TRACKED_STATUSES = new Set(['refund_pending', 'refunded', 'refund_failed']);

const STATUS_COPY = {
    paid: { label: 'Payee', tone: 'emerald', icon: CheckCircle },
    shipped: { label: 'Expediee', tone: 'indigo', icon: Package },
    completed: { label: 'Livree', tone: 'emerald', icon: CheckCircle },
    refund_pending: { label: 'En attente Stripe', tone: 'amber', icon: Clock },
    refunded: { label: 'Remboursee', tone: 'sky', icon: CheckCircle },
    refund_failed: { label: 'A verifier', tone: 'red', icon: AlertTriangle },
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
    return {
        ...order,
        ...adapted,
        shipping,
        userEmail: getOrderEmail(order),
        stripePaymentIntentId: order.stripePaymentIntentId
            || order.payment?.paymentIntentId
            || null,
    };
}

function returnStatusLabel(status) {
    switch (status) {
        case 'pending': return 'Retour ouvert';
        case 'received': return 'Recu a l atelier';
        case 'resolved': return 'Retour resolu';
        case 'canceled': return 'Retour annule';
        default: return status || 'Etat inconnu';
    }
}

function returnLineSummary(returnCase) {
    return (returnCase.lines || []).map((line) => {
        const disposed = Number(line.restockedQty || 0) + Number(line.writtenOffQty || 0);
        return `${line.lineId}: ${line.requestedQty} demande, ${line.receivedQty} recu, ${disposed} traite`;
    });
}

function getStatusMeta(order) {
    return STATUS_COPY[order.status] || { label: order.status || 'A traiter', tone: 'stone', icon: Clock };
}

function StatusBadge({ order, darkMode }) {
    const meta = getStatusMeta(order);
    const Icon = meta.icon;
    const classes = toneClasses[meta.tone] || toneClasses.stone;
    return (
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${darkMode ? classes.dark : classes.light}`}>
            <Icon size={13} />
            {meta.label}
        </span>
    );
}

const AdminReturns = ({ darkMode = false, mutationsEnabled = false }) => {
    const cachedPage = getAdminCachedData('admin-returns:first-page');
    const returnCommandsEnabled = mutationsEnabled && COMMERCE_V2_ADMIN_RETURN_COMMANDS_ENABLED;
    const [orders, setOrders] = useState(cachedPage?.orders || []);
    const [returnCases, setReturnCases] = useState(cachedPage?.returns || []);
    const [ordersCursor, setOrdersCursor] = useState(null);
    const [returnsCursor, setReturnsCursor] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loading, setLoading] = useState(!cachedPage);
    const [search, setSearch] = useState('');
    const [operation, setOperation] = useState(null);
    const [notice, setNotice] = useState(null);
    const [refundDraft, setRefundDraft] = useState(null);
    const [refundAmount, setRefundAmount] = useState('');

    useEffect(() => {
        setLoading(!getAdminCachedData('admin-returns:first-page'));
        if (COMMERCE_V2_ADMIN_READERS_ENABLED) {
            let cancelled = false;
            loadAdminCachedData('admin-returns:first-page', async () => {
                const [ordersOutcome, returnsOutcome] = await Promise.allSettled([
                    listOrdersAdminV2({ pageSize: 50 }),
                    listReturnsAdminV2({ pageSize: 50 })
                ]);
                return {
                    ordersOutcome,
                    returnsOutcome,
                    orders: ordersOutcome.status === 'fulfilled'
                        ? (ordersOutcome.value.orders || []).map(normalizeAdminOrder)
                        : [],
                    returns: returnsOutcome.status === 'fulfilled'
                        ? (returnsOutcome.value.returns || [])
                        : []
                };
            }).then(({ ordersOutcome, returnsOutcome, orders: loadedOrders, returns: loadedReturns }) => {
                if (cancelled) return;
                if (ordersOutcome.status === 'fulfilled') {
                    const ordersResult = ordersOutcome.value;
                    setOrders(loadedOrders);
                    setOrdersCursor(ordersResult.nextCursor || null);
                }
                if (returnsOutcome.status === 'fulfilled') {
                    const returnsResult = returnsOutcome.value;
                    setReturnCases(loadedReturns);
                    setReturnsCursor(returnsResult.nextCursor || null);
                }
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
                } else {
                    setNotice(null);
                }
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
    }, []);

    const refundOrders = useMemo(() => {
        const needle = search.trim().toLowerCase();
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
            .filter(isStripeRefundCandidate)
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
    }, [orders, returnCases, search]);

    const loadMoreV2 = async () => {
        if (
            !COMMERCE_V2_ADMIN_READERS_ENABLED ||
            loadingMore ||
            (!ordersCursor && !returnsCursor)
        ) return;
        setLoadingMore(true);
        setNotice(null);
        try {
            const [ordersResult, returnsResult] = await Promise.all([
                ordersCursor
                    ? listOrdersAdminV2({ pageSize: 50, cursor: ordersCursor })
                    : Promise.resolve({ orders: [], nextCursor: null }),
                returnsCursor
                    ? listReturnsAdminV2({ pageSize: 50, cursor: returnsCursor })
                    : Promise.resolve({ returns: [], nextCursor: null })
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

    const stats = useMemo(() => ({
        actionable: refundOrders.filter((order) => REFUNDABLE_STATUSES.has(order.status)).length,
        pending: refundOrders.filter((order) => order.status === 'refund_pending').length,
        refunded: refundOrders.filter((order) => order.status === 'refunded').length,
        failed: refundOrders.filter((order) => order.status === 'refund_failed').length,
        returns: returnCases.length,
    }), [refundOrders, returnCases]);

    const runAction = async (orderId, action, runner) => {
        setOperation(`${action}:${orderId}`);
        setNotice(null);
        try {
            const result = await runner();
            setNotice({ type: 'success', text: result });
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
            return `Remboursement lance. Reference Stripe: ${res?.refundId || 'en attente'}.`;
        });
    };

    const handleOpenReturn = async (order) => {
        const requestedLines = [];
        for (const line of order.items || []) {
            if (!line.lineId) continue;
            const rawQuantity = window.prompt(
                `Quantite retournee pour ${line.titleSnapshot || line.name || line.lineId} (0 pour ignorer).`,
                String(line.quantity || 1)
            );
            if (rawQuantity === null) return;
            const quantity = Number(rawQuantity);
            if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > Number(line.quantity || 0)) {
                setNotice({ type: 'error', text: 'Quantite de retour invalide.' });
                return;
            }
            if (quantity > 0) requestedLines.push({ lineId: line.lineId, quantity });
        }
        if (requestedLines.length === 0) return;
        const reason = window.prompt('Motif du retour physique.');
        if (!reason) return;
        await runAction(order.id, 'return', async () => {
            const result = await openReturnAdmin(order, requestedLines, reason);
            setSearch(order.id);
            return `Dossier retour ouvert: ${result?.returnCase?.returnId || 'confirme'}.`;
        });
    };

    const collectReturnLines = (returnCase, mode) => {
        const lines = [];
        for (const line of returnCase.lines || []) {
            const maximum = mode === 'receive'
                ? line.requestedQty - line.receivedQty
                : line.receivedQty - line.restockedQty - line.writtenOffQty;
            if (maximum <= 0) continue;
            const rawQuantity = window.prompt(
                `Quantite ${mode === 'receive' ? 'recue' : 'inspectee'} pour ${line.lineId} (max ${maximum}).`,
                String(maximum)
            );
            if (rawQuantity === null) return null;
            const quantity = Number(rawQuantity);
            if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > maximum) {
                setNotice({ type: 'error', text: 'Quantite de retour invalide.' });
                return null;
            }
            if (quantity > 0) lines.push({ lineId: line.lineId, quantity });
        }
        return lines;
    };

    const handleReturnTransition = async (returnCase, action) => {
        const reason = window.prompt('Motif de cette transition de retour.');
        if (!reason) return;
        await runAction(returnCase.orderId, action, async () => {
            if (action === 'cancel_return') {
                await cancelReturnAdmin(returnCase, reason);
            } else if (action === 'resolve_return') {
                await resolveReturnAdmin(returnCase, reason);
            } else {
                const mode = action === 'receive_return' ? 'receive' : 'disposition';
                const lines = collectReturnLines(returnCase, mode);
                if (!lines?.length) return 'Aucune quantite appliquee.';
                if (action === 'receive_return') {
                    await markReturnReceivedAdmin(returnCase, lines, reason);
                } else if (action === 'restock_return') {
                    await restockReturnLinesAdmin(returnCase, lines, reason);
                } else if (action === 'write_off_return') {
                    await writeOffReturnLinesAdmin(returnCase, lines, reason);
                }
            }
            return 'Transition de retour appliquee et auditee.';
        });
    };

    const panelClass = darkMode
        ? 'border-white/10 bg-[#111111] text-white'
        : 'border-stone-200 bg-white text-stone-900';
    const mutedText = darkMode ? 'text-stone-400' : 'text-stone-500';
    const softPanel = darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/70';

    return (
        <div className="space-y-6">
            {refundDraft ? (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="refund-dialog-title"
                >
                    <form
                        onSubmit={submitRefund}
                        className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${panelClass}`}
                    >
                        <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${mutedText}`}>
                            Remboursement Stripe
                        </p>
                        <h3 id="refund-dialog-title" className="mt-2 text-2xl font-black tracking-tight">
                            Confirmer le remboursement
                        </h3>
                        <p className={`mt-3 break-all text-sm ${mutedText}`}>
                            Commande {refundDraft.order.id}
                        </p>
                        <p className={`mt-4 text-sm leading-6 ${mutedText}`}>
                            Le remboursement financier ne remet jamais seul le meuble en vente.
                            Le crédit bancaire dépend ensuite des délais de la banque du client.
                        </p>
                        <label className="mt-5 block">
                            <span className="text-xs font-black uppercase tracking-wider">
                                Montant à rembourser
                            </span>
                            <div className={`mt-2 flex items-center rounded-2xl border px-4 ${darkMode ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-stone-50'}`}>
                                <input
                                    value={refundAmount}
                                    onChange={(event) => setRefundAmount(event.target.value)}
                                    inputMode="decimal"
                                    aria-describedby="refund-amount-help"
                                    className={`min-w-0 flex-1 bg-transparent py-3 text-lg font-black outline-none ${darkMode ? 'text-white' : 'text-stone-950'}`}
                                />
                                <span className={`text-sm font-black ${mutedText}`}>EUR</span>
                            </div>
                        </label>
                        <p id="refund-amount-help" className={`mt-2 text-xs ${mutedText}`}>
                            Maximum disponible : {(refundDraft.remainingCents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} EUR
                        </p>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setRefundDraft(null)}
                                className={`rounded-2xl border px-5 py-3 text-xs font-black uppercase tracking-wider ${darkMode ? 'border-white/10 text-white' : 'border-stone-200 text-stone-700'}`}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="rounded-2xl bg-stone-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-black"
                            >
                                Rembourser {refundAmount || '0'} EUR
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${mutedText}`}>Stripe et retours client</p>
                    <h2 className={`text-3xl font-black tracking-tighter md:text-4xl ${darkMode ? 'text-white' : 'text-stone-950'}`}>Retours & remboursements</h2>
                    <p className={`max-w-3xl text-sm leading-6 ${mutedText}`}>
                        Poste de controle pour separer remboursement financier, retour physique, inspection et disposition explicite du stock.
                    </p>
                </div>
                <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${softPanel}`}>
                    <Search size={16} className={mutedText} />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Commande, cliente, produit, Stripe..."
                        className={`w-full min-w-[220px] bg-transparent text-sm font-semibold outline-none placeholder:text-stone-400 ${darkMode ? 'text-white' : 'text-stone-900'}`}
                    />
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                    ['A rembourser', stats.actionable, 'emerald'],
                    ['En attente Stripe', stats.pending, 'amber'],
                    ['Remboursees', stats.refunded, 'sky'],
                    ['A verifier', stats.failed, 'red'],
                    ['Retours physiques', stats.returns, 'stone'],
                ].map(([label, value, tone]) => {
                    const classes = toneClasses[tone];
                    return (
                        <div key={label} className={`rounded-2xl border p-4 ${darkMode ? classes.dark : classes.light}`}>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">{label}</p>
                            <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
                        </div>
                    );
                })}
            </div>

            <div className={`rounded-3xl border p-6 ${panelClass}`}>
                <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${darkMode ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>
                        <RotateCcw size={18} />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-lg font-black tracking-tight">Mode d&apos;emploi simple</h3>
                        <div className={`grid gap-3 text-sm leading-6 ${mutedText} md:grid-cols-3`}>
                            <p><b className={darkMode ? 'text-white' : 'text-stone-900'}>1. Rembourser</b><br />Le remboursement Stripe reste financier et ne remet jamais seul le meuble en vente.</p>
                            <p><b className={darkMode ? 'text-white' : 'text-stone-900'}>2. Receptionner</b><br />Le dossier de retour suit separement la reception physique et les quantites reellement recues.</p>
                            <p><b className={darkMode ? 'text-white' : 'text-stone-900'}>3. Inspecter</b><br />Apres controle, chaque ligne est remise en stock ou sortie du stock, puis le dossier est resolu.</p>
                        </div>
                        <p className={`text-xs leading-5 ${mutedText}`}>
                            Note comptable: Stripe rembourse le client depuis le solde Stripe disponible. Les frais de paiement initiaux ne sont generalement pas restitues au marchand.
                        </p>
                    </div>
                </div>
            </div>

            {notice ? (
                <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                    notice.type === 'success'
                        ? (darkMode ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-100 bg-emerald-50 text-emerald-700')
                        : (darkMode ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-red-100 bg-red-50 text-red-700')
                }`}>
                    {notice.text}
                </div>
            ) : null}

            <div className={`overflow-hidden rounded-3xl border ${panelClass}`}>
                <div className={`grid grid-cols-12 gap-4 border-b px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] ${darkMode ? 'border-white/10 text-stone-500' : 'border-stone-100 text-stone-400'}`}>
                    <div className="col-span-5">Commande</div>
                    <div className="col-span-2 hidden md:block">Montant</div>
                    <div className="col-span-3 hidden lg:block">Stripe</div>
                    <div className="col-span-7 md:col-span-5 lg:col-span-2">Actions</div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-3 p-12">
                        <Loader2 className="animate-spin" size={20} />
                        <span className={`text-sm font-bold ${mutedText}`}>Chargement des retours...</span>
                    </div>
                ) : refundOrders.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-lg font-black">Aucune commande remboursable ni retour physique</p>
                        <p className={`mt-2 text-sm ${mutedText}`}>Les commandes payees, remboursements et dossiers de retour apparaitront ici.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-stone-100 dark:divide-white/10">
                        {refundOrders.map((order) => {
                            const email = getOrderEmail(order);
                            const allowedActions = new Set(
                                Array.isArray(order.allowedActions) ? order.allowedActions : []
                            );
                            const canRefund = allowedActions.has('request_refund');
                            const canOpenReturn = allowedActions.has('open_return');
                            const activeOperation = operation?.endsWith(`:${order.id}`) ? operation.split(':')[0] : null;
                            return (
                                <div key={order.id} className={`grid grid-cols-12 gap-4 px-5 py-5 ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-stone-50/70'}`}>
                                    <div className="col-span-12 space-y-3 md:col-span-5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusBadge order={order} darkMode={darkMode} />
                                            {order.stockRestoredAfterRefund ? (
                                                <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
                                                    Stock remis
                                                </span>
                                            ) : null}
                                        </div>
                                        <div>
                                            <p className="font-black tracking-tight">{order.shipping?.fullName || 'Client inconnu'}</p>
                                            <p className={`text-xs ${mutedText}`}>{email || 'Email absent'} - {formatDate(order.createdAt)}</p>
                                            <p className={`mt-2 text-sm font-semibold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{getItemsLabel(order)}</p>
                                        </div>
                                        <p className={`font-mono text-[11px] ${mutedText}`}>#{order.id}</p>
                                    </div>

                                    <div className="col-span-6 md:col-span-2">
                                        <p className="text-sm font-black">{formatAmount(order)}</p>
                                        <p className={`mt-1 text-[11px] ${mutedText}`}>Commande: {Number(order.total || 0).toLocaleString('fr-FR')} EUR</p>
                                    </div>

                                    <div className="col-span-12 space-y-1 lg:col-span-3">
                                        <p className={`break-all font-mono text-[11px] ${mutedText}`}>PI: {order.stripePaymentIntentId || '-'}</p>
                                        <p className={`break-all font-mono text-[11px] ${mutedText}`}>Refund: {order.stripeRefundId || '-'}</p>
                                        <p className={`text-[11px] ${mutedText}`}>Derniere synchro: {formatDate(order.refundUpdatedAt)}</p>
                                        {order.refundFailureReason ? (
                                            <p className="text-[11px] font-bold text-red-500">Erreur: {order.refundFailureReason}</p>
                                        ) : null}
                                    </div>

                                    <div className="col-span-12 flex flex-col gap-2 md:col-span-5 lg:col-span-2">
                                        {returnCommandsEnabled && order.schemaVersion === 2 ? (
                                            <>
                                                {canRefund ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openRefundDialog(order)}
                                                        disabled={Boolean(activeOperation)}
                                                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-wait disabled:opacity-60 ${darkMode ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-stone-950 text-white hover:bg-black'}`}
                                                    >
                                                        {activeOperation === 'refund' ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                                        Rembourser
                                                    </button>
                                                ) : null}
                                                {canOpenReturn ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenReturn(order)}
                                                        disabled={Boolean(activeOperation)}
                                                        className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-wait disabled:opacity-60 ${darkMode ? 'border-white/10 text-white hover:bg-white/10' : 'border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                                                    >
                                                        {activeOperation === 'return' ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                                                        Ouvrir un retour
                                                    </button>
                                                ) : null}
                                            </>
                                        ) : (
                                            <p className={`rounded-2xl border px-3 py-3 text-[11px] ${darkMode ? 'border-white/10 text-stone-400' : 'border-stone-200 text-stone-500'}`}>
                                                Consultation active. Les actions restent protegees par le mode administrateur.
                                            </p>
                                        )}
                                    </div>
                                    {Array.isArray(order.returnCases) && order.returnCases.length > 0 ? (
                                        <div className={`col-span-12 space-y-3 rounded-2xl border p-4 ${softPanel}`}>
                                            <p className="text-[10px] font-black uppercase tracking-widest">Dossiers de retour physique</p>
                                            {order.returnCases.map((returnCase) => (
                                                <div key={returnCase.returnId} className={`rounded-xl border p-3 ${darkMode ? 'border-white/10' : 'border-stone-200 bg-white'}`}>
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="font-mono text-[11px]">#{returnCase.returnId}</span>
                                                        <span className="text-xs font-bold">{returnStatusLabel(returnCase.status)}</span>
                                                    </div>
                                                    <p className={`mt-2 text-[11px] ${mutedText}`}>
                                                        Mis a jour le {formatDate(returnCase.updatedAt)}
                                                        {returnCase.reason ? ` · ${returnCase.reason}` : ''}
                                                    </p>
                                                    <div className={`mt-3 space-y-1 rounded-lg p-3 text-[11px] ${darkMode ? 'bg-black/20 text-stone-300' : 'bg-stone-50 text-stone-600'}`}>
                                                        {returnLineSummary(returnCase).map((summary) => (
                                                            <p key={summary}>{summary}</p>
                                                        ))}
                                                    </div>
                                                    {returnCommandsEnabled && (returnCase.allowedActions || []).length > 0 ? (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {(returnCase.allowedActions || []).map((action) => (
                                                            <button
                                                                key={action}
                                                                type="button"
                                                                onClick={() => handleReturnTransition(returnCase, action)}
                                                                disabled={Boolean(activeOperation)}
                                                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-wider disabled:opacity-50 ${darkMode ? 'border-white/10 text-white' : 'border-stone-200 text-stone-700'}`}
                                                            >
                                                                {action === 'receive_return' ? 'Receptionner' :
                                                                    action === 'restock_return' ? 'Remettre en stock' :
                                                                    action === 'write_off_return' ? 'Sortir du stock' :
                                                                    action === 'resolve_return' ? 'Resoudre' :
                                                                    'Annuler le retour'}
                                                            </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className={`mt-3 text-[11px] ${mutedText}`}>
                                                            Consultation uniquement.
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
                {COMMERCE_V2_ADMIN_READERS_ENABLED && (ordersCursor || returnsCursor) ? (
                    <div className={`border-t p-4 text-center ${darkMode ? 'border-white/10' : 'border-stone-100'}`}>
                        <button
                            type="button"
                            onClick={loadMoreV2}
                            disabled={loadingMore}
                            className={`rounded-full border px-5 py-2.5 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 ${darkMode ? 'border-white/10 text-white' : 'border-stone-200 text-stone-700'}`}
                        >
                            {loadingMore ? 'Chargement...' : 'Charger la suite'}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default AdminReturns;
