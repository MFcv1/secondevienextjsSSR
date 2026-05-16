import React, { useState, useEffect, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';
import { ChevronLeft, ChevronRight, Box, ArrowRight, X, Maximize2, ShoppingBag, Heart, AlignLeft } from 'lucide-react';
import KIT_CONFIG from '../config/constants';
import { getProductUrl } from '../../utils/slug';
import { PRODUCT_DETAIL_IMAGE_SIZES, getProductImageItems, preloadImage } from '../../utils/imageUtils';
import SEO from '../shared/SEO';

import { useLiveTheme } from '../config/theme';
import AnimatedPrice from '../ui/AnimatedPrice';

// ANIMATIONS PREMIUM
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import SplitType from 'split-type';
import { motion, AnimatePresence } from 'framer-motion';

const TALL_PRODUCT_IMAGE_RATIO = 0.72;
const DEFAULT_PRODUCT_IMAGE_RATIO = 0.75;
const MOBILE_DETAIL_MAX_WIDTH = 430;
const MOBILE_DETAIL_MAX_HEIGHT = 620;
const MOBILE_LIGHTBOX_MAX_WIDTH = 720;
const MOBILE_LIGHTBOX_MAX_HEIGHT = 860;
const MOBILE_DETAIL_RESERVED_REM = 15.5;
const DEFAULT_DETAIL_BACKDROP_COLOR = '#fafaf9';

const getProductImageFitMode = (ratio) => (
    Number.isFinite(ratio) && ratio > 0 && ratio < TALL_PRODUCT_IMAGE_RATIO ? 'tall' : 'standard'
);

const roundPixel = (value) => Math.round(value * 10) / 10;

const fitBoxToRatio = (ratio, maxWidth, maxHeight) => {
    const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : DEFAULT_PRODUCT_IMAGE_RATIO;
    let width = Math.max(1, maxWidth);
    let height = width / safeRatio;

    if (height > maxHeight) {
        height = Math.max(1, maxHeight);
        width = height * safeRatio;
    }

    return {
        width: `${roundPixel(width)}px`,
        height: `${roundPixel(height)}px`,
        maxWidth: `${roundPixel(maxWidth)}px`,
        maxHeight: `${roundPixel(maxHeight)}px`,
    };
};

const getViewportBox = () => {
    if (typeof window === 'undefined') return { width: 0, height: 0, rem: 16 };

    const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;

    return {
        width: Math.round(window.visualViewport?.width || window.innerWidth || 0),
        height: Math.round(window.visualViewport?.height || window.innerHeight || 0),
        rem: rootFontSize,
    };
};

const getMobileDetailImageStyle = (ratio, viewport) => {
    const viewportWidth = viewport?.width || (typeof window !== 'undefined' ? window.innerWidth : 390);
    const viewportHeight = viewport?.height || (typeof window !== 'undefined' ? window.innerHeight : 844);
    const rem = viewport?.rem || 16;
    const maxWidth = Math.min(viewportWidth * 0.94, MOBILE_DETAIL_MAX_WIDTH);
    const reservedHeight = MOBILE_DETAIL_RESERVED_REM * rem;
    const maxHeight = Math.max(80, Math.min(
        viewportHeight * 0.62,
        viewportHeight - reservedHeight,
        MOBILE_DETAIL_MAX_HEIGHT
    ));

    return fitBoxToRatio(ratio, maxWidth, maxHeight);
};

const getMobileLightboxImageStyle = (ratio, viewport) => {
    const viewportWidth = viewport?.width || (typeof window !== 'undefined' ? window.innerWidth : 390);
    const viewportHeight = viewport?.height || (typeof window !== 'undefined' ? window.innerHeight : 844);

    if (viewportWidth >= 1024) return {};

    return fitBoxToRatio(
        ratio,
        Math.min(Math.max(1, viewportWidth - 8), MOBILE_LIGHTBOX_MAX_WIDTH),
        Math.min(Math.max(1, viewportHeight - 8), MOBILE_LIGHTBOX_MAX_HEIGHT)
    );
};

const buildProductImagePreloadOrder = (length, activeIndex) => {
    if (length <= 0) return [];
    const safeActive = Math.max(0, Math.min(activeIndex, length - 1));
    const indexes = [];
    const seen = new Set();
    const add = (index) => {
        if (index < 0 || index >= length || seen.has(index)) return;
        seen.add(index);
        indexes.push(index);
    };

    add(safeActive);
    for (let offset = 1; offset <= 3; offset += 1) {
        add(safeActive + offset);
        add(safeActive - offset);
    }
    for (let index = 0; index < length; index += 1) add(index);

    return indexes;
};

const LIGHTBOX_IMAGE_SIZES = '100vw';

const getLightboxImageSrc = (image) => (
    image?.full || image?.large || image?.src || image?.medium || image?.card || image?.thumb || ''
);

const preloadLightboxImage = (image, options = {}) => {
    const src = getLightboxImageSrc(image);
    if (!src) return Promise.resolve(null);

    return preloadImage(src, {
        priority: options.priority || 'auto',
        srcSet: image?.srcSet || undefined,
        sizes: LIGHTBOX_IMAGE_SIZES,
        decode: options.decode !== false,
        decoding: 'async',
    }).catch(() => null);
};

const getDetailBackdropImageSrc = (image) => (
    image?.thumb || image?.card || image?.medium || image?.src || image?.full || ''
);

const preloadDetailBackdropImage = (image, options = {}) => {
    const src = getDetailBackdropImageSrc(image);
    if (!src) return Promise.resolve(null);

    return preloadImage(src, {
        priority: options.priority || 'high',
        decode: options.decode === true,
        decoding: 'async',
    }).catch(() => null);
};

const stagedProductDetailImageCache = new Map();

const getProductDetailStageKey = (image) => {
    if (typeof window === 'undefined') return image?.src || image?.full || '';
    const width = Math.round(window.visualViewport?.width || window.innerWidth || 0);
    const dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100;
    return [
        image?.src || image?.full || '',
        image?.srcSet || '',
        width,
        dpr,
    ].join('|');
};

const waitForImageFrame = () => new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
        resolve();
        return;
    }

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
    });
});

const resolveStagedProductDetailImage = async (image) => {
    if (!image || typeof window === 'undefined') return null;

    const fallbackSrc = image.src || image.full || image.medium || image.card || image.thumb || '';
    if (!fallbackSrc) return null;

    const cacheKey = getProductDetailStageKey(image);
    const cached = stagedProductDetailImageCache.get(cacheKey);
    if (cached) return cached;

    const promise = new Promise((resolve) => {
        const stageWrapper = document.createElement('div');
        const stageImage = new Image();

        stageWrapper.setAttribute('aria-hidden', 'true');
        stageWrapper.style.position = 'fixed';
        stageWrapper.style.left = '-10000px';
        stageWrapper.style.top = '0';
        stageWrapper.style.width = 'min(94vw, 430px)';
        stageWrapper.style.height = '573px';
        stageWrapper.style.overflow = 'hidden';
        stageWrapper.style.borderRadius = '12px';
        stageWrapper.style.opacity = '0.001';
        stageWrapper.style.pointerEvents = 'none';
        stageWrapper.style.zIndex = '-1';

        stageImage.decoding = 'async';
        stageImage.loading = 'eager';
        if ('fetchPriority' in stageImage) stageImage.fetchPriority = 'high';
        if (image.srcSet) {
            stageImage.srcset = image.srcSet;
            stageImage.sizes = PRODUCT_DETAIL_IMAGE_SIZES;
        }
        stageImage.alt = '';
        stageImage.draggable = false;
        stageImage.style.display = 'block';
        stageImage.style.width = '100%';
        stageImage.style.height = '100%';
        stageImage.style.objectFit = 'contain';
        stageImage.style.borderRadius = 'inherit';

        const cleanup = () => {
            stageWrapper.remove();
        };

        const finish = async () => {
            const currentSrc = stageImage.currentSrc || stageImage.src || fallbackSrc;
            const width = stageImage.naturalWidth || 0;
            const height = stageImage.naturalHeight || 0;
            const ratio = width > 0 && height > 0 ? width / height : null;

            try {
                if (typeof stageImage.decode === 'function') await stageImage.decode();
            } catch {
                // If load completed, decode failures should not block the prepared swap.
            }

            await waitForImageFrame();
            cleanup();
            resolve({ src: currentSrc, ratio, width, height });
        };

        stageImage.onload = finish;
        stageImage.onerror = () => {
            cleanup();
            resolve({ src: fallbackSrc, ratio: null, width: 0, height: 0 });
        };

        stageWrapper.appendChild(stageImage);
        document.body.appendChild(stageWrapper);
        stageImage.src = fallbackSrc;
    }).catch(() => ({ src: fallbackSrc, ratio: null, width: 0, height: 0 }));

    stagedProductDetailImageCache.set(cacheKey, promise);
    return promise;
};

