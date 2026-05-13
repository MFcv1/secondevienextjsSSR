import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronDown, SlidersHorizontal, X, Grid3X3, List, Heart, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './components/ProductCard';
import PremiumMegaMenu from './components/PremiumMegaMenu';
import KIT_CONFIG from '../config/constants';
import { getCategoryUrl, getProductUrl } from '../../utils/slug';
import { getProductCardImage } from '../../utils/imageUtils';
import { getCategorySeoCopy } from './seoCopy';

const SORT_OPTIONS = [
    { id: 'newest', label: 'Plus récent' },
    { id: 'price-asc', label: 'Prix croissant' },
    { id: 'price-desc', label: 'Prix décroissant' },
    { id: 'name-asc', label: 'A → Z' },
];

// Legacy category IDs that may exist in DB for old items
const LEGACY_IDS = {
    mobilier: ['armoires', 'buffets', 'commodes', 'tables'],
    assises: ['chaises', 'fauteuils', 'bancs'],
};

const productCardReveal = {
    initial: { opacity: 1, y: 0, scale: 1 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, amount: 0.16 },
};

const getProductCardRevealTransition = (index) => ({
    duration: 0,
    delay: 0,
    ease: [0.22, 1, 0.36, 1],
});

// Build the full set of DB category values to match for a given categoryId
const getMatchingCategoryIds = (categoryId) => {
    // Check if it's a group page
    const group = KIT_CONFIG.categoryGroups?.find(g => g.id === categoryId);
    if (group) {
        // Group page: match all sub-category IDs + any legacy IDs that map to these sub-categories
        const ids = new Set(group.subCategories);
        // Also match legacy parent IDs (e.g. 'mobilier', 'assises') stored in old items
        Object.entries(LEGACY_IDS).forEach(([legacyId, children]) => {
            if (children.some(c => ids.has(c))) ids.add(legacyId);
        });
        return [...ids];
    }
    // Individual page: match the ID itself + any legacy parent
    const ids = new Set([categoryId]);
    Object.entries(LEGACY_IDS).forEach(([legacyId, children]) => {
        if (children.includes(categoryId)) ids.add(legacyId);
    });
    return [...ids];
};

const formatMobileCategoryTitle = (label) => {
    const cleaned = label.replace(/^LES\s+/i, '').replace(/^LA\s+/i, '');
    return cleaned
        .toLocaleLowerCase('fr-FR')
        .replace(/(^|[\s&-])\S/g, (match) => match.toLocaleUpperCase('fr-FR'));
};

