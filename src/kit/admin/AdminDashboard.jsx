import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';
import {
    TrendingUp, TrendingDown, ShoppingBag, AlertTriangle, RefreshCw, Mail,
    Archive, Users, Eye, FileText, Send, CircleDollarSign, PackageCheck
} from 'lucide-react';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, loadAuthModule } from '../config/firebase';
import { getProductImageItems } from '../../utils/imageUtils';
import { getProductUrl } from '../../utils/slug';
import { getMillis } from '../../utils/time';
import { downloadCsv } from './exportCsv';

// ─── MOTION & FORMAT HELPERS ───

const EASE_OUT = [0.16, 1, 0.3, 1];

const sectionVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, delay: i * 0.09, ease: EASE_OUT }
    })
};

const formatEuroShort = (value) => {
    if (Math.abs(value) >= 1000) {
        const k = value / 1000;
        return `${k.toFixed(k >= 10 ? 0 : 1).replace('.', ',')}k€`;
    }
    return `${Math.round(value)}€`;
};

const AnimatedNumber = ({ value, format, duration = 1.4 }) => {
    const ref = useRef(null);
    const reducedMotion = useReducedMotion();
    const formatRef = useRef(format);
    formatRef.current = format;

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;
        const fmt = formatRef.current || ((v) => Math.round(v).toLocaleString('fr-FR'));
        if (reducedMotion) {
            node.textContent = fmt(value);
            return undefined;
        }
        const controls = animate(0, value, {
            duration,
            ease: EASE_OUT,
            onUpdate: (v) => { node.textContent = fmt(v); }
        });
        return () => controls.stop();
    }, [value, duration, reducedMotion]);

    return <span ref={ref} className="tabular-nums" />;
};

