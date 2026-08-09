'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

const SEEN_STORAGE_KEY = 'sv:support-chat-seen:v1';
const HIDDEN_PATHS = ['/a-propos'];
const HIDDEN_PATH_PREFIXES = ['/admin', '/checkout', '/payer'];
const MOBILE_HIDDEN_PATH_PREFIXES = ['/produit/', '/devis'];

const LauncherWhatsAppIcon = ({ size = 24, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.87 9.87 0 0 0 4.74 1.21h.01c5.45 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.83 9.83 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.73-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
  </svg>
);

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
  const hiddenOnMobile = MOBILE_HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
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

  if (
    HIDDEN_PATHS.includes(pathname)
    || HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) return null;

  return (
    <div className={hiddenOnMobile ? 'hidden lg:contents' : 'contents'}>
      {Panel && open ? <Panel open onClose={closeChat} /> : null}
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
        <span className="relative flex h-6 w-6 items-center justify-center">
          <LauncherWhatsAppIcon
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
    </div>
  );
}
