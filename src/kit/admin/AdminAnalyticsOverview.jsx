import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { RefreshCw } from 'lucide-react';
import { Timestamp, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AnalyticsJourneyView, AnalyticsSessionsView } from './AnalyticsWorkspaceViews';
import {
    MAX_ANALYTICS_SESSIONS,
    buildAnalyticsStats,
    getAnalyticsWindow,
    getReliableVisitorKey,
    toAnalyticsMillis
} from './analyticsReliability';

const CHECKPOINT_CACHE_KEY = 'secondevie.admin.analytics.checkpoint.v1';
const CHECKPOINT_SESSION_LIMIT = Math.min(MAX_ANALYTICS_SESSIONS, 1500);
const OVERVIEW_FILTERS = ['7j', '1mois', '1ans'];
const ANALYTICS_VIEWS = [
    { id: 'overview', label: 'Vue d’ensemble' },
    { id: 'journeys', label: 'Parcours' },
    { id: 'sessions', label: 'Sessions' }
];

const formatNumber = new Intl.NumberFormat('fr-FR');

const formatPercent = (value) => (Number.isFinite(value) ? `${Math.round(value)} %` : '—');

const formatCheckpoint = (timestamp) => {
    if (!timestamp) return 'Aucun checkpoint local';
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(timestamp));
};

const formatFilter = (filterId) => ({
    '7j': '7 derniers jours',
    '1mois': '30 derniers jours',
    '1ans': '12 derniers mois'
}[filterId] || filterId);

const readCheckpoint = () => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(CHECKPOINT_CACHE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || !Array.isArray(parsed.sessions) || !Number.isFinite(parsed.loadedAt)) return null;
        return parsed;
    } catch {
        return null;
    }
};

const writeCheckpoint = (sessions) => {
    if (typeof window === 'undefined') return { saved: false, loadedAt: Date.now() };
    const loadedAt = Date.now();
    try {
        window.localStorage.setItem(CHECKPOINT_CACHE_KEY, JSON.stringify({
            loadedAt,
            count: sessions.length,
            cachedCount: Math.min(sessions.length, CHECKPOINT_SESSION_LIMIT),
            sessions: sessions.slice(0, CHECKPOINT_SESSION_LIMIT)
        }));
        return { saved: true, loadedAt };
    } catch {
        return { saved: false, loadedAt };
    }
};

const getJourney = (session) => (
    Array.isArray(session?.lastJourneyPreview)
        ? session.lastJourneyPreview
        : (Array.isArray(session?.journey) ? session.journey : [])
);

const getEvents = (session) => (
    Array.isArray(session?.lastEventPreview)
        ? session.lastEventPreview
        : (Array.isArray(session?.events) ? session.events : [])
);

const getStepKey = (step) => step?.pageKey || step?.page || 'unknown';

const sessionHasAction = (session, actions) => getEvents(session)
    .some((event) => actions.includes(event?.action));

const getItemId = (value) => (typeof value === 'string' ? value.split(' | ')[0].trim() : null);

const getTimeBuckets = (filterId, now) => {
    const { cutoff } = getAnalyticsWindow(filterId, now);
    const days = filterId === '7j' ? 7 : filterId === '1mois' ? 30 : 12;
    const buckets = [];

    if (filterId === '1ans') {
        for (let index = days - 1; index >= 0; index -= 1) {
            const date = new Date(now);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            date.setMonth(date.getMonth() - index);
            buckets.push({
                key: `${date.getFullYear()}-${date.getMonth()}`,
                label: date.toLocaleDateString('fr-FR', { month: 'short' }),
                start: date.getTime(),
                value: 0
            });
        }
        return buckets;
    }

    for (let index = days - 1; index >= 0; index -= 1) {
        const date = new Date(now);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - index);
        buckets.push({
            key: date.toISOString().slice(0, 10),
            label: date.toLocaleDateString('fr-FR', filterId === '7j'
                ? { weekday: 'short' }
                : { day: '2-digit', month: 'short' }),
            start: date.getTime(),
            value: 0
        });
    }

    return buckets.filter((bucket) => bucket.start >= cutoff - 24 * 60 * 60 * 1000);
};

