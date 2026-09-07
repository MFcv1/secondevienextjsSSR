import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAdminPreference } from './useAdminPreference';
import { getAdminCachedData, loadAdminCachedData, getAdminCacheGeneration, subscribeAdminCacheGeneration } from './adminDataCache';
import { Smartphone, Monitor, Globe, Trash2, AlertCircle, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';

import { getCallableFunction } from '../config/firebaseLazy';
import { dataPerformance, recordDataServerTimings, startDataPerformance } from './adminAnalyticsPerformance';
import { ANALYTICS_REALTIME_ENABLED, useAnalyticsRealtime } from './adminAnalyticsRealtime';
import { realtimeOverview } from './adminAnalyticsRealtimeStore';
import { useLiveSessions, liveSessionsChannel, listenSessionDetail } from './liveSessionsChannel';
import { isSessionOnline, LIVE_PRESENCE_MS } from './liveSessionPresence';
import { CATEGORY_RAIL_IMAGE_SOURCES } from '../config/constants';
import { getProductImageItems } from '../../utils/imageUtils';
import { getProductUrl } from '../../utils/slug';
import { getMillis } from '../../utils/time';
import { ANALYTICS_TIME_FILTERS, MAX_ANALYTICS_SESSIONS, buildVisitorDayGroups, buildAnalyticsStats } from './analyticsReliability';

let cachedAnalyticsSessions = null;
let cachedAnalyticsSessionsLoadedAt = null;

const cachedAnalyticsOverviews = new Map();
let cachedAnalyticsOverviewBundlePromise = null;

const ADMIN_ANALYTICS_REFRESH_TTL_MS = 5 * 60 * 1000;
const ADMIN_SESSION_PAGE_SIZE = 10;
const ADMIN_SESSIONS_CACHE_KEY = 'traffic-sessions-v2';
const ADMIN_OVERVIEWS_CACHE_KEY = 'traffic-overviews-v1';

const JOURNEY_PAGE_ILLUSTRATIONS = Object.freeze({
    gallery: '/images/analytics/journey-gallery-boutique-v3.webp',
    about: '/images/analytics/journey-about-emblem-v2.webp',
    quote: '/images/analytics/journey-quote-atelier-v3.webp',
});

// Les données privées suivent l'identité autorisée et ne sont plus persistées sur disque.
const readAdminAnalyticsCache = async (key) => getAdminCachedData(`analytics:${key}`);
const writeAdminAnalyticsCache = async (key, data, loadedAt) => {
    try {
        await loadAdminCachedData(`analytics:${key}`, async () => ({ data, loadedAt }), {
            force: true, maxAgeMs: ADMIN_ANALYTICS_REFRESH_TTL_MS,
        });
    } catch { /* Une révocation invalide aussi les écritures tardives. */ }
};
subscribeAdminCacheGeneration(() => {
    cachedAnalyticsSessions = null;
    cachedAnalyticsSessionsLoadedAt = null;
    cachedAnalyticsOverviews.clear();
    cachedAnalyticsOverviewBundlePromise = null;
});

// ─── Custom SVG Bar Chart — Premium responsive (remplace Recharts) ──
const TrafficChart = ({ data, darkMode, valueLabel = 'visite', animationKey = 0 }) => {
    const containerRef = useRef(null);
    const [dims, setDims] = useState({ w: 600, h: 280 });
    const [activeIdx, setActiveIdx] = useState(null);
    const isMobile = dims.w < 500;

    // Marges adaptatives (plus serrées sur mobile)
    const margin = useMemo(() => ({
        top: 20,
        right: isMobile ? 8 : 16,
        bottom: isMobile ? 28 : 36,
        left: isMobile ? 28 : 40
    }), [isMobile]);

    const chartW = dims.w - margin.left - margin.right;
    const chartH = dims.h - margin.top - margin.bottom;

    // ── ResizeObserver ──
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) setDims({ w: width, h: height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // ── Calculs du graphique ──
    const maxVal = useMemo(() => Math.max(1, ...data.map(d => d.visites)), [data]);

    // Y ticks intelligents (moins de ticks sur mobile)
    const yTicks = useMemo(() => {
        const count = isMobile ? 3 : 5;
        const ticks = [];
        const step = Math.max(1, Math.ceil(maxVal / count));
        for (let i = 0; i <= maxVal; i += step) ticks.push(i);
        if (ticks[ticks.length - 1] < maxVal) ticks.push(maxVal);
        return ticks;
    }, [maxVal, isMobile]);

    // Dimensions des barres — minimum garanti pour tactile
    const barMetrics = useMemo(() => {
        const n = data.length;
        if (n === 0) return { barW: 0, gap: 0, total: 0 };

        // Desktop : gap proportionnel, Mobile : gap minimal pour maximiser barW
        const gapRatio = isMobile ? 0.15 : 0.25;
        const totalGaps = n > 1 ? (n - 1) : 0;

        // Calcul avec un minimum de 4px par barre (visible) et 1px de gap
        let gap = Math.max(1, Math.round((chartW * gapRatio) / Math.max(1, totalGaps)));
        let barW = n > 0 ? (chartW - gap * totalGaps) / n : 0;

        // Si les barres sont trop fines, on réduit le gap
        if (barW < 4 && n > 1) {
            gap = 1;
            barW = (chartW - gap * totalGaps) / n;
        }

        // Minimum absolu de largeur de barre
        barW = Math.max(isMobile ? 3 : 4, barW);

        // Cap la largeur max — plafond serré pour une cohérence visuelle quel que soit le nb de barres
        barW = Math.min(barW, isMobile ? 18 : 28);

        return { barW, gap, total: n };
    }, [data.length, chartW, isMobile]);

    // Labels X — espacement intelligent selon la taille
    const xLabelInterval = useMemo(() => {
        const maxLabels = isMobile ? 5 : 10;
        return Math.max(1, Math.ceil(data.length / maxLabels));
    }, [data.length, isMobile]);

    // ── Handlers d'interaction (Scrubbing global) ──
    const handlePointerAction = useCallback((e) => {
        // Support pour Event de Souris et Touch natif dans React
        const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
        if (clientX === undefined) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const localX = clientX - rect.left;

        const slotW = barMetrics.barW + barMetrics.gap;
        let idx = Math.floor(localX / slotW);
        // Empêcher le débordement des index
        idx = Math.max(0, Math.min(barMetrics.total - 1, idx));

        setActiveIdx(idx);
    }, [barMetrics]);

    const handlePointerLeave = useCallback(() => {
        setActiveIdx(null);
    }, []);

    // ── Calcul position tooltip (ancré au-dessus de la barre) ──
    const tooltipInfo = useMemo(() => {
        if (activeIdx === null || !data[activeIdx]) return null;
        const d = data[activeIdx];
        const barX = margin.left + activeIdx * (barMetrics.barW + barMetrics.gap) + barMetrics.barW / 2;
        const barH = d.visites > 0 ? Math.max(2, (d.visites / maxVal) * chartH) : 0;
        const barTopY = margin.top + chartH - barH;

        // Tooltip au-dessus de la barre, centré horizontalement
        let tooltipX = barX;
        let tooltipY = barTopY - 12;

        // Clamper pour ne pas déborder
        const tooltipW = 100;
        tooltipX = Math.max(tooltipW / 2 + 4, Math.min(dims.w - tooltipW / 2 - 4, tooltipX));
        tooltipY = Math.max(4, tooltipY);

        return { x: tooltipX, y: tooltipY, d };
    }, [activeIdx, data, barMetrics, maxVal, chartH, margin, dims.w]);

    return (
        <div ref={containerRef} className="w-full h-full relative select-none"
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'pan-y' }}
            onMouseLeave={() => setActiveIdx(null)}
        >
            <svg width={dims.w} height={dims.h} style={{ display: 'block' }}>
                <defs>
                    <linearGradient id="svgBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="svgBarGradActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.85} />
                    </linearGradient>
                    <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <g transform={`translate(${margin.left},${margin.top})`}>
                    {/* Grille horizontale */}
                    {yTicks.map(tick => {
                        const y = chartH - (tick / maxVal) * chartH;
                        return (
                            <line key={`grid-${tick}`} x1={0} y1={y} x2={chartW} y2={y}
                                stroke={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
                                strokeDasharray="4 4"
                            />
                        );
                    })}

                    {/* Labels Y */}
                    {yTicks.map(tick => {
                        const y = chartH - (tick / maxVal) * chartH;
                        return (
                            <text key={`y-${tick}`} x={-8} y={y + 3.5}
                                textAnchor="end" fontSize={isMobile ? 9 : 10}
                                fill={darkMode ? '#57534e' : '#a8a29e'}
                                fontWeight={500}
                            >{tick}</text>
                        );
                    })}

                    {/* Ligne de base */}
                    <line x1={0} y1={chartH} x2={chartW} y2={chartH}
                        stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
                        strokeWidth={1}
                    />

                    {/* Barres */}
                    {data.map((d, i) => {
                        const x = i * (barMetrics.barW + barMetrics.gap);
                        const h = d.visites > 0 ? Math.max(3, (d.visites / maxVal) * chartH) : 0;
                        const y = chartH - h;
                        const isActive = activeIdx === i;
                        const bw = barMetrics.barW;
                        const radius = Math.min(3, bw / 2);

                        return (
                            <g key={`${animationKey}-${i}`}>
                                {/* Barre active : glow + agrandissement */}
                                {isActive && d.visites > 0 && (
                                    <rect
                                        x={x - Math.min(3, bw * 0.3)}
                                        y={Math.max(0, y - 5)}
                                        width={bw + Math.min(6, bw * 0.6)}
                                        height={h + 5}
                                        rx={radius + 1} ry={radius + 1}
                                        fill="url(#svgBarGradActive)"
                                        filter="url(#glowFilter)"
                                    />
                                )}

                                {/* Barre au repos */}
                                {!isActive && d.visites > 0 && (
                                    <rect
                                        x={x} y={y}
                                        width={bw} height={h}
                                        rx={radius} ry={radius}
                                        fill="url(#svgBarGrad)"
                                    >
                                        <animate attributeName="height" from="0" to={h} dur="520ms" begin={`${Math.min(i * 18, 260)}ms`} fill="freeze" />
                                        <animate attributeName="y" from={chartH} to={y} dur="520ms" begin={`${Math.min(i * 18, 260)}ms`} fill="freeze" />
                                    </rect>
                                )}

                                {/* Indicateur slot vide (dot subtil) */}
                                {d.visites === 0 && !isActive && (
                                    <circle
                                        cx={x + bw / 2} cy={chartH - 1}
                                        r={isMobile ? 1 : 1.5}
                                        fill={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Labels X */}
                    {data.map((d, i) => {
                        if (i % xLabelInterval !== 0) return null;
                        const x = i * (barMetrics.barW + barMetrics.gap) + barMetrics.barW / 2;
                        return (
                            <text key={`x-${i}`} x={x} y={chartH + (isMobile ? 16 : 22)}
                                textAnchor="middle" fontSize={isMobile ? 8 : 10}
                                fill={darkMode ? '#57534e' : '#a8a29e'}
                                fontWeight={500}
                            >{d.name}</text>
                        );
                    })}

                    {/* OVERLAY GLOBAL POUR LE SCRUBBING (TACTILE ET SOURIS) */}
                    <rect
                        x={0} y={0} width={chartW} height={chartH}
                        fill="rgba(0,0,0,0)"
                        onPointerDown={handlePointerAction}
                        onPointerMove={handlePointerAction}
                        onPointerLeave={handlePointerLeave}
                        onTouchStart={handlePointerAction}
                        onTouchMove={handlePointerAction}
                        onTouchEnd={handlePointerLeave}
                        style={{ cursor: 'crosshair', pointerEvents: 'all', touchAction: 'pan-y' }}
                    />
                </g>
            </svg>

            {/* ── Tooltip flottant (ancré au-dessus de la barre) ── */}
            {tooltipInfo && tooltipInfo.d.visites > 0 && (
                <div style={{
                    position: 'absolute',
                    left: tooltipInfo.x,
                    top: tooltipInfo.y,
                    transform: 'translate(-50%, -100%)',
                    background: darkMode ? 'rgba(28, 25, 23, 0.95)' : 'rgba(255, 255, 255, 0.97)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: isMobile ? '10px' : '14px',
                    padding: isMobile ? '6px 10px' : '8px 14px',
                    boxShadow: darkMode
                        ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                        : '0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
                    pointerEvents: 'none',
                    zIndex: 50,
                    whiteSpace: 'nowrap',
                    transition: 'left 0.12s cubic-bezier(0.4,0,0.2,1), top 0.12s cubic-bezier(0.4,0,0.2,1), opacity 0.15s',
                    opacity: 1,
                }}>
                    {/* Petite flèche vers le bas */}
                    <div style={{
                        position: 'absolute',
                        bottom: -5,
                        left: '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        width: 10, height: 10,
                        background: darkMode ? 'rgba(28, 25, 23, 0.95)' : 'rgba(255, 255, 255, 0.97)',
                        boxShadow: darkMode ? '2px 2px 4px rgba(0,0,0,0.3)' : '2px 2px 4px rgba(0,0,0,0.08)',
                    }} />
                    <div style={{
                        position: 'relative', zIndex: 1,
                        fontSize: isMobile ? '9px' : '10px',
                        color: '#78716c', fontWeight: 700, marginBottom: '1px'
                    }}>
                        {tooltipInfo.d.name}
                    </div>
                    <div style={{
                        position: 'relative', zIndex: 1,
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: 900, color: '#10b981', textTransform: 'uppercase',
                        letterSpacing: '0.02em'
                    }}>
                        {tooltipInfo.d.visites} {valueLabel}{tooltipInfo.d.visites > 1 ? 's' : ''}
                    </div>
                    {tooltipInfo.d.sessions !== undefined && tooltipInfo.d.sessions !== tooltipInfo.d.visites && (
                        <div style={{
                            position: 'relative', zIndex: 1,
                            fontSize: isMobile ? '9px' : '10px',
                            fontWeight: 800, color: darkMode ? '#a8a29e' : '#78716c',
                            textTransform: 'uppercase'
                        }}>
                            {tooltipInfo.d.sessions} session{tooltipInfo.d.sessions > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Présentation des parcours ───────────────────────────────────────────────

const PAGE_LABELS = {
    gallery: 'Galerie',
    category: 'Categorie',
    detail: 'Fiche produit',
    about: 'A propos',
    quote: 'Devis',
    search: 'Recherche',
    wishlist: 'Favoris',
    checkout: 'Checkout',
    'my-orders': 'Mes commandes',
    login: 'Connexion',
};

const AFFILIATE_JOURNEY_LABELS = {
    affiliate_shop_grid: 'Clic Comptoir',
    affiliate_shop_detail: 'Achat depuis fiche Comptoir',
    affiliate_shop_tutorial: 'Clic Tutoriel Comptoir',
    affiliate_gallery_detail: 'Clic depuis fiche meuble',
    comptoir: 'Clic Comptoir',
};


const isAffiliateJourneyStep = (page) => page === 'comptoir' || String(page || '').startsWith('affiliate_');

const formatJourneyStepTime = (session, step) => {
    const exact = getMillis(step?.timestampMs || step?.clientAtMs || step?.at);
    if (exact) return new Date(exact).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return step?.time || '--:--';
};

const getJourneyProductKey = (step) => {
    if (step?.page !== 'detail') return null;
    const raw = String(step?.itemId || '').trim();
    if (!raw) return null;
    return raw
        .replace(/\s*\[(depuis|source):\s*[^\]]+\]\s*$/i, '')
        .split('|')[0]
        .trim();
};

const getJourneyItemIdentity = (step) => {
    const id = String(step?.itemId || '').trim();
    if (!id || isAffiliateJourneyStep(step?.page)) return null;

    if (step.page === 'detail') return { label: 'ID', tone: 'product', id };
    if (step.page === 'category') return { label: 'ID', tone: 'category', id };
    return { label: 'ID', tone: 'content', id };
};

const getJourneyIllustration = (step) => {
    if (step?.page === 'category') {
        const categoryId = String(step?.itemId || '').trim().toLocaleLowerCase('fr-FR');
        return CATEGORY_RAIL_IMAGE_SOURCES[categoryId] || '/images/categories/fallback.webp';
    }

    return JOURNEY_PAGE_ILLUSTRATIONS[step?.page] || null;
};

const buildProductThumbnailMap = (items) => {
    const thumbnails = new Map();
    (Array.isArray(items) ? items : []).forEach((item) => {
        const [primary] = getProductImageItems(item);
        const src = primary?.thumb320
            || primary?.thumb384
            || primary?.thumb
            || primary?.card
            || item?.thumbnailUrl
            || item?.imageUrl
            || '';
        if (!src) return;

        const productPath = getProductUrl(item);
        const pathKey = decodeURIComponent(String(productPath).split('/').filter(Boolean).pop() || '');
        [item?.id, item?.originalId, pathKey]
            .map(value => String(value || '').trim())
            .filter(Boolean)
            .forEach(key => thumbnails.set(key, src));
    });
    return thumbnails;
};

const getJourneyLabel = (page) => AFFILIATE_JOURNEY_LABELS[page] || PAGE_LABELS[page] || page || 'Inconnu';
const getJourneyAccent = (page) => {
    if (page === 'shop') return { dot: 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]', text: 'text-violet-400/60', label: 'text-violet-400', chip: 'bg-indigo-500/10 text-indigo-400/80 border-indigo-500/10' };
    if (isAffiliateJourneyStep(page)) return { dot: 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.4)]', text: 'text-teal-400/60', label: 'text-teal-400', chip: 'bg-teal-500/10 text-teal-400/80 border-teal-500/10' };
    if (page === 'delivery') return { dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]', text: 'text-emerald-500/60', label: 'text-emerald-500', chip: 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/10' };
    return { dot: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]', text: 'text-blue-500/60', label: 'text-amber-500', chip: 'bg-indigo-500/10 text-indigo-400/80 border-indigo-500/10' };
};

const getJourneyStepPageDuration = (session, index) => {
    const journey = Array.isArray(session?.journey) ? session.journey : [];
    const nextDuration = Number(journey[index + 1]?.duration);
    if (Number.isFinite(nextDuration) && nextDuration > 0) return nextDuration;

    const elapsedBeforeLastStep = journey.reduce((sum, step, stepIndex) => {
        if (stepIndex === 0 || stepIndex > index) return sum;
        const value = Number(step?.duration);
        return sum + (Number.isFinite(value) && value > 0 ? value : 0);
    }, 0);
    const sessionDuration = Number(session?.duration);
    if (!Number.isFinite(sessionDuration) || sessionDuration <= elapsedBeforeLastStep) return 0;
    return Math.max(0, Math.round(sessionDuration - elapsedBeforeLastStep));
};

const SessionJourneyTrace = ({ session, darkMode, formatDuration, productThumbnails }) => (
    <div className={`p-4 border-t ${darkMode ? 'border-white/5 bg-black/20' : 'border-stone-100 bg-white'} animate-in slide-in-from-top-2 duration-300`}>
        <div className="space-y-5">
            <div className="flex items-center justify-between px-1">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">Parcours Utilisateur</h4>
                <span className="text-[8px] font-bold text-stone-600 opacity-60 uppercase tracking-tighter">{session.journey?.length || 0} Etapes</span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-stone-800 lg:grid lg:[grid-template-columns:repeat(auto-fit,minmax(210px,1fr))] lg:gap-x-3 lg:gap-y-7 lg:space-y-0 lg:pl-0 lg:before:hidden">
                {!session.journey || session.journey.length === 0 ? (
                    <p className="text-[10px] italic text-stone-500">{!session.journey ? 'Parcours en cours de chargement ou indisponible' : 'Aucune activite enregistree'}</p>
                ) : (
                    session.journey.map((step, idx) => {
                        const accent = getJourneyAccent(step.page);
                        const stepLabel = getJourneyLabel(step.page);
                        const isAffiliateStep = isAffiliateJourneyStep(step.page);
                        const pageDuration = getJourneyStepPageDuration(session, idx);
                        const productKey = getJourneyProductKey(step);
                        const productThumbnail = productKey ? productThumbnails?.get(productKey) : null;
                        const journeyIllustration = productThumbnail || getJourneyIllustration(step);
                        const itemIdentity = getJourneyItemIdentity(step);
                        const itemIdentityTone = itemIdentity?.tone === 'category'
                            ? (darkMode
                                ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-950')
                            : itemIdentity?.tone === 'product'
                                ? (darkMode
                                    ? 'border-sky-300/20 bg-sky-400/10 text-sky-100'
                                    : 'border-sky-200 bg-sky-50 text-sky-950')
                                : (darkMode
                                    ? 'border-white/10 bg-white/5 text-stone-200'
                                    : 'border-stone-200 bg-stone-100 text-stone-800');
                        const itemIdentityLabelTone = itemIdentity?.tone === 'category'
                            ? (darkMode ? 'border-emerald-300/15 bg-emerald-300/10 text-emerald-200' : 'border-emerald-200 bg-emerald-100/80 text-emerald-800')
                            : itemIdentity?.tone === 'product'
                                ? (darkMode ? 'border-sky-300/15 bg-sky-300/10 text-sky-200' : 'border-sky-200 bg-sky-100/80 text-sky-800')
                                : (darkMode ? 'border-white/10 bg-white/5 text-stone-300' : 'border-stone-200 bg-stone-200/70 text-stone-700');
                        return (
                            <div key={idx} className="relative lg:min-w-0 lg:px-2 lg:pt-6 lg:before:absolute lg:before:inset-x-0 lg:before:top-0 lg:before:h-px lg:before:bg-stone-950/75">
                                <div className={`absolute -left-[18.5px] top-1.5 w-[7px] h-[7px] rounded-full ring-4 lg:left-0 lg:top-0 lg:-translate-x-1/2 lg:-translate-y-1/2 ${darkMode ? 'ring-stone-900/50' : 'ring-white'} ${accent.dot}`}></div>

                                <div className={`flex items-start justify-between gap-3 -translate-y-0.5 lg:min-h-[104px] lg:rounded-[18px] lg:px-3.5 lg:py-2.5 lg:translate-y-0 lg:ring-1 ${darkMode ? 'lg:bg-white/[0.035] lg:ring-white/10 lg:shadow-[0_18px_28px_-26px_rgba(0,0,0,0.85)]' : 'lg:bg-stone-50/90 lg:ring-stone-950/[0.045] lg:shadow-[0_18px_28px_-26px_rgba(28,25,23,0.48)]'}`}>
                                    <div className="flex min-w-0 flex-1 flex-col gap-1 lg:min-h-[84px] lg:justify-between lg:py-0.5">
                                        <div className="inline-flex items-center gap-1 whitespace-nowrap leading-none">
                                            <time className={`font-mono text-[9px] font-bold tracking-[0.02em] ${darkMode ? 'text-blue-100' : 'text-blue-700'}`}>
                                                {formatJourneyStepTime(session, step)}
                                            </time>
                                            <span aria-hidden="true" className="text-[9px] font-semibold text-stone-400">/</span>
                                            <span className={darkMode ? 'text-[9px] font-bold text-stone-200' : 'text-[9px] font-bold text-stone-700'}>
                                                {formatDuration(pageDuration)}
                                            </span>
                                        </div>
                                        <p className="flex flex-wrap items-baseline gap-x-1 text-[10px] leading-[1.3]">
                                            <span className={darkMode ? 'font-semibold text-stone-300' : 'font-semibold text-stone-600'}>{isAffiliateStep ? 'Clic' : 'Vue'}</span>
                                            <span aria-hidden="true" className="font-medium text-stone-300">·</span>
                                            <span className={darkMode ? 'font-bold tracking-[0.01em] text-stone-50' : 'font-bold tracking-[0.01em] text-stone-950'}>{stepLabel}</span>
                                        </p>
                                        {itemIdentity && (
                                            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
                                                <span className={`inline-flex max-w-full overflow-hidden rounded-md border text-[9px] font-semibold leading-none ${itemIdentityTone}`}>
                                                    <span className={`shrink-0 border-r px-1.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${itemIdentityLabelTone}`}>
                                                        {itemIdentity.label}
                                                    </span>
                                                    <span className="min-w-0 truncate px-1.5 py-1 font-mono text-[9px]" title={itemIdentity.id}>
                                                        {itemIdentity.id}
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                        {!itemIdentity && <div aria-hidden="true" className="hidden lg:block lg:h-[18px]"></div>}
                                    </div>
                                    {journeyIllustration && (
                                        <img
                                            src={journeyIllustration}
                                            alt=""
                                            aria-hidden="true"
                                            loading="lazy"
                                            decoding="async"
                                            className={`h-14 w-11 shrink-0 rounded-lg border object-cover shadow-sm lg:h-[84px] lg:w-[66px] ${darkMode ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50'}`}
                                        />
                                    )}
                                    {!journeyIllustration && (
                                        <div
                                            aria-hidden="true"
                                            className={`hidden shrink-0 rounded-lg lg:block lg:h-[84px] lg:w-[66px] lg:ring-1 ${darkMode ? 'lg:bg-white/[0.025] lg:ring-white/[0.06]' : 'lg:bg-stone-950/[0.025] lg:ring-stone-950/[0.035]'}`}
                                        ></div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    </div>
);

const VisitorSessionGroup = ({
    darkMode,
    visitor,
    now,
    isOpen,
    onToggle,
    expandedSessionId,
    onToggleSessionDetail,
    handleDeleteSession,
    formatDuration,
    productThumbnails
}) => {
    const lastTime = visitor.lastActivityAt
        ? new Date(visitor.lastActivityAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : '--:--';

    return (
        <div className={`rounded-xl border overflow-hidden transition-all ${darkMode ? 'bg-stone-900 border-white/5 hover:border-white/10' : 'bg-stone-50 border-stone-100 shadow-sm'}`}>
            <button
                onClick={onToggle}
                className="w-full p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-colors hover:bg-white/[0.03] active:scale-[0.995]"
            >
                <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${darkMode ? 'bg-white/5' : 'bg-white border border-stone-200'}`}>
                        {isOpen ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 overflow-hidden">
                            <Globe size={11} className="text-stone-500 shrink-0" />
                            <span className={`text-[10px] font-black truncate ${darkMode ? 'text-white/80' : 'text-stone-900'}`}>{visitor.locationLabel}</span>
                            {visitor.isActive ? (
                                <span className="text-[8px] font-black uppercase text-emerald-500 animate-pulse shrink-0">En ligne</span>
                            ) : (
                                <span className="text-[8px] font-black uppercase text-stone-600 shrink-0">Termine</span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold text-stone-500 uppercase">
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                                {visitor.device === 'Mobile' ? <Smartphone size={10} className="shrink-0" /> : <Monitor size={10} className="shrink-0" />}
                                <span className="truncate">{visitor.deviceLabel}</span>
                            </span>
                            <span className="font-mono normal-case">Visiteur pseudonymisé</span>
                            <span>{visitor.identitySource}</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:min-w-[260px] text-right">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-500 leading-none">Sessions</p>
                        <p className={`mt-1 text-xs font-black tabular-nums ${darkMode ? 'text-white' : 'text-stone-900'}`}>{visitor.sessionCount}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-500 leading-none">Duree</p>
                        <p className={`mt-1 text-xs font-black tabular-nums ${darkMode ? 'text-white' : 'text-stone-900'}`}>{formatDuration(visitor.totalDuration)}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-500 leading-none">Dernier</p>
                        <p className={`mt-1 text-xs font-black tabular-nums ${darkMode ? 'text-white' : 'text-stone-900'}`}>{lastTime}</p>
                    </div>
                </div>
            </button>

            {isOpen && (
                <div className={`border-t ${darkMode ? 'border-white/5 bg-black/10' : 'border-stone-100 bg-white/70'}`}>
                    {visitor.sessions.map(session => {
                        const isExpanded = expandedSessionId === session.id;
                        const lastActiveMs = getMillis(session.lastActivityAt);
                        const isInactive = (now - lastActiveMs) > LIVE_PRESENCE_MS;
                        const isFinished = session.sessionActive === false || isInactive;
                        const startedTime = session.startedAt ? new Date(getMillis(session.startedAt)).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

                        return (
                            <div key={session.id} className={`border-t first:border-t-0 ${darkMode ? 'border-white/5' : 'border-stone-100'}`}>
                                <div className="p-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex flex-col min-w-[44px] shrink-0">
                                            <span className="text-[10px] font-black text-stone-500 tabular-nums">{startedTime}</span>
                                            <span className={`text-[8px] font-black uppercase ${isFinished ? 'text-stone-600' : 'text-emerald-500 animate-pulse'}`}>
                                                {isFinished ? 'Termine' : 'En ligne'}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-[10px] font-black truncate ${darkMode ? 'text-stone-300' : 'text-stone-900'}`}>
                                                Session {session.journeyCount || session.journey?.length || 0} etape{(session.journeyCount || session.journey?.length || 0) > 1 ? 's' : ''}
                                            </p>
                                            <p className="text-[9px] font-bold text-stone-500 truncate uppercase">
                                                {session.os || 'Inconnu'} - {session.browser || 'Inconnu'} - {formatDuration(session.duration)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => onToggleSessionDetail(session.id)}
                                            className={`px-3 py-1.5 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${isExpanded ? 'bg-blue-500 text-white' : (darkMode ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-white border border-stone-200 text-stone-600')}`}
                                        >
                                            {isExpanded ? 'Masquer' : 'Tracer'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSession(session.id)}
                                            className="p-1.5 text-stone-500 hover:text-red-500 transition-colors active:scale-90"
                                            aria-label="Supprimer la session"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <SessionJourneyTrace
                                        session={session}
                                        darkMode={darkMode}
                                        formatDuration={formatDuration}
                                        productThumbnails={productThumbnails}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Analytics Principal ───────────────────────────────────────────────────────
const AdminAnalytics = ({ darkMode = false, items = [], onLoadCatalog }) => {
    const [legacySessions, setSessions] = useState(() => cachedAnalyticsSessions || []);
    const liveSessionState = useLiveSessions();
    const [liveDetail, setLiveDetail] = useState(null);
    const [detailStatus, setDetailStatus] = useState('idle');
    const sessions = useMemo(() => ANALYTICS_REALTIME_ENABLED
        ? liveSessionState.sessions.map(session => liveDetail?.id === session.id ? { ...session, ...liveDetail } : session)
        : legacySessions, [legacySessions, liveSessionState.sessions, liveDetail]);
    const [loading, setLoading] = useState(false);
    const [restoringSessions, setRestoringSessions] = useState(() => cachedAnalyticsSessions === null);
    const [timeFilter, setTimeFilter] = useAdminPreference('data:period', '1j');
    const overviewRequestRef = useRef(0);
    const sessionsRequestRef = useRef(0);
    useEffect(() => {
        const requests = sessionsRequestRef;
        return () => { requests.current++; };
    }, []);
    useEffect(() => {
        const requests = overviewRequestRef;
        requests.current++;
        return () => { requests.current++; };
    }, [timeFilter]);
    const [expandedSessionId, setExpandedSessionId] = useState(null);
    const selectedExists = liveSessionState.sessions.some(session => session.id === expandedSessionId);
    useEffect(() => {
        if (expandedSessionId) void Promise.resolve(onLoadCatalog?.()).catch(() => {});
    }, [expandedSessionId, onLoadCatalog]);
    useEffect(() => {
        setLiveDetail(null);
        if (!ANALYTICS_REALTIME_ENABLED || !expandedSessionId || !selectedExists) { setDetailStatus('idle'); return; }
        let stop = null, generation = 0;
        const update = () => {
            generation++; stop?.(); stop = null;
            if (document.visibilityState === 'hidden') { setLiveDetail(null); setDetailStatus('idle'); return; }
            setDetailStatus('loading');
            const current = generation;
            stop = listenSessionDetail(expandedSessionId, value => {
                if (current !== generation) return;
                setLiveDetail(value); setDetailStatus(value ? 'ready' : 'missing');
            }, () => { if (current === generation) { setLiveDetail(null); setDetailStatus('error'); } });
        };
        update(); document.addEventListener('visibilitychange', update);
        return () => { generation++; stop?.(); document.removeEventListener('visibilitychange', update); };
    }, [expandedSessionId, selectedExists]);
    const [now, setNow] = useState(Date.now());
    const [liveNow, setLiveNow] = useState(Date.now());
    const [currentPage, setCurrentPage] = useState(1);
    const DAYS_PER_PAGE = 10;
    const [openVisitors, setOpenVisitors] = useState({});
    const [sessionsRefreshKey, setSessionsRefreshKey] = useState(() => cachedAnalyticsSessionsLoadedAt || 0);
    const [legacyOverview, setOverview] = useState(() => cachedAnalyticsOverviews.get('1j')?.data || null);
    const [legacyOverviewStatus, setOverviewStatus] = useState(() => (
        cachedAnalyticsOverviews.get('1j')?.data ? 'ready' : 'restoring'
    ));
    const [restoringOverviews, setRestoringOverviews] = useState(() => cachedAnalyticsOverviews.size === 0);
    const [nextBeforeMillis, setNextBeforeMillis] = useState(null);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const initialRecentSyncRef = useRef(false);
    const performanceTraceRef = useRef(null);
    const overviewSourceRef = useRef(cachedAnalyticsOverviews.get('1j')?.data ? 'memory' : 'none');
    const realtime = useAnalyticsRealtime();
    const liveOverview = useMemo(() => realtimeOverview(realtime.data, timeFilter, liveNow), [realtime.data, timeFilter, liveNow]);
    const overview = ANALYTICS_REALTIME_ENABLED ? liveOverview : legacyOverview;
    const overviewStatus = ANALYTICS_REALTIME_ENABLED
        ? (liveOverview ? 'ready' : realtime.status === 'error' ? 'error' : 'loading') : legacyOverviewStatus;
    if (ANALYTICS_REALTIME_ENABLED) overviewSourceRef.current = realtime.status === 'cached' ? 'memory' : 'server';
    const productThumbnails = useMemo(() => buildProductThumbnailMap(items), [items]);

    useEffect(() => {
        performanceTraceRef.current = dataPerformance.current() || startDataPerformance('open');
        dataPerformance.mark('component.commit', { trace: performanceTraceRef.current });
    }, []);

    useEffect(() => {
        const trace = performanceTraceRef.current;
        if (overviewStatus !== 'ready' || !trace) return undefined;
        dataPerformance.mark('overview.ready', { trace, source: overviewSourceRef.current });
        let secondFrame;
        const firstFrame = requestAnimationFrame(() => {
            secondFrame = requestAnimationFrame(() => {
                dataPerformance.mark('kpi.frame', { trace, source: overviewSourceRef.current });
            });
        });
        return () => {
            cancelAnimationFrame(firstFrame);
            if (secondFrame !== undefined) cancelAnimationFrame(secondFrame);
        };
    }, [overview, overviewStatus, timeFilter]);

    useEffect(() => {
        let cancelled = false;
        const authorization = getAdminCacheGeneration();
        if (ANALYTICS_REALTIME_ENABLED) { setRestoringSessions(false); return; }
        if (cachedAnalyticsSessions !== null) {
            setRestoringSessions(false);
            return () => { cancelled = true; };
        }

        dataPerformance.span('cache.sessions', () => readAdminAnalyticsCache(ADMIN_SESSIONS_CACHE_KEY)).then((snapshot) => {
            if (cancelled || authorization !== getAdminCacheGeneration() || !snapshot) return;
            cachedAnalyticsSessions = snapshot.data || [];
            cachedAnalyticsSessionsLoadedAt = snapshot.loadedAt || 0;
            setSessions(cachedAnalyticsSessions);
            setSessionsRefreshKey(cachedAnalyticsSessionsLoadedAt);
            if (cachedAnalyticsSessionsLoadedAt) setNow(cachedAnalyticsSessionsLoadedAt);
        }).finally(() => {
            if (!cancelled) setRestoringSessions(false);
        });

        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (ANALYTICS_REALTIME_ENABLED) return undefined;
        const authorization = getAdminCacheGeneration();
        if (cachedAnalyticsOverviews.size > 0) {
            setRestoringOverviews(false);
            return () => { cancelled = true; };
        }
        dataPerformance.span('cache.overview', () => readAdminAnalyticsCache(ADMIN_OVERVIEWS_CACHE_KEY)).then((snapshot) => {
            if (cancelled || authorization !== getAdminCacheGeneration() || !snapshot?.data?.overviews) return;
            Object.entries(snapshot.data.overviews).forEach(([period, data]) => {
                cachedAnalyticsOverviews.set(period, { data, loadedAt: snapshot.loadedAt || 0 });
            });
            const selected = snapshot.data.overviews['1j'];
            if (selected) {
                overviewSourceRef.current = 'memory';
                setOverview(selected);
                setOverviewStatus('ready');
            }
        }).finally(() => {
            if (!cancelled) setRestoringOverviews(false);
        });
        return () => { cancelled = true; };
    }, []);

    // Refresh live status without moving the analytics window away from the last refresh.
    useEffect(() => {
        const i = setInterval(() => setLiveNow(Date.now()), 10000);
        return () => clearInterval(i);
    }, []);

    // Kpis
    const analyticsStats = useMemo(() => {
        if (overview?.kpis && overview?.chartData && overview?.dataQuality) return overview;
        return buildAnalyticsStats([], timeFilter, {
            now,
            coverageStartMs: null,
            fetchedCount: 0,
            maxFetched: 0
        });
    }, [overview, timeFilter, now]);

    const kpis = analyticsStats.kpis;
    const dataQuality = analyticsStats.dataQuality;
    const chartData = analyticsStats.chartData;

    // ─── Groupement des sessions par jour ───
    const filteredTrafficSessions = sessions;

    const groupedByDay = useMemo(() => (
        buildVisitorDayGroups(filteredTrafficSessions, { now: liveNow, activeWindowMs: LIVE_PRESENCE_MS })
    ), [filteredTrafficSessions, liveNow]);

    const totalPages = Math.ceil(groupedByDay.length / DAYS_PER_PAGE);
    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * DAYS_PER_PAGE;
        return groupedByDay.slice(start, start + DAYS_PER_PAGE);
    }, [groupedByDay, currentPage]);
    const ratioAccent = kpis.visitorConfidenceScore >= 85
        ? 'text-emerald-500'
        : kpis.visitorConfidenceScore >= 70
            ? 'text-amber-500'
            : 'text-red-500';
    const ratioBg = kpis.visitorConfidenceScore >= 85
        ? 'bg-emerald-500/10'
        : kpis.visitorConfidenceScore >= 70
            ? 'bg-amber-500/10'
            : 'bg-red-500/10';

    // Reset pagination when data changes significantly
    useEffect(() => {
        setCurrentPage(1);
        setExpandedSessionId(null);
    }, [timeFilter]);

    // ─── Sessions en ligne (Live) ───
    const liveSessions = useMemo(() => {
        return sessions.filter(s => {
            return isSessionOnline(s, liveNow);
        });
    }, [sessions, liveNow]);

    const [openDays, setOpenDays] = useState({});

    // Ouvrir par défaut le premier jour (Aujourd'hui)
    const firstTrafficDayKey = groupedByDay[0]?.key || null;
    useEffect(() => {
        if (firstTrafficDayKey) {
            setOpenDays(prev => {
                // Si on n'a encore rien d'ouvert, on ouvre le premier jour
                if (Object.keys(prev).length === 0) {
                    return { [firstTrafficDayKey]: true };
                }
                return prev;
            });
        }
    }, [firstTrafficDayKey]);

    const loadOverview = useCallback(async ({ force = false } = {}) => {
        if (ANALYTICS_REALTIME_ENABLED) return; // No callable fallback, even on missing/invalid projection.
        const request = ++overviewRequestRef.current;
        const authorization = getAdminCacheGeneration();
        const trace = performanceTraceRef.current;
        const cached = cachedAnalyticsOverviews.get(timeFilter);
        if (!force && cached && (Date.now() - cached.loadedAt) < ADMIN_ANALYTICS_REFRESH_TTL_MS) {
            overviewSourceRef.current = 'memory';
            setOverview(cached.data);
            setOverviewStatus('ready');
            return;
        }
        if (!cached) setOverviewStatus('loading');
        try {
            if (!cachedAnalyticsOverviewBundlePromise) {
                const pending = dataPerformance.span('callable.prepare', () => getCallableFunction('getAnalyticsAdmin'), { trace })
                    .then((getAnalyticsAdmin) => dataPerformance.span('overview.request', () => getAnalyticsAdmin({ action: 'overview_bundle' }), { trace }))
                    .finally(() => {
                        if (cachedAnalyticsOverviewBundlePromise === pending) cachedAnalyticsOverviewBundlePromise = null;
                    });
                cachedAnalyticsOverviewBundlePromise = pending;
            }
            const response = await cachedAnalyticsOverviewBundlePromise;
            if (request !== overviewRequestRef.current || authorization !== getAdminCacheGeneration()) return;
            recordDataServerTimings(response.data?.serverTimings, trace);
            const overviews = response.data?.overviews || {};
            const loadedAt = Date.now();
            Object.entries(overviews).forEach(([period, data]) => {
                cachedAnalyticsOverviews.set(period, { data, loadedAt });
            });
            void writeAdminAnalyticsCache(ADMIN_OVERVIEWS_CACHE_KEY, { overviews }, loadedAt);
            overviewSourceRef.current = 'server';
            setOverview(overviews[timeFilter] || null);
            setOverviewStatus(overviews[timeFilter] ? 'ready' : 'error');
        } catch (error) {
            if (request !== overviewRequestRef.current || authorization !== getAdminCacheGeneration()) return;
            dataPerformance.mark('overview.error', { trace, outcome: 'error' });
            console.error('Analytics overview load error:', error);
            if (!cached) {
                setOverview(null);
                setOverviewStatus('error');
            } else {
                setOverviewStatus('ready');
            }
        }
    }, [timeFilter]);

    const loadSessions = useCallback(async ({ incremental = false, beforeMillis = null } = {}) => {
        const request = ++sessionsRequestRef.current;
        const authorization = getAdminCacheGeneration();
        const isCurrent = () => request === sessionsRequestRef.current && authorization === getAdminCacheGeneration();
        const trace = performanceTraceRef.current;
        if (beforeMillis) setLoadingOlder(true);
        else setLoading(true);
        try {
            const getAnalyticsAdmin = await dataPerformance.span('callable.prepare', () => getCallableFunction('getAnalyticsAdmin'), { trace });
            const newestKnown = sessions.reduce(
                (latest, session) => Math.max(latest, getMillis(session.lastActivityAt) || 0),
                0
            );
            const response = await dataPerformance.span('sessions.request', () => getAnalyticsAdmin({
                action: 'list',
                pageSize: ADMIN_SESSION_PAGE_SIZE,
                ...(beforeMillis ? { beforeMillis } : {}),
                ...(!beforeMillis && incremental && newestKnown ? { updatedAfterMillis: newestKnown } : {})
            }), { trace });
            if (!isCurrent()) return;
            const incoming = Array.isArray(response.data.sessions) ? response.data.sessions : [];
            const merged = new Map((beforeMillis || incremental ? sessions : []).map(session => [session.id, session]));
            incoming.forEach(session => merged.set(session.id, session));
            const cleanData = Array.from(merged.values())
                .sort((left, right) => getMillis(right.lastActivityAt) - getMillis(left.lastActivityAt))
                .slice(0, MAX_ANALYTICS_SESSIONS);
            const loadedAt = Date.now();
            cachedAnalyticsSessions = cleanData;
            cachedAnalyticsSessionsLoadedAt = loadedAt;
            setNow(loadedAt);
            setSessions(cleanData);
            setSessionsRefreshKey(loadedAt);
            const oldestKnown = cleanData.reduce((oldest, session) => {
                const value = getMillis(session.lastActivityAt);
                return value ? Math.min(oldest, value) : oldest;
            }, Infinity);
            setNextBeforeMillis(beforeMillis
                ? (response.data.truncated ? (response.data.nextBeforeMillis || oldestKnown) : null)
                : (
                    response.data.nextBeforeMillis
                    || (incremental && cleanData.length >= ADMIN_SESSION_PAGE_SIZE && Number.isFinite(oldestKnown) ? oldestKnown : null)
                ));
            void writeAdminAnalyticsCache(ADMIN_SESSIONS_CACHE_KEY, cleanData, loadedAt);
        } catch (error) {
            if (!isCurrent()) return;
            console.error("Analytics load error:", error);
        } finally {
            if (isCurrent()) { setLoading(false); setLoadingOlder(false); }
        }
    }, [sessions]);

    useEffect(() => {
        if (ANALYTICS_REALTIME_ENABLED) return;
        if (restoringOverviews) return;
        setOverview(cachedAnalyticsOverviews.get(timeFilter)?.data || null);
        void loadOverview();
    }, [loadOverview, restoringOverviews, timeFilter]);

    useEffect(() => {
        if (ANALYTICS_REALTIME_ENABLED) return;
        if (restoringSessions || initialRecentSyncRef.current) return;
        initialRecentSyncRef.current = true;
        if (
            cachedAnalyticsSessionsLoadedAt
            && (Date.now() - cachedAnalyticsSessionsLoadedAt) < ADMIN_ANALYTICS_REFRESH_TTL_MS
        ) return;
        void loadSessions({ incremental: sessions.length > 0 });
    }, [restoringSessions, loadSessions, sessions.length]);

    const refreshAnalytics = useCallback(async () => {
        performanceTraceRef.current = startDataPerformance('refresh');
        if (ANALYTICS_REALTIME_ENABLED) { setLiveNow(Date.now()); return; }
        await Promise.all([
            loadOverview({ force: true }),
            loadSessions({ incremental: sessions.length > 0 })
        ]);
    }, [loadOverview, loadSessions, sessions.length]);

    const toggleSessionDetail = useCallback(async (sessionId) => {
        if (expandedSessionId === sessionId) {
            setExpandedSessionId(null);
            return;
        }
        setExpandedSessionId(sessionId);
        if (ANALYTICS_REALTIME_ENABLED) return;
        const existing = sessions.find(session => session.id === sessionId);
        if (Array.isArray(existing?.journey)) return;
        try {
            const getAnalyticsAdmin = await getCallableFunction('getAnalyticsAdmin');
            const response = await getAnalyticsAdmin({ action: 'detail', sessionId });
            setSessions(previous => previous.map(session => (
                session.id === sessionId
                    ? { ...session, journey: response.data.journey || [], lastEventPreview: response.data.lastEventPreview || [], journeyCount: response.data.journeyCount || session.journeyCount || 0 }
                    : session
            )));
        } catch (error) {
            console.error('Analytics session detail error:', error);
        }
    }, [expandedSessionId, sessions]);

    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        if (seconds < 60) return `${seconds}s`;
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}m ${sec}s`;
    };

    const handleDeleteSession = async (id) => {
        if (!window.confirm("Supprimer cette session ? (Action irréversible)")) return;
        try {
            const deleteSession = await getCallableFunction('deleteSession');
            const operationId = globalThis.crypto?.randomUUID?.()
                || `session_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
            const confirmation = { action: 'DELETE_ANALYTICS_SESSION', sessionId: id };
            const dryRun = await deleteSession({
                mode: 'dry_run',
                sessionId: id,
                operationId,
                confirmation
            });
            if (!dryRun.data?.wouldDelete || !dryRun.data?.precondition?.updateTime) {
                if (!ANALYTICS_REALTIME_ENABLED) await loadSessions();
                return;
            }
            await deleteSession({
                mode: 'commit',
                sessionId: id,
                operationId,
                confirmation,
                expectedUpdateTime: dryRun.data.precondition.updateTime
            });
            if (!ANALYTICS_REALTIME_ENABLED) loadSessions();
        } catch (e) {
            console.error("Delete error:", e);
            alert("Erreur lors de la suppression");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* HEADER FILTERS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-stone-900'}`}>Analytics</h3>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Flux & Comportements</p>
                    {restoringSessions && sessions.length === 0 && (
                        <p className="mt-2 text-[10px] font-semibold text-stone-400">Restauration des dernières sessions en arrière-plan…</p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={refreshAnalytics}
                        disabled={loading}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${darkMode ? 'border-white/10 text-stone-300 hover:bg-white/10' : 'border-stone-200 text-stone-600 hover:bg-stone-100'} disabled:opacity-50`}
                    >
                        <RefreshCw size={13} className={loading ? 'inline mr-2 animate-spin' : 'inline mr-2'} />
                        Actualiser
                    </button>
                    {sessionsRefreshKey > 0 && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                            Maj {new Date(sessionsRefreshKey).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <div className={`flex p-1 rounded-xl border ${darkMode ? 'bg-stone-900 border-white/5' : 'bg-stone-100 border-stone-200'}`}>
                        {ANALYTICS_TIME_FILTERS.map(tf => (
                            <button
                                key={tf.id}
                                aria-pressed={timeFilter === tf.id}
                                onClick={() => {
                                    if (tf.id === timeFilter) return;
                                    performanceTraceRef.current = startDataPerformance('period');
                                    setTimeFilter(tf.id);
                                }}
                                className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${timeFilter === tf.id ? (darkMode ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'bg-white text-stone-900 shadow-sm border border-stone-200') : 'text-stone-500 hover:text-stone-300'}`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI PRINCIPAL */}
            <div key={`traffic-kpis-${sessionsRefreshKey}`} className={`p-5 sm:p-6 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 duration-500 ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-stone-100 shadow-sm'}`}>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-stone-500 mb-2">Utilisateurs uniques</p>
                        <h4 className={`text-4xl sm:text-5xl font-black tracking-tighter tabular-nums ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                            {overviewStatus === 'ready' ? kpis.uniqueVisitors : '—'}
                        </h4>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${ratioBg} ${ratioAccent}`}>
                                {overviewStatus === 'ready' ? 'Visiteurs estimés' : overviewStatus === 'error' ? 'Indisponible' : 'En attente des données'}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                                {overviewStatus === 'ready' ? kpis.visitorConfidenceLabel : ''}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 sm:gap-5 text-left sm:text-right">
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Méthode</p>
                            <p className="mt-1 text-sm font-black text-cyan-500 tabular-nums">Pseudonyme</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Historique</p>
                            <p className={`mt-1 text-sm font-black tabular-nums ${overviewStatus === 'error' ? 'text-red-500' : ratioAccent}`}>
                                {overviewStatus === 'error' ? 'Indisponible' : overviewStatus === 'ready' ? (dataQuality.isWindowComplete ? 'Complet' : 'Partiel') : 'Chargement'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Sessions brutes</p>
                            <p className="mt-1 text-sm font-black text-stone-500 tabular-nums">{overviewStatus === 'ready' ? kpis.totalSessions : '—'}</p>
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-[10px] font-bold text-stone-500 leading-relaxed">
                    Statistiques calculées depuis les résumés serveur permanents. Aucun e-mail ni aucune IP brute n’est utilisé.
                </p>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-stone-100 shadow-sm'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${dataQuality.confidence === 'haute' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <AlertCircle size={16} />
                </div>
                <div className="min-w-0">
                    <p className={`text-[9px] font-black uppercase tracking-[0.22em] ${darkMode ? 'text-white/60' : 'text-stone-500'}`}>
                        {overviewStatus === 'ready' ? (ANALYTICS_REALTIME_ENABLED && !dataQuality.isWindowComplete ? 'Historique incomplet sur cette période' : `Fiabilite ${dataQuality.confidence}`) : overviewStatus === 'error' ? 'Données indisponibles' : 'Vérification en cours'}
                    </p>
                    <p className="text-[10px] font-bold text-stone-500 leading-relaxed">
                        {overviewStatus === 'error'
                            ? 'Données indisponibles. Les sessions brutes ne sont pas utilisées comme résultat de secours.'
                            : overviewStatus === 'ready'
                                ? `${dataQuality.method} Fenêtre ${dataQuality.isWindowComplete ? 'complète' : 'partielle : couverture historique incomplète'}.${ANALYTICS_REALTIME_ENABLED ? (realtime.status === 'cached' ? ' Cache connu — confirmation serveur en cours.' : ' Synchronisé avec le serveur.') : ''}`
                                : 'Chargement des résumés serveur…'}
                    </p>
                </div>
            </div>

            {/* CUSTOM SVG CHART BENTO */}
            <div className={`p-6 md:p-8 rounded-[2rem] border transition-all ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-stone-100 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? 'text-white/40' : 'text-stone-400'}`}>Evolution des visiteurs</h3>
                        <p className="mt-1 text-[9px] font-bold text-stone-500">Chaque barre deduplique les visiteurs dans son creneau.</p>
                    </div>
                </div>
                <div className="h-[240px] md:h-[320px] w-full">
                    {overviewStatus === 'loading' || overviewStatus === 'restoring' ? (
                        <div className="flex items-center justify-center h-full text-stone-500 font-bold text-xs">Chargement…</div>
                    ) : overviewStatus === 'error' ? (
                        <div className="flex items-center justify-center h-full text-red-500 font-bold text-xs">Données indisponibles</div>
                    ) : chartData.length > 0 ? (
                        <TrafficChart data={chartData} darkMode={darkMode} valueLabel="visiteur" animationKey={`traffic-${sessionsRefreshKey}`} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-stone-500 font-bold italic text-xs">Aucune activité sur cette période</div>
                    )}
                </div>
            </div>

            {/* LIVE SESSIONS BAR (MODULE 3) */}
            {liveSessions.length > 0 && (
                <div className={`p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 animate-pulse-slow`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-2 text-emerald-500 shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none translate-y-[1px]">{liveSessions.length} Actif{liveSessions.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[9px] font-bold text-emerald-500/60 transition-all">
                            {liveSessions.slice(0, 5).map(ls => (
                                <span key={ls.id} className="px-2 py-1 rounded-lg border border-emerald-500/10 bg-emerald-500/5 whitespace-nowrap">
                                    {ls.geo?.city && ls.geo.city !== 'Unknown' ? ls.geo.city : 'Inconnu'} • {ls.device || 'PC'}
                                </span>
                            ))}
                            {liveSessions.length > 5 && <span className="px-2 py-1 rounded-lg border border-emerald-500/5 bg-emerald-500/5 items-center inline-flex">+{liveSessions.length - 5}</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* GROUPED SESSIONS LOG (MODULE 4) */}
            {ANALYTICS_REALTIME_ENABLED && (
                <p role="status" className="text-xs text-stone-500">
                    {liveSessionState.status === 'error' ? 'Sessions indisponibles' : liveSessionState.status === 'loading' || liveSessionState.status === 'idle'
                        ? 'Chargement des sessions…' : liveSessionState.status === 'cached' ? 'Sessions en cache — confirmation serveur en cours.'
                            : 'Sessions en direct · 10 plus récentes, historique sur demande. Présence récente estimée sur 2 min 30 s.'}
                    {expandedSessionId && detailStatus === 'loading' && ' Chargement du parcours…'}
                    {expandedSessionId && ['missing', 'error'].includes(detailStatus) && ' Parcours indisponible ou session retirée.'}
                </p>
            )}
            <div className="space-y-2">
                {groupedByDay.length === 0 ? (
                    <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-[#161616] border-white/5 text-stone-500' : 'bg-stone-50 border-stone-100 text-stone-400'} font-bold text-sm italic`}>
                        {ANALYTICS_REALTIME_ENABLED && liveSessionState.status !== 'ready'
                            ? liveSessionState.status === 'error' ? 'Sessions indisponibles.' : 'Chargement des sessions…'
                            : 'Aucune session enregistrée.'}
                    </div>
                ) : (
                    paginatedGroups.map((group) => {
                        const isOpen = openDays[group.key];
                        return (
                            <div key={group.key} className={`rounded-2xl border overflow-hidden transition-all duration-300 ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-stone-100'}`}>
                                <button
                                    onClick={() => { setExpandedSessionId(null); setOpenDays(prev => ({ ...prev, [group.key]: !prev[group.key] })); }}
                                    className={`w-full p-3 sm:p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-stone-800' : 'bg-stone-50'}`}>
                                            {isOpen ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                                        </div>
                                        <div>
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-white/70' : 'text-stone-900'}`}>{group.label}</span>
                                            <span className="ml-3 text-[10px] font-bold text-stone-500">
                                                {group.visitors.length} visiteur{group.visitors.length > 1 ? 's' : ''} / {group.sessionCount} session{group.sessionCount > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-500/10 to-transparent mx-6"></div>
                                </button>

                                {isOpen && (
                                    <div className="px-2 sm:px-4 pb-3 sm:pb-4 animate-in slide-in-from-top-1 duration-200">
                                        <div className="space-y-1 sm:space-y-1.5">
                                            {group.visitors.map(visitor => {
                                                const visitorOpen = openVisitors[visitor.key] ?? group.visitors.length === 1;
                                                return (
                                                    <VisitorSessionGroup
                                                        key={visitor.key}
                                                        darkMode={darkMode}
                                                        visitor={visitor}
                                                        now={liveNow}
                                                        isOpen={visitorOpen}
                                                        onToggle={() => { setExpandedSessionId(null); setOpenVisitors(prev => ({ ...prev, [visitor.key]: !visitorOpen })); }}
                                                        expandedSessionId={expandedSessionId}
                                                        onToggleSessionDetail={toggleSessionDetail}
                                                        handleDeleteSession={handleDeleteSession}
                                                        formatDuration={formatDuration}
                                                        productThumbnails={productThumbnails}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {/* PAGINATION NUMBERS */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-4">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={`p-2.5 rounded-xl transition-all duration-300 border-2 ${
                                darkMode
                                    ? (currentPage === 1 ? 'border-white/5 text-stone-700' : 'border-white/5 text-stone-400 hover:bg-white/5 hover:text-white')
                                    : (currentPage === 1 ? 'border-stone-50 text-stone-200' : 'border-stone-100 text-stone-500 hover:bg-stone-50 hover:text-stone-900')
                            } active:scale-90`}
                        >
                            <ChevronRight className="rotate-180" size={16} />
                        </button>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[1.25rem] border-2 border-white/5 bg-white/[0.02]">
                            {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                if (totalPages > 7) {
                                    if (page > 1 && page < totalPages && Math.abs(page - currentPage) > 1) {
                                        if (page === 2 || page === totalPages - 1) return <span key={page} className="text-stone-700 px-1 select-none">···</span>;
                                        return null;
                                    }
                                }

                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all duration-500 ${currentPage === page
                                            ? (darkMode ? 'bg-white text-stone-900 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-stone-900 text-white shadow-lg shadow-stone-900/20')
                                            : (darkMode ? 'text-stone-500 hover:text-white hover:bg-white/5' : 'text-stone-400 hover:text-stone-900 hover:bg-stone-100')
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={`p-2.5 rounded-xl transition-all duration-300 border-2 ${
                                darkMode
                                    ? (currentPage === totalPages ? 'border-white/5 text-stone-700' : 'border-white/5 text-stone-400 hover:bg-white/5 hover:text-white')
                                    : (currentPage === totalPages ? 'border-stone-50 text-stone-200' : 'border-stone-100 text-stone-500 hover:bg-stone-50 hover:text-stone-900')
                            } active:scale-90`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {ANALYTICS_REALTIME_ENABLED && liveSessionState.historyPage > 0 && (
                    <button type="button" disabled={liveSessionState.loadingMore} onClick={() => { setExpandedSessionId(null); liveSessionsChannel.newer(); }} className="text-sm underline disabled:opacity-50">
                        Historique — page {liveSessionState.historyPage} · Revenir aux sessions plus récentes
                    </button>
                )}
                {(ANALYTICS_REALTIME_ENABLED ? liveSessionState.more || liveSessionState.loadingMore : nextBeforeMillis) && sessions.length < MAX_ANALYTICS_SESSIONS && (
                    <div className="flex justify-center pt-3">
                        <button
                            type="button"
                            disabled={ANALYTICS_REALTIME_ENABLED ? liveSessionState.loadingMore : loadingOlder}
                            onClick={() => { setExpandedSessionId(null); return ANALYTICS_REALTIME_ENABLED ? liveSessionsChannel.older() : loadSessions({ beforeMillis: nextBeforeMillis }); }}
                            className={`rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'border-white/10 text-stone-300 hover:bg-white/5' : 'border-stone-200 text-stone-600 hover:bg-stone-50'} disabled:opacity-50`}
                        >
                            {(ANALYTICS_REALTIME_ENABLED ? liveSessionState.loadingMore : loadingOlder) ? 'Chargement…' : 'Charger 10 sessions plus anciennes'}
                        </button>
                    </div>
                )}
            </div>

            {/* FOOTER INFO MODULE 5 */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 py-4 border-t border-white/5">
                {[
                    "Statistiques historiques permanentes",
                    "Sessions détaillées chargées par 10",
                    "Aucun e-mail ni IP dans les analytics",
                    "Sync protegee par jeton",
                    "Détails actifs: 90 jours"
                ].map((info, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-stone-700"></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-600">{info}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminAnalytics;
