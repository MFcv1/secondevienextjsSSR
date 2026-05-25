import React from 'react';
import { Plus, Heart } from 'lucide-react';
import { getProductUrl } from '../../../utils/slug';
import { PRODUCT_CARD_IMAGE_SIZES, getProductCardImage, preloadPrimaryProductDetailImage, preloadProductImages, rememberInstantProductDetailImage } from '../../../utils/imageUtils';

const TRANSPARENT_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
const PRODUCT_CARD_DESKTOP_QUERY = '(min-width: 1024px)';
const PRODUCT_CARD_IMAGE_BATCH_SIZE = 4;
const PRODUCT_CARD_IMAGE_BATCH_DELAY_MS = 80;
const PRODUCT_CARD_DEFAULT_NEAR_MARGIN = { before: 260, after: 340 };
const PRODUCT_CARD_DESKTOP_NEAR_MARGIN = { before: 280, after: 720 };

const productCardImageRequestQueue = [];
let productCardImageRequestTimer = 0;
let productCardImageRequestFrame = 0;
let productDetailModuleWarmupPromise = null;

const warmProductDetailModule = () => {
    if (productDetailModuleWarmupPromise || typeof window === 'undefined') return productDetailModuleWarmupPromise;
    productDetailModuleWarmupPromise = import('../ProductDetail').catch((error) => {
        productDetailModuleWarmupPromise = null;
        throw error;
    });
    return productDetailModuleWarmupPromise;
};

const scheduleProductCardImageQueueFlush = () => {
    if (productCardImageRequestTimer || productCardImageRequestFrame) return;

    const flush = () => {
        productCardImageRequestTimer = 0;

        const runBatch = () => {
            productCardImageRequestFrame = 0;
            const batch = productCardImageRequestQueue.splice(0, PRODUCT_CARD_IMAGE_BATCH_SIZE);
            batch.forEach((callback) => callback());

            if (productCardImageRequestQueue.length) {
                productCardImageRequestTimer = window.setTimeout(flush, PRODUCT_CARD_IMAGE_BATCH_DELAY_MS);
            }
        };

        if (typeof window.requestAnimationFrame === 'function') {
            productCardImageRequestFrame = window.requestAnimationFrame(runBatch);
            return;
        }

        runBatch();
    };

    flush();
};

const enqueueProductCardImageRequest = (callback, { priority = false } = {}) => {
    if (priority) {
        productCardImageRequestQueue.unshift(callback);
        if (productCardImageRequestTimer) {
            window.clearTimeout(productCardImageRequestTimer);
            productCardImageRequestTimer = 0;
        }
    } else {
        productCardImageRequestQueue.push(callback);
    }

    scheduleProductCardImageQueueFlush();
};

const scheduleProductDetailModuleWarmup = () => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia?.(PRODUCT_CARD_DESKTOP_QUERY).matches) return;

    const run = () => warmProductDetailModule()?.catch(() => {});

    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(run, { timeout: 2600 });
        return;
    }

    window.setTimeout(run, 1400);
};

const getProductCardObserverRoot = (node) => {
    if (typeof window === 'undefined') return null;

    const galleryRoot = document.getElementById('marketplaceGalleryScroll');
    if (!galleryRoot?.contains(node)) return null;

    const style = window.getComputedStyle(galleryRoot);
    const isScrollableRoot = (
        galleryRoot.scrollHeight > galleryRoot.clientHeight + 8 &&
        ['auto', 'scroll'].includes(style.overflowY)
    );

    return isScrollableRoot ? galleryRoot : null;
};

const getProductCardViewportState = (node, root, nearMargin = PRODUCT_CARD_DEFAULT_NEAR_MARGIN) => {
    if (!node || typeof window === 'undefined') {
        return { isNear: true, isVisible: true };
    }

    const rect = node.getBoundingClientRect();
    const rootRect = root
        ? root.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };

    return {
        isNear: rect.bottom >= rootRect.top - nearMargin.before && rect.top <= rootRect.bottom + nearMargin.after,
        isVisible: rect.bottom >= rootRect.top && rect.top <= rootRect.bottom,
    };
};

