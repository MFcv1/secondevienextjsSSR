'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

const LINKS = [
  { href: '/galerie', label: 'Galerie' },
  { href: '/a-propos', label: 'Atelier' },
  { href: '/devis', label: 'Restauration' },
];

/**
 * MobileNavIsland — hamburger button (lives inside the nav pill) + full-screen
 * overlay menu. Desktop hides the burger via CSS; mobile hides the inline nav
 * links and shows the burger instead.
 */
export default function MobileNavIsland() {
  const [open, setOpen] = useState(false);
  // Portal target: the .sv4 root (holds the design tokens, has no transform so
  // a fixed overlay resolves against the viewport — unlike the nav pill).
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.querySelector('.sv4') || document.body);
  }, []);

  // Lock body scroll + close on Escape while the menu is open
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="sv4-nav__burger"
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={open}
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sv4-nav__burger-lines" aria-hidden="true">
          <span />
          <span />
        </span>
      </button>

      {portalTarget
        ? createPortal(
            <div
              className="sv4-mobile-menu"
              data-open={open ? 'true' : 'false'}
              aria-hidden={open ? 'false' : 'true'}
              onClick={() => setOpen(false)}
            >
              <nav className="sv4-mobile-menu__inner" onClick={(e) => e.stopPropagation()}>
                <ul className="sv4-mobile-menu__list">
                  {LINKS.map((link, i) => (
                    <li key={link.href} style={{ '--mm-i': i }}>
                      <Link href={link.href} onClick={() => setOpen(false)}>
                        <span className="sv4-mobile-menu__num">{String(i + 1).padStart(2, '0')}</span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/galerie"
                  className="sv4-mobile-menu__cta"
                  onClick={() => setOpen(false)}
                >
                  Voir le catalogue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </nav>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
