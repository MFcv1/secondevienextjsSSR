'use client';

import { CircleAlert, LoaderCircle, RefreshCw, Server } from 'lucide-react';
import DataReliability from './DataReliability';
import styles from './DataStudio.module.css';

const COPY = {
    connecting: { icon: LoaderCircle, title: 'Connexion au moteur V3', detail: 'Lecture des compacts et vérification du schéma en cours.', action: null },
    'empty-engine': { icon: Server, title: 'Le moteur est prêt. Aucune visite finalisée pour cette période.', detail: 'Les sessions apparaîtront après ingestion, finalisation puis compaction.', action: 'Vérifier la connexion' },
    'measured-zero': { icon: Server, title: 'La période est finalisée, sans activité observée.', detail: 'Les compacts confirment une activité nulle ; aucun tableau de zéros n’est affiché.', action: 'Actualiser' },
    error: { icon: CircleAlert, title: 'La connexion au moteur a échoué.', detail: null, action: 'Réessayer' },
};

export default function DataEngineState({ state, error, data, onRetry }) {
    const content = COPY[state] || COPY.error;
    const Icon = content.icon;
    return <div className={styles.engineStack} aria-live="polite">
        <section className={`${styles.engineState} ${state === 'error' ? styles.engineStateError : ''}`}>
            <Icon size={22} strokeWidth={1.35} className={state === 'connecting' ? styles.spin : ''} />
            <div><span className={styles.kicker}>{state === 'error' ? error?.title || 'Connexion' : 'Data Studio V3'}</span><h2>{content.title}</h2><p>{state === 'error' ? error?.detail : content.detail}</p></div>
            {content.action ? <button type="button" onClick={onRetry} disabled={state === 'connecting'}><RefreshCw size={14} strokeWidth={1.4} />{content.action}</button> : null}
        </section>
        {data ? <DataReliability data={data} /> : null}
    </div>;
}