const getProductCardRequestSettings = (layoutMode, isBig) => {
    const isDesktopGridCard = (
        typeof window !== 'undefined' &&
        layoutMode === 'grid' &&
        !isBig &&
        window.matchMedia(PRODUCT_CARD_DESKTOP_QUERY).matches
    );

    if (isDesktopGridCard) {
        return {
            nearMargin: PRODUCT_CARD_DESKTOP_NEAR_MARGIN,
            rootMargin: `${PRODUCT_CARD_DESKTOP_NEAR_MARGIN.before}px 0px ${PRODUCT_CARD_DESKTOP_NEAR_MARGIN.after}px 0px`,
        };
    }

    return {
        nearMargin: PRODUCT_CARD_DEFAULT_NEAR_MARGIN,
        rootMargin: `${PRODUCT_CARD_DEFAULT_NEAR_MARGIN.before}px 0px ${PRODUCT_CARD_DEFAULT_NEAR_MARGIN.after}px 0px`,
    };
};

/**
 * COMPOSANT : CARTE PRODUIT (DESIGN ARCHITECTURAL v3)
 * - Actions: "Ajouter à la sélection" (Bookmark) + "Détail" (Eye).
 * - Suppression des commentaires/sociaux.
 * - Amélioration Typo & Espacements.
 */
