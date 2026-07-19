'use client';

import Link from 'next/link';
import { ChevronLeft, X } from 'lucide-react';

export default function AdminSidebar({
  activeTabId,
  darkMode,
  groups,
  isOpen,
  onClose,
  onSelect,
  tabs,
}) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Fermer la navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-stone-950/30 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        aria-label="Navigation de l'administration"
        className={`fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col border-r transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${darkMode ? 'border-white/10 bg-[#111111]' : 'border-stone-200 bg-[#F7F5F1]'}`}
      >
        <div className={`flex h-20 items-center justify-between border-b px-6 ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
          <div>
            <p className={`text-[9px] font-black uppercase tracking-[0.28em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Seconde Vie</p>
            <p className="mt-1 text-lg font-black tracking-[-0.04em]">Gestion boutique</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`grid h-9 w-9 place-items-center rounded-xl transition lg:hidden ${darkMode ? 'text-stone-400 hover:bg-white/10 hover:text-white' : 'text-stone-500 hover:bg-stone-200/70 hover:text-stone-950'}`}
            aria-label="Fermer la navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
          {groups.map((group) => (
            <section key={group.label} aria-labelledby={`admin-nav-${group.tabs[0]}`}>
              <h2
                id={`admin-nav-${group.tabs[0]}`}
                className={`mb-2 px-3 text-[9px] font-black uppercase tracking-[0.22em] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}
              >
                {group.label}
              </h2>
              <div className="space-y-1">
                {group.tabs.map((tabId) => {
                  const tab = tabs.find((item) => item.id === tabId);
                  if (!tab) return null;
                  const Icon = tab.icon;
                  const isActive = activeTabId === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onSelect(tab.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[11px] font-bold tracking-wide transition duration-200 active:translate-y-px ${isActive ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white') : (darkMode ? 'text-stone-400 hover:bg-white/5 hover:text-white' : 'text-stone-600 hover:bg-white hover:text-stone-950')}`}
                    >
                      <Icon size={16} strokeWidth={1.8} className={`shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:translate-x-0.5'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className={`border-t p-4 ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
          <Link
            href="/"
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] transition ${darkMode ? 'text-stone-400 hover:bg-white/5 hover:text-white' : 'text-stone-600 hover:bg-white hover:text-stone-950'}`}
          >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Retour au site
          </Link>
        </div>
      </aside>
    </>
  );
}
