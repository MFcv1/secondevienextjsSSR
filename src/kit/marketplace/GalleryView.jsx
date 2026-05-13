import React, { useEffect, useState, useMemo } from 'react';
import { useLiveTheme } from '../config/theme';

// DESIGNS (Layouts)
import ArchitecturalLayout from './MarketplaceLayout';
import SEO from '../shared/SEO';
import KIT_CONFIG from '../config/constants';

const GalleryView = ({
    items, user, onSelectItem, onShowLogin, darkMode = false,
    onPrefetchItem,
    isPreparingGallery = false,
    onOpenMenu, onOpenCart, toggleTheme, setHeaderProps,
    persistentGalleryState, saveGalleryState,
    onAddToCart, wishlistItems, onToggleWishlist,
    onOpenAbout,
    onNavigateCategory,
    onOpenQuote,
    isDetailOverlayOpen = false,
    isCatalogComplete = false,
    isLoadingFullCatalog = false,
    onLoadFullCatalog
}) => {
    const [filter, setFilter] = useState(persistentGalleryState?.filter || 'fixed');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [searchQuery, setSearchQuery] = useState(persistentGalleryState?.searchQuery || '');

    // THEME & DESIGN HOOK
    const { palette } = useLiveTheme(darkMode);

    useEffect(() => {
        if (!searchQuery.trim() || isCatalogComplete) return;
        onLoadFullCatalog?.();
    }, [searchQuery, isCatalogComplete, onLoadFullCatalog]);

    // --- LOGIC: FILTER & SORT ---
    // Single source: items (unified 'furniture' collection)
    const filteredItems = useMemo(() => {
        let result = items.filter(item => item.status === 'published');

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item => 
                item.name?.toLowerCase().includes(query) ||
                item.title?.toLowerCase().includes(query) ||
                item.material?.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query) ||
                item.category?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [items, filter, searchQuery]);

    const handleSelectItem = (id) => {
        // [PERSISTENCE] Save current sub-view state before navigating away
        if (saveGalleryState) {
            saveGalleryState({ filter });
        }
        onSelectItem(id);
    };

    // Always use Architectural
    const LayoutComponent = ArchitecturalLayout;

    return (
        <div className="min-h-screen">
            <SEO
                title={KIT_CONFIG.seo.galleryTitle}
                description={KIT_CONFIG.seo.galleryDescription}
                url="/"
            />

            <LayoutComponent
                items={filteredItems}
                palette={palette}
                viewMode={viewMode}
                onSelectItem={handleSelectItem}
                onPrefetchItem={onPrefetchItem}
                onShowLogin={onShowLogin}
                darkMode={darkMode}
                user={user}
                onOpenMenu={onOpenMenu}
                onOpenCart={onOpenCart}
                toggleTheme={toggleTheme}
                setHeaderProps={setHeaderProps}
                onAddToCart={onAddToCart}
                wishlistItems={wishlistItems}
                onToggleWishlist={onToggleWishlist}
                onOpenAbout={onOpenAbout}
                onNavigateCategory={onNavigateCategory}
                onOpenQuote={onOpenQuote}
                isPreparingGallery={isPreparingGallery}
                isDetailOverlayOpen={isDetailOverlayOpen}
                isCatalogComplete={isCatalogComplete}
                isLoadingFullCatalog={isLoadingFullCatalog}
                onLoadFullCatalog={onLoadFullCatalog}
                headerProps={useMemo(() => ({
                    filter,
                    setFilter: (val) => {
                        setFilter(val);
                        if (saveGalleryState) saveGalleryState({ filter: val, searchQuery });
                    },
                    setViewMode,
                    viewMode,
                    searchQuery,
                    setSearchQuery: (val) => {
                        setSearchQuery(val);
                        if (saveGalleryState) saveGalleryState({ filter, searchQuery: val });
                    }
                }), [filter, viewMode, searchQuery, saveGalleryState])}
            />
        </div>
    );
};

export default GalleryView;
