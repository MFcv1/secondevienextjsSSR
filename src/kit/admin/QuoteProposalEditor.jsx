'use client';

import { useRef, useState } from 'react';
import { ChevronDown, FileText, LoaderCircle, Pencil, Plus, X } from 'lucide-react';
import { euroRange } from './quotePresentation';
import { quoteServices } from '../shared/quoteServices';

export default function QuoteProposalEditor({ detail, proposal, onChange, onAction, dirty, saving, field }) {
  const dialog = useRef(null);
  const servicePicker = useRef(null);
  const [confirmation, setConfirmation] = useState(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [pending, setPending] = useState(null);
  const pendingRef = useRef(false);
  const delivery = detail.proposalEmail?.status;
  const blocked = saving || Boolean(detail.deletedAt) || ['sending', 'delivery_unknown'].includes(delivery);
  const requested = detail.project?.services || [];
  const value = proposal || { lines: [], validDays: 30, message: '' };
  const set = (patch) => onChange({ ...value, ...patch });
  const total = value.lines.reduce((sum, line) => ({
    minCents: sum.minCents + (Number(line.minCents) || 0),
    maxCents: sum.maxCents + (Number(line.maxCents) || 0),
  }), { minCents: 0, maxCents: 0 });
  const valid = value.lines.length > 0 && total.maxCents > 0 && total.maxCents <= 10_000_000
    && Number.isInteger(value.validDays) && value.validDays >= 1 && value.validDays <= 90
    && value.lines.every(line => line.label.trim() && Number.isSafeInteger(line.minCents)
      && line.minCents >= 0 && line.minCents === line.maxCents);
  const alreadySent = delivery === 'sent' && JSON.stringify(proposal) === JSON.stringify(detail.proposalEmail.proposal);
  const available = quoteServices.filter(service => !value.lines.some(line => line.label === service.label));
  const changeLine = (index, cents) => set({
    lines: value.lines.map((line, i) => i === index ? { ...line, minCents: cents, maxCents: cents } : line),
  });
  const startEditing = () => {
    if (!proposal) onChange({
      lines: requested.map(({ label, minCents, maxCents }) => ({ label, minCents, maxCents })),
      validDays: 30,
      message: '',
    });
    setEditing(true);
  };
  const addService = (id) => {
    const service = available.find(item => item.id === id);
    if (!service) return;
    set({ lines: [...value.lines, { label: service.label, minCents: service.min * 100, maxCents: service.max * 100 }] });
    setAdding(false);
  };
  const ask = (action) => { setConfirmation(action); dialog.current.showModal(); };
  const preview = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPreviewError('');
    setPending('preview');
    ask('send');
    try {
      if (dirty && !await onAction('save')) {
        dialog.current?.close();
        setPreviewError('L’enregistrement n’a pas abouti. Vos modifications sont conservées. Consultez le message en haut de la fiche puis réessayez.');
      }
    } finally {
      pendingRef.current = false;
      setPending(null);
    }
  };
  const confirm = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending('send');
    try {
      await onAction(confirmation);
      dialog.current?.close();
    } finally {
      pendingRef.current = false;
      setPending(null);
    }
  };
  const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-40';
  const secondary = `${button} bg-stone-100 text-stone-700 hover:bg-stone-200/70 dark:bg-white/10 dark:text-stone-200 dark:hover:bg-white/15`;
  return <section aria-label="Devis à proposer" className="space-y-5 rounded-2xl border border-stone-200/70 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.02]">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold tracking-tight">Votre devis</h3>
        <p className="mt-1 text-xs leading-5 text-stone-500">Estimation initiale : {euroRange(detail.project?.indicativeEstimate)}</p>
      </div>
      {!editing && <button type="button" disabled={blocked} className={secondary} onClick={startEditing}><Pencil size={14} />Modifier le devis</button>}
    </div>

    {!editing ? (
      <div className="space-y-3">
        {(proposal?.lines || requested).map((line, index) => (
          <div key={index} className="flex items-start justify-between gap-4 text-sm">
            <span>{line.label}</span>
            <span className="shrink-0 tabular-nums text-stone-500">{euroRange(line)}</span>
          </div>
        ))}
        {!proposal && <p className="text-xs leading-5 text-stone-500">Après examen des photos, ajustez les prestations et fixez le prix à proposer au client.</p>}
        {proposal?.message && <p className="whitespace-pre-wrap rounded-xl bg-stone-50 p-3 text-sm leading-6 dark:bg-white/5">{proposal.message}</p>}
      </div>
    ) : (
      <fieldset disabled={blocked} className="min-w-0 space-y-5">
        <div className="divide-y divide-stone-100 dark:divide-white/10">
          {value.lines.map((line, index) => {
            const original = requested.find(item => item.label === line.label);
            const catalog = quoteServices.find(item => item.label === line.label);
            const reference = original || (catalog ? { minCents: catalog.min * 100, maxCents: catalog.max * 100 } : null);
            const fixed = line.minCents != null && line.minCents === line.maxCents;
            return <div key={index} className="grid grid-cols-[minmax(0,1fr)_32px] items-start gap-x-2 gap-y-3 py-4 first:pt-0 sm:grid-cols-[minmax(0,1fr)_120px_32px]">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-5">{line.label}</p>
                <p className="mt-1 text-[11px] leading-5 text-stone-500">
                  {original ? 'Demandée par le client' : 'Ajoutée par l’atelier'}
                  {reference ? ` · Repère : ${euroRange(reference)}` : ''}
                </p>
              </div>
              <label className="col-span-2 row-start-2 block min-w-0 text-xs text-stone-500 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                Prix proposé
                <span className="relative mt-1 block">
                  <input aria-label={`Prix proposé — ${line.label}`} type="number" inputMode="decimal" min="0" max="100000" step="0.01"
                    value={fixed ? line.minCents / 100 : ''}
                    placeholder="À fixer"
                    onChange={e => changeLine(index, e.target.value === '' ? null : Math.round(Number(e.target.value) * 100))}
                    className={`min-h-11 w-full rounded-xl border py-2 pl-3 pr-7 text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-500/30 ${field}`} />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">€</span>
                </span>
              </label>
              <button type="button" aria-label={`Retirer ${line.label}`} onClick={() => set({ lines: value.lines.filter((_, i) => i !== index) })}
                className="col-start-2 row-start-1 grid h-8 w-8 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 focus-visible:ring-2 focus-visible:ring-blue-500/50 sm:col-start-3 dark:hover:bg-white/10">
                <X size={15} />
              </button>
            </div>;
          })}
        </div>
        <div className="flex flex-col items-start gap-3">
          <button type="button" className={secondary} disabled={!available.length || value.lines.length >= 20} aria-expanded={adding}
            onClick={() => { setAdding(current => !current); requestAnimationFrame(() => servicePicker.current?.focus()); }}>
            <Plus size={15} />Ajouter une prestation
          </button>
          {adding && <label className="block w-full text-xs text-stone-500">
            Prestations du formulaire client
            <span className="relative mt-2 block">
            <select ref={servicePicker} aria-label="Prestation à ajouter" value="" onChange={e => addService(e.target.value)}
              style={{ appearance: 'none', height: 48 }}
              className={`block w-full rounded-xl border py-3 pl-4 pr-10 text-sm leading-6 outline-none focus:ring-2 focus:ring-blue-500/30 ${field}`}>
              <option value="">Choisir une prestation…</option>
              {available.map(service => <option key={service.id} value={service.id}>{service.label} · {service.min}–{service.max} €</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
            </span>
          </label>}
          {!available.length && <p className="text-xs text-stone-500">Toutes les prestations disponibles sont ajoutées.</p>}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-4 py-3 dark:bg-white/5">
          <span className="text-sm font-medium">Total proposé</span>
          <strong className="text-lg font-semibold tabular-nums">{valid ? euroRange(total) : 'À préciser'}</strong>
        </div>
        {!valid && value.lines.length > 0 && <p className="text-xs text-stone-500">Fixez un prix pour chaque prestation avant l’envoi.</p>}
        <label className="block text-sm font-medium">
          Message au client
          <span className="mt-1 block text-xs font-normal leading-5 text-stone-500">Expliquez les prestations ajoutées ou retirées et l’ajustement du prix.</span>
          <textarea rows={3} maxLength={4000} value={value.message} onChange={e => set({ message: e.target.value })}
            placeholder="Après examen de vos photos, je vous propose d’ajouter… Le montant de votre devis est de…"
            className={`mt-2 w-full resize-y rounded-xl border p-3 text-sm font-normal leading-6 outline-none focus:ring-2 focus:ring-blue-500/30 ${field}`} />
        </label>
        <details className="text-xs text-stone-500">
          <summary className="cursor-pointer py-1">Validité du devis · {value.validDays} jours</summary>
          <label className="mt-3 flex items-center gap-3">Valable pendant
            <input aria-label="Validité en jours" type="number" min="1" max="90" value={value.validDays} onChange={e => set({ validDays: Number(e.target.value) })}
              className={`min-h-10 w-20 rounded-xl border px-3 ${field}`} /> jours
          </label>
        </details>
      </fieldset>
    )}
    {detail.proposalEmail?.proposal && <details className="text-xs"><summary className="min-h-9 cursor-pointer font-semibold">Proposition de la dernière tentative · {euroRange(detail.proposalEmail.proposal)}</summary><div className="space-y-2 whitespace-pre-wrap py-3">{detail.proposalEmail.proposal.lines.map((line, i) => <p key={i}>{line.label} : {euroRange(line)}</p>)}<p>{detail.proposalEmail.proposal.message}</p><p>Validité : {detail.proposalEmail.proposal.validDays} jours</p></div></details>}
    <p role="status" className="text-xs leading-5">{delivery === 'sent' ? `Dernier envoi confirmé${detail.proposalEmail.completedAt ? ` le ${new Date(detail.proposalEmail.completedAt).toLocaleString('fr-FR')}` : ''}.` : delivery === 'sending' ? 'Envoi en cours. Actualisez pour consulter son résultat.' : delivery === 'delivery_unknown' ? 'Résultat incertain : vérifiez l’envoi auprès de votre service mail avant de confirmer son résultat ci-dessous.' : delivery === 'failed' ? 'Envoi non effectué. Vous pouvez réessayer après correction.' : 'Aucune proposition envoyée.'}</p>
    {delivery === 'delivery_unknown' ? <div className="flex flex-wrap gap-2"><button className={secondary} disabled={saving} onClick={() => ask('confirm_sent')}>J’ai vérifié : envoyé</button><button className={secondary} disabled={saving} onClick={() => ask('confirm_not_sent')}>J’ai vérifié : non envoyé</button></div> : <button type="button" className={`${button} w-full bg-stone-950 text-white dark:bg-white dark:text-stone-950`} disabled={blocked || !valid || alreadySent || ['closed', 'accepted'].includes(detail.status)} onClick={() => void preview()}>{saving ? 'Enregistrement…' : 'Prévisualiser et envoyer'}</button>}
    {alreadySent && <p className="text-xs text-stone-500">Cette version est déjà envoyée. Modifiez le chiffrage ou le message pour préparer une nouvelle proposition.</p>}
    {dirty && <p className="text-xs text-stone-500">Vos modifications seront enregistrées avant l’aperçu. L’envoi demandera votre confirmation.</p>}
    {previewError && <p role="alert" className="text-xs text-red-700 dark:text-red-300">{previewError}</p>}
    <dialog ref={dialog} aria-label={pending ? 'Traitement du devis' : 'Vérifier la proposition'} onCancel={event => { if (pendingRef.current) event.preventDefault(); }} className="m-auto max-h-[85dvh] w-[min(600px,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 text-stone-900 backdrop:bg-black/50 dark:border-white/10 dark:bg-stone-900 dark:text-white">
      {pending ? <div role="status" aria-live="polite" className="py-3 sm:p-4">
        <div className="flex items-center gap-4">
          <div aria-hidden="true" className="relative flex h-20 w-16 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white text-indigo-400 shadow-sm dark:border-indigo-400/20 dark:from-indigo-400/10 dark:to-stone-900">
            <FileText size={32} strokeWidth={1.2} />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 dark:bg-stone-900"><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" /></span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{detail.requestNumber}</p>
            <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-300">{pending === 'preview' ? 'Préparation de l’aperçu…' : 'Envoi au client…'}</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">{pending === 'preview' ? 'Enregistrement de vos prestations et de votre message.' : 'Transmission de votre proposition. Patientez un instant.'}</p>
          </div>
        </div>
        <div aria-hidden="true" className="mt-5 h-1.5 overflow-hidden rounded-full bg-indigo-50 dark:bg-white/10"><div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-indigo-200 via-indigo-500 to-indigo-200 motion-reduce:animate-none" /></div>
      </div> : <>
      <h3 className="text-lg font-bold">{confirmation === 'send' ? 'Vérifier la proposition' : 'Confirmer le résultat vérifié'}</h3>
      {confirmation === 'send' ? <div className="my-4 space-y-3 text-sm leading-6"><p>À : {detail.customer?.email}</p><p>Objet : Votre proposition de restauration — {detail.requestNumber}</p><p>Bonjour {detail.customer?.firstName || ''}, voici le chiffrage étudié par l’atelier.</p>{value.lines.map((line, i) => <p key={i}>{line.label} : {euroRange(line)}</p>)}<strong>Total proposé : {euroRange(total)}</strong><p className="whitespace-pre-wrap">{value.message}</p><p>Validité : {value.validDays} jours à compter de l’envoi.</p><p>Répondez à cet e-mail pour confirmer votre accord ou poser vos questions. Les travaux et leur calendrier seront convenus avec l’atelier avant intervention.</p></div> : <p className="my-4 text-sm">{confirmation === 'confirm_sent' ? 'Vous confirmez avoir vérifié que ce message a été envoyé.' : 'Vous confirmez avoir vérifié que ce message n’a pas été envoyé. Une nouvelle tentative sera alors possible.'}</p>}
      <div className="flex flex-wrap justify-end gap-3"><button type="button" className={secondary} onClick={() => dialog.current.close()}>Retour</button><button type="button" className={`${button} bg-stone-950 text-white dark:bg-white dark:text-stone-950`} disabled={saving} onClick={() => void confirm()}>{confirmation === 'send' ? 'Envoyer au client' : 'Confirmer ma vérification'}</button></div>
      </>}
    </dialog>
  </section>;
}
