import KIT_CONFIG from '../config/constants';
import { PAGE_META } from '../shared/pageTaxonomy';
import { getMillis } from '../../utils/time';

export const MAP_WIDTH = 2860;
export const MAP_HEIGHT = 980;
export const ACTIVE_WINDOW_MS = 120000;

export const TIME_FILTERS = [
    { id: '15m', label: '15 min', ms: 15 * 60 * 1000, limit: 180 },
    { id: '1h', label: '1 h', ms: 60 * 60 * 1000, limit: 260 },
    { id: '24h', label: '24 h', ms: 24 * 60 * 60 * 1000, limit: 420 },
    { id: '7d', label: '7 j', ms: 7 * 24 * 60 * 60 * 1000, limit: 600 }
];

export const SECTION_LABELS = {
    vitrine: 'Vitrine',
    gallery: 'Galerie',
    catalog: 'Catalogue',
    product: 'Produit',
    commerce: 'Conversion',
    account: 'Compte',
    action: 'Actions'
};

export const PRIORITY_LABELS = {
    p0: 'Entree',
    p1: 'Exploration',
    p2: 'Intention',
    p3: 'Conversion',
    p4: 'Fidelisation'
};

export const priorityTone = {
    p0: '#f8fafc',
    p1: '#22d3ee',
    p2: '#f472b6',
    p3: '#34d399',
    p4: '#a78bfa'
};

export const normalizePageKey = (pageKey) => {
    if (!pageKey) return 'unknown';
    if (pageKey === 'detail') return 'product_detail';
    if (pageKey === 'devis') return 'quote_request';
    if (pageKey === 'my-orders') return 'my_orders';
    return pageKey;
};

