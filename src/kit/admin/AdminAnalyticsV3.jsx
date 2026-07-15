import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getCallableFunction } from '../config/firebaseLazy';

const PERIODS = [{ id: '7d', label: '7 j' }, { id: '30d', label: '30 j' }, { id: '12m', label: '12 m' }];
const VIEWS = [{ id: 'overview', label: "Vue d'ensemble" }, { id: 'journeys', label: 'Parcours' }, { id: 'sessions', label: 'Sessions' }];
const CACHE_PREFIX = 'secondevie.admin.analytics.v3.aggregate.';
const number = new Intl.NumberFormat('fr-FR');

const readAggregateCache = (period) => {
    try {
        const value = JSON.parse(sessionStorage.getItem(`${CACHE_PREFIX}${period}`) || 'null');
        return value?.schemaVersion === 3 ? value : null;
    } catch { return null; }
};

const writeAggregateCache = (period, value) => {
    try { sessionStorage.setItem(`${CACHE_PREFIX}${period}`, JSON.stringify({ ...value, schemaVersion: 3, cachedAt: Date.now() })); } catch { /* cache non essentiel */ }
};

const Quality = ({ quality = {} }) => (
    <div className="analytics-overview__metrics" data-analytics-reveal>
        <div><span>Resolution d&apos;identite</span><strong>{quality.identity_resolution || 'partielle'}</strong><small>Qualite technique, jamais score client</small></div>
        <div><span>Completude</span><strong>{quality.data_completeness || 'partielle'}</strong><small>Fenetre et compacts disponibles</small></div>
        <div><span>Integrite ingestion</span><strong>{quality.ingestion_integrity || 'partielle'}</strong><small>Schema V3 et lots dedupliques</small></div>
    </div>
);

const Overview = ({ data }) => {
    const quoteViews = Number(data.pages?.quote) || 0;
    const quoteStarts = Number(data.actions?.quote_start) || 0;
    const quoteIntents = Number(data.actions?.quote_email_intent) || 0;
    return <>
        <div className="analytics-overview__metrics" data-analytics-reveal>
            <div><span>Visiteurs</span><strong>{data.uniqueVisitorsApprox == null ? '—' : `≈ ${number.format(data.uniqueVisitorsApprox)}`}</strong><small>HyperLogLog p=12</small></div>
            <div><span>Sessions techniques</span><strong>{number.format(data.sessions || 0)}</strong><small>{Math.round((data.detailedCoverage || 0) * 100)} % detaillees consenties</small></div>
            <div><span>Pages vues</span><strong>{number.format(data.pageViews || 0)}</strong><small>{data.provisional ? 'Periode partiellement provisoire' : 'Periode compactee'}</small></div>
            <div><span>Paiements durables</span><strong>{number.format(data.business?.payment_paid_server || 0)}</strong><small>Source serveur / Stripe uniquement</small></div>
        </div>
        <section className="analytics-overview__quote-panel" data-analytics-reveal>
            <div className="analytics-overview__panel-heading"><div><span className="analytics-overview__eyebrow">Demande de devis</span><h4>Intentions mesurees sans surinterpretation</h4></div></div>
            <div className="analytics-overview__pipeline-stages">
                <div><span>Page consultee</span><strong>{number.format(quoteViews)}</strong></div>
                <div><span>Formulaire commence</span><strong>{number.format(quoteStarts)}</strong></div>
                <div><span>Intention e-mail</span><strong>{number.format(quoteIntents)}</strong></div>
                <div><span>Commandes creees</span><strong>{number.format(data.business?.order_created_server || 0)}</strong></div>
                <div><span>Remboursements</span><strong>{number.format(data.business?.refund_server || 0)}</strong></div>
            </div>
        </section>
        <Quality quality={data.quality} />
    </>;
};

const Journeys = ({ data }) => {
    const rows = Object.entries(data.transitions || {}).sort((a, b) => b[1] - a[1]).slice(0, 30);
    return <section className="analytics-overview__surface" data-analytics-reveal>
        <div className="analytics-overview__surface-head"><div><span className="analytics-overview__eyebrow">Parcours agreges</span><h4>Transitions normalisees</h4></div><span className="analytics-overview__subtle">{data.provisional ? 'jour courant provisoire' : 'compact final'}</span></div>
        {rows.length ? <div className="analytics-overview__product-table" role="table">
            <div className="analytics-overview__product-head" role="row"><span>Transition</span><span>Passages</span></div>
            {rows.map(([key, count]) => <div className="analytics-overview__product-row" role="row" key={key}><strong>{key.replace('__', ' → ')}</strong><span>{number.format(count)}</span></div>)}
        </div> : <p className="analytics-overview__empty-copy">Les transitions apparaitront apres finalisation des premieres sessions.</p>}
    </section>;
};

