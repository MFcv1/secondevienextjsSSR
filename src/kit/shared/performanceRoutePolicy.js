const SAFE_PERFORMANCE_ROUTES = Object.freeze([
  /^\/$/,
  /^\/galerie\/?$/,
  /^\/categorie\/[^/?#]+\/?$/,
  /^\/produit\/[^/?#]+\/?$/,
  /^\/a-propos\/?$/,
]);

export const pathnameFromPerformanceUrl = (value) => {
  const raw = String(value || '/');
  try {
    return new URL(raw, 'https://performance.local').pathname;
  } catch {
    return '/__invalid__';
  }
};

export const isPerformanceSafePath = (value) => {
  const pathname = pathnameFromPerformanceUrl(value);
  return SAFE_PERFORMANCE_ROUTES.some((pattern) => pattern.test(pathname));
};

export const PRIVATE_PERFORMANCE_PREFIXES = Object.freeze([
  '/admin',
  '/checkout',
  '/payer',
  '/mes-commandes',
  '/wishlist',
  '/recherche',
  '/devis',
]);
