'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import QuoteProposalEditor from './QuoteProposalEditor';
import { displayQuoteStatus, quoteDraft } from './quotePresentation';
import {
  ADMIN_QUOTES_CACHE_KEY,
  getQuoteRequestAdmin,
  loadQuoteRequestsAdmin,
  updateQuoteRequestAdmin,
} from './quoteAdminClient';

const STATUS_OPTIONS = [
  ['new', 'Nouveau'],
  ['in_review', 'En étude'],
  ['proposal_sent', 'Envoyé'],
  ['accepted', 'Accord client'],
  ['closed', 'Terminé'],
];

const STATUS_META = {
  new: { label: 'Nouveau', className: 'text-amber-800 dark:text-amber-200' },
  qualifying: { label: 'À qualifier', className: 'text-sky-800 dark:text-sky-200' },
  waiting_customer: { label: 'À recontacter', className: 'text-violet-800 dark:text-violet-200' },
  in_review: { label: 'En étude', className: 'text-orange-800 dark:text-orange-200' },
  proposal_ready: { label: 'Proposition prête', className: 'text-emerald-800 dark:text-emerald-200' },
  closed: { label: 'Terminé', className: 'text-stone-700 dark:text-stone-300' },
  declined: { label: 'Non retenu', className: 'text-rose-800 dark:text-rose-200' },
  proposal_sent: { label: 'Envoyé', className: 'text-sky-800 dark:text-sky-200' },
  accepted: { label: 'Accord client', className: 'text-emerald-800 dark:text-emerald-200' },
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
  const meta = STATUS_META[displayQuoteStatus(status)] || STATUS_META.new;
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap text-[10px] font-bold ${meta.className}`}>
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
  const cached = getAdminCachedData(ADMIN_QUOTES_CACHE_KEY, { allowStale: true });
  const [quotes, setQuotes] = useState(cached?.quotes || []);
  const [hasMore, setHasMore] = useState(Boolean(cached?.hasMore));
  const [supportsReference, setSupportsReference] = useState(typeof cached?.hasMore === 'boolean');
  const [nextCursor, setNextCursor] = useState(cached?.nextCursor || null);
  const [status, setStatus] = useState(cached ? 'ready' : 'loading');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedId, setSelectedId] = useState(cached?.quotes?.[0]?.quoteId || '');
  const [detail, setDetail] = useState(null);
  const [detailStatus, setDetailStatus] = useState('idle');
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [draft, setDraft] = useState({ status: 'new', internalNotes: '' });
  const draftRef = useRef(null);
  const draftBaseRef = useRef(null);
  draftRef.current = draft;
  const selectionRef = useRef(selectedId);
  selectionRef.current = selectedId;
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const trashDialog = useRef(null);
  const photoDialog = useRef(null);
  const [openedPhoto, setOpenedPhoto] = useState(null);
  const dirty = Boolean(detail && JSON.stringify(draft) !== JSON.stringify(quoteDraft(detail)));
  const locked = saving || Boolean(detail?.deletedAt) || ['sending', 'delivery_unknown'].includes(detail?.proposalEmail?.status);
  const listSequenceRef = useRef(0);
  const initialLoadRef = useRef(false);

  const load = useCallback(async ({ force = false, cursor = null, reference = null } = {}) => {
    const sequence = ++listSequenceRef.current;
    setStatus(quotes.length ? 'refreshing' : 'loading');
    setError('');
    try {
      const workspace = await loadQuoteRequestsAdmin({ force, cursor, reference });
      if (sequence !== listSequenceRef.current) return;
      if (reference) setStatusFilter('all');
      setQuotes((current) => cursor ? [...current, ...(workspace.quotes || []).filter((row) => !current.some((old) => old.quoteId === row.quoteId))] : workspace.quotes || []);
      setHasMore(Boolean(workspace.hasMore));
      setSupportsReference(typeof workspace.hasMore === 'boolean');
      setNextCursor(workspace.nextCursor || null);
      setSelectedId((current) => (
        (cursor && current) || (workspace.quotes || []).some((quote) => quote.quoteId === current)
          ? current
          : workspace.quotes?.[0]?.quoteId || ''
      ));
      setStatus('ready');
    } catch {
      if (sequence !== listSequenceRef.current) return;
      setStatus(quotes.length ? 'ready' : 'error');
      setError('Impossible de charger les demandes pour le moment.');
    }
  }, [quotes.length]);

  useEffect(() => () => { listSequenceRef.current += 1; }, []);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    void load();
  }, [cached, load]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailStatus('idle');
      return undefined;
    }
    let cancelled = false;
    const receiveDraft = (quote) => {
      const next = quoteDraft(quote);
      if (draftRef.current?.quoteId !== selectedId || JSON.stringify(draftRef.current) === JSON.stringify(draftBaseRef.current)) {
        draftRef.current = next;
        setDraft(next);
      }
      draftBaseRef.current = next;
    };
    const row = quotes.find((quote) => quote.quoteId === selectedId);
    if (row) {
      setDetail(row);
      receiveDraft(row);
    }
    setDetailStatus(row ? 'ready' : 'loading');
    if (row && !row.photoCount) return undefined;
    getQuoteRequestAdmin(selectedId, row?.version, { force: detailRefreshKey > 0, privatePreview: detailRefreshKey > 0 }).then(({ quote }) => {
      if (cancelled) return;
      setDetail(quote);
      receiveDraft(quote);
      setDetailStatus('ready');
    }).catch(() => {
      if (!cancelled) { setDetailStatus(row ? 'ready' : 'error'); setSaveMessage('Photos indisponibles. Actualisez pour réessayer.'); }
    });
    return () => { cancelled = true; };
  }, [detailRefreshKey, selectedId, quotes]);

  const filteredQuotes = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('fr');
    return quotes.filter((quote) => {
      if (statusFilter === 'trash') return Boolean(quote.deletedAt) && (!term || [quote.requestNumber, quote.customer?.fullName, quote.customer?.email].join(' ').toLocaleLowerCase('fr').includes(term));
      if (quote.deletedAt) return false;
      if (statusFilter === 'active' && ['closed', 'declined'].includes(quote.status)) return false;
      if (statusFilter !== 'all' && statusFilter !== 'active' && displayQuoteStatus(quote.status) !== statusFilter) return false;
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
    const active = quotes.filter((quote) => !quote.deletedAt && !['closed', 'declined'].includes(quote.status));
    return {
      newCount: active.filter((quote) => quote.status === 'new').length,
      activeCount: active.length,
      readyCount: active.filter((quote) => quote.status === 'proposal_sent').length,
      potential: active.reduce((sum, quote) => sum + Number(quote.project?.indicativeEstimate?.maxCents || 0), 0),
    };
  }, [quotes]);

  const openDetail = (quoteId) => {
    if (saving) return;
    if (dirty && !window.confirm('Quitter ce dossier et abandonner les modifications non enregistrées ?')) return;
    setSaveMessage('');
    setSelectedId(quoteId);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      window.requestAnimationFrame(() => document.getElementById('quote-admin-detail')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }));
    }
  };

  const save = async (action = 'save') => {
    if (!detail || saving) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const result = await updateQuoteRequestAdmin({
        quoteId: detail.quoteId,
        expectedVersion: action === 'save' ? draft.expectedVersion : detail.version,
        status: draft.status,
        internalNotes: draft.internalNotes,
        proposal: draft.proposal,
        action,
      });
      const updated = result.quote;
      setQuotes((current) => current.map((quote) => (
        quote.quoteId === updated.quoteId ? { ...quote, ...updated, photos: undefined } : quote
      )));
      if (selectionRef.current !== updated.quoteId) return;
      setDetail(updated);
      const draftUnchanged = draftRef.current === draft;
      if (draftUnchanged) {
        const nextDraft = quoteDraft(updated);
        draftRef.current = nextDraft;
        draftBaseRef.current = nextDraft;
        setDraft(nextDraft);
      }
      setSaveMessage(action === 'send' ? (updated.proposalEmail?.status === 'sent' ? 'Proposition envoyée au client.' : 'Consultez le résultat de l’envoi dans le chiffrage.') : action === 'trash' ? 'Demande placée dans la corbeille. Vous pouvez la restaurer.' : 'Modifications enregistrées.');
      return draftUnchanged;
    } catch (saveError) {
      if (selectionRef.current !== detail.quoteId) return;
      const conflict = String(saveError?.details?.reason || saveError?.code || '').includes('conflict')
        || String(saveError?.code || '').includes('aborted');
      setSaveMessage(conflict
        ? 'La fiche a changé ailleurs. Votre saisie est conservée ; comparez-la à la version actualisée avant de la reprendre.'
        : (saveError?.message || 'Les modifications n’ont pas pu être enregistrées.'));
      if (conflict || action !== 'save') {
        try {
          const fresh = await getQuoteRequestAdmin(detail.quoteId, detail.version, { force: true });
          if (selectionRef.current === detail.quoteId) {
            setDetail(fresh.quote);
            if (action !== 'save') setDraft(quoteDraft(fresh.quote));
          }
        } catch { /* Keep the draft; the user can explicitly refresh. */ }
      }
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
            onClick={() => { setDetailRefreshKey(value => value + 1); void load({ force: true }); }}
            disabled={saving || status === 'loading' || status === 'refreshing'}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${darkMode ? 'border-white/10 hover:bg-white/[0.05]' : 'border-stone-200 hover:bg-stone-50'}`}
          >
            <RefreshCw className={status === 'loading' ? 'animate-spin' : ''} size={15} />
            {status === 'refreshing' ? 'Actualisation · Dernières données connues' : 'Actualiser'}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric darkMode={darkMode} icon={Clock3} label="Nouvelles" value={status === 'loading' || status === 'error' ? '—' : metrics.newCount} hint="parmi les demandes chargées" />
        <Metric darkMode={darkMode} icon={MessageSquareText} label="En cours" value={status === 'loading' || status === 'error' ? '—' : metrics.activeCount} hint="parmi les demandes chargées" />
        <Metric darkMode={darkMode} icon={CheckCircle2} label="Envoyées" value={status === 'loading' || status === 'error' ? '—' : metrics.readyCount} hint="parmi les demandes actives chargées" />
        <Metric darkMode={darkMode} icon={Euro} label="Potentiel indicatif" value={status === 'loading' || status === 'error' ? '—' : euro(metrics.potential)} hint="estimations des demandes chargées" />
      </section>

      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-300/20 dark:bg-red-300/10 dark:text-red-200">{error}</p> : null}

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
        <div className={`overflow-hidden rounded-2xl border ${surface}`}>
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
              <option value="trash">Corbeille</option>
              {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <p className={`text-[11px] ${muted}`}>{filteredQuotes.length} affichée{filteredQuotes.length > 1 ? 's' : ''}{hasMore ? ' · Liste partielle' : ''}</p>
            {nextCursor && <button type="button" disabled={status === 'loading' || status === 'refreshing'} onClick={() => load({ cursor: nextCursor })}>Charger la suite</button>}
            {supportsReference && query.trim() && <button type="button" onClick={() => load({ reference: query.trim(), force: true })}>Rechercher cette référence exacte dans tous les dossiers</button>}
          </div>

          <div className="max-h-[340px] overflow-y-auto p-2 xl:max-h-[65dvh]">
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
                  disabled={saving}
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
                  <p className={`mt-1 text-xs ${muted}`}>Actualisez la liste pour consulter les nouvelles demandes.</p>
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
            <div className={`rounded-2xl border ${surface}`}>
              <header className={`rounded-t-2xl border-b p-4 ${darkMode ? 'border-white/10 bg-[#151515]' : 'border-stone-200 bg-white'}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${muted}`}>{detail.requestNumber}</p>
                    <h2 className="mt-2 text-xl font-black tracking-[-0.03em] sm:text-2xl">{detail.customer?.fullName || 'Demande client'}</h2>
                    <p className={`mt-1 flex items-center gap-2 text-xs ${muted}`}><CalendarClock size={14} /> Reçue le {dateTime(detail.createdAt)}</p>
                  </div>
                  <StatusBadge status={detail.status} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => void save()} disabled={locked || !dirty || draft.expectedVersion !== detail.version} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 text-xs font-bold text-white disabled:opacity-40 dark:bg-white dark:text-stone-950"><Save size={15} />{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</button>
                  {detail.deletedAt ? <button type="button" disabled={saving} className="min-h-11 rounded-xl border px-4 text-xs font-bold" onClick={() => void save('restore')}>Restaurer la demande</button> : <button type="button" disabled={locked} className="min-h-11 rounded-xl border px-4 text-xs font-bold text-red-700 dark:text-red-300" onClick={() => trashDialog.current.showModal()}>Supprimer</button>}
                  {dirty && <span className={`text-xs ${muted}`}>Modifications non enregistrées</span>}
                </div>
                <p role="status" className="mt-2 text-xs leading-5">{saveMessage}</p>
                {detail.deletedAt && <p className="mt-2 text-sm">Dans la corbeille. Le dossier et ses photos sont conservés jusqu’à restauration.</p>}
              </header>

              <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_250px]">
                <div className="min-w-0 space-y-5">
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
                      <span className={`text-[11px] ${muted}`}>{detail.photoCount || 0} fichier{detail.photoCount > 1 ? 's' : ''}</span>
                    </div>
                    {detail.photos?.length ? (
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {detail.photos.map((photo) => photo.url ? (
                          <button type="button" key={photo.photoId} onClick={() => { setOpenedPhoto(photo); photoDialog.current.showModal(); }} className={`group relative aspect-square overflow-hidden rounded-xl border ${darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-100'}`}>
                            <Image src={photo.url} alt={`Photo du meuble — ${photo.originalName || 'vue client'}`} fill sizes="(max-width: 640px) 50vw, 220px" unoptimized onError={() => setDetail(current => current?.quoteId === detail.quoteId ? { ...current, photos: current.photos.map(item => item.photoId === photo.photoId ? { ...item, url: null } : item) } : current)} className="object-cover transition duration-300 motion-reduce:transition-none group-hover:scale-[1.02]" />
                            <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/60 px-2 py-1 text-center text-[9px] font-bold text-white backdrop-blur-sm">Ouvrir</span>
                          </button>
                        ) : (
                          <div key={photo.photoId} className={`grid aspect-square place-items-center rounded-xl border border-dashed px-3 text-center text-[10px] ${darkMode ? 'border-white/10 text-stone-500' : 'border-stone-300 text-stone-500'}`}>
                            <button type="button" className="min-h-11" onClick={() => setDetailRefreshKey(key => key + 1)}>Photo indisponible · Réessayer</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`mt-3 flex min-h-28 items-center justify-center gap-2 rounded-xl border border-dashed text-xs ${darkMode ? 'border-white/10 text-stone-500' : 'border-stone-300 text-stone-500'}`}>
                        <ImageIcon size={17} /> {detail.photoCount ? 'Chargement des photos…' : 'Aucune photo transmise'}
                      </div>
                    )}
                  </section>
                  <QuoteProposalEditor key={detail.quoteId} detail={detail} proposal={draft.proposal} onChange={proposal => setDraft(current => ({ ...current, proposal }))} onAction={save} dirty={dirty} saving={saving} field={field} />
                </div>

                <fieldset disabled={locked} className="min-w-0 space-y-4">
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
                          : detail.confirmationEmail?.status === 'delivery_unknown' ? 'Résultat de l’envoi à vérifier'
                          : detail.confirmationEmail?.status === 'sending' ? 'Envoi en cours'
                            : 'En attente d’envoi'}
                    </p>
                    <p className={`mt-1 text-[11px] leading-5 ${muted}`}>La demande reste enregistrée, quel que soit l’état de cet e-mail.</p>
                  </section>

                  <section>
                    <label className="block text-[11px] font-black uppercase tracking-[0.14em]" htmlFor="quote-status">Statut de suivi</label>
                    <select id="quote-status" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} className={`mt-2 min-h-11 w-full rounded-xl border px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/30 ${field}`}>
                      {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value} disabled={value === 'proposal_sent' || (value === 'accepted' && detail.proposalEmail?.status !== 'sent')}>{label}</option>)}
                    </select>
                    <p className={`mt-2 text-xs leading-5 ${muted}`}>L’envoi renseigne le statut automatiquement. Consignez « Accord client » après sa réponse, puis « Terminé » à la clôture du projet.</p>
                  </section>

                  <section>
                    <label className="block text-[11px] font-black uppercase tracking-[0.14em]" htmlFor="quote-notes">Notes internes</label>
                    <textarea id="quote-notes" rows={3} maxLength={4000} value={draft.internalNotes} onChange={(event) => setDraft((current) => ({ ...current, internalNotes: event.target.value }))} placeholder="Informations internes, jamais envoyées au client…" className={`mt-2 w-full resize-y rounded-xl border p-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-amber-500/30 ${field}`} />
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span aria-live="polite" className={`text-[10px] ${saveMessage.includes('enregistrées') ? 'text-emerald-600 dark:text-emerald-300' : muted}`}>{saveMessage}</span>
                      <span className={`text-[10px] tabular-nums ${muted}`}>{draft.internalNotes.length}/4000</span>
                    </div>
                  </section>

                  {draft.expectedVersion !== detail.version && <div role="alert" className="space-y-2 text-sm"><p>Une autre version est disponible. Notes reçues : {detail.internalNotes || 'Aucune note'}</p><button type="button" onClick={() => setDraft((current) => ({ ...current, expectedVersion: detail.version }))}>Conserver ma saisie après comparaison avec cette version</button></div>}
                </fieldset>
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
      <dialog ref={trashDialog} className="m-auto w-[min(440px,calc(100%-2rem))] rounded-2xl bg-white p-6 text-stone-900 backdrop:bg-black/50 dark:bg-stone-900 dark:text-white">
        <h3 className="text-lg font-bold">Supprimer cette demande ?</h3><p className="my-4 text-sm leading-6">{detail?.requestNumber} sera déplacée dans la corbeille. Vous pourrez la restaurer avec ses photos et sa proposition. Les modifications non enregistrées seront abandonnées.</p>
        <div className="flex flex-wrap justify-end gap-3"><button type="button" className="min-h-11 rounded-xl border px-4" onClick={() => trashDialog.current.close()}>Annuler</button><button type="button" disabled={saving} className="min-h-11 rounded-xl bg-red-700 px-4 text-white" onClick={() => { trashDialog.current.close(); void save('trash'); }}>Mettre à la corbeille</button></div>
      </dialog>
      <dialog ref={photoDialog} onClose={() => setOpenedPhoto(null)} className="m-auto max-h-[90dvh] w-[min(1000px,calc(100%-2rem))] overflow-auto rounded-2xl bg-white p-4 text-stone-900 backdrop:bg-black/70 dark:bg-stone-900 dark:text-white">
        <button type="button" className="mb-3 min-h-11 rounded-xl border px-4" onClick={() => photoDialog.current.close()}>Fermer la photo</button>
        {openedPhoto && <Image src={openedPhoto.url} alt={openedPhoto.originalName || 'Photo du meuble'} width={openedPhoto.width || 1200} height={openedPhoto.height || 1200} unoptimized className="h-auto max-h-[70dvh] w-full object-contain" />}
      </dialog>
    </div>
  );
}
