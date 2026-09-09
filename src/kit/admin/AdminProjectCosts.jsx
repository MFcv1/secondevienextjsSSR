'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChartNoAxesCombined, Download, RefreshCw, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getFirebaseAppCheckToken } from '../config/firebaseLazy';
import { subscribeAdminCacheGeneration } from './adminDataCache';
import styles from './AdminProjectCosts.module.css';

const money = value => value == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
const count = value => value == null ? '—' : new Intl.NumberFormat('fr-FR').format(value);
const monthLabel = (value, short = false) => new Date(`${value}-15T12:00:00Z`).toLocaleDateString('fr-FR', { month: short ? 'short' : 'long', year: 'numeric', timeZone: 'UTC' });
const when = value => value ? new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Aucun relevé';

async function requestCosts(user, signal) {
  const [token, appCheck] = await Promise.all([user.getIdToken(), getFirebaseAppCheckToken()]);
  if (!appCheck) throw new Error('Protection de connexion indisponible. Rechargez la page.');
  const response = await fetch('/api/admin/project-costs', {
    method: 'GET', cache: 'no-store', signal,
    headers: { authorization: `Bearer ${token}`, 'x-firebase-appcheck': appCheck },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(response.status === 403 ? 'Vos droits ne permettent pas cette lecture.' : 'Les coûts sont momentanément indisponibles.');
  return result;
}

export default function AdminProjectCosts({ darkMode }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [generation, setGeneration] = useState(0);
  const identity = useRef(user);
  const epoch = useRef(0);
  identity.current = user;
  useEffect(() => subscribeAdminCacheGeneration(() => { epoch.current += 1; setData(null); setGeneration(value => value + 1); }), []);
  useEffect(() => {
    setData(null);
    setError('');
    if (!user) return;
    const controller = new AbortController();
    const requestedEpoch = epoch.current;
    setBusy(true);
    requestCosts(user, controller.signal).then(value => {
      if (!controller.signal.aborted && identity.current === user && requestedEpoch === epoch.current) setData({ owner: user, payload: value });
    }).catch(failure => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [user, refresh, generation]);
  return <ProjectCostsView key={`${user?.uid || 'none'}-${generation}`} darkMode={darkMode} data={data?.owner === user ? data.payload : null} busy={busy} error={error}
    onRefresh={() => setRefresh(value => value + 1)} />;
}

function CostChart({ rows, selected, onSelect, showTraffic }) {
  if (!rows.length) return <p className={styles.loading}>Aucun relevé Google Cloud reçu. Aucun graphique n’est calculé.</p>;
  const chronological = [...rows].reverse();
  const costs = rows.filter(row => row.cost != null).map(row => row.cost);
  const low = Math.min(0, ...costs), high = Math.max(1, ...costs);
  const trafficMax = Math.max(1, ...rows.map(row => row.traffic?.sessions || 0));
  const x = index => rows.length === 1 ? 390 : 60 + index / (rows.length - 1) * 660;
  const y = amount => 190 - (amount - low) / (high - low) * 160;
  const segments = (field, mapper) => chronological.map((row, index) => {
    const value = field(row), previous = index ? field(chronological[index - 1]) : null;
    return value != null && previous != null ? <line key={row.month} x1={x(index - 1)} y1={mapper(previous)} x2={x(index)} y2={mapper(value)} /> : null;
  });
  return <div className={styles.chartScroll}>
    <svg viewBox="0 0 780 235" className={styles.chart} role="img" aria-label="Évolution mensuelle des coûts et des sessions. Les deux courbes ont des échelles distinctes. Valeurs détaillées dans le tableau.">
      {[0, 0.5, 1].map(fraction => <g key={fraction}><line x1="60" x2="720" y1={30 + 160 * fraction} y2={30 + 160 * fraction} className={styles.gridLine} />
        <text x="52" y={34 + 160 * fraction} textAnchor="end">{money(high - (high - low) * fraction)}</text>
        {showTraffic && <text x="728" y={34 + 160 * fraction}>{count(Math.round(trafficMax * (1 - fraction)))}</text>}</g>)}
      <g className={styles.costLine}>{segments(row => row.cost, y)}</g>
      {showTraffic && <g className={styles.trafficLine}>{segments(row => row.traffic?.sessions ?? null, value => 190 - value / trafficMax * 160)}</g>}
      {chronological.map((row, index) => <g key={row.month}>
        {row.month === selected && <line x1={x(index)} x2={x(index)} y1="22" y2="197" className={styles.selectionLine} />}
        {row.cost != null && <circle cx={x(index)} cy={y(row.cost)} r={row.month === selected ? 5 : 3} className={styles.costPoint}><title>{monthLabel(row.month)} : {money(row.cost)}</title></circle>}
        {(index % Math.ceil(rows.length / 6) === 0 || index === rows.length - 1) && <text x={x(index)} y="220" textAnchor="middle">{monthLabel(row.month, true)}</text>}
      </g>)}
    </svg>
    {!costs.length && <p className={styles.chartEmpty}>Votre premier relevé donnera vie à cette courbe.</p>}
    <div className={styles.monthPicker} aria-label="Choisir un mois">{chronological.map(row => <button key={row.month} aria-pressed={selected === row.month} onClick={() => onSelect(row.month)} title={monthLabel(row.month)}>{row.month.slice(5)}<span className={row.cost == null ? styles.noDot : styles.dot} /></button>)}</div>
  </div>;
}

export function ProjectCostsView({ darkMode, data, busy, error, onRefresh }) {
  const [selected, setSelected] = useState(null), [showTraffic, setShowTraffic] = useState(true);
  const rows = data?.rows || [];
  const focus = rows.find(row => row.month === selected) || rows[0];
  const closed = rows.filter(row => row.complete);
  const total = closed.length ? closed.reduce((sum, row) => sum + row.cost, 0) : null;
  const average = total == null ? null : total / closed.length;
  const correlation = data?.correlation;
  const previous = focus ? rows[rows.indexOf(focus) + 1] : null;
  const consecutive = focus && previous && Date.UTC(Number(previous.month.slice(0, 4)), Number(previous.month.slice(5, 7)), 1) === Date.parse(`${focus.month}-01T00:00:00Z`);
  const change = consecutive && focus.complete && previous.complete ? focus.cost - previous.cost : null;
  const current = focus?.month === new Date().toISOString().slice(0, 7);
  const stale = focus?.updatedAtMs && current && Date.now() - focus.updatedAtMs > 48 * 3600000;
  const exportCsv = () => {
    const content = '\uFEFFmois;cout;devise;sessions;statut;source\n' + rows.map(row => `${row.month};${row.cost == null ? '' : String(row.cost).replace('.', ',')};EUR;${row.traffic?.sessions ?? ''};${row.cost == null ? 'absent' : row.complete ? 'mois couvert' : 'partiel'};${row.source || ''}`).join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'seconde-vie-couts.csv'; link.click(); URL.revokeObjectURL(url);
  };
  return <section className={styles.root} data-dark={darkMode || undefined} aria-label="Coûts du projet">
    <header className={styles.header}><div><p className={styles.eyebrow}>SECONDE VIE · HÉBERGEMENT</p><h1>Le coût de votre site.</h1><p className={styles.subtitle}>Des dépenses lisibles. Une activité mise en perspective.</p></div>
      <div className={styles.actions}><button onClick={onRefresh} disabled={busy}><RefreshCw size={15} />{busy ? 'Chargement…' : 'Actualiser'}</button></div></header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {data && !data.configured && <p className={styles.notice}><Wallet size={16} />Les relevés automatiques ne sont pas encore raccordés. Aucun montant ne sera affiché avant réception des données Google Cloud.</p>}
    <div className={styles.heroGrid} aria-busy={busy}>
      <article className={styles.hero}><div className={styles.heroTop}><span><span className={styles.liveDot} />{focus ? monthLabel(focus.month) : 'Ce mois-ci'}</span><Wallet size={21} /></div>
        <p className={styles.heroLabel}>Dépenses comptabilisées</p><strong className={styles.amount}>{money(focus?.cost)}</strong>
        <div className={styles.heroBottom}><span>{focus?.cost == null ? 'En attente d’un relevé' : focus.complete ? 'Total du mois · hors facture finale' : 'Relevé partiel · montant provisoire'}</span><span>Google Cloud</span></div>
        {focus && <><div className={styles.monthTrack} aria-hidden="true"><span style={{ width: current ? `${Math.round(new Date().getDate() / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() * 100)}%` : '100%' }} /></div>
        <small>{current ? 'Avancement du mois civil' : 'Mois terminé'} · {when(focus.updatedAtMs)}{stale ? ' · relevé ancien' : ''}</small></>}
      </article>
      <div className={styles.metrics}><article><span><CalendarDays size={16} />Moyenne mensuelle</span><strong>{money(average)}</strong><small>{closed.length} mois couverts · hors mois partiels</small></article>
        <article><span>{change != null && change < 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}Écart avec le mois précédent</span><strong>{change == null ? '—' : `${change > 0 ? '+' : ''}${money(change)}`}</strong><small>{change == null ? 'Deux mois consécutifs couverts sont nécessaires' : 'Différence de dépenses, sans extrapolation'}</small></article>
      </div>
    </div>
    <article className={styles.panel}><div className={styles.panelHeading}><div><h2>Votre activité, en perspective</h2><p>Coûts à gauche · sessions mesurées à droite. Deux échelles distinctes.</p></div></div>
      <div className={styles.legend}><span><i className={styles.costSwatch} />Dépenses</span><label><input type="checkbox" checked={showTraffic} onChange={event => setShowTraffic(event.target.checked)} /><i className={styles.trafficSwatch} />Sessions mesurées</label><span className={styles.coverage}>{rows.length} mois réellement reçus</span></div>
      <CostChart rows={rows} selected={focus?.month} onSelect={setSelected} showTraffic={showTraffic} />
      <div className={styles.insights}><div><span>Sessions · {focus ? monthLabel(focus.month, true) : 'mois sélectionné'}</span><strong>{count(focus?.traffic?.sessions)}</strong><small>{focus?.traffic ? focus.traffic.complete ? 'Période couverte par la mesure' : 'Couverture partielle' : 'Trafic non disponible'}</small></div>
        <div><span>Coût pour 1 000 sessions</span><strong>{money(focus?.costPerThousand)}</strong><small>Indicatif · seulement sur des mois couverts</small></div>
        <div><span><ChartNoAxesCombined size={14} />Corrélation coûts / trafic</span><strong>{correlation?.value == null ? 'À observer' : correlation.value.toFixed(2).replace('.', ',')}</strong><small>{correlation?.value == null ? `Au moins 6 mois comparables · ${correlation?.samples || 0} disponibles` : `Coefficient de Pearson · ${correlation.samples} mois`}</small></div></div>
      <p className={styles.caveat}>Une corrélation ne prouve pas une cause. Stockage, builds, minimum d’instances et traitements de fond peuvent aussi peser sur les coûts. Le trafic dépend du consentement ; ses périodes Europe/Paris peuvent différer de celles de facturation.</p>
    </article>
    <article className={styles.panel}><div className={styles.panelHeading}><div><h2>Chaque mois, en détail</h2><p>Uniquement les mois pour lesquels Google Cloud a transmis un relevé.</p></div><button onClick={exportCsv} disabled={!data}><Download size={15} />Exporter</button></div>
      <div className={styles.tableScroll}><table><thead><tr><th>Mois</th><th>Dépenses</th><th>Sessions</th><th>€/1 000 sessions</th><th>Relevé</th></tr></thead><tbody>{rows.map(row => <tr key={row.month} data-selected={focus?.month === row.month || undefined}>
        <th scope="row"><button onClick={() => setSelected(row.month)} aria-pressed={focus?.month === row.month}>{monthLabel(row.month)}</button></th><td>{money(row.cost)}</td><td>{count(row.traffic?.sessions)}{row.traffic && !row.traffic.complete ? ' *' : ''}</td><td>{money(row.costPerThousand)}</td><td><span className={styles.status}>{row.cost == null ? 'Non disponible' : row.complete ? 'Mois couvert' : 'Partiel'}</span><small>Google Cloud</small></td>
      </tr>)}</tbody></table>{!rows.length && <p className={styles.loading} role="status">{busy ? 'Lecture des relevés…' : 'Aucun relevé Google Cloud reçu pour le moment.'}</p>}</div>
    </article>
    <footer className={styles.footer}>Montants en euros, après les crédits inclus dans le relevé. Les corrections Google peuvent modifier les dépenses. * Trafic partiel. aucune actualisation automatique en arrière-plan.</footer>
  </section>;
}
