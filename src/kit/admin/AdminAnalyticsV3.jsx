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

const qualityLabel = (value) => ({ bonne: 'Bonne', forte: 'Forte', partielle: 'Partielle' }[value] || 'Partielle');

const Quality = ({ quality = {} }) => (
    <section className="analytics-v3-quality" data-analytics-reveal>
        <header>
            <div><span className="analytics-overview__eyebrow">Qualité de mesure</span><h4>Ce que les chiffres permettent d&apos;affirmer</h4></div>
            <p>Signaux techniques — jamais un score attribué au visiteur.</p>
        </header>
        <div className="analytics-v3-quality__grid">
            <article data-state={quality.identity_resolution || 'partielle'}><span>Résolution d&apos;identité</span><strong>{qualityLabel(quality.identity_resolution)}</strong><p>Estimation multi-jours seulement lorsqu&apos;un identifiant minimisé est disponible.</p></article>
            <article data-state={quality.data_completeness || 'partielle'}><span>Complétude</span><strong>{qualityLabel(quality.data_completeness)}</strong><p>Fenêtre demandée, compacts et séquences reçues sans rupture.</p></article>
            <article data-state={quality.ingestion_integrity || 'partielle'}><span>Intégrité d&apos;ingestion</span><strong>{qualityLabel(quality.ingestion_integrity)}</strong><p>Schéma V3, lots idempotents et observation App Check.</p></article>
        </div>
    </section>
);

const Overview = ({ data }) => {
    const quoteViews = Number(data.pages?.quote) || 0;
    const quoteStarts = Number(data.actions?.quote_start) || 0;
    const quoteIntents = Number(data.actions?.quote_email_intent) || 0;
    const pageRows = Object.entries(data.pages || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxPageViews = Math.max(1, ...pageRows.map(([, count]) => Number(count) || 0));
    const stages = [
        ['Page consultée', quoteViews],
        ['Formulaire commencé', quoteStarts],
        ['Intention e-mail', quoteIntents],
        ['Commande créée', Number(data.business?.order_created_server) || 0],
        ['Remboursement', Number(data.business?.refund_server) || 0],
    ];
    return <>
        <section className="analytics-v3-kpis" aria-label="Indicateurs principaux" data-analytics-reveal>
            <article><span>Visiteurs estimés</span><strong data-size={data.uniqueVisitorsApprox == null ? 'compact' : 'normal'}>{data.uniqueVisitorsApprox == null ? 'Non estimable' : `≈ ${number.format(data.uniqueVisitorsApprox)}`}</strong><p>{data.uniqueVisitorsApprox == null ? 'Identifiant minimisé absent' : 'HyperLogLog · précision p=12'}</p></article>
            <article data-featured="true"><span>Sessions techniques</span><strong>{number.format(data.sessions || 0)}</strong><p>{Math.round((data.detailedCoverage || 0) * 100)} % avec détail consenti</p></article>
            <article><span>Pages vues</span><strong>{number.format(data.pageViews || 0)}</strong><p>{data.provisional ? 'Période encore provisoire' : 'Période compactée'}</p></article>
            <article><span>Paiements confirmés</span><strong>{number.format(data.business?.payment_paid_server || 0)}</strong><p>Stripe · source serveur uniquement</p></article>
        </section>
        <div className="analytics-v3-story-grid">
            <section className="analytics-v3-panel analytics-v3-panel--pipeline" data-analytics-reveal>
                <header><div><span className="analytics-overview__eyebrow">Demande de devis</span><h4>Du regard à l&apos;intention</h4></div><p>Événements observés, sans extrapolation</p></header>
                <div className="analytics-v3-pipeline" role="list">
                    {stages.map(([label, count], index) => <article key={label} role="listitem">
                        <div><span>{String(index + 1).padStart(2, '0')}</span><em>{label}</em></div>
                        <strong>{number.format(count)}</strong>
                        <i style={{ '--stage-fill': `${quoteViews ? Math.max(4, (count / quoteViews) * 100) : 0}%` }} />
                    </article>)}
                </div>
            </section>
            <section className="analytics-v3-panel analytics-v3-panel--pages" data-analytics-reveal>
                <header><div><span className="analytics-overview__eyebrow">Contenus consultés</span><h4>Répartition des pages</h4></div><strong>{number.format(data.pageViews || 0)}</strong></header>
                {pageRows.length ? <div className="analytics-v3-page-list">{pageRows.map(([key, count]) => <div key={key}>
                    <span>{key}</span><i><b style={{ '--page-fill': `${(Number(count) / maxPageViews) * 100}%` }} /></i><strong>{number.format(count)}</strong>
                </div>)}</div> : <p className="analytics-overview__empty-copy">La répartition apparaîtra après la première session finalisée.</p>}
            </section>
        </div>
        <Quality quality={data.quality} />
    </>;
};

const Journeys = ({ data }) => {
    const rows = Object.entries(data.transitions || {}).sort((a, b) => b[1] - a[1]).slice(0, 30);
    const maximum = Math.max(1, ...rows.map(([, count]) => Number(count) || 0));
    return <section className="analytics-v3-panel analytics-v3-panel--journeys" data-analytics-reveal>
        <header><div><span className="analytics-overview__eyebrow">Parcours agrégés</span><h4>Les passages qui structurent la visite</h4></div><p>{data.provisional ? 'Jour courant provisoire' : 'Compact final'}</p></header>
        {rows.length ? <div className="analytics-v3-transition-list">
            {rows.map(([key, count], index) => { const [from, to] = key.split('__'); return <article key={key}>
                <span>{String(index + 1).padStart(2, '0')}</span><div><strong>{from || 'inconnu'} <em>→</em> {to || 'inconnu'}</strong><i><b style={{ '--transition-fill': `${(Number(count) / maximum) * 100}%` }} /></i></div><strong>{number.format(count)}</strong>
            </article>; })}
        </div> : <p className="analytics-overview__empty-copy">Les transitions apparaîtront après finalisation des premières sessions.</p>}
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
