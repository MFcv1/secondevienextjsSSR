import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowRight,
    ChevronRight,
    Clock,
    Eye,
    GitBranch,
    LocateFixed,
    Map as MapIcon,
    Maximize2,
    Monitor,
    MousePointer2,
    Radio,
    RefreshCw,
    Route,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Timer,
    Users,
    X
} from 'lucide-react';
import { getMillis } from '../../utils/time';
import useLiveJourneyMap from './hooks/useLiveJourneyMap';
import {
    MAP_HEIGHT,
    MAP_WIDTH,
    PRIORITY_LABELS,
    SECTION_LABELS,
    TIME_FILTERS,
    buildSiteMapModel,
    createPath,
    formatDuration,
    formatTimeAgo,
    getEventPreview,
    getJourneyPreview,
    getLastStep,
    getVisibleEdges,
    getVisitorId,
    isSessionLive,
    findNodeForEvent,
    findNodeForStep,
    nodeMatchesEvent,
    nodeMatchesStep,
    priorityTone
} from './siteMapModel';

const INITIAL_TRANSFORM = { x: -108, y: -22, scale: 0.52 };
const MIN_ZOOM = 0.36;
const MAX_ZOOM = 1.18;
const NODE_HIT_PADDING = 10;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getStepTimestamp = (entry, fallback = 0) => Number(entry?.timestamp) || fallback || 0;

const getSessionTimestamp = (session) => (
    getMillis(session.lastActivityAt) || getMillis(session.startedAt) || 0
);

const getBehaviorBadge = (node) => {
    if (!node) return null;
    if (node.id === 'checkout_success') return { label: 'Commande', tone: '#34d399' };
    if (node.id === 'checkout') return { label: 'Checkout', tone: '#22c55e' };
    if (node.id === 'cart_actions') return { label: 'Panier', tone: '#fb923c' };
    if (node.id === 'quote_request') return { label: 'Devis', tone: '#f59e0b' };
    if (node.id === 'product_detail') return { label: 'Decision', tone: '#f472b6' };
    return null;
};

const buildScopedBehavior = (model, sessions = []) => {
    const nodeStats = {};
    const edgeKeys = new Set();
    const orderedEntries = [];
    let fallbackIndex = 0;

    const pushEntry = (session, rawEntry, node, kind = 'step') => {
        if (!node) return;
        fallbackIndex += 1;
        const timestamp = getStepTimestamp(rawEntry, getSessionTimestamp(session) + fallbackIndex);
        orderedEntries.push({
            node,
            sessionId: session.id,
            timestamp,
            duration: Number(rawEntry?.duration) || 0,
            kind,
            label: rawEntry?.pageLabel || rawEntry?.action || node.label
        });
    };

    sessions.forEach((session) => {
        getJourneyPreview(session).forEach((step) => {
            pushEntry(session, step, findNodeForStep(model.nodes, step), 'step');
        });
        getEventPreview(session).forEach((event) => {
            pushEntry(session, event, findNodeForEvent(model.nodes, event), 'event');
        });
    });

    orderedEntries.sort((a, b) => a.timestamp - b.timestamp);

    orderedEntries.forEach((entry, index) => {
        const nodeId = entry.node.id;
        const current = nodeStats[nodeId] || {
            nodeId,
            firstOrder: index + 1,
            lastOrder: index + 1,
            visits: 0,
            totalDuration: 0,
            firstAt: entry.timestamp,
            lastAt: entry.timestamp,
            hasEvent: false,
            badge: getBehaviorBadge(entry.node)
        };

        current.visits += 1;
        current.totalDuration += entry.duration;
        current.lastOrder = index + 1;
        current.firstAt = Math.min(current.firstAt || entry.timestamp, entry.timestamp);
        current.lastAt = Math.max(current.lastAt || 0, entry.timestamp);
        current.hasEvent = current.hasEvent || entry.kind === 'event';
        current.badge = current.badge || getBehaviorBadge(entry.node);
        nodeStats[nodeId] = current;

        const previous = orderedEntries[index - 1];
        if (previous && previous.node.id !== nodeId) {
            edgeKeys.add(`${previous.node.id}->${nodeId}`);
        }
    });

    const startNodeId = orderedEntries[0]?.node.id || null;
    const endNodeId = orderedEntries[orderedEntries.length - 1]?.node.id || null;
    const conversionEntry = [...orderedEntries].reverse().find((entry) => (
        ['checkout_success', 'checkout', 'cart_actions', 'quote_request'].includes(entry.node.id)
    )) || null;

    return {
        nodeStats,
        edgeKeys,
        orderedEntries,
        startNodeId,
        endNodeId,
        conversionNodeId: conversionEntry?.node.id || null
    };
};

