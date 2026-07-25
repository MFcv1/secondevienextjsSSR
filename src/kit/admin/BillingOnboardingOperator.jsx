'use client';

import React from 'react';
import { Check, Clipboard, Loader2, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
import { getCallableFunction } from '../config/firebaseLazy';

const COMPLETE_CONFIRMATION = 'VALIDER LA FACTURATION';
const RESET_CONFIRMATION = 'REINITIALISER LE TEST';

export default function BillingOnboardingOperator({ darkMode }) {
  const [status, setStatus] = React.useState({ phase: 'loading', mode: null, journey: null });
  const [busyKey, setBusyKey] = React.useState('');
  const [copied, setCopied] = React.useState('');
  const [error, setError] = React.useState('');

  const loadStatus = React.useCallback(async () => {
    setError('');
    setStatus((current) => ({ ...current, phase: 'loading' }));
    try {
      const getStatus = await getCallableFunction('getBillingGuideOperatorStatus');
      const result = await getStatus({});
      setStatus({ phase: 'ready', ...result.data });
    } catch {
      setStatus({ phase: 'error', mode: null, journey: null });
      setError('L’état serveur de l’onboarding n’est pas encore disponible. Le guide reste sans effet.');
    }
  }, []);

  React.useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const copyBillingId = async (item) => {
    try {
      await navigator.clipboard.writeText(item.billingAccountId);
      setCopied(item.uid);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setError('La copie automatique n’est pas disponible.');
    }
  };

  const complete = async (item) => {
    const confirmation = window.prompt(
      `Après avoir rattaché les projets et vérifié les budgets, saisissez exactement : ${COMPLETE_CONFIRMATION}`
    );
    if (confirmation === null) return;
    setBusyKey(`complete:${item.uid}`);
    setError('');
    try {
      const completeGuide = await getCallableFunction('completeBillingGuideAdmin');
      await completeGuide({ targetUid: item.uid, confirmText: confirmation });
      await loadStatus();
    } catch {
      setError('La validation n’a pas abouti. Vérifiez la session et la configuration serveur.');
    } finally {
      setBusyKey('');
    }
  };

  const reset = async (item) => {
    const confirmation = window.prompt(
      `Pour recommencer le parcours avec ce compte test, saisissez exactement : ${RESET_CONFIRMATION}`
    );
    if (confirmation === null) return;
    setBusyKey(`reset:${item.uid}`);
    setError('');
    try {
      const resetGuide = await getCallableFunction('resetBillingGuideTest');
      await resetGuide({ targetUid: item.uid, confirmText: confirmation });
      await loadStatus();
    } catch {
      setError('La réinitialisation n’a pas abouti. Vérifiez la session et le mode test.');
    } finally {
      setBusyKey('');
    }
  };

  const panelClass = darkMode
    ? 'border-white/10 bg-white/[0.035] text-white'
    : 'border-stone-200 bg-white text-stone-950';
  const subtleClass = darkMode ? 'text-stone-400' : 'text-stone-500';
  const journey = status.journey;
  const journeyLabel = journey?.status === 'waiting_for_operator'
    ? 'Le compte test attend votre validation technique.'
    : journey?.status === 'completed'
      ? 'Le parcours est validé. Vous pouvez le réinitialiser pour une nouvelle série de captures.'
      : journey
        ? 'Le compte cible a commencé le parcours.'
        : 'Le compte cible n’a pas encore commencé le parcours.';
  const modeLabel = status.phase === 'error'
    ? 'Non raccordé'
    : status.mode === 'disabled'
      ? 'Désactivé'
      : status.mode || 'Chargement';

  return (
    <section className={`rounded-2xl border p-6 ${panelClass}`} aria-labelledby="billing-operator-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${darkMode ? 'bg-white/10' : 'bg-stone-100'}`}>
            <ShieldCheck size={19} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black" id="billing-operator-title">Onboarding facturation</h3>
              <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
                ['test', 'live'].includes(status.mode)
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : darkMode
                    ? 'border-white/15 bg-white/5 text-stone-300'
                    : 'border-stone-300 bg-stone-50 text-stone-600'
              }`}>
                {modeLabel}
              </span>
            </div>
            <p className={`mt-2 max-w-xl text-sm leading-6 ${subtleClass}`}>
              {status.phase === 'loading'
                ? 'Vérification de la configuration serveur…'
                : status.phase === 'error'
                  ? 'Aucun parcours client n’est activé depuis cette interface.'
                  : status.mode === 'disabled'
                    ? 'Le guide est désactivé. Aucun compte client n’est bloqué.'
                    : journeyLabel}
            </p>
          </div>
        </div>
        <button
          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 text-xs font-bold disabled:cursor-wait disabled:opacity-60 ${darkMode ? 'border-white/15 hover:border-white/40' : 'border-stone-300 hover:border-stone-950'}`}
          disabled={status.phase === 'loading'}
          onClick={loadStatus}
          type="button"
        >
          <RefreshCw className={status.phase === 'loading' ? 'animate-spin' : ''} size={13} />
          Actualiser
        </button>
      </div>

      {journey && (
        <article className={`mt-5 rounded-xl border p-4 ${darkMode ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-stone-50'}`}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{journey.email || journey.uid}</p>
              <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.12em] ${subtleClass}`}>
                {journey.status === 'waiting_for_operator'
                  ? 'En attente'
                  : journey.status === 'completed'
                    ? 'Validé'
                    : 'En cours'}
              </p>
              {journey.billingAccountId && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className={`text-xs font-bold ${subtleClass}`}>{journey.billingAccountId}</code>
                  <button
                    aria-label="Copier l’identifiant de facturation"
                    className={`grid h-8 w-8 place-items-center rounded-full border ${darkMode ? 'border-white/15' : 'border-stone-300 bg-white'}`}
                    onClick={() => copyBillingId(journey)}
                    type="button"
                  >
                    {copied === journey.uid ? <Check size={13} /> : <Clipboard size={13} />}
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {status.mode === 'test' && (
                <button
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 text-xs font-bold ${darkMode ? 'border-white/15' : 'border-stone-300 bg-white'}`}
                  disabled={Boolean(busyKey)}
                  onClick={() => reset(journey)}
                  type="button"
                >
                  {busyKey === `reset:${journey.uid}` ? <Loader2 className="animate-spin" size={13} /> : <RotateCcw size={13} />}
                  Recommencer
                </button>
              )}
              {journey.status === 'waiting_for_operator' && (
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-stone-950 px-4 text-xs font-bold text-white disabled:opacity-60 dark:bg-white dark:text-stone-950"
                  disabled={Boolean(busyKey)}
                  onClick={() => complete(journey)}
                  type="button"
                >
                  {busyKey === `complete:${journey.uid}` ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />}
                  Valider la configuration
                </button>
              )}
            </div>
          </div>
        </article>
      )}

      {error && (
        <p className={`mt-4 rounded-xl border px-4 py-3 text-xs font-semibold ${
          darkMode
            ? 'border-amber-300/15 bg-amber-300/10 text-amber-200'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`} role="status">
          {error}
        </p>
      )}
    </section>
  );
}
