import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductGridSection from './ProductGridSection';
import { prewarmProductListImages } from '../../../utils/imageUtils';

const NOUVEAUTES_PAGE_SIZE = 10;
const PETITS_PRIX_PAGE_SIZE = 10;
const NOUVEAUTES_PREWARM_IDLE_DELAY_MS = 9000;

const getPublishedItems = (items) => (
    Array.isArray(items) ? items.filter((item) => item.status === 'published') : []
);

const getItemPrice = (item) => (
    item.currentPrice !== undefined ? item.currentPrice : (item.price || 0)
);

const useLikedOriginalIds = (wishlistItems) => useMemo(() => (
    new Set((wishlistItems || []).map((item) => item.originalId).filter(Boolean))
), [wishlistItems]);

const usePublishedItems = (items) => useMemo(() => getPublishedItems(items), [items]);

export const ProductArrivalsSection = ({
    items,
    wishlistItems,
    isCatalogComplete,
    isLoadingFullCatalog,
    onLoadFullCatalog,
    isDetailOverlayOpen,
    darkMode,
    heading,
    onSelectItem,
    onAddToCart,
    onToggleWishlist,
}) => {
    const [limit, setLimit] = useState(NOUVEAUTES_PAGE_SIZE);
    const publishedItems = usePublishedItems(items);
    const likedOriginalIds = useLikedOriginalIds(wishlistItems);

    const sortedItems = useMemo(() => (
        [...publishedItems].sort((a, b) => {
            const orderA = a.nouveautesOrder !== undefined ? a.nouveautesOrder : 999999;
            const orderB = b.nouveautesOrder !== undefined ? b.nouveautesOrder : 999999;
            if (orderA !== orderB) return orderA - orderB;

            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        })
    ), [publishedItems]);

    const visibleItems = useMemo(() => sortedItems.slice(0, limit), [sortedItems, limit]);
    const hasMore = limit < sortedItems.length || !isCatalogComplete;

    const loadMore = () => {
        if (!isCatalogComplete) onLoadFullCatalog?.();
        setLimit((previous) => previous + NOUVEAUTES_PAGE_SIZE);
    };

    useEffect(() => {
        if (isDetailOverlayOpen || !sortedItems.length) return undefined;

        return prewarmProductListImages(sortedItems, {
            includeDetailPrimary: false,
            maxItems: 4,
            initialDelay: NOUVEAUTES_PREWARM_IDLE_DELAY_MS,
            delay: 650,
            priority: 'low',
        });
    }, [isDetailOverlayOpen, sortedItems]);

    return (
        <ProductGridSection
            id="gallery-pieces"
            className="scroll-mt-24 px-4 pb-[48px] pt-7 md:px-12 md:py-[60px] lg:px-16"
            heading={heading}
            items={visibleItems}
            hasMore={hasMore}
            loading={isLoadingFullCatalog}
            onLoadMore={loadMore}
            darkMode={darkMode}
            badgeLabel="Nouveau"
            isDetailOverlayOpen={isDetailOverlayOpen}
            likedOriginalIds={likedOriginalIds}
            onSelectItem={onSelectItem}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            getPriority={(_, index) => !isDetailOverlayOpen && index < 2}
        />
    );
};

export const ProductSmallPricesSection = ({
    items,
    wishlistItems,
    isCatalogComplete,
    isLoadingFullCatalog,
    onLoadFullCatalog,
    isDetailOverlayOpen,
    darkMode,
    heading,
    onSelectItem,
    onAddToCart,
    onToggleWishlist,
}) => {
    const sectionRef = useRef(null);
    const [limit, setLimit] = useState(PETITS_PRIX_PAGE_SIZE);
    const [isNearViewport, setIsNearViewport] = useState(false);
    const publishedItems = usePublishedItems(items);
    const likedOriginalIds = useLikedOriginalIds(wishlistItems);

    const sortedItems = useMemo(() => (
        [...publishedItems]
            .filter((item) => getItemPrice(item) <= 250)
            .sort((a, b) => {
                const orderA = a.petitsPrixOrder !== undefined ? a.petitsPrixOrder : 999999;
                const orderB = b.petitsPrixOrder !== undefined ? b.petitsPrixOrder : 999999;
                if (orderA !== orderB) return orderA - orderB;

                return getItemPrice(a) - getItemPrice(b);
            })
    ), [publishedItems]);

    const visibleItems = useMemo(() => sortedItems.slice(0, limit), [sortedItems, limit]);
    const hasMore = limit < sortedItems.length || !isCatalogComplete;

    const loadMore = () => {
        if (!isCatalogComplete) onLoadFullCatalog?.();
        setLimit((previous) => previous + PETITS_PRIX_PAGE_SIZE);
    };

    useEffect(() => {
        const section = sectionRef.current;
        if (!section || typeof IntersectionObserver === 'undefined') {
            setIsNearViewport(true);
            return undefined;
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            setIsNearViewport(true);
            observer.disconnect();
        }, { rootMargin: '700px 0px 260px' });

        observer.observe(section);
        return () => observer.disconnect();
    }, [visibleItems.length]);

    useEffect(() => {
        if (isDetailOverlayOpen || !isNearViewport || !visibleItems.length) return undefined;

        return prewarmProductListImages(visibleItems, {
            includeDetailPrimary: false,
            maxItems: 4,
            initialDelay: 600,
            delay: 260,
            priority: 'low',
            decode: false,
        });
    }, [isDetailOverlayOpen, isNearViewport, visibleItems]);

    return (
        <ProductGridSection
            sectionRef={sectionRef}
            className="pt-[60px] pb-[48px] px-4 md:px-12 md:py-[60px] lg:px-16"
            heading={heading}
            items={visibleItems}
            hasMore={hasMore}
            loading={isLoadingFullCatalog}
            onLoadMore={loadMore}
            darkMode={darkMode}
            isDetailOverlayOpen={isDetailOverlayOpen}
            likedOriginalIds={likedOriginalIds}
            onSelectItem={onSelectItem}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            getPriority={(_, index) => isNearViewport && index < 2}
            hideWhenEmpty
        />
    );
};
