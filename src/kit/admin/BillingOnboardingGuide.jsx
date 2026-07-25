'use client';

import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { getCallableFunction } from '../config/firebaseLazy';

const GOOGLE_BILLING_CREATE_URL = 'https://console.cloud.google.com/billing/create';
const GOOGLE_BILLING_HOME_URL = 'https://console.cloud.google.com/billing';

const STEPS = [
  {
    id: 'welcome',
    eyebrow: 'Bienvenue',
    title: 'Préparons la facturation Google',
    shortLabel: 'Accueil',
  },
  {
    id: 'google_billing',
    eyebrow: 'Étape 1',
    title: 'Créez votre compte de facturation',
    shortLabel: 'Compte Google',
  },
  {
    id: 'billing_id',
    eyebrow: 'Étape 2',
    title: 'Indiquez son identifiant',
    shortLabel: 'Identifiant',
  },
  {
    id: 'technical_access',
    eyebrow: 'Étape 3',
    title: 'Autorisez la mise en place technique',
    shortLabel: 'Autorisation',
  },
  {
    id: 'waiting_for_operator',
    eyebrow: 'Terminé pour vous',
    title: 'Nous prenons le relais',
    shortLabel: 'Validation',
  },
];

const getInitialConfirmations = (state) => ({
  billingCreated: state?.confirmations?.billingCreated === true,
  billingIdConfirmed: state?.confirmations?.billingIdConfirmed === true,
  technicalAccessGranted: state?.confirmations?.technicalAccessGranted === true,
});

function ScreenshotPlaceholder({ label }) {
  return (
    <div className="mt-7 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50">
      <div className="flex h-full min-h-52 flex-col items-center justify-center px-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-stone-200 bg-white text-stone-500">
          <Camera size={20} strokeWidth={1.7} />
        </span>
        <p className="mt-4 text-sm font-bold text-stone-800">{label}</p>
        <p className="mt-1 max-w-md text-xs leading-5 text-stone-500">
          Cette zone recevra la capture réalisée pendant ton parcours test.
        </p>
      </div>
    </div>
  );
}

function CheckRow({ checked, children, onChange }) {
  return (
    <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
      <input
        checked={checked}
        className="mt-0.5 h-4 w-4 accent-stone-950"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="text-sm font-semibold leading-6 text-stone-700">{children}</span>
    </label>
  );
}

