'use client';

import { Activity, CircleDot, RefreshCw } from 'lucide-react';
import { eventLabel, formatNumber, routeMeta } from './model';
import styles from './DataStudio.module.css';

function observedAt(value) {
    if (!Number.isFinite(Number(value))) return 'En attente';
    return new Date(Number(value)).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function DataLiveActivity({ data, loading, error, onRefresh }) {
    const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
    const count = Number(data?.activeSessions) || 0;
    return <section className={`${styles.liveActivity} ds-reveal`} aria-labelledby="live-activity-title">
        <header>
            <div><span className={styles.kicker}>Activité en direct</span><h2 id="live-activity-title">Ce qui est reçu maintenant</h2></div>
            <div className={styles.liveHeaderActions}><span data-active={count > 0}><CircleDot size={13} strokeWidth={1.8} /> {count ? `${formatNumber(count)} active${count > 1 ? 's' : ''}` : 'Aucune active'}</span><button type="button" onClick={onRefresh} disabled={loading} aria-label="Actualiser l'activité en direct"><RefreshCw size={14} className={loading ? styles.spin : ''} /></button></div>
        </header>
        {error ? <p className={styles.liveError}>La lecture provisoire est indisponible. Les compacts finalisés ne sont pas affectés.</p> : <>
            <div className={styles.liveMetrics}>
                <article><span>Sessions actives</span><strong>{formatNumber(count)}</strong><small>reçues depuis moins de 90 s</small></article>
                <article><span>Pages en cours</span><strong>{formatNumber(data?.provisionalPageViews)}</strong><small>dans ces sessions, non consolidées</small></article>
                <article><span>Événements reçus</span><strong>{formatNumber(data?.provisionalEvents)}</strong><small>lecture bornée, sans profil visiteur</small></article>
            </div>
            {sessions.length ? <ol className={styles.liveRouteList}>{sessions.map((session, index) => {
                const route = routeMeta(session.routeKey);
                return <li key={`${session.lastReceivedAt || 'session'}-${index}`}><Activity size={14} strokeWidth={1.45} /><span><strong>{route.label}</strong><small>{session.eventName ? eventLabel(session.eventName) : 'Premier lot en attente'}</small></span><time>{session.lastReceivedAt ? new Date(session.lastReceivedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</time></li>;
            })}</ol> : <div className={styles.liveEmpty}><strong>Aucune session consentie active.</strong><span>Cette surface se met à jour toutes les 10 secondes tant que Data Studio est ouvert.</span></div>}
        </>}
        <footer>Provisoire · Les KPI, l’atlas et le registre final restent alimentés après finalisation et compactage. Dernière lecture : {observedAt(data?.observedAt)}.</footer>
    </section>;
}
