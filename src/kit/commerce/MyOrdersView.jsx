import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
    AlertTriangle,
    ArrowRight,
    Bell,
    CheckCircle,
    FileText,
    Grid2X2,
    Headphones,
    Heart,
    Loader2,
    LogOut,
    MapPin,
    MessageCircle,
    Package,
    Settings,
    ShoppingBag,
    Star,
    Truck,
    UserRound,
    WalletCards,
    XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
    return `Commande n°CMD-${String(id).slice(0, 10).toUpperCase()}`;
};

const getStatusInfo = (status = '') => {
    switch (status) {
        case 'completed':
            return { label: 'Livrée', tone: 'bg-[#e8e9e3] text-[#62655d]', dot: 'bg-[#9ba08f]', icon: CheckCircle };
        case 'shipped':
            return { label: 'Expédiée', tone: 'bg-[#e9ecef] text-[#5d6470]', dot: 'bg-[#8d98a8]', icon: Truck };
        case 'cancelled_by_client':
        case 'cancelled':
            return { label: 'Annulée', tone: 'bg-red-50 text-red-600', dot: 'bg-red-500', icon: XCircle };
        case 'paid':
            return { label: 'Payée', tone: 'bg-[#e8e9e3] text-[#62655d]', dot: 'bg-[#9ba08f]', icon: CheckCircle };
        default:
            return { label: 'Préparée', tone: 'bg-[#f6e6d4] text-[#9A714C]', dot: 'bg-[#d6aa79]', icon: Package };
    }
};

const canCancel = (order) => {
    const status = order?.status || '';
    if (status === 'shipped' || status === 'completed' || status.includes('cancelled')) return false;
    if (!order?.createdAt?.seconds) return false;
    const orderDate = new Date(order.createdAt.seconds * 1000);
    const diffDays = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
};

