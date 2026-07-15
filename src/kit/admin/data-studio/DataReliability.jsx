'use client';

import { ShieldCheck } from 'lucide-react';
import { formatNumber, formatPercent } from './model';
import styles from './DataStudio.module.css';

function formatCompactDate(value) {
    if (!Number.isFinite(Number(value))) return 'En attente';
    return new Date(Number(value)).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function stateFor(value, positive = true) {
    return positive ? (value ? 'good' : 'waiting') : (value ? 'attention' : 'good');
}

export default function DataReliability({ data }) {
    const sourceDocuments = Number(data?.sourceDocuments) || 0;
    const expectedDocuments = Number(data?.expectedDocuments) || 0;
    const sequenceGapCount = Number(data?.sequenceGapCount) || 0;
    const appCheckRatio = data?.appCheckObservedRatio;
    const items = [
        { label: 'Callable admin', value: 'Accessible', note: 'Lecture V3 réussie', state: 'good' },
        { label: 'Schéma reçu', value: data?.schemaVersion === 3 ? 'V3' : 'Inattendu', note: 'Contrat de lecteur', state: data?.schemaVersion === 3 ? 'good' : 'attention' },
        { label: 'Compacts', value: `${formatNumber(sourceDocuments)} / ${formatNumber(expectedDocuments)}`, note: data?.missingDocuments ? `${formatNumber(data.missingDocuments)} attendus` : 'Couverture complète', state: stateFor(!data?.missingDocuments) },
        { label: 'Dernier compact', value: formatCompactDate(data?.latestCompactedAt), note: data?.newestDataKey ? `Période ${data.newestDataKey}` : 'Aucun compact reçu', state: stateFor(Boolean(data?.latestCompactedAt)) },
        { label: 'Période', value: data?.provisional ? 'Provisoire' : 'Finalisée', note: data?.provisional ? `${formatNumber(data?.provisionalDocuments)} compact(s) à consolider` : 'Fenêtre stabilisée', state: data?.provisional ? 'attention' : 'good' },
        { label: 'Séquences', value: sequenceGapCount ? `${formatNumber(sequenceGapCount)} rupture(s)` : 'Continues', note: 'Contrôle à la finalisation', state: stateFor(sequenceGapCount, false) },
        { label: 'App Check observé', value: appCheckRatio == null ? 'En attente' : formatPercent(appCheckRatio), note: 'Observation technique, pas un score visiteur', state: stateFor(appCheckRatio != null) },
        { label: 'Intégrité ingestion', value: data?.quality?.ingestion_integrity || 'En attente', note: 'Schéma, doublons et réconciliation', state: data?.quality?.ingestion_integrity === 'forte' || data?.quality?.ingestion_integrity === 'bonne' ? 'good' : 'waiting' },
        { label: 'Détail consenti', value: formatPercent(data?.detailedCoverage), note: 'Sessions détaillées / sessions mesurées', state: 'waiting' },
        { label: 'Paiements', value: 'Serveur Stripe', note: data?.paymentsSource === 'stripe_order_state' ? 'État durable de commande' : 'Source non confirmée', state: data?.paymentsSource === 'stripe_order_state' ? 'good' : 'attention' },
    ];
    return <section className={`${styles.reliability} ds-reveal`} aria-labelledby="measurement-quality-title">
        <header><div><span className={styles.kicker}>Connexion et qualité de mesure</span><h2 id="measurement-quality-title">Les faits techniques de cette lecture</h2></div><ShieldCheck size={17} strokeWidth={1.4} /></header>
        <div>{items.map((item) => <article key={item.label} data-state={item.state}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</div>
        <footer>Ces indicateurs décrivent le moteur et la couverture de mesure. Ils ne qualifient jamais une personne.</footer>
    </section>;
}
