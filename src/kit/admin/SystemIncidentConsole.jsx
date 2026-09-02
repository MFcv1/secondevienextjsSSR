'use client';

import React from 'react';
import {
  AlertCircle,
  Bug,
  ChevronRight,
  Cloud,
  Copy,
  ExternalLink,
  Filter,
  Layers3,
  Search,
  TerminalSquare,
  X,
} from 'lucide-react';

const timestampMillis = (value) => {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  const millis = new Date(value || 0).getTime();
  return Number.isFinite(millis) ? millis : 0;
};

const normalizeProjectedIncident = (data) => {
  if (
    data?.schemaVersion !== 1
    || typeof data.fingerprint !== 'string'
    || !Number.isSafeInteger(data.occurrenceCount)
    || data.occurrenceCount < 1
    || !timestampMillis(data.firstSeen)
    || !timestampMillis(data.lastSeen)
    || typeof data.event !== 'string'
    || typeof data.errorClass !== 'string'
    || typeof data.service !== 'string'
  ) return null;
  const latest = {
    id: data.logInsertId || data.fingerprint,
    timestamp: new Date(timestampMillis(data.lastSeen)).toISOString(),
    severity: data.severity || 'ERROR',
    event: data.event,
    errorClass: data.errorClass,
    service: data.service,
    functionName: data.functionName || data.service,
    region: data.region || null,
    revision: data.revision || null,
    retryable: data.retryable === true,
    durationMs: Number.isFinite(data.durationMs) ? data.durationMs : null,
    message: data.message || data.event,
    stack: data.stack || null,
    correlationId: data.correlationId || null,
    orderId: data.orderId || null,
    commandId: data.commandId || null,
    traceId: data.traceId || null,
  };
  return {
    id: data.fingerprint,
    severity: latest.severity,
    event: data.event,
    errorClass: data.errorClass,
    service: data.service,
    functionName: latest.functionName,
    region: latest.region,
    revision: latest.revision,
    expected: false,
    retryable: latest.retryable,
    count: data.occurrenceCount,
    firstSeen: new Date(timestampMillis(data.firstSeen)).toISOString(),
    lastSeen: latest.timestamp,
    latest,
    links: {
      logs: typeof data.logsExplorerUrl === 'string' ? data.logsExplorerUrl : null,
      errors: `https://console.cloud.google.com/errors;time=P1D?project=secondevienextjsssr`,
    },
  };
};

const WINDOWS = [
  { value: 1, label: '1 h' },
  { value: 6, label: '6 h' },
  { value: 24, label: '24 h' },
  { value: 72, label: '3 j' },
  { value: 168, label: '7 j' },
];

