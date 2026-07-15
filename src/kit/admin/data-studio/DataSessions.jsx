'use client';

import { ChevronDown, Clock3, LocateFixed, MonitorSmartphone, RefreshCw, ShieldCheck } from 'lucide-react';
import { buildProducts, eventLabel, formatDuration, formatNumber, outcomeLabel, routeMeta } from './model';
import styles from './DataStudio.module.css';

function SessionCard({ session, selected, onSelect }) {
    const location = session.geo?.city && session.geo.city !== 'Unknown' ? session.geo.city : 'Lieu indisponible';
    return <button type="button" className={styles.sessionCard} data-selected={selected} onClick={() => onSelect(session)} aria-pressed={selected}>
        <span className={styles.sessionAvatar}>{(session.visitorLabel || 'V').slice(-2)}</span>
        <span className={styles.sessionIdentity}><strong>{session.visitorLabel || 'Visiteur éphémère'}</strong><small>{location} · {session.device?.class || 'Appareil inconnu'}</small></span>
        <span className={styles.sessionDuration}><strong>{formatDuration(session.durationMs)}</strong><small>{formatNumber(session.eventCount)} événements</small></span>
        <span className={styles.sessionOutcome}>{outcomeLabel(session.outcome)}</span>
    </button>;
}

function EventProduct({ event, catalogItems }) {
    const id = event.context?.productId || event.context?.entityId;
    if (!id) return null;
    const product = buildProducts({ products: [{ id }] }, catalogItems)[0];
    if (!product) return null;
    return <span className={styles.eventProduct}>
        <i role="img" aria-label={product.name} style={product.image ? { backgroundImage: `url(${product.image})` } : undefined} />
        <span><small>Pièce</small><strong>{product.name}</strong></span>
    </span>;
}

function SessionFilm({ session, events, loading, error, catalogItems }) {
    if (!session) return <section className={`${styles.surface} ${styles.sessionFilmEmpty}`}><span className={styles.kicker}>Film de visite</span><strong>Choisissez une session.</strong><p>Le détail n’est chargé qu’à la demande pour les visites consenties.</p></section>;
    return <section className={`${styles.surface} ${styles.sessionFilm} ds-reveal`}>
        <header className={styles.surfaceHeader}>
            <div><span className={styles.kicker}>Film de visite</span><h2>{session.visitorLabel || 'Visiteur éphémère'}</h2></div>
            <span className={styles.consentMark}><ShieldCheck size={13} strokeWidth={1.5} /> Détail consenti</span>
        </header>
        {loading ? <div className={styles.filmLoading}><i /><i /><i /><i /></div> : error ? <div className={styles.sessionError}>{error}</div> : events.length ? <div className={styles.filmScroll}>
            <ol>{events.map((event, index) => {
                const route = routeMeta(event.routeKey);
                return <li key={`${event.seq}-${event.eventName}-${index}`} data-action={!event.eventName?.includes('view')}>
                    <div className={styles.filmNode}><span>{String(event.seq ?? index + 1).padStart(2, '0')}</span><i /></div>
                    <article>
                        <small>{route.short} · {event.activeDeltaMs ? formatDuration(event.activeDeltaMs) : 'durée non isolée'}</small>
                        <strong>{eventLabel(event.eventName)}</strong>
                        <span>{route.label}</span>
                        <EventProduct event={event} catalogItems={catalogItems} />
                    </article>
                </li>;
            })}</ol>
        </div> : <div className={styles.emptySignal}><strong>Aucun événement lisible dans les chunks disponibles.</strong></div>}
    </section>;
}

function SessionInspector({ session }) {
    if (!session) return <aside className={`${styles.surface} ${styles.nativeInspector}`}><span className={styles.kicker}>Inspecteur</span><strong>Contexte maîtrisé</strong><p>Aucune adresse e-mail, IP ou valeur User-Agent brute n’est stockée par V3.</p></aside>;
    const facts = [
        { icon: LocateFixed, label: 'Localisation', value: session.geo?.city && session.geo.city !== 'Unknown' ? session.geo.city : 'Indisponible', note: session.geo?.accuracy === 'city_approx' ? 'Ville approximative' : 'Non collectée' },
        { icon: MonitorSmartphone, label: 'Appareil', value: session.device?.class || 'Inconnu', note: session.device?.browserFamily || 'Famille inconnue' },
        { icon: Clock3, label: 'Temps actif', value: formatDuration(session.durationMs), note: `${formatNumber(session.pageViewCount)} pages` },
    ];
    return <aside className={`${styles.surface} ${styles.nativeInspector} ds-reveal`}>
        <header><span className={styles.kicker}>Inspecteur</span><i data-status={session.status} /></header>
        <h2>{outcomeLabel(session.outcome)}</h2>
        <div>{facts.map(({ icon: Icon, label, value, note }) => <article key={label}><Icon size={15} strokeWidth={1.35} /><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div>
        <footer><ShieldCheck size={14} strokeWidth={1.4} /> Portée limitée à cette session technique.</footer>
    </aside>;
}

export default function DataSessions({ sessions, loading, loadingMore, error, selected, detail, detailLoading, detailError, hasMore, onReload, onLoadMore, onSelect, catalogItems }) {
    return <div className={styles.viewStack}>
        <section className={`${styles.sessionHero} ds-reveal`}>
            <div><span className={styles.kicker}>Sessions consenties</span><h1>Une visite à la fois.<br /><em>Chaque étape à sa place.</em></h1></div>
            <p>Une session technique par onglet. Le détail reste borné, paginé et audité.</p>
        </section>
        {error ? <section className={styles.accessError}><strong>Lecture des sessions indisponible</strong><span>{error}</span><button type="button" onClick={onReload}>Réessayer</button></section> : null}
        <div className={styles.sessionWorkbench}>
            <section className={`${styles.surface} ${styles.sessionRegister} ds-reveal`}>
                <header className={styles.surfaceHeader}><div><span className={styles.kicker}>Registre récent</span><h2>{formatNumber(sessions.length)} sessions chargées</h2></div><button type="button" onClick={onReload} disabled={loading} aria-label="Actualiser les sessions"><RefreshCw size={15} className={loading ? styles.spin : ''} /></button></header>
                <div className={styles.sessionCards}>{sessions.map((session) => <SessionCard key={session.id} session={session} selected={selected?.id === session.id} onSelect={onSelect} />)}</div>
                {!sessions.length && !loading && !error ? <div className={styles.emptySignal}><strong>Aucune session détaillée consentie.</strong></div> : null}
                {loading && !sessions.length ? <div className={styles.sessionSkeleton}><i /><i /><i /><i /></div> : null}
                {hasMore ? <button type="button" className={styles.loadMore} onClick={onLoadMore} disabled={loadingMore}>{loadingMore ? 'Lecture…' : <>Charger 25 visites de plus <ChevronDown size={14} /></>}</button> : sessions.length ? <footer>Fin des résultats disponibles</footer> : null}
            </section>
            <div className={styles.sessionFocus}><SessionFilm session={selected} events={detail} loading={detailLoading} error={detailError} catalogItems={catalogItems} /><SessionInspector session={selected} /></div>
        </div>
    </div>;
}
