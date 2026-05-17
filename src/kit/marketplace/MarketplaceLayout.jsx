import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import PremiumMegaMenu from './components/PremiumMegaMenu';
import MarketplaceHero from './components/MarketplaceHero';
import CategoryRail from './components/CategoryRail';
import ReassuranceSection from './components/ReassuranceSection';
import { ProductArrivalsSection, ProductSmallPricesSection } from './components/ProductSections';
import { motion } from 'framer-motion';
import KIT_CONFIG, { GALLERY_HERO_PRESETS, resolveGalleryHeroImage } from '../config/constants';
import { where, orderBy, doc, getDoc } from 'firebase/firestore';
import useFirestoreSection from '../hooks/useFirestoreSection';
import { db } from '../config/firebase';
import { GALLERY_SEO_COPY } from './seoCopy';
import { preloadImage } from '../../utils/imageUtils';

const loadBeforeAfterSection = () => import('./components/BeforeAfterSection');
const loadInstagramSection = () => import('./components/InstagramSection');
const loadTestimonialsSection = () => import('./components/TestimonialsSection');
const loadNewsletterSection = () => import('./components/NewsletterSection');
const loadCustomerTestimonialsCarousel = () => import('../shared/CustomerTestimonialsCarousel');

const BeforeAfterSection = React.lazy(loadBeforeAfterSection);
const InstagramSection = React.lazy(loadInstagramSection);
const TestimonialsSection = React.lazy(loadTestimonialsSection);
const NewsletterSection = React.lazy(loadNewsletterSection);

// Variable module : reset à chaque rechargement/fermeture du site,
// mais persiste pendant la navigation SPA (Buffets → Gallery = pas de replay)
const SectionLogo = ({ tone }) => {
    const isPrice = tone === 'price';

    return (
        <motion.span
            className={`relative ml-1 inline-flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[18px] p-[5px] ring-1 shadow-[0_18px_36px_-28px_rgba(28,25,23,0.65)] md:h-[64px] md:w-[64px] md:rounded-[21px] ${
                isPrice
                    ? 'rotate-[4deg] bg-[#F1DDD2] ring-[#B35D3E]/18'
                    : '-rotate-[5deg] bg-[#E5EDE3] ring-[#6E7D61]/18'
            }`}
            aria-hidden="true"
            variants={{
                hidden: { y: 18, rotate: isPrice ? -8 : 8, scale: 0.74, opacity: 0 },
                visible: {
                    y: 0,
                    rotate: isPrice ? 4 : -5,
                    scale: 1,
                    opacity: 1,
                    transition: { duration: 0.82, ease: [0.16, 1, 0.3, 1] }
                }
            }}
        >
            <span className="absolute -inset-1 rounded-[22px] border border-white/75 md:rounded-[25px]" />
            <span className={`relative flex h-full w-full items-center justify-center rounded-[14px] border bg-[#FAFAF9]/82 md:rounded-[17px] ${
                isPrice ? 'border-[#B35D3E]/28 text-[#9E563F]' : 'border-[#6E7D61]/28 text-[#5F6E55]'
            }`}>
                <svg viewBox="0 0 42 42" className={`${isPrice ? 'h-[35px] w-[35px] md:h-[42px] md:w-[42px]' : 'h-[43px] w-[43px] md:h-[50px] md:w-[50px]'} overflow-visible`} fill="none">
                    {isPrice ? (
                        <>
                            <path
                                d="M21 3.8 25.1 6.7 30 5.6 32.2 10.1 36.8 12 35.9 16.9 39 21 35.9 25.1 36.8 30 32.2 31.9 30 36.4 25.1 35.3 21 38.2 16.9 35.3 12 36.4 9.8 31.9 5.2 30 6.1 25.1 3 21 6.1 16.9 5.2 12 9.8 10.1 12 5.6 16.9 6.7 21 3.8Z"
                                fill="currentColor"
                                fillOpacity="0.055"
                                stroke="currentColor"
                                strokeWidth="1.35"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                            <text
                                x="21"
                                y="27"
                                textAnchor="middle"
                                className="fill-current font-serif"
                                fontSize="20"
                                fontWeight="500"
                            >
                                €
                            </text>
                        </>
                    ) : (
                        <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
                            <path
                                d="M21 10.2C22.35 16.35 25.65 19.65 31.8 21C25.65 22.35 22.35 25.65 21 31.8C19.65 25.65 16.35 22.35 10.2 21C16.35 19.65 19.65 16.35 21 10.2Z"
                                fill="none"
                                strokeWidth="2.7"
                            />
                            <path d="M21 5.2v4.4M21 32.4v4.4M5.2 21h4.4M32.4 21h4.4" strokeWidth="2.65" />
                            <path d="M9.8 9.8 13 13M29 29l3.2 3.2M32.2 9.8 29 13M13 29l-3.2 3.2" strokeWidth="2.65" />
                        </g>
                    )}
                </svg>
            </span>
        </motion.span>
    );
};

