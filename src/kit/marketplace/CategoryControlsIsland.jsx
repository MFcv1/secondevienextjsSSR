"use client";

import React from 'react';
import {
  CATEGORY_SORT_OPTIONS,
  buildCategoryHref,
  filterAndSortCategoryItems,
  getCategoryQueryState,
  hasActiveCategoryFilters,
} from './categoryViewModel';
import { focusWithoutScroll, trapDialogTabKey } from '../ui/dialogFocus';

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
  drawer.toggleAttribute('inert', !open);
  root.querySelectorAll('[data-category-open-filters]').forEach((trigger) => {
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

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
    input.value = String(state.priceRange[1] ?? state.roundedMaxPrice);
  });
};

const stateFromForm = (form, filterOptions) => (
  getCategoryQueryState(new URLSearchParams(new FormData(form)), filterOptions)
);

// Animations des cartes lors du filtrage (FLIP) : les cartes qui sortent sont
// figées à leur place puis s'effacent, les restantes glissent vers leur nouvelle
// position, les nouvelles s'ouvrent depuis leur centre et la grille change de
// hauteur en douceur. Le déplacement passe par `translate`, appliqué avant
// `scale` : l'échelle d'apparition ne raccourcit donc pas le décalage FLIP
// (avec `transform`, une carte à 0.62 se retrouvait mal placée). La sortie
// anime `translate` sur une carte déjà retirée du ressort. Rien n'est relancé tant que la
// liste visible ne change pas : pendant un glissement du curseur, les
// animations en cours vont au bout au lieu de repartir à chaque image.
// Courbes et durées reprises de la bibliothèque photo VibeOS.
const CARD_FADE_ANIMATION = 'category-card-fade';
const CARD_FADE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const CARD_REVEAL_EASE = 'cubic-bezier(0.33, 1, 0.68, 1)';

// Déplacements et hauteur de grille suivent un ressort amorti : quand la liste
// change pendant un mouvement, la carte garde sa vitesse au lieu de repartir
// d'une courbe neuve, ce qui supprime les à-coups pendant un glissement.
const SPRING_STIFFNESS = 120;
const SPRING_DAMPING = 22;
const SPRING_REST_DISTANCE = 0.4;
const SPRING_REST_VELOCITY = 4;

const stepSpring = (spring, dt) => {
  const acceleration = -SPRING_STIFFNESS * spring.value - SPRING_DAMPING * spring.velocity;
  spring.velocity += acceleration * dt;
  spring.value += spring.velocity * dt;
  return Math.abs(spring.value) < SPRING_REST_DISTANCE && Math.abs(spring.velocity) < SPRING_REST_VELOCITY;
};

const getCategoryMotion = (root) => {
  if (!root._categoryMotion) {
    root._categoryMotion = { cards: new Map(), height: null, frame: 0, lastTime: 0 };
  }
  return root._categoryMotion;
};

const renderCategoryMotionFrame = (root, time) => {
  const motion = root._categoryMotion;
  const dt = motion.lastTime ? Math.min(Math.max((time - motion.lastTime) / 1000, 0), 1 / 30) : 0;
  motion.lastTime = time;

  motion.cards.forEach((spring, node) => {
    const restX = stepSpring(spring.x, dt);
    const restY = stepSpring(spring.y, dt);
    if ((restX && restY) || !node.isConnected) {
      node.style.translate = '';
      motion.cards.delete(node);
      return;
    }
    node.style.translate = `${spring.x.value}px ${spring.y.value}px`;
  });

  const list = root.querySelector('.category-product-list');
  if (motion.height && list) {
    if (stepSpring(motion.height, dt)) {
      list.style.height = '';
      motion.height = null;
    } else {
      list.style.height = `${Math.max(0, motion.height.target + motion.height.value)}px`;
    }
  }

  if (motion.cards.size || motion.height) {
    motion.frame = window.requestAnimationFrame((nextTime) => renderCategoryMotionFrame(root, nextTime));
  } else {
    motion.frame = 0;
    motion.lastTime = 0;
  }
};

const startCategoryMotion = (root) => {
  const motion = getCategoryMotion(root);
  if (motion.frame) return;
  motion.lastTime = 0;
  motion.frame = window.requestAnimationFrame((time) => renderCategoryMotionFrame(root, time));
};