const buildOverviewModel = (sessions, filterId, now = Date.now()) => {
    const traffic = buildAnalyticsStats(sessions, filterId, { now, maxFetched: MAX_ANALYTICS_SESSIONS });
    const qualifiedSessions = traffic.realTraffic;
    const quoteSessions = qualifiedSessions.filter((session) => getJourney(session)
        .some((step) => getStepKey(step) === 'quote_request'));
    const quoteVisitors = new Set(quoteSessions.map(getReliableVisitorKey));
    const startedSessions = quoteSessions.filter((session) => sessionHasAction(session, ['quote_start']));
    const intentSessions = quoteSessions.filter((session) => sessionHasAction(session, ['quote_email_opened', 'quote_submit']));
    const productMap = new Map();
    const timeline = getTimeBuckets(filterId, now);

    const ensureProduct = (itemId, itemName) => {
        const id = getItemId(itemId);
        if (!id) return null;
        const current = productMap.get(id) || {
            id,
            name: itemName || 'Produit sans nom',
            views: 0,
            favorites: 0,
            carts: 0,
            quoteInterest: 0
        };
        if (itemName && current.name === 'Produit sans nom') current.name = itemName;
        productMap.set(id, current);
        return current;
    };

    quoteSessions.forEach((session) => {
        const sessionTime = toAnalyticsMillis(session.startedAt);
        const bucket = timeline.find((candidate, index) => {
            const next = timeline[index + 1];
            return sessionTime >= candidate.start && (!next || sessionTime < next.start);
        });
        if (bucket) bucket.value += 1;
    });

    qualifiedSessions.forEach((session) => {
        getJourney(session).forEach((step) => {
            const item = ensureProduct(step?.context?.itemId || step?.itemId, step?.context?.itemName);
            if (!item) return;
            if (getStepKey(step) === 'product_detail' || getStepKey(step) === 'detail') item.views += 1;
            if (getStepKey(step) === 'quote_request') item.quoteInterest += 1;
        });
        getEvents(session).forEach((event) => {
            const item = ensureProduct(event?.itemId, event?.itemName);
            if (!item) return;
            if (event.action === 'favorite_add') item.favorites += 1;
            if (event.action === 'cart_add') item.carts += 1;
        });
    });

    const products = [...productMap.values()]
        .filter((product) => product.views || product.favorites || product.carts || product.quoteInterest)
        .sort((left, right) => (
            right.quoteInterest - left.quoteInterest
            || right.carts - left.carts
            || right.favorites - left.favorites
            || right.views - left.views
        ))
        .slice(0, 5);

    return {
        traffic,
        timeline,
        quoteVisitors: quoteVisitors.size,
        quoteSessions: quoteSessions.length,
        started: startedSessions.length,
        intent: intentSessions.length,
        startRate: quoteSessions.length ? (startedSessions.length / quoteSessions.length) * 100 : null,
        intentRate: startedSessions.length ? (intentSessions.length / startedSessions.length) * 100 : null,
        products
    };
};

const Metric = ({ label, value, detail, tone = 'default' }) => (
    <article className="analytics-overview__metric" data-tone={tone} data-analytics-reveal>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
    </article>
);

const QuoteTrend = ({ timeline }) => {
    const width = 690;
    const height = 192;
    const padding = { top: 16, right: 12, bottom: 32, left: 4 };
    const max = Math.max(1, ...timeline.map((point) => point.value));
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const points = timeline.map((point, index) => {
        const x = padding.left + (chartWidth / Math.max(1, timeline.length - 1)) * index;
        const y = padding.top + chartHeight - ((point.value / max) * chartHeight);
        return { ...point, x, y };
    });
    const line = points.map((point) => `${point.x},${point.y}`).join(' ');
    const fill = points.length
        ? `${padding.left},${padding.top + chartHeight} ${line} ${points[points.length - 1].x},${padding.top + chartHeight}`
        : '';
    const labelEvery = timeline.length > 10 ? Math.ceil(timeline.length / 6) : 1;

    return (
        <div className="analytics-overview__trend" aria-label="Évolution des consultations de devis">
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true" preserveAspectRatio="none">
                {[0.33, 0.66, 1].map((linePosition) => (
                    <line
                        key={linePosition}
                        x1={padding.left}
                        x2={width - padding.right}
                        y1={padding.top + chartHeight * linePosition}
                        y2={padding.top + chartHeight * linePosition}
                        className="analytics-overview__gridline"
                    />
                ))}
                {fill && <polygon points={fill} className="analytics-overview__trend-fill" />}
                {line && <polyline points={line} className="analytics-overview__trend-line" />}
                {points.map((point, index) => (
                    <g key={point.key}>
                        <circle cx={point.x} cy={point.y} r="2.7" className="analytics-overview__trend-point" />
                        {(index % labelEvery === 0 || index === points.length - 1) && (
                            <text x={point.x} y={height - 7} textAnchor="middle" className="analytics-overview__trend-label">
                                {point.label}
                            </text>
                        )}
                    </g>
                ))}
            </svg>
        </div>
    );
};

