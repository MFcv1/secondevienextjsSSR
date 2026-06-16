"use client";

import React from 'react';
import {
  CATEGORY_SORT_OPTIONS,
  buildCategoryHref,
  filterAndSortCategoryItems,
  getCategoryQueryState,
  hasActiveCategoryFilters,
} from './categoryViewModel';

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

const resetFilterPatch = (state) => ({
  selectedMaterials: [],
  selectedStyles: [],
  selectedCollections: [],
  availabilityFilter: 'all',
  priceRange: [0, state.roundedMaxPrice],
  searchQuery: '',
});

const formatProductCount = (count) => `${count} produit${count !== 1 ? 's' : ''}`;

const setHiddenInput = (form, name, value, defaultValue = '') => {
  let input = form.querySelector(`input[type="hidden"][name="${name}"]`);
  const shouldKeep = value !== undefined && value !== null && String(value) !== '' && String(value) !== String(defaultValue);

  if (!shouldKeep) {
    input?.remove();
    return;
  }

  if (!input) {
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    form.prepend(input);
  }

  input.value = String(value);
};

const syncFormState = (form, state) => {
  setHiddenInput(form, 'sort', state.sortBy, 'newest');
  setHiddenInput(form, 'view', state.viewMode, 'grid');
  setHiddenInput(form, 'mobileView', state.mobileViewMode, 'list');
  setHiddenInput(form, 'q', state.searchQuery, '');

  form.querySelectorAll('input[name="collection"]').forEach((input) => {
    input.checked = state.selectedCollections.includes(input.value);
  });
  form.querySelectorAll('input[name="material"]').forEach((input) => {
    input.checked = state.selectedMaterials.includes(input.value);
  });
  form.querySelectorAll('input[name="style"]').forEach((input) => {
    input.checked = state.selectedStyles.includes(input.value);
  });
  form.querySelectorAll('input[name="availability"]').forEach((input) => {
    input.checked = state.availabilityFilter === input.value;
  });
  form.querySelectorAll('input[name="maxPrice"]').forEach((input) => {
    input.value = String(state.priceRange[1] || state.roundedMaxPrice);
  });
};

const stateFromForm = (form, filterOptions) => (
  getCategoryQueryState(new URLSearchParams(new FormData(form)), filterOptions)
);

