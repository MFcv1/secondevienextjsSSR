import React, { useMemo, useRef, useState } from 'react';
import ProductGridSection from './ProductGridSection';

const NOUVEAUTES_PAGE_SIZE = 10;
const PETITS_PRIX_PAGE_SIZE = 10;

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
    onPrefetchItem,
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
            onPrefetchItem={onPrefetchItem}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            getPriority={() => false}
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
    onPrefetchItem,
    onAddToCart,
    onToggleWishlist,
}) => {
    const sectionRef = useRef(null);
    const [limit, setLimit] = useState(PETITS_PRIX_PAGE_SIZE);
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
            onPrefetchItem={onPrefetchItem}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            getPriority={() => false}
            hideWhenEmpty
        />
    );
};
