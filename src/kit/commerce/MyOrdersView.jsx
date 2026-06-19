import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    FileText,
    Headphones,
    Heart,
    Loader2,
    LogOut,
    MapPin,
    MessageCircle,
    Package,
    ShoppingBag,
    Star,
    Truck,
    UserRound,
    WalletCards,
    XCircle,
} from 'lucide-react';
import { db, functions } from '../config/firebase';
import KIT_CONFIG from '../config/constants';

const BUSINESS_PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '';
const BUSINESS_PHONE_TEL = BUSINESS_PHONE.replace(/\s/g, '');
const CONTACT_NAME = process.env.NEXT_PUBLIC_CONTACT_NAME || KIT_CONFIG.brandName;
const REVIEW_URL = process.env.NEXT_PUBLIC_REVIEW_URL || '';

const FALLBACK_ITEM_IMAGES = [
    '/images/before-after/apresu.webp',
    '/images/before-after/apres.webp',
    '/images/before-after/apresx.webp',
    '/images/before-after/avantu.webp',
];

const formatPrice = (price = 0) => (
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(price) || 0)
);

const formatDate = (seconds) => {
    if (!seconds) return 'Date en attente';
    return new Date(seconds * 1000).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const getOrderTotal = (order) => {
    if (typeof order?.total === 'number') return order.total;
    return (order?.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
};

const getRefundAmount = (order) => {
    const amount = Number(order?.refundAmount);
    if (Number.isFinite(amount) && amount > 0) return amount / 100;
    return getOrderTotal(order);
};

const getItemImage = (item) => (
    Array.isArray(item?.images) ? item.images[0] :
    Array.isArray(item?.image) ? item.image[0] :
    item?.image || item?.imageUrl || item?.mainImage || FALLBACK_ITEM_IMAGES[0]
);

const getOrderImage = (order, index = 0) => (
    getItemImage(order?.items?.[0]) || FALLBACK_ITEM_IMAGES[index % FALLBACK_ITEM_IMAGES.length]
);

const getOrderNumber = (order) => {
    const id = order?.orderNumber || order?.id || '';
    return `CMD-${String(id).slice(0, 10).toUpperCase()}`;
};

const getOrderItemsSummary = (order) => (
    (order?.items || [])
        .map((item) => item?.name)
        .filter(Boolean)
        .join(', ')
);

const getStatusInfo = (status = '') => {
    switch (status) {
        case 'completed':
            return { label: 'Livree', tone: 'border-[#d8ded8] bg-[#f7faf7] text-[#2f5d46]', dot: 'bg-[#2f5d46]', icon: CheckCircle };
        case 'shipped':
            return { label: 'Expediee', tone: 'border-[#dce4ee] bg-[#f6f9fc] text-[#31527a]', dot: 'bg-[#31527a]', icon: Truck };
        case 'cancelled_by_client':
        case 'cancelled':
        case 'canceled':
            return { label: 'Annulee', tone: 'border-[#f0d7d7] bg-[#fff7f7] text-[#9f3434]', dot: 'bg-[#9f3434]', icon: XCircle };
        case 'payment_failed':
            return { label: 'Paiement echoue', tone: 'border-[#f0d7d7] bg-[#fff7f7] text-[#9f3434]', dot: 'bg-[#9f3434]', icon: XCircle };
        case 'refund_pending':
            return { label: 'Remboursement en cours', tone: 'border-[#eadfbf] bg-[#fffaf0] text-[#8a5a13]', dot: 'bg-[#b7791f]', icon: WalletCards };
        case 'refunded':
            return { label: 'Remboursee', tone: 'border-[#d8e6f5] bg-[#f5faff] text-[#175c9c]', dot: 'bg-[#0071e3]', icon: CheckCircle };
        case 'refund_failed':
            return { label: 'Remboursement a verifier', tone: 'border-[#f0d7d7] bg-[#fff7f7] text-[#9f3434]', dot: 'bg-[#9f3434]', icon: AlertTriangle };
        case 'paid':
            return { label: 'Payee', tone: 'border-[#d8ded8] bg-[#f7faf7] text-[#2f5d46]', dot: 'bg-[#2f5d46]', icon: CheckCircle };
        default:
            return { label: 'Preparee', tone: 'border-[#e3e3e8] bg-[#fbfbfd] text-[#4f4f55]', dot: 'bg-[#707070]', icon: Package };
    }
};

const canCancel = (order) => {
    const status = order?.status || '';
    const isPaidStripeOrder = status === 'paid' || Boolean(order?.paidAt) || (
        Boolean(order?.stripePaymentIntentId)
        && order?.paymentMethod !== 'deferred'
        && status !== 'pending_payment'
    );
    if (isPaidStripeOrder) return false;
    if (status === 'shipped' || status === 'completed' || status === 'canceled' || status === 'payment_failed' || status.includes('cancelled')) return false;
    if (!order?.createdAt?.seconds) return false;
    const orderDate = new Date(order.createdAt.seconds * 1000);
    const diffDays = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
};

const getRefundHelpText = (status = '') => {
    if (status === 'refund_pending') {
        return 'Le remboursement a ete initie par l atelier. Stripe indique un credit visible sous environ 5 a 10 jours ouvrables selon votre banque.';
    }
    if (status === 'refunded') {
        return 'Le remboursement a ete confirme. Selon votre banque, le credit peut apparaitre sous quelques jours ouvrables.';
    }
    if (status === 'refund_failed') {
        return 'Le remboursement doit etre verifie par l atelier. Contactez-nous si vous n avez pas deja ete recontacte.';
    }
    return '';
};

const MetricButton = ({ icon: Icon, value, label, action, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="group grid min-h-[116px] min-w-0 content-between rounded-[8px] border border-[#e8e8ed] bg-white px-4 py-4 text-left transition-colors duration-200 hover:border-[#c9c9d1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] md:px-5"
    >
        <span className="flex items-center justify-between gap-3 text-[#707070]">
            <Icon size={19} strokeWidth={1.55} />
            <ArrowRight size={15} strokeWidth={1.7} className="opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span>
            <strong className="block text-[30px] font-semibold leading-none tracking-normal text-[#1d1d1f]">{value}</strong>
            <span className="mt-2 block text-[12px] font-medium leading-5 text-[#6e6e73]">{label}</span>
            <span className="mt-1 block text-[12px] text-[#86868b]">{action}</span>
        </span>
    </button>
);

const AccountPanel = ({ children, className = '', sectionRef }) => (
    <section
        ref={sectionRef}
        className={`rounded-[8px] border border-[#e8e8ed] bg-white ${className}`}
    >
        {children}
    </section>
);

const SectionHeader = ({ eyebrow, title, children, action }) => (
    <div className="mb-6 flex flex-col gap-4 border-b border-[#e8e8ed] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
            {eyebrow ? <p className="text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-[#86868b]">{eyebrow}</p> : null}
            <h2 className="mt-2 text-[24px] font-semibold leading-tight tracking-normal text-[#1d1d1f] md:text-[30px]">{title}</h2>
            {children ? <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6e6e73]">{children}</p> : null}
        </div>
        {action}
    </div>
);

const StatusBadge = ({ status }) => {
    const Icon = status.icon;
    return (
        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium leading-none ${status.tone}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            <Icon size={13} strokeWidth={1.8} />
            {status.label}
        </span>
    );
};

const MyOrdersView = ({
    user,
    onBack,
    darkMode,
    wishlistItems = [],
    items = [],
    onOpenWishlist,
    onLogout,
}) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingInvoice, setDownloadingInvoice] = useState(null);
    const [showCancelSuccess, setShowCancelSuccess] = useState(false);
    const [showContactPopup, setShowContactPopup] = useState(false);
    const [orderToCancelId, setOrderToCancelId] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const topRef = useRef(null);
    const ordersRef = useRef(null);
    const wishlistRef = useRef(null);
    const infoRef = useRef(null);
    const addressesRef = useRef(null);
    const invoicesRef = useRef(null);
    const helpRef = useRef(null);

    const customerName = user?.displayName || user?.email?.split('@')?.[0] || 'Client';
    const createdAt = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Inscription recente';

    const enrichedWishlist = useMemo(() => (
        wishlistItems.map(wishlistItem => {
            const live = items.find(item => item.id === wishlistItem.originalId || item.id === wishlistItem.id);
            return live || { id: wishlistItem.originalId || wishlistItem.id, ...wishlistItem, images: [wishlistItem.image] };
        })
    ), [items, wishlistItems]);

    const wishlistPreview = useMemo(() => {
        if (enrichedWishlist.length > 0) return enrichedWishlist.slice(0, 4);
        return (items || [])
            .filter(item => item.status === 'published')
            .slice(0, 4)
            .map((item, index) => ({ ...item, images: item.images?.length ? item.images : [FALLBACK_ITEM_IMAGES[index % FALLBACK_ITEM_IMAGES.length]] }));
    }, [enrichedWishlist, items]);

    const latestOrder = orders[0];
    const latestShipping = latestOrder?.shipping || {};
    const hasShippingAddress = Boolean(
        latestShipping.address || latestShipping.street || latestShipping.city || latestShipping.zip || latestShipping.postalCode
    );
    const addressLines = hasShippingAddress
        ? [
            latestShipping.name || customerName,
            latestShipping.address || latestShipping.street,
            [latestShipping.zip || latestShipping.postalCode, latestShipping.city].filter(Boolean).join(' '),
            latestShipping.country || 'France',
            latestShipping.phone || user?.phoneNumber,
        ].filter(Boolean)
        : [];

    const invoiceRows = orders.slice(0, 4);
    const recentOrders = orders.slice(0, 6);
    const addressCount = addressLines.length > 1 ? 1 : 0;
    const refundedTotal = orders.reduce((sum, order) => (
        getRefundHelpText(order.status) ? sum + getRefundAmount(order) : sum
    ), 0);

    const handleDownloadInvoice = async (order) => {
        setDownloadingInvoice(order.id);
        try {
            const { generateInvoice } = await import('../../utils/generateInvoice');
            await generateInvoice(order);
        } catch (error) {
            console.error('Erreur generation facture:', error);
            alert('Une erreur est survenue lors de la generation de la facture.');
        } finally {
            setDownloadingInvoice(null);
        }
    };

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'orders'),
            where('userEmail', '==', user.email),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsub = onSnapshot(q, (snap) => {
            const fetchedOrders = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(o => o.status !== 'cancelled_by_client' && o.status !== 'cancelled');

            setOrders(fetchedOrders);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching orders:', err);
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const handleConfirmCancel = async () => {
        const orderId = orderToCancelId;

        try {
            setIsCancelling(true);
            const cancelOrderClient = httpsCallable(functions, 'cancelOrderClient');
            await cancelOrderClient({ orderId });

            setShowCancelSuccess(true);
            setOrderToCancelId(null);
        } catch (e) {
            console.error('Erreur annulation:', e);
            alert("Une erreur est survenue lors de l'annulation. " + (e.message || ''));
            setOrderToCancelId(null);
        } finally {
            setIsCancelling(false);
            setLoading(false);
        }
    };

    const scrollToSection = (ref) => {
        ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const goToGallery = () => {
        onBack?.();
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    };

    const openWishlist = () => {
        if (onOpenWishlist) onOpenWishlist();
        else scrollToSection(wishlistRef);
    };

    const navItems = [
        { label: 'Commandes', Icon: ShoppingBag, active: true, action: () => scrollToSection(ordersRef) },
        { label: 'Factures', Icon: FileText, action: () => scrollToSection(invoicesRef) },
        { label: 'Wishlist', Icon: Heart, action: openWishlist },
        { label: 'Adresse', Icon: MapPin, action: () => scrollToSection(addressesRef) },
        { label: 'Profil', Icon: UserRound, action: () => scrollToSection(infoRef) },
        { label: 'Support', Icon: Headphones, action: () => scrollToSection(helpRef) },
        { label: 'Quitter', Icon: LogOut, action: onLogout },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#101010] text-[#f5f5f7]' : 'bg-[#f5f5f7] text-[#1d1d1f]'}`}>
            <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pb-24">
                <header ref={topRef} className="scroll-mt-28">
                    <div className="flex flex-col gap-4 border-b border-[#d2d2d7] pb-5 lg:flex-row lg:items-center lg:justify-between">
                        <button
                            type="button"
                            onClick={goToGallery}
                            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-medium text-[#1d1d1f] transition-colors hover:border-[#a1a1a6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
                        >
                            <ArrowRight size={15} className="rotate-180" />
                            Galerie
                        </button>

                        <nav className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-[#d2d2d7] bg-white p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Espace client">
                            {navItems.map(({ label, Icon, active, action }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={action}
                                    className={`inline-flex min-h-9 min-w-max items-center gap-2 rounded-full px-3 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] ${
                                        active ? 'bg-[#1d1d1f] text-white' : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                                    }`}
                                >
                                    <Icon size={15} strokeWidth={1.8} />
                                    {label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="grid gap-8 py-9 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-end">
                        <div>
                            <p className="text-[13px] font-medium text-[#6e6e73]">Bonjour {customerName}</p>
                            <h1 className="mt-3 max-w-3xl text-[clamp(2.7rem,7vw,5.4rem)] font-semibold leading-[0.96] tracking-normal text-[#1d1d1f]">
                                Vos commandes, simplement.
                            </h1>
                        </div>
                        <div className="rounded-[8px] border border-[#e8e8ed] bg-white p-5">
                            <p className="text-[13px] font-medium text-[#6e6e73]">Dernier dossier</p>
                            <p className="mt-2 text-[22px] font-semibold text-[#1d1d1f]">{latestOrder ? getOrderNumber(latestOrder) : 'Aucune commande'}</p>
                            <p className="mt-2 text-[14px] leading-6 text-[#6e6e73]">
                                {latestOrder ? `${formatDate(latestOrder.createdAt?.seconds)} - ${formatPrice(getOrderTotal(latestOrder))}` : 'La galerie est prete quand vous l etes.'}
                            </p>
                        </div>
                    </div>
                </header>

                <main className="space-y-6">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <MetricButton icon={ShoppingBag} value={orders.length} label="Commandes" action="Historique complet" onClick={() => scrollToSection(ordersRef)} />
                        <MetricButton icon={Heart} value={wishlistItems.length} label="Pieces suivies" action="Wishlist" onClick={openWishlist} />
                        <MetricButton icon={MapPin} value={addressCount} label="Adresse" action="Livraison et facturation" onClick={() => scrollToSection(addressesRef)} />
                        <MetricButton icon={WalletCards} value={formatPrice(refundedTotal)} label="Avoir / remboursements" action="Suivi Stripe" onClick={() => scrollToSection(invoicesRef)} />
                    </div>

                    <AccountPanel sectionRef={ordersRef} className="scroll-mt-28 p-4 md:p-6">
                        <SectionHeader
                            eyebrow="Historique"
                            title="Commandes"
                            action={(
                                <button type="button" onClick={() => scrollToSection(invoicesRef)} className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0066cc]">
                                    Factures
                                    <ArrowRight size={15} />
                                </button>
                            )}
                        >
                            Paiement, livraison, remboursement et facture restent lisibles dans le meme dossier.
                        </SectionHeader>

                        {loading ? (
                            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[8px] border border-dashed border-[#d2d2d7] text-center text-[#6e6e73]">
                                <Loader2 size={28} strokeWidth={1.5} className="animate-spin" />
                                <p className="mt-4 text-[14px]">Chargement de vos commandes...</p>
                            </div>
                        ) : recentOrders.length === 0 ? (
                            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[8px] border border-dashed border-[#d2d2d7] px-5 text-center">
                                <Package size={40} strokeWidth={1.25} className="text-[#86868b]" />
                                <p className="mt-4 text-[22px] font-semibold">Aucune commande pour le moment</p>
                                <button
                                    type="button"
                                    onClick={goToGallery}
                                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-[13px] font-medium text-white"
                                >
                                    Decouvrir la galerie
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-[8px] border border-[#e8e8ed]">
                                <div className="hidden grid-cols-[92px_1fr_170px_120px_100px] gap-4 border-b border-[#e8e8ed] bg-[#fbfbfd] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#86868b] md:grid">
                                    <span>Piece</span>
                                    <span>Dossier</span>
                                    <span>Statut</span>
                                    <span className="text-right">Total</span>
                                    <span className="text-right">Action</span>
                                </div>

                                {recentOrders.map((order, index) => {
                                    const status = getStatusInfo(order.status);
                                    const refundHelpText = getRefundHelpText(order.status);
                                    const itemsSummary = getOrderItemsSummary(order);

                                    return (
                                        <article key={order.id} className="grid gap-4 border-b border-[#e8e8ed] px-4 py-4 last:border-b-0 md:grid-cols-[92px_1fr_170px_120px_100px] md:items-center">
                                            <div className="h-[78px] w-[78px] overflow-hidden rounded-[8px] bg-[#f5f5f7]">
                                                <img src={getOrderImage(order, index)} alt="" className="h-full w-full object-cover" />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 md:hidden">
                                                    <StatusBadge status={status} />
                                                </div>
                                                <p className="mt-2 text-[18px] font-semibold text-[#1d1d1f] md:mt-0">{getOrderNumber(order)}</p>
                                                <p className="mt-1 text-[13px] text-[#6e6e73]">{formatDate(order.createdAt?.seconds)}</p>
                                                {itemsSummary ? (
                                                    <p className="mt-2 max-w-2xl truncate text-[14px] text-[#424245]">{itemsSummary}</p>
                                                ) : null}
                                                {refundHelpText ? (
                                                    <div className="mt-3 rounded-[8px] border border-[#d8e6f5] bg-[#f5faff] px-4 py-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="text-[13px] font-semibold text-[#175c9c]">Avoir / remboursement: {formatPrice(getRefundAmount(order))}</p>
                                                            <span className="text-[12px] text-[#4d6d8f]">Stripe</span>
                                                        </div>
                                                        <p className="mt-2 text-[13px] leading-5 text-[#3b5d78]">{refundHelpText}</p>
                                                    </div>
                                                ) : null}
                                                {canCancel(order) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setOrderToCancelId(order.id)}
                                                        className="mt-3 text-[13px] font-medium text-[#b64400]"
                                                    >
                                                        Annuler la commande
                                                    </button>
                                                )}
                                            </div>

                                            <div className="hidden md:block">
                                                <StatusBadge status={status} />
                                            </div>

                                            <p className="text-[16px] font-semibold text-[#1d1d1f] md:text-right">{formatPrice(getOrderTotal(order))}</p>

                                            <button
                                                type="button"
                                                onClick={() => handleDownloadInvoice(order)}
                                                disabled={downloadingInvoice === order.id}
                                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d2d2d7] px-4 text-[13px] font-medium text-[#1d1d1f] transition-colors hover:border-[#a1a1a6] disabled:opacity-50 md:justify-self-end"
                                            >
                                                {downloadingInvoice === order.id ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                                                PDF
                                            </button>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </AccountPanel>

                    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                        <AccountPanel sectionRef={invoicesRef} className="scroll-mt-28 p-4 md:p-6">
                            <SectionHeader eyebrow="Documents" title="Factures et avoirs">
                                Telechargements PDF, montants payes et lignes de remboursement.
                            </SectionHeader>

                            {invoiceRows.length === 0 ? (
                                <div className="rounded-[8px] border border-dashed border-[#d2d2d7] px-5 py-12 text-center text-[#6e6e73]">
                                    Aucune facture disponible.
                                </div>
                            ) : (
                                <div className="divide-y divide-[#e8e8ed]">
                                    {invoiceRows.map((order) => {
                                        const status = getStatusInfo(order.status || 'pending');
                                        const hasRefund = Boolean(getRefundHelpText(order.status));
                                        return (
                                            <button
                                                key={`invoice-${order.id}`}
                                                type="button"
                                                onClick={() => handleDownloadInvoice(order)}
                                                className="grid w-full gap-3 py-4 text-left transition-colors hover:bg-[#fbfbfd] sm:grid-cols-[38px_1fr_auto]"
                                            >
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f]">
                                                    <FileText size={18} strokeWidth={1.5} />
                                                </span>
                                                <span>
                                                    <span className="block text-[15px] font-semibold text-[#1d1d1f]">FAC-{String(order.id).slice(0, 10).toUpperCase()}</span>
                                                    <span className="mt-1 block text-[13px] text-[#6e6e73]">{formatDate(order.createdAt?.seconds)} - {formatPrice(getOrderTotal(order))}</span>
                                                    {hasRefund ? (
                                                        <span className="mt-2 block text-[13px] font-medium text-[#175c9c]">
                                                            Avoir / remboursement: {formatPrice(getRefundAmount(order))}
                                                        </span>
                                                    ) : null}
                                                </span>
                                                <span className="flex items-center gap-3 sm:justify-end">
                                                    <StatusBadge status={status} />
                                                    {downloadingInvoice === order.id ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={16} />}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </AccountPanel>

                        <AccountPanel sectionRef={wishlistRef} className="scroll-mt-28 p-4 md:p-6">
                            <SectionHeader
                                eyebrow="Selection"
                                title="Wishlist"
                                action={(
                                    <button type="button" onClick={openWishlist} className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0066cc]">
                                        Ouvrir
                                        <ArrowRight size={15} />
                                    </button>
                                )}
                            >
                                Les pieces que vous gardez sous la main.
                            </SectionHeader>

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2">
                                {wishlistPreview.map((item, index) => {
                                    const image = getItemImage(item) || FALLBACK_ITEM_IMAGES[index % FALLBACK_ITEM_IMAGES.length];
                                    const price = item.currentPrice || item.startingPrice || item.price;
                                    return (
                                        <article key={`${item.id || index}-wishlist-preview`} className="group min-w-0">
                                            <div className="relative aspect-[4/4.8] overflow-hidden rounded-[8px] bg-[#f5f5f7]">
                                                <img src={image} alt={item.name || 'Piece restauree'} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                                                <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#1d1d1f] ring-1 ring-[#e8e8ed]">
                                                    <Heart size={16} strokeWidth={1.6} />
                                                </span>
                                            </div>
                                            <h3 className="mt-3 truncate text-[14px] font-semibold text-[#1d1d1f]">{item.name || 'Piece restauree'}</h3>
                                            <p className="mt-1 text-[13px] text-[#6e6e73]">{price ? formatPrice(price) : 'Prix sur demande'}</p>
                                        </article>
                                    );
                                })}
                            </div>
                        </AccountPanel>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                        <AccountPanel sectionRef={addressesRef} className="scroll-mt-28 p-4 md:p-6">
                            <SectionHeader eyebrow="Livraison" title="Adresses">
                                Les informations reprennent votre derniere commande.
                            </SectionHeader>

                            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-[#1d1d1f]">Livraison</p>
                                    <div className="mt-3 space-y-1 text-[14px] leading-6 text-[#424245]">
                                        {addressLines.length > 1 ? addressLines.map(line => <p key={line}>{line}</p>) : <p>Adresse a completer</p>}
                                    </div>
                                </div>
                                <div className="hidden bg-[#e8e8ed] md:block" />
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-[#1d1d1f]">Facturation</p>
                                    <div className="mt-3 space-y-1 text-[14px] leading-6 text-[#424245]">
                                        {addressLines.length > 1 ? addressLines.map(line => <p key={`billing-${line}`}>{line}</p>) : <p>Identique a l'adresse de livraison</p>}
                                    </div>
                                </div>
                            </div>
                        </AccountPanel>

                        <AccountPanel sectionRef={infoRef} className="scroll-mt-28 p-4 md:p-6">
                            <SectionHeader eyebrow="Compte" title="Informations personnelles">
                                Profil utilise pour les commandes et confirmations e-mail.
                            </SectionHeader>

                            <dl className="grid gap-4 sm:grid-cols-2">
                                {[
                                    ['Nom complet', customerName],
                                    ['E-mail', user?.email || 'Non renseigne'],
                                    ['Telephone', user?.phoneNumber || latestShipping.phone || BUSINESS_PHONE || 'A completer'],
                                    ['Date inscription', createdAt],
                                ].map(([label, value]) => (
                                    <div key={label} className="border-t border-[#e8e8ed] pt-4">
                                        <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#86868b]">{label}</dt>
                                        <dd className="mt-2 break-words text-[15px] font-medium text-[#1d1d1f]">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </AccountPanel>
                    </div>

                    <section
                        ref={helpRef}
                        className="grid scroll-mt-28 items-center gap-5 rounded-[8px] border border-[#d2d2d7] bg-[#1d1d1f] p-5 text-white md:grid-cols-[52px_1fr_auto] md:p-6"
                    >
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                            <Headphones size={24} strokeWidth={1.5} />
                        </span>
                        <div>
                            <h2 className="text-[24px] font-semibold tracking-normal">Besoin d'aide ?</h2>
                            <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/72">
                                Pour une question de livraison, facture ou remboursement, l atelier reprend le dossier commande.
                            </p>
                        </div>
                        <div className="flex flex-col items-start gap-2 md:items-end">
                            <button
                                type="button"
                                onClick={() => setShowContactPopup(true)}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-[13px] font-semibold text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7]"
                            >
                                Nous contacter
                                <ArrowRight size={15} />
                            </button>
                            <p className="text-[13px] text-white/58">Reponse sous 24h ouvrees</p>
                        </div>
                    </section>
                </main>
            </div>

            {showCancelSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md">
                    <div className="w-full max-w-md rounded-[8px] bg-white p-7 text-center text-[#1d1d1f] shadow-[0_24px_80px_rgba(0,0,0,.18)]">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f7faf7] text-[#2f5d46]">
                            <CheckCircle size={28} strokeWidth={1.6} />
                        </div>
                        <h3 className="mt-5 text-[26px] font-semibold">Annulation confirmee</h3>
                        <p className="mt-3 text-[14px] leading-6 text-[#6e6e73]">
                            Votre demande a bien ete traitee. La commande a ete retiree de votre historique.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowCancelSuccess(false)}
                            className="mt-6 w-full rounded-full bg-[#1d1d1f] py-3 text-[13px] font-semibold text-white"
                        >
                            J'ai compris
                        </button>
                    </div>
                </div>
            )}

            {orderToCancelId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md" onClick={() => setOrderToCancelId(null)}>
                    <div className="w-full max-w-md rounded-[8px] bg-white p-7 text-center text-[#1d1d1f] shadow-[0_24px_80px_rgba(0,0,0,.18)]" onClick={e => e.stopPropagation()}>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fffaf0] text-[#8a5a13]">
                            <AlertTriangle size={28} strokeWidth={1.6} />
                        </div>
                        <h3 className="mt-5 text-[25px] font-semibold">Confirmer l'annulation</h3>
                        <p className="mt-3 text-[14px] leading-6 text-[#6e6e73]">
                            Cette action annule uniquement une commande non payee ou en attente de paiement. Une commande carte deja payee demande un remboursement traite par l'atelier.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setOrderToCancelId(null)}
                                disabled={isCancelling}
                                className="rounded-full border border-[#d2d2d7] py-3 text-[13px] font-semibold text-[#1d1d1f]"
                            >
                                Retour
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={isCancelling}
                                className="flex items-center justify-center gap-2 rounded-full bg-[#b64400] py-3 text-[13px] font-semibold text-white disabled:opacity-70"
                            >
                                {isCancelling ? <><Loader2 size={14} className="animate-spin" /> Traitement</> : 'Confirmer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showContactPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md" onClick={() => setShowContactPopup(false)}>
                    <div className="relative w-full max-w-md rounded-[8px] bg-white p-7 text-center text-[#1d1d1f] shadow-[0_24px_80px_rgba(0,0,0,.18)]" onClick={e => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setShowContactPopup(false)}
                            className="absolute right-4 top-4 rounded-full p-2 text-[#86868b] transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                            aria-label="Fermer"
                        >
                            <XCircle size={22} />
                        </button>

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f]">
                            <MessageCircle size={26} strokeWidth={1.6} />
                        </div>

                        <h3 className="mt-5 text-[26px] font-semibold">Contact vendeur</h3>
                        <p className="mt-4 text-[14px] leading-6 text-[#6e6e73]">
                            Pour toute question sur votre commande, veuillez contacter <strong className="text-[#1d1d1f]">{CONTACT_NAME}</strong>.
                        </p>

                        {BUSINESS_PHONE && (
                            <a href={`tel:${BUSINESS_PHONE_TEL}`} className="mt-6 block rounded-full bg-[#1d1d1f] px-4 py-3 text-[15px] font-semibold text-white">
                                {BUSINESS_PHONE}
                            </a>
                        )}

                        {REVIEW_URL && (
                            <a
                                href={REVIEW_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mx-auto mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-[#0066cc]"
                            >
                                <Star size={15} />
                                Laisser un avis
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrdersView;
