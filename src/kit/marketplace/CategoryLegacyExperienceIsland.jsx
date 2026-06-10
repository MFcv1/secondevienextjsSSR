"use client";

import React from 'react';
import { ChevronDown, ChevronLeft, Grid3X3, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import KIT_CONFIG from '../config/constants';
import { getCategoryUrl, getProductUrl } from '../../utils/slug';
import { PRODUCT_CARD_IMAGE_SIZES, getProductCardImage, preloadPrimaryProductDetailImage } from '../../utils/imageUtils';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Plus récent' },
  { id: 'price-asc', label: 'Prix croissant' },
  { id: 'price-desc', label: 'Prix décroissant' },
  { id: 'name-asc', label: 'A → Z' },
];

const LEGACY_IDS = {
  mobilier: ['armoires', 'buffets', 'commodes', 'tables'],
  assises: ['chaises', 'fauteuils', 'bancs'],
};

const getCreatedTime = (item) => {
  const value = item?.createdAt;
  if (!value) return 0;
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  return 0;
};

const getPrice = (item) => Number(item?.currentPrice ?? item?.startingPrice ?? item?.price ?? 0);

const rememberProductReturnTarget = () => {
  try {
    const galleryScroller = document.getElementById('marketplaceGalleryScroll');
    window.sessionStorage.setItem('secondevie:product-return:v1', JSON.stringify({
      href: `${window.location.pathname}${window.location.search || ''}${window.location.hash || ''}`,
      scrollY: window.scrollY || 0,
      galleryScrollTop: galleryScroller?.scrollTop || 0,
      savedAt: Date.now(),
    }));
  } catch {
    // Best effort only.
  }
};

const warmupProduct = (item) => {
  const connection = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;
  preloadPrimaryProductDetailImage(item, {
    priority: 'high',
    decode: true,
    variant: 'medium',
    srcSet: false,
  });
};

const FilterSection = ({ title, isOpen, onToggle, children, darkMode }) => (
  <div className={`mb-4 border-b pb-4 ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
    <button
      type="button"
      onClick={onToggle}
      className={`group flex w-full items-center justify-between py-1 text-left ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}
    >
      <span className="text-[12px] font-bold uppercase tracking-widest">{title}</span>
      <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
    </button>
    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">
        <div className="pt-3">{children}</div>
      </div>
    </div>
  </div>
);

