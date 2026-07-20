'use client';

import React from 'react';
import { ArrowRight, Search, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DEFAULT_QUERY = '';
const SEARCH_MIN_QUERY_LENGTH = 2;

const highlightPrediction = (label, query) => {
  const cleanLabel = String(label || '');
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery || !cleanLabel.toLocaleLowerCase('fr-FR').startsWith(cleanQuery.toLocaleLowerCase('fr-FR'))) {
    return <span>{cleanLabel}</span>;
  }

  return (
    <span>
      <span>{cleanLabel.slice(0, cleanQuery.length)}</span>
      <strong className="font-black">{cleanLabel.slice(cleanQuery.length)}</strong>
    </span>
  );
};

const buildSearchHref = (query) => {
  const cleanQuery = String(query || '').trim();
  return cleanQuery ? `/recherche?q=${encodeURIComponent(cleanQuery)}` : '/';
};

const Kbd = ({ children, darkMode }) => (
  <kbd className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] px-1 font-sans text-[9px] font-semibold not-italic ${darkMode ? 'bg-white/[0.08] text-stone-300' : 'bg-stone-900/[0.05] text-stone-500 dark:bg-white/[0.08] dark:text-stone-300'}`}>
    {children}
  </kbd>
);

const PanelSkeleton = ({ darkMode }) => {
  const bar = darkMode ? 'bg-white/[0.07]' : 'bg-stone-200/60 dark:bg-white/[0.07]';
  return (
    <div className="animate-pulse px-5 py-5" aria-hidden="true">
      <div className={`h-2 w-24 rounded-full ${bar}`} />
      {[68, 52, 60].map((width, index) => (
        <div key={index} className="mt-4 flex items-center gap-3">
          <div className={`h-8 w-8 shrink-0 rounded-full ${bar}`} />
          <div className={`h-2.5 rounded-full ${bar}`} style={{ width: `${width}%` }} />
        </div>
      ))}
      <div className={`mt-7 h-2 w-24 rounded-full ${bar}`} />
      <div className="mt-4 flex items-center gap-3">
        <div className={`h-12 w-12 shrink-0 rounded-xl ${bar}`} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className={`h-2.5 w-1/2 rounded-full ${bar}`} />
          <div className={`h-2 w-1/3 rounded-full ${bar}`} />
        </div>
      </div>
    </div>
  );
};

const SuggestionPanel = ({
  data,
  loading = false,
  query,
  activeId,
  setActiveId,
  onChoose,
  darkMode,
  panelId,
  mobile = false,
}) => {
  const querySuggestions = data?.querySuggestions || [];
  const categorySuggestions = data?.categorySuggestions || [];
  const productSuggestions = data?.productSuggestions || [];
  const hasContent = querySuggestions.length > 0 || categorySuggestions.length > 0 || productSuggestions.length > 0;
  const showEmpty = !loading && data && query.trim().length >= SEARCH_MIN_QUERY_LENGTH
    && productSuggestions.length === 0 && categorySuggestions.length === 0;
  const showSkeleton = !hasContent && !showEmpty;

  const shellTone = darkMode
    ? 'bg-[#0c0b0a]/90 text-stone-100 ring-1 ring-white/[0.08] shadow-[0_32px_90px_-18px_rgba(0,0,0,0.72)] backdrop-blur-2xl'
    : 'bg-white/75 text-stone-900 ring-1 ring-stone-900/[0.07] shadow-[0_32px_90px_-24px_rgba(51,42,34,0.35)] backdrop-blur-2xl dark:bg-[#0c0b0a]/90 dark:text-stone-100 dark:ring-white/[0.08] dark:shadow-[0_32px_90px_-18px_rgba(0,0,0,0.72)]';
  const coreTone = darkMode
    ? 'bg-[#151412] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
    : 'bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-[#151412] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';
  const sectionLabelTone = darkMode ? 'text-stone-500' : 'text-stone-400 dark:text-stone-500';
  const dividerTone = darkMode ? 'border-white/[0.06]' : 'border-stone-100 dark:border-white/[0.06]';
  const metaTone = 'text-stone-500';
  const rowActiveTone = darkMode ? 'bg-white/[0.06]' : 'bg-stone-50 dark:bg-white/[0.06]';
  const iconDiscTone = darkMode ? 'bg-white/[0.06] text-stone-400' : 'bg-stone-100 text-stone-500 dark:bg-white/[0.06] dark:text-stone-400';
  const arrowDiscTone = darkMode ? 'bg-white/[0.09] text-[#D9B58D]' : 'bg-[#9A654B]/10 text-[#8B5C42] dark:bg-white/[0.09] dark:text-[#D9B58D]';
  const rowBase = 'group relative flex w-full items-center gap-3 px-4 text-left transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]';
  const arrowCue = (isActive) => `flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${arrowDiscTone} ${isActive ? 'translate-x-0 opacity-100' : 'translate-x-1.5 opacity-0'}`;

  return (
    <div
      id={panelId}
      role="listbox"
      aria-label="Suggestions de recherche"
      className={`${mobile ? 'search-suggest-mobile-pop absolute z-30' : 'search-suggest-pop absolute left-2 right-2 top-[calc(100%+10px)]'} rounded-[22px] p-1.5 ${shellTone}`}
    >
      <div
        className={`search-suggest-scroll overflow-y-auto overscroll-contain rounded-[16px] ${coreTone} ${mobile ? 'h-full' : 'max-h-[min(33.5rem,calc(100vh-165px))]'}`}
        data-global-menu-scrollable={mobile ? 'true' : undefined}
      >
        {showSkeleton ? (
          <PanelSkeleton darkMode={darkMode} />
        ) : (
          <>
            {querySuggestions.length > 0 ? (
              <section className={`border-t py-2 first:border-t-0 ${dividerTone}`}>
                <p className={`px-4 pb-1.5 pt-2 text-[9px] font-bold uppercase tracking-[0.22em] ${sectionLabelTone}`}>
                  Recherches
                </p>
                {querySuggestions.map((item, index) => {
                  const id = `search-query-${index}`;
                  const isActive = activeId === id;
                  return (
                    <button
                      id={id}
                      key={`${item.label}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveId(id)}
                      onClick={() => onChoose(item.href)}
                      className={`${rowBase} min-h-10 text-[13px] ${isActive ? rowActiveTone : ''}`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${iconDiscTone} ${isActive ? 'scale-105' : ''}`}>
                        <Search size={13} strokeWidth={1.4} />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{highlightPrediction(item.label, query)}</span>
                      <span className={arrowCue(isActive)}>
                        <ArrowRight size={12} strokeWidth={1.5} />
                      </span>
                    </button>
                  );
                })}
              </section>
            ) : null}

            {categorySuggestions.length > 0 ? (
              <section className={`border-t py-2 first:border-t-0 ${dividerTone}`}>
                <p className={`px-4 pb-1.5 pt-2 text-[9px] font-bold uppercase tracking-[0.22em] ${sectionLabelTone}`}>
                  Categories
                </p>
                {categorySuggestions.map((item, index) => {
                  const id = `search-category-${index}`;
                  const isActive = activeId === id;
                  return (
                    <button
                      id={id}
                      key={`${item.id}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveId(id)}
                      onClick={() => onChoose(item.scopedHref || item.href)}
                      className={`${rowBase} min-h-11 py-1.5 ${isActive ? rowActiveTone : ''}`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9A654B]/10 font-serif text-[12px] font-bold text-[#9A654B] shadow-[inset_0_0_0_1px_rgba(154,101,75,0.14)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isActive ? 'scale-105' : ''}`}>
                        <LayoutGrid size={14} strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold tracking-wide">{item.label}</span>
                        <span className={`block truncate text-[11px] ${metaTone}`}>
                          {item.scope} - {item.count} piece{item.count !== 1 ? 's' : ''}
                        </span>
                      </span>
                      <span className={arrowCue(isActive)}>
                        <ArrowRight size={12} strokeWidth={1.5} />
                      </span>
                    </button>
                  );
                })}
              </section>
            ) : null}

            {productSuggestions.length > 0 ? (
              <section className={`border-t py-2 first:border-t-0 ${dividerTone}`}>
                <p className={`px-4 pb-1.5 pt-2 text-[9px] font-bold uppercase tracking-[0.22em] ${sectionLabelTone}`}>
                  Pieces
                </p>
                {productSuggestions.map((item, index) => {
                  const id = `search-product-${index}`;
                  const isActive = activeId === id;
                  return (
                    <button
                      id={id}
                      key={`${item.id}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveId(id)}
                      onClick={() => onChoose(item.url)}
                      className={`${rowBase} min-h-[72px] py-2 ${isActive ? rowActiveTone : ''}`}
                    >
                      <span className={`h-14 w-14 shrink-0 overflow-hidden rounded-[12px] bg-stone-100 shadow-[inset_0_0_0_1px_rgba(51,42,34,0.06)] dark:bg-white/[0.05] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]`}>
                        {item.image ? (
                          <img src={item.image} srcSet={item.imageSrcSet || undefined} sizes="56px" alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-[15px] leading-tight">{item.title}</span>
                        <span className={`mt-0.5 block truncate text-[11px] ${metaTone}`}>{item.material || item.categoryLabel || 'Piece restauree'}</span>
                        <span className="mt-1 block text-[12px] font-bold tabular-nums">{item.priceLabel}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${item.sold ? 'bg-stone-100 text-stone-400 dark:bg-white/[0.05] dark:text-stone-500' : 'bg-[#9A654B]/10 text-[#8B5C42] dark:bg-[#D9B58D]/10 dark:text-[#D9B58D]'}`}>
                        {item.availabilityLabel}
                      </span>
                    </button>
                  );
                })}
              </section>
            ) : null}

            {showEmpty ? (
              <section className="px-5 py-6">
                <p className="font-serif text-[18px] leading-tight">Aucune piece trouvee</p>
                <p className={`mt-1.5 text-[12px] leading-relaxed ${metaTone}`}>
                  Essayez une categorie proche ou envoyez une demande pour une recherche sur mesure.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(data?.emptyActions || []).map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onChoose(item.href)}
                      className={`rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${darkMode ? 'bg-white/[0.06] text-stone-200 hover:bg-white/[0.12]' : 'bg-stone-900/[0.04] text-stone-700 hover:bg-stone-900/[0.08] dark:bg-white/[0.06] dark:text-stone-200 dark:hover:bg-white/[0.12]'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>

      {!mobile ? (
        <div className={`flex items-center justify-between px-4 pb-1 pt-2 text-[10px] tracking-wide ${darkMode ? 'text-stone-500' : 'text-stone-400 dark:text-stone-500'}`}>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd darkMode={darkMode}>&uarr;</Kbd>
              <Kbd darkMode={darkMode}>&darr;</Kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1">
              <Kbd darkMode={darkMode}>&crarr;</Kbd>
              ouvrir
            </span>
            <span className="flex items-center gap-1">
              <Kbd darkMode={darkMode}>esc</Kbd>
              fermer
            </span>
          </span>
          {query.trim().length >= SEARCH_MIN_QUERY_LENGTH ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChoose(buildSearchHref(query))}
              className={`group flex items-center gap-1.5 font-bold uppercase tracking-[0.14em] transition-colors duration-200 ${darkMode ? 'text-[#D9B58D] hover:text-[#e8ccab]' : 'text-[#8B5C42] hover:text-[#6d4732] dark:text-[#D9B58D] dark:hover:text-[#e8ccab]'}`}
            >
              Tous les resultats
              <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 ${darkMode ? 'bg-white/[0.08]' : 'bg-[#9A654B]/10 dark:bg-white/[0.08]'}`}>
                <ArrowRight size={10} strokeWidth={1.75} />
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default function SearchSuggestIsland({
  darkMode = false,
  variant = 'desktop',
  formClassName = '',
  wrapperClassName = '',
  inputClassName = '',
  buttonClassName = '',
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState(DEFAULT_QUERY);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState('');
  const inputRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const panelId = React.useId();
  const isMobile = variant === 'mobile';

  const fetchSuggestions = React.useCallback((nextQuery) => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      q: nextQuery,
      mode: 'suggest',
      limit: '8',
    });

    setLoading(true);
    fetch(`/api/search?${params.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload) {
          setData(payload);
        }
        setLoading(false);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setLoading(false);
      });

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    if (!open && !mobileOpen) return undefined;
    let abortFetch = () => {};
    const timeoutId = window.setTimeout(() => {
      abortFetch = fetchSuggestions(query);
    }, query.trim().length >= SEARCH_MIN_QUERY_LENGTH ? 120 : 0);
    return () => {
      window.clearTimeout(timeoutId);
      abortFetch();
    };
  }, [fetchSuggestions, mobileOpen, open, query]);

  React.useEffect(() => {
    if (!open && !mobileOpen) return undefined;
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setMobileOpen(false);
        setActiveId('');
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [mobileOpen, open]);

  React.useEffect(() => {
    if (activeId) {
      const element = document.getElementById(activeId);
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeId]);

  const flatItems = React.useMemo(() => {
    const items = [];
    (data?.querySuggestions || []).forEach((item, index) => items.push({ id: `search-query-${index}`, href: item.href }));
    (data?.categorySuggestions || []).forEach((item, index) => items.push({ id: `search-category-${index}`, href: item.scopedHref || item.href }));
    (data?.productSuggestions || []).forEach((item, index) => items.push({ id: `search-product-${index}`, href: item.url }));
    return items;
  }, [data]);

  const chooseHref = React.useCallback((href) => {
    setOpen(false);
    setMobileOpen(false);
    if (href) router.push(href);
  }, [router]);

  const submitSearch = React.useCallback((event) => {
    event?.preventDefault();
    chooseHref(buildSearchHref(query));
  }, [chooseHref, query]);

  const handleKeyDown = (event) => {
    if (!open && !mobileOpen && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      setOpen(true);
    }

    if (event.key === 'Escape') {
      setOpen(false);
      setMobileOpen(false);
      setActiveId('');
      event.currentTarget.blur();
      return;
    }

    if (!flatItems.length) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const foundIndex = flatItems.findIndex((item) => item.id === activeId);
      const currentIndex = foundIndex >= 0 ? foundIndex : (event.key === 'ArrowDown' ? -1 : 0);
      const nextIndex = event.key === 'ArrowDown'
        ? (currentIndex + 1) % flatItems.length
        : (currentIndex - 1 + flatItems.length) % flatItems.length;
      setActiveId(flatItems[nextIndex].id);
      return;
    }

    if (event.key === 'Enter' && activeId) {
      const activeItem = flatItems.find((item) => item.id === activeId);
      if (activeItem) {
        event.preventDefault();
        chooseHref(activeItem.href);
      }
    }
  };

  const sharedInputProps = {
    type: 'search',
    name: 'q',
    placeholder: 'Rechercher un produit...',
    value: query,
    autoComplete: 'off',
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-expanded': open || mobileOpen,
    'aria-controls': panelId,
    'aria-activedescendant': activeId || undefined,
    onChange: (event) => {
      setQuery(event.target.value);
      setActiveId('');
    },
    onKeyDown: handleKeyDown,
  };

  if (isMobile) {
    return (
      <form
        ref={containerRef}
        action="/recherche"
        method="get"
        className="contents"
        onSubmit={submitSearch}
      >
        <label className={wrapperClassName}>
          <span className="sr-only">Rechercher</span>
          <input
            {...sharedInputProps}
            ref={inputRef}
            className={inputClassName}
            onFocus={() => setMobileOpen(true)}
          />
          <Search className="absolute right-3.5 text-stone-500" size={20} strokeWidth={1.5} />
        </label>

        {mobileOpen ? (
          <SuggestionPanel
            data={data}
            loading={loading}
            query={query}
            activeId={activeId}
            setActiveId={setActiveId}
            onChoose={chooseHref}
            darkMode={darkMode}
            panelId={panelId}
            mobile
          />
        ) : null}
      </form>
    );
  }

  return (
    <form
      ref={containerRef}
      action="/recherche"
      method="get"
      className={formClassName}
      onSubmit={submitSearch}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActiveId('');
        }
      }}
    >
      <div className={wrapperClassName}>
        <input
          {...sharedInputProps}
          ref={inputRef}
          className={inputClassName}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
        />
        <button
          type="submit"
          aria-label="Rechercher"
          className={buttonClassName}
          onMouseDown={(event) => event.preventDefault()}
        >
          <Search size={16} strokeWidth={1.5} />
        </button>
      </div>
      {open ? (
        <SuggestionPanel
          data={data}
          loading={loading}
          query={query}
          activeId={activeId}
          setActiveId={setActiveId}
          onChoose={chooseHref}
          darkMode={darkMode}
          panelId={panelId}
        />
      ) : null}
    </form>
  );
}