function StepProgress({ currentIndex }) {
  return (
    <>
      <div className="flex items-center gap-2 lg:hidden" aria-label={`Étape ${currentIndex + 1} sur ${STEPS.length}`}>
        {STEPS.map((step, index) => (
          <span
            aria-hidden="true"
            className={`h-1.5 flex-1 rounded-full ${index <= currentIndex ? 'bg-stone-950' : 'bg-stone-200'}`}
            key={step.id}
          />
        ))}
      </div>
      <ol className="hidden space-y-1 lg:block">
        {STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isDone = index < currentIndex;
          return (
            <li className="relative" key={step.id}>
              <div className={`flex items-center gap-3 rounded-xl px-3 py-3 ${isCurrent ? 'bg-white' : ''}`}>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-black ${
                    isDone
                      ? 'border-stone-950 bg-stone-950 text-white'
                      : isCurrent
                        ? 'border-stone-950 bg-white text-stone-950'
                        : 'border-stone-300 text-stone-400'
                  }`}
                >
                  {isDone ? <Check size={14} strokeWidth={2.5} /> : index + 1}
                </span>
                <span className={`text-xs font-bold ${isCurrent ? 'text-stone-950' : 'text-stone-500'}`}>
                  {step.shortLabel}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

async function copyText(value) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
}

export default function BillingOnboardingGuide({ initialStatus, onRefresh, onStatusChange }) {
  const initialState = initialStatus?.state || {};
  const [currentStepId, setCurrentStepId] = React.useState(
    initialState.status === 'waiting_for_operator'
      ? 'waiting_for_operator'
      : initialState.currentStepId || 'welcome'
  );
  const [billingAccountId, setBillingAccountId] = React.useState(initialState.billingAccountId || '');
  const [confirmations, setConfirmations] = React.useState(() => getInitialConfirmations(initialState));
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState('');

  const currentIndex = Math.max(0, STEPS.findIndex((step) => step.id === currentStepId));
  const technicalEmail = initialStatus?.technicalEmail || '';

  const setConfirmation = (key, checked) => {
    setConfirmations((current) => ({ ...current, [key]: checked }));
    setError('');
  };

  const persistStep = async (stepId) => {
    setSaving(true);
    setError('');
    try {
      const saveProgress = await getCallableFunction('saveBillingGuideProgress');
      const result = await saveProgress({
        stepId,
        billingAccountId,
        confirmations,
      });
      const nextStatus = {
        ...initialStatus,
        required: true,
        state: result.data.state,
      };
      onStatusChange(nextStatus);
      setCurrentStepId(result.data.state.currentStepId);
      setBillingAccountId(result.data.state.billingAccountId || '');
      setConfirmations(getInitialConfirmations(result.data.state));
    } catch (saveError) {
      setError(saveError?.message || 'Impossible d’enregistrer cette étape pour le moment.');
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (currentStepId === 'google_billing' && !confirmations.billingCreated) {
      setError('Cochez la confirmation après avoir créé le compte chez Google.');
      return;
    }
    if (currentStepId === 'billing_id') {
      const normalizedId = billingAccountId.trim().toUpperCase();
      if (!/^[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$/.test(normalizedId)) {
        setError('L’identifiant attendu ressemble à AAAAAA-BBBBBB-CCCCCC.');
        return;
      }
      if (!confirmations.billingIdConfirmed) {
        setError('Confirmez que cet identifiant correspond bien au compte créé.');
        return;
      }
      setBillingAccountId(normalizedId);
    }
    if (currentStepId === 'technical_access' && !confirmations.technicalAccessGranted) {
      setError('Confirmez l’autorisation avant de nous laisser prendre le relais.');
      return;
    }
    const nextStep = STEPS[Math.min(currentIndex + 1, STEPS.length - 1)];
    await persistStep(nextStep.id);
  };

  const goBack = async () => {
    if (currentIndex <= 0 || saving) return;
    await persistStep(STEPS[currentIndex - 1].id);
  };

  const handleCopy = async (key, value) => {
    try {
      await copyText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setError('La copie automatique n’est pas disponible. Sélectionnez le texte manuellement.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      await onRefresh();
    } catch {
      setError('La vérification n’est pas disponible pour le moment.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] px-4 py-5 text-stone-950 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">Seconde Vie</p>
            <p className="mt-1 text-sm font-bold">Mise en route</p>
          </div>
          {initialStatus?.mode === 'test' && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-800">
              Parcours test
            </span>
          )}
        </header>

        <div className="grid overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-[0_18px_55px_rgba(28,25,23,0.07)] lg:grid-cols-[15.5rem_minmax(0,1fr)]">
          <aside className="border-b border-stone-200 bg-[#eeece7] p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <StepProgress currentIndex={currentIndex} />
            <div className="mt-6 hidden border-t border-stone-300 pt-6 lg:block">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 shrink-0 text-stone-600" size={17} strokeWidth={1.8} />
                <p className="text-xs leading-5 text-stone-600">
                  Votre carte est saisie uniquement sur le site sécurisé de Google.
                </p>
              </div>
            </div>
          </aside>

          <main className="flex min-h-[38rem] flex-col p-5 sm:p-8 lg:p-12">
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.23em] text-stone-500">
                  {STEPS[currentIndex].eyebrow}
                </p>
                <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                  {STEPS[currentIndex].title}
                </h1>
              </div>

              {currentStepId === 'welcome' && (
                <div className="mt-8">
                  <p className="max-w-2xl text-base leading-7 text-stone-600">
                    Ce guide vous accompagne pas à pas. Vous créez votre compte de facturation directement chez
                    Google, puis nous nous occupons de la configuration technique de la boutique.
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {[
                      [Building2, 'Un compte Google', 'Un compte professionnel ou personnel vous appartenant.'],
                      [CreditCardIcon, 'Votre moyen de paiement', 'Il reste exclusivement enregistré chez Google.'],
                      [KeyRound, 'Une autorisation', 'Une seule action pour nous laisser terminer la mise en place.'],
                    ].map(([Icon, title, body]) => (
                      <div className="border-t border-stone-200 pt-4" key={title}>
                        <Icon size={19} strokeWidth={1.7} />
                        <p className="mt-3 text-sm font-bold">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-stone-500">{body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-9 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                    <ShieldCheck className="mt-0.5 shrink-0" size={18} />
                    <p className="text-sm leading-6">
                      Seconde Vie ne reçoit ni votre numéro de carte, ni vos informations bancaires.
                    </p>
                  </div>
                </div>
              )}

              {currentStepId === 'google_billing' && (
                <div className="mt-8">
                  <p className="max-w-2xl text-sm leading-6 text-stone-600">
                    Ouvrez la page officielle Google, connectez-vous avec le compte choisi, puis renseignez le profil
                    de l’entreprise et le moyen de paiement demandé par Google.
                  </p>
                  <a
                    className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-stone-950 px-5 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-stone-800"
                    href={GOOGLE_BILLING_CREATE_URL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ouvrir Google Billing
                    <ExternalLink size={14} />
                  </a>
                  <ScreenshotPlaceholder label="Capture 01 · Création du compte Google Billing" />
                  <CheckRow
                    checked={confirmations.billingCreated}
                    onChange={(checked) => setConfirmation('billingCreated', checked)}
                  >
                    J’ai terminé la création du compte de facturation chez Google.
                  </CheckRow>
                </div>
              )}

              {currentStepId === 'billing_id' && (
                <div className="mt-8">
                  <p className="max-w-2xl text-sm leading-6 text-stone-600">
                    Google affiche un identifiant composé de trois groupes. Il nous permet de reconnaître le bon compte,
                    sans donner accès à votre carte.
                  </p>
                  <ScreenshotPlaceholder label="Capture 02 · Emplacement de l’identifiant de facturation" />
                  <label className="mt-7 block">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-stone-600">
                      Identifiant de facturation
                    </span>
                    <input
                      autoComplete="off"
                      className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 font-mono text-sm font-bold uppercase tracking-[0.08em] outline-none transition focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
                      maxLength={20}
                      onChange={(event) => {
                        setBillingAccountId(event.target.value.toUpperCase());
                        setError('');
                      }}
                      placeholder="AAAAAA-BBBBBB-CCCCCC"
                      spellCheck="false"
                      value={billingAccountId}
                    />
                  </label>
                  <CheckRow
                    checked={confirmations.billingIdConfirmed}
                    onChange={(checked) => setConfirmation('billingIdConfirmed', checked)}
                  >
                    J’ai vérifié que cet identifiant appartient au compte que je viens de créer.
                  </CheckRow>
                </div>
              )}

              {currentStepId === 'technical_access' && (
                <div className="mt-8">
                  <p className="max-w-2xl text-sm leading-6 text-stone-600">
                    Dans Google Billing, ajoutez l’adresse ci-dessous avec les deux rôles indiqués. Cette autorisation
                    nous permet de rattacher la boutique et de suivre ses coûts ; elle ne donne pas accès à votre carte.
                  </p>
                  <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                      Adresse à ajouter
                    </p>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <code className="break-all text-sm font-bold text-stone-900">
                        {technicalEmail || 'Adresse technique à configurer'}
                      </code>
                      <button
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 text-xs font-bold hover:border-stone-950"
                        disabled={!technicalEmail}
                        onClick={() => handleCopy('email', technicalEmail)}
                        type="button"
                      >
                        {copied === 'email' ? <Check size={14} /> : <Clipboard size={14} />}
                        {copied === 'email' ? 'Copié' : 'Copier'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 border-l-2 border-stone-950 pl-4">
                    <p className="text-sm font-bold">Rôles à sélectionner</p>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-stone-600">
                      <li>
                        Billing Account User <code className="text-xs">(roles/billing.user)</code>
                      </li>
                      <li>
                        Billing Account Costs Manager <code className="text-xs">(roles/billing.costsManager)</code>
                      </li>
                    </ul>
                  </div>
                  <a
                    className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 text-xs font-black uppercase tracking-[0.12em] transition hover:border-stone-950"
                    href={GOOGLE_BILLING_HOME_URL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Retourner dans Google Billing
                    <ExternalLink size={14} />
                  </a>
                  <ScreenshotPlaceholder label="Capture 03 · Ajout de l’adresse et des deux rôles" />
                  <CheckRow
                    checked={confirmations.technicalAccessGranted}
                    onChange={(checked) => setConfirmation('technicalAccessGranted', checked)}
                  >
                    J’ai ajouté cette adresse avec les deux rôles indiqués.
                  </CheckRow>
                </div>
              )}

              {currentStepId === 'waiting_for_operator' && (
                <div className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={30} strokeWidth={1.8} />
                  </span>
                  <p className="mt-6 max-w-xl text-base leading-7 text-stone-600">
                    Vous avez terminé. Nous allons maintenant rattacher les environnements de la boutique, préparer le
                    suivi des coûts et vérifier l’ensemble. Vous n’avez rien d’autre à faire.
                  </p>
                  <div className="mt-7 rounded-xl border border-stone-200 bg-stone-50 px-5 py-4">
                    <p className="text-xs text-stone-500">Compte de facturation transmis</p>
                    <p className="mt-1 font-mono text-sm font-bold">{billingAccountId}</p>
                  </div>
                  <button
                    className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-stone-300 px-5 text-xs font-black uppercase tracking-[0.12em] hover:border-stone-950 disabled:opacity-60"
                    disabled={refreshing}
                    onClick={handleRefresh}
                    type="button"
                  >
                    <RefreshCw className={refreshing ? 'animate-spin' : ''} size={14} />
                    Vérifier la validation
                  </button>
                </div>
              )}

              {error && (
                <p aria-live="polite" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                  {error}
                </p>
              )}

              {currentStepId !== 'waiting_for_operator' && (
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-200 pt-7">
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-xs font-black uppercase tracking-[0.12em] text-stone-500 hover:text-stone-950 disabled:invisible"
                    disabled={currentIndex === 0 || saving}
                    onClick={goBack}
                    type="button"
                  >
                    <ArrowLeft size={15} />
                    Retour
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-stone-950 px-6 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60"
                    disabled={saving}
                    onClick={goNext}
                    type="button"
                  >
                    {saving ? <Loader2 className="animate-spin" size={15} /> : null}
                    {currentStepId === 'technical_access' ? 'J’ai terminé' : 'Continuer'}
                    {!saving && <ArrowRight size={15} />}
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
        <p className="mt-4 text-center text-[11px] leading-5 text-stone-500">
          Le paiement est géré par Google. Seconde Vie n’enregistre aucune donnée bancaire.
        </p>
      </div>
    </div>
  );
}

function CreditCardIcon(props) {
  return (
    <svg aria-hidden="true" fill="none" height="19" viewBox="0 0 24 24" width="19" {...props}>
      <rect height="14" rx="2" stroke="currentColor" strokeWidth="1.7" width="20" x="2" y="5" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