const StatCard = ({ icon: Icon, value, label, action, onClick }) => (
    <motion.button
        type="button"
        onClick={onClick}
        initial={false}
        className={`group flex min-h-[142px] min-w-0 flex-col items-center justify-center overflow-hidden rounded-[6px] border border-[#e7ded5] bg-white/62 px-3 py-5 text-center shadow-[0_16px_44px_rgba(72,55,39,0.035)] transition-all duration-500 hover:-translate-y-0.5 hover:bg-white md:min-h-[176px] md:px-5 md:py-8 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0ebe5] text-[#181716] transition-transform duration-500 group-hover:scale-105 md:mb-6 md:h-14 md:w-14">
            <Icon size={22} strokeWidth={1.45} />
        </span>
        <strong className="font-serif text-[29px] font-normal leading-none tracking-normal text-[#181716] md:text-[34px]">{value}</strong>
        <span className="mt-3 block max-w-full px-1 text-[8px] font-black uppercase leading-[1.45] tracking-[0.13em] text-[#3f3a35] [overflow-wrap:anywhere] md:mt-4 md:text-[10px] md:tracking-[0.22em]">{label}</span>
        <span className="mt-3 inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 text-[10px] leading-tight text-[#5f5a55] md:mt-5 md:gap-3 md:text-[13px]">
            {action}
            <ArrowRight size={15} strokeWidth={1.5} className="shrink-0" />
        </span>
    </motion.button>
);

const AccountPanel = ({ children, className = '', sectionRef }) => (
    <motion.section
        ref={sectionRef}
        initial={false}
        className={`rounded-[6px] border border-[#e7ded5] bg-white/58 shadow-[0_16px_46px_rgba(72,55,39,0.035)] ${className}`}
    >
        {children}
    </motion.section>
);

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

    const customerName = user?.displayName || user?.email?.split('@')?.[0] || 'Anaïs';
    const createdAt = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Inscription récente';

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
    const recentOrders = orders.slice(0, 4);
    const addressCount = addressLines.length > 1 ? 1 : 0;

    const handleDownloadInvoice = async (order) => {
        setDownloadingInvoice(order.id);
        try {
            const { generateInvoice } = await import('../../utils/generateInvoice');
            await generateInvoice(order);
        } catch (error) {
            console.error('Erreur génération facture:', error);
            alert('Une erreur est survenue lors de la génération de la facture.');
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
        { label: 'Tableau de bord', Icon: Grid2X2, active: true, action: () => scrollToSection(topRef) },
        { label: 'Mes commandes', Icon: ShoppingBag, action: () => scrollToSection(ordersRef) },
        { label: 'Ma wishlist', Icon: Heart, action: openWishlist },
        { label: 'Mes adresses', Icon: MapPin, action: () => scrollToSection(addressesRef) },
        { label: 'Informations', Icon: UserRound, action: () => scrollToSection(infoRef) },
        { label: 'Moyens de paiement', Icon: WalletCards, action: () => scrollToSection(invoicesRef) },
        { label: 'Notifications', Icon: Bell, action: () => scrollToSection(helpRef) },
        { label: 'Préférences', Icon: Settings, action: () => scrollToSection(infoRef) },
        { label: 'Déconnexion', Icon: LogOut, action: onLogout },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-700 ${darkMode ? 'bg-[#151515] text-[#f8f1e8]' : 'bg-[#fbfaf7] text-[#181716]'}`}>
            <div className="mx-auto max-w-[1560px] px-4 pb-16 pt-6 sm:px-6 md:px-10 lg:px-12 lg:pb-24 lg:pt-7">
                <header ref={topRef} className="relative mb-6 scroll-mt-28">
                    <motion.div
                        initial={false}
                        className="relative z-10"
                    >
                        <h1 className="font-serif text-[clamp(2.55rem,6.2vw,4.05rem)] leading-[1.02] tracking-normal">
                            Mon espace<span className="text-[#d8552f]">.</span>
                        </h1>
                        <p className="mt-4 font-serif text-[22px] leading-tight">Bonjour {customerName},</p>
                        <p className={`mt-2 max-w-[440px] text-[15px] leading-[1.65] ${darkMode ? 'text-stone-300' : 'text-[#5f5a55]'}`}>
                            Retrouvez ici toutes vos informations, commandes et coups de cœur.
                        </p>
                    </motion.div>

                </header>

                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="min-w-0 lg:row-span-2">
                        <AccountPanel className="overflow-hidden p-3 lg:sticky lg:top-28 lg:p-5">
                            <nav className="flex max-w-full gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible">
                                {navItems.map(({ label, Icon, active, action }) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={action}
                                        className={`group flex min-w-max items-center gap-4 rounded-[5px] px-4 py-4 text-left transition-all lg:min-w-0 ${
                                            active
                                                ? 'bg-[#f2ede8] text-[#181716] shadow-[inset_3px_0_0_#d8552f]'
                                                : darkMode
                                                    ? 'text-stone-300 hover:bg-white/5'
                                                    : 'text-[#3f3a35] hover:bg-[#f6f2ed]'
                                        }`}
                                    >
                                        <Icon size={21} strokeWidth={1.35} className={active ? 'text-[#9A714C]' : 'text-[#5f5a55]'} />
                                        <span className="text-[11px] font-black uppercase tracking-[0.22em]">{label}</span>
                                    </button>
                                ))}
                            </nav>
                        </AccountPanel>
                    </aside>

                    <main className="min-w-0 space-y-7">
                        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
                            <StatCard icon={ShoppingBag} value={orders.length} label="Commandes" action="Voir l'historique" onClick={() => scrollToSection(ordersRef)} />
                            <StatCard icon={Heart} value={wishlistItems.length} label="Coups de cœur" action="Voir ma wishlist" onClick={openWishlist} />
                            <StatCard icon={MapPin} value={addressCount} label="Adresses enregistrées" action="Gérer mes adresses" onClick={() => scrollToSection(addressesRef)} />
                            <StatCard icon={WalletCards} value={formatPrice(0)} label="Crédit disponible" action="Voir mes avantages" onClick={() => scrollToSection(helpRef)} />
                        </div>

                        <AccountPanel sectionRef={ordersRef} className="scroll-mt-28 p-6 md:p-8">
                            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <h2 className="font-serif text-[28px] leading-none tracking-normal">Mes dernières commandes</h2>
                                <button type="button" onClick={() => scrollToSection(ordersRef)} className="inline-flex items-center gap-3 text-[13px] text-[#4b4742]">
                                    Voir toutes mes commandes
                                    <ArrowRight size={16} strokeWidth={1.5} />
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[6px] border border-dashed border-[#e7ded5] text-center text-[#7b746e]">
                                    <Loader2 size={28} strokeWidth={1.4} className="animate-spin text-[#cbb9a6]" />
                                    <p className="mt-4 text-[14px]">Chargement de vos commandes...</p>
                                </div>
                            ) : recentOrders.length === 0 ? (
                                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[6px] border border-dashed border-[#e7ded5] text-center">
                                    <Package size={42} strokeWidth={1.2} className="text-[#cbb9a6]" />
                                    <p className="mt-4 font-serif text-[24px]">Aucune commande pour le moment</p>
                                    <button
                                        type="button"
                                        onClick={goToGallery}
                                        className="mt-4 inline-flex items-center gap-3 text-[12px] font-black uppercase tracking-[0.18em] text-[#9A714C]"
                                    >
                                        Découvrir la galerie
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#e7ded5]">
                                    {recentOrders.map((order, index) => {
                                        const status = getStatusInfo(order.status);
                                        return (
                                            <div key={order.id} className="grid items-center gap-4 py-4 md:grid-cols-[82px_1fr_150px_110px_28px]">
                                                <div className="h-[70px] w-[70px] overflow-hidden rounded-[5px] bg-[#eee6dc]">
                                                    <img src={getOrderImage(order, index)} alt="" className="h-full w-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-[16px] font-medium text-[#252321]">{getOrderNumber(order)}</p>
                                                    <p className="mt-1 text-[13px] text-[#7b746e]">{formatDate(order.createdAt?.seconds)}</p>
                                                    {canCancel(order) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setOrderToCancelId(order.id)}
                                                            className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#b45f47]"
                                                        >
                                                            Annuler
                                                        </button>
                                                    )}
                                                </div>
                                                <span className={`inline-flex w-fit items-center justify-center rounded-full px-5 py-1.5 text-[12px] ${status.tone}`}>
                                                    {status.label}
                                                </span>
                                                <p className="text-left text-[15px] font-medium md:text-right">{formatPrice(getOrderTotal(order))}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadInvoice(order)}
                                                    disabled={downloadingInvoice === order.id}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#f2ede8] disabled:opacity-50"
                                                    aria-label="Télécharger la facture"
                                                >
                                                    {downloadingInvoice === order.id ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={17} strokeWidth={1.4} />}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </AccountPanel>

                        <div className="grid gap-7 xl:grid-cols-[1.15fr_0.85fr]">
                            <AccountPanel sectionRef={wishlistRef} className="scroll-mt-28 p-6 md:p-8">
                                <div className="mb-7 flex items-center justify-between gap-4">
                                    <h2 className="font-serif text-[28px] leading-none">Ma wishlist</h2>
                                    <button
                                        type="button"
                                        onClick={openWishlist}
                                        className="hidden items-center gap-3 text-[13px] text-[#4b4742] sm:inline-flex"
                                    >
                                        Voir tous mes coups de cœur
                                        <ArrowRight size={16} strokeWidth={1.5} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    {wishlistPreview.map((item, index) => {
                                        const image = getItemImage(item) || FALLBACK_ITEM_IMAGES[index % FALLBACK_ITEM_IMAGES.length];
                                        const price = item.currentPrice || item.startingPrice || item.price;
                                        return (
                                            <article key={`${item.id || index}-wishlist-preview`} className="group">
                                                <div className="relative aspect-[4/4.8] overflow-hidden rounded-[6px] bg-[#eee6dc]">
                                                    <img src={image} alt={item.name || 'Pièce restaurée'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                                                    <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#9A714C] shadow-[0_10px_20px_rgba(72,55,39,0.12)]">
                                                        <Heart size={17} strokeWidth={1.5} />
                                                    </span>
                                                </div>
                                                <h3 className="mt-4 font-serif text-[18px] leading-tight">{item.name || 'Pièce restaurée'}</h3>
                                                <p className="mt-2 text-[14px]">{price ? formatPrice(price) : 'Prix sur demande'}</p>
                                            </article>
                                        );
                                    })}
                                </div>
                            </AccountPanel>

                            <AccountPanel sectionRef={infoRef} className="scroll-mt-28 p-6 md:p-8">
                                <div>
                                    <div className="mb-8 flex items-center justify-between">
                                        <h2 className="font-serif text-[28px] leading-none">Informations personnelles</h2>
                                        <button type="button" onClick={() => scrollToSection(infoRef)} className="inline-flex items-center gap-3 text-[13px] text-[#4b4742]">
                                            Modifier
                                            <ArrowRight size={16} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                    <div className="space-y-7">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#8f8579]">Nom complet</p>
                                            <p className="mt-3 text-[16px]">{customerName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#8f8579]">E-mail</p>
                                            <p className="mt-3 text-[16px]">{user?.email || 'Non renseigné'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#8f8579]">Téléphone</p>
                                            <p className="mt-3 text-[16px]">{user?.phoneNumber || latestShipping.phone || BUSINESS_PHONE || 'À compléter'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#8f8579]">Date d'inscription</p>
                                            <p className="mt-3 text-[16px]">{createdAt}</p>
                                        </div>
                                    </div>
                                </div>
                            </AccountPanel>
                        </div>

                        <div className="grid gap-7 xl:grid-cols-[1.05fr_0.95fr]">
                            <AccountPanel sectionRef={addressesRef} className="scroll-mt-28 p-6 md:p-8">
                                <div>
                                    <div className="mb-8 flex items-center justify-between">
                                        <h2 className="font-serif text-[28px] leading-none">Mes adresses</h2>
                                        <button type="button" onClick={() => scrollToSection(addressesRef)} className="inline-flex items-center gap-3 text-[13px] text-[#4b4742]">
                                            Gérer mes adresses
                                            <ArrowRight size={16} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:gap-8">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <p className="text-[15px] font-medium leading-6">Adresse de livraison par défaut</p>
                                                <span className="inline-flex rounded-full bg-[#f0e8df] px-3 py-1 text-[10px] text-[#8b6e52]">Par défaut</span>
                                            </div>
                                            <div className="mt-5 space-y-2 text-[15px] leading-7 text-[#3f3a35]">
                                                {addressLines.length > 1 ? addressLines.map(line => <p key={line}>{line}</p>) : <p>Adresse à compléter</p>}
                                            </div>
                                        </div>
                                        <div className="hidden bg-[#e7ded5] md:block" />
                                        <div className="min-w-0">
                                            <p className="text-[15px] font-medium leading-6">Adresse de facturation</p>
                                            <div className="mt-5 space-y-2 text-[15px] leading-7 text-[#3f3a35]">
                                                {addressLines.length > 1 ? addressLines.map(line => <p key={`billing-${line}`}>{line}</p>) : <p>Identique à l'adresse de livraison</p>}
                                            </div>
                                            <button type="button" onClick={() => scrollToSection(addressesRef)} className="mt-5 text-[14px] underline underline-offset-4">Identique à l'adresse de livraison</button>
                                        </div>
                                    </div>
                                </div>
                            </AccountPanel>

                            <AccountPanel sectionRef={invoicesRef} className="scroll-mt-28 p-6 md:p-8">
                                <div className="mb-7 flex items-center justify-between">
                                    <h2 className="font-serif text-[28px] leading-none">Mes factures</h2>
                                    <button type="button" onClick={() => scrollToSection(invoicesRef)} className="inline-flex items-center gap-3 text-[13px] text-[#4b4742]">
                                        Voir toutes mes factures
                                        <ArrowRight size={16} strokeWidth={1.5} />
                                    </button>
                                </div>

                                {invoiceRows.length === 0 ? (
                                    <div className="rounded-[6px] border border-dashed border-[#e7ded5] px-5 py-12 text-center text-[#7b746e]">
                                        Aucune facture disponible.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#e7ded5]">
                                        {invoiceRows.map((order) => {
                                            const status = getStatusInfo(order.status === 'pending_payment' ? 'pending' : 'paid');
                                            return (
                                                <button
                                                    key={`invoice-${order.id}`}
                                                    type="button"
                                                    onClick={() => handleDownloadInvoice(order)}
                                                    className="grid w-full grid-cols-[36px_1fr_92px_78px_24px] items-center gap-3 py-4 text-left"
                                                >
                                                    <FileText size={23} strokeWidth={1.25} />
                                                    <span>
                                                        <span className="block text-[14px]">Facture n°FAC-{String(order.id).slice(0, 10).toUpperCase()}</span>
                                                        <span className="mt-1 block text-[12px] text-[#8f8579]">{formatDate(order.createdAt?.seconds)}</span>
                                                    </span>
                                                    <span className={`rounded-full px-4 py-1.5 text-center text-[12px] ${status.tone}`}>{status.label}</span>
                                                    <span className="text-right text-[14px]">{formatPrice(getOrderTotal(order))}</span>
                                                    {downloadingInvoice === order.id ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={16} strokeWidth={1.4} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </AccountPanel>
                        </div>

                        <motion.section
                            ref={helpRef}
                            initial={false}
                            className="grid scroll-mt-28 items-center gap-6 rounded-[6px] bg-[#f1ede8] px-6 py-7 shadow-[0_16px_46px_rgba(72,55,39,0.035)] md:grid-cols-[90px_1fr_auto]"
                        >
                            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-[#9A714C] text-[#9A714C]">
                                <Headphones size={34} strokeWidth={1.25} />
                            </span>
                            <div>
                                <h2 className="font-serif text-[28px] leading-none">Besoin d'aide ?</h2>
                                <p className="mt-3 max-w-[360px] text-[16px] leading-7 text-[#5f5a55]">
                                    Notre équipe est à votre écoute pour vous accompagner.
                                </p>
                            </div>
                            <div className="flex flex-col items-start gap-3 md:items-center">
                                <button
                                    type="button"
                                    onClick={() => setShowContactPopup(true)}
                                    className="group inline-flex min-h-[66px] items-center justify-center gap-7 rounded-[4px] bg-[#1f1f1f] px-10 text-[13px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-[#111]"
                                >
                                    Nous contacter
                                    <ArrowRight size={18} strokeWidth={1.5} />
                                </button>
                                <p className="text-[14px] text-[#7b746e]">Réponse sous 24h ouvrées</p>
                            </div>
                        </motion.section>
                    </main>
                </div>
            </div>

            {showCancelSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-md">
                    <div className={`w-full max-w-md space-y-8 rounded-[2rem] p-8 text-center shadow-2xl ${darkMode ? 'bg-stone-800' : 'bg-white'}`}>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e8e9e3] text-[#62655d]">
                            <CheckCircle size={36} strokeWidth={1.4} />
                        </div>
                        <div>
                            <h3 className="font-serif text-[32px]">Annulation confirmée</h3>
                            <p className="mt-4 text-[15px] leading-7 text-[#6f6861]">
                                Votre demande a bien été traitée. La commande a été retirée de votre historique.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowCancelSuccess(false)}
                            className="w-full rounded-[4px] bg-[#1f1f1f] py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white"
                        >
                            J'ai compris
                        </button>
                    </div>
                </div>
            )}

            {orderToCancelId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-md" onClick={() => setOrderToCancelId(null)}>
                    <div className={`w-full max-w-md space-y-6 rounded-[2rem] p-8 text-center shadow-2xl ${darkMode ? 'bg-stone-800 ring-1 ring-white/10' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f6e6d4] text-[#9A714C]">
                            <AlertTriangle size={36} strokeWidth={1.4} />
                        </div>
                        <div>
                            <h3 className="font-serif text-[30px]">Confirmer l'annulation</h3>
                            <p className={`mt-4 text-sm leading-7 ${darkMode ? 'text-stone-300' : 'text-[#6f6861]'}`}>
                                En confirmant, votre commande sera annulée et les articles seront remis en vente.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setOrderToCancelId(null)}
                                disabled={isCancelling}
                                className={`rounded-[4px] py-4 text-[10px] font-black uppercase tracking-[0.18em] ${darkMode ? 'bg-stone-700 text-white' : 'bg-[#f2ede8] text-[#181716]'}`}
                            >
                                Retour
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={isCancelling}
                                className="flex items-center justify-center gap-2 rounded-[4px] bg-[#b45f47] py-4 text-[10px] font-black uppercase tracking-[0.18em] text-white"
                            >
                                {isCancelling ? <><Loader2 size={14} className="animate-spin" /> Traitement</> : 'Confirmer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showContactPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-md" onClick={() => setShowContactPopup(false)}>
                    <div className={`relative w-full max-w-md space-y-7 rounded-[2rem] p-8 text-center shadow-2xl ${darkMode ? 'bg-stone-800 ring-1 ring-white/10' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setShowContactPopup(false)}
                            className={`absolute right-5 top-5 rounded-full p-2 transition-colors ${darkMode ? 'text-white/50 hover:bg-white/10 hover:text-white' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-900'}`}
                        >
                            <XCircle size={22} />
                        </button>

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#9A714C] text-[#9A714C]">
                            <MessageCircle size={34} strokeWidth={1.4} />
                        </div>

                        <div>
                            <h3 className="font-serif text-[32px]">Contact vendeur</h3>
                            <div className={`mt-6 rounded-[6px] p-6 ${darkMode ? 'bg-stone-900/50' : 'bg-[#fbfaf7]'}`}>
                                <p className={`text-sm leading-7 ${darkMode ? 'text-stone-300' : 'text-[#6f6861]'}`}>
                                    Pour toute question sur votre commande, veuillez contacter <strong className={darkMode ? 'text-white' : 'text-[#181716]'}>{CONTACT_NAME}</strong>.
                                </p>
                                {BUSINESS_PHONE && (
                                    <a href={`tel:${BUSINESS_PHONE_TEL}`} className="mt-5 block rounded-[4px] bg-[#1f1f1f] px-4 py-4 text-[16px] font-black tracking-wider text-white">
                                        {BUSINESS_PHONE}
                                    </a>
                                )}
                            </div>
                        </div>

                        {REVIEW_URL && (
                            <a
                                href={REVIEW_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mx-auto inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#9A714C]"
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
