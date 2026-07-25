'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Galerie' },
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
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  // Portal target: the .sv4 root (holds the design tokens, has no transform so
  // a fixed overlay resolves against the viewport — unlike the nav pill).
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.querySelector('[data-sv4-shell]') || document.querySelector('.sv4') || document.body);
  }, []);

  // Lock the document viewport, trap focus and restore both on close.
  useEffect(() => {
    if (!open) return undefined;
    const body = document.body;
    const root = document.documentElement;
    const trigger = triggerRef.current;
    const scrollY = window.scrollY;
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      rootOverflow: root.style.overflow,
      rootOverscrollBehavior: root.style.overscrollBehavior,
    };

    root.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    const focusable = Array.from(
      menuRef.current?.querySelectorAll('a[href], button:not([disabled]):not([tabindex="-1"])') || [],
    );
    const focusFrame = window.requestAnimationFrame(() => focusable[0]?.focus({ preventScroll: true }));

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab' || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      root.style.overflow = previous.rootOverflow;
      root.style.overscrollBehavior = previous.rootOverscrollBehavior;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.bodyOverscrollBehavior;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.width = previous.bodyWidth;
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', onKey);
      window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
      trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
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
              ref={menuRef}
              className="sv4-mobile-menu"
              data-open={open ? 'true' : 'false'}
              aria-hidden={open ? 'false' : 'true'}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation principale"
            >
              <button
                type="button"
                className="sv4-mobile-menu__backdrop"
                aria-label="Fermer le menu"
                tabIndex={-1}
                onClick={() => setOpen(false)}
              />
              <nav className="sv4-mobile-menu__inner">
                <div className="sv4-mobile-menu__intro">
                  <span>L&apos;atelier Seconde Vie</span>
                  <p>Chiner. Restaurer.<br />Sublimer.</p>
                </div>

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
                  href="/"
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