const formatDate = (value, withDate = true) => {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', withDate
    ? { dateStyle: 'short', timeStyle: 'medium' }
    : { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
};

const severityTone = (severity) => (
  ['EMERGENCY', 'ALERT', 'CRITICAL'].includes(severity) ? 'critical' : 'error'
);

function IconButton({ label, onClick, children, darkMode, disabled = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${darkMode ? 'border-white/10 bg-white/[0.04] text-stone-300 hover:bg-white/[0.09]' : 'border-black/10 bg-white text-stone-600 hover:bg-stone-100'}`}
    >
      {children}
    </button>
  );
}

function SeverityDot({ severity }) {
  const critical = severityTone(severity) === 'critical';
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${critical ? 'bg-fuchsia-500 shadow-[0_0_0_4px_rgba(217,70,239,0.12)]' : 'bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.10)]'}`} />;
}

function CopyValue({ label, value, darkMode }) {
  if (!value) return null;
  return (
    <div className={`grid grid-cols-[6.5rem_minmax(0,1fr)_2rem] items-center gap-2 border-t py-2.5 text-[11px] ${darkMode ? 'border-white/[0.07]' : 'border-black/[0.07]'}`}>
      <span className={darkMode ? 'text-stone-500' : 'text-stone-500'}>{label}</span>
      <code className="truncate font-mono text-[10px]">{value}</code>
      <button
        type="button"
        title={`Copier ${label}`}
        aria-label={`Copier ${label}`}
        onClick={() => navigator.clipboard?.writeText(value)}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
      >
        <Copy size={13} />
      </button>
    </div>
  );
}

function IncidentInspector({ group, detail, darkMode, onClose, onOpenOrder }) {
  const occurrence = detail?.occurrences?.[0] || group?.latest || null;
  const surface = darkMode ? 'border-white/10 bg-[#151515]' : 'border-black/10 bg-[#fbfbfc]';
  return (
    <aside className={`min-h-0 overflow-hidden rounded-2xl border ${surface}`} aria-label="Détail de l’incident">
      <header className={`flex items-start justify-between gap-3 border-b p-4 ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <SeverityDot severity={group.severity} />
            <p className="truncate text-sm font-semibold">{group.event}</p>
          </div>
          <p className={`mt-1.5 truncate font-mono text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>{group.errorClass} · {group.service}</p>
        </div>
        <IconButton darkMode={darkMode} label="Fermer le détail" onClick={onClose}><X size={15} /></IconButton>
      </header>

      <div className="max-h-[68vh] overflow-y-auto p-4">
        <section className={`rounded-xl border p-3.5 ${darkMode ? 'border-white/[0.08] bg-black/20' : 'border-black/[0.08] bg-white'}`}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-[10px] text-stone-500">Occurrences</p><p className="mt-1 font-semibold tabular-nums">{group.count}</p></div>
            <div><p className="text-[10px] text-stone-500">Dernière</p><p className="mt-1 font-semibold tabular-nums">{formatDate(group.lastSeen)}</p></div>
            <div><p className="text-[10px] text-stone-500">Fonction</p><p className="mt-1 truncate font-mono text-[10px]">{group.functionName}</p></div>
            <div><p className="text-[10px] text-stone-500">Révision</p><p className="mt-1 truncate font-mono text-[10px]">{group.revision || '—'}</p></div>
          </div>
        </section>

        <details className="mt-5 rounded-xl border border-stone-500/20 p-3.5">
          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">Détails techniques de l’action</summary>
          <div className="mt-2">
            <CopyValue darkMode={darkMode} label="Corrélation" value={occurrence?.correlationId} />
            <CopyValue darkMode={darkMode} label="ID commande" value={occurrence?.orderId} />
            <CopyValue darkMode={darkMode} label="Action technique" value={occurrence?.commandId} />
            <CopyValue darkMode={darkMode} label="Trace Cloud" value={occurrence?.traceId} />
          </div>
          {occurrence?.orderId && (
            <button type="button" onClick={() => onOpenOrder(occurrence.orderId)} className={`mt-3 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${darkMode ? 'border-white/10 bg-white/[0.05] hover:bg-white/[0.1]' : 'border-black/10 bg-white hover:bg-stone-100'}`}>
              Ouvrir la chronologie commande <ChevronRight size={14} />
            </button>
          )}
        </details>

        <section className="mt-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">Pile expurgée</h3>
          {occurrence?.stack ? (
            <pre className={`mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border p-3 font-mono text-[10px] leading-5 ${darkMode ? 'border-white/[0.08] bg-black/30 text-stone-300' : 'border-black/[0.08] bg-white text-stone-700'}`}>{occurrence.stack}</pre>
          ) : (
            <p className="mt-2 text-xs text-stone-500">Aucune pile sûre disponible pour cette entrée.</p>
          )}
        </section>

        {detail?.occurrences?.length > 1 && (
          <section className="mt-5">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">Occurrences exactes</h3>
            <ol className={`mt-2 divide-y rounded-xl border ${darkMode ? 'divide-white/[0.07] border-white/[0.08]' : 'divide-black/[0.07] border-black/[0.08]'}`}>
              {detail.occurrences.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[11px]">
                  <span className="font-mono tabular-nums">{formatDate(item.timestamp)}</span>
                  <span className="truncate text-stone-500">{item.revision || item.service}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {detail?.links?.logs && <a target="_blank" rel="noreferrer" href={detail.links.logs} className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold ${darkMode ? 'border-white/10 hover:bg-white/[0.06]' : 'border-black/10 hover:bg-black/[0.03]'}`}>Logs Explorer <ExternalLink size={13} /></a>}
          {detail?.links?.errors && <a target="_blank" rel="noreferrer" href={detail.links.errors} className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold ${darkMode ? 'border-white/10 hover:bg-white/[0.06]' : 'border-black/10 hover:bg-black/[0.03]'}`}>Error Reporting <ExternalLink size={13} /></a>}
        </div>
      </div>
    </aside>
  );
}

export default function SystemIncidentConsole({ darkMode = false, onOpenOrder, state = { status: 'loading', data: null } }) {
  const [windowHours, setWindowHours] = React.useState(24);
  const [severity, setSeverity] = React.useState('error');
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(null);
  const [detail, setDetail] = React.useState({ data: null });

  const openDetail = (group) => {
    setSelected(group);
    setDetail({ data: { occurrences: [group.latest], links: group.links } });
  };

  const groups = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const minimumTimestamp = Date.now() - (windowHours * 60 * 60 * 1000);
    const source = (state.data?.incidents || []).map(normalizeProjectedIncident).filter(Boolean).filter((group) => (
      timestampMillis(group.lastSeen) >= minimumTimestamp
      && (severity !== 'critical' || severityTone(group.severity) === 'critical')
    ));
    if (!normalized) return source;
    return source.filter((group) => [group.event, group.errorClass, group.service, group.functionName, group.latest?.correlationId, group.latest?.orderId]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(normalized)));
  }, [query, severity, state.data?.incidents, windowHours]);

  const surface = darkMode ? 'border-white/10 bg-[#111214]' : 'border-black/10 bg-[#f5f5f7]';
  const control = darkMode ? 'border-white/10 bg-white/[0.05] text-stone-200' : 'border-black/10 bg-white text-stone-700';

  return (
    <div className="space-y-4" data-system-incidents-console>
      <section className={`overflow-hidden rounded-2xl border ${surface}`}>
        <header className={`flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500"><Cloud size={16} /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Erreurs système</p>
              <p className="truncate text-[10px] text-stone-500">Résumé Firestore en temps réel, données expurgées</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className={`relative flex h-9 min-w-44 items-center rounded-lg border ${control}`}>
              <Search className="ml-2.5 text-stone-500" size={14} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrer les erreurs" className="h-full min-w-0 flex-1 bg-transparent px-2 text-xs outline-none" />
            </label>
            <label className="relative">
              <span className="sr-only">Sévérité</span>
              <select value={severity} onChange={(event) => setSeverity(event.target.value)} className={`h-9 appearance-none rounded-lg border px-3 pr-8 text-xs font-medium outline-none ${control}`}>
                <option value="error">Erreurs</option>
                <option value="critical">Critiques</option>
              </select>
              <Filter className="pointer-events-none absolute right-2.5 top-2.5 text-stone-500" size={13} />
            </label>
            <div className={`flex h-9 rounded-lg border p-0.5 ${control}`}>
              {WINDOWS.map((item) => <button key={item.value} type="button" onClick={() => setWindowHours(item.value)} className={`rounded-md px-2 text-[10px] font-semibold transition-colors ${windowHours === item.value ? (darkMode ? 'bg-white text-black' : 'bg-black text-white') : 'text-stone-500'}`}>{item.label}</button>)}
            </div>
            <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Temps réel</span>
          </div>
        </header>

        <div className="grid min-h-[28rem] xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className={`min-w-0 ${selected ? (darkMode ? 'border-white/10 xl:border-r' : 'border-black/10 xl:border-r') : ''}`}>
            <div className={`grid grid-cols-[5.5rem_minmax(0,1fr)_5rem_1.5rem] gap-3 border-b px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-500 ${darkMode ? 'border-white/[0.07]' : 'border-black/[0.07]'}`}>
              <span>Dernière</span><span>Origine</span><span className="text-right">Nombre</span><span />
            </div>

            {state.status === 'error' && !state.data && <div role="alert" className="p-10 text-center text-sm text-red-500"><AlertCircle className="mx-auto mb-3" size={22} />Données indisponibles. La connexion temps réel sera rétablie automatiquement.</div>}
            {state.status === 'loading' && !state.data && <div className="p-10 text-center text-sm text-stone-500">Connexion au résumé temps réel…</div>}
            {state.status === 'ready' && groups.length === 0 && <div className="p-12 text-center"><Bug className="mx-auto text-emerald-500" size={24} /><p className="mt-3 text-sm font-semibold">Aucune erreur dans cette fenêtre</p><p className="mt-1 text-xs text-stone-500">Les erreurs identiques apparaîtraient sur une seule ligne avec leur compteur.</p></div>}

            <ol className={darkMode ? 'divide-y divide-white/[0.07]' : 'divide-y divide-black/[0.07]'}>
              {groups.map((group) => (
                <li key={group.id}>
                  <button type="button" onClick={() => openDetail(group)} className={`grid w-full grid-cols-[5.5rem_minmax(0,1fr)_5rem_1.5rem] gap-3 px-4 py-3 text-left transition-colors ${selected?.id === group.id ? (darkMode ? 'bg-white/[0.07]' : 'bg-white') : (darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-white/70')}`}>
                    <span className="font-mono text-[10px] tabular-nums text-stone-500">{formatDate(group.lastSeen, false)}</span>
                    <span className="flex min-w-0 items-start gap-3">
                      <SeverityDot severity={group.severity} />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold">{group.event}</span>
                        <span className="mt-1 block truncate font-mono text-[10px] text-stone-500">{group.functionName} · {group.errorClass}</span>
                      </span>
                    </span>
                    <span className="text-right font-mono text-xs font-semibold tabular-nums">{group.count.toLocaleString('fr-FR')}</span>
                    <ChevronRight className="text-stone-500" size={15} />
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {selected ? (
            <div className="p-3">
              <IncidentInspector group={selected} detail={detail.data} darkMode={darkMode} onClose={() => { setSelected(null); setDetail({ data: null }); }} onOpenOrder={onOpenOrder} />
            </div>
          ) : (
            <aside className={`hidden p-8 text-center xl:flex xl:flex-col xl:items-center xl:justify-center ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>
              <TerminalSquare size={26} />
              <p className="mt-3 text-xs font-semibold">Sélectionnez une ligne</p>
              <p className="mt-1 max-w-52 text-[10px] leading-4">Le résumé expurgé s’affiche sans nouvelle lecture de Cloud Logging.</p>
            </aside>
          )}
        </div>
      </section>

      <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[10px] text-stone-500 ${darkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <span className="inline-flex items-center gap-1.5"><Layers3 size={12} /> Déduplication : une ligne par origine technique, compteur d’occurrences conservé.</span>
        <span>{state.data?.incidents?.length ?? 0} erreurs matérialisées · aucun payload brut affiché</span>
      </div>
    </div>
  );
}