const ArchitecturalProductDetail = ({ item, onBack, onAddToCart, onOpenCart, darkMode, setHeaderProps, cartItems = [], toggleTheme, onOpenMenu }) => {
    const { palette } = useLiveTheme();
    const containerRef = useRef(null);
    const thumbListRef = useRef(null);
    const mobileThumbListRef = useRef(null);
    const mobileShellRef = useRef(null);
    const mobileThumbLayerRef = useRef(null);
    const mobileImageStageRef = useRef(null);
    const desktopImageStageRef = useRef(null);
    const lightboxImageStageRef = useRef(null);
    const mobileSummaryLayerRef = useRef(null);
    const mobileOriginBadgeRef = useRef(null);
    const wheelAcc = useRef(0);
    const mobileImageSwapRef = useRef({ token: 0, releaseTimer: null });
    const mobileDisplayedImageIndexRef = useRef(0);
    const [activeImg, setActiveImg] = useState(0);
    const [mobileDisplayedImageIndex, setMobileDisplayedImageIndex] = useState(0);
    const [mobilePreviousImageIndex, setMobilePreviousImageIndex] = useState(null);
    const [mobileStagedImages, setMobileStagedImages] = useState({});

    // MOBILE PANEL STATE
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

    // LIGHTBOX STATE
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxZoom, setLightboxZoom] = useState(1);
    const [lightboxOffset, setLightboxOffset] = useState({ x: 0, y: 0 });
    const [isLightboxGesturing, setIsLightboxGesturing] = useState(false);
    const [showZoomHint, setShowZoomHint] = useState(false);
    const [imageAspectRatios, setImageAspectRatios] = useState({});
    const [viewportBox, setViewportBox] = useState(getViewportBox);
    const [isDesktopDetailViewport, setIsDesktopDetailViewport] = useState(() => (
        typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
    ));
    const [displayedDetailBackdrop, setDisplayedDetailBackdrop] = useState({ src: '', color: '' });
    const [hasPrimaryImagePainted, setHasPrimaryImagePainted] = useState(false);

    // REF pour isoler le scroll de la description
    const descScrollRef = useRef(null);
    const lightboxZoomRef = useRef(1);
    const lightboxOffsetRef = useRef({ x: 0, y: 0 });
    const lightboxRafRef = useRef(null);
    const zoomHintTimerRef = useRef(null);
    const mobileImagePressRef = useRef({ started: false, pointerId: null, at: 0 });
    const lightboxGestureRef = useRef({
        mode: null,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        startDistance: 0,
        startZoom: 1,
        startCenter: { x: 0, y: 0 },
        startOffset: { x: 0, y: 0 },
        lastTap: 0,
    });

    useEffect(() => {
        const el = descScrollRef.current;
        if (!el) return;
        
        const handleWheel = (e) => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            const isAtTop = scrollTop <= 0;
            const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;
            
            if (isAtTop && e.deltaY < 0) {
                e.preventDefault(); // Bloque le scroll vers le haut de la page globale
            } else if (isAtBottom && e.deltaY > 0) {
                e.preventDefault(); // Bloque le scroll vers le bas de la page globale
            }
            
            e.stopPropagation();
        };
        
        // Il est impératif d'utiliser passive: false si on veut intercepter preventDefault sur le wheel
        el.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => el.removeEventListener('wheel', handleWheel);
    }, []);


    // TOUCH SWIPE STATE (Mobile) — Optimized for 120Hz
    const touchState = useRef({ startX: 0, startY: 0, endX: 0, endY: 0, startTime: 0, axisLocked: false, axis: null, isSwipingBack: false, isPullingDownToGallery: false });
    const descriptionTouchState = useRef({ startY: 0, scrollTop: 0, isScrollable: false, startedAtTop: false, isClosingFromTop: false });
    const rafId = useRef(null);
    const backSwipeTimerRef = useRef(null);
    const galleryExitTimerRef = useRef(null);
    const wheelExitResetTimerRef = useRef(null);
    const wheelExitAccumulatorRef = useRef(0);
    const isClosingToGalleryRef = useRef(false);
    const screenWidth = useRef(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const minSwipeDistance = 40;
    const galleryExitReleaseMs = 260;
    const galleryExitResetMs = 360;

    const clampProgress = (value) => Math.max(0, Math.min(1, value));
    const getViewportHeight = () => window.visualViewport?.height || window.innerHeight || 800;
    const getGalleryExitBackground = (alpha) => {
        const safeAlpha = clampProgress(alpha);
        return darkMode ? `rgba(14, 14, 14, ${safeAlpha})` : `rgba(232, 217, 198, ${safeAlpha})`;
    };

    const setGalleryExitTransition = (mode) => {
        const root = containerRef.current;
        const shell = mobileShellRef.current;
        const thumbs = mobileThumbLayerRef.current;
        const image = mobileImageStageRef.current;
        const summary = mobileSummaryLayerRef.current;
        const origin = mobileOriginBadgeRef.current;

        if (mode === 'tracking') {
            [root, shell, thumbs, image, summary, origin].forEach((el) => {
                if (el) el.style.transition = 'none';
            });
            return;
        }

        if (root) root.style.transition = 'background-color 0.24s ease-out';
        if (shell) shell.style.transition = 'background-color 0.24s ease-out';
        if (image) image.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.16s ease-out';
        if (summary) summary.style.transition = 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease-out';
        if (origin) origin.style.transition = 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease-out';
        if (thumbs) thumbs.style.transition = 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s ease-out';
    };

    const applyLayeredGalleryExit = (progress) => {
        const p = clampProgress(progress);
        const vh = getViewportHeight();
        const root = containerRef.current;
        const shell = mobileShellRef.current;
        const thumbs = mobileThumbLayerRef.current;
        const image = mobileImageStageRef.current;
        const summary = mobileSummaryLayerRef.current;
        const origin = mobileOriginBadgeRef.current;
        const backgroundAlpha = 1 - clampProgress(p * 1.05);

        if (root) {
            root.style.willChange = 'background-color';
            root.style.backgroundColor = getGalleryExitBackground(backgroundAlpha);
        }
        if (shell) {
            shell.style.willChange = 'background-color';
            shell.style.backgroundColor = getGalleryExitBackground(backgroundAlpha);
        }

        if (image) {
            const imageProgress = clampProgress(p * 1.48);
            image.style.willChange = 'transform, opacity';
            image.style.transform = `translate3d(0, ${p * vh * 0.54}px, 0) scale(${1 - imageProgress * 0.035})`;
            image.style.opacity = `${1 - imageProgress}`;
        }

        if (summary) {
            summary.style.willChange = 'transform, opacity';
            summary.style.transform = `translate3d(0, ${p * vh * 0.28}px, 0)`;
            summary.style.opacity = `${1 - Math.pow(p, 1.18)}`;
        }

        if (origin) {
            origin.style.willChange = 'transform, opacity';
            origin.style.transform = `translate3d(0, ${p * vh * 0.2}px, 0)`;
            origin.style.opacity = `${1 - Math.pow(p, 1.28)}`;
        }

        if (thumbs) {
            thumbs.style.willChange = 'transform, opacity';
            thumbs.style.transform = `translate3d(0, ${-p * vh * 0.17}px, 0)`;
            thumbs.style.opacity = `${1 - Math.pow(p, 1.85)}`;
        }
    };

    const clearLayeredGalleryExitStyles = () => {
        [mobileThumbLayerRef.current, mobileImageStageRef.current, mobileSummaryLayerRef.current, mobileOriginBadgeRef.current].forEach((el) => {
            if (!el) return;
            el.style.transition = '';
            el.style.transform = '';
            el.style.opacity = '';
            el.style.willChange = '';
        });

        [containerRef.current, mobileShellRef.current].forEach((el) => {
            if (!el) return;
            el.style.transition = '';
            el.style.backgroundColor = '';
            el.style.willChange = '';
            el.style.pointerEvents = '';
        });
    };

    const isClosingToGallery = () => isClosingToGalleryRef.current;

    const resetSwipeStyles = () => {
        if (!containerRef.current) return;
        containerRef.current.style.transition = '';
        containerRef.current.style.transform = '';
        containerRef.current.style.opacity = '';
        containerRef.current.style.willChange = '';
    };

    const resetGalleryExitStyles = () => {
        if (!containerRef.current || isClosingToGalleryRef.current) return;
        if (galleryExitTimerRef.current) clearTimeout(galleryExitTimerRef.current);

        setGalleryExitTransition('settle');
        mobileImageStageRef.current?.getBoundingClientRect();
        applyLayeredGalleryExit(0);

        const cleanup = () => {
            if (!isClosingToGalleryRef.current) clearLayeredGalleryExitStyles();
        };

        galleryExitTimerRef.current = setTimeout(cleanup, galleryExitResetMs);
    };

    const closeToGallery = () => {
        if (isClosingToGalleryRef.current || !containerRef.current) return;

        isClosingToGalleryRef.current = true;
        if (galleryExitTimerRef.current) clearTimeout(galleryExitTimerRef.current);
        if (wheelExitResetTimerRef.current) clearTimeout(wheelExitResetTimerRef.current);

        setGalleryExitTransition('settle');
        mobileImageStageRef.current?.getBoundingClientRect();
        applyLayeredGalleryExit(1);
        containerRef.current.style.pointerEvents = 'none';
        document.documentElement.classList.remove('product-detail-scroll-lock');
        document.body.classList.remove('product-detail-scroll-lock');

        let didFinish = false;
        const finish = () => {
            if (didFinish) return;
            didFinish = true;
            onBack();
        };

        galleryExitTimerRef.current = setTimeout(finish, galleryExitReleaseMs);
    };

    const prepareBackSwipe = () => {
        if (!containerRef.current) return;
        touchState.current.isSwipingBack = true;
        containerRef.current.style.willChange = 'transform, opacity';
        containerRef.current.style.transition = 'none';
    };

    const prepareGalleryPullDown = () => {
        if (!containerRef.current || isMobilePanelOpen || isLightboxOpen) return;
        touchState.current.isPullingDownToGallery = true;
        setGalleryExitTransition('tracking');
    };

    const finishBackSwipe = (dragDistance, velocity) => {
        if (!containerRef.current) return false;
        const shouldExit = (velocity > 0.5 && dragDistance > 34) || dragDistance > screenWidth.current * 0.22;

        containerRef.current.style.transition = 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease-out';
        containerRef.current.style.willChange = 'transform, opacity';

        if (!shouldExit) {
            containerRef.current.style.transform = 'translate3d(0, 0, 0)';
            containerRef.current.style.opacity = '1';
            const cleanup = () => {
                containerRef.current?.removeEventListener('transitionend', cleanup);
                resetSwipeStyles();
            };
            containerRef.current.addEventListener('transitionend', cleanup, { once: true });
            backSwipeTimerRef.current = setTimeout(resetSwipeStyles, 420);
            return true;
        }

        let didFinish = false;
        const finish = () => {
            if (didFinish) return;
            didFinish = true;
            if (backSwipeTimerRef.current) {
                clearTimeout(backSwipeTimerRef.current);
                backSwipeTimerRef.current = null;
            }
            onBack();
        };

        containerRef.current.style.transform = `translate3d(${screenWidth.current + 32}px, 0, 0)`;
        containerRef.current.style.opacity = '0';
        containerRef.current.addEventListener('transitionend', finish, { once: true });
        backSwipeTimerRef.current = setTimeout(finish, 440);
        return true;
    };

    const onTouchStart = (e) => {
        if (isClosingToGallery()) return;

        screenWidth.current = window.innerWidth; // Cache once
        touchState.current.endX = 0;
        touchState.current.endY = 0;
        touchState.current.startX = e.targetTouches[0].clientX;
        touchState.current.startY = e.targetTouches[0].clientY;
        touchState.current.startTime = performance.now();
        touchState.current.axisLocked = false;
        touchState.current.axis = null;
        touchState.current.isSwipingBack = false;
        touchState.current.isPullingDownToGallery = false;
        if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = null; }
        if (backSwipeTimerRef.current) { clearTimeout(backSwipeTimerRef.current); backSwipeTimerRef.current = null; }
        if (galleryExitTimerRef.current) {
            clearTimeout(galleryExitTimerRef.current);
            galleryExitTimerRef.current = null;
            if (!isClosingToGalleryRef.current) clearLayeredGalleryExitStyles();
        }
    };

    const onTouchMove = (e) => {
        if (isClosingToGallery()) return;

        const currentX = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;
        touchState.current.endX = currentX;
        touchState.current.endY = currentY;

        const { startX, startY, axisLocked } = touchState.current;
        const moveX = currentX - startX;
        const moveY = currentY - startY;
        const absX = Math.abs(moveX);
        const absY = Math.abs(moveY);

        // Lock Axis intent once after 10px movement
        if (!axisLocked && (absX > 10 || absY > 10)) {
            if (absX > absY * 1.08) {
                touchState.current.axisLocked = true;
                touchState.current.axis = 'x';
                if (moveX > 0 && activeImg === 0) {
                    prepareBackSwipe();
                }
            } else if (absY > absX * 1.1) {
                touchState.current.axisLocked = true;
                touchState.current.axis = 'y';
                if (moveY > 0 && !isMobilePanelOpen) {
                    prepareGalleryPullDown();
                }
            }
        }

        // rAF-gated 120Hz tracking — only ONE DOM write per rendered frame
        if ((touchState.current.isSwipingBack || touchState.current.isPullingDownToGallery) && !rafId.current) {
            rafId.current = requestAnimationFrame(() => {
                if (containerRef.current && touchState.current.isSwipingBack) {
                    const drag = Math.max(0, touchState.current.endX - touchState.current.startX);
                    // ONLY translate3d — zero paint, zero layout, pure compositor
                    containerRef.current.style.transform = `translate3d(${drag}px, 0, 0)`;
                    containerRef.current.style.opacity = `${Math.max(0.72, 1 - drag / (screenWidth.current * 1.4))}`;
                }
                if (containerRef.current && touchState.current.isPullingDownToGallery) {
                    const drag = Math.max(0, touchState.current.endY - touchState.current.startY);
                    applyLayeredGalleryExit(drag / (getViewportHeight() * 0.34));
                }
                rafId.current = null;
            });
        }
    };

    const onTouchEnd = () => {
        if (isClosingToGallery()) return;

        // Cancel any pending rAF
        if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = null; }

        const { startX, startY, endX, endY, startTime, isSwipingBack, isPullingDownToGallery } = touchState.current;
        if (!startX || !endX) return;
        const dx = startX - endX;
        const dy = startY - endY;
        const dragDistance = Math.max(0, endX - startX);
        const timeElapsed = Math.max(1, performance.now() - startTime);
        const velocity = dragDistance / timeElapsed;
        const isRightIntent = dragDistance > minSwipeDistance && Math.abs(endX - startX) > Math.abs(dy) * 1.05;

        if (isPullingDownToGallery) {
            const pullDistance = Math.max(0, endY - startY);
            const pullVelocity = pullDistance / timeElapsed;
            const shouldExit = (pullVelocity > 0.42 && pullDistance > 38) || pullDistance > window.innerHeight * 0.16;

            touchState.current.isPullingDownToGallery = false;
            if (shouldExit) {
                closeToGallery(pullDistance);
            } else {
                resetGalleryExitStyles();
            }
            return;
        }

        if ((isSwipingBack || (activeImg === 0 && isRightIntent)) && finishBackSwipe(dragDistance, velocity)) {
            return;
        }

        if (isSwipingBack && containerRef.current) {
            const dragDistance = Math.max(0, -dx);
            const timeElapsed = performance.now() - startTime;
            const velocity = dragDistance / timeElapsed; // px/ms

            // Re-enable CSS transitions for the completion animation
            containerRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s cubic-bezier(0.2, 0, 0, 1)';
            containerRef.current.style.willChange = 'auto';

            // SENSITIVITY:
            // Fast flick (>0.6 px/ms + 40px min) → instant close
            // Slow drag → needs 30% screen width
            const isFastFlick = velocity > 0.6 && dragDistance > 40;
            const isDraggedFarEnough = dragDistance > screenWidth.current * 0.3;

            if (isFastFlick || isDraggedFarEnough) {
                // Confirm exit — use pure CSS transition (no JS animation loop = no jank)
                containerRef.current.style.transform = `translate3d(${screenWidth.current}px, 0, 0)`;
                containerRef.current.style.opacity = '0';
                // Wait for transition to finish
                const handler = () => {
                    containerRef.current?.removeEventListener('transitionend', handler);
                    onBack();
                };
                containerRef.current.addEventListener('transitionend', handler, { once: true });
                // Safety fallback
                setTimeout(() => onBack(), 400);
            } else {
                // Cancel exit — snap back with CSS transition
                containerRef.current.style.transform = 'translate3d(0, 0, 0)';
                const handler = () => {
                    if (containerRef.current) {
                        containerRef.current.removeEventListener('transitionend', handler);
                        containerRef.current.style.transition = '';
                        containerRef.current.style.transform = '';
                    }
                };
                containerRef.current.addEventListener('transitionend', handler, { once: true });
                setTimeout(() => {
                    if (containerRef.current) {
                        containerRef.current.style.transition = '';
                        containerRef.current.style.transform = '';
                    }
                }, 450);
            }
            return;
        }

        // Determine primary swipe direction for other actions
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal Swipe
            if (dx > minSwipeDistance) {
                // Swipe Left (Next Image)
                setActiveImg(prev => prev === images.length - 1 ? 0 : prev + 1);
            }
            if (dx < -minSwipeDistance && activeImg > 0) {
                // Swipe Right (Prev Image)
                setActiveImg(prev => prev - 1);
            }
        } else {
            // Vertical Swipe
            if (dy > minSwipeDistance) flushSync(() => setIsMobilePanelOpen(true));
            if (dy < -minSwipeDistance) flushSync(() => setIsMobilePanelOpen(false));
        }
    };

    const handleMobileDetailWheel = (e) => {
        if (window.innerWidth >= 1024 || isMobilePanelOpen || isLightboxOpen || isClosingToGalleryRef.current) return;
        if (e.deltaY <= 0 || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

        e.preventDefault();
        e.stopPropagation();

        if (galleryExitTimerRef.current) {
            clearTimeout(galleryExitTimerRef.current);
            galleryExitTimerRef.current = null;
        }

        wheelExitAccumulatorRef.current += e.deltaY;
        const viewportHeight = getViewportHeight();
        const drag = Math.min(viewportHeight * 0.36, wheelExitAccumulatorRef.current * 0.62);

        setGalleryExitTransition('tracking');
        applyLayeredGalleryExit(drag / (viewportHeight * 0.34));

        if (wheelExitResetTimerRef.current) clearTimeout(wheelExitResetTimerRef.current);

        if (wheelExitAccumulatorRef.current >= 110) {
            closeToGallery(drag);
            return;
        }

        wheelExitResetTimerRef.current = setTimeout(() => {
            wheelExitAccumulatorRef.current = 0;
            resetGalleryExitStyles();
        }, 150);
    };

    const markMobileImagePress = (e) => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) return;
        mobileImagePressRef.current = {
            started: true,
            pointerId: e.pointerId,
            at: typeof performance !== 'undefined' ? performance.now() : Date.now(),
        };
    };

    const clearMobileImagePress = () => {
        mobileImagePressRef.current = { started: false, pointerId: null, at: 0 };
    };

    const openLightboxFromMobileImage = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            const press = mobileImagePressRef.current;
            const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
            clearMobileImagePress();

            if (!press.started || now - press.at > 900) return;
        }

        const { startX, startY, endX, endY, isSwipingBack } = touchState.current;
        const resolvedEndX = endX || startX;
        const resolvedEndY = endY || startY;
        const moved = Math.hypot(resolvedEndX - startX, resolvedEndY - startY);

        if (isSwipingBack || moved > 8) return;
        setIsLightboxOpen(true);
    };

    const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

    const getTouchDistance = (touches) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    };

    const getTouchCenter = (touches) => ({
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
    });

    const clampLightboxOffset = (offset, zoom) => {
        if (zoom <= 1.02) return { x: 0, y: 0 };
        const maxX = (window.innerWidth * (zoom - 1)) / 2;
        const maxY = (window.innerHeight * (zoom - 1)) / 2;
        return {
            x: clampValue(offset.x, -maxX, maxX),
            y: clampValue(offset.y, -maxY, maxY),
        };
    };

    const applyLightboxTransform = (nextZoom, nextOffset = lightboxOffsetRef.current, immediate = false) => {
        const resolvedZoom = clampValue(nextZoom, 1, 4);
        const resolvedOffset = clampLightboxOffset(nextOffset, resolvedZoom);

        lightboxZoomRef.current = resolvedZoom;
        lightboxOffsetRef.current = resolvedOffset;

        if (immediate) {
            if (lightboxRafRef.current) {
                cancelAnimationFrame(lightboxRafRef.current);
                lightboxRafRef.current = null;
            }
            setLightboxZoom(resolvedZoom);
            setLightboxOffset(resolvedOffset);
            return;
        }

        if (!lightboxRafRef.current) {
            lightboxRafRef.current = requestAnimationFrame(() => {
                setLightboxZoom(lightboxZoomRef.current);
                setLightboxOffset(lightboxOffsetRef.current);
                lightboxRafRef.current = null;
            });
        }
    };

    const resetLightboxTransform = () => {
        applyLightboxTransform(1, { x: 0, y: 0 }, true);
        setIsLightboxGesturing(false);
    };

    const hideZoomHint = () => {
        if (zoomHintTimerRef.current) {
            clearTimeout(zoomHintTimerRef.current);
            zoomHintTimerRef.current = null;
        }
        setShowZoomHint(false);
    };

    const toggleLightboxZoomAt = (x = window.innerWidth / 2, y = window.innerHeight / 2) => {
        hideZoomHint();
        if (lightboxZoomRef.current > 1.08) {
            resetLightboxTransform();
            return;
        }

        const nextZoom = 2.65;
        const nextOffset = {
            x: (window.innerWidth / 2 - x) * (nextZoom - 1) * 0.45,
            y: (window.innerHeight / 2 - y) * (nextZoom - 1) * 0.45,
        };
        applyLightboxTransform(nextZoom, nextOffset, true);
    };

    const onLightboxTouchStart = (e) => {
        hideZoomHint();
        const previousLastTap = lightboxGestureRef.current.lastTap || 0;

        if (e.touches.length >= 2) {
            e.preventDefault();
            e.stopPropagation();
            const center = getTouchCenter(e.touches);
            lightboxGestureRef.current = {
                mode: 'pinch',
                startX: center.x,
                startY: center.y,
                endX: center.x,
                endY: center.y,
                startDistance: getTouchDistance(e.touches),
                startZoom: lightboxZoomRef.current,
                startCenter: center,
                startOffset: lightboxOffsetRef.current,
                lastTap: previousLastTap,
            };
            setIsLightboxGesturing(true);
            return;
        }

        const touch = e.touches[0];
        lightboxGestureRef.current = {
            mode: lightboxZoomRef.current > 1.02 ? 'pan' : 'tap',
            startX: touch.clientX,
            startY: touch.clientY,
            endX: touch.clientX,
            endY: touch.clientY,
            startDistance: 0,
            startZoom: lightboxZoomRef.current,
            startCenter: { x: touch.clientX, y: touch.clientY },
            startOffset: lightboxOffsetRef.current,
            lastTap: previousLastTap,
        };
        setIsLightboxGesturing(lightboxZoomRef.current > 1.02);
    };

    const onLightboxTouchMove = (e) => {
        const gesture = lightboxGestureRef.current;

        if (gesture.mode === 'pinch' && e.touches.length >= 2) {
            e.preventDefault();
            e.stopPropagation();
            const center = getTouchCenter(e.touches);
            const nextZoom = gesture.startZoom * (getTouchDistance(e.touches) / Math.max(1, gesture.startDistance));
            const zoomRatio = clampValue(nextZoom, 1, 4) / Math.max(1, gesture.startZoom);
            const nextOffset = {
                x: gesture.startOffset.x * zoomRatio + (center.x - gesture.startCenter.x) + (window.innerWidth / 2 - gesture.startCenter.x) * (zoomRatio - 1),
                y: gesture.startOffset.y * zoomRatio + (center.y - gesture.startCenter.y) + (window.innerHeight / 2 - gesture.startCenter.y) * (zoomRatio - 1),
            };
            applyLightboxTransform(nextZoom, nextOffset);
            return;
        }

        if (!e.touches[0]) return;
        const touch = e.touches[0];
        gesture.endX = touch.clientX;
        gesture.endY = touch.clientY;

        if (lightboxZoomRef.current > 1.02 || gesture.mode === 'pan') {
            e.preventDefault();
            e.stopPropagation();
            const nextOffset = {
                x: gesture.startOffset.x + (touch.clientX - gesture.startX),
                y: gesture.startOffset.y + (touch.clientY - gesture.startY),
            };
            applyLightboxTransform(lightboxZoomRef.current, nextOffset);
        }
    };

    const onLightboxTouchEnd = (e) => {
        const gesture = lightboxGestureRef.current;
        const moved = Math.hypot((gesture.endX || gesture.startX) - gesture.startX, (gesture.endY || gesture.startY) - gesture.startY);
        setIsLightboxGesturing(false);

        if (gesture.mode === 'pinch') {
            e.preventDefault();
            e.stopPropagation();
            if (lightboxZoomRef.current <= 1.08) {
                resetLightboxTransform();
            } else {
                applyLightboxTransform(lightboxZoomRef.current, lightboxOffsetRef.current, true);
            }
            lightboxGestureRef.current.mode = null;
            return;
        }

        if (lightboxZoomRef.current > 1.02) {
            if (moved < 8) {
                const now = performance.now();
                if (now - (gesture.lastTap || 0) < 320) {
                    toggleLightboxZoomAt(gesture.startX, gesture.startY);
                    lightboxGestureRef.current.lastTap = 0;
                } else {
                    lightboxGestureRef.current.lastTap = now;
                }
            }
            lightboxGestureRef.current.mode = null;
            return;
        }

        if (moved < 10) {
            const now = performance.now();
            if (now - (gesture.lastTap || 0) < 320) {
                toggleLightboxZoomAt(gesture.startX, gesture.startY);
                lightboxGestureRef.current.lastTap = 0;
            } else {
                lightboxGestureRef.current.lastTap = now;
            }
            return;
        }

        const dx = gesture.startX - gesture.endX;
        const dy = gesture.startY - gesture.endY;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.08) {
            resetLightboxTransform();
            setActiveImg(prev => dx > 0 ? (prev === images.length - 1 ? 0 : prev + 1) : (prev === 0 ? images.length - 1 : prev - 1));
        }
    };

    useEffect(() => {
        if (!isLightboxOpen) {
            setShowZoomHint(false);
            return;
        }

        resetLightboxTransform();
        setShowZoomHint(true);
        zoomHintTimerRef.current = setTimeout(() => {
            setShowZoomHint(false);
            zoomHintTimerRef.current = null;
        }, 3400);

        return () => {
            if (zoomHintTimerRef.current) {
                clearTimeout(zoomHintTimerRef.current);
                zoomHintTimerRef.current = null;
            }
        };
    }, [isLightboxOpen, activeImg]);

    useEffect(() => () => {
        if (lightboxRafRef.current) {
            cancelAnimationFrame(lightboxRafRef.current);
            lightboxRafRef.current = null;
        }
        if (zoomHintTimerRef.current) {
            clearTimeout(zoomHintTimerRef.current);
            zoomHintTimerRef.current = null;
        }
        if (mobileImageSwapRef.current.releaseTimer) {
            clearTimeout(mobileImageSwapRef.current.releaseTimer);
            mobileImageSwapRef.current.releaseTimer = null;
        }
    }, []);

    const mobileScrollableRef = useRef(null);
    const isDescriptionScrollable = (el) => el.scrollHeight > el.clientHeight + 1;

    const onSheetCloseZoneTouchEnd = (e) => {
        if (isClosingToGallery()) return;

        const { startX, startY, endX, endY } = touchState.current;
        if (!startX || !startY || !endX || !endY) return;
        const dy = startY - endY;
        const dx = startX - endX;
        
        if (dy < -34 && Math.abs(dy) > Math.abs(dx) * 1.05) {
            setIsMobilePanelOpen(false);
        }
        e.stopPropagation();
    };

    const onPanelTouchMove = (e) => {
        if (isClosingToGallery()) return;

        touchState.current.endX = e.targetTouches[0].clientX;
        touchState.current.endY = e.targetTouches[0].clientY;
    };

    const onDescriptionTouchStart = (e) => {
        if (isClosingToGallery()) return;

        descriptionTouchState.current.startY = e.targetTouches[0].clientY;
        descriptionTouchState.current.scrollTop = e.currentTarget.scrollTop;
        descriptionTouchState.current.isScrollable = isDescriptionScrollable(e.currentTarget);
        descriptionTouchState.current.startedAtTop = e.currentTarget.scrollTop <= 1;
        descriptionTouchState.current.isClosingFromTop = false;

        if (!descriptionTouchState.current.isScrollable || descriptionTouchState.current.startedAtTop) {
            onTouchStart(e);
        }

        e.stopPropagation();
    };

    const onDescriptionTouchMove = (e) => {
        if (isClosingToGallery()) return;

        const scroller = e.currentTarget;
        if (!descriptionTouchState.current.isScrollable) {
            onPanelTouchMove(e);
            e.stopPropagation();
            return;
        }

        const currentY = e.targetTouches[0].clientY;
        const pullDownDistance = currentY - descriptionTouchState.current.startY;

        if (descriptionTouchState.current.startedAtTop && (descriptionTouchState.current.isClosingFromTop || pullDownDistance > 10)) {
            descriptionTouchState.current.isClosingFromTop = true;
            onPanelTouchMove(e);
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        const dy = descriptionTouchState.current.startY - currentY;
        scroller.scrollTop = descriptionTouchState.current.scrollTop + dy;
        e.preventDefault();
        e.stopPropagation();
    };

    const onDescriptionTouchEnd = (e) => {
        if (isClosingToGallery()) return;

        if (!descriptionTouchState.current.isScrollable || descriptionTouchState.current.isClosingFromTop) {
            onSheetCloseZoneTouchEnd(e);
            return;
        }

        e.stopPropagation();
    };

    useEffect(() => {
        if (setHeaderProps) {
            setHeaderProps(null);
        }
    }, [setHeaderProps]);

    // Fixed overlay: isolate the detail page from the document scroller.
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        const height = Math.round(window.visualViewport?.height || window.innerHeight || 0);

        if (height > 0) {
            root.style.setProperty('--marketplace-viewport-height', `${height}px`);
        }

        root.classList.add('product-detail-scroll-lock');
        body.classList.add('product-detail-scroll-lock');

        return () => {
            root.classList.remove('product-detail-scroll-lock');
            body.classList.remove('product-detail-scroll-lock');
        };
    }, []);

    // Hooks
    const imageItems = useMemo(() => getProductImageItems(item), [item]);
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const syncDesktopViewport = () => setIsDesktopDetailViewport(mediaQuery.matches);

        syncDesktopViewport();
        mediaQuery.addEventListener?.('change', syncDesktopViewport);
        return () => mediaQuery.removeEventListener?.('change', syncDesktopViewport);
    }, []);

    useEffect(() => {
        const seededRatios = {};
        imageItems.forEach((image) => {
            const ratio = image?.metadata?.ratio || image?.ratio;
            if (!Number.isFinite(ratio) || ratio <= 0) return;

            [
                image.src,
                image.thumb,
                image.card,
                image.medium,
                image.large,
                image.full,
            ].filter(Boolean).forEach((key) => {
                seededRatios[key] = ratio;
            });
        });

        if (!Object.keys(seededRatios).length) return;

        setImageAspectRatios((prev) => {
            let changed = false;
            const next = { ...prev };

            Object.entries(seededRatios).forEach(([key, ratio]) => {
                if (Math.abs((prev[key] || 0) - ratio) > 0.001) {
                    next[key] = ratio;
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [imageItems]);
    const images = useMemo(() => imageItems.map((image) => image.src).filter(Boolean), [imageItems]);
    const activeImage = imageItems[activeImg] || imageItems[0] || {};
    const activeImageSrc = activeImage.src || activeImage.full || images[0] || '';
    const activeImageFullSrc = activeImage.full || activeImageSrc;
    const activeImageSrcSet = activeImage.srcSet || undefined;
    const detailBackdropSrc = getDetailBackdropImageSrc(activeImage);
    const detailBackdropColor = activeImage.metadata?.dominantColor || DEFAULT_DETAIL_BACKDROP_COLOR;
    const hasDisplayedDetailBackdrop = Boolean(displayedDetailBackdrop.src);
    const visibleDetailBackdropSrc = displayedDetailBackdrop.src || detailBackdropSrc;
    const visibleDetailBackdropColor = hasDisplayedDetailBackdrop
        ? displayedDetailBackdrop.color || detailBackdropColor
        : 'transparent';
    const lightboxImageTransform = `translate3d(${lightboxOffset.x}px, ${lightboxOffset.y}px, 0) scale(${lightboxZoom})`;
    const activeImageRatio = imageAspectRatios[activeImageSrc] || imageAspectRatios[activeImageFullSrc] || null;
    const activeImageFitMode = getProductImageFitMode(activeImageRatio);
    const safeMobileDisplayedImageIndex = Math.min(
        Math.max(mobileDisplayedImageIndex, 0),
        Math.max(imageItems.length - 1, 0)
    );
    const mobileDisplayedImage = imageItems[safeMobileDisplayedImageIndex] || activeImage || imageItems[0] || {};
    const mobileDisplayedStagedImage = mobileStagedImages[safeMobileDisplayedImageIndex];
    const mobileDisplayedPaintedStagedImage = hasPrimaryImagePainted ? mobileDisplayedStagedImage : null;
    const mobileDisplayedInitialSrc = mobileDisplayedImage.medium
        || mobileDisplayedImage.card
        || mobileDisplayedImage.thumb
        || mobileDisplayedImage.src
        || mobileDisplayedImage.full
        || activeImageSrc;
    const mobileDisplayedImageSrc = mobileDisplayedPaintedStagedImage?.src || mobileDisplayedInitialSrc;
    const mobileDisplayedImageFullSrc = mobileDisplayedImage.full || mobileDisplayedImageSrc;
    const mobileDisplayedImageSrcSet = undefined;
    const mobileDisplayedImageRatio = mobileDisplayedPaintedStagedImage?.ratio
        || imageAspectRatios[mobileDisplayedImageSrc]
        || imageAspectRatios[mobileDisplayedImageFullSrc]
        || activeImageRatio
        || null;
    const mobileDisplayedImageFitMode = getProductImageFitMode(mobileDisplayedImageRatio);
    const mobilePreviousImage = mobilePreviousImageIndex !== null ? imageItems[mobilePreviousImageIndex] : null;
    const mobilePreviousStagedImage = mobilePreviousImageIndex !== null ? mobileStagedImages[mobilePreviousImageIndex] : null;
    const mobilePreviousImageSrc = mobilePreviousStagedImage?.src
        || mobilePreviousImage?.medium
        || mobilePreviousImage?.card
        || mobilePreviousImage?.thumb
        || mobilePreviousImage?.src
        || mobilePreviousImage?.full
        || '';
    const mobilePreviousImageFullSrc = mobilePreviousImage?.full || mobilePreviousImageSrc;
    const mobilePreviousImageSrcSet = undefined;
    const mobilePreviousImageRatio = mobilePreviousImageSrc
        ? mobilePreviousStagedImage?.ratio || imageAspectRatios[mobilePreviousImageSrc] || imageAspectRatios[mobilePreviousImageFullSrc] || mobileDisplayedImageRatio
        : null;
    const mobilePreviousImageFitMode = getProductImageFitMode(mobilePreviousImageRatio);
    const mobileDetailImageFrameStyle = useMemo(
        () => ({
            ...getMobileDetailImageStyle(mobileDisplayedImageRatio || DEFAULT_PRODUCT_IMAGE_RATIO, viewportBox),
            borderRadius: '0.75rem',
            overflow: 'hidden',
            clipPath: 'inset(0 round 0.75rem)',
        }),
        [mobileDisplayedImageRatio, viewportBox]
    );
    const mobileDetailImageClipStyle = useMemo(
        () => ({
            width: '100%',
            height: '100%',
            borderRadius: 'inherit',
            overflow: 'hidden',
            clipPath: 'inset(0 round 0.75rem)',
            contain: 'paint',
            transform: 'translateZ(0)',
        }),
        []
    );
    const mobileDetailImageStyle = useMemo(
        () => ({
            width: '100%',
            height: '100%',
            maxWidth: 'none',
            maxHeight: 'none',
            borderRadius: 0,
            overflow: 'visible',
            clipPath: 'none',
            transition: 'none',
        }),
        []
    );
    const lightboxImageStyle = useMemo(
        () => ({
            ...getMobileLightboxImageStyle(activeImageRatio || DEFAULT_PRODUCT_IMAGE_RATIO, viewportBox),
            transform: lightboxImageTransform,
            transformOrigin: 'center center',
        }),
        [activeImageRatio, lightboxImageTransform, viewportBox]
    );

    const rememberProductImageRatio = React.useCallback((event, ...keys) => {
        const image = event.currentTarget;
        if (!image?.naturalWidth || !image?.naturalHeight) return;

        const ratio = image.naturalWidth / image.naturalHeight;
        const nextKeys = keys.filter(Boolean);
        if (!Number.isFinite(ratio) || ratio <= 0 || nextKeys.length === 0) return;

        setImageAspectRatios((prev) => {
            let changed = false;
            const next = { ...prev };

            nextKeys.forEach((key) => {
                if (Math.abs((prev[key] || 0) - ratio) > 0.001) {
                    next[key] = ratio;
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, []);

    const handlePrimaryDetailImageLoad = React.useCallback((event) => {
        setHasPrimaryImagePainted(true);
        rememberProductImageRatio(event, activeImageSrc, activeImageFullSrc);
    }, [activeImageFullSrc, activeImageSrc, rememberProductImageRatio]);

    const rememberStagedProductImage = React.useCallback((index, resolved, image) => {
        if (!resolved?.src) return;

        setMobileStagedImages((prev) => {
            const previous = prev[index];
            if (
                previous?.src === resolved.src &&
                Math.abs((previous?.ratio || 0) - (resolved.ratio || 0)) <= 0.001
            ) {
                return prev;
            }

            return {
                ...prev,
                [index]: resolved,
            };
        });

        if (!resolved.ratio || !Number.isFinite(resolved.ratio)) return;

        const keys = [
            resolved.src,
            image?.src,
            image?.full,
            image?.large,
            image?.medium,
            image?.card,
        ].filter(Boolean);

        setImageAspectRatios((prev) => {
            let changed = false;
            const next = { ...prev };

            keys.forEach((key) => {
                if (Math.abs((prev[key] || 0) - resolved.ratio) > 0.001) {
                    next[key] = resolved.ratio;
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, []);

    const productUrl = useMemo(() => {
        if (!item) return '';
        const siteUrl = KIT_CONFIG.seo.siteUrl || window.location.origin;
        return getProductUrl(item, siteUrl);
    }, [item]);

    const mobileThumbSize = images.length > 12 ? 30 : 32;
    const mobileThumbGap = images.length > 12 ? 5 : 6;

    useEffect(() => {
        setActiveImg(0);
        setHasPrimaryImagePainted(false);
        setMobileDisplayedImageIndex(0);
        setMobilePreviousImageIndex(null);
        setMobileStagedImages({});
        mobileDisplayedImageIndexRef.current = 0;
        mobileImageSwapRef.current.token += 1;
        if (mobileImageSwapRef.current.releaseTimer) {
            clearTimeout(mobileImageSwapRef.current.releaseTimer);
            mobileImageSwapRef.current.releaseTimer = null;
        }
        wheelAcc.current = 0;
    }, [item?.id]);

    useEffect(() => {
        setHasPrimaryImagePainted(false);
    }, [activeImg, item?.id]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        let frame = 0;
        const updateViewportBox = () => {
            if (frame) window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
                frame = 0;
                setViewportBox(getViewportBox());
            });
        };

        updateViewportBox();
        window.addEventListener('resize', updateViewportBox);
        window.visualViewport?.addEventListener('resize', updateViewportBox);

        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            window.removeEventListener('resize', updateViewportBox);
            window.visualViewport?.removeEventListener('resize', updateViewportBox);
        };
    }, []);

    useEffect(() => {
        if (!images.length) return;
        if (activeImg < images.length) return;
        const nextIndex = Math.max(0, images.length - 1);
        setActiveImg(nextIndex);
    }, [activeImg, images.length]);

    useEffect(() => {
        if (
            !isLightboxOpen ||
            !imageItems.length ||
            typeof window === 'undefined'
        ) {
            return undefined;
        }

        const timeoutIds = new Set();
        const seen = new Set();
        const isMobileLightbox = window.innerWidth < 1024;
        const queue = [
            activeImg,
            activeImg + 1,
            activeImg - 1,
            ...(isMobileLightbox ? [] : [activeImg + 2, activeImg - 2]),
        ]
            .filter((index) => index >= 0 && index < imageItems.length)
            .filter((index) => {
                if (seen.has(index)) return false;
                seen.add(index);
                return true;
            });

        queue.forEach((index, position) => {
            const run = () => {
                preloadLightboxImage(imageItems[index], {
                    priority: index === activeImg ? 'high' : 'auto',
                    decode: true,
                });
            };

            if (position === 0) {
                run();
                return;
            }

            const timeoutId = window.setTimeout(() => {
                timeoutIds.delete(timeoutId);
                run();
            }, position * 80);
            timeoutIds.add(timeoutId);
        });

        return () => {
            timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
        };
    }, [activeImg, imageItems, isLightboxOpen]);

    useEffect(() => {
        if (!isDesktopDetailViewport || !detailBackdropSrc) return undefined;

        let cancelled = false;
        preloadDetailBackdropImage(activeImage, {
            priority: 'high',
            decode: false,
        }).then(() => {
            if (cancelled) return;
            setDisplayedDetailBackdrop({ src: detailBackdropSrc, color: detailBackdropColor });
        });

        return () => {
            cancelled = true;
        };
    }, [activeImage, detailBackdropColor, detailBackdropSrc, isDesktopDetailViewport]);

    useEffect(() => {
        if (!isDesktopDetailViewport || !imageItems.length || typeof window === 'undefined') return undefined;

        const timeoutIds = new Set();
        const seen = new Set();
        const preloadOrder = buildProductImagePreloadOrder(imageItems.length, activeImg).filter((index) => {
            const src = getDetailBackdropImageSrc(imageItems[index]);
            if (!src || seen.has(src)) return false;
            seen.add(src);
            return true;
        });

        preloadOrder.forEach((index, position) => {
            const run = () => {
                preloadDetailBackdropImage(imageItems[index], {
                    priority: 'low',
                    decode: false,
                });
            };

            if (position <= 2) {
                run();
                return;
            }

            const timeoutId = window.setTimeout(() => {
                timeoutIds.delete(timeoutId);
                run();
            }, 120 + (position - 3) * 90);
            timeoutIds.add(timeoutId);
        });

        return () => {
            timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
        };
    }, [activeImg, imageItems, isDesktopDetailViewport]);

    useEffect(() => {
        mobileDisplayedImageIndexRef.current = mobileDisplayedImageIndex;
    }, [mobileDisplayedImageIndex]);

    useEffect(() => {
        if (!imageItems.length) return;
        const maxIndex = Math.max(0, imageItems.length - 1);
        if (mobileDisplayedImageIndex > maxIndex) {
            setMobileDisplayedImageIndex(maxIndex);
            mobileDisplayedImageIndexRef.current = maxIndex;
        }
        if (mobilePreviousImageIndex !== null && mobilePreviousImageIndex > maxIndex) {
            setMobilePreviousImageIndex(null);
        }
    }, [imageItems.length, mobileDisplayedImageIndex, mobilePreviousImageIndex]);

    useEffect(() => {
        if (!imageItems.length || activeImg >= imageItems.length) return undefined;

        const targetImage = imageItems[activeImg];
        const targetSrc = targetImage?.src || targetImage?.full;
        if (!targetSrc) return undefined;

        if (typeof window === 'undefined' || !window.matchMedia('(max-width: 1023px)').matches) {
            mobileImageSwapRef.current.token += 1;
            setMobileDisplayedImageIndex(activeImg);
            setMobilePreviousImageIndex(null);
            return undefined;
        }

        if (activeImg === mobileDisplayedImageIndexRef.current) return undefined;

        let cancelled = false;
        const token = mobileImageSwapRef.current.token + 1;
        mobileImageSwapRef.current.token = token;

        const commitDecodedImage = () => {
            if (cancelled || mobileImageSwapRef.current.token !== token) return;

            const previousIndex = mobileDisplayedImageIndexRef.current;
            if (previousIndex === activeImg) return;

            if (mobileImageSwapRef.current.releaseTimer) {
                clearTimeout(mobileImageSwapRef.current.releaseTimer);
                mobileImageSwapRef.current.releaseTimer = null;
            }

            flushSync(() => {
                setMobilePreviousImageIndex(previousIndex);
                setMobileDisplayedImageIndex(activeImg);
            });
            mobileDisplayedImageIndexRef.current = activeImg;

            mobileImageSwapRef.current.releaseTimer = window.setTimeout(() => {
                setMobilePreviousImageIndex(null);
                mobileImageSwapRef.current.releaseTimer = null;
            }, 180);
        };

        resolveStagedProductDetailImage(targetImage)
            .then((resolved) => {
                if (cancelled || mobileImageSwapRef.current.token !== token) return;
                rememberStagedProductImage(activeImg, resolved, targetImage);
                commitDecodedImage();
            })
            .catch(commitDecodedImage);

        return () => {
            cancelled = true;
        };
    }, [activeImg, imageItems, rememberStagedProductImage]);

    // Warm detail variants early so mobile reaches the already-viewed cache state on first visit.
    useEffect(() => {
        if (!imageItems || imageItems.length === 0 || typeof window === 'undefined') return undefined;

        let cancelled = false;
        const timeoutIds = new Set();
        const isMobileDetail = window.matchMedia('(max-width: 1023px)').matches;
        const connection = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
        const shouldDecodeFullMobileSet = isMobileDetail
            && !connection?.saveData
            && !/(^|-)2g$/.test(connection?.effectiveType || '');
        const preloadOrder = buildProductImagePreloadOrder(imageItems.length, activeImg);
        const loadIndex = (index, options = {}) => {
            const image = imageItems[index];
            if (!image || cancelled) return;
            if (isMobileDetail) {
                resolveStagedProductDetailImage(image)
                    .then((resolved) => {
                        if (!cancelled) rememberStagedProductImage(index, resolved, image);
                    })
                    .catch(() => null);
                return;
            }

            preloadLightboxImage(image, options);
        };

        const scheduleTimeout = (callback, delay) => {
            const id = window.setTimeout(() => {
                timeoutIds.delete(id);
                callback();
            }, delay);
            timeoutIds.add(id);
        };

        if (!preloadOrder.length) return undefined;

        if (isMobileDetail && !hasPrimaryImagePainted) {
            return () => {
                cancelled = true;
                timeoutIds.forEach((id) => window.clearTimeout(id));
            };
        }

        loadIndex(preloadOrder[0], { priority: 'high', decode: true, decoding: 'async' });

        if (!hasPrimaryImagePainted) {
            return () => {
                cancelled = true;
                timeoutIds.forEach((id) => window.clearTimeout(id));
            };
        }

        preloadOrder.slice(1, isMobileDetail ? imageItems.length : 5).forEach((index, position) => {
            const delay = isMobileDetail ? 160 + position * 120 : position * 60;
            const run = () => {
                loadIndex(index, {
                    priority: 'low',
                    decode: shouldDecodeFullMobileSet && position <= 1,
                    decoding: 'async',
                });
            };

            scheduleTimeout(run, delay);
        });

        if (isMobileDetail) {
            return () => {
                cancelled = true;
                timeoutIds.forEach((id) => window.clearTimeout(id));
            };
        }

        preloadOrder.slice(5).forEach((index, position) => {
            scheduleTimeout(() => {
                loadIndex(index, { priority: 'auto', decode: false, decoding: 'async' });
            }, 120 + position * 80);
        });

        return () => {
            cancelled = true;
            timeoutIds.forEach((id) => window.clearTimeout(id));
        };
    }, [activeImg, hasPrimaryImagePainted, imageItems, rememberStagedProductImage]);

    // IMAGE SWITCH ON SCROLL (Global Desktop)
    useEffect(() => {
        const isDesktop = window.innerWidth >= 1024;
        
        if (!images || images.length <= 1) {
            return;
        }
        
        // Bloque le scroll global et change l'image
        let wheelResetTimer;
        const handleGlobalWheel = (e) => {
            if (window.innerWidth < 1024) return; // Uniquement sur desktop
            e.preventDefault();

            wheelAcc.current += e.deltaY;

            // Sensibilité calibrée : on change d'image tous les 60ms de delta accumulé
            // Cela permet de "défiler" très vite si on lance la molette fort
            if (Math.abs(wheelAcc.current) >= 60) {
                const direction = wheelAcc.current > 0 ? 1 : -1;
                setActiveImg(prev => {
                    const next = prev + direction;
                    return Math.max(0, Math.min(images.length - 1, next));
                });
                wheelAcc.current = 0;
            }

            // Reset de l'accumulateur après une pause pour éviter les sauts résiduels
            clearTimeout(wheelResetTimer);
            wheelResetTimer = setTimeout(() => {
                wheelAcc.current = 0;
            }, 150);
        };

        window.addEventListener('wheel', handleGlobalWheel, { passive: false });
        return () => {
            window.removeEventListener('wheel', handleGlobalWheel);
        };
    }, [images]);

    // CENTER ACTIVE THUMBNAIL IN SIDEBAR (Desktop)
    useEffect(() => {
        if (!thumbListRef.current) return;
        const activeThumb = thumbListRef.current.children[activeImg];
        if (activeThumb) {
            activeThumb.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    }, [activeImg]);

    useEffect(() => {
        if (!mobileThumbListRef.current || window.innerWidth >= 1024) return;
        const activeThumb = mobileThumbListRef.current.querySelector(`[data-thumb-index="${activeImg}"]`);
        if (activeThumb) {
            activeThumb.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [activeImg]);

    useEffect(() => {
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
            if (backSwipeTimerRef.current) clearTimeout(backSwipeTimerRef.current);
            if (galleryExitTimerRef.current) clearTimeout(galleryExitTimerRef.current);
            if (wheelExitResetTimerRef.current) clearTimeout(wheelExitResetTimerRef.current);
        };
    }, []);

    const isInCart = cartItems.some(cartItem => cartItem.originalId === item?.id);
    const mobileTone = darkMode
        ? {
            surface: 'bg-[#0e0e0e]',
            thumbActive: 'border-white bg-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] opacity-100 scale-105',
            thumbIdle: 'border-white/10 bg-white/5 opacity-40',
            imageShadow: 'drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]',
            originBadge: 'bg-black/40 text-white/80 border-white/10',
            hintIcon: 'text-white',
            hintText: 'text-white/40 drop-shadow-md',
            summaryTitle: 'text-[#f9f9f9] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]',
            summaryDesc: 'text-white/70 drop-shadow-md',
            summaryActions: 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]',
            sheet: 'bg-[#111] border-white/10 shadow-[0_-24px_80px_rgba(0,0,0,0.45)]',
            handle: 'bg-white/20',
            divider: 'border-white/10',
            infoDivider: 'border-white/5',
            infoValue: 'text-zinc-300',
            description: 'text-[#cdcdcd]',
            cartButton: 'bg-[#f9f9f9] text-black hover:bg-white shadow-2xl',
            payCard: 'bg-[#f9f9f9] border border-transparent',
        }
        : {
            surface: 'bg-[#FAFAF9]',
            thumbActive: 'border-[#D2C4B7] bg-white opacity-100 ring-1 ring-[#EEE7DF]',
            thumbIdle: 'border-[#EEE9E3] bg-white opacity-100',
            imageShadow: 'drop-shadow-[0_20px_42px_rgba(92,75,57,0.24)]',
            originBadge: 'bg-white/80 text-stone-700 border-stone-200',
            hintIcon: 'text-stone-700',
            hintText: 'text-stone-500 drop-shadow-[0_1px_6px_rgba(255,255,255,0.9)]',
            summaryTitle: 'text-stone-950 drop-shadow-[0_1px_8px_rgba(255,255,255,0.95)]',
            summaryDesc: 'text-stone-600 drop-shadow-[0_1px_8px_rgba(255,255,255,0.95)]',
            summaryActions: 'text-stone-950 drop-shadow-[0_1px_8px_rgba(255,255,255,0.95)]',
            sheet: 'bg-[#fffdfb]/95 border-stone-200 shadow-[0_-24px_80px_rgba(92,75,57,0.16)]',
            handle: 'bg-stone-300',
            divider: 'border-stone-200',
            infoDivider: 'border-stone-200',
            infoValue: 'text-stone-800',
            description: 'text-stone-600',
            cartButton: 'bg-stone-900 text-white hover:bg-black shadow-[0_16px_32px_rgba(28,25,23,0.18)]',
            payCard: 'bg-white border border-stone-200',
        };

    const productSchema = useMemo(() => {
        if (!item) return null;
        return {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": item.name,
            "image": images,
            "description": item.description,
            "brand": { "@type": "Brand", "name": KIT_CONFIG.brandName },
            "offers": {
                "@type": "Offer",
                "url": productUrl,
                "priceCurrency": "EUR",
                "price": item.currentPrice || item.startingPrice,
                "availability": !item.sold ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            }
        };
    }, [item, images, productUrl]);

    useGSAP(() => {
        if (!item) return;
        if (window.innerWidth < 1024) return;

        const titleEl = containerRef.current?.querySelector('.split-detail-title');
        if (titleEl) {
            const text = new SplitType(titleEl, { types: 'lines, words' });
            gsap.from(text.words, {
                y: 50,
                rotateZ: 3,
                opacity: 0,
                duration: 1.2,
                stagger: 0.04,
                ease: 'power3.out',
                delay: 0.2
            });
            return () => text.revert();
        }

        gsap.from('.detail-stagger', {
            y: 40,
            opacity: 0,
            duration: 1,
            stagger: 0.1,
            ease: 'power3.out',
            delay: 0.4
        });

    }, { scope: containerRef, dependencies: [item?.id] });
    
    if (!item) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 pt-32 text-center animate-in fade-in duration-500">
            <div className="p-6 rounded-full bg-surface-container mb-4 animate-pulse">
                <Box size={40} className="text-on-surface-variant" />
            </div>
            <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-[#f9f9f9] font-headline">Produit Introuvable</h2>
            </div>
            <button onClick={onBack} className="px-8 py-3 bg-tertiary text-on-tertiary uppercase tracking-[0.2em] text-[10px] font-label hover:bg-white transition-colors">Retour</button>
        </div>
    );

    return (
        <div
            ref={containerRef}
            data-native-scroll-region
            className={`fixed inset-0 z-[100] w-screen overflow-hidden font-body selection:bg-secondary-container selection:text-on-secondary-container transition-colors duration-1000 ${darkMode ? 'bg-[#0e0e0e] text-[#e5e5e5]' : 'bg-transparent text-stone-900'}`}
            style={{
                height: 'var(--marketplace-viewport-height, 100svh)',
                backgroundColor: isDesktopDetailViewport ? visibleDetailBackdropColor : undefined,
            }}
        >
            <SEO
                title={item.name}
                description={item.description}
                image={imageItems[0]?.full || images[0]}
                url={getProductUrl(item)}
                type="product"
                schema={productSchema}
            />

            {/* CINEMATIC BLURRED BACKDROP (Global Desktop) */}
            {isDesktopDetailViewport && visibleDetailBackdropSrc && (
                <div
                    className="absolute inset-0 z-0 pointer-events-none overflow-hidden hidden lg:flex items-center justify-center"
                    style={{ backgroundColor: visibleDetailBackdropColor }}
                >
                    <img
                        key={visibleDetailBackdropSrc}
                        src={visibleDetailBackdropSrc}
                        alt=""
                        aria-hidden="true"
                        loading="eager"
                        decoding="async"
                        fetchpriority="high"
                        className="h-[120%] w-[120%] scale-110 object-cover object-center opacity-50 blur-[80px] saturate-150 dark:opacity-20"
                    />
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                MOBILE: Midjourney Style Architecture (Layers 0 to 5)
               ═══════════════════════════════════════════════════════════════ */}
            
            <main className="w-full h-full lg:overflow-hidden lg:flex lg:flex-row relative">
                {/* Mobile Wrapper */}
                <div
                    ref={mobileShellRef}
                    className={`lg:hidden fixed inset-0 overflow-hidden overscroll-none transition-colors duration-500 ${mobileTone.surface}`}
                    style={{ height: 'var(--marketplace-viewport-height, 100svh)' }}
                >
                    
                    {/* Layer 2: Header & Thumbs */}
                    <div 
                        ref={mobileThumbLayerRef}
                        className={`absolute top-0 left-0 w-full z-20 px-3 safe-pt-product-thumbs pb-1 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isMobilePanelOpen ? '-translate-y-full' : 'translate-y-0'}`}
                    >
                        {images.length > 1 && (
                            <div
                                ref={mobileThumbListRef}
                                data-mobile-thumb-rail
                                className="w-full overflow-x-auto overscroll-x-contain no-scrollbar py-2.5"
                                style={{ scrollPaddingInline: '20px' }}
                            >
                                <div
                                    data-mobile-thumb-strip
                                    className={`flex ${images.length <= 7 ? 'min-w-full justify-center px-4' : 'w-max justify-start px-5'}`}
                                    style={{ gap: `${mobileThumbGap}px` }}
                                >
                                    {imageItems.map((image, idx) => {
                                        const thumbSrc = image.thumb || image.card || image.src;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                data-thumb-index={idx}
                                                onClick={() => setActiveImg(idx)}
                                                className={`rounded-md overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${activeImg === idx ? mobileTone.thumbActive : mobileTone.thumbIdle}`}
                                                style={{
                                                    width: `${mobileThumbSize}px`,
                                                    height: `${mobileThumbSize}px`,
                                                    backgroundImage: hasPrimaryImagePainted && thumbSrc ? `url("${thumbSrc}")` : undefined,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    backgroundColor: 'rgba(0,0,0,0.04)',
                                                }}
                                            >
                                                <img
                                                    src={thumbSrc}
                                                    srcSet={image.srcSet || undefined}
                                                    className="w-full h-full object-cover rounded-[4px]"
                                                    alt={`Apercu ${idx + 1}`}
                                                    loading={hasPrimaryImagePainted && idx < 8 ? 'eager' : 'lazy'}
                                                    decoding="async"
                                                    fetchpriority="low"
                                                    sizes={`${mobileThumbSize}px`}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Layer 1: Main Image Viewport & Layer 3: Image Overlay Footer */}
                    <div
                        className={`absolute top-0 left-0 w-full flex items-center justify-center px-2 safe-product-image-stage transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] z-10 touch-none ${isMobilePanelOpen ? '-translate-y-16' : 'translate-y-0'}`}
                        style={{
                            height: 'var(--marketplace-viewport-height, 100svh)',
                            willChange: 'transform',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: isMobilePanelOpen ? 'translate3d(0, -4rem, 0)' : 'translate3d(0, 0, 0)'
                        }}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                        onWheel={handleMobileDetailWheel}
                    >
                        {/* The frame has the final rounded clipping before the uncached image paints. */}
                        <div
                            ref={mobileImageStageRef}
                            className="relative flex h-full w-full cursor-zoom-in items-center justify-center"
                            onPointerDown={markMobileImagePress}
                            onPointerCancel={clearMobileImagePress}
                            onClick={openLightboxFromMobileImage}
                        >
                            <div className={`product-detail-mobile-image-shadow pointer-events-none ${mobileTone.imageShadow}`}>
                                <div
                                    data-fit-mode={mobileDisplayedImageFitMode}
                                    className="product-detail-mobile-image-frame"
                                    style={mobileDetailImageFrameStyle}
                                >
                                    <div
                                        className="product-detail-mobile-image-clip"
                                        style={mobileDetailImageClipStyle}
                                    >
                                        {mobilePreviousImageSrc && mobilePreviousImageIndex !== safeMobileDisplayedImageIndex && (
                                            <img
                                                src={mobilePreviousImageSrc}
                                                srcSet={mobilePreviousImageSrcSet}
                                                sizes={PRODUCT_DETAIL_IMAGE_SIZES}
                                                alt={item.name}
                                                data-fit-mode={mobilePreviousImageFitMode}
                                                className="product-detail-mobile-image product-detail-mobile-image-layer--previous object-contain select-none"
                                                style={mobileDetailImageStyle}
                                                onLoad={(event) => rememberProductImageRatio(event, mobilePreviousImageSrc, mobilePreviousImageFullSrc)}
                                                draggable={false}
                                                loading="eager"
                                                decoding="async"
                                                fetchpriority="low"
                                            />
                                        )}
                                        <img
                                            src={mobileDisplayedImageSrc}
                                            srcSet={mobileDisplayedImageSrcSet}
                                            sizes={PRODUCT_DETAIL_IMAGE_SIZES}
                                            alt={item.name}
                                            data-fit-mode={mobileDisplayedImageFitMode}
                                            className="product-detail-mobile-image product-detail-mobile-image-layer--current object-contain select-none"
                                            style={mobileDetailImageStyle}
                                            onLoad={(event) => {
                                                setHasPrimaryImagePainted(true);
                                                rememberProductImageRatio(event, mobileDisplayedImageSrc, mobileDisplayedImageFullSrc);
                                            }}
                                            draggable={false}
                                            loading="eager"
                                            decoding="async"
                                            fetchpriority="high"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Origin Badge */}
                        {item.origin && (
                            <div ref={mobileOriginBadgeRef} className={`absolute top-[80px] left-4 px-3 py-1.5 rounded-full font-label text-[9px] tracking-[0.2em] uppercase backdrop-blur-md border transition-all duration-300 ${mobileTone.originBadge} ${isMobilePanelOpen ? 'opacity-0' : 'opacity-100'}`}>
                                {item.origin}
                            </div>
                        )}

                        <div
                            ref={mobileSummaryLayerRef}
                            className={`absolute bottom-0 left-0 w-full px-5 safe-pb-product-summary flex items-end justify-between transition-opacity duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isMobilePanelOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                            style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
                        >
                            {/* Visual Hint for Swipe Up */}
                            <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                                <style>{`
                                    @keyframes swipeUpMvt {
                                        0% { transform: translateY(15px); opacity: 0; }
                                        30% { opacity: 0.7; }
                                        100% { transform: translateY(-10px); opacity: 0; }
                                    }
                                `}</style>
                                {/* Animated Chevron */}
                                <svg 
                                    fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" 
                                    className={`w-5 h-5 ${mobileTone.hintIcon}`}
                                    style={{ animation: 'swipeUpMvt 2s infinite ease-out' }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                                <span className={`text-[9px] uppercase tracking-[0.4em] font-light translate-x-[0.2em] mt-1 ${mobileTone.hintText}`}>
                                    Détails
                                </span>
                            </div>

                            {/* Zone Gauche: Name & Follow */}
                            <div className="flex-1 pr-4">
                                <h2 className={`font-serif text-[18px] line-clamp-1 mb-1 transition-colors duration-500 ${mobileTone.summaryTitle}`}>
                                    {item.name}
                                </h2>
                                <p className={`font-sans text-[12px] line-clamp-2 transition-colors duration-500 ${mobileTone.summaryDesc}`}>
                                    {item.description}
                                </p>
                            </div>

                            {/* Zone Droite: Actions */}
                            <div className={`flex items-center gap-5 flex-shrink-0 pb-1 transition-colors duration-500 ${mobileTone.summaryActions}`}>
                                <button onClick={() => setIsMobilePanelOpen(true)}>
                                    <AlignLeft size={24} strokeWidth={1.5} />
                                </button>
                                <button>
                                    <Heart size={24} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Layer 4: Product Bottom Sheet */}
                    <div 
                        data-mobile-bottom-sheet
                        className={`absolute bottom-0 left-0 w-full backdrop-blur-3xl rounded-t-3xl border-t transition-[transform,background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] z-30 flex h-[clamp(30rem,calc(var(--marketplace-viewport-height,100svh)*0.66),40rem)] max-h-[calc(var(--marketplace-viewport-height,100svh)-5.5rem)] flex-col overflow-hidden ${mobileTone.sheet} ${isMobilePanelOpen ? 'translate-y-0' : 'translate-y-full'}`}
                    >
                        <div className="flex h-full min-h-0 w-full flex-col px-5 pt-4 safe-pb-product-sheet">
                            <div
                                data-mobile-sheet-close-zone
                                className="flex-shrink-0 touch-pan-y select-none"
                                onTouchStart={onTouchStart}
                                onTouchMove={onPanelTouchMove}
                                onTouchEnd={onSheetCloseZoneTouchEnd}
                            >
                                {/* Drag indicator to close */}
                                <div
                                    className={`w-12 h-1 rounded-full mx-auto mb-5 cursor-pointer transition-colors duration-500 ${mobileTone.handle}`}
                                    onClick={() => setIsMobilePanelOpen(false)}
                                />

                                <div className="pb-1">
                                    <h3 className="font-label text-[10px] tracking-[0.3em] uppercase text-[#91a293] mb-3">Informations</h3>
                                    <ul className="space-y-2 font-label text-[9px] tracking-widest uppercase text-[#757575]">
                                        {item.material && (
                                            <li className={`flex justify-between border-b pb-1.5 ${mobileTone.infoDivider}`}>
                                                <span>Matériau</span><span className={`${mobileTone.infoValue} font-sans`}>{item.material}</span>
                                            </li>
                                        )}
                                        {(item.dimensions || item.width) && (
                                            <li className={`flex justify-between border-b pb-1.5 ${mobileTone.infoDivider}`}>
                                                <span>Dimension</span><span className={`${mobileTone.infoValue} font-mono`}>{item.dimensions || `${item.width}x${item.depth}x${item.height}cm`}</span>
                                            </li>
                                        )}
                                        {item.weight && (
                                            <li className="flex justify-between">
                                                <span>Poids</span><span className={`${mobileTone.infoValue} font-mono`}>{item.weight} kg</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-4 flex min-h-0 flex-1 flex-col">
                                <h3 className="font-label text-[10px] tracking-[0.3em] uppercase text-[#91a293] mb-3 flex-shrink-0">La Pièce</h3>
                                <div
                                    ref={mobileScrollableRef}
                                    data-mobile-description-scroll
                                    className="mobile-description-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-2"
                                    onTouchStart={onDescriptionTouchStart}
                                    onTouchMove={onDescriptionTouchMove}
                                    onTouchEnd={onDescriptionTouchEnd}
                                >
                                    <p className={`font-sans text-[13px] leading-[1.65] whitespace-pre-wrap transition-colors duration-500 ${mobileTone.description}`}>
                                        {item.description}
                                    </p>
                                </div>
                            </div>

                            {/* ACTIONS & PAYMENT METHODS */}
                            <div className={`w-full mt-4 border-t pt-4 flex-shrink-0 transition-colors duration-500 ${mobileTone.divider}`}>
                                <button 
                                    className={`w-full rounded-xl py-3.5 flex items-center justify-center gap-2 font-label text-[11px] tracking-[0.1em] uppercase active:scale-95 transition-all duration-300 ${mobileTone.cartButton}`}
                                    onClick={() => {
                                        if (isInCart) {
                                            onOpenCart();
                                        } else {
                                            onAddToCart(item);
                                        }
                                    }}
                                >
                                    <ShoppingBag size={15} /> 
                                    {isInCart ? "Voir panier" : "Ajouter au panier"} 
                                    <span className="opacity-50 ml-1">· {item.currentPrice || item.startingPrice}€</span>
                                </button>
                                {/* Payment Methods Icons (Tailwind Replicas) */}
                                <div className="flex items-center justify-center flex-nowrap gap-1 mt-3 opacity-90 w-full overflow-hidden">
                                    {/* Visa */}
                                    <div className={`${mobileTone.payCard} text-[#1434CB] px-1.5 py-1 rounded-[3px] text-[9px] font-black italic h-6 flex items-center drop-shadow-sm min-w-[36px] justify-center flex-shrink-0`}>VISA</div>
                                    
                                    {/* Mastercard */}
                                    <div className={`${mobileTone.payCard} px-1.5 py-1 rounded-[3px] flex items-center gap-[-2px] h-6 drop-shadow-sm min-w-[36px] justify-center flex-shrink-0`}>
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B] mix-blend-multiply opacity-90 blur-[0.1px]"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] mix-blend-multiply opacity-90 -ml-[4px] blur-[0.1px]"></div>
                                    </div>
                                    
                                    {/* Apple Pay */}
                                    <div className="bg-[#000000] border border-white/20 text-white px-1.5 py-1 rounded-[3px] text-[9px] font-medium flex items-center gap-1 h-6 min-w-[46px] justify-center flex-shrink-0">
                                        <svg viewBox="0 0 384 512" className="w-2.5 h-2.5 fill-current"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.3 48.6-.7 90.4-82.5 102.7-127.3-46.6-42-50.6-86.9-52.1-83.3zM256.3 95.3c26.1-31.6 34.2-73.8 28.2-115.3-26.1 2.3-69.6 18.6-96.1 50-20.9 24.6-39 61.6-32.1 102 29.2 1.7 67.5-17.9 99.8-36.7z"/></svg> 
                                        Pay
                                    </div>
                                    
                                    {/* Google Pay */}
                                    <div className={`${mobileTone.payCard} text-[#5f6368] px-1.5 py-1 rounded-[3px] text-[9px] font-medium flex items-center gap-1.5 h-6 drop-shadow-sm min-w-[46px] justify-center flex-shrink-0`}>
                                        <svg viewBox="0 0 24 24" className="w-3 h-3">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Pay
                                    </div>
                                    
                                    {/* PayPal */}
                                    <div className="bg-[#003087] text-white px-1.5 py-1 rounded-[3px] text-[9px] font-black italic h-6 flex items-center drop-shadow-sm min-w-[46px] justify-center flex-shrink-0">
                                        PayPal
                                    </div>

                                    {/* RIB */}
                                    <div className="bg-[#333333] border border-white/10 text-white/90 px-1.5 py-1 rounded-[3px] text-[9px] font-bold tracking-widest flex items-center gap-1 h-6 drop-shadow-sm min-w-[36px] justify-center flex-shrink-0">
                                        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current opacity-80"><path d="M2 20h20v2H2v-2zm2-8h2v7H4v-7zm5 0h2v7H9v-7zm5 0h2v7h-2v-7zm5 0h2v7h-2v-7zM2 9l10-5 10 5v2H2V9zm7-2l3-1.5 3 1.5H9z"/></svg> 
                                        RIB
                                    </div>
                                    
                                    {/* wero */}
                                    <div className="bg-[#003B7E] text-white px-1.5 py-1 rounded-[3px] text-[9px] font-black tracking-tight h-6 flex items-center drop-shadow-sm min-w-[36px] justify-center flex-shrink-0">
                                        wero
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── DESKTOP LAYOUT (unchanged) ─── */}
                {/* LEFT: MAIN IMAGE — Desktop grid layout */}
                <div className="hidden lg:flex lg:flex-1 lg:h-[100vh] lg:grid lg:grid-rows-[15vh_72vh_13vh] relative overflow-hidden lg:bg-black/5">
                    
                    <div className="w-full h-full pointer-events-none" />

                    <div className="w-full h-full flex flex-col items-center justify-center relative row-span-1">
                        
                        <button 
                            onClick={onBack}
                            className={`absolute -top-12 right-8 z-[130] flex items-center justify-center transition-all duration-300 group ${darkMode ? 'text-white/40 hover:text-white' : 'text-stone-900/40 hover:text-stone-900'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${darkMode ? 'border-white/10 group-hover:border-white/30' : 'border-stone-900/10 group-hover:border-stone-900/30'}`}>
                                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            </div>
                        </button>

                        <div 
                            ref={desktopImageStageRef}
                            className="relative z-10 w-full h-full flex items-center justify-center cursor-zoom-in"
                            onClick={() => setIsLightboxOpen(true)}
                        >
                            <AnimatePresence>
                                <motion.div
                                    key={activeImg}
                                    className="absolute inset-0 flex items-center justify-center"
                                    initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                                >
                                    <img
                                        src={activeImageSrc}
                                        srcSet={activeImageSrcSet}
                                        sizes={PRODUCT_DETAIL_IMAGE_SIZES}
                                        alt={item.name}
                                        loading="eager"
                                        decoding="async"
                                        fetchpriority="high"
                                        onLoad={handlePrimaryDetailImageLoad}
                                        className="block h-auto w-auto max-h-[92%] max-w-full object-contain rounded-2xl shadow-[0_45px_110px_-25px_rgba(0,0,0,0.8)]"
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {item.origin && (
                                <div className="absolute top-4 right-4 bg-black/40 px-3 py-1.5 rounded-full text-white/80 font-label text-[9px] tracking-[0.2em] uppercase backdrop-blur-md z-40 border border-white/10">
                                    {item.origin}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full h-full pointer-events-none" />
                </div>

                {/* RIGHT: Desktop sidebar */}
                <div 
                    className={`hidden lg:flex w-[450px] xl:w-[500px] flex-shrink-0 flex-col z-20 transition-colors duration-1000 h-[100dvh] pt-36 pb-8 ${darkMode ? 'bg-[#0e0e0e] border-l border-white/5' : 'bg-[#FAFAFA] border-l border-black/5 shadow-2xl'}`}
                >
                    <div className="flex-shrink-0 px-10">
                        <header className="mb-10 detail-stagger flex flex-col">
                            <p className="font-label text-[10px] tracking-[0.4em] uppercase text-[#757575] mb-3">
                                {item.id ? `Pièce N°${item.id.substring(0,4)}` : 'Pièce Unique'}
                            </p>
                            <h1 className={`split-detail-title font-serif text-4xl xl:text-5xl tracking-tighter leading-tight mb-5 transition-colors duration-1000 ${darkMode ? 'text-[#f9f9f9]' : 'text-stone-900'}`}>
                                {item.name}
                            </h1>
                            <div className={`font-sans font-medium text-3xl transition-colors duration-1000 ${darkMode ? 'text-[#e2e2e2]' : 'text-stone-900'}`}>
                                {item.priceOnRequest ? (
                                    <span className="text-xl text-[#ababab]">Sur demande</span>
                                ) : (
                                    <div className="flex items-baseline gap-1">
                                        <AnimatedPrice amount={item.currentPrice || item.startingPrice || 0} /> 
                                        <span className="text-xl font-light text-[#757575] ml-1">€</span>
                                    </div>
                                )}
                            </div>
                        </header>

                        {/* CTA ACTIONS */}
                        <div className="mb-10 detail-stagger">
                            <div className={`p-1 rounded-2xl border transition-colors duration-1000 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-black/5 shadow-sm'}`}>
                                {isInCart ? (
                                    <button onClick={onOpenCart} className={`w-full py-4 rounded-xl flex justify-center items-center gap-2 font-label text-[11px] tracking-[0.1em] uppercase transition-all shadow-md active:scale-95 ${darkMode ? 'bg-[#f9f9f9] text-zinc-900 hover:bg-white' : 'bg-stone-900 text-stone-50 hover:bg-black'}`}>
                                        <ShoppingBag size={15} /> Voir au panier
                                    </button>
                                ) : (
                                    <button onClick={() => {
                                        onAddToCart(item);
                                    }} className={`w-full py-4 rounded-xl font-label text-[11px] tracking-[0.1em] uppercase transition-all shadow-md active:scale-95 ${darkMode ? 'bg-[#f9f9f9] text-zinc-900 hover:bg-white' : 'bg-stone-900 text-stone-50 hover:bg-black'}`}>
                                        Ajouter au panier
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div 
                        ref={descScrollRef} 
                        className="flex-1 overflow-y-auto custom-scrollbar px-10"
                    >
                        {/* DESCRIPTION */}
                        <div className="detail-stagger pt-6 border-t border-zinc-200/20 dark:border-zinc-800 pb-6">
                            <h3 className="font-label text-[10px] tracking-[0.3em] uppercase text-[#91a293] mb-4">La Pièce</h3>
                            <p className={`font-sans leading-[1.8] text-[13px] tracking-wide whitespace-pre-wrap transition-colors duration-1000 ${darkMode ? 'text-[#a3a3a3]' : 'text-stone-600'}`}>
                                {item.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex-shrink-0 px-10 pt-2">
                        {/* SPECS */}
                        <div className="detail-stagger pt-4 border-t border-zinc-200/20 dark:border-zinc-800">
                            <h3 className="font-label text-[10px] tracking-[0.3em] uppercase text-[#91a293] mb-4">Informations</h3>
                            <ul className="space-y-3 font-label text-[9px] tracking-widest uppercase text-[#757575]">
                                {item.material && (
                                    <li className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                        <span>Matériau</span><span className="text-zinc-900 dark:text-zinc-300 font-sans">{item.material}</span>
                                    </li>
                                )}
                                {(item.dimensions || item.width) && (
                                    <li className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                        <span>Dimension</span><span className="text-zinc-900 dark:text-zinc-300 font-mono">{item.dimensions || `${item.width}x${item.depth}x${item.height}cm`}</span>
                                    </li>
                                )}
                                {item.weight && (
                                    <li className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                        <span>Poids</span><span className="text-zinc-900 dark:text-zinc-300 font-mono">{item.weight} kg</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* FAR RIGHT: DESKTOP THUMBNAILS (VERTICAL STRIP) */}
                {images.length > 1 && (
                    <div 
                        ref={thumbListRef}
                        className={`hidden lg:flex flex-col gap-1.5 py-16 pt-28 pr-5 h-full overflow-y-auto no-scrollbar flex-shrink-0 items-end w-[110px] relative z-30 transition-colors duration-1000 ${darkMode ? 'bg-[#0e0e0e]' : 'bg-[#FAFAFA]'}`}
                        style={{ scrollSnapType: 'y proximity' }}
                    >
                        {imageItems.map((image, idx) => {
                            const thumbSrc = image.thumb || image.card || image.src;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImg(idx)}
                                    className={`rounded-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex-shrink-0 relative group
                                        ${activeImg === idx
                                            ? `w-[58px] h-[58px] shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-10`
                                            : `w-[48px] h-[48px] z-0 hover:w-[52px] hover:h-[52px]`
                                        }`}
                                    style={{
                                        scrollSnapAlign: 'center',
                                        backgroundImage: hasPrimaryImagePainted && thumbSrc ? `url("${thumbSrc}")` : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <img
                                        src={thumbSrc}
                                        srcSet={image.srcSet || undefined}
                                        sizes="58px"
                                        className="w-full h-full object-cover select-none pointer-events-none"
                                        alt=""
                                        loading={hasPrimaryImagePainted && idx < 8 ? 'eager' : 'lazy'}
                                        decoding="async"
                                        fetchpriority="low"
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* LIGHTBOX FULLSCREEN */}
            {isLightboxOpen && (
                <div className={`fixed inset-0 z-[3000] flex items-center justify-center animate-in fade-in duration-300 backdrop-blur-md transition-colors ${darkMode ? 'bg-[#0e0e0e]/95' : 'bg-[#FAFAF9]/95'}`}>
                    <button
                        aria-label="Fermer l'image agrandie"
                        onClick={() => setIsLightboxOpen(false)}
                        className={`absolute top-4 right-4 md:top-6 md:right-6 z-[3100] w-12 h-12 flex items-center justify-center rounded-full transition-all ${darkMode ? 'text-[#e5e5e5] border border-[#484848] bg-[#131313] hover:bg-[#1f1f1f]' : 'text-stone-700 border border-[#EEE9E3] bg-white/85 shadow-[0_10px_30px_rgba(92,75,57,0.10)] hover:bg-white hover:text-stone-950'}`}
                    >
                        <X size={20} />
                    </button>
                    <div className={`absolute top-6 left-5 md:top-10 md:left-10 z-[3100] text-[10px] font-label uppercase tracking-[0.4em] ${darkMode ? 'text-[#ababab]' : 'text-stone-500'}`}>
                        {activeImg + 1} / {images.length}
                    </div>

                    {images.length > 1 && (
                        <>
                            <button aria-label="Image precedente" className="absolute left-6 top-1/2 -translate-y-1/2 p-4 transition-all z-[3100] group hidden md:block"
                                onClick={(e) => { e.stopPropagation(); resetLightboxTransform(); setActiveImg(prev => prev === 0 ? images.length - 1 : prev - 1); }}>
                                <ChevronLeft size={32} className={`transition-colors ${darkMode ? 'text-[#ababab] group-hover:text-white' : 'text-stone-400 group-hover:text-stone-900'}`} />
                            </button>
                            <button aria-label="Image suivante" className="absolute right-6 top-1/2 -translate-y-1/2 p-4 transition-all z-[3100] group hidden md:block"
                                onClick={(e) => { e.stopPropagation(); resetLightboxTransform(); setActiveImg(prev => prev === images.length - 1 ? 0 : prev + 1); }}>
                                <ChevronRight size={32} className={`transition-colors ${darkMode ? 'text-[#ababab] group-hover:text-white' : 'text-stone-400 group-hover:text-stone-900'}`} />
                            </button>
                        </>
                    )}

                    <AnimatePresence>
                        {showZoomHint && (
                            <motion.div
                                aria-hidden="true"
                                className={`pointer-events-none absolute left-1/2 safe-bottom-zoom-hint z-[3100] flex -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-2.5 backdrop-blur-xl md:hidden ${darkMode ? 'border-white/10 bg-white/10 text-white/75' : 'border-[#EEE9E3] bg-white/85 text-stone-500 shadow-[0_14px_38px_rgba(92,75,57,0.10)]'}`}
                                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -4], scale: [0.96, 1, 1, 0.98] }}
                                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                transition={{ duration: 3.2, times: [0, 0.18, 0.78, 1], ease: 'easeOut' }}
                            >
                                <Maximize2 size={15} strokeWidth={1.7} />
                                <div className="relative h-6 w-12">
                                    <motion.span
                                        className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${darkMode ? 'bg-white/75' : 'bg-stone-500/70'}`}
                                        animate={{ x: [0, -9, -9, 0], opacity: [0.45, 1, 1, 0.45] }}
                                        transition={{ duration: 1.35, repeat: 1, ease: [0.25, 1, 0.5, 1] }}
                                    />
                                    <motion.span
                                        className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${darkMode ? 'bg-white/75' : 'bg-stone-500/70'}`}
                                        animate={{ x: [0, 9, 9, 0], opacity: [0.45, 1, 1, 0.45] }}
                                        transition={{ duration: 1.35, repeat: 1, ease: [0.25, 1, 0.5, 1] }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div
                        ref={lightboxImageStageRef}
                        className={`w-full h-full flex items-center justify-center overflow-hidden touch-none p-1 sm:p-3 md:p-12 ${lightboxZoom > 1.02 ? 'cursor-grab' : 'cursor-zoom-in'}`}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            toggleLightboxZoomAt(e.clientX, e.clientY);
                        }}
                        onTouchStart={onLightboxTouchStart}
                        onTouchMove={onLightboxTouchMove}
                        onTouchEnd={onLightboxTouchEnd}
                        onTouchCancel={onLightboxTouchEnd}
                    >
                        <img
                            src={activeImageFullSrc}
                            srcSet={activeImageSrcSet}
                            sizes="100vw"
                            alt="Detail"
                            data-fit-mode={activeImageFitMode}
                            className={`product-detail-lightbox-image object-contain pointer-events-none select-none will-change-transform ${isLightboxGesturing ? 'transition-none' : 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'} ${darkMode ? 'drop-shadow-2xl' : 'drop-shadow-[0_24px_54px_rgba(92,75,57,0.18)]'}`}
                            style={lightboxImageStyle}
                            onLoad={(event) => rememberProductImageRatio(event, activeImageFullSrc, activeImageSrc)}
                            draggable={false}
                            loading="eager"
                            decoding="async"
                            fetchpriority="high"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchitecturalProductDetail;
