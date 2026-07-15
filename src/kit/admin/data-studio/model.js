const NUMBER = new Intl.NumberFormat('fr-FR');

export const ROUTES = {
    home: { label: 'Accueil', short: 'ACC' },
    gallery: { label: 'Galerie', short: 'GAL' },
    category: { label: 'Catégorie', short: 'CAT' },
    product: { label: 'Pièce', short: 'PCE' },
    quote: { label: 'Devis', short: 'DEV' },
    checkout: { label: 'Paiement', short: 'PAY' },
    search: { label: 'Recherche', short: 'RCH' },
    about: { label: 'À propos', short: 'PRO' },
    wishlist: { label: 'Favoris', short: 'FAV' },
    account_orders: { label: 'Commandes', short: 'CMD' },
    unknown: { label: 'Autre', short: 'AUT' },
};

export const EVENT_LABELS = {
    page_view: 'Page consultée', gallery_view: 'Galerie ouverte', category_view: 'Catégorie explorée',
    product_view: 'Pièce regardée', wishlist_view: 'Favoris ouverts', quote_view: 'Page devis',
    checkout_view: 'Paiement ouvert', account_orders_view: 'Commandes consultées',
    favorite_add: 'Ajout aux favoris', favorite_remove: 'Retrait des favoris', cart_add: 'Ajout au panier',
    cart_remove: 'Retrait du panier', quote_start: 'Devis commencé', quote_email_intent: 'Intention de contact',
    checkout_start: 'Paiement commencé', search_submit: 'Recherche lancée',
};

export const OUTCOME_LABELS = {
    quote_intent: 'Intention de devis', cart_added: 'Ajout au panier', checkout_started: 'Paiement commencé',
};

export const safeNumber = (value) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
export const formatNumber = (value) => NUMBER.format(safeNumber(value));
export const formatPercent = (value) => `${Math.round(safeNumber(value) * 100)} %`;

export function formatDuration(milliseconds) {
    const seconds = Math.max(0, Math.round(safeNumber(milliseconds) / 1000));
    if (seconds < 60) return `${seconds} s`;
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    if (minutes < 60) return `${minutes} min ${String(rest).padStart(2, '0')} s`;
    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}

