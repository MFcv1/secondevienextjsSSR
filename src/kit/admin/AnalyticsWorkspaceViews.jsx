import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { getReliableVisitorKey, toAnalyticsMillis } from './analyticsReliability';

const PAGE_LABELS = {
    vitrine_home: 'Accueil',
    gallery_landing: 'Galerie',
    gallery_filter_fixed: 'Ventes directes',
    category_group: 'Catégorie',
    category_leaf: 'Catégorie',
    product_detail: 'Produit',
    detail: 'Produit',
    quote_request: 'Devis',
    checkout: 'Paiement',
    checkout_success: 'Achat',
    wishlist: 'Favori',
    my_orders: 'Mes commandes'
};

const STAGES = [
    { id: 'gallery', label: 'Galerie' },
    { id: 'category', label: 'Catégorie' },
    { id: 'product', label: 'Produit' },
    { id: 'quote', label: 'Devis' },
    { id: 'checkout', label: 'Paiement' },
    { id: 'purchase', label: 'Achat' }
];

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

const getStage = (stepKey) => {
    if (stepKey === 'category_group' || stepKey === 'category_leaf') return 'category';
    if (stepKey === 'product_detail' || stepKey === 'detail') return 'product';
    if (stepKey === 'quote_request') return 'quote';
    if (stepKey === 'checkout') return 'checkout';
    if (stepKey === 'checkout_success') return 'purchase';
    if (stepKey === 'gallery_landing' || stepKey === 'gallery_filter_fixed' || stepKey === 'vitrine_home') return 'gallery';
    return null;
};

const formatDuration = (seconds) => {
    const safe = Math.max(0, Number(seconds) || 0);
    if (safe < 60) return `${safe}s`;
    return `${Math.floor(safe / 60)} min ${safe % 60}s`;
};

const formatTime = (timestamp) => {
    const value = toAnalyticsMillis(timestamp);
    return value ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—';
};

const anonymousId = (session) => {
    const key = getReliableVisitorKey(session).replace(/^(uid|vk|ip|session):/i, '');
    return `Visiteur ${key.slice(-4).toUpperCase()}`;
};

const getLastAction = (session) => {
    const events = getEvents(session);
    const event = events[events.length - 1];
    if (event?.action === 'quote_email_opened') return { label: 'Intention devis', tone: 'info' };
    if (event?.action === 'cart_add') return { label: 'Ajout panier', tone: 'warning' };
    if (event?.action === 'favorite_add') return { label: 'Favori ajouté', tone: 'neutral' };
    const journey = getJourney(session);
    const last = journey[journey.length - 1];
    return { label: PAGE_LABELS[getStepKey(last)] || 'Sortie', tone: 'neutral' };
};

const buildJourneyModel = (sessions) => {
    const stageCounts = new Map(STAGES.map((stage) => [stage.id, 0]));
    const transitions = new Map();
    const sequenceMap = new Map();

    sessions.forEach((session) => {
        const stages = getJourney(session)
            .map((step) => getStage(getStepKey(step)))
            .filter(Boolean)
            .filter((stage, index, list) => index === 0 || list[index - 1] !== stage);

        stages.forEach((stage) => stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1));
        stages.slice(1).forEach((stage, index) => {
            const transition = `${stages[index]}:${stage}`;
            transitions.set(transition, (transitions.get(transition) || 0) + 1);
        });

        if (stages.length > 1) {
            const id = stages.join('>');
            const current = sequenceMap.get(id) || { id, stages, count: 0, duration: 0 };
            current.count += 1;
            current.duration += Number(session.duration) || 0;
            sequenceMap.set(id, current);
        }
    });

    return {
        stages: STAGES.map((stage) => ({ ...stage, count: stageCounts.get(stage.id) || 0 })),
        transitions,
        sequences: [...sequenceMap.values()]
            .sort((left, right) => right.count - left.count)
            .slice(0, 6)
            .map((sequence) => ({
                ...sequence,
                averageDuration: sequence.count ? Math.round(sequence.duration / sequence.count) : 0
            }))
    };
};

