'use client';

import React from 'react';
import { ArrowRight, Search, X } from 'lucide-react';

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

const navigateTo = (href) => {
  if (!href || typeof window === 'undefined') return;
  window.location.assign(href);
};

const buildSearchHref = (query) => {
  const cleanQuery = String(query || '').trim();
  return cleanQuery ? `/recherche?q=${encodeURIComponent(cleanQuery)}` : '/';
};

const SuggestionPanel = ({
  data,
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
  const showEmpty = query.trim().length >= 2 && data && productSuggestions.length === 0 && categorySuggestions.length === 0;
  const panelTone = darkMode
    ? 'border-white/10 bg-[#151412] text-stone-100 shadow-[0_22px_60px_rgba(0,0,0,0.45)]'
    : 'border-stone-200 bg-white text-stone-900 shadow-[0_22px_60px_rgba(51,42,34,0.14)]';
  const sectionLabelTone = darkMode ? 'text-stone-500' : 'text-stone-400';
  const rowTone = darkMode ? 'hover:bg-white/[0.07]' : 'hover:bg-stone-50';
  const metaTone = darkMode ? 'text-stone-500' : 'text-stone-500';

  return (
    <div
      id={panelId}
      role="listbox"
      className={`${mobile ? 'w-full' : 'absolute left-4 right-4 top-full mt-2 max-h-[min(560px,calc(100vh-130px))] overflow-y-auto'} rounded-xl border ${panelTone}`}
    >
      <div className="divide-y divide-stone-100 dark:divide-white/10">
        {querySuggestions.length > 0 ? (
          <section className="py-2">
            <p className={`px-3 pb-1 text-[10px] font-black uppercase tracking-[0.18em] ${sectionLabelTone}`}>
              Recherches
            </p>
            {querySuggestions.map((item, index) => {
              const id = `search-query-${index}`;
              return (
                <button
                  id={id}
                  key={`${item.label}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeId === id}
                  onMouseEnter={() => setActiveId(id)}
                  onClick={() => onChoose(item.href)}
                  className={`flex min-h-10 w-full items-center gap-3 px-3 text-left text-[13px] transition-colors ${rowTone} ${activeId === id ? (darkMode ? 'bg-white/[0.07]' : 'bg-stone-50') : ''}`}
                >
                  <Search size={15} strokeWidth={1.6} className={metaTone} />
                  <span className="min-w-0 flex-1 truncate">{highlightPrediction(item.label, query)}</span>
                  <ArrowRight size={14} strokeWidth={1.6} className={metaTone} />
                </button>
              );
            })}
          </section>
        ) : null}

        {categorySuggestions.length > 0 ? (
          <section className="py-2">
            <p className={`px-3 pb-1 text-[10px] font-black uppercase tracking-[0.18em] ${sectionLabelTone}`}>
              Categories
            </p>
            {categorySuggestions.map((item, index) => {
              const id = `search-category-${index}`;
              return (
                <button
                  id={id}
                  key={`${item.id}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeId === id}
                  onMouseEnter={() => setActiveId(id)}
                  onClick={() => onChoose(item.scopedHref || item.href)}
                  className={`flex min-h-11 w-full items-center gap-3 px-3 text-left transition-colors ${rowTone} ${activeId === id ? (darkMode ? 'bg-white/[0.07]' : 'bg-stone-50') : ''}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#9A654B]/12 text-[10px] font-black uppercase text-[#9A654B]">
                    {String(item.label || '').slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{item.label}</span>
                    <span className={`block truncate text-[11px] ${metaTone}`}>
                      {item.scope} - {item.count} piece{item.count !== 1 ? 's' : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </section>
        ) : null}

        {productSuggestions.length > 0 ? (
          <section className="py-2">
            <p className={`px-3 pb-1 text-[10px] font-black uppercase tracking-[0.18em] ${sectionLabelTone}`}>
              Pieces
            </p>
            {productSuggestions.map((item, index) => {
              const id = `search-product-${index}`;
              return (
                <button
                  id={id}
                  key={`${item.id}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeId === id}
                  onMouseEnter={() => setActiveId(id)}
                  onClick={() => onChoose(item.url)}
                  className={`flex min-h-[72px] w-full items-center gap-3 px-3 py-2 text-left transition-colors ${rowTone} ${activeId === id ? (darkMode ? 'bg-white/[0.07]' : 'bg-stone-50') : ''}`}
                >
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {item.image ? (
                      <img src={item.image} srcSet={item.imageSrcSet || undefined} sizes="56px" alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-[15px] leading-tight">{item.title}</span>
                    <span className={`mt-1 block truncate text-[11px] ${metaTone}`}>{item.material || item.categoryLabel || 'Piece restauree'}</span>
                    <span className="mt-1 block text-[12px] font-bold tabular-nums">{item.priceLabel}</span>
                  </span>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${item.sold ? 'border-stone-200 text-stone-400' : 'border-[#9A654B]/30 text-[#9A654B]'}`}>
                    {item.availabilityLabel}
                  </span>
                </button>
              );
            })}
          </section>
        ) : null}

        {showEmpty ? (
          <section className="px-4 py-5">
            <p className="font-serif text-[18px] leading-tight">Aucune piece trouvee</p>
            <p className={`mt-1 text-[12px] leading-relaxed ${metaTone}`}>
              Essayez une categorie proche ou envoyez une demande pour une recherche sur mesure.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(data?.emptyActions || []).map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => onChoose(item.href)}
                  className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${darkMode ? 'border-white/12 hover:bg-white/10' : 'border-stone-200 hover:bg-stone-50'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
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
  const [query, setQuery] = React.useState(DEFAULT_QUERY);
  const [data, setData] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState('');
  const inputRef = React.useRef(null);
  const mobileInputRef = React.useRef(null);
  const panelId = React.useId();
  const isMobile = variant === 'mobile';

  const fetchSuggestions = React.useCallback((nextQuery) => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      q: nextQuery,
      mode: 'suggest',
      limit: '8',
    });

    fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload) setData(payload);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setData(null);
      });

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    if (!open && !mobileOpen) return undefined;
    const timeoutId = window.setTimeout(() => {
      fetchSuggestions(query);
    }, query.trim().length >= SEARCH_MIN_QUERY_LENGTH ? 120 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchSuggestions, mobileOpen, open, query]);

  React.useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => mobileInputRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

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
    navigateTo(href);
  }, []);

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
      <>
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
          <div className={`fixed inset-0 z-[240] flex min-h-[100dvh] flex-col ${darkMode ? 'bg-[#12110f] text-stone-100' : 'bg-[#fffdfb] text-stone-900'}`}>
            <form onSubmit={submitSearch} className="safe-pt-header border-b border-stone-200/80 px-4 pb-3 pt-4 dark:border-white/10">
              <div className="flex items-center gap-2">
                <label className={`relative flex h-12 min-w-0 flex-1 items-center rounded-lg ${darkMode ? 'bg-white/[0.06]' : 'bg-[#f6f2ee]'}`}>
                  <span className="sr-only">Rechercher</span>
                  <input
                    {...sharedInputProps}
                    ref={mobileInputRef}
                    className={`h-full w-full rounded-lg bg-transparent pl-4 pr-11 text-[16px] outline-none placeholder:text-stone-400 ${darkMode ? 'text-stone-100' : 'text-stone-800'}`}
                    onFocus={() => setMobileOpen(true)}
                  />
                  <Search className="absolute right-3.5 text-stone-500" size={20} strokeWidth={1.5} />
                </label>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-white/[0.08]' : 'bg-stone-100'}`}
                  aria-label="Fermer la recherche"
                >
                  <X size={18} strokeWidth={1.7} />
                </button>
              </div>
            </form>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <SuggestionPanel
                data={data}
                query={query}
                activeId={activeId}
                setActiveId={setActiveId}
                onChoose={chooseHref}
                darkMode={darkMode}
                panelId={panelId}
                mobile
              />
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <form action="/recherche" method="get" className={formClassName} onSubmit={submitSearch}>
      <div className={wrapperClassName}>
        <input
          {...sharedInputProps}
          ref={inputRef}
          className={inputClassName}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 140);
          }}
        />
        <button
          type="submit"
          aria-label="Rechercher"
          className={buttonClassName}
        >
          <Search size={16} strokeWidth={1.5} />
        </button>
      </div>
      {open ? (
        <SuggestionPanel
          data={data}
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
