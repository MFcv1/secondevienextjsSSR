'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Euro,
  FileText,
  ImageIcon,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  RefreshCw,
  Save,
  Search,
  UserRound,
} from 'lucide-react';
import { getAdminCachedData } from './adminDataCache';
import {
  ADMIN_QUOTES_CACHE_KEY,
  getQuoteRequestAdmin,
  loadQuoteRequestsAdmin,
  updateQuoteRequestAdmin,
} from './quoteAdminClient';

const STATUS_OPTIONS = [
  ['new', 'Nouveau'],
  ['qualifying', 'À qualifier'],
  ['waiting_customer', 'À recontacter'],
  ['in_review', 'En étude'],
  ['proposal_ready', 'Proposition prête'],
  ['closed', 'Terminé'],
  ['declined', 'Non retenu'],
];

const STATUS_META = {
  new: { label: 'Nouveau', className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200' },
  qualifying: { label: 'À qualifier', className: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-200' },
  waiting_customer: { label: 'À recontacter', className: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-300/20 dark:bg-violet-300/10 dark:text-violet-200' },
  in_review: { label: 'En étude', className: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-300/20 dark:bg-orange-300/10 dark:text-orange-200' },
  proposal_ready: { label: 'Proposition prête', className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200' },
  closed: { label: 'Terminé', className: 'border-stone-200 bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300' },
  declined: { label: 'Non retenu', className: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200' },
};

const euro = (cents) => new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
}).format(Number(cents || 0) / 100);

const estimateRange = (quote) => {
  const estimate = quote?.project?.indicativeEstimate || {};
  if (!estimate.minCents && !estimate.maxCents) return 'À chiffrer';
  return `${euro(estimate.minCents)} – ${euro(estimate.maxCents)}`;
};

const dateTime = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const relativeDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Date inconnue';
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  return `Il y a ${days} jours`;
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.new;
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[10px] font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function Metric({ icon: Icon, label, value, hint, darkMode }) {
  return (
    <article className={`rounded-2xl border p-4 ${darkMode ? 'border-white/10 bg-white/[0.035]' : 'border-stone-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{label}</p>
          <strong className="mt-2 block text-2xl font-black tracking-[-0.04em]">{value}</strong>
          <p className={`mt-1 text-[11px] ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>{hint}</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${darkMode ? 'bg-white/[0.06] text-stone-300' : 'bg-stone-100 text-stone-700'}`}>
          <Icon size={17} />
        </span>
      </div>
    </article>
  );
}

function DetailSkeleton({ darkMode }) {
  return (
    <div className={`space-y-4 rounded-2xl border p-5 ${darkMode ? 'border-white/10 bg-white/[0.025]' : 'border-stone-200 bg-white'}`} aria-label="Chargement de la demande">
      <div className={`h-7 w-44 animate-pulse rounded-lg ${darkMode ? 'bg-white/[0.06]' : 'bg-stone-100'}`} />
      <div className={`h-20 animate-pulse rounded-xl ${darkMode ? 'bg-white/[0.04]' : 'bg-stone-100'}`} />
      <div className={`h-40 animate-pulse rounded-xl ${darkMode ? 'bg-white/[0.04]' : 'bg-stone-100'}`} />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, href, darkMode }) {
  const content = (
    <>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${darkMode ? 'bg-white/[0.05] text-stone-400' : 'bg-stone-100 text-stone-600'}`}>
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className={`block text-[10px] font-black uppercase tracking-[0.12em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{label}</span>
        <span className="mt-0.5 block break-words text-[13px] font-semibold">{value || 'Non renseigné'}</span>
      </span>
      {href ? <ArrowUpRight className={`ml-auto shrink-0 ${darkMode ? 'text-stone-600' : 'text-stone-300'}`} size={15} /> : null}
    </>
  );
  return href ? (
    <a className={`flex min-h-12 items-center gap-3 rounded-xl p-2 transition ${darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-stone-50'}`} href={href}>{content}</a>
  ) : (
    <div className="flex min-h-12 items-center gap-3 p-2">{content}</div>
  );
}

export const preloadAdminQuotesData = ({ force = false } = {}) => loadQuoteRequestsAdmin({ force });

export default function AdminQuotes({ darkMode = false }) {
  const cached = getAdminCachedData(ADMIN_QUOTES_CACHE_KEY);
  const [quotes, setQuotes] = useState(cached?.quotes || []);
  const [hasMore, setHasMore] = useState(Boolean(cached?.hasMore));
  const [status, setStatus] = useState(cached ? 'ready' : 'loading');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedId, setSelectedId] = useState(cached?.quotes?.[0]?.quoteId || '');
  const [detail, setDetail] = useState(null);
  const [detailStatus, setDetailStatus] = useState('idle');
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [draft, setDraft] = useState({ status: 'new', internalNotes: '' });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const load = useCallback(async ({ force = false } = {}) => {
    if (!quotes.length) setStatus('loading');
    setError('');
    try {
      const workspace = await loadQuoteRequestsAdmin({ force });
      setQuotes(workspace.quotes || []);
      setHasMore(Boolean(workspace.hasMore));
      setSelectedId((current) => (
        (workspace.quotes || []).some((quote) => quote.quoteId === current)
          ? current
          : workspace.quotes?.[0]?.quoteId || ''
      ));
      setStatus('ready');
    } catch {
      setStatus(quotes.length ? 'ready' : 'error');
      setError('Impossible de charger les demandes pour le moment.');
    }
  }, [quotes.length]);

  useEffect(() => {
    if (!cached) void load();
  }, [cached, load]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailStatus('idle');
      return undefined;
    }
    let cancelled = false;
    setDetailStatus('loading');
    setSaveMessage('');
    getQuoteRequestAdmin(selectedId).then(({ quote }) => {
      if (cancelled) return;
      setDetail(quote);
      setDraft({ status: quote.status || 'new', internalNotes: quote.internalNotes || '' });
      setDetailStatus('ready');
    }).catch(() => {
      if (!cancelled) setDetailStatus('error');
    });
    return () => { cancelled = true; };
  }, [detailRefreshKey, selectedId]);

  const filteredQuotes = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('fr');
    return quotes.filter((quote) => {
      if (statusFilter === 'active' && ['closed', 'declined'].includes(quote.status)) return false;
      if (statusFilter !== 'all' && statusFilter !== 'active' && quote.status !== statusFilter) return false;
      if (!term) return true;
      const haystack = [
        quote.requestNumber,
        quote.customer?.fullName,
        quote.customer?.email,
        quote.customer?.phone,
        quote.customer?.location,
        quote.project?.furnitureLabel,
        quote.project?.description,
        ...(quote.project?.services || []).map((service) => service.label),
      ].join(' ').toLocaleLowerCase('fr');
      return haystack.includes(term);
    });
  }, [query, quotes, statusFilter]);

  const metrics = useMemo(() => {
    const active = quotes.filter((quote) => !['closed', 'declined'].includes(quote.status));
    return {
      newCount: quotes.filter((quote) => quote.status === 'new').length,
      activeCount: active.length,
      readyCount: quotes.filter((quote) => quote.status === 'proposal_ready').length,
      potential: active.reduce((sum, quote) => sum + Number(quote.project?.indicativeEstimate?.maxCents || 0), 0),
    };
  }, [quotes]);

  const openDetail = (quoteId) => {
    setSelectedId(quoteId);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      window.requestAnimationFrame(() => document.getElementById('quote-admin-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const save = async () => {
    if (!detail || saving) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const result = await updateQuoteRequestAdmin({
        quoteId: detail.quoteId,
        expectedVersion: detail.version,
        status: draft.status,
        internalNotes: draft.internalNotes,
      });
      const updated = result.quote;
      setDetail(updated);
      setDraft({ status: updated.status, internalNotes: updated.internalNotes || '' });
      setQuotes((current) => current.map((quote) => (
        quote.quoteId === updated.quoteId ? { ...quote, ...updated, photos: undefined } : quote
      )));
      setSaveMessage('Modifications enregistrées.');
    } catch (saveError) {
      const conflict = String(saveError?.details?.reason || saveError?.code || '').includes('conflict')
        || String(saveError?.code || '').includes('aborted');
      setSaveMessage(conflict
        ? 'La fiche a changé ailleurs. Actualisez avant de recommencer.'
        : 'Les modifications n’ont pas pu être enregistrées.');
    } finally {
      setSaving(false);
    }
  };

  const surface = darkMode ? 'border-white/10 bg-white/[0.025]' : 'border-stone-200 bg-white';
  const muted = darkMode ? 'text-stone-400' : 'text-stone-500';
  const field = darkMode
    ? 'border-white/10 bg-[#151515] text-white placeholder:text-stone-600'
    : 'border-stone-200 bg-white text-stone-900 placeholder:text-stone-400';

  return (
    <div className="space-y-5">
      <section className={`rounded-3xl border p-5 sm:p-6 ${surface}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-amber-300/70' : 'text-amber-700'}`}>Atelier devis</p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Demandes de restauration</h1>
            <p className={`mt-2 max-w-2xl text-sm leading-6 ${muted}`}>Toutes les demandes envoyées depuis le site, prêtes à être qualifiées et suivies sans dépendre d’une boîte e-mail.</p>
          </div>
          <button
            type="button"
            onClick={() => void load({ force: true })}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${darkMode ? 'border-white/10 hover:bg-white/[0.05]' : 'border-stone-200 hover:bg-stone-50'}`}
          >
            <RefreshCw className={status === 'loading' ? 'animate-spin' : ''} size={15} />
            Actualiser
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric darkMode={darkMode} icon={Clock3} label="Nouvelles" value={metrics.newCount} hint="à ouvrir en priorité" />
        <Metric darkMode={darkMode} icon={MessageSquareText} label="En cours" value={metrics.activeCount} hint="demandes actives" />
        <Metric darkMode={darkMode} icon={CheckCircle2} label="Prêtes" value={metrics.readyCount} hint="propositions préparées" />
        <Metric darkMode={darkMode} icon={Euro} label="Potentiel indicatif" value={euro(metrics.potential)} hint="haut des estimations actives" />
      </section>

      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-300/20 dark:bg-red-300/10 dark:text-red-200">{error}</p> : null}

      <section className="grid items-stretch gap-5 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <div className={`h-full overflow-hidden rounded-2xl border ${surface}`}>
          <div className={`space-y-3 border-b p-4 ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
            <label className="relative block">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`} size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Client, ville, meuble…"
                className={`min-h-11 w-full rounded-xl border py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/30 ${field}`}
              />
            </label>
            <select
              aria-label="Filtrer les demandes par statut"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`min-h-11 w-full rounded-xl border px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/30 ${field}`}
            >
              <option value="active">Demandes actives</option>
              <option value="all">Toutes les demandes</option>
              {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <p className={`text-[11px] ${muted}`}>{filteredQuotes.length} affichée{filteredQuotes.length > 1 ? 's' : ''}{hasMore ? ' · 100 dernières demandes' : ''}</p>
          </div>

          <div className="max-h-[720px] overflow-y-auto p-2">
            {status === 'loading' && !quotes.length ? (
              <div className="space-y-2 p-2" aria-label="Chargement des demandes">
                {[0, 1, 2].map((item) => <div key={item} className={`h-28 animate-pulse rounded-xl ${darkMode ? 'bg-white/[0.04]' : 'bg-stone-100'}`} />)}
              </div>
            ) : filteredQuotes.length ? filteredQuotes.map((quote) => {
              const selected = quote.quoteId === selectedId;
              return (
                <button
                  type="button"
                  key={quote.quoteId}
                  onClick={() => openDetail(quote.quoteId)}
                  aria-pressed={selected}
                  className={`mb-1.5 w-full rounded-xl border p-3.5 text-left transition ${selected
                    ? (darkMode ? 'border-amber-300/35 bg-amber-300/[0.08]' : 'border-amber-300 bg-amber-50/70')
                    : (darkMode ? 'border-transparent hover:border-white/10 hover:bg-white/[0.03]' : 'border-transparent hover:border-stone-200 hover:bg-stone-50')}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-[0.12em] ${muted}`}>{quote.requestNumber}</p>
                      <strong className="mt-1 block truncate text-[14px]">{quote.customer?.fullName || 'Client'}</strong>
                    </div>
                    <StatusBadge status={quote.status} />
                  </div>
                  <p className={`mt-2 line-clamp-2 text-[12px] leading-5 ${muted}`}>{quote.project?.furnitureLabel || 'Meuble'} · {quote.project?.description || quote.project?.condition || 'À qualifier'}</p>
                  <div className={`mt-3 flex items-center justify-between gap-3 text-[10px] font-semibold ${muted}`}>
                    <span>{estimateRange(quote)}</span>
                    <span>{relativeDate(quote.createdAt)}</span>
                  </div>
                </button>
              );
            }) : (
              <div className="grid min-h-48 place-items-center px-5 text-center">
                <div>
                  <FileText className={`mx-auto ${muted}`} size={26} strokeWidth={1.4} />
                  <p className="mt-3 text-sm font-bold">Aucune demande dans ce filtre</p>
                  <p className={`mt-1 text-xs ${muted}`}>Les nouvelles demandes apparaîtront ici automatiquement.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div id="quote-admin-detail" className="h-full scroll-mt-24">
          {detailStatus === 'loading' ? <DetailSkeleton darkMode={darkMode} /> : detailStatus === 'error' ? (
            <div className={`h-full rounded-2xl border p-6 text-center ${surface}`}>
              <p className="text-sm font-bold">La fiche n’a pas pu être ouverte.</p>
              <button type="button" onClick={() => setDetailRefreshKey((value) => value + 1)} className="mt-4 min-h-11 rounded-xl border px-4 text-xs font-bold">Réessayer</button>
            </div>
          ) : detail ? (
            <div className={`h-full overflow-hidden rounded-2xl border ${surface}`}>
              <header className={`border-b p-5 sm:p-6 ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${muted}`}>{detail.requestNumber}</p>
                    <h2 className="mt-2 text-xl font-black tracking-[-0.03em] sm:text-2xl">{detail.customer?.fullName || 'Demande client'}</h2>
                    <p className={`mt-1 flex items-center gap-2 text-xs ${muted}`}><CalendarClock size={14} /> Reçue le {dateTime(detail.createdAt)}</p>
                  </div>
                  <StatusBadge status={detail.status} />
                </div>
              </header>

              <div className="grid gap-6 p-5 sm:p-6 2xl:grid-cols-[minmax(0,1fr)_310px]">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em]">Projet</h3>
                    <div className={`mt-3 rounded-xl border p-4 ${darkMode ? 'border-white/10 bg-white/[0.025]' : 'border-stone-200 bg-stone-50/60'}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <strong className="text-lg">{detail.project?.furnitureLabel || 'Meuble à qualifier'}</strong>
                        <span className="text-sm font-black tabular-nums">{estimateRange(detail)}</span>
                      </div>
                      <p className={`mt-2 text-sm leading-6 ${muted}`}>{detail.project?.condition || 'État non précisé'}</p>
                      {detail.project?.description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{detail.project.description}</p> : null}
                      {detail.project?.notes ? <p className={`mt-3 whitespace-pre-wrap text-sm leading-6 ${muted}`}>{detail.project.notes}</p> : null}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em]">Prestations demandées</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(detail.project?.services || []).length ? detail.project.services.map((service) => (
                        <span key={service.id} className={`rounded-full border px-3 py-2 text-[11px] font-semibold ${darkMode ? 'border-white/10 bg-white/[0.035]' : 'border-stone-200 bg-stone-50'}`}>
                          {service.label}{service.severity ? ` · ${service.severity}` : ''}
                        </span>
                      )) : <span className={`text-sm ${muted}`}>Aucune prestation sélectionnée.</span>}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.14em]">Photos privées</h3>
                      <span className={`text-[11px] ${muted}`}>{detail.photos?.length || 0} fichier{detail.photos?.length > 1 ? 's' : ''}</span>
                    </div>
                    {detail.photos?.length ? (
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {detail.photos.map((photo) => photo.url ? (
                          <a key={photo.photoId} href={photo.url} target="_blank" rel="noreferrer" className={`group relative aspect-square overflow-hidden rounded-xl border ${darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-100'}`}>
                            <Image src={photo.url} alt={`Photo du meuble — ${photo.originalName || 'vue client'}`} fill sizes="(max-width: 640px) 50vw, 220px" unoptimized className="object-cover transition duration-300 group-hover:scale-[1.02]" />
                            <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/60 px-2 py-1 text-center text-[9px] font-bold text-white backdrop-blur-sm">Ouvrir</span>
                          </a>
                        ) : (
                          <div key={photo.photoId} className={`grid aspect-square place-items-center rounded-xl border border-dashed px-3 text-center text-[10px] ${darkMode ? 'border-white/10 text-stone-500' : 'border-stone-300 text-stone-500'}`}>
                            Photo temporairement indisponible
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`mt-3 flex min-h-28 items-center justify-center gap-2 rounded-xl border border-dashed text-xs ${darkMode ? 'border-white/10 text-stone-500' : 'border-stone-300 text-stone-500'}`}>
                        <ImageIcon size={17} /> Aucune photo transmise
                      </div>
                    )}
                  </section>
                </div>

                <aside className="space-y-5">
                  <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em]">Contact</h3>
                    <div className="mt-2">
                      <InfoRow darkMode={darkMode} icon={UserRound} label="Client" value={detail.customer?.fullName} />
                      <InfoRow darkMode={darkMode} icon={Mail} label="E-mail" value={detail.customer?.email} href={detail.customer?.email ? `mailto:${detail.customer.email}` : null} />
                      <InfoRow darkMode={darkMode} icon={Phone} label="Téléphone" value={detail.customer?.phone} href={detail.customer?.phone ? `tel:${detail.customer.phone.replace(/\s/g, '')}` : null} />
                      <InfoRow darkMode={darkMode} icon={MapPin} label="Localisation" value={detail.customer?.location} />
                    </div>
                  </section>

                  <section className={`rounded-xl border p-4 ${darkMode ? 'border-white/10 bg-white/[0.025]' : 'border-stone-200 bg-stone-50/60'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.12em] ${muted}`}>Accusé de réception</p>
                    <p className="mt-2 text-sm font-bold">
                      {detail.confirmationEmail?.status === 'sent' ? 'E-mail envoyé'
                        : detail.confirmationEmail?.status === 'failed' ? 'Échec de l’e-mail'
                          : detail.confirmationEmail?.status === 'sending' ? 'Envoi en cours'
                            : 'En attente d’envoi'}
                    </p>
                    <p className={`mt-1 text-[11px] leading-5 ${muted}`}>La demande reste enregistrée, quel que soit l’état de cet e-mail.</p>
                  </section>

                  <section>
                    <label className="block text-[11px] font-black uppercase tracking-[0.14em]" htmlFor="quote-status">Statut de suivi</label>
                    <select id="quote-status" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} className={`mt-2 min-h-11 w-full rounded-xl border px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/30 ${field}`}>
                      {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </section>

                  <section>
                    <label className="block text-[11px] font-black uppercase tracking-[0.14em]" htmlFor="quote-notes">Notes internes</label>
                    <textarea id="quote-notes" rows={7} maxLength={4000} value={draft.internalNotes} onChange={(event) => setDraft((current) => ({ ...current, internalNotes: event.target.value }))} placeholder="Points à vérifier, rappel prévu, proposition envisagée…" className={`mt-2 w-full resize-y rounded-xl border p-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-amber-500/30 ${field}`} />
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span aria-live="polite" className={`text-[10px] ${saveMessage.includes('enregistrées') ? 'text-emerald-600 dark:text-emerald-300' : muted}`}>{saveMessage}</span>
                      <span className={`text-[10px] tabular-nums ${muted}`}>{draft.internalNotes.length}/4000</span>
                    </div>
                  </section>

                  <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 text-xs font-black text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200">
                    {saving ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
                    {saving ? 'Enregistrement…' : 'Enregistrer le suivi'}
                  </button>
                </aside>
              </div>
            </div>
          ) : (
            <div className={`grid h-full min-h-80 place-items-center rounded-2xl border p-8 text-center ${surface}`}>
              <div>
                <FileText className={`mx-auto ${muted}`} size={34} strokeWidth={1.3} />
                <p className="mt-4 text-sm font-bold">Sélectionnez une demande</p>
                <p className={`mt-1 text-xs ${muted}`}>La fiche détaillée apparaîtra ici.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
