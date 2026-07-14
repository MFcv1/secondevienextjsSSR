'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';

const SEEN_STORAGE_KEY = 'sv:support-chat-seen:v1';
const HIDDEN_PATH_PREFIXES = ['/admin', '/checkout'];

let panelPromise = null;

const loadPanel = () => {
  if (!panelPromise) {
    panelPromise = import('./SupportChatPanel')
      .then((module) => module.default)
      .catch((error) => {
        panelPromise = null;
        throw error;
      });
  }
  return panelPromise;
};

export default function SupportChatLauncherIsland() {
  const pathname = usePathname() || '';
  const [Panel, setPanel] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [seen, setSeen] = React.useState(true);

  React.useEffect(() => {
    try {
      setSeen(window.localStorage.getItem(SEEN_STORAGE_KEY) === 'true');
    } catch {
      setSeen(true);
    }
  }, []);

  const warmPanel = React.useCallback(() => {
    loadPanel().then((Component) => setPanel(() => Component)).catch(() => {});
  }, []);

  const toggleChat = React.useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    setSeen(true);
    try {
      window.localStorage.setItem(SEEN_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage failures (private mode).
    }
    loadPanel()
      .then((Component) => {
        setPanel(() => Component);
        setOpen(true);
      })
      .catch((error) => console.error('Support chat lazy load error:', error));
  }, [open]);

  const closeChat = React.useCallback(() => setOpen(false), []);

  if (HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <>
      {Panel ? <Panel open={open} onClose={closeChat} /> : null}
      <button
        type="button"
        onClick={toggleChat}
        onPointerEnter={warmPanel}
        onPointerDown={warmPanel}
        onFocus={warmPanel}
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat d\'aide'}
        aria-expanded={open}
        className="group fixed bottom-[max(1.15rem,env(safe-area-inset-bottom,0px))] right-[max(1.1rem,env(safe-area-inset-right,0px))] z-[220] flex h-[52px] w-[52px] touch-manipulation items-center justify-center rounded-full bg-stone-900/90 text-white shadow-[0_18px_44px_-12px_rgba(28,25,23,0.55),inset_0_1px_0_rgba(255,255,255,0.14)] ring-1 ring-white/10 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.05] hover:bg-stone-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B58D]/60 dark:bg-white/[0.1] dark:text-stone-100 dark:shadow-[0_18px_44px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] dark:ring-white/[0.14] dark:hover:bg-white/[0.16]"
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <MessageCircle
            size={20}
            strokeWidth={1.6}
            className={`absolute transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
          />
          <X
            size={19}
            strokeWidth={1.6}
            className={`absolute transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`}
          />
        </span>
        {!seen && !open ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#D9B58D]/70 motion-safe:animate-ping" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-[#C89B6F] ring-2 ring-white dark:ring-[#0c0b0a]" />
          </span>
        ) : null}
      </button>
    </>
  );
}