const FilterSection = ({ title, isOpen, onToggle, children, darkMode }) => (
    <div className={`border-b ${darkMode ? 'border-stone-800' : 'border-stone-200'} pb-4 mb-4`}>
        <button
            onClick={onToggle}
            className={`flex items-center justify-between w-full text-left py-1 group ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}
        >
            <span className="text-[12px] font-bold uppercase tracking-widest">{title}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
        </button>
        <div
            className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
            <div className="overflow-hidden">
                <div className="pt-3">{children}</div>
            </div>
        </div>
    </div>
);

const MobileProductRow = ({ item, darkMode, onSelectItem, isLiked, onToggleWishlist, priority = false }) => {
    const price = item.currentPrice || item.startingPrice || item.price;
    const cardImage = React.useMemo(() => getProductCardImage(item), [item]);

    return (
        <a
            href={getProductUrl(item)}
            onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    onSelectItem(item.id);
                }
            }}
            className={`flex min-h-[96px] gap-3 rounded-xl border p-2 transition-colors ${darkMode ? 'border-stone-800 bg-[#181818]' : 'border-stone-200 bg-[#fffdfb]'}`}
        >
            <div className="relative h-20 w-[108px] shrink-0 overflow-hidden rounded-lg bg-stone-100">
                {item.createdAt?.seconds && (Date.now() / 1000 - item.createdAt.seconds) < 604800 && (
                    <span className="absolute left-2 top-2 z-10 rounded-sm bg-[#eef3eb] px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-[#2d4033]">
                        Nouveau
                    </span>
                )}
                <img
                    src={cardImage.src}
                    srcSet={cardImage.srcSet || undefined}
                    sizes="108px"
                    alt={item.name}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding={priority ? 'sync' : 'async'}
                    fetchpriority={priority ? 'high' : 'auto'}
                    className="h-full w-full object-cover"
                />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center pr-1">
                <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                        <h3 className={`font-serif text-[15px] leading-tight ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>{item.name}</h3>
                        <p className={`mt-1 text-[12px] ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>{item.material || 'Chêne'}</p>
                    </div>
                    {onToggleWishlist && (
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(item); }}
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${isLiked ? 'text-rose-500' : darkMode ? 'text-stone-400' : 'text-stone-500'}`}
                            aria-label={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        >
                            <Heart size={18} strokeWidth={1.6} fill={isLiked ? 'currentColor' : 'none'} />
                        </button>
                    )}
                </div>
                <p className={`mt-1.5 text-[14px] font-bold tabular-nums ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>
                    {item.sold ? 'VENDU' : item.priceOnRequest ? 'Sur demande' : `${price} €`}
                </p>
            </div>
        </a>
    );
};

const CategoryPage = ({
    categoryId,
    items,
    darkMode,
    onSelectItem,
    onPrefetchItem,
    onBack,
    onAddToCart,
    wishlistItems = [],
    onToggleWishlist,
    onOpenAbout,
    onNavigateCategory,
    setHeaderProps,
    isCatalogComplete = false,
    onLoadFullCatalog,
    onLoadCategoryCatalog
}) => {
    const [sortBy, setSortBy] = useState('newest');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [mobileViewMode, setMobileViewMode] = useState('list');

    // Filter states
    const [priceRange, setPriceRange] = useState([0, 5000]);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [selectedStyles, setSelectedStyles] = useState([]);
    const [selectedCollections, setSelectedCollections] = useState([]);
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Expose searchQuery to ArchitecturalHeader via setHeaderProps
    useEffect(() => {
        if (setHeaderProps) {
            setHeaderProps(prev => ({
                ...prev,
                searchQuery,
                setSearchQuery,
            }));
        }
    }, [searchQuery, setHeaderProps]);

    useEffect(() => {
        if (isCatalogComplete) return;
        if (onLoadCategoryCatalog) {
            onLoadCategoryCatalog(categoryId);
            return;
        }
        onLoadFullCatalog?.();
    }, [categoryId, isCatalogComplete, onLoadCategoryCatalog, onLoadFullCatalog]);

    useEffect(() => {
        if (!showMobileFilters) return;

        const scrollY = window.scrollY;
        const originalBodyStyle = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            top: document.body.style.top,
            width: document.body.style.width,
            overscrollBehavior: document.body.style.overscrollBehavior,
        };
        const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';

        return () => {
            document.body.style.overflow = originalBodyStyle.overflow;
            document.body.style.position = originalBodyStyle.position;
            document.body.style.top = originalBodyStyle.top;
            document.body.style.width = originalBodyStyle.width;
            document.body.style.overscrollBehavior = originalBodyStyle.overscrollBehavior;
            document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
            window.scrollTo(0, scrollY);
        };
    }, [showMobileFilters]);

    // Section open states
    const [openSections, setOpenSections] = useState({
        collection: true, price: true, material: true, style: true, availability: true
    });
    const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

    const sortRef = useRef(null);
    const mobileFilterScrollRef = useRef(null);
    const mobileFilterTouchRef = useRef({
        startY: 0,
        endY: 0,
        scrollTop: 0,
        isScrollable: false,
        startedAtTop: false,
        isClosingFromTop: false,
    });

    // Detect if this is a group page or individual category page
    const groupMeta = KIT_CONFIG.categoryGroups?.find(g => g.id === categoryId);
    const isGroupPage = !!groupMeta;
    const categoryMeta = groupMeta || KIT_CONFIG.productCategories.find(c => c.id === categoryId);
    const categoryLabel = categoryMeta?.label || categoryId;
    const categoryTitle = categoryLabel.replace(/^LES\s+/i, '').replace(/^LA\s+/i, '');
    const mobileCategoryTitle = formatMobileCategoryTitle(categoryLabel);
    const seoCopy = useMemo(() => getCategorySeoCopy(categoryId, categoryTitle), [categoryId, categoryTitle]);
    const relatedCategories = useMemo(() => (
        (seoCopy.related || [])
            .map(id => {
                const meta = KIT_CONFIG.categoryGroups?.find(c => c.id === id) || KIT_CONFIG.productCategories?.find(c => c.id === id);
                return meta ? { id, label: meta.label } : null;
            })
            .filter(Boolean)
    ), [seoCopy.related]);

    // Sub-categories for Collection filter (only on group pages)
    const subCategories = useMemo(() => {
        if (!isGroupPage || !groupMeta) return [];
        return groupMeta.subCategories.map(subId => {
            const meta = KIT_CONFIG.productCategories.find(c => c.id === subId);
            return { id: subId, label: meta?.label || subId };
        });
    }, [isGroupPage, groupMeta]);

    // Filter items by category (with legacy fallback for old DB values)
    const matchingIds = useMemo(() => getMatchingCategoryIds(categoryId), [categoryId]);
    const categoryItems = useMemo(() => {
        return (items || []).filter(i => matchingIds.includes(i.category) && i.status === 'published');
    }, [items, matchingIds]);

    // Extract unique materials and styles from items
    const availableMaterials = useMemo(() => {
        const materials = new Set();
        categoryItems.forEach(i => {
            if (i.material) materials.add(i.material);
        });
        return [...materials].sort();
    }, [categoryItems]);

    const availableStyles = useMemo(() => {
        const styles = new Set();
        categoryItems.forEach(i => {
            if (i.style) styles.add(i.style);
        });
        return [...styles].sort();
    }, [categoryItems]);

    // Max price for slider
    const maxPrice = useMemo(() => {
        if (categoryItems.length === 0) return 5000;
        return Math.max(...categoryItems.map(i => {
            const p = i.currentPrice !== undefined ? i.currentPrice : (i.price || 0);
            return p;
        }), 100);
    }, [categoryItems]);

    // Apply filters + sort
    const filteredItems = useMemo(() => {
        let result = [...categoryItems];

        // Price filter
        result = result.filter(i => {
            const p = i.currentPrice !== undefined ? i.currentPrice : (i.price || 0);
            return p >= priceRange[0] && p <= priceRange[1];
        });

        // Material filter
        if (selectedMaterials.length > 0) {
            result = result.filter(i => selectedMaterials.includes(i.material));
        }

        // Style filter
        if (selectedStyles.length > 0) {
            result = result.filter(i => selectedStyles.includes(i.style));
        }

        // Collection filter (group pages only) — expand to include legacy parent IDs
        if (selectedCollections.length > 0) {
            const expandedIds = new Set(selectedCollections);
            // If any selected sub-category has a legacy parent, include items with that parent too
            Object.entries(LEGACY_IDS).forEach(([legacyId, children]) => {
                if (children.some(c => expandedIds.has(c))) expandedIds.add(legacyId);
            });
            result = result.filter(i => expandedIds.has(i.category));
        }

        // Availability filter
        if (availabilityFilter === 'in-stock') {
            result = result.filter(i => (i.stock > 0 || i.stock === undefined) && !i.sold);
        } else if (availabilityFilter === 'sold') {
            result = result.filter(i => i.sold);
        }

        // Sort
        switch (sortBy) {
            case 'price-asc':
                result.sort((a, b) => ((a.currentPrice ?? a.price ?? 0) - (b.currentPrice ?? b.price ?? 0)));
                break;
            case 'price-desc':
                result.sort((a, b) => ((b.currentPrice ?? b.price ?? 0) - (a.currentPrice ?? a.price ?? 0)));
                break;
            case 'name-asc':
                result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'newest':
            default:
                result.sort((a, b) => ((b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
                break;
        }

        // Search query filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(i =>
                i.title?.toLowerCase().includes(q) ||
                i.name?.toLowerCase().includes(q) ||
                i.description?.toLowerCase().includes(q) ||
                i.material?.toLowerCase().includes(q)
            );
        }

        return result;
    }, [categoryItems, priceRange, selectedMaterials, selectedStyles, selectedCollections, availabilityFilter, sortBy, searchQuery]);

    const toggleMaterial = (m) => {
        setSelectedMaterials(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
    };

    const toggleStyle = (s) => {
        setSelectedStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const toggleCollection = (c) => {
        setSelectedCollections(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    };

    const clearAllFilters = () => {
        setPriceRange([0, maxPrice]);
        setSelectedMaterials([]);
        setSelectedStyles([]);
        setSelectedCollections([]);
        setAvailabilityFilter('all');
        setSearchQuery('');
    };

    const hasActiveFilters = selectedMaterials.length > 0 || selectedStyles.length > 0 || selectedCollections.length > 0 || availabilityFilter !== 'all' || priceRange[0] > 0 || priceRange[1] < maxPrice || searchQuery.length > 0;

    const closeMobileFilters = () => {
        setShowMobileFilters(false);
    };

    const isMobileFilterScrollable = (el) => el.scrollHeight > el.clientHeight + 1;

    const handleMobileFilterCloseZoneTouchStart = (event) => {
        const touch = event.targetTouches?.[0];
        if (!touch) return;

        mobileFilterTouchRef.current.startY = touch.clientY;
        mobileFilterTouchRef.current.endY = touch.clientY;
        mobileFilterTouchRef.current.isClosingFromTop = false;
    };

    const handleMobileFilterCloseZoneTouchMove = (event) => {
        const touch = event.targetTouches?.[0];
        if (!touch) return;

        mobileFilterTouchRef.current.endY = touch.clientY;
    };

    const handleMobileFilterCloseZoneTouchEnd = (event) => {
        const { startY, endY } = mobileFilterTouchRef.current;
        if (!startY || !endY) return;

        const dy = startY - endY;
        if (dy < -34) {
            closeMobileFilters();
        }

        event.stopPropagation();
    };

    const handleMobileFilterScrollTouchStart = (event) => {
        const touch = event.targetTouches?.[0];
        if (!touch) return;

        mobileFilterTouchRef.current.startY = touch.clientY;
        mobileFilterTouchRef.current.endY = touch.clientY;
        mobileFilterTouchRef.current.scrollTop = event.currentTarget.scrollTop;
        mobileFilterTouchRef.current.isScrollable = isMobileFilterScrollable(event.currentTarget);
        mobileFilterTouchRef.current.startedAtTop = event.currentTarget.scrollTop <= 1;
        mobileFilterTouchRef.current.isClosingFromTop = false;

        event.stopPropagation();
    };

    const handleMobileFilterScrollTouchMove = (event) => {
        const touch = event.targetTouches?.[0];
        if (!touch) return;

        const scroller = event.currentTarget;
        const state = mobileFilterTouchRef.current;
        const currentY = touch.clientY;
        const pullDownDistance = currentY - state.startY;
        state.endY = currentY;

        if (!state.isScrollable) {
            event.stopPropagation();
            return;
        }

        if (state.startedAtTop && (state.isClosingFromTop || pullDownDistance > 10)) {
            state.isClosingFromTop = true;
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const dy = state.startY - currentY;
        scroller.scrollTop = state.scrollTop + dy;
        event.preventDefault();
        event.stopPropagation();
    };

    const handleMobileFilterScrollTouchEnd = (event) => {
        if (!mobileFilterTouchRef.current.isScrollable || mobileFilterTouchRef.current.isClosingFromTop) {
            handleMobileFilterCloseZoneTouchEnd(event);
            return;
        }

        event.stopPropagation();
    };

    const handleMobileFilterWheel = (event) => {
        const scroller = mobileFilterScrollRef.current;
        if (!showMobileFilters || !scroller) return;

        event.preventDefault();
        event.stopPropagation();

        if (scroller.scrollTop <= 1 && event.deltaY < -80) {
            closeMobileFilters();
            return;
        }

        scroller.scrollTop += event.deltaY;
    };

    // Helper to count items per sub-category
    const getSubCategoryCount = (subId) => {
        const legacyMatch = getMatchingCategoryIds(subId);
        return categoryItems.filter(i => legacyMatch.includes(i.category)).length;
    };

    // Collection filter JSX (only rendered on group pages)
    const collectionFilterJSX = isGroupPage && subCategories.length > 1 ? (
        <FilterSection title="Collection" isOpen={openSections.collection} onToggle={() => toggleSection('collection')} darkMode={darkMode}>
            <div className="space-y-2">
                {subCategories.map(sub => {
                    const count = getSubCategoryCount(sub.id);
                    return (
                        <label key={sub.id} className={`flex items-center gap-3 cursor-pointer group ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                            <input
                                type="checkbox"
                                checked={selectedCollections.includes(sub.id)}
                                onChange={() => toggleCollection(sub.id)}
                                className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                            />
                            <span className="text-[13px] group-hover:font-medium transition-all">{sub.label}</span>
                            <span className={`text-[11px] ml-auto ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                                ({count})
                            </span>
                        </label>
                    );
                })}
            </div>
        </FilterSection>
    ) : null;

    // Sidebar content (shared between desktop and mobile) — plain JSX, NOT a component
    const filtersContent = (
        <div className="space-y-1">
            {/* Collection (group pages only) */}
            {collectionFilterJSX}

            {/* Price */}
            <FilterSection title="Prix" isOpen={openSections.price} onToggle={() => toggleSection('price')} darkMode={darkMode}>
                <div className="space-y-3">
                    <input
                        type="range"
                        min={0}
                        max={Math.ceil(maxPrice / 100) * 100}
                        step={10}
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full accent-stone-800 dark:accent-stone-300"
                    />
                    <div className="flex justify-between text-[11px] font-mono">
                        <span className={darkMode ? 'text-stone-400' : 'text-stone-500'}>{priceRange[0].toFixed(0)}€</span>
                        <span className={darkMode ? 'text-stone-400' : 'text-stone-500'}>{priceRange[1].toFixed(0)}€</span>
                    </div>
                </div>
            </FilterSection>

            {/* Material */}
            {availableMaterials.length > 0 && (
                <FilterSection title="Matière" isOpen={openSections.material} onToggle={() => toggleSection('material')} darkMode={darkMode}>
                    <div className="space-y-2">
                        {availableMaterials.map(m => (
                            <label key={m} className={`flex items-center gap-3 cursor-pointer group ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedMaterials.includes(m)}
                                    onChange={() => toggleMaterial(m)}
                                    className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                                />
                                <span className="text-[13px] group-hover:font-medium transition-all">{m}</span>
                                <span className={`text-[11px] ml-auto ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                                    ({categoryItems.filter(i => i.material === m).length})
                                </span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* Style */}
            {availableStyles.length > 0 && (
                <FilterSection title="Style" isOpen={openSections.style} onToggle={() => toggleSection('style')} darkMode={darkMode}>
                    <div className="space-y-2">
                        {availableStyles.map(s => (
                            <label key={s} className={`flex items-center gap-3 cursor-pointer group ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedStyles.includes(s)}
                                    onChange={() => toggleStyle(s)}
                                    className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                                />
                                <span className="text-[13px] group-hover:font-medium transition-all">{s}</span>
                                <span className={`text-[11px] ml-auto ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                                    ({categoryItems.filter(i => i.style === s).length})
                                </span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* Availability */}
            <FilterSection title="Disponibilité" isOpen={openSections.availability} onToggle={() => toggleSection('availability')} darkMode={darkMode}>
                <div className="space-y-2">
                    {[
                        { id: 'all', label: 'Tout voir' },
                        { id: 'in-stock', label: 'En stock' },
                        { id: 'sold', label: 'Vendu' },
                    ].map(opt => (
                        <label key={opt.id} className={`flex items-center gap-3 cursor-pointer group ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                            <input
                                type="radio"
                                name="availability"
                                checked={availabilityFilter === opt.id}
                                onChange={() => setAvailabilityFilter(opt.id)}
                                className="w-4 h-4 border-stone-300 text-stone-800 focus:ring-stone-500"
                            />
                            <span className="text-[13px] group-hover:font-medium transition-all">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* Clear filters */}
            {hasActiveFilters && (
                <button
                    onClick={clearAllFilters}
                    className={`w-full mt-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                    Réinitialiser les filtres
                </button>
            )}
        </div>
    );

    const filtersContentMobile = (
        <div className="space-y-1">
            {/* Collection (group pages only) */}
            {collectionFilterJSX}

            <FilterSection title="Prix" isOpen={openSections.price} onToggle={() => toggleSection('price')} darkMode={darkMode}>
                <div className="space-y-3">
                    <input
                        type="range"
                        min={0}
                        max={Math.ceil(maxPrice / 100) * 100}
                        step={10}
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full accent-stone-800 dark:accent-stone-300"
                    />
                    <div className="flex justify-between text-[11px] font-mono">
                        <span className={darkMode ? 'text-stone-400' : 'text-stone-500'}>{priceRange[0].toFixed(0)}€</span>
                        <span className={darkMode ? 'text-stone-400' : 'text-stone-500'}>{priceRange[1].toFixed(0)}€</span>
                    </div>
                </div>
            </FilterSection>
            {availableMaterials.length > 0 && (
                <FilterSection title="Matière" isOpen={openSections.material} onToggle={() => toggleSection('material')} darkMode={darkMode}>
                    <div className="space-y-2">
                        {availableMaterials.map(m => (
                            <label key={m} className={`flex items-center gap-3 cursor-pointer group ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                                <input type="checkbox" checked={selectedMaterials.includes(m)} onChange={() => toggleMaterial(m)} className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500" />
                                <span className="text-[13px] group-hover:font-medium transition-all">{m}</span>
                                <span className={`text-[11px] ml-auto ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>({categoryItems.filter(i => i.material === m).length})</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}
            {availableStyles.length > 0 && (
                <FilterSection title="Style" isOpen={openSections.style} onToggle={() => toggleSection('style')} darkMode={darkMode}>
                    <div className="space-y-2">
                        {availableStyles.map(s => (
                            <label key={s} className={`flex items-center gap-3 cursor-pointer group ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                                <input type="checkbox" checked={selectedStyles.includes(s)} onChange={() => toggleStyle(s)} className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500" />
                                <span className="text-[13px] group-hover:font-medium transition-all">{s}</span>
                                <span className={`text-[11px] ml-auto ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>({categoryItems.filter(i => i.style === s).length})</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}
            <FilterSection title="Disponibilité" isOpen={openSections.availability} onToggle={() => toggleSection('availability')} darkMode={darkMode}>
                <div className="space-y-2">
                    {[{ id: 'all', label: 'Tout voir' }, { id: 'in-stock', label: 'En stock' }, { id: 'sold', label: 'Vendu' }].map(opt => (
                        <label key={opt.id} className={`flex items-center gap-3 cursor-pointer group ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                            <input type="radio" name="availability-mobile" checked={availabilityFilter === opt.id} onChange={() => setAvailabilityFilter(opt.id)} className="w-4 h-4 border-stone-300 text-stone-800 focus:ring-stone-500" />
                            <span className="text-[13px] group-hover:font-medium transition-all">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </FilterSection>
            {hasActiveFilters && (
                <button onClick={clearAllFilters} className={`w-full mt-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                    Réinitialiser les filtres
                </button>
            )}
        </div>
    );

    return (
        <div className={`w-full min-h-screen transition-colors duration-500 ${darkMode ? 'bg-[#121212] text-[#f5f5f5]' : 'bg-[#FAFAF9] text-stone-900'}`}>

            {/* Mega Menu */}
            <PremiumMegaMenu darkMode={darkMode} onOpenAbout={onOpenAbout} onNavigateCategory={onNavigateCategory} />

            {/* Header */}
            <div className={`border-b ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
                <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pb-4 pt-5 md:py-8">
                    <div className="mb-4 hidden items-center gap-3 md:flex">
                        <button
                            onClick={onBack}
                            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'text-stone-500 hover:text-white' : 'text-stone-400 hover:text-stone-900'}`}
                        >
                            <ChevronLeft size={14} /> Galerie
                        </button>
                        <span className={`text-[10px] ${darkMode ? 'text-stone-700' : 'text-stone-300'}`}>/</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                            {categoryLabel}
                        </span>
                    </div>
                    <h1 className="font-serif text-[34px] leading-tight md:text-4xl lg:text-5xl">
                        <span className="md:hidden">{mobileCategoryTitle}</span>
                        <span className="hidden md:inline">{categoryTitle}</span>
                    </h1>
                    <div className="mt-4 grid gap-4 md:mt-5 md:grid-cols-[1fr_auto] md:items-end">
                        <div className="max-w-3xl">
                            <p className={`text-[14px] leading-[1.75] md:text-[15px] ${darkMode ? 'text-stone-300/86' : 'text-stone-600'}`}>
                                {seoCopy.intro}
                            </p>
                            <p className={`mt-2 text-[12.5px] leading-[1.7] ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>
                                {seoCopy.detail}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 md:justify-end">
                            <a
                                href="/"
                                onClick={(event) => { event.preventDefault(); onBack?.(); }}
                                className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${darkMode ? 'border-white/12 text-stone-300 hover:border-white/28 hover:text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'}`}
                            >
                                Galerie
                            </a>
                            <a
                                href="/a-propos"
                                onClick={(event) => { if (onOpenAbout) { event.preventDefault(); onOpenAbout(); } }}
                                className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${darkMode ? 'border-white/12 text-stone-300 hover:border-white/28 hover:text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'}`}
                            >
                                À propos
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className={`border-b ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
                <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-3">
                    <div className="mb-4 flex items-center justify-between gap-3 md:mb-0">
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Mobile filter toggle */}
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className={`md:hidden flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[12px] font-medium border transition-colors ${darkMode ? 'border-stone-700 text-stone-300 hover:border-stone-500' : 'border-stone-200 text-stone-700 hover:border-stone-400'}`}
                        >
                            <SlidersHorizontal size={15} /> Filtrer
                            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        </button>
                        <span className={`hidden text-[12px] font-medium md:inline ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                            {filteredItems.length} produit{filteredItems.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View mode toggle */}
                        <div className={`hidden md:flex items-center border rounded-lg overflow-hidden ${darkMode ? 'border-stone-700' : 'border-stone-200'}`}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 transition-colors ${viewMode === 'grid' ? (darkMode ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900') : (darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600')}`}
                            >
                                <Grid3X3 size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 transition-colors ${viewMode === 'list' ? (darkMode ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900') : (darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600')}`}
                            >
                                <List size={16} />
                            </button>
                        </div>

                        {/* Sort dropdown */}
                        <div className="relative" ref={sortRef}>
                            <button
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[12px] font-medium md:text-[11px] md:font-bold md:uppercase md:tracking-widest border transition-colors ${darkMode ? 'border-stone-700 text-stone-300 hover:border-stone-500' : 'border-stone-200 text-stone-700 md:text-stone-600 hover:border-stone-400'}`}
                            >
                                <span className="md:hidden">Trier</span>
                                <span className="hidden md:inline">{SORT_OPTIONS.find(s => s.id === sortBy)?.label}</span>
                                <ChevronDown size={12} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {showSortDropdown && (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowSortDropdown(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className={`absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border shadow-xl overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-stone-700' : 'bg-white border-stone-200'}`}
                                        >
                                            {SORT_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => { setSortBy(opt.id); setShowSortDropdown(false); }}
                                                    className={`w-full text-left px-4 py-3 text-[12px] font-medium transition-colors ${sortBy === opt.id ? (darkMode ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900') : (darkMode ? 'text-stone-400 hover:bg-white/5 hover:text-white' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900')}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className={`flex md:hidden items-center gap-1 ${darkMode ? 'text-stone-300' : 'text-stone-800'}`}>
                            <button
                                onClick={() => setMobileViewMode('grid')}
                                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                                    mobileViewMode === 'grid'
                                        ? (darkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-950 text-white')
                                        : (darkMode ? 'bg-white/10' : 'bg-stone-100')
                                }`}
                                aria-label="Vue grille"
                            >
                                <LayoutGrid size={16} strokeWidth={1.6} />
                            </button>
                            <button
                                onClick={() => setMobileViewMode('list')}
                                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                                    mobileViewMode === 'list'
                                        ? (darkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-950 text-white')
                                        : (darkMode ? 'bg-white/10' : 'bg-stone-100')
                                }`}
                                aria-label="Vue liste"
                            >
                                <List size={16} strokeWidth={1.6} />
                            </button>
                        </div>
                    </div>
                    </div>
                    <p className={`text-[13px] md:hidden ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>
                        {filteredItems.length} produit{filteredItems.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-4 md:py-12">
                <div className="flex gap-8 lg:gap-12">

                    {/* Desktop Sidebar */}
                    <aside className={`hidden md:block w-[220px] lg:w-[250px] shrink-0`}>
                        {filtersContent}
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1 min-w-0">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <p className={`text-lg font-serif mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                                    Aucun produit trouvé
                                </p>
                                <p className={`text-[13px] mb-6 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                                    Essayez de modifier vos filtres
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearAllFilters}
                                        className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${darkMode ? 'border-stone-700 text-stone-300 hover:border-stone-400' : 'border-stone-300 text-stone-600 hover:border-stone-500'}`}
                                    >
                                        Réinitialiser
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                            <div className={`${mobileViewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-2.5'} md:hidden`}>
                                {filteredItems.map((item, index) => (
                                    mobileViewMode === 'grid' ? (
                                        <motion.div
                                            key={item.id}
                                            className="product-card-wrap relative"
                                            {...productCardReveal}
                                            transition={getProductCardRevealTransition(index)}
                                        >
                                            {item.createdAt?.seconds && (Date.now() / 1000 - item.createdAt.seconds) < 604800 && (
                                                <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-[#d4e1d9] text-[#2d4033] text-[8px] uppercase font-bold tracking-widest rounded-sm">
                                                    Nouveau
                                                </div>
                                            )}
                                            <ProductCard
                                                item={item}
                                                layoutMode="grid"
                                                isBig={false}
                                                darkMode={darkMode}
                                                compact={true}
                                                priority={index < 2}
                                                onClick={() => onSelectItem(item.id)}
                                                onPrefetch={() => onPrefetchItem?.(item.id)}
                                                onAddToCart={onAddToCart}
                                                isLiked={wishlistItems.some(w => w.originalId === item.id)}
                                                onToggleLike={onToggleWishlist}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key={item.id}
                                            {...productCardReveal}
                                            transition={getProductCardRevealTransition(index)}
                                        >
                                            <MobileProductRow
                                                item={item}
                                                darkMode={darkMode}
                                                onSelectItem={onSelectItem}
                                                isLiked={wishlistItems.some(w => w.originalId === item.id)}
                                                onToggleWishlist={onToggleWishlist}
                                                priority={index < 2}
                                            />
                                        </motion.div>
                                    )
                                ))}
                            </div>
                            <div className={`hidden md:grid gap-[24px] ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                {filteredItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        className="product-card-wrap relative"
                                        {...productCardReveal}
                                        transition={getProductCardRevealTransition(index)}
                                    >
                                        {item.createdAt?.seconds && (Date.now() / 1000 - item.createdAt.seconds) < 604800 && (
                                            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-[#d4e1d9] text-[#2d4033] text-[8px] md:text-[9px] uppercase font-bold tracking-widest rounded-sm">
                                                Nouveau
                                            </div>
                                        )}
                                        <ProductCard
                                            item={item}
                                            layoutMode={viewMode}
                                            isBig={false}
                                            darkMode={darkMode}
                                            compact={true}
                                            priority={index < 2}
                                            onClick={() => onSelectItem(item.id)}
                                            onPrefetch={() => onPrefetchItem?.(item.id)}
                                            onAddToCart={onAddToCart}
                                            isLiked={wishlistItems.some(w => w.originalId === item.id)}
                                            onToggleLike={onToggleWishlist}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {(relatedCategories.length > 0 || seoCopy.faq?.length > 0) && (
                <section className={`border-t px-4 py-8 md:px-8 lg:px-12 ${darkMode ? 'border-stone-800' : 'border-stone-200'}`} aria-labelledby="category-seo-more">
                    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                        <div>
                            <p className={`mb-3 font-sans text-[10px] font-black uppercase tracking-[0.24em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                Guide catégorie
                            </p>
                            <h2 id="category-seo-more" className={`font-serif text-[26px] leading-tight md:text-[32px] ${darkMode ? 'text-white' : 'text-stone-950'}`}>
                                Choisir {categoryTitle.toLocaleLowerCase('fr-FR')} sans perdre le charme de l’ancien
                            </h2>
                            {relatedCategories.length > 0 && (
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {relatedCategories.map(category => (
                                        <a
                                            key={category.id}
                                            href={getCategoryUrl(category.id)}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                onNavigateCategory?.(category.id);
                                            }}
                                            className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${darkMode ? 'border-white/12 text-stone-300 hover:border-white/28 hover:text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'}`}
                                        >
                                            {category.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                        {seoCopy.faq?.length > 0 && (
                            <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-200'}`}>
                                {seoCopy.faq.map((entry) => (
                                    <div key={entry.question} className="py-4 first:pt-0">
                                        <h3 className={`text-[13px] font-bold leading-snug ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
                                            {entry.question}
                                        </h3>
                                        <p className={`mt-2 text-[12.5px] leading-[1.75] ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                                            {entry.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Mobile Filters Drawer */}
            <div
                className={`fixed inset-0 z-[200] bg-black/40 transition-opacity duration-300 md:hidden ${showMobileFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={closeMobileFilters}
                aria-hidden="true"
            />
            <div
                className={`fixed inset-x-0 bottom-0 z-[201] h-[90dvh] max-h-[90dvh] overflow-hidden overscroll-none rounded-t-[28px] shadow-2xl transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] md:hidden ${showMobileFilters ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#fffdfb]'}`}
                aria-hidden={!showMobileFilters}
            >
                <div className="flex h-full min-h-0 flex-col p-6 safe-pb-filter-drawer">
                    <div
                        className="flex-shrink-0 touch-pan-y select-none"
                        onTouchStart={handleMobileFilterCloseZoneTouchStart}
                        onTouchMove={handleMobileFilterCloseZoneTouchMove}
                        onTouchEnd={handleMobileFilterCloseZoneTouchEnd}
                    >
                        <div
                            className="-mx-6 -mt-3 mb-2 flex h-8 cursor-pointer items-center justify-center md:hidden"
                            onClick={closeMobileFilters}
                            aria-hidden="true"
                        >
                            <span className={`h-1 w-14 rounded-full ${darkMode ? 'bg-stone-700' : 'bg-stone-300'}`} />
                        </div>
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h3 className="font-serif text-2xl">Filtrer</h3>
                                <p className={`mt-1 text-[12px] ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>{filteredItems.length} résultat{filteredItems.length !== 1 ? 's' : ''}</p>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearAllFilters}
                                    className={`text-[12px] underline underline-offset-4 ${darkMode ? 'text-stone-400' : 'text-[#9C8268]'}`}
                                >
                                    Réinitialiser
                                </button>
                            )}
                            <button
                                onClick={closeMobileFilters}
                                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-stone-100'}`}
                                aria-label="Fermer les filtres"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    <div
                        ref={mobileFilterScrollRef}
                        className="mobile-filter-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-5"
                        onTouchStart={handleMobileFilterScrollTouchStart}
                        onTouchMove={handleMobileFilterScrollTouchMove}
                        onTouchEnd={handleMobileFilterScrollTouchEnd}
                        onWheel={handleMobileFilterWheel}
                    >
                        {filtersContentMobile}
                    </div>
                    <button
                        onClick={closeMobileFilters}
                        className={`mt-6 w-full flex-shrink-0 rounded-md py-4 text-[13px] font-bold transition-colors ${darkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-950 text-white'}`}
                    >
                        Voir les {filteredItems.length} résultat{filteredItems.length !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryPage;
