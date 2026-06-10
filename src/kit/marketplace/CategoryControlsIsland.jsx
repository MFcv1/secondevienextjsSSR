"use client";

import React from 'react';

const setBodyLocked = (locked) => {
  if (typeof document === 'undefined') return;

  if (!locked) {
    const scrollY = Number(document.body.dataset.categoryFilterScrollY || '0') || 0;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overscrollBehavior = '';
    document.documentElement.style.overscrollBehavior = '';
    delete document.body.dataset.categoryFilterScrollY;
    if (scrollY) window.scrollTo(0, scrollY);
    return;
  }

  const scrollY = window.scrollY || 0;
  document.body.dataset.categoryFilterScrollY = String(scrollY);
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.overscrollBehavior = 'none';
  document.documentElement.style.overscrollBehavior = 'none';
};

const setDrawerOpen = (root, open) => {
  const overlay = root.querySelector('[data-category-filter-overlay]');
  const drawer = root.querySelector('[data-category-filter-drawer]');
  if (!overlay || !drawer) return;

  overlay.classList.toggle('pointer-events-auto', open);
  overlay.classList.toggle('opacity-100', open);
  overlay.classList.toggle('pointer-events-none', !open);
  overlay.classList.toggle('opacity-0', !open);

  drawer.classList.toggle('pointer-events-auto', open);
  drawer.classList.toggle('translate-y-0', open);
  drawer.classList.toggle('pointer-events-none', !open);
  drawer.classList.toggle('translate-y-full', !open);
  drawer.setAttribute('aria-hidden', open ? 'false' : 'true');

  setBodyLocked(open);
};

const setSortOpen = (root, open) => {
  const menu = root.querySelector('[data-category-sort-menu]');
  const blocker = root.querySelector('[data-category-sort-blocker]');
  const icon = root.querySelector('[data-category-sort-icon]');
  if (!menu || !blocker) return;

  menu.hidden = !open;
  blocker.hidden = !open;
  icon?.classList.toggle('rotate-180', open);
};

export default function CategoryControlsIsland({ children }) {
  const rootRef = React.useRef(null);

  React.useEffect(() => () => setBodyLocked(false), []);

  const handleClick = React.useCallback((event) => {
    const root = rootRef.current;
    if (!root) return;

    if (event.target.closest('[data-category-open-filters]')) {
      event.preventDefault();
      setDrawerOpen(root, true);
      return;
    }

    if (event.target.closest('[data-category-close-filters]')) {
      event.preventDefault();
      setDrawerOpen(root, false);
      return;
    }

    if (event.target.closest('[data-category-sort-button]')) {
      event.preventDefault();
      const menu = root.querySelector('[data-category-sort-menu]');
      setSortOpen(root, Boolean(menu?.hidden));
      return;
    }

    if (event.target.closest('[data-category-close-sort]')) {
      setSortOpen(root, false);
    }
  }, []);

  const handleChange = React.useCallback((event) => {
    const form = event.target.closest('form[data-category-filter-form]');
    if (!form) return;
    if (event.target.matches('[data-category-range]')) return;
    window.clearTimeout(form._categorySubmitTimer);
    form._categorySubmitTimer = window.setTimeout(() => form.requestSubmit(), 120);
  }, []);

  const handleInput = React.useCallback((event) => {
    const form = event.target.closest('form[data-category-filter-form]');
    if (!form || !event.target.matches('[data-category-range]')) return;
    window.clearTimeout(form._categorySubmitTimer);
    form._categorySubmitTimer = window.setTimeout(() => form.requestSubmit(), 300);
  }, []);

  return (
    <div ref={rootRef} onClick={handleClick} onChange={handleChange} onInput={handleInput}>
      {children}
    </div>
  );
}
