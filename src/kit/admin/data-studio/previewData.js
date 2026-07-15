const timelines = {
    '7d': [['2026-07-09', 18, 2], ['2026-07-10', 24, 3], ['2026-07-11', 21, 2], ['2026-07-12', 32, 5], ['2026-07-13', 27, 4], ['2026-07-14', 36, 6], ['2026-07-15', 26, 3]],
    '30d': [['2026-06-16', 5, 0], ['2026-06-18', 8, 1], ['2026-06-20', 4, 0], ['2026-06-22', 11, 2], ['2026-06-24', 7, 1], ['2026-06-26', 14, 2], ['2026-06-28', 9, 1], ['2026-06-30', 16, 3], ['2026-07-02', 12, 2], ['2026-07-04', 18, 2], ['2026-07-06', 15, 3], ['2026-07-08', 22, 4], ['2026-07-10', 19, 3], ['2026-07-12', 27, 5], ['2026-07-14', 31, 5], ['2026-07-15', 23, 3]],
    '12m': [['2025-08', 72, 8], ['2025-09', 88, 10], ['2025-10', 94, 9], ['2025-11', 81, 12], ['2025-12', 103, 14], ['2026-01', 112, 11], ['2026-02', 98, 13], ['2026-03', 125, 17], ['2026-04', 119, 15], ['2026-05', 138, 19], ['2026-06', 147, 21], ['2026-07', 86, 12]],
};

export function getDataStudioPreview(period = '30d') {
    const timeline = (timelines[period] || timelines['30d']).map(([key, sessions, quoteViews]) => ({ key, sessions, quoteViews }));
    const sessions = timeline.reduce((sum, point) => sum + point.sessions, 0);
    return {
        __preview: true, schemaVersion: 3, sourceDocuments: period === '12m' ? 12 : timeline.length,
        provisional: period !== '12m', sessions, pageViews: Math.round(sessions * 4), events: Math.round(sessions * 6.3),
        activeDurationMs: sessions * 96_000, uniqueVisitorsApprox: Math.round(sessions * .72), detailedCoverage: .18, timeline,
        pages: { product: 286, category: 174, home: 121, gallery: 96, quote: 43, about: 31, search: 18 },
        actions: { quote_start: 21, quote_email_intent: 9, favorite_add: 34, cart_add: 12 },
        outcomes: { quote_intent: 9, cart_added: 12, checkout_started: 5 },
        business: { order_created_server: 4, payment_paid_server: 3, refund_server: 0 },
        transitions: { home__gallery: 54, gallery__product: 47, category__product: 39, product__product: 31, product__quote: 21, home__category: 18, product__gallery: 16, quote__product: 11, search__product: 9, about__gallery: 7, product__checkout: 5 },
        products: [
            { id: 'preview-1', views: 82, favorites: 14, quoteIntents: 6 },
            { id: 'preview-2', views: 68, favorites: 11, quoteIntents: 5 },
            { id: 'preview-3', views: 54, favorites: 9, quoteIntents: 4 },
            { id: 'preview-4', views: 43, favorites: 7, quoteIntents: 3 },
        ],
        quality: { identity_resolution: 'partielle', data_completeness: 'bonne', ingestion_integrity: 'forte', formulaVersion: 3 },
    };
}

export const PREVIEW_SESSIONS = [
    { id: 'preview-01', visitorLabel: 'Visiteur 7F2A', startedAt: Date.now() - 284000, durationMs: 284000, eventCount: 8, pageViewCount: 5, outcome: 'quote_intent', geo: { city: 'Bordeaux', accuracy: 'city_approx' }, device: { class: 'Mobile', browserFamily: 'Safari' }, status: 'final' },
    { id: 'preview-02', visitorLabel: 'Visiteur 19C4', startedAt: Date.now() - 920000, durationMs: 192000, eventCount: 6, pageViewCount: 4, outcome: 'cart_added', geo: { city: 'Paris', accuracy: 'city_approx' }, device: { class: 'Desktop', browserFamily: 'Chrome' }, status: 'final' },
    { id: 'preview-03', visitorLabel: 'Visiteur A810', startedAt: Date.now() - 1900000, durationMs: 116000, eventCount: 4, pageViewCount: 4, outcome: null, geo: { city: 'Lyon', accuracy: 'city_approx' }, device: { class: 'Tablet', browserFamily: 'Safari' }, status: 'final' },
    { id: 'preview-04', visitorLabel: 'Visiteur 42DB', startedAt: Date.now() - 3300000, durationMs: 347000, eventCount: 9, pageViewCount: 6, outcome: 'checkout_started', geo: { city: 'Nantes', accuracy: 'city_approx' }, device: { class: 'Desktop', browserFamily: 'Firefox' }, status: 'final' },
];

export const PREVIEW_EVENTS = [
    { seq: 1, eventName: 'gallery_view', routeKey: 'home', activeDeltaMs: 18000 },
    { seq: 2, eventName: 'gallery_view', routeKey: 'gallery', activeDeltaMs: 26000 },
    { seq: 3, eventName: 'product_view', routeKey: 'product', activeDeltaMs: 68000, context: { entityId: 'preview-1' } },
    { seq: 4, eventName: 'favorite_add', routeKey: 'product', activeDeltaMs: 9000, context: { productId: 'preview-1' } },
    { seq: 5, eventName: 'quote_view', routeKey: 'quote', activeDeltaMs: 43000 },
    { seq: 6, eventName: 'quote_start', routeKey: 'quote', activeDeltaMs: 72000 },
    { seq: 7, eventName: 'quote_email_intent', routeKey: 'quote', activeDeltaMs: 12000 },
];
