import React from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, Wrench } from 'lucide-react';

const STATUS_STYLES = {
  OK: {
    label: 'OK',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200',
  },
  update_recommended: {
    label: 'Update recommande',
    icon: Wrench,
    className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200',
  },
  vulnerability_detected: {
    label: 'Vulnerabilite detectee',
    icon: ShieldAlert,
    className: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200',
  },
};

function formatDate(value) {
  if (!value) return 'Audit non genere';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function VersionRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-200/70 py-3 text-sm last:border-0 dark:border-white/10">
      <span className="font-bold text-stone-500 dark:text-stone-400">{label}</span>
      <span className="font-mono text-xs font-black text-stone-900 dark:text-white">
        {value?.installed || value?.declared || 'n/a'}
        {value?.declared && value?.installed && value.declared !== value.installed ? (
          <span className="ml-2 text-stone-400">({value.declared})</span>
        ) : null}
      </span>
    </div>
  );
}

const AdminMaintenance = ({ darkMode }) => {
  const [report, setReport] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;

    fetch('/maintenance/audit.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (!cancelled) setReport(payload);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const status = STATUS_STYLES[report?.status] || STATUS_STYLES.update_recommended;
  const StatusIcon = status.icon;
  const counts = report?.audit?.counts || {};
  const vulnerabilities = report?.audit?.vulnerabilities || [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Maintenance</p>
          <h3 className="text-3xl font-black tracking-tighter md:text-4xl">Dependances & securite</h3>
          <p className={`max-w-2xl text-sm leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
            Etat genere localement par <code className="font-mono text-xs">npm run maintenance:audit</code>. Le navigateur lit uniquement le rapport JSON publie.
          </p>
        </div>
        <div className={`rounded-full border px-5 py-3 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'border-white/10 text-stone-300' : 'border-stone-200 text-stone-600'}`}>
          Procedure: _DOCS/maintenance-next.md
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          <AlertTriangle size={18} />
          Rapport maintenance indisponible: {error}
        </div>
      ) : null}

      <div className={`rounded-[2rem] border p-6 ${status.className}`}>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <StatusIcon size={28} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em]">Statut</p>
              <p className="text-2xl font-black tracking-tight">{report?.statusLabel || status.label}</p>
            </div>
          </div>
          <div className="text-left text-xs font-bold uppercase tracking-widest md:text-right">
            Dernier audit<br />
            <span className="font-mono normal-case tracking-normal">{formatDate(report?.generatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className={`rounded-[2rem] border p-6 ${darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-white'}`}>
          <h4 className="mb-4 text-sm font-black uppercase tracking-[0.2em]">Versions</h4>
          <VersionRow label="Next" value={report?.versions?.next} />
          <VersionRow label="React" value={report?.versions?.react} />
          <VersionRow label="React DOM" value={report?.versions?.reactDom} />
          <VersionRow label="Firebase client" value={report?.versions?.firebaseClient} />
          <VersionRow label="Firebase Admin root" value={report?.versions?.firebaseAdminRoot} />
          <VersionRow label="Firebase Admin functions" value={report?.versions?.firebaseAdminFunctions} />
          <VersionRow label="Firebase Functions" value={report?.versions?.firebaseFunctions} />
        </div>

        <div className={`rounded-[2rem] border p-6 ${darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-white'}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-sm font-black uppercase tracking-[0.2em]">npm audit</h4>
            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-white/10 text-stone-300' : 'bg-stone-100 text-stone-600'}`}>
              {report?.audit?.command || 'npm audit --omit=dev'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {['low', 'moderate', 'high', 'critical', 'total'].map((key) => (
              <div key={key} className={`rounded-2xl p-4 ${darkMode ? 'bg-black/20' : 'bg-stone-50'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">{key}</p>
                <p className="text-2xl font-black">{counts[key] ?? 0}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {vulnerabilities.length > 0 ? vulnerabilities.map((item) => (
              <div key={item.name} className={`rounded-2xl border p-4 text-sm ${darkMode ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-stone-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black">{item.name}</span>
                  <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-red-700 dark:bg-red-500/10 dark:text-red-200">{item.severity}</span>
                </div>
                {item.via?.length ? (
                  <p className={`mt-2 text-xs leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>{item.via.join(' / ')}</p>
                ) : null}
              </div>
            )) : (
              <div className={`flex items-center gap-3 rounded-2xl p-4 text-sm font-bold ${darkMode ? 'bg-black/20 text-stone-300' : 'bg-stone-50 text-stone-600'}`}>
                <CheckCircle2 size={18} />
                Aucune vulnerabilite de production detectee dans le dernier rapport.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`rounded-[2rem] border p-6 ${darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-white'}`}>
        <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em]">
          <RefreshCw size={16} /> Procedure courte
        </h4>
        <div className={`grid gap-3 text-sm ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
          <p>Audit local: <code className="font-mono text-xs">npm run maintenance:audit</code></p>
          <p>Mise a jour ciblee: <code className="font-mono text-xs">{report?.procedure?.updateCommand || 'npm update next react react-dom firebase firebase-admin'}</code></p>
          <p>Regle securite: {report?.procedure?.securityRule || 'patcher Next rapidement en cas d advisory securite'}.</p>
        </div>
      </div>
    </section>
  );
};

export default AdminMaintenance;