const JourneyEmptyState = () => (
    <section className="analytics-empty-stage analytics-empty-stage--journey" data-analytics-reveal>
        <div className="analytics-empty-stage__intro">
            <span className="analytics-empty-stage__index">01 / PARCOURS</span>
            <h4>Le premier trajet apparaîtra ici.</h4>
            <p>Cette vue reliera les pages réellement visitées, sans deviner de comportement avant d’avoir des sessions exploitables.</p>
        </div>
        <div className="analytics-empty-stage__diagram" aria-hidden="true">
            <div className="analytics-empty-stage__node"><span>Entrée</span><i /></div>
            <div className="analytics-empty-stage__rail"><i /><i /><i /></div>
            <div className="analytics-empty-stage__node"><span>Produit</span><i /></div>
            <div className="analytics-empty-stage__rail"><i /><i /><i /></div>
            <div className="analytics-empty-stage__node analytics-empty-stage__node--accent"><span>Demande</span><i /></div>
        </div>
        <div className="analytics-empty-stage__footer">
            <span>Lecture disponible dès une session avec au moins une étape</span>
            <span>Les passages à 0 s / 0 étape restent exclus</span>
        </div>
    </section>
);

const SessionsEmptyState = () => (
    <section className="analytics-empty-stage analytics-empty-stage--sessions" data-analytics-reveal>
        <div className="analytics-empty-stage__intro">
            <span className="analytics-empty-stage__index">02 / SESSIONS</span>
            <h4>Aucune session à lire pour l’instant.</h4>
            <p>Les sessions sans durée ou sans étape ne sont volontairement pas listées. Cela évite de remplir cet espace avec du bruit.</p>
        </div>
        <div className="analytics-empty-stage__ledger" aria-label="Règles de lecture des sessions">
            <div><span>Sessions qualifiées</span><strong>0</strong></div>
            <div><span>Filtre de qualité</span><strong>≥ 1 étape</strong></div>
            <div><span>Identifiants</span><strong>Anonymisés</strong></div>
        </div>
        <div className="analytics-empty-stage__footer">
            <span>La prochaine session exploitable ouvrira son détail ici</span>
            <span>Actualisez après une visite test</span>
        </div>
    </section>
);

export const AnalyticsJourneyView = ({ sessions }) => {
    const model = useMemo(() => buildJourneyModel(sessions), [sessions]);
    const maxStageCount = Math.max(1, ...model.stages.map((stage) => stage.count));

    if (!sessions.length) return <JourneyEmptyState />;

    return (
        <div className="analytics-workspace" data-analytics-reveal>
            <section className="analytics-workspace__metrics" aria-label="Résumé des parcours">
                <div><span>Sessions qualifiées</span><strong>{sessions.length}</strong></div>
                <div><span>Étapes moyennes</span><strong>{sessions.length ? (sessions.reduce((total, session) => total + getJourney(session).length, 0) / sessions.length).toFixed(1) : '—'}</strong></div>
                <div><span>Durée médiane</span><strong>{sessions.length ? formatDuration([...sessions].sort((a, b) => (a.duration || 0) - (b.duration || 0))[Math.floor(sessions.length / 2)]?.duration) : '—'}</strong></div>
                <div><span>Sessions devis</span><strong>{model.stages.find((stage) => stage.id === 'quote')?.count || 0}</strong></div>
            </section>

            <section className="analytics-workspace__panel">
                <div className="analytics-workspace__panel-head">
                    <div><span>Parcours</span><h4>Flux de navigation</h4></div>
                    <p>Étapes agrégées</p>
                </div>
                {sessions.length ? (
                    <div className="analytics-flow" aria-label="Flux de navigation agrégé">
                        {model.stages.map((stage, index) => {
                            const next = model.stages[index + 1];
                            const transition = next ? model.transitions.get(`${stage.id}:${next.id}`) || 0 : 0;
                            return (
                                <div className="analytics-flow__step" key={stage.id}>
                                    <div className="analytics-flow__node" data-active={stage.count > 0}>
                                        <span>{stage.label}</span>
                                        <strong>{stage.count}</strong>
                                        <em>{sessions.length ? `${Math.round((stage.count / sessions.length) * 100)} %` : '—'}</em>
                                    </div>
                                    {next && <div className="analytics-flow__link" data-active={transition > 0}><i style={{ '--flow-width': `${Math.max(8, Math.min(100, (transition / maxStageCount) * 100))}%` }} /><span>{transition || ''}</span></div>}
                                </div>
                            );
                        })}
                    </div>
                ) : <p className="analytics-workspace__empty-copy">Aucun parcours qualifié sur cette période.</p>}
            </section>

            <section className="analytics-workspace__panel">
                <div className="analytics-workspace__panel-head"><div><span>Séquences</span><h4>Chemins les plus fréquents</h4></div><p>Sessions observées</p></div>
                {model.sequences.length ? (
                    <table className="analytics-workspace__sequence-table">
                        <thead><tr><th>Parcours</th><th>Sessions</th><th>Durée moyenne</th></tr></thead>
                        <tbody>{model.sequences.map((sequence) => <tr key={sequence.id}><td>{sequence.stages.map((stage) => STAGES.find((item) => item.id === stage)?.label || stage).join(' → ')}</td><td>{sequence.count}</td><td>{formatDuration(sequence.averageDuration)}</td></tr>)}</tbody>
                    </table>
                ) : <p className="analytics-workspace__empty-copy">Les séquences apparaîtront à partir de deux étapes observées dans une même session.</p>}
            </section>
        </div>
    );
};

