'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowLeft, BarChart3, Menu, Network, RefreshCw, Rows3, ShieldAlert } from 'lucide-react';
import { getCallableFunction } from '../config/firebaseLazy';
import DataOverview from './data-studio/DataOverview';
import DataJourneys from './data-studio/DataJourneys';
import DataSessions from './data-studio/DataSessions';
import { getDataStudioPreview, PREVIEW_EVENTS, PREVIEW_SESSIONS } from './data-studio/previewData';
import styles from './data-studio/DataStudio.module.css';

gsap.registerPlugin(useGSAP);

const PERIODS = [{ id: '7d', label: '7 jours' }, { id: '30d', label: '30 jours' }, { id: '12m', label: '12 mois' }];
const VIEWS = [
    { id: 'overview', label: 'Vue d’ensemble', icon: BarChart3 },
    { id: 'journeys', label: 'Parcours', icon: Network },
    { id: 'sessions', label: 'Sessions', icon: Rows3 },
];
const CACHE_PREFIX = 'secondevie.admin.data-studio.v3.';

function readCache(period) {
    try {
        const value = JSON.parse(sessionStorage.getItem(`${CACHE_PREFIX}${period}`) || 'null');
        return value?.schemaVersion === 3 ? value : null;
    } catch { return null; }
}

function writeCache(period, value) {
    try { sessionStorage.setItem(`${CACHE_PREFIX}${period}`, JSON.stringify({ ...value, schemaVersion: 3, cachedAt: Date.now() })); } catch { /* cache opportuniste */ }
}

function environmentLabel() {
    const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
    if (project === 'secondevienextjsssr') return 'Sandbox · Europe Ouest';
    return project ? project.replaceAll('-', ' ') : 'Environnement Firebase';
}

