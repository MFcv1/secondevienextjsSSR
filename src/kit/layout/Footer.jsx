import React, { useEffect, useState } from 'react';
import {
    ArrowRight,
    BadgeCheck,
    ChevronUp,
    Clock,
    Facebook,
    Instagram,
    Landmark,
    Leaf,
    LockKeyhole,
    Mail,
    MapPin,
    Phone,
    RotateCcw,
    ShieldCheck,
    Truck,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import KIT_CONFIG from '../config/constants';

const CONTACT_INFO_CACHE_KEY = 'secondevie:contact-info:v1';
const TRANSPARENT_PIXEL_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const DEFAULT_CONTACT = {
    email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'contact@secondevie-marseille.fr',
    phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+33 6 12 34 56 78',
    address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || 'Marseille, France',
    instagram: KIT_CONFIG.socialLinks.instagram,
    facebook: KIT_CONFIG.socialLinks.facebook,
    tiktok: KIT_CONFIG.socialLinks.tiktok,
    footerTitle: KIT_CONFIG.brandName,
    footerSubtitle: KIT_CONFIG.brandTagline,
    legacyText: `2024 ${KIT_CONFIG.brandName} par Anais. Tous droits réservés.`,
};

const defaultMapUrl =
    'https://www.google.com/maps?q=Marseille%2C%20France&z=13&output=embed';

const defaultDirectionUrl =
    'https://www.google.com/maps/search/?api=1&query=Marseille%2C%20France';

const benefitItems = [
    {
        icon: Leaf,
        title: 'Seconde main, premier choix',
        text: 'Des meubles uniques, chinés et rénovés avec soin.',
    },
    {
        icon: ShieldCheck,
        title: 'Paiement sécurisé',
        text: 'Vos transactions sont protégées et 100% sécurisées.',
    },
    {
        icon: Truck,
        title: 'Livraison à Marseille',
        text: 'Livraison rapide et soignée à domicile.',
    },
    {
        icon: RotateCcw,
        title: 'Satisfait ou remboursé',
        text: "Vous avez 14 jours pour changer d'avis en toute tranquillité.",
    },
];

const galleryLinks = [
    'Nouveautés',
    'Meubles',
    'Assises',
    'Éclairage',
    'Décorations',
    'Petits prix',
];

const aboutLinks = [
    'Notre histoire',
    'Nos valeurs',
    'Atelier & Rénovations',
    'Livraison',
    'FAQ',
    'Contact',
];

const accountLinks = [
    'Se connecter',
    'Créer un compte',
    'Mes commandes',
    'Mes favoris',
    'Mes annonces',
    'Vendre un objet',
];

const helpLinks = [
    "Centre d'aide",
    'Livraison & Retours',
    'Paiement sécurisé',
    "Conditions d'utilisation",
    'Politique de confidentialité',
    'CGV',
];

const paymentChipVariants = {
    light: 'border-stone-200 bg-white text-stone-950 dark:border-[#3a332b] dark:bg-white dark:text-stone-950',
    dark: 'border-[#3b3835] bg-[#2a2826] text-white dark:border-[#4a4640] dark:bg-[#2a2826] dark:text-white',
    paypal: 'border-[#064fa8] bg-[#064fa8] text-white dark:border-[#064fa8] dark:bg-[#064fa8] dark:text-white',
    bank: 'border-[#3f3b37] bg-[#34312e] text-white dark:border-[#4b4640] dark:bg-[#34312e] dark:text-white',
    wero: 'border-[#095cae] bg-[#095cae] text-white dark:border-[#095cae] dark:bg-[#095cae] dark:text-white',
};

const PaymentChip = ({ children, variant = 'light', className = '' }) => (
    <div className={`flex h-8 min-w-0 items-center justify-center rounded-[5px] border px-3 shadow-[0_1px_0_rgba(0,0,0,0.03)] ${paymentChipVariants[variant]} ${className}`}>
        {children}
    </div>
);

const MastercardLogo = () => (
    <svg viewBox="0 0 52 32" className="h-[22px] w-9" aria-hidden="true">
        <circle cx="20" cy="16" r="12" fill="#EB001B" />
        <circle cx="32" cy="16" r="12" fill="#F79E1B" />
        <path d="M26 7.4a12 12 0 0 1 0 17.2 12 12 0 0 1 0-17.2Z" fill="#FF5F00" />
    </svg>
);

const GooglePayLogo = () => (
    <span className="flex items-center gap-1.5 text-[13px] font-semibold tracking-[-0.04em]">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="#4285F4" d="M22.6 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.75h3.56c2.08-1.92 3.28-4.74 3.28-8.08Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.56-2.75c-.98.66-2.23 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.1A6.61 6.61 0 0 1 5.5 12c0-.73.12-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.1 14.97 1 12 1A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z" />
        </svg>
        <span className="text-[#5f6368]">Pay</span>
    </span>
);

const ApplePayLogo = () => (
    <span className="flex items-center gap-1 text-[12px] font-semibold tracking-[-0.04em]">
        <svg viewBox="0 0 18 22" className="h-4 w-3.5 fill-current" aria-hidden="true">
            <path d="M14.7 11.5c0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.6-1.7-3.1-1.7-1.3-.1-2.6.8-3.3.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 6.9 1.1 9.2.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.8-1.1-2.8-4Z" />
            <path d="M12.6 5.2c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1 1.7-.9 2.6 1 0 1.9-.5 2.5-1.2Z" />
        </svg>
        <span>Pay</span>
    </span>
);

const SectionTitle = ({ children, darkMode }) => (
    <div className="space-y-4">
        <h3 className={`font-serif text-[15px] uppercase tracking-[0.02em] ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>
            {children}
        </h3>
        <div className={`h-px w-9 ${darkMode ? 'bg-stone-600' : 'bg-[#c9ad91]'}`} />
    </div>
);

const FooterLink = ({ children, href = '#gallery', highlight = false, showArrow = false, darkMode }) => (
    <a
        href={href}
        className={`group flex w-fit max-w-full items-center justify-between gap-5 text-sm leading-none transition-colors ${
            darkMode ? 'text-stone-300 hover:text-white' : 'text-stone-700 hover:text-stone-950'
        }`}
    >
        <span>{children}</span>
        {highlight && <span className="text-orange-500 text-base leading-none">↯</span>}
        {showArrow && <ArrowRight size={13} className="opacity-70 transition-transform group-hover:translate-x-1" />}
    </a>
);

const getMapEmbedUrl = (value) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed && trimmed !== '#' ? trimmed : defaultMapUrl;
};

const MapFrame = ({ mapUrl, directionUrl, title, darkMode, className = '' }) => {
    const [isMapActive, setIsMapActive] = useState(false);

    return (
        <div className={`relative overflow-hidden rounded-xl border ${darkMode ? 'border-[#514537] bg-[#151515]' : 'border-[#eee6dd] bg-white'} ${className}`}>
            {isMapActive ? (
                <iframe
                    src={mapUrl}
                    title={title}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className={`absolute inset-0 h-full w-full border-0 ${darkMode ? 'grayscale invert opacity-60 contrast-125 sepia-[0.18]' : 'saturate-[0.95] contrast-[1.02]'}`}
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setIsMapActive(true)}
                    className={`absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center transition-colors ${
                        darkMode ? 'bg-[#151515] text-[#f8f2ea] hover:bg-[#1d1b18]' : 'bg-[#f7f1ea] text-stone-950 hover:bg-[#f2e9df]'
                    }`}
                    aria-label="Afficher la carte Google Maps de l'atelier"
                >
                    <span className={`flex h-14 w-14 items-center justify-center rounded-full ${darkMode ? 'bg-[#24211d]' : 'bg-white'}`}>
                        <MapPin size={25} strokeWidth={1.7} />
                    </span>
                    <span className="font-serif text-xl">Notre atelier à Marseille</span>
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] opacity-65">Afficher la carte</span>
                </button>
            )}
            <a
                href={directionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] shadow-lg backdrop-blur-md transition-transform hover:-translate-y-0.5 ${
                    darkMode ? 'bg-[#111110]/90 text-[#f8f2ea]' : 'bg-white/90 text-stone-950'
                }`}
                aria-label="Ouvrir l'itinéraire vers l'atelier"
            >
                Itinéraire
                <ArrowRight size={12} strokeWidth={2} />
            </a>
        </div>
    );
};