const EmptyOverview = ({ loading, onRefresh, message }) => (
    <section className="analytics-overview__empty" data-analytics-reveal>
        <span className="analytics-overview__eyebrow">État de la donnée</span>
        <h3>{loading ? 'Lecture analytique en cours' : 'Prête à analyser les demandes de devis'}</h3>
        <p>{message || 'La vue conserve un checkpoint local et ne lit Firestore que lorsque vous actualisez les données.'}</p>
        <button type="button" className="analytics-overview__primary" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={15} aria-hidden="true" className={loading ? 'analytics-overview__spin' : ''} />
            {loading ? 'Actualisation…' : 'Actualiser les données'}
        </button>
    </section>
);

const AdminAnalyticsOverview = ({ darkMode = false }) => {
    const rootRef = useRef(null);
    const [timeFilter, setTimeFilter] = useState('1mois');
    const initialCheckpoint = useMemo(() => readCheckpoint(), []);
    const [sessions, setSessions] = useState(() => initialCheckpoint?.sessions || []);
    const [checkpointLoadedAt, setCheckpointLoadedAt] = useState(() => initialCheckpoint?.loadedAt || null);
    const [hasLoaded, setHasLoaded] = useState(Boolean(initialCheckpoint));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeView, setActiveView] = useState('overview');

    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
        const elements = rootRef.current?.querySelectorAll('[data-analytics-reveal]');
        if (!elements?.length) return undefined;
        gsap.fromTo(elements,
            { autoAlpha: 0, y: 8 },
            { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.035, ease: 'power2.out', clearProps: 'transform' }
        );
        return () => gsap.killTweensOf(elements);
    }, [refreshKey, hasLoaded, activeView]);

    const refresh = useCallback(async () => {
        if (document.visibilityState === 'hidden') return;
        setLoading(true);
        setError('');
        try {
            const historyWindow = getAnalyticsWindow('1ans');
            const sessionsQuery = query(
                collection(db, 'analytics_sessions'),
                where('startedAt', '>=', Timestamp.fromMillis(historyWindow.cutoff)),
                orderBy('startedAt', 'desc'),
                limit(MAX_ANALYTICS_SESSIONS)
            );
            const snapshot = await getDocs(sessionsQuery);
            const nextSessions = snapshot.docs
                .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
                .filter((session) => session.type !== 'admin');
            const checkpoint = writeCheckpoint(nextSessions);
            setSessions(nextSessions);
            setCheckpointLoadedAt(checkpoint.loadedAt);
            setHasLoaded(true);
            setRefreshKey((value) => value + 1);
        } catch (refreshError) {
            console.error('Analytics overview refresh error:', refreshError);
            setError('Impossible d’actualiser. Le dernier checkpoint local reste utilisable.');
        } finally {
            setLoading(false);
        }
    }, []);

    const model = useMemo(() => buildOverviewModel(sessions, timeFilter), [sessions, timeFilter]);
    const filterMeta = model.traffic.dataQuality;

    return (
        <section
            ref={rootRef}
            className="analytics-overview"
            data-theme={darkMode ? 'dark' : 'light'}
            data-state={loading ? 'syncing' : error ? 'error' : hasLoaded ? 'ready' : 'empty'}
        >
            <header className="analytics-overview__header analytics-overview__header--compact" data-analytics-reveal>
                <nav className="analytics-overview__view-nav" aria-label="Vues Data">
                    {ANALYTICS_VIEWS.map((view) => (
                        <button key={view.id} type="button" data-active={activeView === view.id} aria-current={activeView === view.id ? 'page' : undefined} onClick={() => setActiveView(view.id)}>
                            {view.label}
                        </button>
                    ))}
                </nav>
                <div className="analytics-overview__toolbar" role="toolbar" aria-label="Période d’analyse">
                    <div className="analytics-overview__periods" aria-label="Choisir une période">
                        {OVERVIEW_FILTERS.map((filterId) => (
                            <button
                                key={filterId}
                                type="button"
                                aria-pressed={timeFilter === filterId}
                                onClick={() => setTimeFilter(filterId)}
                            >
                                {filterId === '7j' ? '7 j' : filterId === '1mois' ? '30 j' : '12 m'}
                            </button>
                        ))}
                    </div>
                    <button type="button" className="analytics-overview__refresh" onClick={refresh} disabled={loading}>
                        <RefreshCw size={15} aria-hidden="true" className={loading ? 'analytics-overview__spin' : ''} />
                        Actualiser
                    </button>
                </div>
            </header>

            <p className="analytics-overview__sync-line" data-analytics-reveal data-role={error ? 'warning' : hasLoaded ? 'success' : 'neutral'} aria-live="polite">
                {loading ? 'Synchronisation en cours' : error ? 'Dernier checkpoint conservé' : hasLoaded ? `${formatCheckpoint(checkpointLoadedAt)} · ${sessions.length} sessions qualifiées en mémoire locale` : 'Aucune donnée chargée'}
                {filterMeta.isFetchCapped ? ' · Période potentiellement partielle' : ''}
            </p>

            {!hasLoaded ? (
                <EmptyOverview loading={loading} onRefresh={refresh} message={error} />
            ) : activeView === 'journeys' ? (
                <AnalyticsJourneyView sessions={model.traffic.realTraffic} />
            ) : activeView === 'sessions' ? (
                <AnalyticsSessionsView sessions={model.traffic.realTraffic} />
            ) : (
                <>
                    <div className="analytics-overview__metrics" data-analytics-reveal>
                        <Metric label="Visiteurs qualifiés" value={formatNumber.format(model.traffic.kpis.uniqueVisitors)} detail={`${formatNumber.format(model.traffic.kpis.totalSessions)} sessions actives sur ${formatFilter(timeFilter)}`} />
                        <Metric label="Consultations devis" value={formatNumber.format(model.quoteVisitors)} detail={`${formatNumber.format(model.quoteSessions)} sessions ont atteint la page`} tone="accent" />
                        <Metric label="Formulaires initiés" value={formatNumber.format(model.started)} detail={model.started ? `${formatPercent(model.startRate)} des consultations devis` : 'Le suivi démarre avec cette version'} />
                        <Metric label="Intentions d’envoi" value={formatNumber.format(model.intent)} detail={model.intent ? `${formatPercent(model.intentRate)} des formulaires initiés` : 'Ouverture du brouillon e-mail suivie'} tone="accent" />
                    </div>

                    <section className="analytics-overview__quote-panel" data-analytics-reveal>
                        <div className="analytics-overview__panel-heading">
                            <div>
                                <span className="analytics-overview__eyebrow">Demande de devis</span>
                                <h4>Mesurer l’intention, sans surinterpréter.</h4>
                            </div>
                            <p>{formatFilter(timeFilter)}</p>
                        </div>

                        <div className="analytics-overview__quote-grid">
                            <div className="analytics-overview__chart-panel">
                                <div className="analytics-overview__chart-label">
                                    <div>
                                        <p>Consultations de la page devis</p>
                                        <strong>{formatNumber.format(model.quoteSessions)}</strong>
                                    </div>
                                    <span>sessions qualifiées</span>
                                </div>
                                <QuoteTrend timeline={model.timeline} />
                            </div>

                            <aside className="analytics-overview__funnel" aria-label="Entonnoir de demande de devis">
                                <div className="analytics-overview__funnel-head">
                                    <p>Progression du formulaire</p>
                                    <span>sur les sessions observées</span>
                                </div>
                                {[
                                    { label: 'Page devis consultée', value: model.quoteSessions, rate: 100 },
                                    { label: 'Formulaire commencé', value: model.started, rate: model.startRate },
                                    { label: 'Brouillon e-mail ouvert', value: model.intent, rate: model.intentRate }
                                ].map((step, index) => (
                                    <div className="analytics-overview__funnel-row" key={step.label}>
                                        <div>
                                            <span>{String(index + 1).padStart(2, '0')}</span>
                                            <p>{step.label}</p>
                                            <strong>{formatNumber.format(step.value)}</strong>
                                        </div>
                                        <div className="analytics-overview__funnel-track" aria-label={`${step.label}: ${formatPercent(step.rate)}`}>
                                            <i style={{ '--analytics-progress': `${Math.max(0, Math.min(step.rate || 0, 100))}%` }} />
                                        </div>
                                        <em>{formatPercent(step.rate)}</em>
                                    </div>
                                ))}
                                <div className="analytics-overview__funnel-note">
                                    <span>À lire correctement</span>
                                    <p>Le formulaire ouvre aujourd’hui un e-mail prérempli. C’est une intention d’envoi, pas encore une demande reçue ni un devis accepté.</p>
                                </div>
                            </aside>
                        </div>
                    </section>

                    <div className="analytics-overview__commercial-grid" data-analytics-reveal>
                        <section className="analytics-overview__surface analytics-overview__product-performance">
                            <div className="analytics-overview__surface-head">
                                <div>
                                    <span className="analytics-overview__eyebrow">Produits</span>
                                    <h4>Performance commerciale des produits</h4>
                                </div>
                                <span className="analytics-overview__subtle">signaux observés</span>
                            </div>
                            {model.products.length ? (
                                <div className="analytics-overview__product-table" role="table" aria-label="Performance commerciale des produits">
                                    <div className="analytics-overview__product-head" role="row">
                                        <span role="columnheader">Produit</span><span role="columnheader">Vues</span><span role="columnheader">Favoris</span><span role="columnheader">Paniers</span><span role="columnheader">Intérêt devis</span>
                                    </div>
                                    {model.products.map((product) => (
                                        <div className="analytics-overview__product-row" role="row" key={product.id}>
                                            <strong role="cell">{product.name}</strong>
                                            <span role="cell">{formatNumber.format(product.views)}</span>
                                            <span role="cell">{formatNumber.format(product.favorites)}</span>
                                            <span role="cell">{formatNumber.format(product.carts)}</span>
                                            <span role="cell" data-emphasis={product.quoteInterest > 0}>{formatNumber.format(product.quoteInterest)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="analytics-overview__empty-copy">Les produits consultés apparaîtront ici dès les premières sessions qualifiées de la période.</p>
                            )}
                        </section>

                        <section className="analytics-overview__surface analytics-overview__quote-pilotage">
                            <div className="analytics-overview__surface-head">
                                <div>
                                    <span className="analytics-overview__eyebrow">Devis</span>
                                    <h4>Pilotage commercial des demandes</h4>
                                </div>
                                <span className="analytics-overview__subtle">workflow à connecter</span>
                            </div>
                            <div className="analytics-overview__pipeline-stages" aria-label="Étapes de traitement des devis">
                                {['Reçus', 'À qualifier', 'Proposition envoyée', 'Acceptés', 'Sans suite'].map((stage) => (
                                    <div key={stage}>
                                        <span>{stage}</span>
                                        <strong>—</strong>
                                    </div>
                                ))}
                            </div>
                            <div className="analytics-overview__pipeline-empty">
                                <span>Réception non connectée</span>
                                <p>Le formulaire ouvre encore l’e-mail de la cliente. Dès qu’une demande est enregistrée, elle pourra être qualifiée, chiffrée puis suivie jusqu’à la décision ici.</p>
                            </div>
                        </section>
                    </div>
                </>
            )}
        </section>
    );
};

export default AdminAnalyticsOverview;