export default function AdminDataStudio({ catalogItems = [], onOpenNavigation }) {
    const [period, setPeriod] = useState('30d');
    const [view, setView] = useState('overview');
    const [data, setData] = useState(() => typeof window === 'undefined' ? null : readCache('30d'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [nextCursorMillis, setNextCursorMillis] = useState(null);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [sessionsLoadingMore, setSessionsLoadingMore] = useState(false);
    const [sessionsLoaded, setSessionsLoaded] = useState(false);
    const [sessionsError, setSessionsError] = useState('');
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const stageRef = useRef(null);

    const refresh = useCallback(async (targetPeriod = period) => {
        setLoading(true); setError('');
        try {
            const callable = await getCallableFunction('getAnalyticsOverviewV3');
            const response = await callable({ period: targetPeriod });
            setPreviewMode(false); setData(response.data); writeCache(targetPeriod, response.data);
        } catch {
            if (process.env.NODE_ENV === 'development') {
                setData(getDataStudioPreview(targetPeriod)); setPreviewMode(true); setError('');
            } else setError('Les compacts V3 ne sont pas accessibles. L’administration forte et App Check sont requis.');
        } finally { setLoading(false); }
    }, [period]);

    useEffect(() => {
        const cached = readCache(period);
        setData(cached);
        if (!cached) refresh(period);
    }, [period, refresh]);

    const loadSessions = useCallback(async ({ append = false } = {}) => {
        append ? setSessionsLoadingMore(true) : setSessionsLoading(true);
        setSessionsError('');
        try {
            const callable = await getCallableFunction('listAnalyticsSessionsV3');
            const response = await callable({ pageSize: 25, ...(append && nextCursorMillis != null ? { cursorMillis: nextCursorMillis } : {}) });
            const incoming = response.data.sessions || [];
            setSessions((current) => append ? [...new Map([...current, ...incoming].map((session) => [session.id, session])).values()] : incoming);
            setNextCursorMillis(response.data.nextCursorMillis ?? null); setSessionsLoaded(true);
            if (!append) { setSelected(null); setDetail([]); }
        } catch {
            if (process.env.NODE_ENV === 'development') {
                setSessions(PREVIEW_SESSIONS); setNextCursorMillis(null); setSessionsLoaded(true); setPreviewMode(true);
            } else setSessionsError('Accès refusé ou indisponible : AAL2 récent et capacité analytics_session_viewer requis.');
        } finally { setSessionsLoading(false); setSessionsLoadingMore(false); }
    }, [nextCursorMillis]);

    useEffect(() => {
        if (view === 'sessions' && !sessionsLoaded && !sessionsLoading && !sessionsError) loadSessions();
    }, [view, sessionsLoaded, sessionsLoading, sessionsError, loadSessions]);

    const selectSession = useCallback(async (session) => {
        setSelected(session); setDetail([]); setDetailError(''); setDetailLoading(true);
        if (session.id.startsWith('preview-')) { setDetail(PREVIEW_EVENTS); setDetailLoading(false); return; }
        try {
            const callable = await getCallableFunction('getAnalyticsSessionDetailV3');
            const events = [];
            let afterSeq = null;
            do {
                const response = await callable({ sessionId: session.id, ...(afterSeq == null ? {} : { afterSeq }) });
                events.push(...(response.data.events || [])); afterSeq = response.data.nextAfterSeq;
            } while (afterSeq != null && events.length < 512);
            setDetail(events.sort((left, right) => left.seq - right.seq));
        } catch { setDetailError('Le détail audité de cette session ne peut pas être chargé.'); }
        finally { setDetailLoading(false); }
    }, []);

    useGSAP(() => {
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduced) return;
        gsap.fromTo('.ds-reveal', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .7, stagger: .055, ease: 'power3.out', clearProps: 'transform,opacity' });
    }, { scope: stageRef, dependencies: [view, period, Boolean(data)] });

    const status = useMemo(() => {
        if (previewMode) return { tone: 'preview', title: 'Aperçu local', detail: `Données de démonstration · ${environmentLabel()}` };
        if (error) return { tone: 'warning', title: 'Lecture interrompue', detail: error };
        if (!data) return { tone: 'reading', title: 'Connexion aux compacts', detail: 'Lecture du schéma V3…' };
        return { tone: data.provisional ? 'provisional' : 'ready', title: data.provisional ? 'Période provisoire' : 'Données finalisées', detail: `${data.sourceDocuments || 0} compacts · schéma V3` };
    }, [data, error, previewMode]);

    return <section className={styles.studio} ref={stageRef}>
        <header className={styles.appBar}>
            <div className={styles.brandLockup}>
                <button type="button" className={styles.mobileMenu} onClick={onOpenNavigation} aria-label="Ouvrir la navigation"><Menu size={18} strokeWidth={1.4} /></button>
                <span className={styles.brandMark}>SV</span>
                <div><strong>Data Studio</strong><small>Seconde Vie · intelligence boutique</small></div>
            </div>
            <div className={styles.appActions}>
                <div className={styles.statusPill} data-tone={status.tone}><i /><span><strong>{status.title}</strong><small>{status.detail}</small></span></div>
                <Link href="/" aria-label="Retour au site"><ArrowLeft size={16} strokeWidth={1.4} /><span>Voir le site</span></Link>
            </div>
        </header>

        <div className={styles.controlDeck}>
            <nav aria-label="Vues Data Studio">{VIEWS.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}><Icon size={14} strokeWidth={1.4} /><span>{label}</span></button>)}</nav>
            <div className={styles.deckActions}>
                <div className={styles.periodControl} aria-label="Période">{PERIODS.map((item) => <button key={item.id} type="button" aria-pressed={period === item.id} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div>
                <button type="button" className={styles.refresh} onClick={() => refresh()} disabled={loading}><RefreshCw size={14} className={loading ? styles.spin : ''} /><span>Actualiser</span></button>
            </div>
        </div>

        <main className={styles.workspace}>
            {data && view === 'overview' ? <DataOverview data={data} period={period} catalogItems={catalogItems} /> : null}
            {data && view === 'journeys' ? <DataJourneys data={data} /> : null}
            {view === 'sessions' ? <DataSessions sessions={sessions} loading={sessionsLoading} loadingMore={sessionsLoadingMore} error={sessionsError} selected={selected} detail={detail} detailLoading={detailLoading} detailError={detailError} hasMore={nextCursorMillis != null} onReload={() => loadSessions({ append: false })} onLoadMore={() => loadSessions({ append: true })} onSelect={selectSession} catalogItems={catalogItems} /> : null}
            {!data && !error && view !== 'sessions' ? <div className={styles.appSkeleton}><i /><div><i /><i /><i /><i /></div><i /></div> : null}
            {!data && error && view !== 'sessions' ? <section className={styles.dataError}><ShieldAlert size={22} strokeWidth={1.4} /><div><strong>Les données ne sont pas accessibles.</strong><p>{error}</p></div><button type="button" onClick={() => refresh()}>Réessayer</button></section> : null}
        </main>
    </section>;
}