const ProductCard = ({
    item,
    layoutMode,
    isBig,
    compact,
    onClick,
    onPrefetch,
    onAddToCart,
    isLiked,
    onToggleLike,
    priority = false,
    suspendImageWarmup = false
}) => {
    const cardRef = React.useRef(null);
    const touchIntentRef = React.useRef(null);
    const touchOpenHandledRef = React.useRef(false);
    const hoverWarmupTimerRef = React.useRef(null);
    const primaryWarmupStartedRef = React.useRef(false);
    const isMountedRef = React.useRef(false);
    const imageRequestedRef = React.useRef(priority);
    const imageRequestQueuedRef = React.useRef(false);
    const imageRequestGenerationRef = React.useRef(0);
    const cardImage = React.useMemo(() => getProductCardImage(item), [item]);
    const compactGridSrcSet = cardImage.thumbSrcSet || cardImage.mobileSrcSet;
    const [isImageRequested, setIsImageRequested] = React.useState(priority);
    const [isImageRevealActive, setIsImageRevealActive] = React.useState(priority);
    const [isImageLoaded, setIsImageLoaded] = React.useState(false);
    const shouldRequestImage = priority || isImageRequested;
    const handleImageLoad = React.useCallback((event) => {
        if (event.currentTarget.dataset.realImage !== 'true') return;
        setIsImageLoaded(true);
        const image = event.currentTarget;
        rememberInstantProductDetailImage(item, {
            src: image.currentSrc || image.src,
            index: 0,
            width: image.naturalWidth,
            height: image.naturalHeight,
        });
        scheduleProductDetailModuleWarmup();
    }, [item]);

    const rememberCurrentCardImageForDetail = React.useCallback(() => {
        const image = cardRef.current?.querySelector('img[data-real-image="true"]');
        const src = image?.currentSrc || image?.src || cardImage.src;
        rememberInstantProductDetailImage(item, {
            src,
            index: 0,
            width: image?.naturalWidth || 0,
            height: image?.naturalHeight || 0,
        });
    }, [cardImage.src, item]);
    const canWarmupImages = React.useCallback(() => {
        if (suspendImageWarmup) return false;
        const connection = typeof navigator !== 'undefined'
            ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection)
            : null;
        return !(connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || ''));
    }, [suspendImageWarmup]);
    const warmupPrimaryDetailImage = React.useCallback((options = {}) => {
        if (!canWarmupImages()) return;
        onPrefetch?.(item.id);
        warmProductDetailModule()?.catch(() => {});
        if (primaryWarmupStartedRef.current && !options.force) return;
        primaryWarmupStartedRef.current = true;
        preloadPrimaryProductDetailImage(item, {
            priority: options.priority || 'high',
            decode: options.decode !== false,
            srcSet: options.srcSet ?? false,
            variant: options.variant || 'medium',
        });
    }, [canWarmupImages, item, onPrefetch]);
    const warmupDetailImages = React.useCallback(() => {
        if (!canWarmupImages()) return;
        warmupPrimaryDetailImage();
        preloadProductImages(item, {
            radius: 1,
            priority: 'low',
            neighborPriority: 'low',
            decode: false,
            srcSet: false,
            variant: 'medium',
        });
    }, [canWarmupImages, item, warmupPrimaryDetailImage]);
    const prefetchProductIntent = React.useCallback(() => {
        if (!canWarmupImages()) return;
        warmupPrimaryDetailImage();
        warmupDetailImages();
    }, [canWarmupImages, warmupDetailImages, warmupPrimaryDetailImage]);

    const requestCardImage = React.useCallback((options = {}) => {
        if (imageRequestedRef.current || imageRequestQueuedRef.current) return;

        const generation = imageRequestGenerationRef.current;
        imageRequestQueuedRef.current = true;

        enqueueProductCardImageRequest(() => {
            if (!isMountedRef.current || imageRequestGenerationRef.current !== generation) return;

            imageRequestQueuedRef.current = false;
            if (imageRequestedRef.current) return;

            imageRequestedRef.current = true;
            const update = () => setIsImageRequested(true);
            if (!options.priority && typeof React.startTransition === 'function') {
                React.startTransition(update);
                return;
            }
            update();
        }, { priority: options.priority });
    }, []);

    const warmupDetailImagesAfterOpen = React.useCallback(() => {
        if (typeof window === 'undefined') {
            warmupDetailImages();
            return;
        }

        window.setTimeout(() => {
            const run = () => {
                if (typeof window.requestAnimationFrame === 'function') {
                    window.requestAnimationFrame(warmupDetailImages);
                    return;
                }
                warmupDetailImages();
            };

            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(run, { timeout: 1200 });
                return;
            }

            run();
        }, 700);
    }, [warmupDetailImages]);

    React.useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    React.useEffect(() => {
        imageRequestGenerationRef.current += 1;
        imageRequestedRef.current = priority;
        imageRequestQueuedRef.current = false;
        primaryWarmupStartedRef.current = false;
        setIsImageRequested(priority);
        setIsImageRevealActive(priority);
        setIsImageLoaded(false);
    }, [cardImage.src, item?.id, priority]);

    React.useEffect(() => {
        if (priority) {
            imageRequestedRef.current = true;
            setIsImageRequested(true);
            setIsImageRevealActive(true);
            return undefined;
        }

        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
            imageRequestedRef.current = true;
            setIsImageRequested(true);
            setIsImageRevealActive(true);
            return undefined;
        }

        const node = cardRef.current?.querySelector('.product-card-media');
        if (!node) return undefined;

        const root = getProductCardObserverRoot(node);
        const requestSettings = getProductCardRequestSettings(layoutMode, isBig);
        const revealFallbackTimer = window.setTimeout(() => {
            const { isNear, isVisible } = getProductCardViewportState(node, root, requestSettings.nearMargin);
            if (isNear) requestCardImage({ priority: isVisible });
            if (isVisible) setIsImageRevealActive(true);
        }, 1400);

        const requestObserver = new IntersectionObserver((entries) => {
            const isNearViewport = entries.some((entry) => entry.isIntersecting);
            if (isNearViewport) {
                requestCardImage();
                requestObserver.disconnect();
            }
        }, {
            root,
            rootMargin: requestSettings.rootMargin,
            threshold: 0.01,
        });

        const revealObserver = new IntersectionObserver((entries) => {
            const isInViewport = entries.some((entry) => entry.isIntersecting);
            if (isInViewport) {
                window.clearTimeout(revealFallbackTimer);
                requestCardImage({ priority: true });
                setIsImageRevealActive(true);
                revealObserver.disconnect();
            }
        }, {
            root,
            rootMargin: '0px',
            threshold: 0.01,
        });

        requestObserver.observe(node);
        revealObserver.observe(node);

        return () => {
            window.clearTimeout(revealFallbackTimer);
            requestObserver.disconnect();
            revealObserver.disconnect();
        };
    }, [cardImage.src, isBig, layoutMode, priority, requestCardImage]);

    React.useEffect(() => () => {
        if (hoverWarmupTimerRef.current) {
            window.clearTimeout(hoverWarmupTimerRef.current);
        }
    }, []);

    const isActionTarget = (target) => {
        return Boolean(target?.closest?.('button, input, textarea, select, [data-card-action]'));
    };

    const scheduleHoverWarmup = () => {
        if (typeof window === 'undefined' || suspendImageWarmup) return;
        if (hoverWarmupTimerRef.current) window.clearTimeout(hoverWarmupTimerRef.current);

        hoverWarmupTimerRef.current = window.setTimeout(() => {
            hoverWarmupTimerRef.current = null;
            prefetchProductIntent();
        }, 180);
    };

    const cancelHoverWarmup = () => {
        if (!hoverWarmupTimerRef.current || typeof window === 'undefined') return;
        window.clearTimeout(hoverWarmupTimerRef.current);
        hoverWarmupTimerRef.current = null;
    };

    const resetTouchOpenHandled = () => {
        window.setTimeout(() => {
            touchOpenHandledRef.current = false;
        }, 350);
    };

    const handleTouchPointerDown = (e) => {
        if (e.pointerType !== 'touch' || isActionTarget(e.target)) {
            touchIntentRef.current = null;
            return;
        }

        touchIntentRef.current = {
            pointerId: e.pointerId,
            x: e.clientX,
            y: e.clientY,
        };
    };

    const handleTouchPointerUp = (e) => {
        const intent = touchIntentRef.current;
        touchIntentRef.current = null;

        if (e.pointerType !== 'touch' || !intent || intent.pointerId !== e.pointerId || isActionTarget(e.target) || !onClick) {
            return;
        }

        const deltaX = Math.abs(e.clientX - intent.x);
        const deltaY = Math.abs(e.clientY - intent.y);
        const isTap = deltaX <= 18 && deltaY <= 18;

        if (!isTap) return;

        e.preventDefault();
        touchOpenHandledRef.current = true;
        rememberCurrentCardImageForDetail();
        warmupPrimaryDetailImage({ priority: 'high', decode: true, variant: 'medium', srcSet: false });
        onClick();
        warmupDetailImagesAfterOpen();
        resetTouchOpenHandled();
    };

    return (
        <a
            ref={cardRef}
            href={getProductUrl(item)}
            draggable={false}
            onPointerDown={handleTouchPointerDown}
            onPointerEnter={(e) => {
                if (e.pointerType !== 'touch') scheduleHoverWarmup();
            }}
            onFocus={() => scheduleHoverWarmup()}
            onBlur={cancelHoverWarmup}
            onPointerLeave={cancelHoverWarmup}
            onPointerUp={handleTouchPointerUp}
            onPointerCancel={() => { touchIntentRef.current = null; }}
            onClick={(e) => {
                if (touchOpenHandledRef.current) {
                    e.preventDefault();
                    touchOpenHandledRef.current = false;
                    return;
                }

                // Allow Ctrl/Cmd + Click to open in new tab (native browser behavior)
                // Otherwise prevent default and let parent handle selection logic
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    if (onClick) {
                        rememberCurrentCardImageForDetail();
                        warmupPrimaryDetailImage({ priority: 'high', decode: true });
                        onClick();
                        warmupDetailImagesAfterOpen();
                    }
                }
            }}
            className={`group relative flex touch-manipulation flex-col ${compact ? 'gap-3 md:gap-6' : 'gap-6'} w-full cursor-pointer text-inherit no-underline ${layoutMode === 'list' ? 'flex-row items-center gap-12 border-b border-stone-200 dark:border-stone-800 pb-12' : ''}`}
        >

            {/* 1. VISUAL BLOCK */}
            <div
                className={`product-card-media relative bg-[#fbfaf8] dark:bg-[#1A1A1A] overflow-hidden rounded-[12px] ${layoutMode === 'list' ? 'w-1/3 aspect-[4/3]' : 'w-full aspect-[3/4]'} ${isBig ? 'md:aspect-[16/10]' : ''}`}
                data-image-reveal={isImageRevealActive ? 'visible' : 'pending'}
                data-image-loaded={isImageLoaded ? 'true' : 'false'}
            >
                <picture className="block h-full w-full">
                    {shouldRequestImage && compactGridSrcSet && (
                        <>
                            <source
                                media="(max-width: 767px)"
                                srcSet={compactGridSrcSet}
                                sizes="50vw"
                            />
                            {!isBig && layoutMode === 'grid' && (
                                <source
                                    media="(min-width: 1024px)"
                                    srcSet={compactGridSrcSet}
                                    sizes="(max-width: 1279px) 25vw, 20vw"
                                />
                            )}
                        </>
                    )}
                    <img
                        src={shouldRequestImage ? cardImage.src : TRANSPARENT_IMAGE_SRC}
                        srcSet={shouldRequestImage ? (cardImage.srcSet || undefined) : undefined}
                        sizes={PRODUCT_CARD_IMAGE_SIZES}
                        alt={item.name}
                        draggable={false}
                        data-real-image={shouldRequestImage ? 'true' : 'false'}
                        className="product-card-image h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] lg:group-hover:scale-[1.03]"
                        loading={priority && !suspendImageWarmup ? 'eager' : 'lazy'}
                        decoding="async"
                        fetchPriority={priority && !suspendImageWarmup ? 'high' : 'auto'}
                        onLoad={handleImageLoad}
                    />
                </picture>

                {/* PREMIUM OVERLAY (Museum Gallery Hook - Desktop Only) */}
                {/* PREMIUM OVERLAY (Museum Gallery Hook - Desktop Only, Responsive FLUID 1536px+ -> Infinite - REFINED SPACE) */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hidden lg:flex items-center justify-center">
                    <div className="relative py-7 px-10 xl:py-7 xl:px-8 2xl:py-[2.5vw] 2xl:px-[3vw] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col items-center gap-3 xl:gap-3 2xl:gap-[1vw]">
                        {/* Minimal Architectural Frame (Corners - Fluid Size) */}
                        <div className="absolute top-0 left-0 w-3 h-3 xl:w-3 xl:h-3 2xl:w-[0.9vw] 2xl:h-[0.9vw] border-t border-l border-white/40 translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 xl:w-3 xl:h-3 2xl:w-[0.9vw] 2xl:h-[0.9vw] border-t border-r border-white/40 -translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 xl:w-3 xl:h-3 2xl:w-[0.9vw] 2xl:h-[0.9vw] border-b border-l border-white/40 translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 xl:w-3 xl:h-3 2xl:w-[0.9vw] 2xl:h-[0.9vw] border-b border-r border-white/40 -translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]"></div>

                        <span className="text-[9px] xl:text-[10px] 2xl:text-[0.6vw] font-sans font-black tracking-[0.4em] xl:tracking-[0.3em] 2xl:tracking-[0.5em] uppercase text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
                            Découvrir
                        </span>
                        <div className="w-8 xl:w-8 2xl:w-[2.5vw] h-[1.5px] bg-white/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] origin-center"></div>
                    </div>
                </div>



                {/* QUICK ACTIONS: + panier / ♥ wishlist */}
                {(onAddToCart || onToggleLike) && !item.sold && (
                    <div className="absolute right-2 top-2 flex flex-col gap-1.5 z-20 opacity-100 transition-opacity duration-300 md:right-3 md:top-3 md:gap-2 lg:opacity-0 lg:group-hover:opacity-100">
                        {onAddToCart && (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(item); }}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white shadow-md transition-colors hover:bg-amber-600 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-amber-500 dark:hover:text-white md:h-9 md:w-9"
                                title="Ajouter au panier"
                            >
                                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" strokeWidth={2.5} />
                            </button>
                        )}
                        {onToggleLike && (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleLike(item); }}
                                className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-colors md:h-9 md:w-9 ${isLiked ? 'bg-rose-500 text-white' : 'bg-white/90 text-stone-700 hover:bg-rose-500 hover:text-white'}`}
                                title={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            >
                                <Heart className="h-[13px] w-[13px] md:h-[15px] md:w-[15px]" strokeWidth={2} fill={isLiked ? 'currentColor' : 'none'} />
                            </button>
                        )}
                    </div>
                )}

            </div>

            {/* 2. INFO BLOCK (Refined Responsive Layout) */}
            {/* compact = mobile 2-col mode. md: overrides restore desktop original layout */}
            <div className={`flex ${compact ? 'flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-4' : 'items-start justify-between gap-2 md:gap-4'} ${layoutMode === 'list' ? 'flex-1 pt-6' : compact ? 'pt-1 md:pt-4' : 'pt-4'}`}>
                {/* Left Side: Material & Name */}
                <div className="flex flex-col gap-0.5 md:gap-1 flex-1 min-w-0">
                    <div className={`opacity-50 dark:opacity-40 font-black uppercase tracking-widest truncate ${compact ? 'text-[8px] md:text-[9px]' : 'text-[9px]'}`}>
                        {item.material || 'Matière Inconnue'}
                    </div>
                    <h3 className={`font-serif leading-tight ${compact ? 'text-[13px] md:text-lg lg:text-xl' : 'text-[15px] md:text-lg lg:text-xl'} ${layoutMode === 'list' ? 'text-4xl' : ''}`}>
                        {item.name}
                    </h3>
                </div>

                {/* Right Side: Stock & Price */}
                <div className={`flex ${compact ? 'flex-row items-center justify-between md:flex-col md:items-end' : 'flex-col items-end'} shrink-0 text-right gap-0.5 md:gap-1`}>
                    <div className={`opacity-50 dark:opacity-40 font-black uppercase tracking-widest whitespace-nowrap ${compact ? 'text-[8px] md:text-[9px]' : 'text-[9px]'}`}>
                        {item.sold ? 'Stock: 0' : `Stock: ${item.stock !== undefined ? item.stock : 1}`}
                    </div>
                    <p className={`font-bold tabular-nums ${compact ? 'text-[10px] md:text-xs lg:text-sm' : 'text-[11px] md:text-xs lg:text-sm'} ${item.sold ? 'text-red-500' : ''} whitespace-nowrap`}>
                        {item.sold ? 'VENDU' : (item.priceOnRequest ? '' : (item.currentPrice || item.startingPrice) + ' €')}
                    </p>
                </div>
            </div>
        </a>
    );
};

export default React.memo(ProductCard, (prev, next) => {
    return prev.item?.id === next.item?.id &&
           prev.item?.updatedAt === next.item?.updatedAt &&
           prev.item?.name === next.item?.name &&
           prev.item?.material === next.item?.material &&
           prev.item?.sold === next.item?.sold &&
           prev.item?.stock === next.item?.stock &&
           prev.item?.currentPrice === next.item?.currentPrice &&
           prev.item?.startingPrice === next.item?.startingPrice &&
           prev.item?.priceOnRequest === next.item?.priceOnRequest &&
           prev.layoutMode === next.layoutMode &&
           prev.isBig === next.isBig &&
           prev.compact === next.compact &&
           prev.isLiked === next.isLiked &&
           prev.priority === next.priority &&
           prev.suspendImageWarmup === next.suspendImageWarmup &&
           prev.onPrefetch === next.onPrefetch &&
           prev.item?.images === next.item?.images &&
           prev.item?.imageVariants === next.item?.imageVariants &&
           prev.item?.imageMetadata === next.item?.imageMetadata &&
           prev.item?.thumbnailUrl === next.item?.thumbnailUrl;
});
