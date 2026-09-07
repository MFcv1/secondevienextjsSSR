'use client';

import { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'darkMode';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export default function DarkModeToggleIsland({ className = '' } = {}) {
  const [isDark, setIsDark] = useState(false);
  const transitionTimerRef = useRef(null);

  const syncDocumentTheme = (nextDark) => {
    document.documentElement.classList.toggle('dark', nextDark);
    document.documentElement.dataset.svTheme = nextDark ? 'dark' : 'light';
  };

  const persistTheme = (nextDark) => {
    try { window.localStorage.setItem(STORAGE_KEY, String(nextDark)); } catch { /* Storage is optional. */ }
    try { document.cookie = `${STORAGE_KEY}=${String(nextDark)}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`; } catch { /* Cookies may be blocked. */ }
  };

  useEffect(() => {
    let stored = null;
    let cookieValue = '';
    try { stored = window.localStorage.getItem(STORAGE_KEY); } catch { /* Use the rendered theme. */ }
    try { cookieValue = document.cookie.match(new RegExp(`(?:^|; )${STORAGE_KEY}=([^;]*)`))?.[1] || ''; } catch { /* Cookies are optional. */ }
    const preference = stored ?? cookieValue;
    const nextDark = preference ? preference === 'true' : document.documentElement.classList.contains('dark');
    syncDocumentTheme(nextDark);
    persistTheme(nextDark);
    setIsDark(nextDark);
    return () => {
      window.clearTimeout(transitionTimerRef.current);
      document.documentElement.classList.remove('theme-transitioning');
    };
  }, []);

  const toggle = () => {
    const nextDark = !isDark;
    document.documentElement.classList.add('theme-transitioning');
    setIsDark(nextDark);
    persistTheme(nextDark);
    syncDocumentTheme(nextDark);
    window.dispatchEvent(new CustomEvent('sv:theme-change', { detail: { darkMode: nextDark } }));
    window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 80);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      aria-pressed={isDark}
    >
      {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
    </button>
  );
}
