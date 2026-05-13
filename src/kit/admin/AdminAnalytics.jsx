import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Smartphone, Monitor, Globe, Trash2, AlertCircle, ChevronDown, ChevronRight,
    Map as MapIcon, RefreshCw
} from 'lucide-react';
import { collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { getMillis } from '../../utils/time';
import AdminSiteMap from './AdminSiteMap';
import {
    ANALYTICS_TIME_FILTERS,
    MAX_ANALYTICS_SESSIONS,
    buildAnalyticsStats,
    buildVisitorConfidence,
    getAnalyticsWindow,
    getIpVisitorKey,
    getReliableVisitorKey,
    getVisitorIdentity
} from './analyticsReliability';

const LIVE_WINDOW_MS = 120000;
const ANALYTICS_CHECKPOINT_CACHE_KEY = 'secondevie.admin.analytics.checkpoint.v1';
const ANALYTICS_CHECKPOINT_SESSION_LIMIT = Math.min(MAX_ANALYTICS_SESSIONS, 1500);

const formatCheckpointDate = (timestamp) => {
    if (!timestamp) return 'Jamais';
    return new Date(timestamp).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getCheckpointAgeLabel = (timestamp, now = Date.now()) => {
    if (!timestamp) return 'aucun checkpoint';
    const diffMs = Math.max(0, now - timestamp);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) return 'a l\'instant';
    if (diffMs < hour) return `il y a ${Math.floor(diffMs / minute)} min`;
    if (diffMs < day) return `il y a ${Math.floor(diffMs / hour)} h`;
    return `il y a ${Math.floor(diffMs / day)} j`;
};

const readAnalyticsCheckpoint = () => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(ANALYTICS_CHECKPOINT_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.sessions) || !Number.isFinite(parsed.loadedAt)) return null;
        return parsed;
    } catch {
        return null;
    }
};

const writeAnalyticsCheckpoint = (sessions, loadedAt = Date.now()) => {
    if (typeof window === 'undefined') return { saved: false, count: 0 };
    const safeSessions = sessions.slice(0, ANALYTICS_CHECKPOINT_SESSION_LIMIT);
    try {
        window.localStorage.setItem(ANALYTICS_CHECKPOINT_CACHE_KEY, JSON.stringify({
            loadedAt,
            count: sessions.length,
            cachedCount: safeSessions.length,
            sessions: safeSessions
        }));
        return { saved: true, count: safeSessions.length };
    } catch {
        return { saved: false, count: 0 };
    }
};

// ─── Custom SVG Bar Chart — Premium responsive (remplace Recharts) ──
const TrafficChart = ({ data, darkMode, valueLabel = 'visite' }) => {
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

        // Cap la largeur max pour éviter des barres géantes avec peu de données
        barW = Math.min(barW, isMobile ? 40 : 60);

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
                            <g key={i}>
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
                                    />
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
                </div>
            )}
        </div>
    );
};

