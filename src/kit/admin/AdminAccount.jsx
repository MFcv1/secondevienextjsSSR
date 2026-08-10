'use client';

import React, { Suspense } from 'react';
import { BadgeCheck } from 'lucide-react';
import { adminSurfaces, LoadingPanel, PageHeader, Panel, StatusDot } from './adminUiKit';

const BillingOnboardingOperator = React.lazy(() => import('./BillingOnboardingOperator'));

function DetailRow({ label, value, darkMode }) {
  const surfaces = adminSurfaces(darkMode);
  return (
    <div className={`flex flex-col gap-1 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between ${surfaces.divider}`}>
      <dt className={`text-xs font-semibold ${surfaces.muted}`}>{label}</dt>
      <dd className="break-all text-sm font-bold sm:text-right">{value}</dd>
    </div>
  );
}

export default function AdminAccount({ darkMode, isSuperAdmin, user }) {
  const displayName = user?.displayName || 'Compte administrateur';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'A';
  const surfaces = adminSurfaces(darkMode);

  return (
    <div className="space-y-5">
      <PageHeader
        darkMode={darkMode}
        description="Identité de connexion et paramètres de facturation de la boutique."
        title="Mon compte"
        badge={(
          <StatusDot
            darkMode={darkMode}
            label={isSuperAdmin ? 'Super-administrateur' : 'Administrateur'}
            tone={isSuperAdmin ? 'emerald' : 'stone'}
          />
        )}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)] xl:items-start">
        <Panel darkMode={darkMode} title="Identité">
          <div className="flex items-center gap-3">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-base font-black ${darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white'}`}>
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-tight">{displayName}</p>
              <p className={`mt-0.5 truncate text-xs ${surfaces.muted}`}>{user?.email || 'Adresse non renseignée'}</p>
            </div>
          </div>

          <dl className="mt-5">
            <DetailRow darkMode={darkMode} label="Adresse de connexion" value={user?.email || 'Non renseignée'} />
            <DetailRow darkMode={darkMode} label="Rôle" value={isSuperAdmin ? 'Super-administrateur' : 'Administrateur'} />
            <DetailRow darkMode={darkMode} label="Sécurité" value="Authentification forte confirmée" />
          </dl>

          <div className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${darkMode ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
            <BadgeCheck className="mt-0.5 shrink-0" size={16} />
            <p className="text-xs font-semibold leading-5">
              Session administrateur vérifiée sur cet appareil.
            </p>
          </div>
        </Panel>

        <Suspense fallback={<LoadingPanel darkMode={darkMode} label="Chargement de la facturation…" />}>
          <BillingOnboardingOperator darkMode={darkMode} />
        </Suspense>
      </div>
    </div>
  );
}
