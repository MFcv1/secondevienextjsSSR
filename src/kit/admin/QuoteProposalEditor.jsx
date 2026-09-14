'use client';

import { useRef, useState } from 'react';
import { euroRange } from './quotePresentation';

export default function QuoteProposalEditor({ detail, proposal, onChange, onAction, dirty, saving, field }) {
  const dialog = useRef(null);
  const [confirmation, setConfirmation] = useState(null);
  const delivery = detail.proposalEmail?.status;
  const blocked = saving || Boolean(detail.deletedAt) || ['sending', 'delivery_unknown'].includes(delivery);
  const value = proposal || { lines: [], validDays: 30, message: '' };
  const set = (patch) => onChange({ ...value, ...patch });
  const total = value.lines.reduce((sum, line) => ({ minCents: sum.minCents + (Number(line.minCents) || 0), maxCents: sum.maxCents + (Number(line.maxCents) || 0) }), { minCents: 0, maxCents: 0 });
  const valid = value.lines.length > 0 && total.maxCents > 0 && value.lines.every(line => line.label.trim() && Number.isSafeInteger(line.minCents) && Number.isSafeInteger(line.maxCents) && line.minCents >= 0 && line.maxCents >= line.minCents);
  const alreadySent = delivery === 'sent' && JSON.stringify(proposal) === JSON.stringify(detail.proposalEmail.proposal);
  const changeLine = (index, patch) => set({ lines: value.lines.map((line, i) => i === index ? { ...line, ...patch } : line) });
  const ask = (action) => { setConfirmation(action); dialog.current.showModal(); };
  const button = 'min-h-11 rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-40';
  return <section className="space-y-4 rounded-2xl border border-stone-200 p-4 dark:border-white/10">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-base font-bold">Chiffrage & réponse</h3><strong className="tabular-nums">{value.lines.length ? euroRange(total) : 'À chiffrer'}</strong></div>
    <p className="text-xs leading-5 text-stone-500">Reprenez l’estimation ou ajustez les prestations. Pour un prix fixe, saisissez le même minimum et maximum. Les montants sont les prix totaux proposés au client, en euros.</p>
    <fieldset disabled={blocked} className="min-w-0 space-y-3">
      <button type="button" className={button} onClick={() => set({ lines: (detail.project?.services || []).map(({ label, minCents, maxCents }) => ({ label, minCents, maxCents })) })}>Reprendre la grille du projet</button>
      {value.lines.map((line, index) => <div key={index} className="grid grid-cols-2 gap-2 rounded-xl bg-stone-500/5 p-3">
        <label className="col-span-2 text-xs">Prestation {index + 1}<input aria-label={`Prestation ${index + 1}`} maxLength={200} value={line.label} onChange={e => changeLine(index, { label: e.target.value })} className={`mt-1 min-h-11 w-full rounded-lg border px-3 ${field}`} /></label>
        {['minCents', 'maxCents'].map((key, i) => <label key={key} className="min-w-0 text-xs">{i ? 'Maximum €' : 'Minimum €'}<input type="number" inputMode="decimal" min="0" max="100000" step="0.01" value={line[key] == null ? '' : line[key] / 100} onChange={e => changeLine(index, { [key]: e.target.value === '' ? null : Math.round(Number(e.target.value) * 100) })} className={`mt-1 min-h-11 w-full rounded-lg border px-3 ${field}`} /></label>)}
        <button type="button" onClick={() => set({ lines: value.lines.filter((_, i) => i !== index) })} className="col-span-2 min-h-9 text-right text-xs text-stone-500" aria-label={`Retirer la prestation ${index + 1}`}>Retirer</button>
      </div>)}
      <button type="button" className={button} disabled={value.lines.length >= 20} onClick={() => set({ lines: [...value.lines, { label: '', minCents: 0, maxCents: 0 }] })}>+ Ajouter une prestation</button>
      <label className="block text-xs font-semibold">Validité (jours)<input type="number" min="1" max="90" value={value.validDays} onChange={e => set({ validDays: Number(e.target.value) })} className={`ml-3 min-h-11 w-20 rounded-lg border px-3 ${field}`} /></label>
      <label className="block text-xs font-semibold">Message au client<textarea rows={3} maxLength={4000} value={value.message} onChange={e => set({ message: e.target.value })} placeholder="Travaux inclus, réserves éventuelles, transport et délai envisagé…" className={`mt-2 w-full rounded-xl border p-3 font-normal ${field}`} /></label>
    </fieldset>
    {detail.proposalEmail?.proposal && <details className="text-xs"><summary className="min-h-9 cursor-pointer font-semibold">Proposition de la dernière tentative · {euroRange(detail.proposalEmail.proposal)}</summary><div className="space-y-2 whitespace-pre-wrap py-3">{detail.proposalEmail.proposal.lines.map((line, i) => <p key={i}>{line.label} : {euroRange(line)}</p>)}<p>{detail.proposalEmail.proposal.message}</p><p>Validité : {detail.proposalEmail.proposal.validDays} jours</p></div></details>}
    <p role="status" className="text-xs leading-5">{delivery === 'sent' ? `Dernier envoi confirmé${detail.proposalEmail.completedAt ? ` le ${new Date(detail.proposalEmail.completedAt).toLocaleString('fr-FR')}` : ''}.` : delivery === 'sending' ? 'Envoi en cours. Actualisez pour consulter son résultat.' : delivery === 'delivery_unknown' ? 'Résultat incertain : vérifiez l’envoi auprès de votre service mail avant de confirmer son résultat ci-dessous.' : delivery === 'failed' ? 'Envoi non effectué. Vous pouvez réessayer après correction.' : 'Aucune proposition envoyée.'}</p>
    {delivery === 'delivery_unknown' ? <div className="flex flex-wrap gap-2"><button className={button} disabled={saving} onClick={() => ask('confirm_sent')}>J’ai vérifié : envoyé</button><button className={button} disabled={saving} onClick={() => ask('confirm_not_sent')}>J’ai vérifié : non envoyé</button></div> : <button type="button" className={`${button} w-full bg-stone-950 text-white dark:bg-white dark:text-stone-950`} disabled={blocked || dirty || !valid || alreadySent || ['closed', 'accepted'].includes(detail.status)} onClick={() => ask('send')}>Prévisualiser et envoyer</button>}
    {alreadySent && <p className="text-xs text-stone-500">Cette version est déjà envoyée. Modifiez le chiffrage ou le message pour préparer une nouvelle proposition.</p>}
    {dirty && <p className="text-xs text-stone-500">Enregistrez vos modifications avant l’aperçu et l’envoi.</p>}
    <dialog ref={dialog} className="m-auto max-h-[85dvh] w-[min(600px,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 text-stone-900 backdrop:bg-black/50 dark:border-white/10 dark:bg-stone-900 dark:text-white">
      <h3 className="text-lg font-bold">{confirmation === 'send' ? 'Vérifier la proposition' : 'Confirmer le résultat vérifié'}</h3>
      {confirmation === 'send' ? <div className="my-4 space-y-3 text-sm leading-6"><p>À : {detail.customer?.email}</p><p>Objet : Votre proposition de restauration — {detail.requestNumber}</p><p>Bonjour {detail.customer?.firstName || ''}, voici le chiffrage étudié par l’atelier.</p>{value.lines.map((line, i) => <p key={i}>{line.label} : {euroRange(line)}</p>)}<strong>Total proposé : {euroRange(total)}</strong><p className="whitespace-pre-wrap">{value.message}</p><p>Validité : {value.validDays} jours à compter de l’envoi.</p><p>Répondez à cet e-mail pour confirmer votre accord ou poser vos questions. Les travaux et leur calendrier seront convenus avec l’atelier avant intervention.</p></div> : <p className="my-4 text-sm">{confirmation === 'confirm_sent' ? 'Vous confirmez avoir vérifié que ce message a été envoyé.' : 'Vous confirmez avoir vérifié que ce message n’a pas été envoyé. Une nouvelle tentative sera alors possible.'}</p>}
      <div className="flex flex-wrap justify-end gap-3"><button type="button" className={button} onClick={() => dialog.current.close()}>Retour</button><button type="button" className={`${button} bg-stone-950 text-white dark:bg-white dark:text-stone-950`} disabled={saving} onClick={() => { dialog.current.close(); void onAction(confirmation); }}>{confirmation === 'send' ? 'Envoyer au client' : 'Confirmer ma vérification'}</button></div>
    </dialog>
  </section>;
}
