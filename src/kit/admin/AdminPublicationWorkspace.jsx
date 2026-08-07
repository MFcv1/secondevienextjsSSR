'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, ExternalLink, Eye, Plus, Sparkles, X } from 'lucide-react';
import AdminForm from './AdminForm';
import AdminItemList from './AdminItemList';

const VIEWS = [
  { id: 'create', label: 'Créer', Icon: Plus },
  { id: 'history', label: 'Publications', Icon: BookOpen },
];

const PUBLICATION_HANDOFF_KEY = 'secondevie:admin-publication-handoff:v1';
const PUBLICATION_HANDOFF_TTL_MS = 10 * 60 * 1000;
const SUCCESS_NOTICE_DURATION_MS = 10000;

const readPublicationHandoff = () => {
  if (typeof window === 'undefined') return null;
  try {
    const handoff = JSON.parse(window.sessionStorage.getItem(PUBLICATION_HANDOFF_KEY) || 'null');
    if (!handoff?.productId || Date.now() - Number(handoff.savedAt || 0) > PUBLICATION_HANDOFF_TTL_MS) {
      window.sessionStorage.removeItem(PUBLICATION_HANDOFF_KEY);
      return null;
    }
    return handoff;
  } catch {
    return null;
  }
};

const savePublicationHandoff = (savedProduct) => {
  if (typeof window === 'undefined') return null;
  const handoff = {
    productId: savedProduct.productId,
    name: String(savedProduct.name || 'Le meuble'),
    savedAt: Date.now(),
  };
  try {
    window.sessionStorage.setItem(PUBLICATION_HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    // Le changement de vue courant reste fonctionnel si sessionStorage est indisponible.
  }
  return handoff;
};

export default function AdminPublicationWorkspace({
  collectionName,
  darkMode,
  editData,
  onCancelEdit,
  onDelete,
  onEdit,
  onMarkAsAvailable,
  onMarkAsSold,
  onToggleStatus,
  mutationsBlocked = false,
}) {
  const [view, setView] = React.useState('create');
  const [publicationBusy, setPublicationBusy] = React.useState(false);
  const [recentProductId, setRecentProductId] = React.useState(null);
  const [successNotice, setSuccessNotice] = React.useState(null);
  const handleSaved = React.useCallback((savedProduct = {}) => {
    const handoff = savedProduct.productId ? savePublicationHandoff(savedProduct) : null;
    setRecentProductId(handoff?.productId || savedProduct.productId || null);
    setSuccessNotice(handoff);
    setView('history');
  }, []);

  React.useEffect(() => {
    const handoff = readPublicationHandoff();
    if (!handoff) return;
    setRecentProductId(handoff.productId);
    setView('history');
    if (Date.now() - handoff.savedAt < SUCCESS_NOTICE_DURATION_MS) setSuccessNotice(handoff);
  }, []);

  React.useEffect(() => {
    if (!successNotice) return undefined;
    const remaining = Math.max(0, SUCCESS_NOTICE_DURATION_MS - (Date.now() - successNotice.savedAt));
    if (remaining === 0) {
      setSuccessNotice(null);
      return undefined;
    }
    const timer = window.setTimeout(() => setSuccessNotice(null), remaining);
    return () => window.clearTimeout(timer);
  }, [successNotice]);

  React.useEffect(() => {
    if (editData) setView('create');
  }, [editData]);

  const selectView = (nextView) => {
    if (publicationBusy) return;
    setView(nextView);
    setSuccessNotice(null);
    if (nextView === 'create') {
      setRecentProductId(null);
      try { window.sessionStorage.removeItem(PUBLICATION_HANDOFF_KEY); } catch { /* noop */ }
    }
    if (nextView === 'history' && editData) onCancelEdit();
  };

  return (
    <section className="flex min-h-0 w-full max-w-full flex-col xl:h-full" aria-label="Espace publication">
      <div className="mb-5 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between xl:mb-6">
        <div className={`inline-flex w-full rounded-[20px] p-1.5 sm:w-[440px] ${darkMode ? 'bg-white/[0.055]' : 'bg-stone-200/65'}`}>
          {VIEWS.map(({ id, label, Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                disabled={publicationBusy && id !== view}
                onClick={() => selectView(id)}
                className={`group flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[15px] text-[12px] font-extrabold transition-colors duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 ${active ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white') : (darkMode ? 'text-stone-500 hover:text-white' : 'text-stone-500 hover:text-stone-950')}`}
                aria-pressed={active}
              >
                <Icon size={16} strokeWidth={1.6} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <span className={`hidden items-center gap-2 text-[11px] font-semibold lg:flex ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            <Sparkles size={13} strokeWidth={1.5} />
            {view === 'create' ? 'Composition guidée' : 'Catalogue en temps réel'}
          </span>
          <Link
            href="/"
            aria-disabled={publicationBusy}
            tabIndex={publicationBusy ? -1 : undefined}
            onClick={(event) => { if (publicationBusy) event.preventDefault(); }}
            className={`group inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-[11px] font-extrabold transition-colors duration-200 active:scale-[0.99] ${publicationBusy ? 'cursor-not-allowed opacity-45' : ''} ${darkMode ? 'border-white/10 text-stone-200 hover:bg-white/[0.06]' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-stone-950'}`}
          >
            <Eye size={14} strokeWidth={1.5} />
            Aperçu public
          </Link>
        </div>
      </div>

      {view === 'history' && successNotice ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[80] w-[min(420px,calc(100vw-2rem))] sm:right-6 sm:top-6" role="status" aria-live="polite">
          <div className={`pointer-events-auto rounded-[20px] border p-4 shadow-[0_24px_70px_rgba(28,25,23,0.22)] ${darkMode ? 'border-emerald-400/20 bg-[#171714] text-white' : 'border-emerald-200 bg-white text-stone-950'}`}>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 size={19} strokeWidth={2.3} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-extrabold">Publication réussie</p>
                <p className={`mt-1 text-[11px] leading-5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                  <span className="font-bold">{successNotice.name}</span> est public et confirmé dans la galerie Nouveautés.
                </p>
                <Link href="/#gallery-pieces" target="_blank" className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full bg-stone-950 px-4 text-[10px] font-extrabold text-white transition-colors duration-200 hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200">
                  Voir dans la galerie
                  <ExternalLink size={12} strokeWidth={1.8} />
                </Link>
              </div>
              <button type="button" onClick={() => setSuccessNotice(null)} aria-label="Fermer la confirmation" className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors duration-200 ${darkMode ? 'text-stone-500 hover:bg-white/[0.07] hover:text-white' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-950'}`}>
                <X size={15} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        {view === 'create' ? (
          <AdminForm
            editData={editData}
            onCancelEdit={onCancelEdit}
            onSaved={handleSaved}
            onPublicationBusyChange={setPublicationBusy}
            collectionName={collectionName}
            darkMode={darkMode}
            mutationsBlocked={mutationsBlocked}
          />
        ) : (
          <AdminItemList
            collectionName={collectionName}
            darkMode={darkMode}
            highlightProductId={recentProductId}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
            onMarkAsSold={onMarkAsSold}
            onMarkAsAvailable={onMarkAsAvailable}
          />
        )}
      </div>
    </section>
  );
}