const ProductCard = ({ item, layoutMode = 'grid', compact = true, priority = false }) => {
  const cardImage = React.useMemo(() => getProductCardImage(item), [item]);
  const title = item?.name || item?.title || 'Pièce restaurée';
  const price = getPrice(item);

  return (
    <a
      href={getProductUrl(item)}
      draggable={false}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') warmupProduct(item);
      }}
      onPointerDown={(event) => {
        if (event.target?.closest?.('button, input, textarea, select, [data-card-action]')) return;
        warmupProduct(item);
      }}
      onClick={(event) => {
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
          rememberProductReturnTarget();
          warmupProduct(item);
        }
      }}
      className={`group relative flex touch-manipulation flex-col ${compact ? 'gap-3 md:gap-6' : 'gap-6'} w-full cursor-pointer text-inherit no-underline ${layoutMode === 'list' ? 'flex-row items-center gap-12 border-b border-stone-200 pb-12' : ''}`}
    >
      <div
        className={`product-card-media relative overflow-hidden rounded-[12px] bg-[#fbfaf8] ${layoutMode === 'list' ? 'aspect-[4/3] w-1/3' : 'aspect-[3/4] w-full'}`}
        data-image-reveal="visible"
        data-image-loaded={cardImage.src ? 'true' : 'false'}
      >
        {cardImage.src ? (
          <picture className="block h-full w-full">
            <img
              src={cardImage.src}
              srcSet={cardImage.srcSet || undefined}
              sizes={PRODUCT_CARD_IMAGE_SIZES}
              alt={title}
              draggable={false}
              data-real-image="true"
              className="product-card-image h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] lg:group-hover:scale-[1.03]"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' : 'auto'}
            />
          </picture>
        ) : null}

        <div className="absolute inset-0 hidden items-center justify-center bg-black/0 transition-colors duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:bg-black/50 lg:flex">
          <div className="relative flex flex-col items-center gap-3 px-10 py-7 opacity-0 transition-opacity duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:opacity-100">
            <div className="absolute left-0 top-0 h-3 w-3 translate-x-2 translate-y-2 border-l border-t border-white/40 transition-all duration-[600ms] group-hover:translate-x-0 group-hover:translate-y-0" />
            <div className="absolute right-0 top-0 h-3 w-3 -translate-x-2 translate-y-2 border-r border-t border-white/40 transition-all duration-[600ms] group-hover:translate-x-0 group-hover:translate-y-0" />
            <div className="absolute bottom-0 left-0 h-3 w-3 translate-x-2 -translate-y-2 border-b border-l border-white/40 transition-all duration-[600ms] group-hover:translate-x-0 group-hover:translate-y-0" />
            <div className="absolute bottom-0 right-0 h-3 w-3 -translate-x-2 -translate-y-2 border-b border-r border-white/40 transition-all duration-[600ms] group-hover:translate-x-0 group-hover:translate-y-0" />
            <span className="translate-y-2 text-[9px] font-black uppercase tracking-[0.4em] text-white transition-transform duration-[600ms] group-hover:translate-y-0">
              Découvrir
            </span>
            <div className="h-[1.5px] w-8 origin-center scale-x-0 bg-white/30 transition-transform duration-[800ms] group-hover:scale-x-100" />
          </div>
        </div>
      </div>

      <div className={`flex ${compact ? 'flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-4' : 'items-start justify-between gap-2 md:gap-4'} ${layoutMode === 'list' ? 'flex-1 pt-6' : compact ? 'pt-1 md:pt-4' : 'pt-4'}`}>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:gap-1">
          <div className={`truncate font-black uppercase tracking-widest opacity-50 ${compact ? 'text-[8px] md:text-[9px]' : 'text-[9px]'}`}>
            {item?.material || 'Matière inconnue'}
          </div>
          <h3 className={`font-serif leading-tight ${compact ? 'text-[13px] md:text-lg lg:text-xl' : 'text-[15px] md:text-lg lg:text-xl'} ${layoutMode === 'list' ? 'text-4xl' : ''}`}>
            {title}
          </h3>
        </div>

        <div className={`flex shrink-0 ${compact ? 'flex-row items-center justify-between md:flex-col md:items-end' : 'flex-col items-end'} gap-0.5 text-right md:gap-1`}>
          <div className={`whitespace-nowrap font-black uppercase tracking-widest opacity-50 ${compact ? 'text-[8px] md:text-[9px]' : 'text-[9px]'}`}>
            {item?.sold ? 'Stock: 0' : `Stock: ${item?.stock !== undefined ? item.stock : 1}`}
          </div>
          <p className={`whitespace-nowrap font-bold tabular-nums ${compact ? 'text-[10px] md:text-xs lg:text-sm' : 'text-[11px] md:text-xs lg:text-sm'} ${item?.sold ? 'text-red-500' : ''}`}>
            {item?.sold ? 'VENDU' : item?.priceOnRequest ? '' : price ? `${price} EUR` : ''}
          </p>
        </div>
      </div>
    </a>
  );
};