export default function CategoryControlsIsland({
  categoryId,
  items = [],
  filterOptions = {},
  children,
}) {
  const rootRef = React.useRef(null);

  React.useEffect(() => () => setBodyLocked(false), []);

  const applyState = React.useCallback((state, { push = false } = {}) => {
    const root = rootRef.current;
    if (!root) return;

    const filteredItems = filterAndSortCategoryItems(items, state, filterOptions.maxPrice);
    const visibleOrder = new Map(filteredItems.map((item, index) => [String(item.id), index]));
    const hasActiveFilters = hasActiveCategoryFilters(state, filterOptions.maxPrice);
    const categoryHref = buildCategoryHref(categoryId, state);
    const resetHref = buildCategoryHref(categoryId, state, resetFilterPatch(state));
    const sortLabel = CATEGORY_SORT_OPTIONS.find((option) => option.id === state.sortBy)?.label || CATEGORY_SORT_OPTIONS[0].label;

    root.querySelectorAll('[data-category-product]').forEach((node) => {
      const order = visibleOrder.get(String(node.getAttribute('data-category-product')));
      const visible = order !== undefined;
      node.hidden = !visible;
      node.style.order = visible ? String(order) : '';
    });

    root.querySelectorAll('[data-category-mobile-view]').forEach((node) => {
      node.hidden = node.getAttribute('data-category-mobile-view') !== state.mobileViewMode;
    });

    root.querySelectorAll('[data-category-desktop-view]').forEach((node) => {
      node.hidden = node.getAttribute('data-category-desktop-view') !== state.viewMode;
    });

    const emptyState = root.querySelector('[data-category-empty-state]');
    const productViews = root.querySelector('[data-category-product-views]');
    if (emptyState) emptyState.hidden = filteredItems.length !== 0;
    if (productViews) productViews.hidden = filteredItems.length === 0;

    root.querySelectorAll('[data-category-result-count]').forEach((node) => {
      node.textContent = formatProductCount(filteredItems.length);
    });
    root.querySelectorAll('[data-category-filtered-count]').forEach((node) => {
      node.textContent = String(filteredItems.length);
    });
    root.querySelectorAll('[data-category-sort-label]').forEach((node) => {
      node.textContent = sortLabel;
    });
    root.querySelectorAll('[data-category-active-indicator]').forEach((node) => {
      node.hidden = !hasActiveFilters;
    });
    root.querySelectorAll('[data-category-reset-link]').forEach((node) => {
      node.href = resetHref;
      node.hidden = !hasActiveFilters;
    });
    root.querySelectorAll('[data-category-sort-option]').forEach((node) => {
      node.href = buildCategoryHref(categoryId, state, { sortBy: node.getAttribute('data-category-sort-option') });
      node.setAttribute('aria-current', state.sortBy === node.getAttribute('data-category-sort-option') ? 'true' : 'false');
    });
    root.querySelectorAll('[data-category-view-link="desktop"]').forEach((node) => {
      node.href = buildCategoryHref(categoryId, state, { viewMode: node.getAttribute('data-category-view-value') });
      node.setAttribute('aria-current', state.viewMode === node.getAttribute('data-category-view-value') ? 'true' : 'false');
    });
    root.querySelectorAll('[data-category-view-link="mobile"]').forEach((node) => {
      node.href = buildCategoryHref(categoryId, state, { mobileViewMode: node.getAttribute('data-category-view-value') });
      node.setAttribute('aria-current', state.mobileViewMode === node.getAttribute('data-category-view-value') ? 'true' : 'false');
    });

    root.querySelectorAll('form[data-category-filter-form]').forEach((form) => syncFormState(form, state));

    if (push && typeof window !== 'undefined') {
      const currentHref = `${window.location.pathname}${window.location.search || ''}`;
      if (categoryHref !== currentHref) {
        window.history.pushState(null, '', categoryHref);
      }
    }
  }, [categoryId, filterOptions, items]);

  React.useEffect(() => {
    const readWindowState = () => getCategoryQueryState(new URLSearchParams(window.location.search), filterOptions);
    applyState(readWindowState());

    const handlePopState = () => applyState(readWindowState());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [applyState, filterOptions]);

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
      return;
    }

    const categoryLink = event.target.closest('a[href]');
    if (categoryLink) {
      const targetUrl = new URL(categoryLink.href, window.location.href);
      if (targetUrl.pathname === window.location.pathname) {
        event.preventDefault();
        setSortOpen(root, false);
        applyState(getCategoryQueryState(targetUrl.searchParams, filterOptions), { push: true });
      }
    }
  }, [applyState, filterOptions]);

  const handleChange = React.useCallback((event) => {
    const form = event.target.closest('form[data-category-filter-form]');
    if (!form) return;
    if (event.target.matches('[data-category-range]')) return;
    window.clearTimeout(form._categorySubmitTimer);
    form._categorySubmitTimer = window.setTimeout(() => {
      applyState(stateFromForm(form, filterOptions), { push: true });
    }, 120);
  }, [applyState, filterOptions]);

  const handleInput = React.useCallback((event) => {
    const form = event.target.closest('form[data-category-filter-form]');
    if (!form || !event.target.matches('[data-category-range]')) return;
    window.clearTimeout(form._categorySubmitTimer);
    form._categorySubmitTimer = window.setTimeout(() => {
      applyState(stateFromForm(form, filterOptions), { push: true });
    }, 300);
  }, [applyState, filterOptions]);

  const handleSubmit = React.useCallback((event) => {
    const form = event.target.closest('form[data-category-filter-form]');
    if (!form) return;
    event.preventDefault();
    applyState(stateFromForm(form, filterOptions), { push: true });
    if (rootRef.current) setDrawerOpen(rootRef.current, false);
  }, [applyState, filterOptions]);

  return (
    <div ref={rootRef} onClick={handleClick} onChange={handleChange} onInput={handleInput} onSubmit={handleSubmit}>
      {children}
    </div>
  );
}
