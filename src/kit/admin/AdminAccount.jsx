'use client';

import React, { Suspense } from 'react';
import { BadgeCheck, ShieldCheck } from 'lucide-react';

const BillingOnboardingOperator = React.lazy(() => import('./BillingOnboardingOperator'));

function DetailRow({ label, value, darkMode }) {
  return (
    <div className={`flex flex-col gap-1 border-t py-4 sm:flex-row sm:items-center sm:justify-between ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
      <dt className={`text-xs font-semibold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{label}</dt>
      <dd className="break-all text-sm font-bold">{value}</dd>
    </div>
  );
}

export default function AdminAccount({ darkMode, isSuperAdmin, user }) {
  const displayName = user?.displayName || 'Compte administrateur';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'A';
  const panelClass = darkMode
    ? 'border-white/10 bg-white/[0.035] text-white'
    : 'border-stone-200 bg-white text-stone-950';

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)]">
      <section className={`rounded-2xl border p-6 ${panelClass}`} aria-labelledby="admin-account-profile-title">
        <div className="flex items-center gap-4">
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-black ${darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white'}`}>
            {initial}
          </span>
          <div className="min-w-0">
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              Identité
            </p>
            <h3 className="mt-1 truncate text-xl font-black tracking-tight" id="admin-account-profile-title">
              {displayName}
            </h3>
          </div>
        </div>

        <dl className="mt-6">
          <DetailRow darkMode={darkMode} label="Adresse de connexion" value={user?.email || 'Non renseignée'} />
          <DetailRow darkMode={darkMode} label="Rôle" value={isSuperAdmin ? 'Super-administrateur' : 'Administrateur'} />
          <DetailRow darkMode={darkMode} label="Sécurité" value="Authentification forte confirmée" />
        </dl>

        <div className={`mt-2 flex items-start gap-3 rounded-xl border p-4 ${darkMode ? 'border-emerald-300/15 bg-emerald-300/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
          <BadgeCheck className="mt-0.5 shrink-0" size={18} />
          <p className="text-xs leading-5">
            Ce compte dispose d’une session administrateur vérifiée.
          </p>
        </div>
      </section>

      <div>
        {isSuperAdmin ? (
          <Suspense
            fallback={(
              <div className={`flex min-h-40 items-center justify-center rounded-2xl border ${panelClass}`}>
                <span className={`text-xs font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                  Chargement de l’onboarding…
                </span>
              </div>
            )}
          >
            <BillingOnboardingOperator darkMode={darkMode} />
          </Suspense>
        ) : (
          <section className={`rounded-2xl border p-6 ${panelClass}`} aria-labelledby="admin-account-onboarding-title">
            <span className={`grid h-11 w-11 place-items-center rounded-full ${darkMode ? 'bg-white/10' : 'bg-stone-100'}`}>
              <ShieldCheck size={19} />
            </span>
            <h3 className="mt-5 text-lg font-black" id="admin-account-onboarding-title">
              Onboarding facturation
            </h3>
            <p className={`mt-2 max-w-xl text-sm leading-6 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              Si une mise en route est nécessaire pour ce compte, le guide s’ouvre automatiquement avant le
              back-office. Une fois validé, cet onglet reste votre espace de compte habituel.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