const SectionHeading = ({ children, tone = 'arrival' }) => {
    return (
        <motion.h2
            className="group/section-title flex items-center gap-3 font-serif text-4xl leading-none tracking-[-0.015em] md:gap-4 md:text-5xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-12% 0px -8% 0px" }}
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.12, delayChildren: 0.04 } }
            }}
        >
            <motion.span
                variants={{
                    hidden: { y: 16, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
                }}
            >
                {children}
            </motion.span>
            <SectionLogo tone={tone} />
        </motion.h2>
    );
};

const staticCategories = [
    { id: 'buffets',   label: 'BUFFETS' },
    { id: 'armoires',  label: 'ARMOIRES' },
    { id: 'miroirs',   label: 'MIROIRS' },
    { id: 'commodes',  label: 'COMMODES' },
];

const categoryImages = {
    buffets: "/images/categories/buffets-rail.webp",
    armoires: "/images/categories/armoires-rail.webp",
    miroirs: "/images/categories/miroirs-rail.webp",
    commodes: "/images/categories/commodes-rail.webp",
};

const categoryDescriptions = {
    buffets: 'Buffets anciens restaurés pour salon et salle à manger.',
    armoires: 'Armoires anciennes avec rangement, bois et présence.',
    miroirs: 'Miroirs anciens pour lumière, patine et profondeur.',
    commodes: 'Commodes restaurées faciles à placer au quotidien.',
};

// DEFAULTS
const DEFAULT_HERO_IMAGES = GALLERY_HERO_PRESETS;

const DEFAULT_RESTORATION_PROJECTS = [
    {
        id: 1,
        title: "La Commode Oubliée",
        tag: "Rénovation Complète",
        desc: "Sablage délicat et peinture Céladon.",
        avant: "/images/before-after/avant-gallery.webp",
        apres: "/images/before-after/apres-gallery.webp",
        accent: "#87A08B"
    },
    {
        id: 2,
        title: "La Console d'Époque",
        tag: "Sablage & Patine",
        desc: "Sublimation du veinage naturel du chêne.",
        avant: "/images/before-after/avantu-gallery.webp",
        apres: "/images/before-after/apresu-gallery.webp",
        accent: "#C2704E"
    },
    {
        id: 3,
        title: "Le Bureau Vintage",
        tag: "Réparation & Traitement",
        desc: "Consolidation et vernis mat imperméable.",
        avant: "/images/before-after/avantx-gallery.webp",
        apres: "/images/before-after/apresx-gallery.webp",
        accent: "#A68A64"
    }
];
const HERO_DURATION = 5500; // ms par slide
const HERO_PROGRESS_STEP_COUNT = 4;
const DEFERRED_SECTION_IDLE_FALLBACK_MS = 16000;
const DEFERRED_SECTION_ROOT_MARGIN = '420px 0px 620px';
const MOBILE_GALLERY_QUERY = '(max-width: 1023px)';

const normalizeFrenchCopy = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('fr-FR');

const isThemeTransitionActive = () => (
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('theme-transitioning')
);

