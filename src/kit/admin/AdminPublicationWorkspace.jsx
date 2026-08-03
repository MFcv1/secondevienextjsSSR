'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Eye, Plus, Sparkles } from 'lucide-react';
import AdminForm from './AdminForm';
import AdminItemList from './AdminItemList';

const VIEWS = [
  { id: 'create', label: 'Créer', Icon: Plus },
  { id: 'history', label: 'Publications', Icon: BookOpen },
];

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
}) {
  const [view, setView] = React.useState('create');

  React.useEffect(() => {
    if (editData) setView('create');
  }, [editData]);

  const selectView = (nextView) => {
    setView(nextView);
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
                onClick={() => selectView(id)}
                className={`group flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[15px] text-[12px] font-extrabold transition-colors duration-200 active:scale-[0.99] ${active ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white') : (darkMode ? 'text-stone-500 hover:text-white' : 'text-stone-500 hover:text-stone-950')}`}
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
            className={`group inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-[11px] font-extrabold transition-colors duration-200 active:scale-[0.99] ${darkMode ? 'border-white/10 text-stone-200 hover:bg-white/[0.06]' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-stone-950'}`}
          >
            <Eye size={14} strokeWidth={1.5} />
            Aperçu public
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {view === 'create' ? (
          <AdminForm
            editData={editData}
            onCancelEdit={onCancelEdit}
            onSaved={() => setView('history')}
            collectionName={collectionName}
            darkMode={darkMode}
            mutationsEnabled
          />
        ) : (
          <AdminItemList
            collectionName={collectionName}
            darkMode={darkMode}
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
