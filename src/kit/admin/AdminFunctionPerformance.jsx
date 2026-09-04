'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, RefreshCw, Search, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getFirebaseAppCheckToken } from '../config/firebaseLazy';
import styles from './AdminFunctionPerformance.module.css';

const number = new Intl.NumberFormat('fr-FR');
const n = value => value == null ? '—' : number.format(value);
const duration = value => value == null ? '—' : value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
const date = value => new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const label = name => name.replace(/Gen2$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
const errors = { google_403: 'Google Cloud refuse la lecture. Les droits Monitoring Viewer et Cloud Functions Viewer du serveur doivent être vérifiés.', refresh_in_progress: 'Une actualisation est déjà en cours. Réessayez dans quelques instants.', google_429: 'Google limite temporairement les requêtes. Réessayez plus tard.' };

export default function AdminFunctionPerformance({ darkMode }) {
  const { user } = useAuth();
  const [period, setPeriod] = useState('24h');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const cache = useRef(new Map());

  useEffect(() => { cache.current.clear(); setData(null); }, [user?.uid]);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const prior = cache.current.get(period);
    setData(prior || null);
    setError('');
    if (!user) return;
    if (prior && Date.now() - Date.parse(prior.fetchedAt) < 900000) { setBusy(false); return; }
    setBusy(true);
    (async () => {
      try {
        const [token, appCheck] = await Promise.all([user.getIdToken(), getFirebaseAppCheckToken()]);
        if (!appCheck) throw new Error('Protection de connexion indisponible. Rechargez la page.');
        const response = await fetch(`/api/admin/function-metrics?period=${period}`, { cache: 'no-store', signal: controller.signal, headers: { authorization: `Bearer ${token}`, 'x-firebase-appcheck': appCheck } });
        const payload = await response.json();
        if (!response.ok) throw new Error(errors[payload.error] || 'Les métriques sont indisponibles. Aucune valeur n’a été inventée.');
        if (active) { cache.current.set(period, payload); setData(payload); }
      } catch (failure) { if (active && failure.name !== 'AbortError') setError(failure.message); }
      finally { if (active) setBusy(false); }
    })();
    return () => { active = false; controller.abort(); };
  }, [user, period, refresh]);

  return <FunctionPerformanceView darkMode={darkMode} period={period} setPeriod={setPeriod} data={data} busy={busy} error={error} canRefresh={Boolean(user)} onRefresh={() => setRefresh(value => value + 1)} />;
}

