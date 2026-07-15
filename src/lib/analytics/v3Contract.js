export const ANALYTICS_SCHEMA_VERSION = 3;

export const MEASUREMENT_MODES = Object.freeze({
  AUDIENCE: 'audience_minimized',
  CONSENTED: 'product_analytics_consented',
});

export const PAGE_EVENTS = new Set([
  'page_view', 'gallery_view', 'category_view', 'product_view',
  'wishlist_view', 'quote_view', 'checkout_view', 'account_orders_view',
]);

export const CLIENT_ACTIONS = new Set([
  'favorite_add', 'favorite_remove', 'cart_add', 'cart_remove', 'cart_open',
  'quote_start', 'quote_email_intent', 'checkout_start',
]);

export const SERVER_ACTIONS = new Set([
  'order_created_server', 'payment_paid_server', 'refund_server',
]);

const ROUTES = [
  [/^\/$/, ['home', 'gallery_view']],
  [/^\/galerie\/?$/, ['gallery', 'gallery_view']],
  [/^\/categorie\/([^/]+)\/?$/, ['category', 'category_view']],
  [/^\/produit\/([^/]+)\/?$/, ['product', 'product_view']],
  [/^\/wishlist\/?$/, ['wishlist', 'wishlist_view']],
  [/^\/devis\/?$/, ['quote', 'quote_view']],
  [/^\/checkout\/?$/, ['checkout', 'checkout_view']],
  [/^\/mes-commandes\/?$/, ['account_orders', 'account_orders_view']],
  [/^\/a-propos\/?$/, ['about', 'page_view']],
  [/^\/recherche\/?$/, ['search', 'page_view']],
];

export function classifyAnalyticsRoute(pathname = '/') {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return null;
  for (const [pattern, result] of ROUTES) {
    const match = pathname.match(pattern);
    if (match) {
      return {
        routeKey: result[0],
        eventName: result[1],
        ...(match[1] ? { entityId: match[1].slice(0, 160) } : {}),
      };
    }
  }
  return { routeKey: 'other_public', eventName: 'page_view' };
}
export function normalizeClientAction(value) {
  const action = value === 'quote_email_opened' ? 'quote_email_intent' : value;
  return CLIENT_ACTIONS.has(action) ? action : null;
}