const DeferredFooterDeliveryImage = ({ darkMode, className = '', alt }) => {
    const imageRef = React.useRef(null);
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        if (shouldLoad) return undefined;

        const image = imageRef.current;
        if (!image || typeof IntersectionObserver === 'undefined') {
            setShouldLoad(true);
            return undefined;
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            if (image.offsetParent === null) return;
            setShouldLoad(true);
            observer.disconnect();
        }, { rootMargin: '120px 0px' });

        observer.observe(image);
        return () => observer.disconnect();
    }, [shouldLoad]);

    return (
        <img
            ref={imageRef}
            src={shouldLoad ? (darkMode ? '/images/footer-delivery-dark.webp' : '/images/footer-delivery-light.webp') : TRANSPARENT_PIXEL_SRC}
            alt={alt}
            width={1536}
            height={1024}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            data-footer-delivery-image={shouldLoad ? 'loaded' : 'deferred'}
            className={className}
        />
    );
};

const Footer = ({ darkMode, contactInfo: contactInfoOverride }) => {
    const [contactInfoState, setContactInfoState] = useState(() => {
        try {
            if (typeof localStorage === 'undefined') return DEFAULT_CONTACT;
            const cached = localStorage.getItem(CONTACT_INFO_CACHE_KEY);
            return cached ? { ...DEFAULT_CONTACT, ...JSON.parse(cached) } : DEFAULT_CONTACT;
        } catch {
            return DEFAULT_CONTACT;
        }
    });

    useEffect(() => {
        if (contactInfoOverride) return undefined;

        let mounted = true;
        getDoc(doc(db, 'sys_metadata', 'contact_info')).then((docSnap) => {
            if (!mounted) return;
            if (docSnap.exists()) {
                const data = docSnap.data();
                setContactInfoState(prev => ({ ...prev, ...data }));
                try {
                    localStorage.setItem(CONTACT_INFO_CACHE_KEY, JSON.stringify(data));
                } catch {
                    // Cache optional.
                }
            }
        }).catch((error) => {
            console.error('Footer contact info load error:', error);
        });
        return () => { mounted = false; };
    }, [contactInfoOverride]);

    const contactInfo = contactInfoOverride
        ? { ...DEFAULT_CONTACT, ...contactInfoOverride }
        : contactInfoState;
    const mapUrl = getMapEmbedUrl(contactInfo.mapEmbedUrl);
    const directionUrl = contactInfo.mapsDirectionUrl || defaultDirectionUrl;
    const email = contactInfo.email || DEFAULT_CONTACT.email;
    const phone = contactInfo.phone || DEFAULT_CONTACT.phone;
    const address = contactInfo.address || DEFAULT_CONTACT.address;
    const brandName = contactInfo.footerTitle || KIT_CONFIG.brandName;
    const brandTagline = contactInfo.footerSubtitle || KIT_CONFIG.brandTagline;
    const copyright = contactInfo.legacyText || `2024 ${KIT_CONFIG.brandName} par Anais. Tous droits réservés.`;

    return (
        <footer
            className={`relative z-10 w-full px-3 pb-6 pt-10 md:px-6 md:pb-8 transition-colors duration-500 ${
                darkMode ? 'bg-[#111] text-[#f4eee6]' : 'bg-[#fbfaf8] text-stone-950'
            }`}
            style={{ contentVisibility: 'auto', containIntrinsicSize: '1200px' }}
        >
            <div className="mx-auto grid w-full max-w-[430px] gap-4 md:hidden">
                <div className={`rounded-[24px] border p-6 ${darkMode ? 'border-[#2e2a25] bg-[#111110]' : 'border-[#eee6dd] bg-[#fdfbf8]'}`}>
                    <h3 className={`font-serif text-[15px] uppercase tracking-[0.02em] ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>Notre atelier à Marseille</h3>
                    <MapFrame
                        mapUrl={mapUrl}
                        directionUrl={directionUrl}
                        title="Carte de l'atelier à Marseille"
                        darkMode={darkMode}
                        className="mt-4 h-[220px]"
                    />
                    <div className={`mt-4 grid divide-y text-sm ${darkMode ? 'divide-[#211f1b] text-[#ded6cc]' : 'divide-[#eee6dd] text-stone-700'}`}>
                        <a href={directionUrl} target="_blank" rel="noopener noreferrer" className="flex gap-4 py-3">
                            <MapPin size={17} className="mt-0.5 shrink-0" />
                            <span><span className="block">{address}</span><span className="block text-xs opacity-70">Quartier du Panier, 13002</span></span>
                        </a>
                        <a href={`mailto:${email}`} className="flex items-center gap-4 py-3"><Mail size={17} /> <span className="break-all">{email}</span></a>
                        <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-4 py-3"><Phone size={17} /> <span>{phone}</span></a>
                        <div className="flex items-center gap-4 py-3"><Clock size={17} /> <span>Lun - Sam : 10h - 19h</span></div>
                    </div>
                </div>

                <div className={`rounded-[24px] border p-6 ${darkMode ? 'border-[#2e2a25] bg-[#111110]' : 'border-[#eee6dd] bg-[#fdfbf8]'}`}>
                    <h3 className={`mb-4 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>Moyens de paiement acceptés</h3>
                    <div className={`rounded-xl border p-4 ${darkMode ? 'border-[#2e2a25] bg-[#111110]' : 'border-[#eee6dd] bg-white/45'}`}>
                        <div className="mb-3 flex items-center gap-3">
                            <LockKeyhole size={20} />
                            <div><p className="font-serif text-base">Carte / Wallets</p><p className="text-xs opacity-60">Rapide & sécurisé</p></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <PaymentChip className="min-w-[52px] px-2.5"><span className="text-[12px] font-black italic tracking-[-0.08em] text-[#1434cb]">VISA</span></PaymentChip>
                            <PaymentChip className="min-w-[50px] px-2"><MastercardLogo /></PaymentChip>
                            <PaymentChip variant="dark" className="min-w-[66px] px-2.5"><ApplePayLogo /></PaymentChip>
                            <PaymentChip className="min-w-[62px] px-2.5"><GooglePayLogo /></PaymentChip>
                            <PaymentChip variant="paypal" className="min-w-[68px] px-2.5"><span className="text-[12px] font-black italic tracking-[-0.05em]">PayPal</span></PaymentChip>
                        </div>
                    </div>
                    <div className={`mt-3 rounded-xl border p-4 ${darkMode ? 'border-[#2e2a25] bg-[#111110]' : 'border-[#eee6dd] bg-white/45'}`}>
                        <div className="mb-3 flex items-center gap-3">
                            <Landmark size={20} />
                            <div><p className="font-serif text-base">Virement</p><p className="text-xs opacity-60">Instructions via email</p></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <PaymentChip variant="bank" className="min-w-[92px] gap-2 px-2.5"><Landmark size={13} strokeWidth={1.8} /><span className="text-[11px] font-black uppercase tracking-[0.08em]">Virement</span></PaymentChip>
                            <PaymentChip variant="wero" className="min-w-[56px] px-2.5"><span className="text-[13px] font-black lowercase tracking-[-0.05em]">wero</span></PaymentChip>
                        </div>
                    </div>
                    <DeferredFooterDeliveryImage
                        darkMode={darkMode}
                        alt="Livraison partout à Marseille"
                        className="mt-6 w-full rounded-md object-contain"
                    />
                    <div className={`mt-5 grid grid-cols-3 gap-3 text-[10px] ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                        <div className="flex flex-col items-center gap-1 text-center"><LockKeyhole size={22} />SSL<br />Secure</div>
                        <div className="flex flex-col items-center gap-1 text-center"><span className="rounded bg-[#168b8f] px-2 py-1 text-sm font-black text-white">PCI</span>DSS<br />Compliant</div>
                        <div className="flex flex-col items-center gap-1 text-center"><ShieldCheck size={22} />3D<br />Secure</div>
                    </div>
                </div>
                <button type="button" aria-label="Retour en haut" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${darkMode ? 'bg-[#211f1b] text-[#f8f2ea]' : 'bg-[#f3eee7] text-stone-950'}`}>
                    <ChevronUp size={18} />
                </button>
            </div>
            <div
                className={`mx-auto hidden w-full max-w-[1760px] overflow-hidden rounded-[18px] border shadow-sm md:block ${
                    darkMode
                        ? 'border-[#2e2a25] bg-[#111110] shadow-black/20'
                        : 'border-[#eee6dd] bg-[#fdfbf8] shadow-stone-200/50'
                }`}
            >
                <div className={`grid grid-cols-1 divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0 ${darkMode ? 'divide-[#3a332b]' : 'divide-[#eee6dd]'}`}>
                    {benefitItems.map(({ icon: Icon, title, text }) => (
                        <div key={title} className="flex items-center gap-6 px-7 py-8 md:px-10">
                            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-[#211f1b] text-[#f2e8dc]' : 'bg-[#f3eee7] text-stone-950'}`}>
                                <Icon size={30} strokeWidth={1.6} />
                            </div>
                            <div className="space-y-3">
                                <p className={`font-serif text-[16px] font-semibold leading-tight ${darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'}`}>{title}</p>
                                <p className={`max-w-[240px] text-sm leading-7 ${darkMode ? 'text-[#d4ccc1]' : 'text-stone-600'}`}>{text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`border-t px-7 py-12 md:px-10 md:py-14 xl:px-12 2xl:px-14 ${darkMode ? 'border-[#2e2a25]' : 'border-[#eee6dd]'}`}>
                    <div className="grid grid-cols-1 gap-11 lg:grid-cols-[minmax(280px,0.9fr)_minmax(180px,0.55fr)_minmax(180px,0.55fr)] lg:gap-x-10 lg:gap-y-10 xl:grid-cols-[205px_100px_120px_120px_145px_minmax(330px,1fr)] xl:gap-x-4 xl:gap-y-9 2xl:grid-cols-[240px_140px_150px_155px_190px_minmax(420px,520px)] 2xl:gap-9">
                        <div className="space-y-9 lg:row-span-2 xl:row-span-1 xl:space-y-8 2xl:space-y-9">
                            <a href="/" className="inline-flex items-center gap-5 group xl:gap-4 2xl:gap-5">
                                <img
                                    src="/images/logoanais-320.webp"
                                    alt={`${brandName} logo`}
                                    loading="lazy"
                                    decoding="async"
                                    className={`h-16 w-16 rounded-sm object-contain transition-transform group-hover:scale-105 ${darkMode ? 'brightness-0 invert sepia' : 'brightness-0'}`}
                                />
                                <span className="flex flex-col">
                                    <span className={`font-serif text-3xl leading-none xl:text-2xl 2xl:text-3xl ${darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'}`}>
                                        {brandName}<span className="text-orange-500">.</span>
                                    </span>
                                    <span className={`mt-2 font-serif text-base italic ${darkMode ? 'text-[#b7a797]' : 'text-stone-500'}`}>
                                        {brandTagline}
                                    </span>
                                </span>
                            </a>

                            <p className={`max-w-[310px] text-sm leading-8 xl:max-w-[240px] xl:leading-7 2xl:max-w-[280px] 2xl:leading-8 ${darkMode ? 'text-[#ded6cc]' : 'text-stone-700'}`}>
                                Nous chinons, rénovons et sélectionnons avec passion des meubles et objets de seconde main pour leur offrir une nouvelle vie et sublimer votre intérieur.
                            </p>

                            <div className="flex items-center gap-4">
                                <a href={contactInfo.instagram || '#'} target={contactInfo.instagram ? '_blank' : undefined} rel={contactInfo.instagram ? 'noopener noreferrer' : undefined} aria-label="Instagram" className={`flex h-11 w-11 items-center justify-center rounded-full transition-all hover:-translate-y-1 ${darkMode ? 'bg-[#211f1b] text-[#f2e8dc] hover:bg-[#2b2823]' : 'bg-[#f3eee7] text-stone-950 hover:bg-[#ece3d8]'}`}>
                                    <Instagram size={19} />
                                </a>
                                <a href={contactInfo.facebook || '#'} target={contactInfo.facebook ? '_blank' : undefined} rel={contactInfo.facebook ? 'noopener noreferrer' : undefined} aria-label="Facebook" className={`flex h-11 w-11 items-center justify-center rounded-full transition-all hover:-translate-y-1 ${darkMode ? 'bg-[#211f1b] text-[#f2e8dc] hover:bg-[#2b2823]' : 'bg-[#f3eee7] text-stone-950 hover:bg-[#ece3d8]'}`}>
                                    <Facebook size={19} />
                                </a>
                                <a href="#gallery" aria-label="Pinterest" className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold transition-all hover:-translate-y-1 ${darkMode ? 'bg-[#211f1b] text-[#f2e8dc] hover:bg-[#2b2823]' : 'bg-[#f3eee7] text-stone-950 hover:bg-[#ece3d8]'}`}>
                                    p
                                </a>
                                <a href={contactInfo.tiktok || '#'} target={contactInfo.tiktok ? '_blank' : undefined} rel={contactInfo.tiktok ? 'noopener noreferrer' : undefined} aria-label="TikTok" className={`flex h-11 w-11 items-center justify-center rounded-full text-xl font-semibold transition-all hover:-translate-y-1 ${darkMode ? 'bg-[#211f1b] text-[#f2e8dc] hover:bg-[#2b2823]' : 'bg-[#f3eee7] text-stone-950 hover:bg-[#ece3d8]'}`}>
                                    ♪
                                </a>
                            </div>
                        </div>

                        <nav className="space-y-7 2xl:space-y-9">
                            <SectionTitle darkMode={darkMode}>La Galerie</SectionTitle>
                            <div className="space-y-5 2xl:space-y-6">
                                {galleryLinks.map((link, index) => (
                                    <FooterLink key={link} href={index < 5 ? '#gallery' : '#'} showArrow={index < 6} highlight={link === 'Petits prix'} darkMode={darkMode}>
                                        {link}
                                    </FooterLink>
                                ))}
                            </div>
                        </nav>

                        <nav className="space-y-7 2xl:space-y-9">
                            <SectionTitle darkMode={darkMode}>À propos</SectionTitle>
                            <div className="space-y-5 2xl:space-y-6">
                                {aboutLinks.map(link => (
                                    <FooterLink key={link} href="#" darkMode={darkMode}>{link}</FooterLink>
                                ))}
                            </div>
                        </nav>

                        <nav className="space-y-7 2xl:space-y-9">
                            <SectionTitle darkMode={darkMode}>Mon compte</SectionTitle>
                            <div className="space-y-5 2xl:space-y-6">
                                {accountLinks.map(link => (
                                    <FooterLink key={link} href={link === 'Se connecter' ? '#login' : '#'} darkMode={darkMode}>{link}</FooterLink>
                                ))}
                            </div>
                        </nav>

                        <nav className="space-y-7 2xl:space-y-9">
                            <SectionTitle darkMode={darkMode}>Besoin d'aide ?</SectionTitle>
                            <div className="space-y-5 2xl:space-y-6">
                                {helpLinks.map(link => (
                                    <FooterLink key={link} href="#" darkMode={darkMode}>{link}</FooterLink>
                                ))}
                            </div>
                        </nav>

                        <div className="min-w-0 w-full max-w-[680px] justify-self-end space-y-5 lg:col-span-3 xl:col-span-1 xl:col-start-auto xl:max-w-none 2xl:max-w-[560px]">
                            <h3 className={`font-serif text-[15px] uppercase tracking-[0.02em] ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>
                                Notre atelier à Marseille
                            </h3>
                            <MapFrame
                                mapUrl={mapUrl}
                                directionUrl={directionUrl}
                                title="Carte de l'atelier à Marseille"
                                darkMode={darkMode}
                                className="h-[240px] transition-opacity hover:opacity-95 xl:h-[260px]"
                            />

                            <div className={`rounded-lg border px-5 py-4 xl:px-6 ${darkMode ? 'border-[#514537] bg-[#121110]' : 'border-[#eee6dd] bg-[#fdfbf8]'}`}>
                                <div className={`grid gap-0 divide-y text-sm ${darkMode ? 'divide-[#211f1b] text-[#ded6cc]' : 'divide-[#eee6dd] text-stone-700'}`}>
                                    <a href={directionUrl} target="_blank" rel="noopener noreferrer" className="flex gap-5 py-4 transition-colors hover:text-orange-500">
                                        <MapPin size={18} className="mt-0.5 shrink-0" />
                                        <span>
                                            <span className={`block ${darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'}`}>{address}</span>
                                            <span className="mt-1 block text-xs opacity-70">Quartier du Panier, 13002</span>
                                        </span>
                                    </a>
                                    <a href={`mailto:${email}`} className="flex items-center gap-5 py-4 transition-colors hover:text-orange-500">
                                        <Mail size={18} className="shrink-0" />
                                        <span className="break-words text-[13px]">{email}</span>
                                    </a>
                                    <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-5 py-4 transition-colors hover:text-orange-500">
                                        <Phone size={18} className="shrink-0" />
                                        <span>{phone}</span>
                                    </a>
                                    <div className="flex items-center gap-5 py-4">
                                        <Clock size={18} className="shrink-0" />
                                        <span>Lun - Sam : 10h - 19h</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`border-t px-7 py-9 md:px-10 xl:px-12 2xl:px-14 ${darkMode ? 'border-[#2e2a25]' : 'border-[#eee6dd]'}`}>
                    <div className={`grid gap-9 divide-y lg:grid-cols-[0.95fr_1.25fr_0.95fr] lg:divide-x lg:divide-y-0 xl:grid-cols-[0.95fr_1.35fr_0.95fr] ${darkMode ? 'divide-[#3a332b]' : 'divide-[#eee6dd]'}`}>
                        <div className="space-y-6 lg:pr-0 xl:pr-8">
                            <h3 className={`font-serif text-[15px] uppercase ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>
                                Moyens de paiement acceptés
                            </h3>
                            <div className="w-full max-w-[280px] space-y-2">
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <PaymentChip className="min-w-[54px] px-2.5">
                                        <span className="text-[13px] font-black italic tracking-[-0.08em] text-[#1434cb]">VISA</span>
                                    </PaymentChip>
                                    <PaymentChip className="min-w-[52px] px-2">
                                        <MastercardLogo />
                                    </PaymentChip>
                                    <PaymentChip variant="dark" className="min-w-[70px] px-2.5">
                                        <ApplePayLogo />
                                    </PaymentChip>
                                    <PaymentChip className="min-w-[64px] px-2.5">
                                        <GooglePayLogo />
                                    </PaymentChip>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <PaymentChip variant="paypal" className="min-w-[70px] px-2.5">
                                        <span className="text-[13px] font-black italic tracking-[-0.05em]">PayPal</span>
                                    </PaymentChip>
                                    <PaymentChip variant="bank" className="min-w-[90px] gap-2 px-2.5">
                                        <Landmark size={13} strokeWidth={1.8} />
                                        <span className="text-[11px] font-black uppercase tracking-[0.08em]">Virement</span>
                                    </PaymentChip>
                                    <PaymentChip variant="wero" className="min-w-[56px] px-2.5">
                                        <span className="text-[13px] font-black lowercase tracking-[-0.05em]">wero</span>
                                    </PaymentChip>
                                </div>
                            </div>
                        </div>

                        <div className="flex min-w-0 items-center justify-center pt-8 lg:px-6 lg:pt-0 xl:px-8">
                            <DeferredFooterDeliveryImage
                                darkMode={darkMode}
                                alt="Livraison partout à Marseille - suivi de commande en temps réel"
                                className="w-full max-w-[520px] rounded-md object-contain xl:max-w-[600px]"
                            />
                        </div>

                        <div className="space-y-7 pt-8 lg:pl-8 lg:pt-0 xl:pl-10">
                            <div className="flex items-center gap-5">
                                <BadgeCheck size={28} strokeWidth={1.6} />
                                <h3 className={`font-serif text-[15px] uppercase ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>Site sécurisé</h3>
                            </div>
                            <div className={`flex flex-wrap gap-x-5 gap-y-4 text-xs ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                                <div className="flex min-w-[86px] items-center gap-3">
                                    <LockKeyhole size={30} className={darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'} />
                                    <span>SSL<br />Secure</span>
                                </div>
                                <div className="flex min-w-[96px] items-center gap-3">
                                    <span className="rounded bg-[#168b8f] px-2 py-1.5 text-sm font-black text-white">PCI</span>
                                    <span>DSS<br />Compliant</span>
                                </div>
                                <div className="flex min-w-[88px] items-center gap-3">
                                    <ShieldCheck size={30} className={darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'} />
                                    <span>3D<br />Secure</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`border-t px-7 py-6 md:px-12 xl:px-14 ${darkMode ? 'border-[#2e2a25] bg-[#121110]' : 'border-[#eee6dd] bg-[#fbfaf8]'}`}>
                    <div className="flex flex-col gap-6 text-sm lg:flex-row lg:items-center lg:justify-between">
                        <p className={darkMode ? 'text-stone-500' : 'text-stone-600'}>© {copyright}</p>
                        <div className={`flex flex-wrap gap-x-7 gap-y-3 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                            <a href="#" className="hover:text-orange-500">Mentions légales</a>
                            <a href="#" className="hover:text-orange-500">CGV</a>
                            <a href="#" className="hover:text-orange-500">Politique de confidentialité</a>
                            <a href="#" className="hover:text-orange-500">Cookies</a>
                        </div>
                        <button
                            type="button"
                            aria-label="Retour en haut"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className={`flex h-11 w-11 items-center justify-center rounded-full transition-all hover:-translate-y-1 ${
                                darkMode ? 'bg-[#211f1b] text-[#f8f2ea] hover:bg-[#2b2823]' : 'bg-[#f3eee7] text-stone-950 hover:bg-[#ece3d8]'
                            }`}
                        >
                            <ChevronUp size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