const Sessions = ({ sessions, loading, error, onLoad, onSelect, selected, detail }) => (
    <section className="analytics-overview__surface" data-analytics-reveal>
        <div className="analytics-overview__surface-head"><div><span className="analytics-overview__eyebrow">Sessions consenties</span><h4>Racines pagees par 25</h4></div><button type="button" className="analytics-overview__refresh" onClick={onLoad} disabled={loading}>{loading ? 'Lecture…' : 'Actualiser'}</button></div>
        {error ? <p className="analytics-overview__empty-copy">{error}</p> : null}
        {sessions.length ? <div className="analytics-session-workspace__grid">
            <div className="analytics-session-table-wrap"><table className="analytics-session-table"><thead><tr><th>Visiteur</th><th>Appareil</th><th>Duree active</th><th>Etapes</th><th>Resultat</th></tr></thead><tbody>
                {sessions.map((session) => <tr key={session.id} data-selected={selected?.id === session.id} onClick={() => onSelect(session)}><td>{session.visitorLabel}</td><td>{session.device?.class || 'Unknown'} · {session.device?.browserFamily || 'Unknown'}</td><td>{Math.round(session.durationMs / 1000)} s</td><td>{session.eventCount}</td><td>{session.outcome || 'sortie'}</td></tr>)}
            </tbody></table></div>
            <aside className="analytics-session-inspector">{selected ? <><h4>{selected.visitorLabel}</h4><p>{selected.geo?.city || 'Ville indisponible'} · {selected.geo?.accuracy === 'city_approx' ? 'ville approximative' : 'geolocalisation indisponible'}</p><ol className="analytics-session-timeline">{detail.map((event) => <li key={`${event.seq}-${event.eventName}`}><time>#{event.seq}</time><div><strong>{event.eventName}</strong><span>{event.routeKey}</span></div></li>)}</ol></> : <p>Selectionnez une session pour charger ses chunks.</p>}</aside>
        </div> : !loading && <p className="analytics-overview__empty-copy">Aucune session detaillee consentie disponible.</p>}
    </section>
);

export default function AdminAnalyticsV3({ darkMode = false }) {
    const [period, setPeriod] = useState('30d');
    const [view, setView] = useState('overview');
    const [data, setData] = useState(() => typeof window === 'undefined' ? null : readAggregateCache('30d'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [sessionsError, setSessionsError] = useState('');
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState([]);

    const refresh = useCallback(async (targetPeriod = period) => {
        setLoading(true); setError('');
        try {
            const callable = await getCallableFunction('getAnalyticsOverviewV3');
            const response = await callable({ period: targetPeriod });
            setData(response.data); writeAggregateCache(targetPeriod, response.data);
        } catch {
            setError("Impossible de lire les compacts V3. L'admin fort et App Check sont requis.");
        } finally { setLoading(false); }
    }, [period]);

    useEffect(() => {
        const cached = readAggregateCache(period);
        setData(cached);
        if (!cached) refresh(period);
    }, [period, refresh]);

    const loadSessions = useCallback(async () => {
        setSessionsLoading(true); setSessionsError('');
        try {
            const callable = await getCallableFunction('listAnalyticsSessionsV3');
            const response = await callable({ pageSize: 25 });
            setSessions(response.data.sessions || []);
        } catch {
            setSessionsError("Acces refuse ou indisponible : AAL2 recent et capacite analytics_session_viewer requis.");
        } finally { setSessionsLoading(false); }
    }, []);

    useEffect(() => { if (view === 'sessions' && sessions.length === 0 && !sessionsLoading) loadSessions(); }, [view, sessions.length, sessionsLoading, loadSessions]);

    const selectSession = useCallback(async (session) => {
        setSelected(session); setDetail([]);
        try {
            const callable = await getCallableFunction('getAnalyticsSessionDetailV3');
            const events = [];
            let afterSeq = null;
            do {
                const response = await callable({ sessionId: session.id, ...(afterSeq == null ? {} : { afterSeq }) });
                events.push(...(response.data.events || []));
                afterSeq = response.data.nextAfterSeq;
            } while (afterSeq != null && events.length < 512);
            setDetail(events.sort((a, b) => a.seq - b.seq));
        } catch { setSessionsError('Impossible de charger le detail audite de cette session.'); }
    }, []);

    const transitions = useMemo(() => data?.transitions || {}, [data]);
    const model = data ? { ...data, transitions } : null;
    return <section className="analytics-overview" data-theme={darkMode ? 'dark' : 'light'}>
        <header className="analytics-overview__header analytics-overview__header--compact">
            <nav className="analytics-overview__view-nav">{VIEWS.map((item) => <button key={item.id} type="button" data-active={view === item.id} onClick={() => setView(item.id)}>{item.label}</button>)}</nav>
            <div className="analytics-overview__toolbar"><div className="analytics-overview__periods">{PERIODS.map((item) => <button key={item.id} type="button" aria-pressed={period === item.id} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div><button type="button" className="analytics-overview__refresh" onClick={() => refresh()} disabled={loading}><RefreshCw size={15} className={loading ? 'analytics-overview__spin' : ''} />Actualiser</button></div>
        </header>
        <p className="analytics-overview__sync-line" data-role={error ? 'warning' : 'success'}>{error || (data ? `${data.sourceDocuments} compacts lus · schema V3${data.provisional ? ' · donnees provisoires' : ''}` : 'Lecture des compacts V3…')}</p>
        {model && view === 'overview' ? <Overview data={model} /> : null}
        {model && view === 'journeys' ? <Journeys data={model} /> : null}
        {view === 'sessions' ? <Sessions sessions={sessions} loading={sessionsLoading} error={sessionsError} onLoad={loadSessions} onSelect={selectSession} selected={selected} detail={detail} /> : null}
    </section>;
}