const StatTile = ({ label, value, icon: Icon, tone = '#ffffff', caption }) => (
    <div className="min-w-0 border-r border-white/[0.07] bg-[#080808]/72 px-4 py-2.5 last:border-r-0">
        <div className="mb-1 flex items-center gap-2 text-white/36">
            <Icon size={13} strokeWidth={1.35} />
            <span className="text-[9px] font-black uppercase tracking-[0.08em]">{label}</span>
        </div>
        <div className="truncate text-[22px] font-black leading-none" style={{ color: tone }}>{value}</div>
        {caption && <p className="mt-1 truncate text-[10px] font-semibold text-white/32">{caption}</p>}
    </div>
);

const MapNode = React.memo(({ node, stats, selected, hovered, onSelect, onHover, onFocus, behavior, scoped }) => {
    const live = stats?.live || 0;
    const visits = stats?.visits || 0;
    const actions = stats?.actions || 0;
    const score = stats?.frictionScore || 0;
    const color = node.color;
    const compact = node.compact;
    const behaviorVisited = Boolean(behavior);
    const dimmed = scoped && !behaviorVisited;
    const behaviorBadge = behavior?.badge;

    return (
        <button
            type="button"
            data-map-node="true"
            draggable={false}
            onClick={() => onSelect(node)}
            onDoubleClick={() => onFocus(node)}
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerEnter={() => onHover(node.id)}
            onPointerLeave={() => onHover(null)}
            className={`group absolute touch-none select-none text-left outline-none transition-[filter,transform,opacity] duration-200 ease-out ${selected ? 'z-[7]' : behaviorVisited ? 'z-[4]' : 'z-[1]'}`}
            style={{
                left: node.x - NODE_HIT_PADDING,
                top: node.y - NODE_HIT_PADDING,
                width: node.w + NODE_HIT_PADDING * 2,
                height: node.h + NODE_HIT_PADDING * 2,
                cursor: 'pointer',
                opacity: dimmed ? 0.22 : 1,
                transform: selected ? 'translate3d(0,-4px,0) scale(1.025)' : hovered ? 'translate3d(0,-2px,0)' : 'translate3d(0,0,0)',
                filter: selected
                    ? `drop-shadow(0 0 24px ${color}55)`
                    : behaviorVisited
                        ? `drop-shadow(0 0 18px ${color}38)`
                        : live ? `drop-shadow(0 0 16px ${color}44)` : undefined
            }}
            aria-label={node.label}
        >
            <span
                className="pointer-events-none absolute inset-0 rounded-[26px] border transition duration-200"
                style={{
                    borderColor: selected || hovered || behaviorVisited ? `${color}70` : 'transparent',
                    background: hovered || behaviorVisited ? `${color}${behaviorVisited ? '12' : '10'}` : 'transparent'
                }}
            />
            <div
                className="absolute rounded-[18px] p-px"
                style={{
                    inset: NODE_HIT_PADDING,
                    background: selected || behaviorVisited
                        ? `linear-gradient(135deg, ${color}, rgba(255,255,255,0.22), ${color}88)`
                        : `linear-gradient(135deg, ${color}70, rgba(255,255,255,0.09), rgba(255,255,255,0.03))`
                }}
            >
                <div className="relative flex h-full overflow-hidden rounded-[17px] bg-[#0a0a0a] ring-1 ring-white/[0.05]">
                    {behaviorVisited && (
                        <div className="pointer-events-none absolute left-3 top-2 z-[3] flex items-center gap-1.5">
                            <span
                                className="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[9px] font-black text-black shadow-[0_0_18px_rgba(255,255,255,0.18)]"
                                style={{ background: color }}
                            >
                                {behavior.firstOrder}
                            </span>
                            {behaviorBadge && (
                                <span
                                    className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.04em]"
                                    style={{ background: `${behaviorBadge.tone}22`, color: behaviorBadge.tone, border: `1px solid ${behaviorBadge.tone}40` }}
                                >
                                    {behaviorBadge.label}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="w-1.5 shrink-0" style={{ background: `linear-gradient(180deg, ${color}, ${color}33)` }} />
                    <div className={`${compact ? 'p-3' : 'p-4'} min-w-0 flex-1`}>
                        <div className={`flex items-start justify-between gap-3 ${behaviorVisited ? 'pt-4' : ''}`}>
                            <div className="min-w-0">
                                <p className={`${compact ? 'text-[10px]' : 'text-xs'} truncate font-black uppercase text-white`}>
                                    {node.label}
                                </p>
                                <p className="mt-1 truncate text-[10px] font-bold uppercase text-white/38">{node.subtitle}</p>
                            </div>
                            <span
                                className="shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase"
                                style={{ backgroundColor: `${priorityTone[node.priority]}18`, color: priorityTone[node.priority] }}
                            >
                                {node.priority.toUpperCase()}
                            </span>
                        </div>

                        <div className={`mt-3 grid ${compact ? 'grid-cols-2' : 'grid-cols-4'} gap-2 text-[10px] font-black uppercase text-white/42`}>
                            <div>
                                <span className="block text-white/25">Vues</span>
                                <span className="text-white/88">{visits}</span>
                            </div>
                            <div>
                                <span className="block text-white/25">Live</span>
                                <span style={{ color: live ? '#34d399' : 'rgba(255,255,255,0.46)' }}>{live}</span>
                            </div>
                            {!compact && (
                                <>
                                    <div>
                                        <span className="block text-white/25">Act.</span>
                                        <span className="text-white/88">{actions}</span>
                                    </div>
                                    <div>
                                        <span className="block text-white/25">Fric.</span>
                                        <span style={{ color: score > 60 ? '#f97316' : 'rgba(255,255,255,0.86)' }}>{score}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {live > 0 && (
                        <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 18px ${color}` }}>
                            <span className="absolute inset-0 animate-ping rounded-full" style={{ background: color }} />
                        </span>
                    )}
                    {scoped && behavior?.isEnd && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-white px-2 py-1 text-[8px] font-black uppercase tracking-[0.05em] text-black">
                            Fin ici
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
});

const FlowEdge = React.memo(({ edge, source, target, metric, active, scoped, observed }) => {
    const count = metric?.count || 0;
    const live = metric?.live || 0;
    const path = createPath(source, target);
    const color = edge.action ? '#fb923c' : source.color || '#ffffff';
    const width = scoped
        ? (observed ? 4.6 : 1)
        : active ? 3.4 : Math.min(4.2, 1.1 + Math.log10(count + 1) * 1.45);
    const opacity = scoped
        ? (observed ? 0.88 : 0.035)
        : active ? 0.78 : count > 0 ? 0.42 : edge.faint ? 0.075 : 0.14;
    const pulseCount = scoped
        ? (observed ? Math.min(4, Math.max(1, count)) : 0)
        : Math.min(5, Math.max(live, count > 0 ? 1 : 0));

    return (
        <g pointerEvents="none">
            <path
                d={path}
                fill="none"
                stroke="rgba(255,255,255,0.035)"
                strokeWidth={Math.max(width + 8, 9)}
                strokeLinecap="round"
            />
            <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={width}
                strokeOpacity={opacity}
                strokeLinecap="round"
                strokeDasharray={scoped ? (observed ? '10 8' : undefined) : edge.observedOnly ? '7 10' : active ? '10 12' : undefined}
                className={(scoped && observed) || active || edge.observedOnly ? 'admin-map-edge-dash' : undefined}
            />
            {pulseCount > 0 && Array.from({ length: pulseCount }).map((_, index) => (
                <circle key={`${edge.source}-${edge.target}-${index}`} r={active ? 4.2 : 2.8} fill={target.color || color} opacity={active ? 0.95 : 0.7}>
                    <animateMotion
                        dur={`${2.6 + index * 0.45}s`}
                        begin={`${index * 0.32}s`}
                        repeatCount="indefinite"
                        path={path}
                    />
                </circle>
            ))}
        </g>
    );
});

const Inspector = ({ node, stats, sessions, transitions, now, onClose }) => {
    const pageSessions = useMemo(() => {
        if (!node) return [];
        return sessions
            .filter((session) => {
                const steps = getJourneyPreview(session);
                const events = getEventPreview(session);
                const lastStep = getLastStep(session);
                return nodeMatchesStep(node, lastStep)
                    || steps.some((step) => nodeMatchesStep(node, step))
                    || events.some((event) => nodeMatchesEvent(node, event));
            })
            .sort((a, b) => {
                const aLive = isSessionLive(a, now) ? 1 : 0;
                const bLive = isSessionLive(b, now) ? 1 : 0;
                return bLive - aLive || (getVisitorId(a) > getVisitorId(b) ? 1 : -1);
            })
            .slice(0, 9);
    }, [node, now, sessions]);

    const outgoing = useMemo(() => (
        node ? transitions.filter((transition) => transition.source === node.id).slice(0, 6) : []
    ), [node, transitions]);

    if (!node) {
        return (
            <aside className="h-full min-h-0 rounded-[28px] bg-white/[0.045] p-1.5 ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div
                    data-native-scroll-region
                    className="admin-map-scroll h-full overflow-y-auto overscroll-contain rounded-[23px] bg-[#080808] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    onWheel={(event) => event.stopPropagation()}
                >
                    <div className="mb-6 flex items-center gap-3 text-white/55">
                        <MousePointer2 size={16} strokeWidth={1.4} />
                        <p className="text-[11px] font-black uppercase">Selection</p>
                    </div>
                    <h3 className="max-w-xs text-2xl font-black leading-tight text-white">Aucun noeud selectionne.</h3>
                    <p className="mt-4 text-sm leading-6 text-white/45">
                        Les flux live, les actions et les sorties apparaissent ici des qu un module est cible.
                    </p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="h-full min-h-0 rounded-[28px] bg-white/[0.045] p-1.5 ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div
                data-native-scroll-region
                className="admin-map-scroll h-full overflow-y-auto overscroll-contain rounded-[23px] bg-[#080808] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                onWheel={(event) => event.stopPropagation()}
            >
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="mb-2 text-[10px] font-black uppercase text-white/34">{SECTION_LABELS[node.section]}</p>
                        <h3 className="truncate text-2xl font-black leading-none text-white">{node.label}</h3>
                        <p className="mt-2 text-sm leading-6 text-white/44">{node.note}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.07] text-white/56 ring-1 ring-white/[0.06] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white hover:text-black active:scale-[0.94]"
                        aria-label="Fermer"
                    >
                        <X size={15} strokeWidth={1.4} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <StatTile label="Vues" value={stats?.visits || 0} icon={Eye} tone="#f8fafc" />
                    <StatTile label="Live" value={stats?.live || 0} icon={Radio} tone="#34d399" />
                    <StatTile label="Actions" value={stats?.actions || 0} icon={ShoppingBag} tone="#fb923c" />
                    <StatTile label="Temps" value={formatDuration(stats?.avgDuration || 0)} icon={Timer} tone="#22d3ee" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-[22px] bg-white/[0.04] p-4 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <p className="text-[10px] font-black uppercase text-white/34">Friction</p>
                        <p className="mt-2 text-3xl font-black text-orange-300">{stats?.frictionScore || 0}</p>
                    </div>
                    <div className="rounded-[22px] bg-white/[0.04] p-4 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <p className="text-[10px] font-black uppercase text-white/34">Opportunite</p>
                        <p className="mt-2 text-3xl font-black text-pink-300">{stats?.opportunityScore || 0}</p>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase text-white/38">Sorties observees</p>
                        <GitBranch size={15} strokeWidth={1.4} className="text-white/34" />
                    </div>
                    <div className="space-y-2">
                        {outgoing.length === 0 ? (
                            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-xs font-bold text-white/34">
                                Aucun flux observe sur cette fenetre.
                            </p>
                        ) : outgoing.map((transition) => (
                            <div key={`${transition.source}-${transition.target}`} className="flex items-center justify-between gap-3 rounded-2xl bg-black/30 px-3 py-2 ring-1 ring-white/[0.04]">
                                <span className="truncate text-xs font-black text-white/72">{transition.targetLabel}</span>
                                <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-black text-white/48">{transition.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase text-white/38">Sessions liees</p>
                        <span className="text-[10px] font-black text-white/28">{pageSessions.length}</span>
                    </div>
                    <div className="space-y-2">
                        {pageSessions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center text-xs font-bold text-white/34">
                                Aucune session sur ce module.
                            </div>
                        ) : pageSessions.map((session) => {
                            const live = isSessionLive(session, now);
                            const lastActive = session.lastActivityAt?.toMillis ? session.lastActivityAt.toMillis() : 0;
                            const DeviceIcon = session.device === 'Mobile' ? Smartphone : Monitor;
                            return (
                                <div key={session.id} className="rounded-2xl bg-white/[0.035] p-3 ring-1 ring-white/[0.055]">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-300' : 'bg-white/20'}`} />
                                            <span className="truncate text-xs font-black text-white/76">{session.geo?.city || session.device || 'Visiteur'}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-white/32">{formatTimeAgo(lastActive, now)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-white/34">
                                        <DeviceIcon size={12} strokeWidth={1.4} />
                                        <span>{session.device || 'Device'}</span>
                                        <span>/</span>
                                        <span>{session.browser || 'Browser'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </aside>
    );
};

const AdminSiteMap = ({
    onExit,
    sessionsOverride = null,
    title = 'Ramifications live',
    subtitle = 'Routes possibles, flux observes et actions business synchronises depuis les sessions analytics.',
    subjectName = 'Seconde Vie',
    subjectInitials = 'SV',
    modeLabel = 'Admin Map',
    embedded = false
}) => {
    const model = useMemo(buildSiteMapModel, []);
    const nodesById = useMemo(() => Object.fromEntries(model.nodes.map((node) => [node.id, node])), [model.nodes]);
    const isScoped = Array.isArray(sessionsOverride);
    const [timeFilter, setTimeFilter] = useState(() => (isScoped ? '7d' : '15m'));
    const [selectedNodeId, setSelectedNodeId] = useState('gallery_landing');
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(INITIAL_TRANSFORM.scale);
    const viewportRef = useRef(null);
    const canvasRef = useRef(null);
    const transformRef = useRef({ ...INITIAL_TRANSFORM });
    const frameRef = useRef(null);
    const dragRef = useRef({ x: 0, y: 0, tx: 0, ty: 0, pointerId: null });

    const {
        activeFilter,
        analytics,
        error,
        lastSyncedAt,
        loading,
        now,
        sessions
    } = useLiveJourneyMap(model, timeFilter, {
        enabled: !isScoped,
        sessionsOverride
    });

    const scopedBehavior = useMemo(
        () => (isScoped ? buildScopedBehavior(model, sessions) : null),
        [isScoped, model, sessions]
    );
    const visibleEdges = useMemo(() => getVisibleEdges(model, analytics), [analytics, model]);
    const selectedNode = nodesById[selectedNodeId] || null;
    const selectedStats = selectedNode ? analytics.nodeStats[selectedNode.id] : null;
    const totalVisits = Object.values(analytics.nodeStats).reduce((sum, stats) => sum + stats.visits, 0);
    const totalActions = Object.values(analytics.nodeStats).reduce((sum, stats) => sum + stats.actions, 0);
    const uniqueVisitors = new Set(sessions.map(getVisitorId)).size;
    const liveUsers = analytics.activeSessions.length;
    const syncLag = lastSyncedAt ? Math.max(0, now - lastSyncedAt) : 0;

    const topRoutes = analytics.transitions.slice(0, 5);

    const applyTransform = useCallback((next, syncZoom = false) => {
        transformRef.current = {
            x: next.x,
            y: next.y,
            scale: clamp(next.scale, MIN_ZOOM, MAX_ZOOM)
        };

        if (!frameRef.current) {
            frameRef.current = window.requestAnimationFrame(() => {
                frameRef.current = null;
                const current = transformRef.current;
                if (canvasRef.current) {
                    canvasRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) scale(${current.scale})`;
                }
            });
        }

        if (syncZoom) {
            setZoomLevel(transformRef.current.scale);
        }
    }, []);

    const handleWheel = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();

        const viewport = viewportRef.current;
        if (!viewport) return;

        const rect = viewport.getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;
        const current = transformRef.current;
        const worldX = (px - current.x) / current.scale;
        const worldY = (py - current.y) / current.scale;
        const nextScale = clamp(current.scale * Math.exp(-event.deltaY * 0.0012), MIN_ZOOM, MAX_ZOOM);

        applyTransform({
            scale: nextScale,
            x: px - worldX * nextScale,
            y: py - worldY * nextScale
        }, true);
    }, [applyTransform]);

    const handlePointerDown = useCallback((event) => {
        if (event.button !== 0) return;
        if (event.target instanceof Element && event.target.closest('[data-map-node="true"]')) return;

        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        dragRef.current = {
            x: event.clientX,
            y: event.clientY,
            tx: transformRef.current.x,
            ty: transformRef.current.y,
            pointerId: event.pointerId
        };
        setIsDragging(true);
    }, []);

    const handlePointerMove = useCallback((event) => {
        if (!isDragging) return;
        event.preventDefault();
        const dx = event.clientX - dragRef.current.x;
        const dy = event.clientY - dragRef.current.y;
        applyTransform({
            ...transformRef.current,
            x: dragRef.current.tx + dx,
            y: dragRef.current.ty + dy
        });
    }, [applyTransform, isDragging]);

    const stopDragging = useCallback((event) => {
        if (dragRef.current.pointerId !== null) {
            event?.currentTarget?.releasePointerCapture?.(dragRef.current.pointerId);
        }
        dragRef.current.pointerId = null;
        setIsDragging(false);
    }, []);

    const focusNode = useCallback((node, scale = 0.74) => {
        if (!node) return;
        setSelectedNodeId(node.id);
        applyTransform({
            scale,
            x: 560 - node.x * scale,
            y: 340 - node.y * scale
        }, true);
    }, [applyTransform]);

    const focusLive = useCallback(() => {
        const liveEntry = Object.entries(analytics.nodeStats).find(([, stats]) => stats.live > 0);
        const node = liveEntry ? nodesById[liveEntry[0]] : nodesById[analytics.hotNodeId] || nodesById.gallery_landing;
        focusNode(node);
    }, [analytics.hotNodeId, analytics.nodeStats, focusNode, nodesById]);

    const resetView = useCallback(() => {
        applyTransform({ ...INITIAL_TRANSFORM }, true);
        setSelectedNodeId(scopedBehavior?.endNodeId || scopedBehavior?.conversionNodeId || scopedBehavior?.startNodeId || 'gallery_landing');
    }, [applyTransform, scopedBehavior?.conversionNodeId, scopedBehavior?.endNodeId, scopedBehavior?.startNodeId]);

    useEffect(() => {
        if (!isScoped) return;
        const targetId = scopedBehavior?.endNodeId || scopedBehavior?.conversionNodeId || scopedBehavior?.startNodeId;
        if (!targetId) return;
        const targetNode = nodesById[targetId];
        if (!targetNode) return;
        focusNode(targetNode, 0.62);
    }, [focusNode, isScoped, nodesById, scopedBehavior?.conversionNodeId, scopedBehavior?.endNodeId, scopedBehavior?.startNodeId]);

    const startNode = scopedBehavior?.startNodeId ? nodesById[scopedBehavior.startNodeId] : null;
    const endNode = scopedBehavior?.endNodeId ? nodesById[scopedBehavior.endNodeId] : null;
    const conversionNode = scopedBehavior?.conversionNodeId ? nodesById[scopedBehavior.conversionNodeId] : null;

    return (
        <section className={`${embedded ? 'relative h-[min(82vh,820px)] min-h-[640px] rounded-[2rem] border border-white/10 shadow-2xl shadow-black/30' : 'fixed inset-0 z-[80] h-[100dvh] w-screen'} overflow-hidden bg-[#050505] text-white`}>
            <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(34,211,238,0.12),transparent_26%),radial-gradient(circle_at_84%_34%,rgba(244,114,182,0.1),transparent_28%),radial-gradient(circle_at_70%_88%,rgba(52,211,153,0.1),transparent_30%)]" />
                <div className="absolute inset-0 admin-map-grain opacity-[0.07]" />
            </div>

            <div className="relative z-[1] grid h-full min-h-0 grid-cols-1 gap-3 p-3 lg:grid-cols-[252px_minmax(0,1fr)_360px] lg:p-3">
                <aside className="hidden min-h-0 rounded-[28px] bg-white/[0.035] p-1.5 ring-1 ring-white/[0.075] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] lg:flex lg:flex-col">
                    <div className="flex h-full min-h-0 flex-col rounded-[23px] bg-[#080808]/94 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                    <div className="mb-5 rounded-[22px] bg-white/[0.035] p-3 ring-1 ring-white/[0.06]">
                        <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-[17px] bg-gradient-to-br from-cyan-300 via-violet-300 to-pink-300 text-sm font-black text-black shadow-[0_18px_36px_rgba(34,211,238,0.12)]">
                            {subjectInitials}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black leading-none text-white">{subjectName}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase text-white/34">{modeLabel}</p>
                        </div>
                        </div>
                    </div>

                    <nav className="space-y-1.5">
                        {[
                            { id: 'architecture', label: 'Architecture', icon: GitBranch, active: true },
                            { id: 'flux', label: 'Flux observes', icon: Route },
                            { id: 'live', label: 'Live users', icon: Radio },
                            { id: 'friction', label: 'Friction', icon: AlertTriangle }
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.id}
                                    className={`flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.05em] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                                        item.active ? 'bg-white text-black shadow-[0_18px_38px_rgba(255,255,255,0.08)]' : 'bg-white/[0.035] text-white/42 ring-1 ring-white/[0.035] hover:bg-white/[0.06] hover:text-white/62'
                                    }`}
                                >
                                    <Icon size={14} strokeWidth={1.35} />
                                    <span>{item.label}</span>
                                </div>
                            );
                        })}
                    </nav>

                    <div className="mt-5 space-y-2.5">
                        <p className="px-3 text-[10px] font-black uppercase text-white/26">Priorites</p>
                        {Object.entries(PRIORITY_LABELS).map(([id, label]) => (
                            <div key={id} className="flex items-center justify-between rounded-[18px] bg-white/[0.028] px-3 py-2 ring-1 ring-white/[0.04]">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full" style={{ background: priorityTone[id], boxShadow: `0 0 14px ${priorityTone[id]}55` }} />
                                    <span className="text-[10px] font-black uppercase text-white/50">{label}</span>
                                </div>
                                <span className="text-[9px] font-black text-white/26">{id.toUpperCase()}</span>
                            </div>
                        ))}
                    </div>

                    <div
                        data-native-scroll-region
                        className="admin-map-scroll mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
                        onWheel={(event) => event.stopPropagation()}
                    >
                        <p className="mb-3 px-3 text-[10px] font-black uppercase text-white/26">Top routes</p>
                        <div className="space-y-2">
                            {topRoutes.length === 0 ? (
                                <p className="rounded-[18px] bg-white/[0.03] p-3 text-xs font-bold text-white/34 ring-1 ring-white/[0.04]">En attente de flux.</p>
                            ) : topRoutes.map((route) => (
                                <button
                                    key={`${route.source}-${route.target}`}
                                    type="button"
                                    onClick={() => focusNode(nodesById[route.source])}
                                    className="group w-full rounded-[19px] bg-white/[0.035] p-3 text-left ring-1 ring-white/[0.05] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-white/[0.07]"
                                >
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/62">
                                        <span className="truncate">{route.sourceLabel}</span>
                                        <ArrowRight size={12} strokeWidth={1.4} className="shrink-0 text-white/28 transition-transform duration-500 group-hover:translate-x-0.5" />
                                        <span className="truncate">{route.targetLabel}</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-white/34">
                                        <span>{route.count} passages</span>
                                        {route.live > 0 && <span className="text-emerald-300">{route.live} live</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onExit}
                        className="mt-4 flex w-full items-center justify-between rounded-full bg-white px-4 py-3 text-[11px] font-black uppercase text-black transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-stone-100 active:scale-[0.97]"
                    >
                        {isScoped ? 'Retour data' : 'Retour admin'}
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-black/[0.08]">
                            <ChevronRight size={13} strokeWidth={1.4} className="rotate-180" />
                        </span>
                    </button>
                    </div>
                </aside>

                <main className="flex min-h-0 flex-col overflow-hidden rounded-[28px] bg-[#060606]/95 ring-1 ring-white/[0.075] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
                    <header className="shrink-0 border-b border-white/[0.07] bg-[#080808]/78 px-4 py-3 md:px-5">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="min-w-0">
                                <div className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-white/32">
                                    <MapIcon size={13} strokeWidth={1.35} />
                                    <span>Admin</span>
                                    <ChevronRight size={12} strokeWidth={1.4} />
                                    <span>Parcours client</span>
                                </div>
                                <h2 className="truncate text-[clamp(1.45rem,1.85vw,2.05rem)] font-black leading-none text-white">
                                    {title}
                                </h2>
                                <p className="mt-1.5 max-w-3xl text-xs font-semibold leading-5 text-white/38">
                                    {subtitle}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {!isScoped && TIME_FILTERS.map((filter) => (
                                    <button
                                        key={filter.id}
                                        type="button"
                                        onClick={() => setTimeFilter(filter.id)}
                                        className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.04em] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
                                            timeFilter === filter.id
                                                ? 'bg-white text-black'
                                                : 'bg-white/[0.055] text-white/48 ring-1 ring-white/[0.06] hover:bg-white/[0.09] hover:text-white'
                                        }`}
                                    >
                                            {filter.label}
                                    </button>
                                ))}
                                {isScoped && (
                                    <div className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.04em] text-black">
                                        Cumul visiteur
                                    </div>
                                )}
                                <button type="button" onClick={focusLive} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.04em] text-black transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]">
                                    Focus live
                                    <LocateFixed size={13} strokeWidth={1.4} />
                                </button>
                                <button type="button" onClick={resetView} className="inline-flex items-center gap-2 rounded-full bg-white/[0.055] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.04em] text-white/58 ring-1 ring-white/[0.06] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.1] hover:text-white active:scale-[0.97]">
                                    Recentrer
                                    <Maximize2 size={13} strokeWidth={1.4} />
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-2 border-b border-white/[0.07] bg-white/[0.055] sm:grid-cols-5">
                        <StatTile label="Sessions" value={sessions.length} icon={Users} tone="#f8fafc" caption={isScoped ? 'cumul' : activeFilter.label} />
                        <StatTile label="Uniques" value={uniqueVisitors} icon={Sparkles} tone="#c4b5fd" />
                        <StatTile label="Etapes" value={totalVisits} icon={Route} tone="#67e8f9" />
                        <StatTile label="Actions" value={totalActions} icon={ShoppingBag} tone="#fb923c" />
                        <StatTile label="Live" value={liveUsers} icon={Radio} tone="#34d399" caption={`${Math.round(syncLag)} ms`} />
                    </div>

                    <div
                        ref={viewportRef}
                        className={`relative min-h-0 flex-1 select-none overflow-hidden bg-[#070707] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
                        onWheel={handleWheel}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={stopDragging}
                        onPointerLeave={stopDragging}
                        onPointerCancel={stopDragging}
                    >
                        <div className="pointer-events-none absolute inset-0 admin-map-dotgrid opacity-55" />
                        <div className="pointer-events-none absolute left-5 top-5 z-[4] flex items-center gap-2 rounded-full bg-black/72 px-3 py-2 text-[10px] font-black uppercase text-white/38 ring-1 ring-white/[0.08]">
                            {loading ? <RefreshCw size={12} strokeWidth={1.4} className="animate-spin" /> : <Clock size={12} strokeWidth={1.4} />}
                            {loading ? 'Synchronisation' : (isScoped ? 'Cumul sessions' : `Fenetre ${activeFilter.label}`)}
                        </div>
                        {error && (
                            <div className="absolute right-5 top-5 z-[5] flex max-w-sm items-center gap-2 rounded-2xl bg-red-500/12 px-4 py-3 text-xs font-bold text-red-100 ring-1 ring-red-300/20">
                                <AlertTriangle size={15} strokeWidth={1.4} />
                                Listener analytics indisponible.
                            </div>
                        )}
                        {isScoped && (
                            <div className="pointer-events-none absolute right-5 top-5 z-[5] w-[min(360px,calc(100%-2.5rem))] rounded-[22px] bg-black/74 p-3 ring-1 ring-white/[0.08] backdrop-blur-md">
                                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.08em] text-white/34">Lecture comportement</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-2xl bg-white/[0.055] p-2 ring-1 ring-white/[0.05]">
                                        <p className="text-[8px] font-black uppercase text-white/28">Debut</p>
                                        <p className="mt-1 truncate text-[11px] font-black text-white/82">{startNode?.label || '-'}</p>
                                    </div>
                                    <div className="rounded-2xl bg-emerald-400/[0.08] p-2 ring-1 ring-emerald-300/10">
                                        <p className="text-[8px] font-black uppercase text-emerald-200/42">Commande</p>
                                        <p className="mt-1 truncate text-[11px] font-black text-emerald-200">{conversionNode?.label || 'Aucune'}</p>
                                    </div>
                                    <div className="rounded-2xl bg-orange-300/[0.08] p-2 ring-1 ring-orange-300/10">
                                        <p className="text-[8px] font-black uppercase text-orange-200/42">Fin</p>
                                        <p className="mt-1 truncate text-[11px] font-black text-orange-100">{endNode?.label || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div
                            ref={canvasRef}
                            className={`absolute left-0 top-0 h-[980px] w-[2860px] select-none will-change-transform ${zoomLevel < 0.5 ? 'admin-map-zoomed-out' : ''}`}
                            style={{
                                transform: `translate3d(${INITIAL_TRANSFORM.x}px, ${INITIAL_TRANSFORM.y}px, 0) scale(${INITIAL_TRANSFORM.scale})`,
                                transformOrigin: '0 0'
                            }}
                        >
                            <svg className="pointer-events-none absolute inset-0 overflow-visible" width={MAP_WIDTH} height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
                                {visibleEdges.map((edge) => {
                                    const source = nodesById[edge.source];
                                    const target = nodesById[edge.target];
                                    if (!source || !target) return null;
                                    const metric = analytics.transitionByKey.get(`${edge.source}->${edge.target}`);
                                    const active = selectedNodeId && (selectedNodeId === edge.source || selectedNodeId === edge.target);
                                    const observed = scopedBehavior?.edgeKeys.has(`${edge.source}->${edge.target}`);
                                    return (
                                        <FlowEdge
                                            key={`${edge.source}-${edge.target}`}
                                            edge={edge}
                                            source={source}
                                            target={target}
                                            metric={metric}
                                            active={active || hoveredNodeId === edge.source || hoveredNodeId === edge.target}
                                            scoped={isScoped}
                                            observed={observed}
                                        />
                                    );
                                })}
                            </svg>

                            {model.nodes.map((node) => {
                                const behavior = scopedBehavior?.nodeStats[node.id];
                                const behaviorWithFlags = behavior ? {
                                    ...behavior,
                                    isStart: scopedBehavior.startNodeId === node.id,
                                    isEnd: scopedBehavior.endNodeId === node.id,
                                    isConversion: scopedBehavior.conversionNodeId === node.id
                                } : null;
                                return (
                                    <MapNode
                                        key={node.id}
                                        node={node}
                                        stats={analytics.nodeStats[node.id]}
                                        selected={selectedNodeId === node.id}
                                        hovered={hoveredNodeId === node.id}
                                        onSelect={(nextNode) => setSelectedNodeId(nextNode.id)}
                                        onHover={setHoveredNodeId}
                                        onFocus={focusNode}
                                        scoped={isScoped}
                                        behavior={behaviorWithFlags}
                                    />
                                );
                            })}
                        </div>

                        <div className="absolute bottom-4 left-4 z-[5] hidden max-w-[760px] flex-wrap gap-2 md:flex">
                            {Object.entries(PRIORITY_LABELS).map(([id, label]) => (
                                <div key={id} className="flex items-center gap-2 rounded-full bg-black/64 px-3 py-1.5 text-[10px] font-black uppercase text-white/38 ring-1 ring-white/[0.06]">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: priorityTone[id] }} />
                                    {id.toUpperCase()} {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedNodeId || 'empty'}
                        className="hidden min-h-0 lg:block"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
                    >
                        <Inspector
                            node={selectedNode}
                            stats={selectedStats}
                            sessions={sessions}
                            transitions={analytics.transitions}
                            now={now}
                            onClose={() => setSelectedNodeId(null)}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        className="absolute inset-x-3 bottom-3 z-[6] lg:hidden"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                    >
                        <Inspector
                            node={selectedNode}
                            stats={selectedStats}
                            sessions={sessions}
                            transitions={analytics.transitions}
                            now={now}
                            onClose={() => setSelectedNodeId(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .admin-map-dotgrid {
                    background-image: radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1px);
                    background-size: 22px 22px;
                }
                .admin-map-grain {
                    background-image:
                        linear-gradient(115deg, rgba(255,255,255,0.08), transparent 28%),
                        repeating-linear-gradient(0deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 3px);
                    mix-blend-mode: screen;
                }
                .admin-map-edge-dash {
                    animation: adminMapDash 1.6s linear infinite;
                }
                .admin-map-zoomed-out [data-map-node="true"] > span {
                    border-color: rgba(255,255,255,0.12) !important;
                    background: rgba(255,255,255,0.025) !important;
                }
                .admin-map-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.22) transparent;
                    scrollbar-gutter: stable;
                    overscroll-behavior: contain;
                }
                .admin-map-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .admin-map-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .admin-map-scroll::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.1));
                    border: 2px solid #080808;
                    border-radius: 999px;
                }
                .admin-map-scroll::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, rgba(255,255,255,0.36), rgba(255,255,255,0.16));
                }
                @keyframes adminMapDash {
                    to { stroke-dashoffset: -44; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .admin-map-edge-dash {
                        animation: none;
                    }
                    circle animateMotion {
                        display: none;
                    }
                }
            `}</style>
        </section>
    );
};

export default AdminSiteMap;