export const AnalyticsSessionsView = ({ sessions }) => {
    const [query, setQuery] = useState('');
    const [device, setDevice] = useState('all');
    const [selectedId, setSelectedId] = useState(null);
    const filtered = useMemo(() => sessions.filter((session) => {
        const matchesDevice = device === 'all' || session.device === device;
        const search = query.trim().toLowerCase();
        if (!search) return matchesDevice;
        return [anonymousId(session), session.device, session.browser, getLastAction(session).label]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search)) && matchesDevice;
    }), [sessions, query, device]);
    const selected = filtered.find((session) => session.id === selectedId) || filtered[0] || null;

    if (!sessions.length) return <SessionsEmptyState />;

    return (
        <div className="analytics-session-workspace" data-analytics-reveal>
            <div className="analytics-session-toolbar" role="toolbar" aria-label="Filtres sessions">
                <label className="analytics-session-search"><Search size={15} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un visiteur ou une action" /></label>
                <div className="analytics-session-toolbar__filters">{['all', 'Desktop', 'Mobile'].map((value) => <button type="button" key={value} data-active={device === value} onClick={() => setDevice(value)}>{value === 'all' ? 'Tous appareils' : value}</button>)}</div>
                <span>{filtered.length} session{filtered.length > 1 ? 's' : ''}</span>
            </div>
            <div className="analytics-session-workspace__grid">
                    <div className="analytics-session-table-wrap">
                        <table className="analytics-session-table">
                            <thead><tr><th>Heure</th><th>Visiteur</th><th>Appareil</th><th>Durée</th><th>Étapes</th><th>Dernière action</th></tr></thead>
                            <tbody>{filtered.map((session) => {
                                const action = getLastAction(session);
                                return <tr key={session.id} data-selected={selected?.id === session.id} onClick={() => setSelectedId(session.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(session.id); } }}><td>{formatTime(session.startedAt)}</td><td>{anonymousId(session)}</td><td>{session.device || '—'} · {session.browser || '—'}</td><td>{formatDuration(session.duration)}</td><td>{getJourney(session).length}</td><td><span className="analytics-session-table__result" data-tone={action.tone}>{action.label}</span></td></tr>;
                            })}</tbody>
                        </table>
                    </div>
                    <aside className="analytics-session-inspector" aria-label="Détail de la session sélectionnée">
                        {selected ? <>
                            <div className="analytics-session-inspector__head"><div><span>Session</span><h4>{anonymousId(selected)}</h4></div><button type="button" onClick={() => setSelectedId(null)} aria-label="Fermer le détail"><X size={16} /></button></div>
                            <div className="analytics-session-inspector__summary"><div><span>Appareil</span><strong>{selected.device || 'Inconnu'}</strong></div><div><span>Durée</span><strong>{formatDuration(selected.duration)}</strong></div><div><span>Étapes</span><strong>{getJourney(selected).length}</strong></div></div>
                            <h5>Parcours de la session</h5>
                            <ol className="analytics-session-timeline">{getJourney(selected).map((step, index) => <li key={`${getStepKey(step)}-${index}`}><time>{formatTime(step.timestamp)}</time><div><strong>{PAGE_LABELS[getStepKey(step)] || getStepKey(step)}</strong>{step?.context?.itemName && <span>{step.context.itemName}</span>}</div></li>)}</ol>
                        </> : <p className="analytics-workspace__empty-copy">Sélectionnez une session pour lire son parcours.</p>}
                    </aside>
            </div>
        </div>
    );
};