export function FunctionPerformanceView({ darkMode, period, setPeriod, data, busy, error, canRefresh = true, onRefresh }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('calls');
  const [expanded, setExpanded] = useState(null);
  const rows = useMemo(() => (data?.rows || []).filter(row => row.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => (b[sort] ?? -1) - (a[sort] ?? -1)), [data, query, sort]);
  const totals = (data?.rows || []).reduce((acc, row) => ({ calls: acc.calls + (row.calls || 0), errors: acc.errors + (row.errors || 0), rejected: acc.rejected + (row.rejected || 0), observed: acc.observed + Number(row.calls != null) }), { calls: 0, errors: 0, rejected: 0, observed: 0 });
  const max = Math.max(1, ...(data?.rows || []).map(row => row.calls || 0));

  return <section className={styles.root} data-dark={darkMode || undefined} aria-label="Performance des fonctions">
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>SECONDE VIE · SANDBOX</p><h1>Performance</h1><p className={styles.subtitle}>Comprendre l’activité. Repérer ce qui mérite votre attention.</p></div>
      <button className={styles.refresh} disabled={busy || !canRefresh} onClick={onRefresh}><RefreshCw size={15} />{busy ? 'Chargement…' : 'Actualiser'}</button>
    </header>
    <div className={styles.toolbar}>
      <div className={styles.segment} aria-label="Période">{[['24h', '24 heures'], ['7d', '7 jours'], ['30d', '30 jours']].map(([value, text]) => <button key={value} aria-pressed={period === value} onClick={() => { setPeriod(value); setExpanded(null); }}>{text}</button>)}</div>
      <p className={styles.timestamp}>{data ? `Relevé du ${date(data.fetchedAt)}${data.stale ? ' · ancien relevé' : ''}` : 'Lecture à l’ouverture uniquement'}</p>
    </div>
    {error && <div className={styles.error} role="alert">{error}</div>}
    <div className={styles.summary} aria-busy={busy}>
      <div><span>Fonctions déployées</span><strong>{data ? n(data.rows.length) : '—'}</strong><small>{data ? `${totals.observed} avec des appels observés` : 'Inventaire Google Cloud'}</small></div>
      <div><span>Appels observés</span><strong>{data ? n(totals.calls) : '—'}</strong><small>Toutes réponses incluses</small></div>
      <div><span>Erreurs serveur</span><strong>{data ? n(totals.errors) : '—'}</strong><small>5xx · échecs d’exécution Gen1</small></div>
      <div><span>Requêtes refusées</span><strong className={totals.rejected ? styles.amber : undefined}>{data ? n(totals.rejected) : '—'}</strong><small>4xx · à examiner séparément</small></div>
    </div>
    <div className={styles.panel}>
      <div className={styles.panelHeader}><div><h2>Les fonctions, en un regard</h2><p>Classement par activité et temps de réponse.</p></div><Activity size={19} aria-hidden="true" /></div>
      <div className={styles.filters}><label className={styles.search}><Search size={16} /><input aria-label="Rechercher une fonction" placeholder="Rechercher une fonction…" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Trier les fonctions" value={sort} onChange={event => setSort(event.target.value)}><option value="calls">Les plus appelées</option><option value="meanMs">Les plus lentes · moyenne</option><option value="p95Ms">Les plus lentes · p95</option><option value="errors">Erreurs serveur</option><option value="rejected">Requêtes refusées</option></select></div>
      {!data && busy ? <div className={styles.loading} role="status">Lecture de l’inventaire et des métriques Google Cloud…{[1, 2, 3, 4].map(i => <div key={i} className={styles.skeleton} />)}</div> : !data ? <div className={styles.empty}>Les données apparaîtront après une lecture réussie.</div> : !rows.length ? <div className={styles.empty}>Aucune fonction ne correspond à cette recherche.</div> : <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Fonction</th><th>Appels</th><th>Moyenne</th><th title="95 % des réponses sous cette durée. Au moins 30 mesures.">p95</th><th>5xx / échecs</th><th>4xx</th></tr></thead><tbody>{rows.map(row => <React.Fragment key={`${row.region}/${row.name}`}><tr className={expanded === row.name ? styles.selected : undefined}>
        <td><button className={styles.function} aria-expanded={expanded === row.name} onClick={() => setExpanded(expanded === row.name ? null : row.name)}><span><b>{label(row.name)}</b><small>{row.generation === 2 ? 'Cloud Run' : 'Functions Gen1'} · {row.region}</small></span><ChevronDown size={14} /></button></td>
        <td><div className={styles.activity}><span>{n(row.calls)}</span><div className={styles.track}><div style={{ transform: `scaleX(${(row.calls || 0) / max})` }} /></div></div></td><td>{duration(row.meanMs)}</td><td>{duration(row.p95Ms)}</td><td>{n(row.errors)}</td><td className={row.rejected ? styles.amber : undefined}>{n(row.rejected)}</td>
      </tr>{expanded === row.name && <tr><td colSpan={6} className={styles.detail}><div><code>{row.name}</code><p>{row.calls == null ? 'Aucune série reçue sur cette période. Cela ne prouve pas que cette fonction est inutile.' : `${n(row.samples)} durées mesurées. Les refus et les démarrages peuvent influencer la latence.`}</p><dl><div><dt>CPU alloué</dt><dd>{row.cpu ?? '—'}</dd></div><div><dt>Mémoire</dt><dd>{row.memory ?? '—'}</dd></div><div><dt>Concurrence</dt><dd>{n(row.concurrency)}</dd></div><div><dt>Instances min / max</dt><dd>{n(row.minInstances)} / {n(row.maxInstances)}</dd></div><div><dt>État déployé</dt><dd>{row.state || '—'}</dd></div></dl><a target="_blank" rel="noreferrer" href={row.generation === 2 ? `https://console.cloud.google.com/run/detail/${row.region}/${row.service}/metrics?project=${data.project}` : `https://console.cloud.google.com/functions/details/${row.region}/${row.name}?project=${data.project}`}>Voir dans Google Cloud <ArrowUpRight size={13} /></a></div></td></tr>}</React.Fragment>)}</tbody></table></div>}
    </div>
    <footer className={styles.footer}><p>{data ? `Fenêtre : ${date(data.start)} → ${date(data.end)}. ` : ''}Les métriques peuvent arriver avec quelques minutes de retard. Le p95 est estimé par Google et masqué sous 30 mesures.</p><p>Aucun suivi en arrière-plan · Cache partagé de 15 minutes · Les ressources allouées ne représentent pas une facture. Les lectures Firestore et les coûts en euros ne sont pas mesurés ici.</p></footer>
  </section>;
}