export const formatDuration = (seconds = 0) => {
    const value = Math.max(0, Number(seconds) || 0);
    if (value < 60) return `${Math.round(value)}s`;
    const minutes = Math.floor(value / 60);
    const remaining = Math.round(value % 60);
    if (minutes < 60) return remaining ? `${minutes}m ${remaining}s` : `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
};

export const formatTimeAgo = (ms, now = Date.now()) => {
    if (!ms) return 'Jamais';
    const diff = Math.max(0, now - ms);
    if (diff < 5000) return 'Maintenant';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
    return `${Math.floor(diff / 86400000)} j`;
};

export const getVisitorId = (session) => {
    if (session.userId && session.userId !== 'anonymous' && session.userId !== 'unknown') return `uid:${session.userId}`;
    if (session.visitorKey) return `vk:${session.visitorKey}`;
    return `ip:${session.ip || 'unknown'}`;
};

export const getJourneyPreview = (session) => {
    const preview = Array.isArray(session.lastJourneyPreview) ? session.lastJourneyPreview : [];
    const legacy = Array.isArray(session.journey) ? session.journey : [];
    return (preview.length ? preview : legacy).map((step) => ({
        ...step,
        pageKey: normalizePageKey(step?.pageKey || step?.page)
    }));
};

export const getEventPreview = (session) => {
    const preview = Array.isArray(session.lastEventPreview) ? session.lastEventPreview : [];
    const legacy = Array.isArray(session.events) ? session.events : [];
    return preview.length ? preview : legacy;
};

export const getLastStep = (session) => {
    if (session.lastStep) {
        return {
            ...session.lastStep,
            pageKey: normalizePageKey(session.lastStep.pageKey || session.lastStep.page)
        };
    }

    const journey = getJourneyPreview(session);
    return journey[journey.length - 1] || { pageKey: normalizePageKey(session.entryPageKey || 'unknown') };
};

export const isSessionLive = (session, now) => {
    const lastActive = getMillis(session.lastActivityAt);
    return session.sessionActive !== false && lastActive > 0 && now - lastActive < ACTIVE_WINDOW_MS;
};

const metaColor = (key, fallback) => PAGE_META[key]?.color || fallback;

const createNode = (node) => ({
    w: 220,
    h: 96,
    pageKeys: [],
    eventActions: [],
    compact: false,
    ...node
});

export const buildSiteMapModel = () => {
    const groups = KIT_CONFIG.categoryGroups || [];
    const categories = KIT_CONFIG.productCategories || [];
    const categoryById = new Map(categories.map((category) => [category.id, category]));

    const nodes = [
        createNode({
            id: 'vitrine_home',
            label: 'À propos',
            subtitle: 'Ancienne vitrine',
            x: 70,
            y: 440,
            w: 230,
            h: 104,
            pageKeys: ['vitrine_home'],
            priority: 'p0',
            section: 'vitrine',
            color: metaColor('vitrine_home', '#A68A64'),
            note: 'Page histoire et atelier accessible depuis la galerie.'
        }),
        createNode({
            id: 'gallery_landing',
            label: 'Galerie',
            subtitle: 'Hub boutique',
            x: 375,
            y: 440,
            w: 240,
            h: 112,
            pageKeys: ['gallery_landing'],
            priority: 'p0',
            section: 'gallery',
            color: '#f5f5f4',
            note: 'Entree principale du parcours commerce.'
        }),
        createNode({
            id: 'gallery_filter_fixed',
            label: 'Ventes directes',
            subtitle: 'Achat immediat',
            x: 710,
            y: 440,
            w: 238,
            h: 100,
            pageKeys: ['gallery_filter_fixed'],
            priority: 'p1',
            section: 'gallery',
            color: metaColor('gallery_filter_fixed', '#10b981'),
            note: 'Filtre d intention rapide vers les pieces disponibles.'
        }),
        createNode({
            id: 'product_detail',
            label: 'Fiche produit',
            subtitle: 'Decision piece',
            x: 1620,
            y: 438,
            w: 268,
            h: 122,
            pageKeys: ['product_detail', 'detail'],
            priority: 'p2',
            section: 'product',
            color: metaColor('product_detail', '#ec4899'),
            note: 'Noeud cle ou les signaux favoris, panier et devis se concentrent.'
        }),
        createNode({
            id: 'wishlist',
            label: 'Liste d envies',
            subtitle: 'Intention gardee',
            x: 1990,
            y: 208,
            w: 238,
            h: 102,
            pageKeys: ['wishlist'],
            eventActions: ['favorite_add', 'favorite_remove'],
            priority: 'p2',
            section: 'account',
            color: metaColor('wishlist', '#f43f5e'),
            note: 'Parking d intention avant retour produit, panier ou achat.'
        }),
        createNode({
            id: 'cart_actions',
            label: 'Panier',
            subtitle: 'Ajouts et retraits',
            x: 1990,
            y: 448,
            w: 238,
            h: 102,
            eventActions: ['cart_add', 'cart_remove', 'cart_open'],
            priority: 'p2',
            section: 'action',
            color: '#fb923c',
            note: 'Action transactionnelle avant le tunnel checkout.'
        }),
        createNode({
            id: 'quote_request',
            label: 'Demande de devis',
            subtitle: 'Conversion douce',
            x: 1990,
            y: 686,
            w: 248,
            h: 106,
            pageKeys: ['quote_request', 'devis'],
            priority: 'p3',
            section: 'commerce',
            color: metaColor('quote_request', '#f59e0b'),
            note: 'Point de contact qualifie pour livraison, projet ou restauration.'
        }),
        createNode({
            id: 'login',
            label: 'Connexion',
            subtitle: 'Identification',
            x: 2320,
            y: 208,
            w: 226,
            h: 100,
            pageKeys: ['login'],
            priority: 'p4',
            section: 'account',
            color: metaColor('login', '#64748b'),
            note: 'Passage compte avant suivi, favoris ou commande.'
        }),
        createNode({
            id: 'checkout',
            label: 'Checkout',
            subtitle: 'Tunnel panier',
            x: 2320,
            y: 448,
            w: 238,
            h: 106,
            pageKeys: ['checkout'],
            priority: 'p3',
            section: 'commerce',
            color: metaColor('checkout', '#059669'),
            note: 'Zone critique de friction paiement et livraison.'
        }),
        createNode({
            id: 'my_orders',
            label: 'Mes commandes',
            subtitle: 'Suivi client',
            x: 2625,
            y: 208,
            w: 218,
            h: 100,
            pageKeys: ['my_orders'],
            priority: 'p4',
            section: 'account',
            color: metaColor('my_orders', '#7c3aed'),
            note: 'Fidelisation et support post-achat.'
        }),
        createNode({
            id: 'checkout_success',
            label: 'Confirmation',
            subtitle: 'Commande validee',
            x: 2625,
            y: 448,
            w: 218,
            h: 100,
            pageKeys: ['checkout_success'],
            priority: 'p3',
            section: 'commerce',
            color: metaColor('checkout_success', '#22c55e'),
            note: 'Fin du chemin achat.'
        })
    ];

    groups.forEach((group, index) => {
        const groupY = 134 + index * 184;
        nodes.push(createNode({
            id: `category_group:${group.id}`,
            label: group.label,
            subtitle: 'Categorie mere',
            x: 1035,
            y: groupY,
            w: 230,
            h: 96,
            priority: 'p1',
            section: 'catalog',
            color: metaColor('category_group', '#3b82f6'),
            categoryId: group.id,
            note: 'Regroupement editorial et SEO des familles de pieces.'
        }));

        const leaves = (group.subCategories || []).map((categoryId) => categoryById.get(categoryId)).filter(Boolean);
        const startY = groupY + 12 - ((leaves.length - 1) * 78) / 2;
        leaves.forEach((category, leafIndex) => {
            nodes.push(createNode({
                id: `category_leaf:${category.id}`,
                label: category.label,
                subtitle: 'Page categorie',
                x: 1320,
                y: startY + leafIndex * 78,
                w: 216,
                h: 68,
                priority: 'p1',
                section: 'catalog',
                color: metaColor('category_leaf', '#06b6d4'),
                categoryId: category.id,
                parentCategoryId: group.id,
                compact: true,
                note: 'Page feuille SEO et filtre de recherche.'
            }));
        });
    });

    const edges = [
        ['gallery_landing', 'vitrine_home'],
        ['gallery_landing', 'gallery_filter_fixed'],
        ['gallery_filter_fixed', 'product_detail'],
        ['product_detail', 'wishlist'],
        ['wishlist', 'product_detail'],
        ['product_detail', 'cart_actions'],
        ['wishlist', 'cart_actions'],
        ['cart_actions', 'checkout'],
        ['product_detail', 'quote_request'],
        ['quote_request', 'login'],
        ['login', 'checkout'],
        ['checkout', 'login'],
        ['checkout', 'checkout_success'],
        ['checkout_success', 'my_orders'],
        ['login', 'my_orders'],
        ['my_orders', 'gallery_landing']
    ].map(([source, target]) => ({ source, target, expected: true }));

    groups.forEach((group) => {
        edges.push({ source: 'gallery_landing', target: `category_group:${group.id}`, expected: true });
        edges.push({ source: 'gallery_filter_fixed', target: `category_group:${group.id}`, expected: true, faint: true });
        (group.subCategories || []).forEach((categoryId) => {
            edges.push({ source: `category_group:${group.id}`, target: `category_leaf:${categoryId}`, expected: true });
        });
    });

    categories.forEach((category) => {
        edges.push({ source: `category_leaf:${category.id}`, target: 'product_detail', expected: true });
        edges.push({ source: 'product_detail', target: `category_leaf:${category.id}`, expected: true, faint: true });
    });

    return { nodes, edges };
};

export const nodeMatchesStep = (node, rawStep = {}) => {
    const pageKey = normalizePageKey(rawStep.pageKey || rawStep.page);
    const context = rawStep.context || {};

    if (node.id.startsWith('category_group:')) {
        return pageKey === 'category_group' && context.categoryId === node.categoryId;
    }

    if (node.id.startsWith('category_leaf:')) {
        return pageKey === 'category_leaf' && context.categoryId === node.categoryId;
    }

    return (node.pageKeys || []).map(normalizePageKey).includes(pageKey);
};

export const nodeMatchesEvent = (node, event = {}) => (
    Boolean(event?.action) && (node.eventActions || []).includes(event.action)
);

export const findNodeForStep = (nodes, step) => nodes.find((node) => nodeMatchesStep(node, step)) || null;
export const findNodeForEvent = (nodes, event) => nodes.find((node) => nodeMatchesEvent(node, event)) || null;

export const createPath = (source, target) => {
    const sx = source.x + source.w;
    const sy = source.y + source.h / 2;
    const tx = target.x;
    const ty = target.y + target.h / 2;
    const distance = Math.max(130, Math.abs(tx - sx));
    const lift = Math.max(-110, Math.min(110, (ty - sy) * 0.16));

    return `M ${sx} ${sy} C ${sx + distance * 0.42} ${sy + lift}, ${tx - distance * 0.42} ${ty - lift}, ${tx} ${ty}`;
};

const incrementTransition = (transitionMap, source, target, options = {}) => {
    if (!source || !target || source.id === target.id) return;

    const key = `${source.id}->${target.id}`;
    const current = transitionMap.get(key) || {
        source: source.id,
        target: target.id,
        sourceLabel: source.label,
        targetLabel: target.label,
        count: 0,
        live: 0,
        observedOnly: Boolean(options.observedOnly),
        action: Boolean(options.action)
    };

    current.count += 1;
    if (options.live) current.live += 1;
    current.lastSeenAt = Math.max(current.lastSeenAt || 0, Number(options.timestamp) || 0);
    transitionMap.set(key, current);
};

export const buildJourneyAnalytics = (model, sessions, now = Date.now()) => {
    const nodeStats = {};
    const transitionMap = new Map();
    const architectureEdgeKeys = new Set(model.edges.map((edge) => `${edge.source}->${edge.target}`));
    const activeSessions = [];

    model.nodes.forEach((node) => {
        nodeStats[node.id] = {
            visits: 0,
            live: 0,
            actions: 0,
            uniqueVisitorsSet: new Set(),
            totalDuration: 0,
            avgDuration: 0,
            exits: 0,
            entries: 0,
            lastSeenAt: 0,
            frictionScore: 0,
            opportunityScore: 0
        };
    });

    sessions.forEach((session) => {
        const visitorId = getVisitorId(session);
        const steps = getJourneyPreview(session);
        const usableSteps = steps.length ? steps : [getLastStep(session)];
        const lastNode = findNodeForStep(model.nodes, getLastStep(session));
        const live = isSessionLive(session, now);

        if (live) activeSessions.push(session);

        if (lastNode) {
            if (live) nodeStats[lastNode.id].live += 1;
            if (!live || session.sessionActive === false) nodeStats[lastNode.id].exits += 1;
        }

        usableSteps.forEach((step, index) => {
            const node = findNodeForStep(model.nodes, step);
            if (!node) return;

            const stats = nodeStats[node.id];
            const timestamp = Number(step.timestamp) || getMillis(session.lastActivityAt);
            stats.visits += 1;
            stats.uniqueVisitorsSet.add(visitorId);
            stats.totalDuration += Number(step.duration) || 0;
            stats.lastSeenAt = Math.max(stats.lastSeenAt || 0, timestamp || 0);
            if (index === 0) stats.entries += 1;
        });

        for (let index = 0; index < usableSteps.length - 1; index += 1) {
            const source = findNodeForStep(model.nodes, usableSteps[index]);
            const target = findNodeForStep(model.nodes, usableSteps[index + 1]);
            const key = source && target ? `${source.id}->${target.id}` : '';
            incrementTransition(transitionMap, source, target, {
                live: live && index === usableSteps.length - 2,
                observedOnly: key ? !architectureEdgeKeys.has(key) : false,
                timestamp: usableSteps[index + 1]?.timestamp
            });
        }

        getEventPreview(session).forEach((event) => {
            const eventNode = findNodeForEvent(model.nodes, event);
            if (!eventNode) return;

            const stats = nodeStats[eventNode.id];
            const timestamp = Number(event.timestamp) || getMillis(session.lastEventAt);
            stats.actions += 1;
            stats.uniqueVisitorsSet.add(visitorId);
            stats.lastSeenAt = Math.max(stats.lastSeenAt || 0, timestamp || 0);

            const sourceStep = [...usableSteps].reverse().find((step) => (
                !timestamp || !step.timestamp || Number(step.timestamp) <= timestamp
            )) || getLastStep(session);
            const source = findNodeForStep(model.nodes, sourceStep);
            const key = source ? `${source.id}->${eventNode.id}` : '';
            incrementTransition(transitionMap, source, eventNode, {
                live,
                action: true,
                observedOnly: key ? !architectureEdgeKeys.has(key) : false,
                timestamp
            });
        });
    });

    Object.entries(nodeStats).forEach(([nodeId, stats]) => {
        const node = model.nodes.find((entry) => entry.id === nodeId);
        stats.uniqueVisitors = stats.uniqueVisitorsSet.size;
        stats.avgDuration = stats.visits ? Math.round(stats.totalDuration / stats.visits) : 0;
        const volume = Math.max(stats.visits + stats.actions, 1);
        const exitRate = stats.exits / volume;
        const intentWeight = ['p2', 'p3'].includes(node?.priority) ? 1.35 : 1;
        stats.frictionScore = Math.min(100, Math.round(exitRate * 100 * intentWeight));
        stats.opportunityScore = Math.round((stats.uniqueVisitors * 2) + stats.actions * 4 + stats.live * 8 + stats.visits * 0.7);
        delete stats.uniqueVisitorsSet;
    });

    const transitions = Array.from(transitionMap.values()).sort((a, b) => b.count - a.count);
    const transitionByKey = new Map(transitions.map((transition) => [`${transition.source}->${transition.target}`, transition]));
    const dynamicEdges = transitions
        .filter((transition) => !architectureEdgeKeys.has(`${transition.source}->${transition.target}`))
        .map((transition) => ({
            source: transition.source,
            target: transition.target,
            observedOnly: true,
            action: transition.action
        }));

    const hotNodeId = Object.entries(nodeStats).sort((a, b) => b[1].opportunityScore - a[1].opportunityScore)[0]?.[0] || null;
    const liveNodeCount = Object.values(nodeStats).filter((stats) => stats.live > 0).length;
    const topFriction = Object.entries(nodeStats)
        .filter(([, stats]) => stats.visits + stats.actions > 0)
        .sort((a, b) => b[1].frictionScore - a[1].frictionScore)
        .slice(0, 4)
        .map(([nodeId, stats]) => ({ nodeId, ...stats }));

    return {
        nodeStats,
        transitions,
        transitionByKey,
        dynamicEdges,
        activeSessions,
        hotNodeId,
        liveNodeCount,
        topFriction
    };
};

export const getVisibleEdges = (model, analytics) => {
    const seen = new Set();
    const edges = [];

    [...model.edges, ...(analytics.dynamicEdges || [])].forEach((edge) => {
        const key = `${edge.source}->${edge.target}`;
        if (seen.has(key)) return;
        seen.add(key);
        edges.push(edge);
    });

    return edges;
};