const stopCategoryMotion = (root) => {
  const motion = root._categoryMotion;
  if (!motion) return;
  window.cancelAnimationFrame(motion.frame);
  motion.frame = 0;
  motion.lastTime = 0;
  motion.cards.forEach((_, node) => {
    node.style.translate = '';
  });
  motion.cards.clear();
  if (motion.height) {
    root.querySelector('.category-product-list')?.style.removeProperty('height');
    motion.height = null;
  }
};
const CARD_LEAVE_DURATION = 520;
const CARD_REVEAL_STEP = 70;
const CARD_REVEAL_MAX = 6;
const CARD_REVEAL_BURST = 90;
const PINNED_CARD_STYLES = ['position', 'top', 'left', 'width', 'height', 'margin', 'pointerEvents', 'zIndex'];

// Les apparitions arrivant à quelques millisecondes d'intervalle (glissement
// rapide du curseur) forment une même vague échelonnée.
const cardRevealBurst = { at: 0, count: 0 };

const prefersReducedMotion = () => (
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
);

const cancelAnimationById = (node, id) => {
  node.getAnimations?.().forEach((animation) => {
    if (animation.id === id) animation.cancel();
  });
};

const getRectCenter = (rect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

const readCardFadeState = (node) => {
  const style = window.getComputedStyle(node);
  const opacity = Number.parseFloat(style.opacity);
  const scale = Number.parseFloat(style.scale);
  return {
    opacity: Number.isFinite(opacity) ? opacity : 1,
    scale: Number.isFinite(scale) ? scale : 1,
  };
};

const unpinLeavingCard = (node) => {
  delete node.dataset.categoryLeaving;
  PINNED_CARD_STYLES.forEach((property) => {
    node.style[property] = '';
  });
};

// Les images `lazy` d'une carte masquée ne sont jamais chargées : sans cela,
// une carte révélée par le filtre s'ouvrirait vide avant que sa photo n'arrive.
const primeHiddenCardImages = (root) => {
  if (root.dataset.categoryImagesPrimed === 'true') return;
  root.dataset.categoryImagesPrimed = 'true';
  root.querySelectorAll('[data-category-product] img[loading="lazy"]').forEach((image) => {
    image.loading = 'eager';
  });
};

const getProductOrder = (visibleOrder, node) => visibleOrder.get(String(node.getAttribute('data-category-product')));

const getVisibilitySignature = (nodes, visibleOrder) => nodes
  .map((node) => getProductOrder(visibleOrder, node) ?? '-')
  .join(',');

const setProductVisibility = (root, visibleOrder, { animate = false } = {}) => {
  const nodes = [...root.querySelectorAll('[data-category-product]')];
  const list = root.querySelector('.category-product-list');
  const signature = getVisibilitySignature(nodes, visibleOrder);
  const canAnimate = animate
    && list
    && typeof list.animate === 'function'
    && list.getClientRects().length > 0
    && !prefersReducedMotion();

  if (canAnimate && root._categoryVisibilitySignature === signature) return;
  root._categoryVisibilitySignature = signature;

  if (!canAnimate) {
    stopCategoryMotion(root);
    nodes.forEach((node) => {
      const order = getProductOrder(visibleOrder, node);
      const visible = order !== undefined;
      cancelAnimationById(node, CARD_FADE_ANIMATION);
      unpinLeavingCard(node);
      node.hidden = !visible;
      node.style.order = visible ? String(order) : '';
    });
    return;
  }

  // First : positions visuelles actuelles, animations en cours comprises.
  const motion = getCategoryMotion(root);
  const listRect = list.getBoundingClientRect();
  const firstRects = new Map();
  nodes.forEach((node) => {
    if (node.hidden) return;
    firstRects.set(node, {
      rect: node.getBoundingClientRect(),
      width: node.offsetWidth,
      height: node.offsetHeight,
    });
  });

  const entering = [];
  const leaving = [];
  nodes.forEach((node) => {
    const order = getProductOrder(visibleOrder, node);
    const isLeaving = node.dataset.categoryLeaving === 'true';

    if (order !== undefined) {
      if (node.hidden) {
        entering.push({ node, from: null });
      } else if (isLeaving) {
        entering.push({ node, from: readCardFadeState(node) });
        cancelAnimationById(node, CARD_FADE_ANIMATION);
        unpinLeavingCard(node);
      }
      node.hidden = false;
      node.style.order = String(order);
    } else if (!node.hidden && !isLeaving) {
      leaving.push({ node, from: readCardFadeState(node) });
    }
  });

  leaving.forEach(({ node, from }) => {
    const { rect, width, height } = firstRects.get(node);
    const center = getRectCenter(rect);
    motion.cards.delete(node);
    node.style.translate = '';
    cancelAnimationById(node, CARD_FADE_ANIMATION);
    node.dataset.categoryLeaving = 'true';
    Object.assign(node.style, {
      position: 'absolute',
      top: `${center.y - listRect.top - height / 2}px`,
      left: `${center.x - listRect.left - width / 2}px`,
      width: `${width}px`,
      height: `${height}px`,
      margin: '0',
      pointerEvents: 'none',
      zIndex: '0',
    });

    const animation = node.animate([
      { opacity: from.opacity, scale: String(from.scale), translate: '0 0' },
      { opacity: 0, scale: String(Math.min(from.scale, 0.93)), translate: '0 14px' },
    ], { duration: CARD_LEAVE_DURATION, easing: CARD_FADE_EASE, fill: 'forwards' });
    animation.id = CARD_FADE_ANIMATION;
    animation.onfinish = () => {
      if (node.dataset.categoryLeaving !== 'true') return;
      node.hidden = true;
      node.style.order = '';
      unpinLeavingCard(node);
      animation.cancel();
    };
  });

  // La grille suit la nouvelle mise en page sans que le bas de page ne saute.
  const firstListHeight = listRect.height;
  list.style.height = '';
  const lastListHeight = list.getBoundingClientRect().height;
  if (Math.abs(firstListHeight - lastListHeight) > 1) {
    motion.height = {
      target: lastListHeight,
      value: firstListHeight - lastListHeight,
      velocity: motion.height?.velocity ?? 0,
    };
    list.style.height = `${firstListHeight}px`;
  } else {
    motion.height = null;
  }

  // Last + Invert : les cartes restées visibles repartent de leur position
  // visuelle actuelle en gardant la vitesse de leur ressort (centres comparés
  // pour ignorer l'échelle d'apparition en cours). Lectures puis écritures.
  const movers = [...firstRects.keys()]
    .filter((node) => !node.hidden && node.dataset.categoryLeaving !== 'true')
    .map((node) => ({ node, last: getRectCenter(node.getBoundingClientRect()) }));
  movers.forEach(({ node, last }) => {
    const spring = motion.cards.get(node);
    const first = getRectCenter(firstRects.get(node).rect);
    const dx = first.x - (last.x - (spring?.x.value ?? 0));
    const dy = first.y - (last.y - (spring?.y.value ?? 0));
    if (!spring && Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

    if (spring) {
      spring.x.value = dx;
      spring.y.value = dy;
    } else {
      motion.cards.set(node, { x: { value: dx, velocity: 0 }, y: { value: dy, velocity: 0 } });
    }
    node.style.translate = `${dx}px ${dy}px`;
  });

  // Play : un seul rendu par image pour toutes les cartes et la hauteur.
  if (motion.cards.size || motion.height) startCategoryMotion(root);

  if (!entering.length) return;
  const now = performance.now();
  if (now - cardRevealBurst.at > CARD_REVEAL_BURST) cardRevealBurst.count = 0;
  cardRevealBurst.at = now;

  entering
    .sort((a, b) => Number(a.node.style.order) - Number(b.node.style.order))
    .forEach(({ node, from }) => {
      // Une carte rappelée pendant sa sortie repart de son état courant, sans attendre.
      const delay = from ? 0 : Math.min(cardRevealBurst.count, CARD_REVEAL_MAX) * CARD_REVEAL_STEP;
      if (!from) cardRevealBurst.count += 1;

      const fade = node.animate([
        { opacity: from?.opacity ?? 0 },
        { opacity: 1 },
      ], { duration: 820, delay, easing: CARD_FADE_EASE, fill: 'backwards' });
      fade.id = CARD_FADE_ANIMATION;

      const reveal = node.animate([
        { scale: String(from?.scale ?? 0.62) },
        { scale: '1' },
      ], { duration: 1000, delay, easing: CARD_REVEAL_EASE, fill: 'backwards' });
      reveal.id = CARD_FADE_ANIMATION;
    });
};

// Plus aucun résultat : la grille reste affichée le temps que les dernières
// cartes sortent, puis le message vide apparaît en fondu.
const setEmptyStateVisibility = (root, isEmpty, { animate = false, deferEmpty = false } = {}) => {
  const emptyState = root.querySelector('[data-category-empty-state]');
  const productViews = root.querySelector('[data-category-product-views]');

  if (!isEmpty) {
    window.clearTimeout(root._categoryEmptyTimer);
    root._categoryEmptyTimer = null;
    if (emptyState) emptyState.hidden = true;
    if (productViews) productViews.hidden = false;
    return;
  }

  if (!deferEmpty) {
    if (productViews) productViews.hidden = true;
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (root._categoryEmptyTimer) return;
  root._categoryEmptyTimer = window.setTimeout(() => {
    root._categoryEmptyTimer = null;
    if (productViews) productViews.hidden = true;
    if (!emptyState?.hidden) return;
    emptyState.hidden = false;
    if (animate) {
      emptyState.animate?.([
        { opacity: 0, translate: '0 10px' },
        { opacity: 1, translate: '0 0' },
      ], { duration: 600, easing: CARD_REVEAL_EASE });
    }
  }, CARD_LEAVE_DURATION);
};

export default function CategoryControlsIsland({
  categoryId,
  items = [],
  filterOptions = {},
}) {
  const rootRef = React.useRef(null);
  const drawerTriggerRef = React.useRef(null);

  React.useEffect(() => () => {
    if (rootRef.current) setDrawerOpen(rootRef.current, false);
    else setBodyLocked(false);
  }, []);

  React.useEffect(() => {
    rootRef.current = document.querySelector('[data-category-native-view]');
    return () => {
      rootRef.current = null;
    };
  }, []);

  const closeDrawer = React.useCallback((root, { restoreFocus = true } = {}) => {
    setDrawerOpen(root, false);
    if (!restoreFocus) return;
    const trigger = drawerTriggerRef.current;
    window.requestAnimationFrame(() => {
      if (trigger?.isConnected) focusWithoutScroll(trigger);
    });
  }, []);

  const openDrawer = React.useCallback((root, trigger) => {
    drawerTriggerRef.current = trigger;
    setDrawerOpen(root, true);
    const drawer = root.querySelector('[data-category-filter-drawer]');
    window.requestAnimationFrame(() => {
      const initialFocus = drawer?.querySelector('[data-category-filter-initial-focus]');
      focusWithoutScroll(initialFocus || drawer);
    });
  }, []);

  const applyState = React.useCallback((state, { push = false, animate = false } = {}) => {
    const root = rootRef.current;
    if (!root) return;

    const filteredItems = filterAndSortCategoryItems(items, state, filterOptions.maxPrice);
    const visibleOrder = new Map(filteredItems.map((item, index) => [String(item.id), index]));
    const hasActiveFilters = hasActiveCategoryFilters(state, filterOptions.maxPrice);
    const categoryHref = buildCategoryHref(categoryId, state);
    const resetHref = buildCategoryHref(categoryId, state, resetFilterPatch(state));
    const sortLabel = CATEGORY_SORT_OPTIONS.find((option) => option.id === state.sortBy)?.label || CATEGORY_SORT_OPTIONS[0].label;
    const viewModeChanged = root.dataset.categoryMobileMode !== state.mobileViewMode
      || root.dataset.categoryDesktopMode !== state.viewMode;
    root.dataset.categoryMobileMode = state.mobileViewMode;
    root.dataset.categoryDesktopMode = state.viewMode;

    const shouldAnimate = animate && !viewModeChanged && !prefersReducedMotion();
    if (shouldAnimate) primeHiddenCardImages(root);
    const productViews = root.querySelector('[data-category-product-views]');
    const isEmpty = filteredItems.length === 0;
    // Grille affichée avant les mesures FLIP ; le masquage d'une grille vide attend la sortie des cartes.
    setEmptyStateVisibility(root, isEmpty, {
      animate: shouldAnimate,
      deferEmpty: shouldAnimate && Boolean(productViews) && !productViews.hidden,
    });
    setProductVisibility(root, visibleOrder, { animate: shouldAnimate });

    root.querySelectorAll('[data-category-result-count]').forEach((node) => {
      node.textContent = formatProductCount(filteredItems.length);
    });
    root.querySelectorAll('[data-category-filtered-count]').forEach((node) => {
      node.textContent = String(filteredItems.length);
    });
    root.querySelectorAll('[data-category-max-price-label]').forEach((node) => {
      node.textContent = `${(state.priceRange[1] ?? state.roundedMaxPrice).toFixed(0)} EUR`;
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

    const handlePopState = () => applyState(readWindowState(), { animate: true });
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [applyState, filterOptions]);

  const handleClick = React.useCallback((event) => {
    const root = rootRef.current;
    if (!root) return;

    if (event.target.closest('[data-category-open-filters]')) {
      event.preventDefault();
      openDrawer(root, event.target.closest('[data-category-open-filters]'));
      return;
    }

    if (event.target.closest('[data-category-close-filters]')) {
      event.preventDefault();
      closeDrawer(root);
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
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || categoryLink.target === '_blank') return;
      const targetUrl = new URL(categoryLink.href, window.location.href);
      if (targetUrl.origin === window.location.origin && targetUrl.pathname === window.location.pathname) {
        event.preventDefault();
        setSortOpen(root, false);
        applyState(getCategoryQueryState(targetUrl.searchParams, filterOptions), { push: true, animate: true });
      }
    }
  }, [applyState, closeDrawer, filterOptions, openDrawer]);

  const handleChange = React.useCallback((event) => {
    const form = event.target.closest('form[data-category-filter-form]');
    if (!form) return;

    // Le relâchement du curseur fige le filtre dans l'URL ; pendant le
    // glissement, `handleInput` met déjà la grille à jour sans empiler l'historique.
    if (event.target.matches('[data-category-range]')) {
      window.cancelAnimationFrame(form._categoryRangeFrame);
      applyState(stateFromForm(form, filterOptions), { push: true, animate: true });
      return;
    }

    window.clearTimeout(form._categorySubmitTimer);
    form._categorySubmitTimer = window.setTimeout(() => {
      applyState(stateFromForm(form, filterOptions), { push: true, animate: true });
    }, 120);
  }, [applyState, filterOptions]);

  const handleInput = React.useCallback((event) => {
    const form = event.target.closest('form[data-category-filter-form]');
    if (!form || !event.target.matches('[data-category-range]')) return;

    const label = form.querySelector('[data-category-max-price-label]');
    if (label) {
      label.textContent = `${Number(event.target.value).toFixed(0)} EUR`;
    }

    window.cancelAnimationFrame(form._categoryRangeFrame);
    form._categoryRangeFrame = window.requestAnimationFrame(() => {
      applyState(stateFromForm(form, filterOptions), { animate: true });
    });
  }, [applyState, filterOptions]);

  const handleSubmit = React.useCallback((event) => {
    const form = event.target.closest('form[data-category-filter-form]');
    if (!form) return;
    event.preventDefault();
    window.clearTimeout(form._categorySubmitTimer);
    window.cancelAnimationFrame(form._categoryRangeFrame);
    applyState(stateFromForm(form, filterOptions), { push: true, animate: true });
    if (rootRef.current) closeDrawer(rootRef.current);
  }, [applyState, closeDrawer, filterOptions]);

  React.useEffect(() => {
    const root = rootRef.current || document.querySelector('[data-category-native-view]');
    if (!root) return undefined;

    rootRef.current = root;
    const handleKeyDown = (event) => {
      const drawer = root.querySelector('[data-category-filter-drawer]');
      if (!drawer || drawer.getAttribute('aria-hidden') !== 'false') return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeDrawer(root);
        return;
      }

      trapDialogTabKey(event, drawer, drawer);
    };

    root.addEventListener('click', handleClick);
    root.addEventListener('change', handleChange);
    root.addEventListener('input', handleInput);
    root.addEventListener('submit', handleSubmit);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      root.querySelectorAll('form[data-category-filter-form]').forEach((form) => {
        window.clearTimeout(form._categorySubmitTimer);
        window.cancelAnimationFrame(form._categoryRangeFrame);
      });
      window.clearTimeout(root._categoryEmptyTimer);
      root._categoryEmptyTimer = null;
      stopCategoryMotion(root);
      root.removeEventListener('click', handleClick);
      root.removeEventListener('change', handleChange);
      root.removeEventListener('input', handleInput);
      root.removeEventListener('submit', handleSubmit);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeDrawer, handleChange, handleClick, handleInput, handleSubmit]);

  return null;
}
