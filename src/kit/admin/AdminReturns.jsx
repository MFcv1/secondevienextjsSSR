import React, { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Loader2,
    Mail,
    Package,
    RefreshCw,
    RotateCcw,
    Search,
} from 'lucide-react';
import { db, functions } from '../config/firebase';

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
    if (!timestamp) return '-';
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleString('fr-FR');
    const value = new Date(timestamp);
    return Number.isNaN(value.getTime()) ? '-' : value.toLocaleString('fr-FR');
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
    return order.userEmail || order.shipping?.email || '';
}

function getItemsLabel(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) return 'Produit non renseigne';
    return items.map((item) => `${item.quantity || 1}x ${item.name || 'Article'}`).join(', ');
}

function isStripeRefundCandidate(order) {
    return Boolean(order?.stripePaymentIntentId)
        && order?.paymentMethod !== 'deferred'
        && (
            REFUNDABLE_STATUSES.has(order?.status)
            || REFUND_TRACKED_STATUSES.has(order?.status)
            || Boolean(order?.stripeRefundId)
        );
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

const AdminReturns = ({ darkMode = false }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [operation, setOperation] = useState(null);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        setLoading(true);
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
        return orders
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
    }, [orders, search]);

    const stats = useMemo(() => ({
        actionable: refundOrders.filter((order) => REFUNDABLE_STATUSES.has(order.status)).length,
        pending: refundOrders.filter((order) => order.status === 'refund_pending').length,
        refunded: refundOrders.filter((order) => order.status === 'refunded').length,
        failed: refundOrders.filter((order) => order.status === 'refund_failed').length,
    }), [refundOrders]);

    const runAction = async (orderId, action, runner) => {
        setOperation(`${action}:${orderId}`);
        setNotice(null);
        try {
            const result = await runner();
            setNotice({ type: 'success', text: result });
        } catch (error) {
            console.error(`Refund action ${action} failed:`, error);
            setNotice({ type: 'error', text: error.message || String(error) });
        } finally {
            setOperation(null);
        }
    };

    const handleRefund = async (order) => {
        const message = [
            `Initier le remboursement Stripe de la commande ${order.id} ?`,
            '',
            'Si Stripe accepte, le statut passera en remboursement et le meuble sera remis en vente automatiquement.',
            'Le client recevra son credit bancaire selon les delais de sa banque.'
        ].join('\n');
        if (!window.confirm(message)) return;

        await runAction(order.id, 'refund', async () => {
            const refundOrderAdmin = httpsCallable(functions, 'refundOrderAdmin');
            const res = await refundOrderAdmin({
                orderId: order.id,
                reason: 'Remboursement admin depuis gestion retours'
            });
            setSearch(order.id);
            return `Remboursement lance. Reference Stripe: ${res.data?.refundId || 'en attente'}.`;
        });
    };

    const handleSync = async (order) => {
        await runAction(order.id, 'sync', async () => {
            const syncRefundStatusAdmin = httpsCallable(functions, 'syncRefundStatusAdmin');
            const res = await syncRefundStatusAdmin({ orderId: order.id });
            setSearch(order.id);
            return `Stripe synchronise: ${res.data?.refundStatus || 'statut inconnu'}.`;
        });
    };

    const handleEmail = async (order) => {
        await runAction(order.id, 'email', async () => {
            const sendRefundStatusEmailAdmin = httpsCallable(functions, 'sendRefundStatusEmailAdmin');
            const res = await sendRefundStatusEmailAdmin({ orderId: order.id });
            setSearch(order.id);
            return `Email envoye a ${res.data?.to || getOrderEmail(order)}.`;
        });
    };

    const panelClass = darkMode
        ? 'border-white/10 bg-[#111111] text-white'
        : 'border-stone-200 bg-white text-stone-900';
    const mutedText = darkMode ? 'text-stone-400' : 'text-stone-500';
    const softPanel = darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/70';

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${mutedText}`}>Stripe et retours client</p>
                    <h2 className={`text-3xl font-black tracking-tighter md:text-4xl ${darkMode ? 'text-white' : 'text-stone-950'}`}>Retours & remboursements</h2>
                    <p className={`max-w-3xl text-sm leading-6 ${mutedText}`}>
                        Poste de controle pour rembourser une commande Stripe, remettre le meuble en vente, suivre le statut du refund et prevenir la cliente.
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

            <div className="grid gap-3 md:grid-cols-4">
                {[
                    ['A rembourser', stats.actionable, 'emerald'],
                    ['En attente Stripe', stats.pending, 'amber'],
                    ['Remboursees', stats.refunded, 'sky'],
                    ['A verifier', stats.failed, 'red'],
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
                        <h3 className="text-lg font-black tracking-tight">Mode d'emploi simple</h3>
                        <div className={`grid gap-3 text-sm leading-6 ${mutedText} md:grid-cols-3`}>
                            <p><b className={darkMode ? 'text-white' : 'text-stone-900'}>1. Initier</b><br />Le bouton lance un refund Stripe sur le paiement initial et demande la remise en vente du meuble.</p>
                            <p><b className={darkMode ? 'text-white' : 'text-stone-900'}>2. Synchroniser</b><br />Stripe peut laisser un refund en attente si le solde disponible est insuffisant. La synchro relit le statut Stripe.</p>
                            <p><b className={darkMode ? 'text-white' : 'text-stone-900'}>3. Informer</b><br />L'email client annonce le statut et rappelle le delai bancaire habituel de 5 a 10 jours ouvrables.</p>
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
                        <p className="text-lg font-black">Aucun retour Stripe a traiter</p>
                        <p className={`mt-2 text-sm ${mutedText}`}>Les commandes payees et les remboursements apparaitront ici.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-stone-100 dark:divide-white/10">
                        {refundOrders.map((order) => {
                            const email = getOrderEmail(order);
                            const hasRefund = Boolean(order.stripeRefundId);
                            const canRefund = REFUNDABLE_STATUSES.has(order.status) || (order.status === 'refund_failed' && !hasRefund);
                            const canEmail = Boolean(email) && (order.status === 'refund_pending' || order.status === 'refunded' || order.status === 'refund_failed');
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
                                        {canRefund ? (
                                            <button
                                                type="button"
                                                onClick={() => handleRefund(order)}
                                                disabled={Boolean(activeOperation)}
                                                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-wait disabled:opacity-60 ${darkMode ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-stone-950 text-white hover:bg-black'}`}
                                            >
                                                {activeOperation === 'refund' ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                                {order.status === 'refund_failed' ? 'Reessayer' : 'Rembourser'}
                                            </button>
                                        ) : null}
                                        {hasRefund ? (
                                            <button
                                                type="button"
                                                onClick={() => handleSync(order)}
                                                disabled={Boolean(activeOperation)}
                                                className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-wait disabled:opacity-60 ${darkMode ? 'border-white/10 text-white hover:bg-white/10' : 'border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                                            >
                                                {activeOperation === 'sync' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                                Sync Stripe
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => handleEmail(order)}
                                            disabled={!canEmail || Boolean(activeOperation)}
                                            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-45 ${darkMode ? 'border-white/10 text-white hover:bg-white/10' : 'border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                                            title={!canEmail ? 'Email disponible apres initiation du remboursement' : 'Informer le client'}
                                        >
                                            {activeOperation === 'email' ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                            Email client
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReturns;