const AdminAnalytics = ({ darkMode = false }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasLoadedSessions, setHasLoadedSessions] = useState(false);
    const [checkpointLoadedAt, setCheckpointLoadedAt] = useState(null);
    const [checkpointCount, setCheckpointCount] = useState(0);
    const [checkpointCachedCount, setCheckpointCachedCount] = useState(0);
    const [checkpointNotice, setCheckpointNotice] = useState('');
    const [refreshPulseKey, setRefreshPulseKey] = useState(0);
    const [timeFilter, setTimeFilter] = useState('1j'); // Default to 24h // '1h', '1j', '7j', '1mois', '1ans'
    const [expandedSessionId, setExpandedSessionId] = useState(null);
    const [now, setNow] = useState(Date.now());
    const [currentPage, setCurrentPage] = useState(1);
    const DAYS_PER_PAGE = 10;

    // Refresh "now" every 30s to update "Online" vs "Finished" markers
    useEffect(() => {
        const i = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(i);
    }, []);

    useEffect(() => {
        const checkpoint = readAnalyticsCheckpoint();
        if (!checkpoint) return;

        setSessions(checkpoint.sessions);
        setHasLoadedSessions(true);
        setCheckpointLoadedAt(checkpoint.loadedAt);
        setCheckpointCount(checkpoint.count || checkpoint.sessions.length);
        setCheckpointCachedCount(checkpoint.cachedCount || checkpoint.sessions.length);
        setCheckpointNotice('Checkpoint local restaure sans requete Firestore.');
    }, []);

    // Kpis
    const [kpis, setKpis] = useState({
        totalSessions: 0,
        uniqueVisitors: 0,
        uniqueIps: 0,
        visitorIpRatio: 1,
        visitorIpRatioLabel: '1.00',
        visitorConfidenceScore: 100,
        visitorConfidenceLabel: 'forte',
        avgDuration: 0,
        bounceRate: 0,
        mobilePercentage: 0,
        ipCoverage: 100
    });
    const [dataQuality, setDataQuality] = useState({
        confidence: 'haute',
        isWindowComplete: true,
        isFetchCapped: false,
        fetchedCount: 0,
        maxFetched: MAX_ANALYTICS_SESSIONS,
        coverageStartMs: null,
        missingIpSessions: 0,
        identitySourceCounts: {},
        visitorConfidence: {
            score: 100,
            label: 'forte',
            ratio: 1,
            ratioLabel: '1.00'
        },
        method: 'UID Firebase client/anonyme, puis IUD navigateur, puis IP serveur, puis session si IP absente.'
    });

    const [chartData, setChartData] = useState([]);
    const [sessionDetails, setSessionDetails] = useState({});
    const [sessionDetailsLoading, setSessionDetailsLoading] = useState({});
    const [mappedVisitor, setMappedVisitor] = useState(null);

    // R3 — Clé de visiteur unique (priorité userId connecté > visitorKey CloudFn > fallback IP)
    const getVisitorId = (s) => getReliableVisitorKey(s);

    const getVisitorConfidence = (visitorSessions = []) => {
        const visitorKeys = new Set(visitorSessions.map(getReliableVisitorKey));
        const ipKeys = new Set(visitorSessions.map(getIpVisitorKey).filter(Boolean));
        const missingIpSessions = visitorSessions.filter(session => !getIpVisitorKey(session)).length;
        const ipCoverage = visitorSessions.length > 0
            ? Math.round(((visitorSessions.length - missingIpSessions) / visitorSessions.length) * 100)
            : 100;
        const sessionFallbackCount = visitorSessions.filter(session => getVisitorIdentity(session).source === 'session').length;

        return buildVisitorConfidence({
            uniqueVisitors: visitorKeys.size,
            uniqueIps: ipKeys.size,
            ipCoverage,
            sessionFallbackCount,
            isWindowComplete: true
        }).score;
    };

    const getIdentityLabel = (visitorSessions = []) => {
        const sources = new Set(visitorSessions.map(session => getVisitorIdentity(session).source));
        if (sources.has('auth_uid') || sources.has('anonymous_uid')) return 'UID client';
        if (sources.has('visitor_key')) return 'IUD navigateur';
        if (sources.has('ip')) return 'IP seule';
        return 'Session seule';
    };

    // R2 — Validité d'une session pour les stats (voir datadiag.md §2).
    // ─── Groupement des sessions par jour PUIS par visiteur (R3) ───
    // Structure : [{ key, label, timestamp, visitors: [{ visitorId, representative, sessions, totalDuration }], sessionsCount }]
    const groupedByDay = useMemo(() => {
        const days = {};
        const today = new Date().toLocaleDateString('fr-FR');
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('fr-FR');

        sessions.forEach(s => {
            const dateObj = new Date(getMillis(s.startedAt));
            const dateKey = dateObj.toLocaleDateString('fr-FR');

            let label = dateKey;
            if (dateKey === today) label = "Aujourd'hui";
            else if (dateKey === yesterday) label = "Hier";

            if (!days[dateKey]) {
                days[dateKey] = {
                    key: dateKey,
                    label,
                    timestamp: dateObj.getTime(),
                    visitorsMap: {},
                };
            }

            const vid = getVisitorId(s);
            if (!days[dateKey].visitorsMap[vid]) {
                days[dateKey].visitorsMap[vid] = {
                    visitorId: vid,
                    representative: s,       // session la plus récente = représentative
                    sessions: [],
                    totalDuration: 0,
                    latestStart: 0,
                };
            }
            const bucket = days[dateKey].visitorsMap[vid];
            bucket.sessions.push(s);
            bucket.totalDuration += (s.duration || 0);
            const startMs = getMillis(s.startedAt);
            if (startMs > bucket.latestStart) {
                bucket.latestStart = startMs;
                bucket.representative = s;
            }
        });

        return Object.values(days)
            .map(d => {
                const visitors = Object.values(d.visitorsMap)
                    .map(v => ({ ...v, sessions: v.sessions.sort((a, b) => getMillis(b.startedAt) - getMillis(a.startedAt)) }))
                    .sort((a, b) => b.latestStart - a.latestStart);
                const sessionsCount = visitors.reduce((acc, v) => acc + v.sessions.length, 0);
                return { key: d.key, label: d.label, timestamp: d.timestamp, visitors, sessionsCount };
            })
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [sessions]);

    const totalPages = Math.ceil(groupedByDay.length / DAYS_PER_PAGE);
    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * DAYS_PER_PAGE;
        return groupedByDay.slice(start, start + DAYS_PER_PAGE);
    }, [groupedByDay, currentPage]);

    // Reset pagination when data changes significantly
    useEffect(() => {
        setCurrentPage(1);
    }, [timeFilter]);

    // ─── Sessions en ligne (Live) ───
    const liveSessions = useMemo(() => {
        return sessions.filter(s => {
            const lastActiveMs = getMillis(s.lastActivityAt);
            const isInactive = (now - lastActiveMs) > LIVE_WINDOW_MS;
            return s.sessionActive !== false && !isInactive;
        });
    }, [sessions, now]);

    const [openDays, setOpenDays] = useState({});
    const [openVisitors, setOpenVisitors] = useState({}); // clé = `${dayKey}:${visitorId}`
    
    // Ouvrir par défaut le premier jour (Aujourd'hui)
    useEffect(() => {
        if (groupedByDay.length > 0) {
            const firstKey = groupedByDay[0].key;
            setOpenDays(prev => {
                // Si on n'a encore rien d'ouvert, on ouvre le premier jour
                if (Object.keys(prev).length === 0) {
                    return { [firstKey]: true };
                }
                return prev;
            });
        }
    }, [groupedByDay.length]);

    const loadSessions = useCallback(async () => {
        if (document.visibilityState === 'hidden') return;
        setLoading(true);
        try {
            const historyWindow = getAnalyticsWindow('1ans');
            const historyCutoff = Timestamp.fromMillis(Date.now() - historyWindow.duration);
            const sessionsQuery = query(
                collection(db, 'analytics_sessions'),
                where('startedAt', '>=', historyCutoff),
                orderBy('startedAt', 'desc'),
                limit(MAX_ANALYTICS_SESSIONS)
            );

            const snap = await getDocs(sessionsQuery);
            const data = snap.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data()
            }));

            const cleanData = data.filter((s) => s.type !== 'admin');
            const loadedAt = Date.now();
            const checkpoint = writeAnalyticsCheckpoint(cleanData, loadedAt);

            setSessions(cleanData);
            setHasLoadedSessions(true);
            setCheckpointLoadedAt(loadedAt);
            setCheckpointCount(cleanData.length);
            setCheckpointCachedCount(checkpoint.count);
            setCheckpointNotice(checkpoint.saved
                ? 'Checkpoint mis a jour dans ce navigateur.'
                : 'Stats mises a jour, mais le checkpoint local n\'a pas pu etre enregistre.');
            setRefreshPulseKey(key => key + 1);
        } catch (error) {
            console.error('Analytics load error:', error);
            setCheckpointNotice('Actualisation impossible. Le dernier checkpoint local reste affiche.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!expandedSessionId || sessionDetails[expandedSessionId]) return;

        let cancelled = false;

        const loadDetails = async () => {
            setSessionDetailsLoading(prev => ({ ...prev, [expandedSessionId]: true }));
            try {
                const detailsQuery = query(
                    collection(db, 'analytics_sessions', expandedSessionId, 'journey_steps'),
                    orderBy('timestamp', 'asc'),
                    limit(250)
                );
                const snap = await getDocs(detailsQuery);
                if (cancelled) return;

                const details = snap.docs.map((docSnap) => docSnap.data());
                const legacy = sessions.find(s => s.id === expandedSessionId)?.journey || [];
                setSessionDetails(prev => ({
                    ...prev,
                    [expandedSessionId]: details.length > 0 ? details : legacy
                }));
            } catch (error) {
                console.error('Analytics details fetch error:', error);
                if (cancelled) return;
                const legacy = sessions.find(s => s.id === expandedSessionId)?.journey || [];
                setSessionDetails(prev => ({
                    ...prev,
                    [expandedSessionId]: legacy
                }));
            } finally {
                if (!cancelled) {
                    setSessionDetailsLoading(prev => ({ ...prev, [expandedSessionId]: false }));
                }
            }
        };

        loadDetails();
        return () => { cancelled = true; };
    }, [expandedSessionId, sessionDetails, sessions]);

    const processData = useCallback((allSessions, filter, nowMs = Date.now()) => {
        const oldestStartedAt = allSessions
            .map(session => getMillis(session.startedAt))
            .filter(Boolean)
            .reduce((oldest, value) => Math.min(oldest, value), Infinity);

        const result = buildAnalyticsStats(allSessions, filter, {
            now: nowMs,
            coverageStartMs: Number.isFinite(oldestStartedAt) ? oldestStartedAt : null,
            fetchedCount: allSessions.length,
            maxFetched: MAX_ANALYTICS_SESSIONS
        });

        setKpis(result.kpis);
        setDataQuality(result.dataQuality);
        setChartData(result.chartData);
    }, []);

    useEffect(() => {
        processData(sessions, timeFilter, now);
    }, [sessions, timeFilter, now, processData]);

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
            await httpsCallable(functions, 'deleteSession')({ sessionId: id });
            await loadSessions();
            // Le snapshot s'occupera de rafraîchir la liste
        } catch (e) {
            console.error("Delete error:", e);
            alert("Erreur lors de la suppression");
        }
    };

    const openVisitorMap = (visitorMap) => {
        setMappedVisitor(visitorMap);
    };

    const handleClearAll = async () => {
        if (!window.confirm("☢️ ACTION CRITIQUE : Supprimer TOUTES les données d'analytics définitivement ?")) return;
        setLoading(true);
        try {
            await httpsCallable(functions, 'clearAllAnalytics')({});
            await loadSessions();
            setHasLoadedSessions(true);
            setLoading(false);
        } catch (e) {
            console.error("Clear error:", e);
            setLoading(false);
            alert("Erreur lors du nettoyage");
        }
    };

    if (mappedVisitor) {
        return (
            <AdminSiteMap
                sessionsOverride={mappedVisitor.sessions}
                subjectName={mappedVisitor.label}
                subjectInitials={mappedVisitor.initials}
                modeLabel={`${mappedVisitor.sessions.length} session${mappedVisitor.sessions.length > 1 ? 's' : ''} cumulee${mappedVisitor.sessions.length > 1 ? 's' : ''}`}
                title="Parcours client cumule"
                subtitle={`Carte reconstruite depuis les routes observees de ce visiteur. Identite ${mappedVisitor.identityLabel}, confiance ${mappedVisitor.confidence}%.`}
                onExit={() => setMappedVisitor(null)}
            />
        );
    }

    const ratioAccent = dataQuality.confidence === 'haute'
        ? 'text-emerald-500'
        : dataQuality.confidence === 'moyenne'
            ? 'text-amber-500'
            : 'text-red-500';
    const ratioBg = dataQuality.confidence === 'haute'
        ? 'bg-emerald-500/10'
        : dataQuality.confidence === 'moyenne'
            ? 'bg-amber-500/10'
            : 'bg-red-500/10';
    const checkpointAge = getCheckpointAgeLabel(checkpointLoadedAt, now);
    const checkpointDate = formatCheckpointDate(checkpointLoadedAt);
    const refreshAnimationClass = loading
        ? 'opacity-70 scale-[0.995]'
        : refreshPulseKey > 0
            ? 'animate-in fade-in zoom-in-95 duration-500'
            : '';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* HEADER FILTERS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-stone-900'}`}>Analytics</h3>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Flux & Comportements</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={loadSessions}
                        disabled={loading}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${darkMode ? 'border-white/10 text-stone-300 hover:bg-white/10' : 'border-stone-200 text-stone-600 hover:bg-stone-100'} disabled:opacity-50`}
                    >
                        <RefreshCw size={13} className={loading ? 'inline mr-2 animate-spin' : 'inline mr-2'} />
                        Actualiser
                    </button>
                    <button
                        onClick={handleClearAll}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-red-500/20 text-red-500/60 hover:bg-red-500 hover:text-white active:scale-95`}
                    >
                        Purger Data
                    </button>
                    <div className={`flex p-1 rounded-xl border ${darkMode ? 'bg-stone-900 border-white/5' : 'bg-stone-100 border-stone-200'}`}>
                        {ANALYTICS_TIME_FILTERS.map(tf => (
                            <button
                                key={tf.id}
                                onClick={() => setTimeFilter(tf.id)}
                                className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${timeFilter === tf.id ? (darkMode ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'bg-white text-stone-900 shadow-sm border border-stone-200') : 'text-stone-500 hover:text-stone-300'}`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`rounded-2xl border p-4 transition-all ${loading ? 'animate-pulse' : ''} ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-stone-100 shadow-sm'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-stone-500">Checkpoint analytics</p>
                        <p className={`mt-1 text-sm font-black ${darkMode ? 'text-white/80' : 'text-stone-900'}`}>
                            {checkpointLoadedAt ? `${checkpointDate} - ${checkpointAge}` : 'Aucune data chargee dans ce navigateur'}
                        </p>
                        <p className="mt-1 text-[10px] font-bold leading-relaxed text-stone-500">
                            {checkpointNotice || 'La page reutilise le dernier checkpoint local. Firestore ne lit les analytics que via Actualiser.'}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-left sm:text-right">
                        <div className={`rounded-xl border px-3 py-2 ${darkMode ? 'border-white/5 bg-white/[0.03]' : 'border-stone-100 bg-stone-50'}`}>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Checkpoint</p>
                            <p className={`mt-1 text-sm font-black tabular-nums ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                                {checkpointCachedCount}
                            </p>
                        </div>
                        <div className={`rounded-xl border px-3 py-2 ${darkMode ? 'border-white/5 bg-white/[0.03]' : 'border-stone-100 bg-stone-50'}`}>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Derniere lecture</p>
                            <p className={`mt-1 text-sm font-black tabular-nums ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                                {checkpointCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {!hasLoadedSessions ? (
                <div className={`p-10 sm:p-12 text-center rounded-2xl border ${darkMode ? 'bg-[#161616] border-white/5 text-stone-400' : 'bg-white border-stone-100 text-stone-500 shadow-sm'}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-500">
                        {loading ? 'Chargement Data' : 'Aucun checkpoint'}
                    </p>
                    <p className={`mt-3 text-sm font-bold ${darkMode ? 'text-white/70' : 'text-stone-700'}`}>
                        {loading ? 'Lecture analytics bornee en cours.' : 'Cliquez sur Actualiser pour charger les analytics.'}
                    </p>
                    <p className="mt-2 text-[10px] font-bold leading-relaxed text-stone-500">
                        Aucune lecture Firestore analytics n'est lancee automatiquement a l'ouverture de cet onglet.
                    </p>
                </div>
            ) : (
            <>

            {/* KPI PRINCIPAL */}
            <div
                key={`kpi-${refreshPulseKey}`}
                className={`p-5 sm:p-6 rounded-2xl border transition-all duration-500 ${refreshAnimationClass} ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-stone-100 shadow-sm'}`}
            >
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-stone-500 mb-2">Utilisateurs uniques</p>
                        <h4 className={`text-4xl sm:text-5xl font-black tracking-tighter tabular-nums ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                            {kpis.uniqueVisitors}
                        </h4>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${ratioBg} ${ratioAccent}`}>
                                Confiance {kpis.visitorConfidenceScore}%
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                                {kpis.visitorConfidenceLabel}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 sm:gap-5 text-left sm:text-right">
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">IPs uniques</p>
                            <p className="mt-1 text-sm font-black text-cyan-500 tabular-nums">{kpis.uniqueIps}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Ratio UID/IP</p>
                            <p className={`mt-1 text-sm font-black tabular-nums ${ratioAccent}`}>{kpis.visitorIpRatioLabel}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Sessions brutes</p>
                            <p className="mt-1 text-sm font-black text-stone-500 tabular-nums">{kpis.totalSessions}</p>
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-[10px] font-bold text-stone-500 leading-relaxed">
                    Deduplication par UID Firebase, IUD navigateur, puis IP serveur. Le compteur utilisateurs uniques est {kpis.visitorIpRatio
                        ? `${Math.round((kpis.visitorIpRatio - 1) * 100)}% au-dessus`
                        : 'non comparable'} du compteur IPs uniques.
                </p>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 transition-all duration-500 ${refreshAnimationClass} ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-stone-100 shadow-sm'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${dataQuality.confidence === 'haute' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <AlertCircle size={16} />
                </div>
                <div className="min-w-0">
                    <p className={`text-[9px] font-black uppercase tracking-[0.22em] ${darkMode ? 'text-white/60' : 'text-stone-500'}`}>
                        Fiabilite {dataQuality.confidence}
                    </p>
                    <p className="text-[10px] font-bold text-stone-500 leading-relaxed">
                        {dataQuality.method} Fenetre {dataQuality.isWindowComplete ? 'complete' : `plafonnee a ${dataQuality.maxFetched} sessions`}.
                    </p>
                </div>
            </div>

            {/* CUSTOM SVG CHART BENTO */}
            <div
                key={`chart-${refreshPulseKey}`}
                className={`p-6 md:p-8 rounded-[2rem] border transition-all duration-500 ${refreshAnimationClass} ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-stone-100 shadow-sm'}`}
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? 'text-white/40' : 'text-stone-400'}`}>Évolution du Trafic</h3>
                </div>
                <div className="h-[240px] md:h-[320px] w-full">
                    {chartData.length > 0 ? (
                        <TrafficChart data={chartData} darkMode={darkMode} valueLabel="visiteur" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-stone-500 font-bold italic text-xs">Pas assez de données.</div>
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
            <div className="space-y-2">
                {groupedByDay.length === 0 ? (
                    <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-[#161616] border-white/5 text-stone-500' : 'bg-stone-50 border-stone-100 text-stone-400'} font-bold text-sm italic`}>
                        Aucune session enregistrée.
                    </div>
                ) : (
                    paginatedGroups.map((group) => {
                        const isOpen = openDays[group.key];
                        return (
                            <div key={group.key} className={`rounded-2xl border overflow-hidden transition-all duration-300 ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-stone-100'}`}>
                                <button
                                    onClick={() => setOpenDays(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                                    className={`w-full p-3 sm:p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-stone-800' : 'bg-stone-50'}`}>
                                            {isOpen ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                                        </div>
                                        <div>
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-white/70' : 'text-stone-900'}`}>{group.label}</span>
                                            <span className="ml-3 text-[10px] font-bold text-stone-500">{group.visitors.length} visiteur{group.visitors.length > 1 ? 's' : ''} • {group.sessionsCount} session{group.sessionsCount > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-500/10 to-transparent mx-6"></div>
                                </button>

                                {isOpen && (
                                    <div className="px-2 sm:px-4 pb-3 sm:pb-4 animate-in slide-in-from-top-1 duration-200 space-y-2">
                                        {group.visitors.map(visitor => {
                                            const visitorKey = `${group.key}:${visitor.visitorId}`;
                                            const isVisitorOpen = openVisitors[visitorKey] !== false; // ouvert par défaut
                                            const rep = visitor.representative;
                                            const repCity = rep.geo?.city && rep.geo.city !== 'Unknown' ? rep.geo.city : 'Inconnu';
                                            const repRegion = rep.geo?.region && rep.geo.region !== 'Unknown' ? `, ${rep.geo.region}` : '';
                                            const confidence = getVisitorConfidence(visitor.sessions);
                                            const identityLabel = getIdentityLabel(visitor.sessions);
                                            const visitorLabel = `${repCity}${repRegion}`;
                                            const visitorInitials = visitorLabel
                                                .split(/[\s,]+/)
                                                .filter(Boolean)
                                                .slice(0, 2)
                                                .map(part => part[0]?.toUpperCase())
                                                .join('') || 'SV';
                                            return (
                                              <div key={visitorKey} className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-stone-900/40 border-white/5' : 'bg-stone-50 border-stone-100'}`}>
                                                {/* Visitor header (carte regroupement) */}
                                                <div className={`w-full p-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenVisitors(prev => ({ ...prev, [visitorKey]: !isVisitorOpen }))}
                                                        className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden text-left"
                                                    >
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-white/5 text-white/60' : 'bg-white text-stone-700 border border-stone-200'}`}>
                                                            {rep.device === 'Mobile' ? <Smartphone size={14} /> : <Monitor size={14} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <Globe size={11} className="text-stone-500 shrink-0" />
                                                                <span className={`text-[11px] font-black truncate ${darkMode ? 'text-white/80' : 'text-stone-900'}`}>{visitorLabel}</span>
                                                                <span className="hidden md:inline text-[8px] font-bold text-stone-500 opacity-50 truncate">• {rep.ip}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
                                                                <span className="text-[9px] font-bold uppercase text-stone-500 truncate">
                                                                    {(rep.os || 'Inconnu')} • {(rep.browser || 'Inconnu')}
                                                                </span>
                                                                <span className="text-[8px] font-black text-blue-500/80 uppercase tracking-widest">
                                                                    {visitor.sessions.length} session{visitor.sessions.length > 1 ? 's' : ''}
                                                                </span>
                                                                <span className="hidden min-[520px]:inline text-[8px] font-bold text-emerald-500/70">• Total {formatDuration(visitor.totalDuration)}</span>
                                                                <span className="hidden md:inline text-[8px] font-black uppercase tracking-widest text-emerald-500/70">• {confidence}% {identityLabel}</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openVisitorMap({
                                                                id: visitor.visitorId,
                                                                label: visitorLabel,
                                                                initials: visitorInitials,
                                                                sessions: visitor.sessions,
                                                                confidence,
                                                                identityLabel
                                                            })}
                                                            className={`hidden lg:inline-flex h-8 items-center gap-2 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest transition-all ${mappedVisitor?.id === visitor.visitorId ? 'bg-cyan-400 text-stone-950' : (darkMode ? 'bg-white/5 text-cyan-300/80 hover:bg-white/10' : 'bg-white border border-stone-200 text-stone-700 hover:border-cyan-300')}`}
                                                        >
                                                            <MapIcon size={11} />
                                                            Map
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenVisitors(prev => ({ ...prev, [visitorKey]: !isVisitorOpen }))}
                                                            className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-white/5 hover:text-white"
                                                            aria-label={isVisitorOpen ? 'Fermer le visiteur' : 'Ouvrir le visiteur'}
                                                        >
                                                            <ChevronDown size={14} className={`transition-transform duration-300 ${isVisitorOpen ? 'rotate-0' : '-rotate-90'}`} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {isVisitorOpen && (
                                                  <div className="px-2 sm:px-3 pb-2 sm:pb-3 space-y-1 sm:space-y-1.5">
                                                    {visitor.sessions.map(session => {
                                                const isExpanded = expandedSessionId === session.id;
                                                const lastActiveMs = getMillis(session.lastActivityAt);
                                                const isInactive = (now - lastActiveMs) > LIVE_WINDOW_MS;
                                                const isFinished = session.sessionActive === false || isInactive;
                                                const startedTime = session.startedAt ? new Date(getMillis(session.startedAt)).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

                                                return (
                                                    <div key={session.id} className={`group rounded-xl border transition-all ${darkMode ? 'bg-stone-900 border-white/5 hover:border-white/10' : 'bg-stone-50 border-stone-100 shadow-sm'}`}>
                                                        <div className="p-3 flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                                                <div className="flex flex-col min-w-[40px] shrink-0">
                                                                    <span className="text-[10px] font-black text-white/40">{startedTime}</span>
                                                                    {isFinished ? (
                                                                        <span className="text-[8px] font-black uppercase text-stone-600">Terminé</span>
                                                                    ) : (
                                                                        <span className="text-[8px] font-black uppercase text-emerald-500 animate-pulse">En ligne</span>
                                                                    )}
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5 overflow-hidden">
                                                                        <Globe size={11} className="text-stone-500 shrink-0" />
                                                                        <span className={`text-[10px] font-bold truncate ${darkMode ? 'text-white/80' : 'text-stone-900'}`}>{session.geo?.city && session.geo.city !== 'Unknown' ? `${session.geo.city}${session.geo.region && session.geo.region !== 'Unknown' ? `, ${session.geo.region}` : ''}` : 'Inconnu'}</span>
                                                                        <span className="hidden md:inline text-[8px] text-stone-500 opacity-50 truncate">• {session.ip}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                                        {session.device === 'Mobile' ? <Smartphone size={10} className="text-stone-500 shrink-0" /> : <Monitor size={10} className="text-stone-500 shrink-0" />}
                                                                        <span className="text-[9px] font-bold text-stone-500 truncate uppercase">
                                                                            {session.os || 'Inconnu'} • {session.browser || 'Inconnu'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 sm:gap-3 md:gap-6 shrink-0">
                                                                <div className="hidden min-[450px]:block text-right">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-0.5 leading-none">Durée</p>
                                                                    <p className={`text-[11px] sm:text-xs font-black ${darkMode ? 'text-white' : 'text-stone-900'}`}>{formatDuration(session.duration)}</p>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                                                                        className={`px-3 py-1.5 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isExpanded ? 'bg-blue-500 text-white' : (darkMode ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-white border border-stone-200 text-stone-600')}`}
                                                                    >
                                                                        {isExpanded ? 'Masquer' : 'Tracer'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteSession(session.id)}
                                                                        className="p-1.5 text-stone-500 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className={`p-4 border-t ${darkMode ? 'border-white/5 bg-black/20' : 'border-stone-100 bg-white'} animate-in slide-in-from-top-2 duration-300`}>
                                                                <div className="space-y-5">
                                                                    {(() => {
                                                                        const detailedJourney = sessionDetails[session.id] || session.journey || [];
                                                                        const detailsLoading = sessionDetailsLoading[session.id];
                                                                        return (
                                                                            <>
                                                                    <div className="flex items-center justify-between px-1">
                                                                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">Parcours Utilisateur</h4>
                                                                        <span className="text-[8px] font-bold text-stone-600 opacity-60 uppercase tracking-tighter">
                                                                            {detailsLoading ? 'Chargement...' : `${detailedJourney.length || 0} Étapes`}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-stone-800">
                                                                        {detailsLoading ? (
                                                                            <p className="text-[10px] italic text-stone-500">Chargement du parcours…</p>
                                                                        ) : (!detailedJourney || detailedJourney.length === 0 ? (
                                                                            <p className="text-[10px] italic text-stone-500">Aucune activité enregistrée</p>
                                                                        ) : (
                                                                            detailedJourney.map((step, idx) => {
                                                                                const dotColor = step.pageColor || '#3b82f6';
                                                                                const label = step.pageLabel || step.page || 'Vue inconnue';
                                                                                const ctxItemName = step.context?.itemName;
                                                                                const ctxItemPrice = step.context?.itemPrice;
                                                                                const ctxCategoryId = step.context?.categoryId;
                                                                                return (
                                                                                <div key={idx} className="relative group/step">
                                                                                    {/* DOT colored per pageKey */}
                                                                                    <div
                                                                                        className={`absolute -left-[18.5px] top-1.5 w-[7px] h-[7px] rounded-full ring-4 ${darkMode ? 'ring-stone-900/50' : 'ring-white'} transition-all group-hover/step:scale-125`}
                                                                                        style={{ backgroundColor: dotColor, boxShadow: darkMode ? `0 0 10px ${dotColor}55` : 'none' }}
                                                                                    ></div>

                                                                                    <div className="flex flex-col gap-1 -translate-y-0.5">
                                                                                        <span className="text-[8px] font-black uppercase tracking-widest leading-none" style={{ color: `${dotColor}aa` }}>{step.time} • {formatDuration(step.duration)}</span>
                                                                                        <p className={`font-black text-[11px] leading-tight ${darkMode ? 'text-stone-200' : 'text-stone-900'}`}>
                                                                                            <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-widest" style={{ backgroundColor: `${dotColor}1a`, color: dotColor, border: `1px solid ${dotColor}33` }}>
                                                                                                {label}
                                                                                            </span>
                                                                                        </p>
                                                                                        {(ctxItemName || ctxItemPrice) && (
                                                                                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md truncate max-w-full ${darkMode ? 'bg-white/5 text-white/70 border border-white/5' : 'bg-white text-stone-700 border border-stone-200'}`}>
                                                                                                    {ctxItemName || 'Produit'}{ctxItemPrice ? ` · ${ctxItemPrice}€` : ''}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                        {ctxCategoryId && !ctxItemName && (
                                                                                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                                                                <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400/90 border border-indigo-500/10 px-2 py-0.5 rounded-md truncate max-w-full uppercase tracking-widest">
                                                                                                    {ctxCategoryId}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                        {/* Fallback legacy : itemId brut si pas de context */}
                                                                                        {!ctxItemName && !ctxCategoryId && step.itemId && (
                                                                                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                                                                <span className="text-[8px] font-bold bg-indigo-500/10 text-indigo-400/80 border border-indigo-500/10 px-2 py-0.5 rounded-md truncate max-w-full italic">
                                                                                                    {step.itemId}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                );
                                                                            })
                                                                        ))}
                                                                    </div>
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                        })}
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
            </div>

            {/* FOOTER INFO MODULE 5 */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 py-4 border-t border-white/5">
                {[
                    "Sessions admin auto-exclues",
                    "IPs blacklistées au login",
                    "Sessions résumées: 1 an",
                    "Parcours détaillés: 90 jours"
                ].map((info, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-stone-700"></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-600">{info}</span>
                    </div>
                ))}
            </div>
            </>
            )}
        </div>
    );
};

export default AdminAnalytics;