const DeferredSectionSlot = ({ children, minHeight, delay = 0, className = '', forceReady = false }) => {
    const slotRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (forceReady) {
            setIsReady(true);
            return undefined;
        }
        if (isReady) return undefined;

        let observer = null;
        let timeoutId = 0;
        let hasQueuedReveal = false;

        const reveal = () => {
            hasQueuedReveal = true;
            timeoutId = window.setTimeout(() => {
                timeoutId = 0;
                React.startTransition(() => setIsReady(true));
            }, delay);
        };

        const queueReveal = () => {
            if (hasQueuedReveal) return;
            observer?.disconnect();
            reveal();
        };

        const node = slotRef.current;
        if (node && typeof IntersectionObserver !== 'undefined') {
            observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) queueReveal();
            }, { rootMargin: DEFERRED_SECTION_ROOT_MARGIN });
            observer.observe(node);
        }

        const fallbackId = window.setTimeout(queueReveal, DEFERRED_SECTION_IDLE_FALLBACK_MS + delay);

        return () => {
            observer?.disconnect();
            window.clearTimeout(fallbackId);
            if (timeoutId) window.clearTimeout(timeoutId);
        };
    }, [delay, forceReady, isReady]);

    const reservedHeight = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
    const placeholderStyle = isReady
        ? { minHeight: reservedHeight }
        : { minHeight: reservedHeight, contentVisibility: 'auto', containIntrinsicSize: reservedHeight };

    return (
        <div ref={slotRef} className={className} style={placeholderStyle}>
            {isReady ? (
                <React.Suspense fallback={null}>
                    {children}
                </React.Suspense>
            ) : null}
        </div>
    );
};

const canPreloadMobileGalleryEntryAssets = () => {
    if (typeof window === 'undefined') return false;
    if (!window.matchMedia(MOBILE_GALLERY_QUERY).matches) return false;

    const connection = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return false;

    const deviceMemory = Number(navigator?.deviceMemory || 0);
    if (deviceMemory > 0 && deviceMemory <= 2) return false;

    return true;
};

const scheduleGalleryWarmup = (callback, delay, handles) => {
    const timeoutId = window.setTimeout(() => {
        const run = () => callback();
        if (typeof window.requestIdleCallback === 'function') {
            const idleId = window.requestIdleCallback(run, { timeout: 1400 });
            handles.idles.push(idleId);
            return;
        }
        run();
    }, delay);

    handles.timeouts.push(timeoutId);
};

const preloadCategoryRailImages = (categories, getImageSrc) => {
    if (!Array.isArray(categories) || typeof getImageSrc !== 'function') return;

    categories.slice(0, 4).forEach((category) => {
        const src = getImageSrc(category.id);
        preloadImage(src, {
            priority: 'low',
            decode: false,
            decoding: 'async',
        }).catch(() => null);
    });
};

