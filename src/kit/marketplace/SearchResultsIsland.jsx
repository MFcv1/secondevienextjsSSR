'use client';

import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

const getQueryFromUrl = () => {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('q') || '';
};

const fetchSearchResults = async (query, signal) => {
  const params = new URLSearchParams({ q: query, mode: 'results', limit: '48' });
  const response = await fetch(`/api/search?${params.toString()}`, { cache: 'no-store', signal });
  if (!response.ok) throw new Error('search_failed');
  return response.json();
};

const ProductResult = ({ item }) => (
  <a href={item.url} className="group grid grid-cols-[92px_1fr] gap-3 rounded-xl border border-stone-200 bg-[#fffdfb] p-2 text-inherit no-underline transition-colors hover:border-stone-300 md:grid-cols-1 md:gap-4 md:border-0 md:bg-transparent md:p-0">
    <span className="block aspect-[4/3] overflow-hidden rounded-lg bg-stone-100 md:aspect-[3/4] md:rounded-xl">
      {item.image ? (
        <img
          src={item.image}
          srcSet={item.imageSrcSet || undefined}
          sizes="(max-width: 767px) 92px, (max-width: 1023px) 33vw, 25vw"
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 md:group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
      ) : null}
    </span>
    <span className="flex min-w-0 flex-col justify-center">
      <span className="truncate font-serif text-[16px] leading-tight md:text-xl">{item.title}</span>
      <span className="mt-1 truncate text-[12px] text-stone-500">{item.material || item.categoryLabel || 'Piece restauree'}</span>
      <span className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold tabular-nums">{item.priceLabel}</span>
        <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${item.sold ? 'border-stone-200 text-stone-400' : 'border-[#9A654B]/30 text-[#9A654B]'}`}>
          {item.availabilityLabel}
        </span>
      </span>
    </span>
  </a>
);

export default function SearchResultsIsland() {
  const [query, setQuery] = React.useState('');
  const [draftQuery, setDraftQuery] = React.useState('');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const syncFromUrl = () => {
      const nextQuery = getQueryFromUrl();
      setQuery(nextQuery);
      setDraftQuery(nextQuery);
      setReady(true);
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  React.useEffect(() => {
    if (!ready) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    fetchSearchResults(query, controller.signal)
      .then((payload) => setData(payload))
      .catch((searchError) => {
        if (searchError?.name !== 'AbortError') setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, ready]);

  const submit = (event) => {
    event.preventDefault();
    const nextQuery = draftQuery.trim();
    const nextHref = nextQuery ? `/recherche?q=${encodeURIComponent(nextQuery)}` : '/recherche';
    window.history.pushState(null, '', nextHref);
    setQuery(nextQuery);
  };

  const results = data?.products || [];
  const hasQuery = query.trim().length > 0;

  return (
    <section className="min-h-[60dvh] bg-[#FAFAF9] px-4 py-7 text-stone-900 md:px-8 md:py-12 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 border-b border-stone-200 pb-6 md:grid-cols-[1fr_minmax(320px,460px)] md:items-end">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#9A654B]">Recherche catalogue</p>
            <h1 className="font-serif text-[34px] leading-tight md:text-5xl">
              {hasQuery ? `Resultats pour "${query}"` : 'Rechercher une piece'}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-[1.75] text-stone-600">
              Cherchez par type de meuble, matiere, style ou intention: buffet, miroir, bois, petit prix, disponible.
            </p>
          </div>

          <form onSubmit={submit} className="relative flex items-center rounded-lg border border-stone-200 bg-white">
            <input
              type="search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Rechercher un produit..."
              className="h-12 w-full bg-transparent pl-4 pr-12 text-[15px] outline-none placeholder:text-stone-400"
            />
            <button type="submit" aria-label="Rechercher" className="absolute right-3 text-stone-500 transition-colors hover:text-[#9A654B]">
              <Search size={18} strokeWidth={1.6} />
            </button>
          </form>
        </div>

        <div className="flex items-center justify-between gap-4 py-4">
          <p className="text-[12px] font-medium text-stone-500">
            {loading ? 'Recherche en cours...' : `${data?.total || 0} resultat${(data?.total || 0) !== 1 ? 's' : ''}`}
          </p>
          <span className="hidden items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400 md:flex">
            <SlidersHorizontal size={14} strokeWidth={1.6} />
            Catalogue public
          </span>
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[92px_1fr] gap-3 rounded-xl border border-stone-200 bg-white p-2 md:block md:border-0 md:bg-transparent md:p-0">
                <div className="h-[69px] rounded-lg bg-stone-100 md:aspect-[3/4] md:h-auto md:rounded-xl" />
                <div className="space-y-2 py-2 md:pt-4">
                  <div className="h-4 w-3/4 rounded bg-stone-100" />
                  <div className="h-3 w-1/2 rounded bg-stone-100" />
                  <div className="h-3 w-20 rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-xl border border-stone-200 bg-white px-5 py-8">
            <p className="font-serif text-2xl">Recherche indisponible</p>
            <p className="mt-2 text-[14px] text-stone-500">Rechargez la page ou parcourez la galerie principale.</p>
            <a href="/#gallery-pieces" className="mt-5 inline-flex rounded-full border border-stone-300 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]">
              Voir les pieces
            </a>
          </div>
        ) : null}

        {!loading && !error && results.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {results.map((item) => (
              <ProductResult key={item.id} item={item} />
            ))}
          </div>
        ) : null}

        {!loading && !error && results.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white px-5 py-8">
            <p className="font-serif text-2xl">{hasQuery ? 'Aucune piece trouvee' : 'Commencez par une recherche'}</p>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-stone-500">
              Une piece unique peut ne pas porter exactement le mot cherche. Essayez une categorie proche ou envoyez une demande.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(data?.emptyActions || []).map((item) => (
                <a key={item.href} href={item.href} className="rounded-full border border-stone-300 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-colors hover:bg-stone-50">
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
