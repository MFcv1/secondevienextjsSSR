import { ChevronDown, Grid3X3, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { getCategoryUrl, getProductUrl } from '../../utils/slug';
import { getProductCardImage, getProductDisplayImageSrc, getProductImageItems } from '../../utils/imageUtils';
import { getProductStockAmount, getPurchaseUnavailableLabel, isPurchasable, isSoldOut, shouldRequestQuote } from '../commerce/purchasability';
import CategoryControlsIsland from './CategoryControlsIsland';
import GalleryGridActionsIsland from './GalleryGridActionsIsland';
import PageBreadcrumb from './PageBreadcrumb';
import CatalogVersionSyncIsland from './CatalogVersionSyncIsland';
import ProductCardMediaServer, { ProductCardHoverOverlay, ProductSoldBadge } from './ProductCardMediaServer';
import {
  CATEGORY_SORT_OPTIONS,
  buildCategoryHref,
  filterAndSortCategoryItems,
  getCategoryFilterOptions,
  getCategoryProductCreatedTime,
  getCategoryProductPrice,
  getCategoryQueryState,
  getCategoryRelatedCategories,
  getCategoryTitle,
  hasActiveCategoryFilters,
} from './categoryViewModel';

const isNewProduct = (item) => {
  const createdTime = getCategoryProductCreatedTime(item);
  return createdTime && Date.now() - createdTime < 604800000;
};

const HiddenStateFields = ({ state }) => (
  <>
    {state.sortBy !== 'newest' ? <input type="hidden" name="sort" value={state.sortBy} /> : null}
    {state.viewMode !== 'grid' ? <input type="hidden" name="view" value={state.viewMode} /> : null}
    {state.mobileViewMode !== 'list' ? <input type="hidden" name="mobileView" value={state.mobileViewMode} /> : null}
    {state.searchQuery ? <input type="hidden" name="q" value={state.searchQuery} /> : null}
  </>
);

const FilterSection = ({ title, children, darkMode }) => (
  <div className={`mb-4 border-b pb-4 ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
    <div className={`group flex w-full items-center justify-between py-1 text-left ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
      <span className="text-[12px] font-bold uppercase tracking-widest">{title}</span>
      <ChevronDown size={14} className={`${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
    </div>
    <div className="pt-3">{children}</div>
  </div>
);

const CategoryProductCard = ({ item, priority = false, darkMode = false }) => {
  const cardImage = getProductCardImage(item);
  const warmup = getCategoryProductWarmup(item);
  const title = item?.name || item?.title || 'Pi\u00e8ce restaur\u00e9e';
  const price = getCategoryProductPrice(item);
  const purchasable = isPurchasable(item);
  const soldOut = isSoldOut(item);

  return (
    <Link
      href={getProductUrl(item)}
      prefetch={false}
      draggable={false}
      data-gallery-product-card
      data-gallery-product-link
      data-card-theme={darkMode ? 'dark' : undefined}
      data-card-sold={soldOut ? 'true' : undefined}
      data-product-url={warmup.productUrl}
      className="category-product-card-link product-card-shell group relative flex w-full touch-manipulation flex-col text-inherit no-underline"
    >
      <div
        className="category-product-card-media product-card-media relative aspect-[3/4] w-full overflow-hidden"
      >
        <ProductCardMediaServer
          cardImage={cardImage}
          alt={title}
          priority={priority}
          warmupSrc={warmup.src}
          imageClassName="product-card-image h-full w-full object-cover"
        />

        <ProductCardHoverOverlay />

        {soldOut ? <ProductSoldBadge /> : null}
      </div>

      <div className="category-product-card-info product-card-info flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:gap-1">
          <div className="truncate text-[8px] font-black uppercase tracking-widest opacity-50 md:text-[9px]">
            {item?.material || 'Mati\u00e8re inconnue'}
          </div>
          <h3 className="font-serif text-[13px] leading-tight md:text-lg lg:text-xl">
            {title}
          </h3>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-0.5 text-right md:flex-col md:items-end md:gap-1">
          <div className="whitespace-nowrap text-[8px] font-black uppercase tracking-widest opacity-50 md:text-[9px]">
            {soldOut ? 'Stock: 0' : `Stock: ${getProductStockAmount(item)}`}
          </div>
          <p className="product-card-price whitespace-nowrap text-[10px] font-bold tabular-nums md:text-xs lg:text-sm">
            {soldOut ? 'VENDU' : purchasable ? `${price} EUR` : shouldRequestQuote(item) ? 'Sur demande' : getPurchaseUnavailableLabel(item)}
          </p>
        </div>
      </div>
    </Link>
  );
};

const getCategoryProductDataset = (item) => ({
  'data-category-product': item.id,
  'data-product-price': getCategoryProductPrice(item),
  'data-product-created': getCategoryProductCreatedTime(item),
  'data-product-material': item?.material || '',
  'data-product-style': item?.style || '',
  'data-product-category': item?.category || '',
  'data-product-sold': item?.sold ? 'true' : 'false',
  'data-product-search': [
    item?.title,
    item?.name,
    item?.description,
    item?.material,
  ].filter(Boolean).join(' ').toLocaleLowerCase('fr-FR'),
});

const getCategoryProductWarmup = (item) => {
  const [primary] = getProductImageItems(item);
  return {
    productUrl: getProductUrl(item),
    src: getProductDisplayImageSrc(primary, { viewport: 'desktop' }) || primary?.medium || primary?.src || primary?.card || primary?.thumb || '',
  };
};

const FilterForm = ({
  categoryId,
  state,
  filterOptions,
  darkMode,
  hasActiveFilters,
  filteredCount,
  variant = 'desktop',
}) => {
  const action = `/categorie/${encodeURIComponent(categoryId)}`;
  const resetHref = buildCategoryHref(categoryId, state, {
    selectedMaterials: [],
    selectedStyles: [],
    selectedCollections: [],
    availabilityFilter: 'all',
    priceRange: [0, state.roundedMaxPrice],
    searchQuery: '',
  });

  return (
    <form action={action} method="get" data-category-filter-form className="space-y-1">
      <HiddenStateFields state={state} />
      {filterOptions.subCategories.length > 0 ? (
        <FilterSection title="Collection" darkMode={darkMode}>
          <div className="space-y-2">
            {filterOptions.subCategories.map((sub) => (
              <label key={sub.id} className={`group flex cursor-pointer items-center gap-3 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                <input type="checkbox" name="collection" value={sub.id} defaultChecked={state.selectedCollections.includes(sub.id)} className="custom-checkbox focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-1 dark:focus:ring-offset-[#12110f]" />
                <span className="text-[13px] transition-all group-hover:font-medium">{sub.label}</span>
                <span className={`ml-auto text-[11px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>({filterOptions.counts.collections[sub.id] || 0})</span>
              </label>
            ))}
          </div>
        </FilterSection>
      ) : null}

      <FilterSection title="Prix" darkMode={darkMode}>
        <div className="space-y-3">
          <input
            type="range"
            name="maxPrice"
            min={0}
            max={state.roundedMaxPrice}
            step={1}
            defaultValue={state.priceRange[1] || filterOptions.maxPrice}
            className="w-full accent-stone-800"
            data-category-range
          />
          <div className="flex justify-between font-mono text-[11px]">
            <span className={darkMode ? 'text-stone-400' : 'text-stone-500'}>{state.priceRange[0].toFixed(0)} EUR</span>
            <span data-category-max-price-label className={darkMode ? 'text-stone-400' : 'text-stone-500'}>{(state.priceRange[1] || filterOptions.maxPrice).toFixed(0)} EUR</span>
          </div>
        </div>
      </FilterSection>

      {filterOptions.materials.length > 0 ? (
        <FilterSection title="Mati&egrave;re" darkMode={darkMode}>
          <div className="space-y-2">
            {filterOptions.materials.map((material) => (
              <label key={material} className={`group flex cursor-pointer items-center gap-3 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                <input type="checkbox" name="material" value={material} defaultChecked={state.selectedMaterials.includes(material)} className="custom-checkbox focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-1 dark:focus:ring-offset-[#12110f]" />
                <span className="text-[13px] transition-all group-hover:font-medium">{material}</span>
                <span className={`ml-auto text-[11px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>({filterOptions.counts.materials[material] || 0})</span>
              </label>
            ))}
          </div>
        </FilterSection>
      ) : null}

      {filterOptions.styles.length > 0 ? (
        <FilterSection title="Style" darkMode={darkMode}>
          <div className="space-y-2">
            {filterOptions.styles.map((style) => (
              <label key={style} className={`group flex cursor-pointer items-center gap-3 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                <input type="checkbox" name="style" value={style} defaultChecked={state.selectedStyles.includes(style)} className="custom-checkbox focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-1 dark:focus:ring-offset-[#12110f]" />
                <span className="text-[13px] transition-all group-hover:font-medium">{style}</span>
                <span className={`ml-auto text-[11px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>({filterOptions.counts.styles[style] || 0})</span>
              </label>
            ))}
          </div>
        </FilterSection>
      ) : null}

      <FilterSection title="Disponibilit&eacute;" darkMode={darkMode}>
        <div className="space-y-2">
          {[
            { id: 'all', label: 'Tout voir' },
            { id: 'in-stock', label: 'En stock' },
            { id: 'sold', label: 'Vendu' },
          ].map((option) => (
            <label key={option.id} className={`group flex cursor-pointer items-center gap-3 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
              <input type="radio" name="availability" value={option.id} defaultChecked={state.availabilityFilter === option.id} className="custom-radio focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-1 dark:focus:ring-offset-[#12110f]" />
              <span className="text-[13px] transition-all group-hover:font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <button type="submit" className="sr-only">Appliquer</button>

      {variant === 'mobile' ? (
        <Link href={resetHref} prefetch={false} data-category-reset-link hidden={!hasActiveFilters} className={`mt-4 inline-block text-[12px] underline underline-offset-4 ${darkMode ? 'text-stone-400' : 'text-[#9C8268]'}`}>
          R\u00e9initialiser
        </Link>
      ) : (
        <Link href={resetHref} prefetch={false} data-category-reset-link hidden={!hasActiveFilters} className={`mt-4 block w-full rounded-lg py-2.5 text-center text-[11px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
          R\u00e9initialiser les filtres
        </Link>
      )}

      {variant === 'mobile' ? (
        <button type="submit" className={`mt-6 w-full flex-shrink-0 rounded-md py-4 text-[13px] font-bold transition-colors ${darkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-950 text-white'}`}>
          Voir les <span data-category-filtered-count>{filteredCount}</span> r\u00e9sultat{filteredCount !== 1 ? 's' : ''}
        </button>
      ) : null}
    </form>
  );
};

export default function CategoryServerView({
  categoryId,
  categoryLabel,
  products = [],
  copy,
  darkMode = false,
  catalogRevision = 0,
  catalogVersion = '',
}) {
  const categoryTitle = getCategoryTitle(categoryLabel, categoryId);
  const filterOptions = getCategoryFilterOptions(products, categoryId);
  const state = getCategoryQueryState({}, filterOptions);
  const filteredItems = filterAndSortCategoryItems(products, state, filterOptions.maxPrice);
  const relatedCategories = getCategoryRelatedCategories(copy);
  const hasActiveFilters = hasActiveCategoryFilters(state, filterOptions.maxPrice);
  const sortLabel = CATEGORY_SORT_OPTIONS.find((option) => option.id === state.sortBy)?.label || CATEGORY_SORT_OPTIONS[0].label;
  const categoryHref = `/categorie/${encodeURIComponent(categoryId)}`;
  const clientItems = filteredItems.map((item) => ({
    id: item.id,
    name: item.name,
    title: item.title,
    description: item.description,
    material: item.material,
    style: item.style,
    category: item.category,
    status: item.status,
    sold: Boolean(item.sold),
    stock: item.stock,
    currentPrice: item.currentPrice,
    startingPrice: item.startingPrice,
    price: item.price,
    createdAt: getCategoryProductCreatedTime(item),
  }));

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-500 ${darkMode ? 'bg-[#121212] text-[#f5f5f5]' : 'bg-[#FAFAF9] text-stone-900'}`}
      data-category-native-view
      data-category-mobile-mode={state.mobileViewMode}
      data-category-desktop-mode={state.viewMode}
    >
      <CatalogVersionSyncIsland
        revision={catalogRevision}
        aggregateSha256={catalogVersion}
        routeKind="category"
        routeId={categoryId}
      />
      <GalleryGridActionsIsland observeVisibleWarmup surface="category" />
      <div className={`border-b ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className="mx-auto max-w-7xl px-4 pb-4 pt-5 md:px-8 md:py-8 lg:px-12">
          <PageBreadcrumb current={categoryLabel} darkMode={darkMode} className="mb-4" />

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
              <Link href="/" prefetch={false} className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${darkMode ? 'border-white/12 text-stone-300 hover:border-white/28 hover:text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'}`}>
                Galerie
              </Link>
              <Link href="/a-propos" prefetch={false} className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${darkMode ? 'border-white/12 text-stone-300 hover:border-white/28 hover:text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'}`}>
                A propos
              </Link>
            </div>
          </div>
        </div>
      </div>

      <CategoryControlsIsland
        categoryId={categoryId}
        items={clientItems}
        filterOptions={filterOptions}
      />

        <div className={`border-b ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
          <div className="mx-auto max-w-7xl px-4 py-3 md:px-8 lg:px-12">
            <div className="mb-4 flex items-center justify-between gap-3 md:mb-0">
              <div className="flex items-center gap-2 md:gap-4">
                <button
                  type="button"
                  data-category-open-filters
                  aria-controls="category-filter-dialog"
                  aria-expanded="false"
                  className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[12px] font-medium transition-colors md:hidden ${darkMode ? 'border-stone-700 text-stone-300 hover:border-stone-500' : 'border-stone-200 text-stone-700 hover:border-stone-400'}`}
                >
                  <SlidersHorizontal size={15} /> Filtrer
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" data-category-active-indicator hidden={!hasActiveFilters} />
                </button>
                <span className={`hidden text-[12px] font-medium md:inline ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} data-category-result-count>
                  {filteredItems.length} produit{filteredItems.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className={`hidden items-center overflow-hidden rounded-lg border md:flex ${darkMode ? 'border-stone-700' : 'border-stone-200'}`} data-category-view-switcher>
                  <Link href={buildCategoryHref(categoryId, state, { viewMode: 'grid' })} prefetch={false} data-category-view-link="desktop" data-category-view-value="grid" className={`p-2 transition-colors ${state.viewMode === 'grid' ? (darkMode ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900') : (darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600')}`} aria-label="Vue grille">
                    <Grid3X3 size={16} />
                  </Link>
                  <Link href={buildCategoryHref(categoryId, state, { viewMode: 'list' })} prefetch={false} data-category-view-link="desktop" data-category-view-value="list" className={`p-2 transition-colors ${state.viewMode === 'list' ? (darkMode ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900') : (darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600')}`} aria-label="Vue liste">
                    <List size={16} />
                  </Link>
                </div>

                <div className="relative">
                  <button type="button" data-category-sort-button className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[12px] font-medium transition-colors md:text-[11px] md:font-bold md:uppercase md:tracking-widest ${darkMode ? 'border-stone-700 text-stone-300 hover:border-stone-500' : 'border-stone-200 text-stone-700 hover:border-stone-400 md:text-stone-600'}`}>
                    <span className="md:hidden">Trier</span>
                    <span className="hidden md:inline" data-category-sort-label>{sortLabel}</span>
                    <ChevronDown size={12} className="transition-transform" data-category-sort-icon />
                  </button>
                  <button type="button" aria-label="Fermer le tri" className="fixed inset-0 z-40 cursor-default" data-category-close-sort data-category-sort-blocker hidden />
                  <div className={`absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border shadow-xl ${darkMode ? 'border-stone-700 bg-[#1A1A1A]' : 'border-stone-200 bg-white'}`} data-category-sort-menu hidden>
                    {CATEGORY_SORT_OPTIONS.map((option) => (
                      <Link key={option.id} href={buildCategoryHref(categoryId, state, { sortBy: option.id })} prefetch={false} data-category-sort-option={option.id} className={`block w-full px-4 py-3 text-left text-[12px] font-medium transition-colors ${state.sortBy === option.id ? (darkMode ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900') : (darkMode ? 'text-stone-400 hover:bg-white/5 hover:text-white' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900')}`}>
                        {option.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className={`flex items-center gap-1 md:hidden ${darkMode ? 'text-stone-300' : 'text-stone-800'}`}>
                  <Link href={buildCategoryHref(categoryId, state, { mobileViewMode: 'grid' })} prefetch={false} data-category-view-link="mobile" data-category-view-value="grid" className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${state.mobileViewMode === 'grid' ? (darkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-950 text-white') : (darkMode ? 'bg-white/10' : 'bg-stone-100')}`} aria-label="Vue grille">
                    <LayoutGrid size={16} strokeWidth={1.6} />
                  </Link>
                  <Link href={buildCategoryHref(categoryId, state, { mobileViewMode: 'list' })} prefetch={false} data-category-view-link="mobile" data-category-view-value="list" className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${state.mobileViewMode === 'list' ? (darkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-950 text-white') : (darkMode ? 'bg-white/10' : 'bg-stone-100')}`} aria-label="Vue liste">
                    <List size={16} strokeWidth={1.6} />
                  </Link>
                </div>
              </div>
            </div>
            <p className={`text-[13px] md:hidden ${darkMode ? 'text-stone-500' : 'text-stone-500'}`} data-category-result-count>
              {filteredItems.length} produit{filteredItems.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-12 lg:px-12">
          <div className="flex gap-8 lg:gap-12">
            <aside className="hidden w-[220px] shrink-0 md:block lg:w-[250px]">
              <FilterForm
                categoryId={categoryId}
                state={state}
                filterOptions={filterOptions}
                darkMode={darkMode}
                hasActiveFilters={hasActiveFilters}
                filteredCount={filteredItems.length}
              />
            </aside>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col items-center justify-center py-20 text-center" data-category-empty-state hidden={filteredItems.length !== 0}>
                <p className={`mb-2 font-serif text-lg ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Aucun produit trouv\u00e9</p>
                <p className={`mb-6 text-[13px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>Essayez de modifier vos filtres</p>
                <Link href={categoryHref} prefetch={false} data-category-reset-link hidden={!hasActiveFilters} className={`rounded-full border px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'border-stone-700 text-stone-300 hover:border-stone-400' : 'border-stone-300 text-stone-600 hover:border-stone-500'}`}>
                  R\u00e9initialiser
                </Link>
              </div>

              <div data-category-product-views hidden={filteredItems.length === 0}>
                <div className="category-product-list grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-[24px] lg:grid-cols-3">
                  {filteredItems.map((item, index) => (
                    <div key={item.id} className="product-card-wrap relative" {...getCategoryProductDataset(item)}>
                      {isNewProduct(item) && !isSoldOut(item) ? (
                        <div className="product-card-badge z-10 bg-[#d4e1d9] text-[#2d4033] dark:bg-[#203126]/92 dark:text-[#c8ddca]">
                          Nouveau
                        </div>
                      ) : null}
                      <CategoryProductCard item={item} priority={index < 3} darkMode={darkMode} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`fixed inset-0 z-[200] bg-black/40 opacity-0 transition-opacity duration-300 md:hidden pointer-events-none`} data-category-close-filters data-category-filter-overlay aria-hidden="true" />
        <div
          id="category-filter-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-filter-dialog-title"
          aria-hidden="true"
          tabIndex={-1}
          inert=""
          className={`fixed inset-x-0 bottom-0 z-[201] h-[90dvh] max-h-[90dvh] translate-y-full overflow-hidden overscroll-none rounded-t-[28px] shadow-2xl transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] md:hidden pointer-events-none ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#fffdfb]'}`}
          data-category-filter-drawer
        >
          <div className="safe-pb-filter-drawer flex h-full min-h-0 flex-col p-6">
            <div className="flex-shrink-0 touch-pan-y select-none">
              <button type="button" className="-mx-6 -mt-3 mb-2 flex h-8 w-[calc(100%+3rem)] cursor-pointer items-center justify-center md:hidden" data-category-close-filters aria-label="Fermer les filtres">
                <span className={`h-1 w-14 rounded-full ${darkMode ? 'bg-stone-700' : 'bg-stone-300'}`} />
              </button>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h3 id="category-filter-dialog-title" className="font-serif text-2xl">Filtrer</h3>
                  <p className={`mt-1 text-[12px] ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}><span data-category-filtered-count>{filteredItems.length}</span> r\u00e9sultat{filteredItems.length !== 1 ? 's' : ''}</p>
                </div>
                <Link href={buildCategoryHref(categoryId, state, {
                  selectedMaterials: [],
                  selectedStyles: [],
                  selectedCollections: [],
                  availabilityFilter: 'all',
                  priceRange: [0, state.roundedMaxPrice],
                  searchQuery: '',
                })} prefetch={false} data-category-reset-link hidden={!hasActiveFilters} className={`text-[12px] underline underline-offset-4 ${darkMode ? 'text-stone-400' : 'text-[#9C8268]'}`}>
                  R\u00e9initialiser
                </Link>
                <button type="button" data-category-close-filters data-category-filter-initial-focus className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-stone-100'}`} aria-label="Fermer les filtres">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="mobile-filter-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-5 touch-pan-y">
              <FilterForm
                categoryId={categoryId}
                state={state}
                filterOptions={filterOptions}
                darkMode={darkMode}
                hasActiveFilters={hasActiveFilters}
                filteredCount={filteredItems.length}
                variant="mobile"
              />
            </div>
          </div>
        </div>

      {(relatedCategories.length > 0 || copy?.faq?.length > 0) ? (
        <section className={`border-t px-4 py-8 md:px-8 lg:px-12 ${darkMode ? 'border-stone-800' : 'border-stone-200'}`} aria-labelledby="category-seo-more">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className={`mb-3 font-sans text-[10px] font-black uppercase tracking-[0.24em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                Guide cat\u00e9gorie
              </p>
              <h2 id="category-seo-more" className={`font-serif text-[26px] leading-tight tracking-normal md:text-[32px] ${darkMode ? 'text-white' : 'text-stone-950'}`}>
                Choisir {categoryTitle.toLocaleLowerCase('fr-FR')} sans perdre le charme de l&apos;ancien
              </h2>
              {relatedCategories.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {relatedCategories.map((category) => (
                    <Link key={category.id} href={getCategoryUrl(category.id)} prefetch={false} className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${darkMode ? 'border-white/12 text-stone-300 hover:border-white/28 hover:text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'}`}>
                      {category.label}
                    </Link>
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
    </div>
  );
}