const TrendPill = ({ delta }) => {
    if (delta === null || delta === undefined || !Number.isFinite(delta)) return null;
    const positive = delta >= 0;
    return (
        <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg tabular-nums ${positive ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
            {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {positive ? '+' : ''}{Math.round(delta)}%
        </span>
    );
};

// ─── CUSTOM SVG CHARTS ───

const clampToRange = (value, min, max) => Math.max(min, Math.min(max, value));

// The Bézier control points are clamped to their adjacent values. This keeps
// the line smooth without inventing a dip below the zero baseline.
const buildBoundedMonotonePath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    const widths = [];
    const slopes = [];
    for (let index = 0; index < points.length - 1; index += 1) {
        const width = points[index + 1].x - points[index].x;
        widths.push(width);
        slopes.push(width > 0 ? (points[index + 1].y - points[index].y) / width : 0);
    }

    const tangents = Array(points.length).fill(0);
    if (points.length === 2) {
        tangents[0] = slopes[0];
        tangents[1] = slopes[0];
    } else {
        const endpointTangent = (firstWidth, secondWidth, firstSlope, secondSlope) => {
            let tangent = ((2 * firstWidth + secondWidth) * firstSlope - firstWidth * secondSlope) / (firstWidth + secondWidth);
            if (Math.sign(tangent) !== Math.sign(firstSlope)) return 0;
            if (Math.sign(firstSlope) !== Math.sign(secondSlope) && Math.abs(tangent) > Math.abs(3 * firstSlope)) {
                tangent = 3 * firstSlope;
            }
            return tangent;
        };

        tangents[0] = endpointTangent(widths[0], widths[1], slopes[0], slopes[1]);
        tangents[points.length - 1] = endpointTangent(
            widths[widths.length - 1],
            widths[widths.length - 2],
            slopes[slopes.length - 1],
            slopes[slopes.length - 2]
        );

        for (let index = 1; index < points.length - 1; index += 1) {
            const previousSlope = slopes[index - 1];
            const nextSlope = slopes[index];
            if (previousSlope === 0 || nextSlope === 0 || Math.sign(previousSlope) !== Math.sign(nextSlope)) continue;

            const previousWeight = 2 * widths[index] + widths[index - 1];
            const nextWeight = widths[index] + 2 * widths[index - 1];
            tangents[index] = (previousWeight + nextWeight) / ((previousWeight / previousSlope) + (nextWeight / nextSlope));
        }
    }

    let path = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
    for (let index = 0; index < points.length - 1; index += 1) {
        const from = points[index];
        const to = points[index + 1];
        const width = widths[index];
        const minY = Math.min(from.y, to.y);
        const maxY = Math.max(from.y, to.y);
        const controlOneY = clampToRange(from.y + (tangents[index] * width) / 3, minY, maxY);
        const controlTwoY = clampToRange(to.y - (tangents[index + 1] * width) / 3, minY, maxY);

        path += ` C ${(from.x + width / 3).toFixed(2)},${controlOneY.toFixed(2)} ${(to.x - width / 3).toFixed(2)},${controlTwoY.toFixed(2)} ${to.x.toFixed(2)},${to.y.toFixed(2)}`;
    }
    return path;
};

const buildLinearPath = (points) => points.reduce(
    (path, point, index) => `${path}${index === 0 ? 'M' : ' L'} ${point.x.toFixed(2)},${point.y.toFixed(2)}`,
    ''
);

// Conservé pour la réactivation contrôlée des projections Gate 7A.
// eslint-disable-next-line no-unused-vars
const RevenueChartLegacy = ({ data, darkMode }) => {
    const containerRef = useRef(null);
    const [dims, setDims] = useState({ w: 600, h: 240 });
    const [activeIdx, setActiveIdx] = useState(null);
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            if (entry.contentRect.width > 0) {
                setDims({ w: entry.contentRect.width, h: 240 });
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const maxVal = useMemo(() => Math.max(...data.map((point) => Math.max(0, Number(point.value) || 0)), 100), [data]);
    const margin = { top: 18, right: 12, bottom: 26, left: 46 };
    const chartW = Math.max(10, dims.w - margin.left - margin.right);
    const chartH = dims.h - margin.top - margin.bottom;
    const baseY = margin.top + chartH;
    const step = chartW / Math.max(1, data.length - 1);
    const denseSeries = data.length > 90;

    const points = useMemo(() => data.map((point, index) => {
        const value = Math.max(0, Number(point.value) || 0);
        return {
            x: margin.left + index * step,
            y: baseY - ((value / maxVal) * chartH)
        };
    }), [data, step, baseY, maxVal, chartH, margin.left]);

    const linePath = useMemo(
        () => (denseSeries ? buildLinearPath(points) : buildBoundedMonotonePath(points)),
        [denseSeries, points]
    );
    const areaPath = useMemo(() => {
        if (!linePath || points.length < 2) return '';
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        return `${linePath} L ${lastPoint.x.toFixed(2)},${baseY} L ${firstPoint.x.toFixed(2)},${baseY} Z`;
    }, [baseY, linePath, points]);

    const peakIdx = useMemo(() => {
        let indexOfPeak = -1;
        let peak = 0;
        data.forEach((point, index) => {
            const value = Math.max(0, Number(point.value) || 0);
            if (value > peak) {
                peak = value;
                indexOfPeak = index;
            }
        });
        return indexOfPeak;
    }, [data]);

    const xTickIndexes = useMemo(() => {
        if (data.length <= 7) return data.map((_, index) => index);
        if (data.length <= 31) {
            const every = Math.max(4, Math.ceil(data.length / 7));
            return data.reduce((indexes, point, index) => {
                const monthChanged = index > 0 && point.dateKey?.slice(0, 7) !== data[index - 1].dateKey?.slice(0, 7);
                if (index === 0 || index === data.length - 1 || index % every === 0 || monthChanged) indexes.push(index);
                return indexes;
            }, []);
        }

        const candidates = Array.from(new Set([
            0,
            ...data.reduce((indexes, point, index) => {
                if (point.dateKey?.slice(8, 10) === '01') indexes.push(index);
                return indexes;
            }, []),
            data.length - 1
        ])).sort((first, second) => first - second);
        const maximumTicks = Math.max(5, Math.floor(chartW / 60));
        if (candidates.length <= maximumTicks) return candidates;

        const every = Math.ceil((candidates.length - 2) / Math.max(1, maximumTicks - 2));
        return candidates.filter((_, index) => index === 0 || index === candidates.length - 1 || index % every === 0);
    }, [chartW, data]);

    const ticks = [1, 0.5, 0];
    const gridColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const labelColor = darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

    const handlePointerMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left - margin.left;
        let index = Math.round(x / step);
        index = Math.max(0, Math.min(data.length - 1, index));
        setActiveIdx(index);
    };

    return (
        <div
            ref={containerRef}
            className="relative h-[240px] w-full select-none"
            role="img"
            aria-label="Chiffre d’affaires quotidien"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setActiveIdx(null)}
        >
            <svg width={dims.w} height={dims.h} className="block overflow-visible">
                <defs>
                    <linearGradient id="dashAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={denseSeries ? 0.14 : 0.22} />
                        <stop offset="60%" stopColor="#3B82F6" stopOpacity={denseSeries ? 0.025 : 0.05} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="dashLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="100%" stopColor="#2563EB" />
                    </linearGradient>
                </defs>

                {ticks.map((tick) => {
                    const y = margin.top + chartH - (tick * chartH);
                    return (
                        <g key={tick}>
                            <line x1={margin.left} y1={y} x2={margin.left + chartW} y2={y}
                                  stroke={gridColor} strokeWidth="1" strokeDasharray={tick === 0 ? undefined : '3 5'} />
                            <text x={margin.left - 10} y={y + 3} textAnchor="end"
                                  style={{ fontSize: 9, fontWeight: 700, fill: labelColor, letterSpacing: '0.05em' }}>
                                {formatEuroShort(maxVal * tick)}
                            </text>
                        </g>
                    );
                })}

                {xTickIndexes.map((index) => (
                    <text key={`x-${index}`} x={points[index]?.x} y={baseY + 16} textAnchor="middle"
                          style={{ fontSize: 8, fontWeight: 700, fill: labelColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {data[index]?.axisLabel}
                    </text>
                ))}

                {data.length > 1 && (
                    <>
                        <motion.path
                            key={`area-${data.length}-${maxVal}`}
                            d={areaPath}
                            fill="url(#dashAreaGradient)"
                            initial={reducedMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.1, delay: 0.5 }}
                        />
                        <motion.path
                            key={`line-${data.length}-${maxVal}`}
                            d={linePath}
                            fill="none"
                            stroke="url(#dashLineGradient)"
                            strokeWidth={denseSeries ? 1.65 : 2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={reducedMotion ? false : { pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.35, ease: EASE_OUT }}
                        />
                        {peakIdx >= 0 && activeIdx === null && points[peakIdx] && (
                            <g>
                                <circle cx={points[peakIdx].x} cy={points[peakIdx].y} r={denseSeries ? 6 : 9} fill="#3B82F6" opacity="0.12" />
                                <circle cx={points[peakIdx].x} cy={points[peakIdx].y} r={denseSeries ? 2.75 : 3.5}
                                        fill={darkMode ? '#0a0a0a' : '#ffffff'} stroke="#3B82F6" strokeWidth="2" />
                            </g>
                        )}
                        {activeIdx !== null && points[activeIdx] && (
                            <g>
                                <line x1={points[activeIdx].x} y1={margin.top} x2={points[activeIdx].x} y2={baseY}
                                      stroke={darkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'} strokeDasharray="4 4" />
                                <circle cx={points[activeIdx].x} cy={points[activeIdx].y} r="9" fill="#3B82F6" opacity="0.15" />
                                <circle cx={points[activeIdx].x} cy={points[activeIdx].y} r="4"
                                        fill={darkMode ? '#0a0a0a' : '#ffffff'} stroke="#3B82F6" strokeWidth="2" />
                            </g>
                        )}
                    </>
                )}
            </svg>

            {activeIdx !== null && data[activeIdx] && points[activeIdx] && (
                <div
                    className={`absolute top-0 -translate-x-1/2 -translate-y-[65%] pointer-events-none rounded-xl px-3.5 py-2 ring-1 shadow-[0_18px_48px_-24px_rgba(25,32,28,0.55)] ${darkMode ? 'bg-[#1a1a19] ring-white/10 text-white' : 'bg-[#fffdfa] ring-stone-900/8 text-stone-900'}`}
                    style={{ left: points[activeIdx].x }}
                >
                    <p className="mb-0.5 whitespace-nowrap text-[9px] uppercase tracking-wider opacity-50">{data[activeIdx].tooltipLabel || data[activeIdx].label}</p>
                    <p className="whitespace-nowrap text-sm font-black tabular-nums">{Math.round(data[activeIdx].value).toLocaleString('fr-FR')} €</p>
                </div>
            )}
        </div>
    );
};

const PanelFrame = ({ children, className = '', innerClassName = '', darkMode, as = 'section' }) => {
    const Component = as;
    return (
        <Component className={`rounded-[30px] p-1.5 ring-1 ${darkMode ? 'bg-white/[0.025] ring-white/[0.07]' : 'bg-[#e9e5df]/65 ring-[#25221f]/[0.055]'} ${className}`}>
            <div className={`h-full rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_26px_72px_-54px_rgba(48,43,37,0.62)] ${darkMode ? 'bg-[#171817] text-white' : 'bg-[#fffdfa] text-[#242320]'} ${innerClassName}`}>
                {children}
            </div>
        </Component>
    );
};

const KpiCard = ({
    label,
    value,
    format,
    icon: Icon,
    meta,
    delta,
    darkMode,
    accent = false,
    action = null,
    className = ''
}) => (
    <PanelFrame darkMode={darkMode} className={className} innerClassName="relative overflow-hidden p-6 sm:p-7">
        <div className="flex h-full flex-col justify-between gap-7">
            <div className="flex items-center justify-between gap-4">
                <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${darkMode ? 'text-white/42' : 'text-stone-500'}`}>{label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${accent ? (darkMode ? 'bg-[#94b7a0]/16 text-[#b8d2c0] ring-[#94b7a0]/20' : 'bg-[#dfe9e2] text-[#315843] ring-[#315843]/10') : (darkMode ? 'bg-white/[0.045] text-white/58 ring-white/[0.06]' : 'bg-[#f0ece6] text-stone-600 ring-stone-900/[0.05]')}`}>
                    <Icon size={17} strokeWidth={1.45} />
                </span>
            </div>
            <div>
                <div className="flex flex-wrap items-end gap-3">
                    <p className={`text-[clamp(2rem,3.8vw,3.7rem)] font-semibold leading-none tracking-[-0.055em] tabular-nums ${darkMode ? 'text-white' : 'text-[#22221f]'}`}>
                        <AnimatedNumber value={value} format={format} />
                    </p>
                    <TrendPill delta={delta} />
                </div>
                <div className={`mt-3 flex min-h-5 items-center justify-between gap-3 text-[11px] font-medium ${darkMode ? 'text-white/46' : 'text-stone-500'}`}>
                    <span>{meta}</span>
                    {action}
                </div>
            </div>
        </div>
        {accent && (
            <div aria-hidden="true" className={`pointer-events-none absolute -bottom-16 -right-12 h-36 w-36 rounded-full ${darkMode ? 'bg-[#82a78d]/[0.08]' : 'bg-[#b9cebe]/25'}`} />
        )}
    </PanelFrame>
);

const StatusDonut = ({ counts, darkMode }) => {
    const total = counts.paid + counts.pending + counts.shipped;
    const radius = 48;
    const strokeWidth = 9;
    const circumference = 2 * Math.PI * radius;
    const secured = counts.paid + counts.shipped;
    const percentage = total === 0 ? 0 : secured / total;
    const reducedMotion = useReducedMotion();
    const segments = [
        { key: 'paid', label: 'Payées', value: counts.paid, color: '#5f8d70' },
        { key: 'shipped', label: 'Expédiées', value: counts.shipped, color: '#68849d' },
        { key: 'pending', label: 'En attente', value: counts.pending, color: '#c99b58' }
    ];
    let runningOffset = 0;

    return (
        <div className="grid min-h-[250px] items-center gap-7 sm:grid-cols-[160px_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[160px_minmax(0,1fr)]">
            <div className="relative mx-auto h-36 w-36">
                <svg viewBox="0 0 120 120" className="-rotate-90" role="img" aria-label={`${Math.round(percentage * 100)} % des commandes sont payées ou expédiées`}>
                <circle
                    cx="60" cy="60" r={radius}
                    fill="none"
                    stroke={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(30,30,28,0.06)'}
                    strokeWidth={strokeWidth}
                />
                    {segments.map((segment, index) => {
                        const length = total ? (segment.value / total) * circumference : 0;
                        const circle = (
                            <motion.circle
                                key={segment.key}
                                cx="60"
                                cy="60"
                                r={radius}
                                fill="none"
                                stroke={segment.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${Math.max(0, length - 2)} ${circumference}`}
                                strokeDashoffset={-runningOffset}
                                strokeLinecap="round"
                                initial={reducedMotion ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: index * 0.12, ease: EASE_OUT }}
                            />
                        );
                        runningOffset += length;
                        return circle;
                    })}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-semibold tracking-[-0.05em] tabular-nums ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                        {total > 0 ? Math.round(percentage * 100) : 0}%
                    </span>
                    <span className={`mt-1 text-[8px] font-bold uppercase tracking-[0.16em] ${darkMode ? 'text-white/38' : 'text-stone-400'}`}>encaissées</span>
                </div>
            </div>
            <div className="space-y-3">
                {segments.map((segment) => (
                    <div key={segment.key} className={`flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 ${darkMode ? 'bg-white/[0.035]' : 'bg-[#f3f0eb]'}`}>
                        <span className={`flex items-center gap-2.5 text-[11px] font-medium ${darkMode ? 'text-white/62' : 'text-stone-600'}`}>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />
                            {segment.label}
                        </span>
                        <span className={`text-sm font-semibold tabular-nums ${darkMode ? 'text-white' : 'text-stone-900'}`}>{segment.value}</span>
                    </div>
                ))}
                <p className={`pt-1 text-[10px] leading-relaxed ${darkMode ? 'text-white/34' : 'text-stone-400'}`}>
                    {total} commande{total > 1 ? 's' : ''} hors annulations
                </p>
            </div>
        </div>
    );
};

const QuoteFunnel = ({ quote, loading, error, darkMode }) => {
    const stages = [
        { key: 'visits', label: 'Visites de la page', value: quote.visits, icon: Eye },
        { key: 'starts', label: 'Formulaires démarrés', value: quote.starts, icon: FileText },
        { key: 'emailOpened', label: 'Brouillons e-mail ouverts', value: quote.emailOpened, icon: Send }
    ];
    const maxValue = Math.max(...stages.map(stage => stage.value), 1);
    const reducedMotion = useReducedMotion();

    if (loading) {
        return <div className={`h-44 rounded-2xl ${darkMode ? 'bg-white/[0.035]' : 'bg-stone-900/[0.035]'}`} aria-label="Chargement des signaux devis" />;
    }

    if (error) {
        return (
            <div className={`flex min-h-44 items-center justify-center rounded-2xl px-6 text-center text-sm ${darkMode ? 'bg-white/[0.035] text-white/45' : 'bg-stone-900/[0.035] text-stone-500'}`}>
                Les signaux devis sont temporairement indisponibles.
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {stages.map((stage, index) => {
                const previous = index > 0 ? stages[index - 1].value : null;
                const rate = previous > 0 ? Math.round((stage.value / previous) * 100) : null;
                const Icon = stage.icon;
                return (
                    <div key={stage.key}>
                        {index > 0 && (
                            <div className={`mb-2 ml-12 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] ${darkMode ? 'text-white/30' : 'text-stone-400'}`}>
                                <span className={`h-4 w-px ${darkMode ? 'bg-white/10' : 'bg-stone-300'}`} />
                                {rate === null ? 'Conversion non mesurable' : `${rate}% de l’étape précédente`}
                            </div>
                        )}
                        <div className={`relative overflow-hidden rounded-2xl px-4 py-3.5 ring-1 ${darkMode ? 'bg-white/[0.035] ring-white/[0.055]' : 'bg-[#f4f1ec] ring-stone-900/[0.045]'}`}>
                            <motion.div
                                aria-hidden="true"
                                className={`absolute inset-y-0 left-0 origin-left ${index === 2 ? (darkMode ? 'bg-[#789782]/14' : 'bg-[#cbdccf]/55') : (darkMode ? 'bg-white/[0.025]' : 'bg-[#e7e1d9]/70')}`}
                                initial={reducedMotion ? false : { scaleX: 0 }}
                                animate={{ scaleX: stage.value / maxValue }}
                                transition={{ duration: 0.75, delay: index * 0.1, ease: EASE_OUT }}
                                style={{ width: '100%' }}
                            />
                            <div className="relative flex items-center justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-white/[0.055] text-white/58' : 'bg-white/75 text-stone-600'}`}>
                                        <Icon size={15} strokeWidth={1.45} />
                                    </span>
                                    <span className={`truncate text-[11px] font-semibold ${darkMode ? 'text-white/68' : 'text-stone-600'}`}>{stage.label}</span>
                                </div>
                                <span className={`text-xl font-semibold tracking-[-0.04em] tabular-nums ${darkMode ? 'text-white' : 'text-stone-900'}`}>{stage.value}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
            <p className={`mt-2 text-[10px] leading-relaxed ${darkMode ? 'text-white/34' : 'text-stone-400'}`}>
                « Brouillon ouvert » mesure l’ouverture de l’e-mail prérempli, pas sa réception ni l’acceptation d’un devis.
            </p>
        </div>
    );
};

const MiniSparkline = ({ values, darkMode }) => {
    const width = 62;
    const height = 24;
    const max = Math.max(...values, 1);
    const points = values.map((value, index) => ({
        x: values.length > 1 ? (index / (values.length - 1)) * width : width,
        y: height - ((value / max) * (height - 8)) - 4
    }));
    const linePath = values.length > 1 ? buildBoundedMonotonePath(points) : '';
    const areaPath = linePath ? `${linePath} L ${width},${height} L 0,${height} Z` : '';
    const lastPoint = points[points.length - 1];

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            <line
                x1="0"
                y1={height - 1}
                x2={width}
                y2={height - 1}
                stroke={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(73,69,63,0.09)'}
            />
            {linePath && (
                <>
                    <path
                        d={areaPath}
                        fill={darkMode ? 'rgba(216,211,202,0.08)' : 'rgba(98,94,87,0.08)'}
                    />
                    <path
                        d={linePath}
                        fill="none"
                        stroke={darkMode ? '#d8d3ca' : '#625e57'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <circle
                        cx={lastPoint.x}
                        cy={lastPoint.y}
                        r="2.5"
                        fill={darkMode ? '#e4dfd6' : '#4f4b45'}
                    />
                </>
            )}
        </svg>
    );
};

const TrendingProducts = ({ products, loading, error, darkMode }) => {
    if (loading) {
        return (
            <div className="grid grid-flow-col auto-cols-[minmax(148px,1fr)] gap-2.5 overflow-hidden" aria-label="Chargement des tendances produits">
                {Array.from({ length: 5 }, (_, index) => (
                    <div
                        key={index}
                        className={`h-[266px] overflow-hidden rounded-[18px] ring-1 ${darkMode ? 'bg-white/[0.025] ring-white/[0.05]' : 'bg-stone-900/[0.025] ring-stone-900/[0.035]'}`}
                    >
                        <div className={`h-[130px] ${darkMode ? 'bg-white/[0.055]' : 'bg-white/75'}`} />
                        <div className="space-y-3 p-3">
                            <span className={`block h-3 w-3/4 rounded-full ${darkMode ? 'bg-white/[0.055]' : 'bg-stone-900/[0.055]'}`} />
                            <span className={`block h-2 w-1/2 rounded-full ${darkMode ? 'bg-white/[0.035]' : 'bg-stone-900/[0.035]'}`} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex min-h-72 items-center justify-center rounded-2xl px-6 text-center text-sm ${darkMode ? 'bg-white/[0.035] text-white/45' : 'bg-stone-900/[0.035] text-stone-500'}`}>
                Les tendances produits sont temporairement indisponibles.
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className={`flex min-h-72 flex-col items-center justify-center rounded-2xl px-6 text-center ${darkMode ? 'bg-white/[0.035]' : 'bg-stone-900/[0.035]'}`}>
                <Eye size={22} strokeWidth={1.35} className={darkMode ? 'text-white/28' : 'text-stone-300'} />
                <p className={`mt-3 text-sm font-semibold ${darkMode ? 'text-white/58' : 'text-stone-600'}`}>Aucune fiche produit vue sur la période</p>
            </div>
        );
    }

    return (
        <ol className="grid grid-flow-col auto-cols-[minmax(148px,1fr)] gap-2.5 overflow-x-auto overscroll-x-contain pb-1">
            {products.map((product, index) => {
                return (
                    <motion.li
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.42, delay: index * 0.045, ease: EASE_OUT }}
                        className={`group relative isolate h-[266px] overflow-hidden rounded-[18px] ring-1 transition-[background-color,box-shadow] duration-300 ease-out hover:shadow-[0_18px_38px_-30px_rgba(45,42,38,0.42)] ${darkMode ? 'bg-white/[0.028] ring-white/[0.06] hover:bg-white/[0.038]' : 'bg-[#f6f3ee] ring-stone-900/[0.045] hover:bg-[#f1ede7]'}`}
                    >
                        <div className={`relative h-[130px] w-full overflow-hidden border-b ${darkMode ? 'bg-[#20231f] border-white/[0.06]' : 'bg-[#e9e5df] border-white/70'}`}>
                            {product.imageUrl ? (
                                // Le snapshot fournit deja une miniature WebP 320/384; pas de proxy Next pour l'admin.
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={product.imageUrl}
                                    alt={product.imageAlt}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover transition-[filter] duration-300 group-hover:saturate-[1.06]"
                                />
                            ) : (
                                <span className={`flex h-full w-full items-center justify-center ${darkMode ? 'text-white/25' : 'text-stone-400'}`} aria-hidden="true">
                                    <PackageCheck size={23} strokeWidth={1.25} />
                                </span>
                            )}
                            <span className={`absolute left-2 top-2 rounded-md px-1.5 py-1 text-[8px] font-bold tracking-[0.08em] tabular-nums backdrop-blur-md ${index === 0 ? (darkMode ? 'bg-white/90 text-stone-900' : 'bg-stone-900/90 text-white') : (darkMode ? 'bg-black/60 text-white/75' : 'bg-white/85 text-stone-700')}`}>
                                #{String(index + 1).padStart(2, '0')}
                            </span>
                        </div>

                        <div className="relative flex h-[136px] flex-col p-3.5">
                            <p className={`truncate text-[13px] font-semibold tracking-[-0.01em] ${darkMode ? 'text-white/88' : 'text-stone-800'}`} title={product.name}>
                                {product.name}
                            </p>
                            <div className="mt-1 flex min-w-0 items-center gap-1.5">
                                <span className={`truncate text-[9px] font-medium ${darkMode ? 'text-white/38' : 'text-stone-500'}`}>
                                    {product.viewers} visiteur{product.viewers > 1 ? 's' : ''}
                                </span>
                                {product.price !== null && (
                                    <>
                                        <span className={darkMode ? 'text-white/16' : 'text-stone-300'} aria-hidden="true">•</span>
                                        <span className={`shrink-0 text-[8px] font-semibold tabular-nums ${darkMode ? 'text-white/42' : 'text-stone-500'}`}>
                                            {product.price.toLocaleString('fr-FR')} €
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="mt-auto flex items-end justify-between gap-2">
                                <MiniSparkline values={product.dailyViews} darkMode={darkMode} />
                                <div className="shrink-0 text-right">
                                    <p className={`text-lg font-semibold leading-none tracking-[-0.04em] tabular-nums ${darkMode ? 'text-white' : 'text-stone-900'}`}>{product.views}</p>
                                    <p className={`mt-1 text-[7px] font-bold uppercase tracking-[0.12em] ${darkMode ? 'text-white/32' : 'text-stone-500'}`}>vues</p>
                                </div>
                            </div>
                        </div>
                    </motion.li>
                );
            })}
        </ol>
    );
};

const DashboardSkeleton = ({ darkMode }) => (
    <div className="space-y-6 pb-20" aria-busy="true" aria-label="Chargement du tableau de bord">
        <div className={`h-20 rounded-[28px] ${darkMode ? 'bg-white/[0.035]' : 'bg-stone-900/[0.035]'}`} />
        <div className="grid gap-5 lg:grid-cols-12">
            {[5, 2, 2, 3].map((span, index) => (
                <div
                    key={`${span}-${index}`}
                    className={`h-44 rounded-[28px] ${darkMode ? 'bg-white/[0.035]' : 'bg-stone-900/[0.035]'} ${span === 5 ? 'lg:col-span-5' : span === 3 ? 'lg:col-span-3' : 'lg:col-span-2'}`}
                />
            ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-12">
            <div className={`h-96 rounded-[28px] lg:col-span-8 ${darkMode ? 'bg-white/[0.035]' : 'bg-stone-900/[0.035]'}`} />
            <div className={`h-96 rounded-[28px] lg:col-span-4 ${darkMode ? 'bg-white/[0.035]' : 'bg-stone-900/[0.035]'}`} />
        </div>
        <span className="sr-only">Chargement des statistiques…</span>
    </div>
);

const getTrackedProduct = (rawValue) => {
    const raw = String(rawValue || '').trim();
    if (!raw) return null;
    const clean = raw.replace(/\s*\[(depuis|source):\s*[^\]]+\]\s*$/i, '').trim();
    const [rawId, ...labelParts] = clean.split('|');
    const id = rawId.trim();
    if (!id) return null;
    const label = (labelParts.join('|') || rawId).trim();
    const priceMatch = label.match(/\(([\d\s.,]+)\s*EUR\)\s*$/i);
    const parsedPrice = priceMatch ? Number(priceMatch[1].replace(/\s/g, '').replace(',', '.')) : null;
    const name = label.replace(/\s*\(([\d\s.,]+)\s*EUR\)\s*$/i, '').trim() || id;
    return {
        id,
        name,
        price: Number.isFinite(parsedPrice) ? parsedPrice : null
    };
};

const buildDashboardProductVisualMap = (items) => {
    const products = new Map();
    (Array.isArray(items) ? items : []).forEach((item) => {
        const [primaryImage] = getProductImageItems(item);
        const imageUrl = primaryImage?.thumb320
            || primaryImage?.thumb384
            || primaryImage?.thumb
            || primaryImage?.card
            || item?.thumbnailUrl
            || item?.imageUrl
            || null;
        if (!imageUrl) return;

        const productName = String(item?.name || item?.title || 'Meuble').trim();
        const pathKey = decodeURIComponent(String(getProductUrl(item)).split('/').filter(Boolean).pop() || '');
        const visual = {
            imageUrl,
            imageAlt: productName ? `${productName}, meuble du catalogue` : 'Meuble du catalogue',
            catalogName: productName,
            catalogPrice: Number.isFinite(Number(item?.price)) ? Number(item.price) : null
        };

        [item?.id, item?.originalId, pathKey]
            .map((value) => String(value || '').trim())
            .filter(Boolean)
            .forEach((key) => products.set(key, visual));
    });
    return products;
};

const getSessionVisitorKey = (session) => {
    const userId = String(session?.userId || '').trim();
    if (userId && userId !== 'unknown') return `uid:${userId}`;
    const ip = String(session?.ip || '').trim();
    if (ip) return `ip:${ip}`;
    return `session:${session?.id || 'unknown'}`;
};

const getOrderStatus = (status) => {
    if (status === 'shipped') return { label: 'Expédiée', tone: 'info' };
    if (status === 'completed' || status === 'paid') return { label: 'Payée', tone: 'success' };
    return { label: 'En attente', tone: 'warning' };
};

const getRelativeOrderDate = (value) => {
    const timestamp = getMillis(value);
    if (!timestamp) return 'Date inconnue';
    const diffDays = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
    if (diffDays <= 0) return "Aujourd’hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return new Date(timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};


// ─── ADMIN DASHBOARD ───

const LoadingProgress = ({ progress, text, darkMode }) => (
    <div className="mt-6 flex flex-col items-center w-full space-y-3">
        <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-stone-100'}`}>
            <div
                className="h-full origin-left rounded-full bg-gradient-to-r from-red-500 to-amber-500 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ transform: `scaleX(${Math.max(0, Math.min(progress, 100)) / 100})` }}
            />
        </div>
        <div className={`text-[10px] font-black uppercase tracking-widest flex justify-between w-full ${darkMode ? 'text-white/60' : 'text-stone-500'}`}>
            <span>{progress >= 100 ? 'Terminé !' : text || 'Opération en cours...'}</span>
            <span>{Math.round(progress)}%</span>
        </div>
    </div>
);


const AdminDashboard = ({ user, darkMode = false, items = [] }) => {
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalStockValue: 0,
        registeredUsers: 0
    });

    const [timeFilter, _setTimeFilter] = useState('1month');
    const [allOrders, setAllOrders] = useState([]);
    const [dailySales, setDailySales] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [statusCounts, setStatusCounts] = useState({ paid: 0, pending: 0, shipped: 0 });
    const [loading, setLoading] = useState(true);
    const [inventoryStatsAvailable, setInventoryStatsAvailable] = useState(true);
    const [insights, setInsights] = useState({
        loading: true,
        error: false,
        coverageLimited: false,
        quote: { visits: 0, starts: 0, emailOpened: 0 },
        products: [],
        totalProductViews: 0,
        uniqueProductViewers: 0
    });
    const trendingProducts = useMemo(() => {
        const visuals = buildDashboardProductVisualMap(items);
        return insights.products.map((product) => {
            const visual = visuals.get(product.id);
            return {
                ...product,
                name: product.name === product.id && visual?.catalogName ? visual.catalogName : product.name,
                price: product.price ?? visual?.catalogPrice ?? null,
                ...(visual || {
                    imageUrl: null,
                    imageAlt: `${product.name}, visuel indisponible`
                })
            };
        });
    }, [insights.products, items]);
    const reducedMotion = useReducedMotion();

    // Modals
    const [isOrderResetModalOpen, setIsOrderResetModalOpen] = useState(false);
    const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);
    const [isResetUsersModalOpen, setIsResetUsersModalOpen] = useState(false);
    const [isPurgeAnonymousModalOpen, setIsPurgeAnonymousModalOpen] = useState(false);
    const [isPurgeProductsModalOpen, setIsPurgeProductsModalOpen] = useState(false);
    
    // Operation states
    const [exportingUsers, setExportingUsers] = useState(false);
    const [resettingOrders, setResettingOrders] = useState(false);
    const [cleaningCloud, setCleaningCloud] = useState(false);
    const [resettingUsers, setResettingUsers] = useState(false);
    const [purgingAnonymous, setPurgingAnonymous] = useState(false);
    const [purgingProducts, setPurgingProducts] = useState(false);

    // Progress states
    const [progressValue, setProgressValue] = useState(0);
    const [progressSubtitle, setProgressSubtitle] = useState('');

    useEffect(() => {
        if (!user || user.isAnonymous) {
            setIsSuperAdmin(false);
            return undefined;
        }

        let cancelled = false;
        const syncSuperAdminClaim = async () => {
            try {
                const { getIdTokenResult } = await loadAuthModule();
                await httpsCallable(functions, 'ensureAdminAccessRegistry')({});
                let tokenResult = await getIdTokenResult(user, true);
                if (tokenResult.claims.superAdmin === true) {
                    await httpsCallable(functions, 'syncSuperAdminClaim')({});
                    tokenResult = await getIdTokenResult(user, true);
                }
                if (!cancelled) {
                    setIsSuperAdmin(tokenResult.claims.superAdmin === true);
                }
            } catch (error) {
                console.error('Error reading super admin claim:', error);
                if (!cancelled) setIsSuperAdmin(false);
            }
        };

        syncSuperAdminClaim();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const executeWithProgress = async (actionFn, estimatedMs = 8000) => {
        setProgressValue(0);
        setProgressSubtitle('Initialisation...');
        
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += (100 / (estimatedMs / 100));
            if (currentProgress > 95) currentProgress = 95;
            setProgressValue(currentProgress);
            
            if (currentProgress > 80) setProgressSubtitle('Finalisation...');
            else if (currentProgress > 40) setProgressSubtitle('Traitement en cours...');
            else if (currentProgress > 10) setProgressSubtitle('Suppression des données...');
        }, 100);

        try {
            const result = await actionFn();
            clearInterval(interval);
            setProgressValue(100);
            setProgressSubtitle('Terminé !');
            await new Promise(resolve => setTimeout(resolve, 600)); // Show 100% briefly
            return result;
        } catch (e) {
            clearInterval(interval);
            throw e;
        }
    };

    const buildDailySalesFromOrders = (orders) => {
        const map = {};
        orders
            .filter(o => o.status !== 'cancelled' && o.status !== 'cancelled_by_client')
            .forEach((order) => {
                const ts = getMillis(order.createdAt);
                if (!ts) return;
                const dateKey = new Date(ts).toISOString().split('T')[0];
                map[dateKey] = (map[dateKey] || 0) + Number(order.total || 0);
            });

        return Object.keys(map)
            .sort()
            .map((dateKey) => ({ dateKey, totalRevenue: map[dateKey] }));
    };

    const chartData = useMemo(() => {
        if (!dailySales.length) return [];
        const periodDays = timeFilter === '7days' ? 7 : timeFilter === '1month' ? 30 : 365;
        const now = new Date();
        const endOfTodayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const revenueByDate = new Map();

        dailySales.forEach(({ dateKey, totalRevenue }) => {
            if (!dateKey) return;
            revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + Number(totalRevenue || 0));
        });

        return Array.from({ length: periodDays }, (_, index) => {
            const date = new Date(endOfTodayUtc - ((periodDays - 1 - index) * 24 * 60 * 60 * 1000));
            const dateKey = date.toISOString().slice(0, 10);
            const axisLabel = date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                timeZone: 'UTC'
            });

            return {
                dateKey,
                axisLabel,
                label: axisLabel,
                tooltipLabel: date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC'
                }),
                value: Math.max(0, Number(revenueByDate.get(dateKey)) || 0)
            };
        });
    }, [dailySales, timeFilter]);

    const _revenueSummary = useMemo(() => {
        const dayMs = 24 * 60 * 60 * 1000;
        const today = new Date();
        const currentStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - (29 * dayMs);
        const previousStart = currentStart - (30 * dayMs);
        let current30 = 0;
        let previous30 = 0;

        dailySales.forEach((day) => {
            const timestamp = Date.parse(`${day.dateKey}T00:00:00Z`);
            const value = Number(day.totalRevenue || 0);
            if (!Number.isFinite(timestamp) || !Number.isFinite(value)) return;
            if (timestamp >= currentStart) current30 += value;
            else if (timestamp >= previousStart && timestamp < currentStart) previous30 += value;
        });

        const periodTotal = chartData.reduce((sum, point) => sum + Number(point.value || 0), 0);
        const bestPoint = chartData.reduce(
            (best, point) => Number(point.value || 0) > Number(best?.value || 0) ? point : best,
            null
        );

        return {
            current30,
            previous30,
            delta: previous30 > 0 ? ((current30 - previous30) / previous30) * 100 : null,
            periodTotal,
            bestPoint
        };
    }, [chartData, dailySales]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const today = new Date();
                const rollupCutoffUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 364);
                const rollupCutoffKey = new Date(rollupCutoffUtc).toISOString().slice(0, 10);
                const [
                    dashboardSnap,
                    inventorySnap,
                    salesSnap,
                    recentOrdersSnap
                ] = await Promise.all([
                    getDoc(doc(db, 'dashboard_stats', 'commerce')),
                    getDoc(doc(db, 'inventory_stats', 'overview')),
                    getDocs(query(
                        collection(db, 'sales_stats_daily'),
                        where('dateKey', '>=', rollupCutoffKey),
                        orderBy('dateKey', 'asc'),
                        limit(366)
                    )),
                    getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)))
                ]);

                let revenue = 0;
                let orderCount = 0;
                let p = 0, w = 0, s = 0;
                let stockValue = 0;

                const dailyStats = salesSnap.docs
                    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
                    .sort((a, b) => String(a.dateKey).localeCompare(String(b.dateKey)));

                setDailySales(dailyStats);

                if (dashboardSnap.exists()) {
                    const data = dashboardSnap.data();
                    revenue = Number(data.totalRevenue || 0);
                    orderCount = Number(data.totalOrders || 0);
                    p = Number(data.paidOrders || 0);
                    w = Number(data.pendingOrders || 0);
                    s = Number(data.shippedOrders || 0);
                }

                if (inventorySnap.exists()) {
                    const data = inventorySnap.data();
                    stockValue = Number(data.totalStockValue || 0);
                    setInventoryStatsAvailable(true);
                } else {
                    setInventoryStatsAvailable(false);
                }

                if (!dashboardSnap.exists() || !inventorySnap.exists() || dailyStats.length === 0) {
                    console.warn('Dashboard stats docs missing; using capped legacy orders fallback.');
                    const ordersSnapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(300)));
                    const legacyOrders = [];
                    let legacyRevenue = 0;
                    let legacyOrderCount = 0;
                    let legacyPaid = 0;
                    let legacyPending = 0;
                    let legacyShipped = 0;

                    ordersSnapshot.forEach((docSnap) => {
                        const data = docSnap.data();
                        const isCancelled = data.status === 'cancelled' || data.status === 'cancelled_by_client';

                        if (!isCancelled) {
                            legacyRevenue += (data.total || 0);
                            legacyOrderCount += 1;
                            if (data.status === 'completed' || data.status === 'paid') legacyPaid += 1;
                            else if (data.status === 'shipped') legacyShipped += 1;
                            else legacyPending += 1;
                        }
                        legacyOrders.push({ id: docSnap.id, ...data });
                    });

                    if (!dashboardSnap.exists()) {
                        revenue = legacyRevenue;
                        orderCount = legacyOrderCount;
                        p = legacyPaid;
                        w = legacyPending;
                        s = legacyShipped;
                    }

                    if (dailyStats.length === 0) {
                        setDailySales(buildDailySalesFromOrders(legacyOrders));
                    }
                }

                setStatusCounts({ paid: p, pending: w, shipped: s });
                setRecentOrders(
                    recentOrdersSnap.docs
                        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
                        .filter((order) => order.status !== 'cancelled' && order.status !== 'cancelled_by_client')
                );

                setStats({
                    totalRevenue: revenue,
                    totalOrders: orderCount,
                    averageOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
                    totalStockValue: stockValue,
                    registeredUsers: 0
                });

                // 3. Fetch User Stats
                httpsCallable(functions, 'getUserStats')({ includeUsers: false }).then(res => {
                    setStats(prev => ({ ...prev, registeredUsers: res.data.count }));
                }).catch(err => console.error("Failed to fetch user stats", err));

                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchCommercialInsights = async () => {
            try {
                const now = Date.now();
                const dayMs = 24 * 60 * 60 * 1000;
                const cutoff = Timestamp.fromMillis(now - (30 * dayMs));
                const sessionsSnap = await getDocs(query(
                    collection(db, 'analytics_sessions'),
                    where('startedAt', '>=', cutoff),
                    orderBy('startedAt', 'desc'),
                    limit(500)
                ));
                if (cancelled) return;

                const sessions = sessionsSnap.docs
                    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
                    .filter((session) => session.type !== 'admin');
                const quoteVisits = new Set();
                const quoteStarts = new Set();
                const quoteEmailOpened = new Set();
                const productMap = new Map();
                const allProductViewers = new Set();
                let totalProductViews = 0;
                const recentDayKeys = Array.from({ length: 7 }, (_, index) => {
                    const day = new Date(now - ((6 - index) * dayMs));
                    return day.toISOString().slice(0, 10);
                });

                sessions.forEach((session) => {
                    const sessionId = session.id;
                    const visitorKey = getSessionVisitorKey(session);
                    const journey = Array.isArray(session.journey) ? session.journey : [];
                    const eventActions = new Set(
                        (Array.isArray(session.lastEventPreview) ? session.lastEventPreview : [])
                            .map((event) => event?.action)
                            .filter(Boolean)
                    );

                    if (journey.some((step) => step?.page === 'quote')) quoteVisits.add(sessionId);
                    if (eventActions.has('quote_start')) quoteStarts.add(sessionId);
                    if (eventActions.has('quote_email_opened')) quoteEmailOpened.add(sessionId);

                    journey.forEach((step) => {
                        if (step?.page !== 'detail') return;
                        const tracked = getTrackedProduct(step.itemId);
                        if (!tracked) return;

                        const stepTimestamp = Number(step.timestampMs) || getMillis(session.startedAt) || now;
                        const dayKey = new Date(stepTimestamp).toISOString().slice(0, 10);
                        const entry = productMap.get(tracked.id) || {
                            ...tracked,
                            views: 0,
                            viewers: new Set(),
                            viewsByDay: new Map()
                        };

                        entry.views += 1;
                        entry.viewers.add(visitorKey);
                        entry.viewsByDay.set(dayKey, (entry.viewsByDay.get(dayKey) || 0) + 1);
                        if (entry.name === entry.id && tracked.name !== tracked.id) entry.name = tracked.name;
                        if (entry.price === null && tracked.price !== null) entry.price = tracked.price;
                        productMap.set(tracked.id, entry);
                        allProductViewers.add(visitorKey);
                        totalProductViews += 1;
                    });
                });

                const products = Array.from(productMap.values())
                    .sort((a, b) => b.views - a.views || b.viewers.size - a.viewers.size || a.name.localeCompare(b.name, 'fr'))
                    .slice(0, 5)
                    .map((product) => ({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        views: product.views,
                        viewers: product.viewers.size,
                        dailyViews: recentDayKeys.map((dayKey) => product.viewsByDay.get(dayKey) || 0)
                    }));

                setInsights({
                    loading: false,
                    error: false,
                    coverageLimited: sessionsSnap.size >= 500,
                    quote: {
                        visits: quoteVisits.size,
                        starts: quoteStarts.size,
                        emailOpened: quoteEmailOpened.size
                    },
                    products,
                    totalProductViews,
                    uniqueProductViewers: allProductViewers.size
                });
            } catch (error) {
                console.error('Error fetching dashboard commercial insights:', error);
                if (!cancelled) {
                    setInsights((previous) => ({ ...previous, loading: false, error: true }));
                }
            }
        };

        fetchCommercialInsights();
        return () => {
            cancelled = true;
        };
    }, []);

    // ─── ACTIONS ───
    const _handleResetOrdersClick = () => setIsOrderResetModalOpen(true);
    const requireConfirmText = (expectedText) => {
        const value = window.prompt(`Tapez ${expectedText} pour confirmer cette action.`);
        return value === expectedText ? value : null;
    };

    const exportToCsv = async (orders) => {
        const exportOrders = orders && orders.length > 0
            ? orders
            : (await getDocs(collection(db, 'orders'))).docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        const data = exportOrders.map(order => ({
            'ID Commande': order.id,
            'Date': new Date(getMillis(order.createdAt)).toLocaleString(),
            'Client': order.shipping?.fullName || 'N/A',
            'Total': `${order.total} €`,
            'Statut': order.status || 'N/A'
        }));
        downloadCsv(data, 'Commandes');
    };

    const confirmResetOrders = async () => {
        const confirmText = requireConfirmText('PURGER COMMANDES');
        if (!confirmText) return;
        setResettingOrders(true);
        try {
            await exportToCsv(allOrders);
            const resetOrdersFn = httpsCallable(functions, 'resetAllOrders');
            const result = await executeWithProgress(() => resetOrdersFn({ confirmText }), 5000);
            const count = result.data.count;
            setStats(prev => ({ ...prev, totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 }));
            setRecentOrders([]);
            setAllOrders([]);
            setDailySales([]);
            setIsOrderResetModalOpen(false);
            alert(`Succès ! ${count} commandes archivées et supprimées.`);
        } catch (error) {
            console.error(error);
            alert("Erreur purge commandes: " + error.message);
        } finally {
            setResettingOrders(false);
            setProgressValue(0);
        }
    };

    const confirmCleaning = async () => {
        const confirmText = requireConfirmText('NETTOYER CLOUD');
        if (!confirmText) return;
        setCleaningCloud(true);
        try {
            const garbageCollectorFn = httpsCallable(functions, 'runGarbageCollector');
            const result = await executeWithProgress(() => garbageCollectorFn({ confirmText }), 12000);
            const s = result.data.stats;
            const freedMb = (s.storageSpaceFreedBytes / (1024 * 1024)).toFixed(2);
            setIsCleaningModalOpen(false);
            alert(`✅ Nettoyage terminé.\nEspace libéré : ${freedMb} Mo\nImages supprimées : ${s.orphanedImagesDeleted}`);
        } catch (error) { console.error(error); alert("Erreur nettoyage: " + error.message); }
        finally { setCleaningCloud(false); setProgressValue(0); }
    };

    const confirmResetUsers = async () => {
        const confirmText = requireConfirmText('PURGER CLIENTS');
        if (!confirmText) return;
        setResettingUsers(true);
        try {
            const resetUsersFn = httpsCallable(functions, 'resetAllUsers');
            const result = await executeWithProgress(() => resetUsersFn({ confirmText }), 4000);
            setIsResetUsersModalOpen(false);
            alert(`✅ Succès !\n${result.data.message}`);
        } catch (error) { console.error(error); alert("Erreur purge utilisateurs: " + error.message); }
        finally { setResettingUsers(false); setProgressValue(0); }
    };

    const confirmPurgeAnonymous = async () => {
        const confirmText = requireConfirmText('PURGER ANONYMES');
        if (!confirmText) return;
        setPurgingAnonymous(true);
        try {
            const purgeAnonymousFn = httpsCallable(functions, 'purgeAnonymousUsers');
            const result = await executeWithProgress(() => purgeAnonymousFn({ confirmText }), 4000);
            setIsPurgeAnonymousModalOpen(false);
            alert(`✅ Succès !\n${result.data.message}`);
        } catch (error) { console.error(error); alert("Erreur purge anonymes: " + error.message); } 
        finally { setPurgingAnonymous(false); setProgressValue(0); }
    };

    const confirmPurgeProducts = async () => {
        const confirmText = requireConfirmText('PURGER MEUBLES');
        if (!confirmText) return;
        setPurgingProducts(true);
        try {
            const purgeProductsFn = httpsCallable(functions, 'purgeAllProducts');
            const result = await executeWithProgress(() => purgeProductsFn({ confirmText }), 15000);
            setIsPurgeProductsModalOpen(false);
            alert(`✅ Purge terminée !\n${result.data.message}`);
        } catch (error) { console.error(error); alert("Erreur purge meubles: " + error.message); }
        finally { setPurgingProducts(false); setProgressValue(0); }
    };

    const handleExportUsers = async () => {
        setExportingUsers(true);
        try {
            const getUserStatsFn = httpsCallable(functions, 'getUserStats');
            const result = await getUserStatsFn({ includeUsers: true });
            const users = result.data.users;

            const data = users.map(u => ({
                'ID': u.uid, 'Email': u.email, 'Nom': u.displayName,
                'Inscription': new Date(u.creationTime).toLocaleDateString(),
                'Connexion': new Date(u.lastSignInTime).toLocaleDateString()
            }));

            downloadCsv(data, 'Clients');

            alert(`✅ Export réussi : ${users.length} clients exportés.`);
        } catch (error) { console.error(error); alert("Erreur export utilisateurs: " + error.message); } 
        finally { setExportingUsers(false); }
    };

    if (loading) return <DashboardSkeleton darkMode={darkMode} />;

    const textBase = darkMode ? 'text-white' : 'text-stone-900';
    const textMuted = darkMode ? 'text-white/40' : 'text-stone-400';

    const _getFilterLabel = () => {
        if (timeFilter === '7days') return "les 7 derniers jours";
        if (timeFilter === '1month') return "les 30 derniers jours";
        return "les 365 derniers jours";
    };

    const _chartGranularityLabel = 'Vue quotidienne';
    const _bestPointLabel = 'Meilleur jour';

    return (
        <motion.div
            initial={reducedMotion ? false : 'hidden'}
            animate="visible"
            className="space-y-5 pb-20 font-sans sm:space-y-6"
        >
            <motion.div custom={0} variants={sectionVariants} className="grid gap-5 lg:grid-cols-12">
                <KpiCard
                    label="Indicateur commerce legacy"
                    value={0}
                    format={() => 'Indisponible'}
                    icon={CircleDollarSign}
                    meta="Non comptable avant la Gate 7A"
                    delta={null}
                    darkMode={darkMode}
                    accent
                    className="lg:col-span-5"
                />
                <KpiCard
                    label="Commandes"
                    value={stats.totalOrders}
                    icon={ShoppingBag}
                    meta={`${statusCounts.paid + statusCounts.shipped} encaissées`}
                    darkMode={darkMode}
                    className="lg:col-span-2"
                />
                <KpiCard
                    label="Panier moyen legacy"
                    value={0}
                    format={() => 'Indisponible'}
                    icon={PackageCheck}
                    meta="Non comptable avant la Gate 7A"
                    darkMode={darkMode}
                    className="lg:col-span-2"
                />
                <KpiCard
                    label="Clients inscrits"
                    value={stats.registeredUsers}
                    icon={Users}
                    meta={inventoryStatsAvailable ? `Catalogue : ${Math.round(stats.totalStockValue).toLocaleString('fr-FR')} €` : 'Valeur catalogue : —'}
                    darkMode={darkMode}
                    className="lg:col-span-3"
                    action={(
                        <button
                            type="button"
                            onClick={handleExportUsers}
                            disabled={exportingUsers}
                            aria-label="Exporter les clients au format CSV"
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#62816c] disabled:cursor-wait disabled:opacity-50 ${darkMode ? 'bg-white/[0.055] text-white/58 ring-white/[0.07] hover:bg-white/10 hover:text-white' : 'bg-[#eee9e2] text-stone-600 ring-stone-900/[0.055] hover:bg-[#ded7ce] hover:text-stone-900'}`}
                        >
                            {exportingUsers ? <RefreshCw size={14} className="animate-spin" strokeWidth={1.45} /> : <Archive size={14} strokeWidth={1.45} />}
                        </button>
                    )}
                />
            </motion.div>

            <motion.div custom={1} variants={sectionVariants} className="grid gap-5 lg:grid-cols-12">
                <PanelFrame darkMode={darkMode} className="lg:col-span-8" innerClassName="p-5 sm:p-7">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                            <div>
                                <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${textMuted}`}>Commerce en lecture seule</p>
                                <h2 className={`mt-2 text-xl font-semibold tracking-[-0.03em] ${textBase}`}>Indicateurs comptables suspendus</h2>
                                <p className={`mt-1 text-[11px] ${textMuted}`}>Les montants legacy ne sont pas qualifiés comme chiffre d’affaires.</p>
                            </div>
                            <div className={`rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] ring-1 ${darkMode ? 'bg-amber-400/[0.05] text-amber-200/65 ring-amber-300/10' : 'bg-amber-50 text-amber-700 ring-amber-900/10'}`}>
                                Lecture et rapprochement uniquement
                            </div>
                        </div>
                        <div className={`flex h-[240px] items-center justify-center rounded-2xl px-6 text-center text-sm ${darkMode ? 'bg-white/[0.03] text-white/38' : 'bg-stone-900/[0.03] text-stone-400'}`}>
                            Données conservées pour lecture et rapprochement uniquement. Aucun indicateur comptable n&apos;est affiché avant la Gate 7A.
                        </div>
                    </div>
                </PanelFrame>

                <PanelFrame darkMode={darkMode} className="lg:col-span-4" innerClassName="p-5 sm:p-7">
                    <div className="mb-4">
                        <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${textMuted}`}>Flux des commandes</p>
                        <h2 className={`mt-2 text-xl font-semibold tracking-[-0.03em] ${textBase}`}>Répartition des statuts</h2>
                    </div>
                    <StatusDonut counts={statusCounts} darkMode={darkMode} />
                </PanelFrame>
            </motion.div>

            <motion.div custom={2} variants={sectionVariants} className="grid gap-5 lg:grid-cols-12">
                <PanelFrame darkMode={darkMode} className="lg:col-span-5" innerClassName="p-5 sm:p-7">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${textMuted}`}>Restauration</p>
                            <h2 className={`mt-2 text-xl font-semibold tracking-[-0.03em] ${textBase}`}>Intentions de devis</h2>
                            <p className={`mt-1 text-[11px] ${textMuted}`}>Parcours mesuré sur 30 jours</p>
                        </div>
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${darkMode ? 'bg-white/[0.045] text-white/54 ring-white/[0.065]' : 'bg-[#eee9e2] text-stone-600 ring-stone-900/[0.05]'}`}>
                            <FileText size={17} strokeWidth={1.4} />
                        </span>
                    </div>
                    <QuoteFunnel quote={insights.quote} loading={insights.loading} error={insights.error} darkMode={darkMode} />
                </PanelFrame>

                <PanelFrame darkMode={darkMode} className="lg:col-span-7" innerClassName="p-5 sm:p-7">
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                            <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${textMuted}`}>Intérêt catalogue</p>
                            <h2 className={`mt-2 text-xl font-semibold tracking-[-0.03em] ${textBase}`}>Meubles en tendance</h2>
                            <p className={`mt-1 text-[11px] ${textMuted}`}>Classement par vues de fiche sur 30 jours</p>
                        </div>
                        <div className="flex gap-2">
                            {insights.coverageLimited && (
                                <span className={`rounded-xl px-3 py-2 text-[9px] font-semibold ring-1 ${darkMode ? 'bg-amber-400/[0.07] text-amber-200/70 ring-amber-300/10' : 'bg-amber-50 text-amber-700 ring-amber-900/10'}`}>
                                    Échantillon plafonné
                                </span>
                            )}
                            <span className={`rounded-xl px-3 py-2 text-[9px] font-semibold tabular-nums ring-1 ${darkMode ? 'bg-white/[0.035] text-white/48 ring-white/[0.055]' : 'bg-[#f1ede7] text-stone-500 ring-stone-900/[0.045]'}`}>
                                {insights.totalProductViews} vues
                            </span>
                            <span className={`rounded-xl px-3 py-2 text-[9px] font-semibold tabular-nums ring-1 ${darkMode ? 'bg-white/[0.035] text-white/48 ring-white/[0.055]' : 'bg-[#f1ede7] text-stone-500 ring-stone-900/[0.045]'}`}>
                                {insights.uniqueProductViewers} visiteurs
                            </span>
                        </div>
                    </div>
                    <TrendingProducts products={trendingProducts} loading={insights.loading} error={insights.error} darkMode={darkMode} />
                </PanelFrame>
            </motion.div>

            <motion.div custom={3} variants={sectionVariants}>
                <PanelFrame darkMode={darkMode} innerClassName="p-5 sm:p-7">
                    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${textMuted}`}>Rapprochement opérationnel</p>
                            <h2 className={`mt-2 text-xl font-semibold tracking-[-0.03em] ${textBase}`}>Commandes legacy récentes</h2>
                        </div>
                        <p className={`text-[10px] ${textMuted}`}>Montants de dossier non qualifiés comme comptabilité</p>
                    </div>
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-left">
                            <thead>
                                <tr className={`text-[9px] font-bold uppercase tracking-[0.16em] ${textMuted}`}>
                                    <th className="pb-3 font-medium">Client</th>
                                    <th className="pb-3 font-medium">Commande</th>
                                    <th className="pb-3 font-medium">Date</th>
                                    <th className="pb-3 text-right font-medium">Statut</th>
                                    <th className="pb-3 text-right font-medium">Montant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className={`rounded-2xl py-12 text-center text-xs ${textMuted}`}>Aucune transaction récente.</td>
                                    </tr>
                                ) : (
                                    recentOrders.map((order) => {
                                        const status = getOrderStatus(order.status);
                                        const clientName = order.shipping?.fullName || 'Client invité';
                                        const initials = clientName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
                                        return (
                                            <tr key={order.id} className={`group transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${darkMode ? 'hover:bg-white/[0.025]' : 'hover:bg-[#f5f1eb]'}`}>
                                                <td className="rounded-l-2xl py-3.5 pl-2 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-bold ring-1 ${darkMode ? 'bg-white/[0.045] text-white/58 ring-white/[0.06]' : 'bg-[#ece6de] text-stone-600 ring-stone-900/[0.045]'}`}>{initials || 'CI'}</span>
                                                        <span className={`text-[12px] font-semibold ${textBase}`}>{clientName}</span>
                                                    </div>
                                                </td>
                                                <td className={`px-4 py-3.5 font-mono text-[10px] ${darkMode ? 'text-white/36' : 'text-stone-400'}`}>#{String(order.id).slice(-7).toUpperCase()}</td>
                                                <td className={`px-4 py-3.5 text-[11px] ${darkMode ? 'text-white/46' : 'text-stone-500'}`}>{getRelativeOrderDate(order.createdAt)}</td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <span
                                                        data-role={status.tone}
                                                        className={`inline-flex rounded-lg px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[0.12em] ${
                                                            status.tone === 'success'
                                                                ? (darkMode ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
                                                                : status.tone === 'info'
                                                                    ? (darkMode ? 'bg-sky-400/10 text-sky-300' : 'bg-sky-50 text-sky-700')
                                                                    : (darkMode ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700')
                                                        }`}
                                                    >
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className={`rounded-r-2xl py-3.5 pl-4 pr-2 text-right text-sm font-semibold tabular-nums ${textBase}`}>
                                                    {Number(order.total || 0).toLocaleString('fr-FR')} €
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </PanelFrame>
            </motion.div>

            {isSuperAdmin && (
                <motion.div custom={4} variants={sectionVariants} className="grid gap-5 lg:grid-cols-12">
                    <PanelFrame darkMode={darkMode} className="lg:col-span-4" innerClassName="p-6">
                        <div className="flex items-center gap-2">
                            <RefreshCw size={14} strokeWidth={1.4} className={textMuted} />
                            <h2 className={`text-[9px] font-bold uppercase tracking-[0.16em] ${textMuted}`}>Contrôles système</h2>
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                if (!window.confirm("Tester flux email ?")) return;
                                try {
                                    const res = await httpsCallable(functions, 'sendTestEmail')();
                                    alert(res.data.success ? "✅ Mail Flux OK" : "❌ Erreur Mail");
                                } catch (e) { alert(e.message); }
                            }}
                            className={`group mt-5 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#62816c] ${darkMode ? 'bg-white/[0.045] text-white/62 ring-white/[0.065] hover:bg-white/[0.08] hover:text-white' : 'bg-[#f1ede7] text-stone-600 ring-stone-900/[0.05] hover:bg-[#e6e0d8] hover:text-stone-900'}`}
                        >
                            Diagnostic mail
                            <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${darkMode ? 'bg-white/[0.06]' : 'bg-white/70'}`}>
                                <Mail size={15} strokeWidth={1.4} />
                            </span>
                        </button>
                    </PanelFrame>

                    <div className={`relative rounded-[30px] p-1.5 ring-1 lg:col-span-8 ${darkMode ? 'bg-red-500/[0.025] ring-red-400/15' : 'bg-red-50/70 ring-red-900/10'}`}>
                        <div className={`h-full rounded-[24px] p-6 ${darkMode ? 'bg-[#191615]' : 'bg-[#fffaf7]'}`}>
                            <div className={`flex items-center gap-2 ${darkMode ? 'text-red-300/70' : 'text-red-700'}`}>
                                <AlertTriangle size={14} strokeWidth={1.45} />
                                <h2 className="text-[9px] font-bold uppercase tracking-[0.16em]">Actions critiques</h2>
                            </div>
                            <div className={`relative mt-5 rounded-2xl px-4 py-5 text-sm ring-1 ${darkMode ? 'bg-white/[0.025] text-white/45 ring-white/[0.06]' : 'bg-white/70 text-stone-500 ring-red-900/10'}`}>
                                Les six actions destructives legacy sont neutralisées pendant la stabilisation commerce.
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* MODALS */}
            {isOrderResetModalOpen && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${darkMode ? 'bg-black/80' : 'bg-stone-900/50'}`}>
                    <div className={`rounded-[32px] p-8 max-w-sm w-full shadow-2xl border text-center space-y-4 ${darkMode ? 'bg-[#161616] border-white/10' : 'bg-white border-stone-100'}`}>
                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-stone-900'}`}>Purger Commandes ?</h3>
                        <p className={`text-xs ${textMuted}`}>Export CSV + Suppression définitive.</p>
                        {resettingOrders ? (
                            <LoadingProgress progress={progressValue} text={progressSubtitle} darkMode={darkMode} />
                        ) : (
                            <div className="flex gap-2 mt-4">
                                <button onClick={confirmResetOrders} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-colors">Confirmer</button>
                                <button onClick={() => setIsOrderResetModalOpen(false)} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors ${darkMode ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}>Annuler</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {isCleaningModalOpen && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${darkMode ? 'bg-black/80' : 'bg-stone-900/50'}`}>
                    <div className={`rounded-[32px] p-8 max-w-sm w-full shadow-2xl border text-center space-y-4 ${darkMode ? 'bg-[#161616] border-white/10' : 'bg-white border-stone-100'}`}>
                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-stone-900'}`}>Nettoyage Système ?</h3>
                        <p className={`text-xs ${textMuted}`}>Supprime les images orphelines du stockage.</p>
                        {cleaningCloud ? (
                            <LoadingProgress progress={progressValue} text={progressSubtitle} darkMode={darkMode} />
                        ) : (
                            <div className="flex gap-2 mt-4">
                                <button onClick={confirmCleaning} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-colors">Lancer</button>
                                <button onClick={() => setIsCleaningModalOpen(false)} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors ${darkMode ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}>Annuler</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {isResetUsersModalOpen && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${darkMode ? 'bg-black/80' : 'bg-stone-900/50'}`}>
                    <div className={`rounded-[32px] p-8 max-w-sm w-full shadow-2xl border text-center space-y-4 ${darkMode ? 'bg-[#161616] border-red-500/30' : 'bg-white border-stone-100'}`}>
                        <h3 className={`text-lg font-black text-red-500`}>Purge Totale ?</h3>
                        <p className={`text-[11px] ${textMuted}`}>
                            Suppression de TOUS les comptes utilisateurs. Seuls les Super Admins seront épargnés.
                        </p>
                        {resettingUsers ? (
                            <LoadingProgress progress={progressValue} text={progressSubtitle} darkMode={darkMode} />
                        ) : (
                            <div className="flex gap-2 mt-4">
                                <button onClick={confirmResetUsers} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors">Confirmer</button>
                                <button onClick={() => setIsResetUsersModalOpen(false)} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors ${darkMode ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}>Annuler</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {isPurgeAnonymousModalOpen && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${darkMode ? 'bg-black/80' : 'bg-stone-900/50'}`}>
                    <div className={`rounded-[32px] p-8 max-w-sm w-full shadow-2xl border text-center space-y-4 ${darkMode ? 'bg-[#161616] border-amber-500/30' : 'bg-white border-stone-100'}`}>
                        <h3 className={`text-lg font-black text-amber-500`}>Purge Anonymes ?</h3>
                        <p className={`text-[11px] ${textMuted}`}>
                            Supprime uniquement les comptes anonymes. Les vrais clients sont conservés.
                        </p>
                        {purgingAnonymous ? (
                            <LoadingProgress progress={progressValue} text={progressSubtitle} darkMode={darkMode} />
                        ) : (
                            <div className="flex gap-2 mt-4">
                                <button onClick={confirmPurgeAnonymous} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 transition-colors">Confirmer</button>
                                <button onClick={() => setIsPurgeAnonymousModalOpen(false)} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors ${darkMode ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}>Annuler</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {isPurgeProductsModalOpen && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${darkMode ? 'bg-black/80' : 'bg-stone-900/50'}`}>
                    <div className={`rounded-[32px] p-8 max-w-sm w-full shadow-2xl border text-center space-y-4 ${darkMode ? 'bg-[#161616] border-red-500/30' : 'bg-white border-stone-100'}`}>
                        <h3 className={`text-lg font-black text-red-500`}>Purge Meubles ?</h3>
                        <p className={`text-[11px] ${textMuted}`}>
                            Suppression de TOUS les meubles publiés, leurs images et sous-collections sociales. Irréversible.
                        </p>
                        {purgingProducts ? (
                            <LoadingProgress progress={progressValue} text={progressSubtitle} darkMode={darkMode} />
                        ) : (
                            <div className="flex gap-2 mt-4">
                                <button onClick={confirmPurgeProducts} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors">Confirmer</button>
                                <button onClick={() => setIsPurgeProductsModalOpen(false)} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors ${darkMode ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}>Annuler</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const _DangerButton = ({ onClick, text, darkMode }) => (
    <button
        type="button"
        onClick={onClick}
        className={`group relative rounded-2xl px-3 py-3.5 text-[8px] font-bold uppercase tracking-[0.12em] ring-1 transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
            darkMode
                ? 'bg-red-400/[0.045] text-red-300/60 ring-red-300/10 hover:bg-red-400/10 hover:text-red-200'
                : 'bg-red-50/80 text-red-700 ring-red-900/10 hover:bg-red-100'
        }`}
    >
        <span className="relative flex items-center justify-center gap-2">
            <AlertTriangle size={12} strokeWidth={1.45} className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-px" />
            {text}
        </span>
    </button>
);

export default AdminDashboard;