const MarketplaceLayout = ({
    items,
    onSelectItem,
    onPrefetchItem,
    headerProps,
    darkMode,
    setHeaderProps,
    onAddToCart,
    wishlistItems = [],
    onToggleWishlist,
    onOpenAbout,
    onNavigateCategory,
    onOpenQuote,
    isPreparingGallery = false,
    isDetailOverlayOpen = false,
    isCatalogComplete = false,
    isLoadingFullCatalog = false,
    onLoadFullCatalog
}) => {
    const { filter, setFilter } = headerProps || {};
    const containerRef = useRef(null);
    const hasStartedMobileWarmupRef = useRef(false);

    const [galleryConfig, setGalleryConfig] = useState(null);

    useEffect(() => {
        const fetchGalleryConfig = async () => {
             try {
                 const snap = await getDoc(doc(db, 'sys_metadata', 'gallery_app'));
                 if (snap.exists()) setGalleryConfig(snap.data());
             } catch (error) { console.error("Error fetching gallery config:", error); }
        };
        fetchGalleryConfig();
    }, []);

    const customHeroImages = useMemo(() => (
        Array.isArray(galleryConfig?.hero_images)
            ? galleryConfig.hero_images
                .map(resolveGalleryHeroImage)
                .filter((entry) => entry?.src)
            : []
    ), [galleryConfig?.hero_images]);
    const dynamicHeroImages = useMemo(() => (
        customHeroImages.length > 0 ? customHeroImages : DEFAULT_HERO_IMAGES
    ), [customHeroImages]);
    const heroProgressSteps = useMemo(() => {
        const total = dynamicHeroImages.length;
        if (!total) return [];

        const visibleSteps = Math.min(HERO_PROGRESS_STEP_COUNT, total);
        return Array.from({ length: visibleSteps }, (_, index) => {
            const start = Math.floor((index * total) / visibleSteps);
            const rawEnd = Math.floor(((index + 1) * total) / visibleSteps);
            const end = Math.min(total, Math.max(start + 1, rawEnd));

            return { index, start, end, span: end - start };
        });
    }, [dynamicHeroImages.length]);
    const headerTexts = galleryConfig?.header_texts_text || {
        banner_text: "Mobilier restauré autour de Marseille",
        hero_title: GALLERY_SEO_COPY.title,
        hero_subtitle: "Pièces uniques, bois ancien et livraison possible en France",
        hero_btn: "Voir les pièces"
    };
    const heroTitle = headerTexts.hero_title?.trim() === "Comment trouver des meubles intemporels ?"
        ? GALLERY_SEO_COPY.title
        : headerTexts.hero_title;
    const heroSubtitleKey = normalizeFrenchCopy(headerTexts.hero_subtitle);
    const heroSubtitle = heroSubtitleKey === "nos conseils pour transformer votre interieur" || heroSubtitleKey === "pieces uniques, bois ancien et livraison possible en france"
        ? "Pièces uniques, bois ancien et livraison possible en France"
        : headerTexts.hero_subtitle;
    const heroButtonKey = normalizeFrenchCopy(headerTexts.hero_btn);
    const heroButtonLabel = heroButtonKey === "lisez l article" || heroButtonKey === "voir les pieces"
        ? "Voir les pièces"
        : headerTexts.hero_btn;
    const heroBannerKey = normalizeFrenchCopy(headerTexts.banner_text);
    const heroBannerText = heroBannerKey === 'mobilier restaure autour de marseille'
        ? 'Mobilier restauré autour de Marseille'
        : headerTexts.banner_text;
    const isDefaultGalleryHeroTitle = normalizeFrenchCopy(heroTitle) === 'mobilier ancien restaure autour de marseille';
    const getConfigImageEntry = (key, fallback) => ({
        src: galleryConfig?.[key] || fallback,
    });
    const getProjectConfig = (id) => {
        const textConf = galleryConfig?.[`project_${id}_text`];
        const defaultProj = DEFAULT_RESTORATION_PROJECTS[id - 1];
        const avant = getConfigImageEntry(`project_${id}_avant`, defaultProj.avant);
        const apres = getConfigImageEntry(`project_${id}_apres`, defaultProj.apres);
        if (textConf || galleryConfig?.[`project_${id}_avant`] || galleryConfig?.[`project_${id}_apres`]) {
            return {
                id,
                title: textConf?.title || defaultProj.title,
                tag: textConf?.tag || defaultProj.tag,
                desc: textConf?.desc || defaultProj.desc,
                accent: textConf?.accent || defaultProj.accent,
                avant: avant.src,
                apres: apres.src,
            };
        }
        return defaultProj;
    };
    const dynamicProjects = useMemo(() => [1,2,3].map(getProjectConfig), [galleryConfig]);

    const getCatImageEntry = (id) => getConfigImageEntry(
        `cat_${id}`,
        categoryImages[id] || "/images/categories/fallback.webp"
    );
    const getCategoryRailImageSrc = useCallback((id) => (
        categoryImages[id] || galleryConfig?.[`cat_${id}`] || "/images/categories/fallback.webp"
    ), [galleryConfig]);
    const instaDefaults = [
        { img: "/images/before-after/apresu-gallery.webp", rotate: -2, yOffset: 0, aspect: "aspect-[4/5]" },
        { img: "/images/before-after/avantu-gallery.webp", rotate: 1, yOffset: -20, aspect: "aspect-square" },
        { img: "/images/before-after/apres-gallery.webp", rotate: -1, yOffset: 20, aspect: "aspect-[4/5]" },
        { img: "/images/before-after/apresx-gallery.webp", rotate: 2, yOffset: 0, aspect: "aspect-square" }
    ];
    const dynamicInsta = useMemo(() => instaDefaults.map((d, i) => ({
        ...d,
        img: galleryConfig?.[`insta_${i + 1}`] || d.img,
    })), [galleryConfig]);

    // --- HERO CAROUSEL ---
    const [heroIndex, setHeroIndex] = useState(0);
    const [slideVersion, setSlideVersion] = useState(0); // force remount du fill actif
    const heroIndexRef = useRef(0);
    const activeHeroProgressIndex = heroProgressSteps.findIndex((step) => (
        heroIndex >= step.start && heroIndex < step.end
    ));
    const heroSlideCount = dynamicHeroImages.length;
    const heroImageIndexesToLoad = useMemo(() => {
        if (!heroSlideCount) return new Set();

        return new Set([
            heroIndex,
            (heroIndex + 1) % heroSlideCount,
        ]);
    }, [heroIndex, heroSlideCount]);
    const goToSlide = (idx) => {
        heroIndexRef.current = idx;
        setHeroIndex(idx);
        setSlideVersion(v => v + 1);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (isThemeTransitionActive()) return;
            const next = (heroIndexRef.current + 1) % dynamicHeroImages.length;
            goToSlide(next);
        }, HERO_DURATION);
        return () => clearInterval(timer);
    }, [dynamicHeroImages.length]);

    React.useEffect(() => {
        if (setHeaderProps && headerProps) setHeaderProps(headerProps);
        return () => { if (setHeaderProps) setHeaderProps(null); };
    }, [headerProps, setHeaderProps]);

    const publishedItems = useMemo(() => (
        Array.isArray(items) ? items.filter(i => i.status === 'published') : []
    ), [items]);
    const availableCategoryIds = useMemo(() => {
        const ids = new Set();
        publishedItems.forEach((item) => {
            if (item.category) ids.add(item.category);
        });
        return ids;
    }, [publishedItems]);

    const visibleCategories = useMemo(() => (
        staticCategories.filter(c => !c.hideIfEmpty || availableCategoryIds.has(c.id))
    ), [availableCategoryIds]);

    useEffect(() => {
        const handles = { timeouts: [], idles: [] };

        if (isPreparingGallery && canPreloadMobileGalleryEntryAssets() && !hasStartedMobileWarmupRef.current) {
            hasStartedMobileWarmupRef.current = true;

            scheduleGalleryWarmup(() => {
                preloadCategoryRailImages(visibleCategories, getCategoryRailImageSrc);
            }, 420, handles);
        }

        if (!handles.timeouts.length && !handles.idles.length) return undefined;

        return () => {
            handles.timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
            if (typeof window.cancelIdleCallback === 'function') {
                handles.idles.forEach((idleId) => window.cancelIdleCallback(idleId));
            }
        };
    }, [getCategoryRailImageSrc, isPreparingGallery, visibleCategories]);

    const scrollToPieces = useCallback(() => {
        const target = containerRef.current?.querySelector('#gallery-pieces');
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    return (
        <div ref={containerRef} className={`gallery-theme-surface w-full min-h-screen transition-colors duration-1000 ${darkMode ? 'bg-[#121212] text-[#f5f5f5]' : 'bg-[#FAFAF9] text-stone-900'}`}>
            
            {/* SUB-NAVIGATION AVANCÉE - MEGA MENU */}
            <PremiumMegaMenu darkMode={darkMode} onOpenAbout={onOpenAbout} onNavigateCategory={onNavigateCategory} />

            {/* ÉTAPE 1 : Hero Carousel */}
            <MarketplaceHero
                darkMode={darkMode}
                dynamicHeroImages={dynamicHeroImages}
                heroIndex={heroIndex}
                heroImageIndexesToLoad={heroImageIndexesToLoad}
                heroBannerText={heroBannerText}
                isDefaultGalleryHeroTitle={isDefaultGalleryHeroTitle}
                heroTitle={heroTitle}
                heroSubtitle={heroSubtitle}
                heroButtonLabel={heroButtonLabel}
                onScrollToPieces={scrollToPieces}
                onOpenQuote={onOpenQuote}
                heroProgressSteps={heroProgressSteps}
                activeHeroProgressIndex={activeHeroProgressIndex}
                slideVersion={slideVersion}
                onGoToSlide={goToSlide}
                heroDuration={HERO_DURATION}
            />

            {/* ETAPE 2 : Categories */}
            <CategoryRail
                categories={visibleCategories}
                descriptions={categoryDescriptions}
                darkMode={darkMode}
                getImageSrc={getCategoryRailImageSrc}
                onNavigateCategory={onNavigateCategory}
            />

            <section className={`relative z-10 px-4 pb-7 pt-7 md:px-8 md:pb-8 md:pt-24 lg:px-12 ${
                darkMode ? 'bg-[#121212]' : 'bg-[#FAFAF9]'
            }`} aria-labelledby="gallery-seo-title">
                <div className="mx-auto grid max-w-6xl gap-7 md:grid-cols-[1.1fr_0.9fr] md:items-end">
                    <div>
                        <p className={`mb-3 font-sans text-[10px] font-black uppercase tracking-[0.26em] ${
                            darkMode ? 'text-[#bca78c]' : 'text-[#8a6848]'
                        }`}>
                            {GALLERY_SEO_COPY.eyebrow}
                        </p>
                        <h2 id="gallery-seo-title" className={`font-serif text-[28px] leading-tight md:text-[38px] ${
                            darkMode ? 'text-white' : 'text-[#181716]'
                        }`}>
                            {GALLERY_SEO_COPY.title}
                        </h2>
                        <p className={`mt-4 max-w-3xl text-[14px] leading-[1.8] md:text-[15px] ${
                            darkMode ? 'text-stone-300/82' : 'text-[#62584f]'
                        }`}>
                            {GALLERY_SEO_COPY.intro}
                        </p>
                    </div>
                    <ul className={`grid gap-2 border-t pt-4 md:border-l md:border-t-0 md:pl-7 md:pt-0 ${
                        darkMode ? 'border-white/10' : 'border-[#d8c8ba]'
                    }`}>
                        {GALLERY_SEO_COPY.highlights.map((highlight) => (
                            <li key={highlight} className={`flex items-start gap-3 text-[12px] font-semibold leading-[1.65] ${
                                darkMode ? 'text-stone-300' : 'text-[#4f463e]'
                            }`}>
                                <span className={`mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full ${
                                    darkMode ? 'bg-[#d4b48c]' : 'bg-[#9A654B]'
                                }`} />
                                <span>{highlight}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ÉTAPE 3 : Le Contrat Tacite (Barre de Réassurance) */}
            <ReassuranceSection darkMode={darkMode} />

            {/* ÉTAPE 4 : La "Tension de la Chasse" (Grille Nouveautés) */}
            <ProductArrivalsSection
                heading={<SectionHeading>Nouveautés</SectionHeading>}
                items={items}
                wishlistItems={wishlistItems}
                isCatalogComplete={isCatalogComplete}
                isLoadingFullCatalog={isLoadingFullCatalog}
                onLoadFullCatalog={onLoadFullCatalog}
                darkMode={darkMode}
                isDetailOverlayOpen={isDetailOverlayOpen}
                onSelectItem={onSelectItem}
                onPrefetchItem={onPrefetchItem}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
            />

            {/* ÉTAPE 5 : Avant / Après — atelier premium adouci */}
            <DeferredSectionSlot minHeight="760px" delay={0}>
                <BeforeAfterSection darkMode={darkMode} projects={dynamicProjects} />
            </DeferredSectionSlot>

            {/* ÉTAPE 6 : "Le Rattrapage" (Grille Petits Prix) */}
            <DeferredSectionSlot minHeight="820px" delay={120}>
                <ProductSmallPricesSection
                    heading={<SectionHeading tone="price">Petits Prix</SectionHeading>}
                    items={items}
                    wishlistItems={wishlistItems}
                    isCatalogComplete={isCatalogComplete}
                    isLoadingFullCatalog={isLoadingFullCatalog}
                    onLoadFullCatalog={onLoadFullCatalog}
                    darkMode={darkMode}
                    isDetailOverlayOpen={isDetailOverlayOpen}
                    onSelectItem={onSelectItem}
                    onPrefetchItem={onPrefetchItem}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                />
            </DeferredSectionSlot>

            {/* ÉTAPE 7 : "La Connexion Humaine" (Le mur Instagram) - Version Marketplace Stylisée */}
            <DeferredSectionSlot minHeight="780px" delay={180}>
                <InstagramSection darkMode={darkMode} posts={dynamicInsta} />
            </DeferredSectionSlot>

            {/* ÉTAPE 8 : Le "Juge de Paix" (Les Avis Google) */}
            <DeferredSectionSlot minHeight="520px" delay={240}>
                <TestimonialsSection darkMode={darkMode} />
            </DeferredSectionSlot>

            {/* ÉTAPE 9 : "La Capture" (Newsletter Minimaliste) */}
            <DeferredSectionSlot minHeight="760px" delay={300}>
                <NewsletterSection darkMode={darkMode} />
            </DeferredSectionSlot>
        </div>
    );
};

export default MarketplaceLayout;