export function formatTimelineKey(key, period) {
    if (!key) return '—';
    const date = period === '12m' ? new Date(`${key}-01T12:00:00Z`) : new Date(`${key}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return String(key);
    return date.toLocaleDateString('fr-FR', period === '12m'
        ? { month: 'short' }
        : { day: '2-digit', month: 'short' });
}

export const routeMeta = (key) => ROUTES[key] || { ...ROUTES.unknown, label: String(key || ROUTES.unknown.label) };
export const eventLabel = (name) => EVENT_LABELS[name] || String(name || 'Événement');
export const outcomeLabel = (name) => OUTCOME_LABELS[name] || 'Sortie simple';

function imageFor(item) {
    const variants = Array.isArray(item?.imageVariants) ? item.imageVariants[0] : null;
    return variants?.card || variants?.thumb384 || variants?.thumb320 || item?.thumbnailUrl
        || (Array.isArray(item?.thumbnails) ? item.thumbnails[0] : '')
        || (Array.isArray(item?.images) ? item.images[0] : '') || item?.imageUrl || '';
}

function productKeys(item) {
    return [item?.id, item?.originalId, item?.slug, item?.slugOrId]
        .filter(Boolean).map((value) => String(value).toLowerCase());
}

function normalizeProductMetrics(products) {
    if (Array.isArray(products)) return products;
    return Object.entries(products || {}).map(([id, value]) => ({ id, ...(value || {}) }));
}

export function buildProducts(data, catalogItems = []) {
    const catalog = (catalogItems || []).filter(Boolean);
    const byKey = new Map();
    for (const item of catalog) for (const key of productKeys(item)) byKey.set(key, item);
    const source = normalizeProductMetrics(data?.products).slice(0, 8);

    if (source.length) return source.map((metric, index) => {
        const item = byKey.get(String(metric.id || metric.productId || '').toLowerCase()) || catalog[index] || {};
        return {
            id: String(metric.id || metric.productId || item.id || `product-${index}`),
            name: item.name || item.title || metric.name || 'Pièce suivie',
            image: imageFor(item),
            category: item.category || item.categoryName || metric.category || 'Pièce unique',
            status: item.sold ? 'Vendue' : (item.status || metric.status || 'Catalogue'),
            views: safeNumber(metric.views || metric.productViews),
            favorites: safeNumber(metric.favorites || metric.favoriteAdds),
            quoteIntents: safeNumber(metric.quoteIntents || metric.quotes),
            metricsAvailable: true,
        };
    });

    return catalog.slice(0, 6).map((item, index) => ({
        id: String(item.id || item.originalId || `catalog-${index}`),
        name: item.name || item.title || 'Pièce Seconde Vie', image: imageFor(item),
        category: item.category || item.categoryName || 'Pièce unique',
        status: item.sold ? 'Vendue' : (item.status || 'Catalogue'), metricsAvailable: false,
        views: 0, favorites: 0, quoteIntents: 0,
    }));
}

export function buildOverview(data = {}, period = '30d', catalogItems = []) {
    const sessions = safeNumber(data.sessions);
    const pageViews = safeNumber(data.pageViews);
    const coverage = Math.min(1, safeNumber(data.detailedCoverage));
    const visitors = data.uniqueVisitorsApprox == null ? null : safeNumber(data.uniqueVisitorsApprox);
    const quoteViews = safeNumber(data.pages?.quote);
    const quoteStarts = safeNumber(data.actions?.quote_start);
    const quoteIntents = safeNumber(data.actions?.quote_email_intent || data.outcomes?.quote_intent);
    const payments = safeNumber(data.business?.payment_paid_server);
    const timeline = (data.timeline || []).map((point) => ({
        key: point.key, sessions: safeNumber(point.sessions), quoteViews: safeNumber(point.quoteViews),
    }));
    const pages = Object.entries(data.pages || {}).map(([key, value]) => ({ key, label: routeMeta(key).label, value: safeNumber(value) }))
        .sort((a, b) => b.value - a.value);

    return {
        period, timeline, pages, products: buildProducts(data, catalogItems), sessions, pageViews, coverage, visitors,
        kpis: [
            { id: 'visitors', label: 'Visiteurs', value: visitors == null ? '—' : `≈ ${formatNumber(visitors)}`, note: visitors == null ? 'Estimation indisponible' : 'HyperLogLog · p=12', tone: 'estimated' },
            { id: 'sessions', label: 'Sessions', value: formatNumber(sessions), note: `${formatPercent(coverage)} avec détail consenti`, tone: 'observed' },
            { id: 'pages', label: 'Pages vues', value: formatNumber(pageViews), note: data.provisional ? 'Période encore provisoire' : 'Période compactée', tone: 'observed' },
            { id: 'payments', label: 'Paiements', value: formatNumber(payments), note: 'Fait durable · Stripe serveur', tone: 'server' },
        ],
        pulse: {
            pagesPerSession: sessions ? pageViews / sessions : null,
            activePerSessionMs: sessions ? safeNumber(data.activeDurationMs) / sessions : null,
            eventsPerSession: sessions ? safeNumber(data.events) / sessions : null,
            coverage,
        },
        intentions: [
            { id: 'quote-view', label: 'Page devis', value: quoteViews },
            { id: 'quote-start', label: 'Formulaire commencé', value: quoteStarts },
            { id: 'quote-intent', label: 'Intention e-mail', value: quoteIntents },
        ],
        commerce: [
            { id: 'orders', label: 'Commandes créées', value: safeNumber(data.business?.order_created_server) },
            { id: 'payments', label: 'Paiements confirmés', value: payments },
            { id: 'refunds', label: 'Remboursements', value: safeNumber(data.business?.refund_server) },
        ],
        quality: [
            { id: 'identity', label: 'Résolution', value: data.quality?.identity_resolution || 'partielle' },
            { id: 'completeness', label: 'Complétude', value: data.quality?.data_completeness || 'partielle' },
            { id: 'integrity', label: 'Intégrité', value: data.quality?.ingestion_integrity || 'partielle' },
        ],
    };
}

export function buildJourney(data = {}) {
    const transitions = Object.entries(data.transitions || {}).map(([key, value]) => {
        const [from = 'unknown', to = 'unknown'] = key.split('__');
        return { key, from, to, value: safeNumber(value), fromMeta: routeMeta(from), toMeta: routeMeta(to) };
    }).filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
    const nodeWeights = new Map();
    for (const item of transitions) {
        nodeWeights.set(item.from, (nodeWeights.get(item.from) || 0) + item.value);
        nodeWeights.set(item.to, (nodeWeights.get(item.to) || 0) + item.value);
    }
    const nodes = [...nodeWeights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([id, weight]) => ({ id, weight, ...routeMeta(id) }));
    return {
        transitions: transitions.slice(0, 18), topTransitions: transitions.slice(0, 10), nodes,
        total: transitions.reduce((sum, item) => sum + item.value, 0),
        maximum: Math.max(1, ...transitions.map((item) => item.value)),
    };
}
