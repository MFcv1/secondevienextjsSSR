'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'darkMode';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export default function DarkModeToggleIsland({ className = '' } = {}) {
  const [isDark, setIsDark] = useState(false);

  const syncDocumentTheme = (nextDark) => {
    document.documentElement.classList.toggle('dark', nextDark);
    document.documentElement.dataset.svTheme = nextDark ? 'dark' : 'light';
  };

  const persistTheme = (nextDark) => {
    window.localStorage.setItem(STORAGE_KEY, String(nextDark));
    document.cookie = `${STORAGE_KEY}=${String(nextDark)}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${STORAGE_KEY}=([^;]*)`));
    const nextDark = (stored ?? decodeURIComponent(cookieMatch?.[1] || '')) === 'true';
    syncDocumentTheme(nextDark);
    persistTheme(nextDark);
    setIsDark(nextDark);
  }, []);

  const toggle = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    persistTheme(nextDark);
    syncDocumentTheme(nextDark);
    window.dispatchEvent(new CustomEvent('sv:theme-change', { detail: { darkMode: nextDark } }));
    window.setTimeout(() => window.location.reload(), 80);
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
