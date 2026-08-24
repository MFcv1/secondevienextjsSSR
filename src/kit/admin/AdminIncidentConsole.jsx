'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { getCallableFunction } from '../config/firebaseLazy';

const SEARCH_TYPES = [
  { value: 'auto', label: 'Détection automatique' },
  { value: 'order', label: 'Commande' },
  { value: 'payment', label: 'Paiement Stripe' },
  { value: 'refund', label: 'Remboursement' },
  { value: 'customer_email', label: 'E-mail client' },
  { value: 'correlation', label: 'Corrélation technique' },
];

const formatDate = (value) => {
  if (!value) return 'Heure inconnue';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Heure inconnue';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
};

const statusTone = (status) => {
  if (['failed', 'dead_letter', 'delivery_unknown', 'blocked', 'open'].includes(status)) return 'danger';
  if (['processing', 'review', 'needs_review', 'pending'].includes(status)) return 'warning';
  if (['succeeded', 'sent', 'safe', 'processed', 'resolved'].includes(status)) return 'success';
  return 'neutral';
};

function StatusPill({ status, children, darkMode }) {
  const tone = statusTone(status);
  const tones = darkMode
    ? {
        danger: 'border-red-400/25 bg-red-400/10 text-red-200',
        warning: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
        success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
        neutral: 'border-white/10 bg-white/5 text-stone-300',
      }
    : {
        danger: 'border-red-200 bg-red-50 text-red-800',
        warning: 'border-amber-200 bg-amber-50 text-amber-800',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        neutral: 'border-stone-200 bg-stone-100 text-stone-700',
      };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

function RecoveryCard({ recovery, darkMode }) {
  const tone = statusTone(recovery?.status);
  const Icon = tone === 'danger' ? ShieldAlert : tone === 'warning' ? AlertTriangle : CheckCircle2;
  return (
    <section className={`rounded-xl border p-4 ${darkMode ? 'border-white/10 bg-white/[0.035]' : 'border-stone-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <Icon className={tone === 'danger' ? 'text-red-500' : tone === 'warning' ? 'text-amber-500' : 'text-emerald-600'} size={20} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black">{recovery?.label || 'État inconnu'}</h3>
            <StatusPill darkMode={darkMode} status={recovery?.status}>{recovery?.status || 'inconnu'}</StatusPill>
          </div>
          <ul className={`mt-2 space-y-1 text-xs leading-5 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
            {(recovery?.reasons || []).map((reason) => <li key={reason}>• {reason}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Timeline({ events, darkMode }) {
  if (!events?.length) {
    return <p className={`py-10 text-center text-sm ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>Aucun événement trouvé.</p>;
  }
  return (
    <ol className="space-y-0" aria-label="Historique de la commande">
      {events.map((event, index) => {
        const danger = event.severity === 'error';
        return (
          <li key={event.id} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3">
            <div className="flex flex-col items-center">
              <CircleDot className={danger ? 'text-red-500' : darkMode ? 'text-stone-500' : 'text-stone-400'} size={16} />
              {index < events.length - 1 && <span className={`my-1 min-h-9 w-px flex-1 ${darkMode ? 'bg-white/10' : 'bg-stone-200'}`} />}
            </div>
            <article className={`mb-3 rounded-xl border p-3.5 ${danger ? (darkMode ? 'border-red-400/20 bg-red-400/[0.06]' : 'border-red-200 bg-red-50/60') : (darkMode ? 'border-white/10 bg-white/[0.025]' : 'border-stone-200 bg-white')}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold">{event.type}</h4>
                  <p className={`mt-1 text-[11px] ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>{event.source}</p>
                </div>
                <StatusPill darkMode={darkMode} status={event.status}>{event.status || 'enregistré'}</StatusPill>
              </div>
              <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                <span className="inline-flex items-center gap-1.5"><Clock3 size={12} />{formatDate(event.at)}</span>
                {event.detail && <span>{event.detail}</span>}
              </div>
              {event.correlationId && (
                <p className={`mt-2 break-all font-mono text-[10px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                  Corrélation : {event.correlationId}
                </p>
              )}
            </article>
          </li>
        );
      })}
    </ol>
  );
}

export default function AdminIncidentConsole({ darkMode = false }) {
  const [kind, setKind] = React.useState('auto');
  const [value, setValue] = React.useState('');
  const [state, setState] = React.useState({ status: 'idle', data: null, error: null });
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const submit = async (event) => {
    event.preventDefault();
    const cleanValue = value.trim();
    if (cleanValue.length < 3) return;
    setState({ status: 'loading', data: null, error: null });
    setSelectedIndex(0);
    try {
      const callable = await getCallableFunction('getDiagnosticTimelineAdmin');
      const response = await callable({ kind, value: cleanValue });
      setState({ status: 'ready', data: response.data, error: null });
    } catch (error) {
      setState({ status: 'error', data: null, error });
    }
  };

  const matches = state.data?.matches || [];
  const selected = matches[selectedIndex] || null;
  const panel = darkMode ? 'border-white/10 bg-[#111111]' : 'border-stone-200 bg-[#f7f5f1]';
  const input = darkMode ? 'border-white/10 bg-white/[0.05] text-white placeholder:text-stone-600' : 'border-stone-300 bg-white text-stone-950 placeholder:text-stone-400';

  return (
    <div className="space-y-5" data-archetype="monitoring-console">
      <header className="max-w-3xl">
        <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Diagnostic sécurisé</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Console incidents</h1>
        <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
          Retrouvez une commande, puis voyez simplement où le parcours s’est arrêté. Chaque consultation est auditée.
        </p>
      </header>

      <form onSubmit={submit} className={`grid gap-2 rounded-xl border p-3 sm:grid-cols-[190px_minmax(0,1fr)_auto] ${panel}`}>
        <label className="relative">
          <span className="sr-only">Type de recherche</span>
          <select value={kind} onChange={(event) => setKind(event.target.value)} className={`h-11 w-full appearance-none rounded-lg border px-3 pr-9 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-400 ${input}`}>
            {SEARCH_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3.5" size={15} />
        </label>
        <label>
          <span className="sr-only">Commande, paiement, remboursement ou client</span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="N° commande, pi_…, re_… ou e-mail client"
            className={`h-11 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 ${input}`}
          />
        </label>
        <button disabled={state.status === 'loading' || value.trim().length < 3} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-stone-950" type="submit">
          <Search size={15} />
          {state.status === 'loading' ? 'Recherche…' : 'Rechercher'}
        </button>
      </form>

      {state.status === 'error' && (
        <div role="alert" className={`rounded-xl border p-4 text-sm ${darkMode ? 'border-red-400/20 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-800'}`}>
          La recherche a échoué. Vérifiez l’identifiant ou réessayez dans quelques instants.
        </div>
      )}

      {state.status === 'ready' && matches.length === 0 && (
        <div className={`rounded-xl border p-10 text-center ${panel}`}>
          <Search className="mx-auto text-stone-400" size={24} />
          <p className="mt-3 text-sm font-bold">Aucune commande trouvée</p>
          <p className={`mt-1 text-xs ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>Aucune donnée sensible n’a été affichée.</p>
        </div>
      )}

      {selected && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className={`rounded-xl border p-4 sm:p-5 ${panel}`}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`font-mono text-[10px] uppercase tracking-[0.12em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{selected.order.id}</p>
                <h2 className="mt-1 text-xl font-black">Historique technique et métier</h2>
              </div>
              <StatusPill darkMode={darkMode} status={selected.order.status}>{selected.order.status}</StatusPill>
            </div>
            <Timeline darkMode={darkMode} events={selected.timeline} />
            {selected.truncated && <p className="mt-4 text-xs font-bold text-amber-600">Historique limité aux 100 événements les plus récents.</p>}
          </section>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            {matches.length > 1 && (
              <section className={`rounded-xl border p-4 ${panel}`}>
                <p className="text-xs font-black uppercase tracking-[0.12em]">Commandes trouvées</p>
                <div className="mt-3 space-y-1">
                  {matches.map((match, index) => (
                    <button key={match.order.id} onClick={() => setSelectedIndex(index)} type="button" className={`w-full rounded-lg border px-3 py-2 text-left font-mono text-xs ${index === selectedIndex ? 'border-stone-950 bg-stone-950 text-white dark:border-white dark:bg-white dark:text-stone-950' : input}`}>
                      {match.order.id}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <RecoveryCard darkMode={darkMode} recovery={selected.recovery} />
            <section className={`rounded-xl border p-4 ${panel}`}>
              <h3 className="text-xs font-black uppercase tracking-[0.12em]">État actuel</h3>
              <dl className={`mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-xs ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                <dt>Commande</dt><dd className="font-bold text-current">{selected.order.status || '—'}</dd>
                <dt>Paiement</dt><dd className="font-bold text-current">{selected.order.paymentStatus || '—'}</dd>
                <dt>Livraison</dt><dd className="font-bold text-current">{selected.order.fulfillmentStatus || '—'}</dd>
                <dt>Remboursement</dt><dd className="font-bold text-current">{selected.order.refundStatus || '—'}</dd>
                <dt>Version</dt><dd className="font-mono">{selected.order.stateVersion ?? '—'}</dd>
              </dl>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