const MobileProductRow = ({ item, darkMode, priority = false }) => {
  const cardImage = React.useMemo(() => getProductCardImage(item), [item]);
  const title = item?.name || item?.title || 'Pièce restaurée';
  const price = getPrice(item);

  return (
    <a
      href={getProductUrl(item)}
      onPointerDown={() => warmupProduct(item)}
      onClick={() => {
        rememberProductReturnTarget();
        warmupProduct(item);
      }}
      className={`flex min-h-[96px] gap-3 rounded-xl border p-2 transition-colors ${darkMode ? 'border-stone-800 bg-[#181818]' : 'border-stone-200 bg-[#fffdfb]'}`}
    >
      <div className="product-card-media relative h-20 w-[108px] shrink-0 rounded-lg bg-stone-100" data-image-reveal="visible" data-image-loaded={cardImage.src ? 'true' : 'false'}>
        {cardImage.src ? (
          <img
            src={cardImage.src}
            srcSet={cardImage.srcSet || undefined}
            sizes="108px"
            alt={title}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            className="product-card-image h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center pr-1">
        <h3 className={`font-serif text-[15px] leading-tight ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>{title}</h3>
        <p className={`mt-1 text-[12px] ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>{item?.material || 'Chêne'}</p>
        <p className={`mt-1.5 text-[14px] font-bold tabular-nums ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>
          {item?.sold ? 'VENDU' : item?.priceOnRequest ? 'Sur demande' : price ? `${price} EUR` : ''}
        </p>
      </div>
    </a>
  );
};

export default function CategoryLegacyExperienceIsland({
  categoryId,
  categoryLabel,
  products = [],
  copy,
  darkMode = false,
}) {
  const [sortBy, setSortBy] = React.useState('newest');
  const [showSortDropdown, setShowSortDropdown] = React.useState(false);
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('grid');
  const [mobileViewMode, setMobileViewMode] = React.useState('list');
  const [selectedMaterials, setSelectedMaterials] = React.useState([]);
  const [selectedStyles, setSelectedStyles] = React.useState([]);
  const [selectedCollections, setSelectedCollections] = React.useState([]);
  const [availabilityFilter, setAvailabilityFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [openSections, setOpenSections] = React.useState({
    collection: true,
    price: true,
    material: true,
    style: true,
    availability: true,
  });

  const groupMeta = KIT_CONFIG.categoryGroups?.find((group) => group.id === categoryId);
  const isGroupPage = Boolean(groupMeta);
  const categoryTitle = String(categoryLabel || categoryId).replace(/^LES\s+/i, '').replace(/^LA\s+/i, '');
  const subCategories = React.useMemo(() => {
    if (!isGroupPage || !groupMeta) return [];
    return (groupMeta.subCategories || []).map((subId) => {
      const meta = KIT_CONFIG.productCategories.find((category) => category.id === subId);
      return { id: subId, label: meta?.label || subId };
    });
  }, [groupMeta, isGroupPage]);

  const categoryItems = React.useMemo(() => (
    (products || []).filter((item) => !item.status || item.status === 'published')
  ), [products]);

  const availableMaterials = React.useMemo(() => (
    [...new Set(categoryItems.map((item) => item.material).filter(Boolean))].sort()
  ), [categoryItems]);

  const availableStyles = React.useMemo(() => (
    [...new Set(categoryItems.map((item) => item.style).filter(Boolean))].sort()
  ), [categoryItems]);

  const maxPrice = React.useMemo(() => (
    Math.max(100, ...categoryItems.map(getPrice))
  ), [categoryItems]);

  const [priceRange, setPriceRange] = React.useState([0, 0]);

  React.useEffect(() => {
    setPriceRange([0, Math.ceil(maxPrice / 100) * 100]);
  }, [categoryId, maxPrice]);

  React.useEffect(() => {
    if (!showMobileFilters) return undefined;
    const scrollY = window.scrollY;
    const originalBody = {
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
      document.body.style.overflow = originalBody.overflow;
      document.body.style.position = originalBody.position;
      document.body.style.top = originalBody.top;
      document.body.style.width = originalBody.width;
      document.body.style.overscrollBehavior = originalBody.overscrollBehavior;
      document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, [showMobileFilters]);

  const filteredItems = React.useMemo(() => {
    let result = [...categoryItems];
    const max = priceRange[1] || maxPrice;

    result = result.filter((item) => {
      const price = getPrice(item);
      return price >= priceRange[0] && price <= max;
    });

    if (selectedMaterials.length) {
      result = result.filter((item) => selectedMaterials.includes(item.material));
    }

    if (selectedStyles.length) {
      result = result.filter((item) => selectedStyles.includes(item.style));
    }

    if (selectedCollections.length) {
      const expandedIds = new Set(selectedCollections);
      Object.entries(LEGACY_IDS).forEach(([legacyId, children]) => {
        if (children.some((child) => expandedIds.has(child))) expandedIds.add(legacyId);
      });
      result = result.filter((item) => expandedIds.has(item.category));
    }

    if (availabilityFilter === 'in-stock') {
      result = result.filter((item) => (item.stock > 0 || item.stock === undefined) && !item.sold);
    } else if (availabilityFilter === 'sold') {
      result = result.filter((item) => item.sold);
    }

    if (searchQuery) {
      const query = searchQuery.toLocaleLowerCase('fr-FR');
      result = result.filter((item) => (
        item.title?.toLocaleLowerCase('fr-FR').includes(query)
        || item.name?.toLocaleLowerCase('fr-FR').includes(query)
        || item.description?.toLocaleLowerCase('fr-FR').includes(query)
        || item.material?.toLocaleLowerCase('fr-FR').includes(query)
      ));
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => getPrice(a) - getPrice(b));
        break;
      case 'price-desc':
        result.sort((a, b) => getPrice(b) - getPrice(a));
        break;
      case 'name-asc':
        result.sort((a, b) => String(a.name || a.title || '').localeCompare(String(b.name || b.title || ''), 'fr'));
        break;
      case 'newest':
      default:
        result.sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
        break;
    }

    return result;
  }, [availabilityFilter, categoryItems, maxPrice, priceRange, searchQuery, selectedCollections, selectedMaterials, selectedStyles, sortBy]);

  const relatedCategories = React.useMemo(() => (
    (copy?.related || [])
      .map((id) => {
        const meta = KIT_CONFIG.categoryGroups?.find((category) => category.id === id)
          || KIT_CONFIG.productCategories?.find((category) => category.id === id);
        return meta ? { id, label: meta.label } : null;
      })
      .filter(Boolean)
  ), [copy?.related]);

  const hasActiveFilters = selectedMaterials.length > 0
    || selectedStyles.length > 0
    || selectedCollections.length > 0
    || availabilityFilter !== 'all'
    || priceRange[0] > 0
    || (priceRange[1] || maxPrice) < maxPrice
    || searchQuery.length > 0;

  const toggleSection = (key) => setOpenSections((previous) => ({ ...previous, [key]: !previous[key] }));
  const toggleMaterial = (material) => setSelectedMaterials((previous) => (
    previous.includes(material) ? previous.filter((item) => item !== material) : [...previous, material]
  ));
  const toggleStyle = (style) => setSelectedStyles((previous) => (
    previous.includes(style) ? previous.filter((item) => item !== style) : [...previous, style]
  ));
  const toggleCollection = (collection) => setSelectedCollections((previous) => (
    previous.includes(collection) ? previous.filter((item) => item !== collection) : [...previous, collection]
  ));
  const clearAllFilters = () => {
    setPriceRange([0, Math.ceil(maxPrice / 100) * 100]);
    setSelectedMaterials([]);
    setSelectedStyles([]);
    setSelectedCollections([]);
    setAvailabilityFilter('all');
    setSearchQuery('');
  };

  const filtersContent = (
    <div className="space-y-1">
      {isGroupPage && subCategories.length > 0 ? (
        <FilterSection title="Collection" isOpen={openSections.collection} onToggle={() => toggleSection('collection')} darkMode={darkMode}>
          <div className="space-y-2">
            {subCategories.map((sub) => {
              const count = categoryItems.filter((item) => item.category === sub.id).length;
              return (
                <label key={sub.id} className={`group flex cursor-pointer items-center gap-3 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                  <input type="checkbox" checked={selectedCollections.includes(sub.id)} onChange={() => toggleCollection(sub.id)} className="h-4 w-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500" />
                  <span className="text-[13px] transition-all group-hover:font-medium">{sub.label}</span>
                  <span className={`ml-auto text-[11px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>({count})</span>
                </label>
              );
            })}
          </div>
        </FilterSection>
      ) : null}

      <FilterSection title="Prix" isOpen={openSections.price} onToggle={() => toggleSection('price')} darkMode={darkMode}>
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={Math.ceil(maxPrice / 100) * 100}
            step={10}
            value={priceRange[1] || maxPrice}
            onChange={(event) => setPriceRange([priceRange[0], Number(event.target.value)])}
            className="w-full accent-stone-800"
          />
          <div className="flex justify-between font-mono text-[11px]">
            <span className={darkMode ? 'text-stone-400' : 'text-stone-500'}>{priceRange[0].toFixed(0)} EUR</span>
            <span className={darkMode ? 'text-stone-400' : 'text-stone-500'}>{(priceRange[1] || maxPrice).toFixed(0)} EUR</span>
          </div>
        </div>
      </FilterSection>

      {availableMaterials.length > 0 ? (
        <FilterSection title="Matière" isOpen={openSections.material} onToggle={() => toggleSection('material')} darkMode={darkMode}>
          <div className="space-y-2">
            {availableMaterials.map((material) => (
              <label key={material} className={`group flex cursor-pointer items-center gap-3 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                <input type="checkbox" checked={selectedMaterials.includes(material)} onChange={() => toggleMaterial(material)} className="h-4 w-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500" />
                <span className="text-[13px] transition-all group-hover:font-medium">{material}</span>
                <span className={`ml-auto text-[11px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>({categoryItems.filter((item) => item.material === material).length})</span>
              </label>
            ))}
          </div>
        </FilterSection>
      ) : null}

      {availableStyles.length > 0 ? (
        <FilterSection title="Style" isOpen={openSections.style} onToggle={() => toggleSection('style')} darkMode={darkMode}>
          <div className="space-y-2">
            {availableStyles.map((style) => (
              <label key={style} className={`group flex cursor-pointer items-center gap-3 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                <input type="checkbox" checked={selectedStyles.includes(style)} onChange={() => toggleStyle(style)} className="h-4 w-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500" />
                <span className="text-[13px] transition-all group-hover:font-medium">{style}</span>
                <span className={`ml-auto text-[11px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>({categoryItems.filter((item) => item.style === style).length})</span>
              </label>
            ))}
          </div>
        </FilterSection>
      ) : null}

      <FilterSection title="Disponibilité" isOpen={openSections.availability} onToggle={() => toggleSection('availability')} darkMode={darkMode}>
        <div className="space-y-2">
          {[
            { id: 'all', label: 'Tout voir' },
            { id: 'in-stock', label: 'En stock' },
            { id: 'sold', label: 'Vendu' },
          ].map((option) => (
            <label key={option.id} className={`group flex cursor-pointer items-center gap-3 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
              <input type="radio" name="availability" checked={availabilityFilter === option.id} onChange={() => setAvailabilityFilter(option.id)} className="h-4 w-4 border-stone-300 text-stone-800 focus:ring-stone-500" />
              <span className="text-[13px] transition-all group-hover:font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {hasActiveFilters ? (
        <button type="button" onClick={clearAllFilters} className={`mt-4 w-full rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
          Réinitialiser les filtres
        </button>
      ) : null}
    </div>
  );

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${darkMode ? 'bg-[#121212] text-[#f5f5f5]' : 'bg-[#FAFAF9] text-stone-900'}`}>
      <div className={`border-b ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className="mx-auto max-w-7xl px-4 pb-4 pt-5 md:px-8 md:py-8 lg:px-12">
          <div className="mb-4 hidden items-center gap-3 md:flex">
            <a href="/galerie" className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'text-stone-500 hover:text-white' : 'text-stone-400 hover:text-stone-900'}`}>
              <ChevronLeft size={14} /> Galerie
            </a>
            <span className={`text-[10px] ${darkMode ? 'text-stone-700' : 'text-stone-300'}`}>/</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
              {categoryLabel}
            </span>
          </div>

          <h1 className="font-serif text-[34px] leading-tight tracking-normal md:text-4xl lg:text-5xl">
            {categoryTitle}
          </h1>

          <div className="mt-4 grid gap-4 md:mt-5 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-3xl">
              <p className={`text-[14px] leading-[1.75] md:text-[15px] ${darkMode ? 'text-stone-300/86' : 'text-stone-600'}`}>
                {copy?.intro}
              </p>
              <p className={`mt-2 text-[12.5px] leading-[1.7] ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>
                {copy?.detail}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <a href="/galerie" className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${darkMode ? 'border-white/12 text-stone-300 hover:border-white/28 hover:text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'}`}>
                Galerie
              </a>
              <a href="/a-propos" className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${darkMode ? 'border-white/12 text-stone-300 hover:border-white/28 hover:text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'}`}>
                À propos
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className={`border-b ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-8 lg:px-12">
          <div className="mb-4 flex items-center justify-between gap-3 md:mb-0">
            <div className="flex items-center gap-2 md:gap-4">
              <button type="button" onClick={() => setShowMobileFilters(true)} className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[12px] font-medium transition-colors md:hidden ${darkMode ? 'border-stone-700 text-stone-300 hover:border-stone-500' : 'border-stone-200 text-stone-700 hover:border-stone-400'}`}>
                <SlidersHorizontal size={15} /> Filtrer
                {hasActiveFilters ? <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> : null}
              </button>
              <span className={`hidden text-[12px] font-medium md:inline ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {filteredItems.length} produit{filteredItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`hidden items-center overflow-hidden rounded-lg border md:flex ${darkMode ? 'border-stone-700' : 'border-stone-200'}`}>
                <button type="button" onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? (darkMode ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900') : (darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600')}`} aria-label="Vue grille">
                  <Grid3X3 size={16} />
                </button>
                <button type="button" onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? (darkMode ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900') : (darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600')}`} aria-label="Vue liste">
                  <List size={16} />
                </button>
              </div>

              <div className="relative">
                <button type="button" onClick={() => setShowSortDropdown((value) => !value)} className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[12px] font-medium transition-colors md:text-[11px] md:font-bold md:uppercase md:tracking-widest ${darkMode ? 'border-stone-700 text-stone-300 hover:border-stone-500' : 'border-stone-200 text-stone-700 hover:border-stone-400 md:text-stone-600'}`}>
                  <span className="md:hidden">Trier</span>
                  <span className="hidden md:inline">{SORT_OPTIONS.find((option) => option.id === sortBy)?.label}</span>
                  <ChevronDown size={12} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showSortDropdown ? (
                  <>
                    <button type="button" aria-label="Fermer le tri" className="fixed inset-0 z-40 cursor-default" onClick={() => setShowSortDropdown(false)} />
                    <div className={`absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border shadow-xl ${darkMode ? 'border-stone-700 bg-[#1A1A1A]' : 'border-stone-200 bg-white'}`}>
                      {SORT_OPTIONS.map((option) => (
                        <button key={option.id} type="button" onClick={() => { setSortBy(option.id); setShowSortDropdown(false); }} className={`w-full px-4 py-3 text-left text-[12px] font-medium transition-colors ${sortBy === option.id ? (darkMode ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900') : (darkMode ? 'text-stone-400 hover:bg-white/5 hover:text-white' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900')}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              <div className={`flex items-center gap-1 md:hidden ${darkMode ? 'text-stone-300' : 'text-stone-800'}`}>
                <button type="button" onClick={() => setMobileViewMode('grid')} className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${mobileViewMode === 'grid' ? (darkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-950 text-white') : (darkMode ? 'bg-white/10' : 'bg-stone-100')}`} aria-label="Vue grille">
                  <LayoutGrid size={16} strokeWidth={1.6} />
                </button>
                <button type="button" onClick={() => setMobileViewMode('list')} className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${mobileViewMode === 'list' ? (darkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-950 text-white') : (darkMode ? 'bg-white/10' : 'bg-stone-100')}`} aria-label="Vue liste">
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

      <div className="mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-12 lg:px-12">
        <div className="flex gap-8 lg:gap-12">
          <aside className="hidden w-[220px] shrink-0 md:block lg:w-[250px]">{filtersContent}</aside>

          <div className="min-w-0 flex-1">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className={`mb-2 font-serif text-lg ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Aucun produit trouvé</p>
                <p className={`mb-6 text-[13px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>Essayez de modifier vos filtres</p>
                {hasActiveFilters ? (
                  <button type="button" onClick={clearAllFilters} className={`rounded-full border px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'border-stone-700 text-stone-300 hover:border-stone-400' : 'border-stone-300 text-stone-600 hover:border-stone-500'}`}>
                    Réinitialiser
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className={`${mobileViewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-2.5'} md:hidden`}>
                  {filteredItems.map((item, index) => (
                    mobileViewMode === 'grid'
                      ? (
                        <div key={item.id} className="product-card-wrap relative">
                          {getCreatedTime(item) && Date.now() - getCreatedTime(item) < 604800000 ? (
                            <div className="absolute left-2 top-2 z-10 rounded-sm bg-[#d4e1d9] px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-[#2d4033]">
                              Nouveau
                            </div>
                          ) : null}
                          <ProductCard item={item} layoutMode="grid" compact priority={index < 2} />
                        </div>
                      )
                      : <MobileProductRow key={item.id} item={item} darkMode={darkMode} priority={index < 2} />
                  ))}
                </div>

                <div className={`hidden gap-[24px] md:grid ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {filteredItems.map((item, index) => (
                    <div key={item.id} className="product-card-wrap relative">
                      {getCreatedTime(item) && Date.now() - getCreatedTime(item) < 604800000 ? (
                        <div className="absolute left-2 top-2 z-10 rounded-sm bg-[#d4e1d9] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#2d4033]">
                          Nouveau
                        </div>
                      ) : null}
                      <ProductCard item={item} layoutMode={viewMode} compact priority={index < 2} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {(relatedCategories.length > 0 || copy?.faq?.length > 0) ? (
        <section className={`border-t px-4 py-8 md:px-8 lg:px-12 ${darkMode ? 'border-stone-800' : 'border-stone-200'}`} aria-labelledby="category-seo-more">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className={`mb-3 font-sans text-[10px] font-black uppercase tracking-[0.24em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                Guide catégorie
              </p>
              <h2 id="category-seo-more" className={`font-serif text-[26px] leading-tight tracking-normal md:text-[32px] ${darkMode ? 'text-white' : 'text-stone-950'}`}>
                Choisir {categoryTitle.toLocaleLowerCase('fr-FR')} sans perdre le charme de l’ancien
              </h2>
              {relatedCategories.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {relatedCategories.map((category) => (
                    <a key={category.id} href={getCategoryUrl(category.id)} className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${darkMode ? 'border-white/12 text-stone-300 hover:border-white/28 hover:text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'}`}>
                      {category.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>

            {copy?.faq?.length > 0 ? (
              <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-200'}`}>
                {copy.faq.map((entry) => (
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
            ) : null}
          </div>
        </section>
      ) : null}

      <div className={`fixed inset-0 z-[200] bg-black/40 transition-opacity duration-300 md:hidden ${showMobileFilters ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setShowMobileFilters(false)} aria-hidden="true" />
      <div className={`fixed inset-x-0 bottom-0 z-[201] h-[90dvh] max-h-[90dvh] overflow-hidden overscroll-none rounded-t-[28px] shadow-2xl transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] md:hidden ${showMobileFilters ? 'pointer-events-auto translate-y-0' : 'pointer-events-none translate-y-full'} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#fffdfb]'}`} aria-hidden={!showMobileFilters}>
        <div className="safe-pb-filter-drawer flex h-full min-h-0 flex-col p-6">
          <div className="flex-shrink-0 touch-pan-y select-none">
            <button type="button" className="-mx-6 -mt-3 mb-2 flex h-8 w-[calc(100%+3rem)] cursor-pointer items-center justify-center md:hidden" onClick={() => setShowMobileFilters(false)} aria-label="Fermer les filtres">
              <span className={`h-1 w-14 rounded-full ${darkMode ? 'bg-stone-700' : 'bg-stone-300'}`} />
            </button>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl">Filtrer</h3>
                <p className={`mt-1 text-[12px] ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>{filteredItems.length} résultat{filteredItems.length !== 1 ? 's' : ''}</p>
              </div>
              {hasActiveFilters ? (
                <button type="button" onClick={clearAllFilters} className={`text-[12px] underline underline-offset-4 ${darkMode ? 'text-stone-400' : 'text-[#9C8268]'}`}>
                  Réinitialiser
                </button>
              ) : null}
              <button type="button" onClick={() => setShowMobileFilters(false)} className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-stone-100'}`} aria-label="Fermer les filtres">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="mobile-filter-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-5 touch-pan-y">
            {filtersContent}
          </div>
          <button type="button" onClick={() => setShowMobileFilters(false)} className={`mt-6 w-full flex-shrink-0 rounded-md py-4 text-[13px] font-bold transition-colors ${darkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-950 text-white'}`}>
            Voir les {filteredItems.length} résultat{filteredItems.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
