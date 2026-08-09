'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FilePlus2,
  FileText,
  Loader2,
  Mail,
  Minus,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { getCallableFunction } from '../config/firebaseLazy';
import { getAdminCachedData, loadAdminCachedData } from './adminDataCache';

const INVOICE_WORKSPACE_CACHE_KEY = 'manual-invoices:workspace';
const EMPTY_WORKSPACE = Object.freeze({ seller: null, products: [], invoices: [] });

const fetchAdminInvoicesWorkspace = async () => {
  const callable = await getCallableFunction('getManualInvoiceWorkspaceAdmin');
  const result = await callable({});
  return result.data;
};

export const preloadAdminInvoicesData = ({ force = false } = {}) => (
  loadAdminCachedData(
    INVOICE_WORKSPACE_CACHE_KEY,
    fetchAdminInvoicesWorkspace,
    { force }
  )
);

const today = () => new Date().toLocaleDateString('en-CA');
const uid = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const euro = (cents) => new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 2,
}).format(Number(cents || 0) / 100);
const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${value}T12:00:00`));
};
const centsFromInput = (value) => {
  const normalized = String(value ?? '').replace(/\s/g, '').replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
};
const inputFromCents = (value) => (Number(value || 0) / 100).toFixed(2).replace('.', ',');

const EMPTY_CUSTOMER = {
  customerType: 'individual', firstName: '', lastName: '', businessName: '', email: '', phone: '',
  address1: '', address2: '', postalCode: '', city: '', country: 'France',
};

const createDraft = (seller, products = []) => ({
  invoiceId: null,
  version: null,
  status: 'draft',
  number: null,
  seller: { ...(seller || {}) },
  customer: { ...EMPTY_CUSTOMER },
  lines: products.map((product) => ({
    lineId: uid('line'), productId: product.id, name: product.name,
    description: product.description || '', quantity: 1, unitPriceCents: product.priceCents,
  })),
  issueDate: today(),
  saleDate: today(),
  dueDate: today(),
  paymentMethod: '',
  paymentTerms: 'Paiement comptant',
  notes: '',
  vatCents: 0,
});

const normalizeLoadedInvoice = (invoice) => ({
  ...invoice,
  seller: { ...(invoice.seller || {}) },
  customer: { ...EMPTY_CUSTOMER, ...(invoice.customer || {}) },
  lines: (invoice.lines || []).map((line) => ({ ...line })),
});

function Field({ label, required, className = '', children, hint }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400">
        {label}{required ? <span className="text-amber-600">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1.5 block text-[10px] leading-4 text-stone-400">{hint}</span> : null}
    </label>
  );
}

function Dialog({ children, labelledBy, onClose, wide = false }) {
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-stone-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-5 shadow-2xl dark:bg-stone-900 sm:rounded-[1.75rem] sm:p-7 ${wide ? 'max-w-5xl' : 'max-w-lg'}`}
        role="dialog"
      >
        {children}
      </section>
    </div>
  );
}

function InvoicePreview({ invoice }) {
  const total = (invoice.lines || []).reduce((sum, line) => sum + (Number(line.quantity || 0) * Number(line.unitPriceCents || 0)), 0) + Number(invoice.vatCents || 0);
  const customerName = invoice.customer.customerType === 'business'
    ? invoice.customer.businessName || 'Entreprise cliente'
    : [invoice.customer.firstName, invoice.customer.lastName].filter(Boolean).join(' ') || 'Nom du client';
  return (
    <article className="mx-auto aspect-[210/297] w-full max-w-[42rem] overflow-hidden bg-white text-stone-900 shadow-[0_22px_70px_rgba(28,25,23,0.16)] ring-1 ring-stone-200">
      <header className="flex items-start justify-between bg-stone-900 px-[7%] py-[5.5%] text-white">
        <div>
          <p className="font-serif text-[clamp(1.15rem,3vw,2rem)] leading-none">{invoice.seller.businessName || 'Seconde Vie'}<span className="text-amber-500">.</span></p>
          <p className="mt-2 text-[clamp(.35rem,.9vw,.58rem)] uppercase tracking-[0.2em] text-stone-400">Mobilier restauré</p>
        </div>
        <div className="text-right">
          <p className="text-[clamp(.36rem,.9vw,.58rem)] font-bold uppercase tracking-[0.16em]">{invoice.status === 'issued' ? 'Facture' : 'Brouillon de facture'}</p>
          <p className="mt-1 text-[clamp(.52rem,1.2vw,.8rem)] font-bold tabular-nums">{invoice.number || 'Numéro à l’envoi'}</p>
        </div>
      </header>
      <div className="p-[7%] text-[clamp(.38rem,.92vw,.62rem)] leading-relaxed">
        <div className="grid grid-cols-2 gap-[9%]">
          <div>
            <p className="font-bold uppercase tracking-[0.16em] text-stone-400">Émetteur</p>
            <p className="mt-2 font-bold">{invoice.seller.legalName || 'Identité légale à compléter'}</p>
            <p>{invoice.seller.address1 || 'Adresse'}</p>
            <p>{[invoice.seller.postalCode, invoice.seller.city].filter(Boolean).join(' ') || 'Code postal · Ville'}</p>
            <p>{invoice.seller.email}</p>
            <p className="mt-1">SIREN {invoice.seller.siren || '—'}</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-[0.16em] text-stone-400">Facturé à</p>
            <p className="mt-2 font-bold">{customerName}</p>
            <p>{invoice.customer.address1 || 'Adresse du client'}</p>
            <p>{[invoice.customer.postalCode, invoice.customer.city].filter(Boolean).join(' ') || 'Code postal · Ville'}</p>
            <p>{invoice.customer.email}</p>
          </div>
        </div>
        <div className="mt-[7%] grid grid-cols-3 gap-3 rounded-md bg-stone-100 px-[4%] py-[3%]">
          <div><p className="text-stone-400">Émission</p><p className="mt-1 font-bold">{formatDate(invoice.issueDate)}</p></div>
          <div><p className="text-stone-400">Vente</p><p className="mt-1 font-bold">{formatDate(invoice.saleDate)}</p></div>
          <div><p className="text-stone-400">Échéance</p><p className="mt-1 font-bold">{formatDate(invoice.dueDate)}</p></div>
        </div>
        <div className="mt-[7%]">
          <div className="grid grid-cols-[1fr_9%_20%_20%] bg-stone-900 px-[3%] py-[2.2%] font-bold uppercase tracking-[0.1em] text-white">
            <span>Désignation</span><span className="text-right">Qté</span><span className="text-right">Prix unit.</span><span className="text-right">Total</span>
          </div>
          {(invoice.lines || []).slice(0, 8).map((line) => (
            <div className="grid grid-cols-[1fr_9%_20%_20%] border-b border-stone-200 px-[3%] py-[3%]" key={line.lineId}>
              <div><p className="font-bold">{line.name || 'Article'}</p>{line.description ? <p className="mt-1 line-clamp-2 text-stone-400">{line.description}</p> : null}</div>
              <span className="text-right tabular-nums">{line.quantity}</span>
              <span className="text-right tabular-nums">{euro(line.unitPriceCents)}</span>
              <span className="text-right font-bold tabular-nums">{euro(Number(line.quantity || 0) * Number(line.unitPriceCents || 0))}</span>
            </div>
          ))}
        </div>
        <div className="ml-auto mt-[6%] w-[42%] border-t border-stone-900 pt-[3%]">
          <div className="flex items-center justify-between text-[1.25em] font-bold"><span>Total</span><span className="tabular-nums">{euro(total)}</span></div>
        </div>
        <div className="mt-[7%] grid grid-cols-[1fr_auto] gap-6 text-stone-500">
          <div><p className="font-bold text-stone-800">Règlement</p><p>{invoice.paymentTerms}</p><p>{invoice.paymentMethod}</p></div>
          <p className="max-w-[11rem] text-right">{invoice.seller.vatMode === 'franchise' ? 'TVA non applicable, art. 293 B du CGI.' : invoice.seller.vatMode === 'margin' ? 'Régime particulier — Biens d’occasion.' : invoice.seller.vatNumber ? `TVA : ${invoice.seller.vatNumber}` : ''}</p>
        </div>
      </div>
    </article>
  );
}

function ProductPicker({ products, initialSelection = [], onBack, onContinue, darkMode }) {
  const [selected, setSelected] = useState(() => new Set(initialSelection));
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('fr');
    if (!needle) return products;
    return products.filter((product) => `${product.name} ${product.category}`.toLocaleLowerCase('fr').includes(needle));
  }, [products, search]);
  const toggle = (id) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-stone-900 dark:hover:text-white" onClick={onBack} type="button"><ArrowLeft size={16} /> Retour</button>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Étape 1 sur 3</p>
          <h3 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Quels meubles facturer ?</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Sélectionnez une ou plusieurs pièces. Vous pourrez encore ajuster leur désignation, quantité et prix dans l’éditeur.</p>
        </div>
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-bold text-white transition hover:bg-stone-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-stone-950" disabled={selected.size === 0} onClick={() => onContinue(products.filter((product) => selected.has(product.id)))} type="button">
          Continuer avec {selected.size} {selected.size > 1 ? 'meubles' : 'meuble'} <ArrowRight size={17} />
        </button>
      </div>
      <div className={`sticky top-3 z-10 flex items-center gap-3 rounded-2xl border p-3 shadow-sm backdrop-blur-xl ${darkMode ? 'border-white/10 bg-stone-900/90' : 'border-stone-200 bg-white/90'}`}>
        <Search className="ml-2 text-stone-400" size={18} />
        <input aria-label="Rechercher un meuble" className="min-h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400" onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par nom ou catégorie…" value={search} />
        <span className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300">{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
      </div>
      {filtered.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((product) => {
            const active = selected.has(product.id);
            return (
              <button aria-pressed={active} className={`group overflow-hidden rounded-2xl border text-left transition duration-200 active:scale-[.99] ${active ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20 dark:bg-amber-400/10' : darkMode ? 'border-white/10 bg-white/[.035] hover:border-white/25' : 'border-stone-200 bg-white hover:border-stone-400'}`} key={product.id} onClick={() => toggle(product.id)} type="button">
                <div className="relative aspect-[4/3] bg-stone-100 dark:bg-stone-800">
                  {product.image ? <Image alt={product.name} className="object-cover transition duration-500 group-hover:scale-[1.03]" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" src={product.image} unoptimized /> : <PackageSearch className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-400" size={24} />}
                  <span className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg border shadow-sm ${active ? 'border-amber-500 bg-amber-500 text-white' : 'border-white/70 bg-white/90 text-transparent'}`}><Check size={15} /></span>
                  {product.sold ? <span className="absolute bottom-2 left-2 rounded-md bg-stone-950/85 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">Vendu / archivé</span> : null}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 min-h-10 text-sm font-bold leading-5">{product.name}</p>
                  <p className="mt-2 text-sm font-black tabular-nums">{euro(product.priceCents)}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : <div className="rounded-2xl border border-dashed border-stone-300 px-6 py-16 text-center text-sm text-stone-500">Aucun meuble ne correspond à cette recherche.</div>}
    </section>
  );
}

function Editor({ initialInvoice, onBack, onSaved, onSent, darkMode }) {
  const [invoice, setInvoice] = useState(() => normalizeLoadedInvoice(initialInvoice));
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [recipient, setRecipient] = useState(invoice.customer.email || '');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [sellerOpen, setSellerOpen] = useState(() => ![
    invoice.seller.legalName,
    invoice.seller.siren,
    invoice.seller.address1,
    invoice.seller.postalCode,
    invoice.seller.city,
    invoice.seller.email,
  ].every(Boolean));
  const messageTimer = useRef(null);
  const locked = invoice.status === 'issued';
  const inputClass = `min-h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 ${darkMode ? 'border-white/10 bg-white/[.04] text-white' : 'border-stone-200 bg-white text-stone-900'}`;

  useEffect(() => () => window.clearTimeout(messageTimer.current), []);
  const notify = (kind, text) => {
    setMessage({ kind, text });
    window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setMessage(null), 6000);
  };
  const setCustomer = (key, value) => setInvoice((current) => ({ ...current, customer: { ...current.customer, [key]: value } }));
  const setSeller = (key, value) => setInvoice((current) => ({ ...current, seller: { ...current.seller, [key]: value } }));
  const setLine = (lineId, key, value) => setInvoice((current) => ({ ...current, lines: current.lines.map((line) => line.lineId === lineId ? { ...line, [key]: value } : line) }));
  const total = invoice.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPriceCents || 0), 0) + Number(invoice.vatCents || 0);

  const save = async ({ quiet = false } = {}) => {
    if (locked) return invoice;
    setSaving(true);
    try {
      const callable = await getCallableFunction('saveManualInvoiceDraftAdmin');
      const result = await callable({ invoiceId: invoice.invoiceId, expectedVersion: invoice.version, invoice });
      const saved = normalizeLoadedInvoice(result.data.invoice);
      setInvoice(saved);
      onSaved(saved);
      if (!quiet) notify('success', 'Brouillon sauvegardé. Vous pouvez le reprendre plus tard.');
      return saved;
    } catch (error) {
      notify('error', error?.message || 'La facture n’a pas pu être sauvegardée.');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const saved = invoice.invoiceId ? invoice : await save({ quiet: true });
      const callable = await getCallableFunction('prepareManualInvoicePdfAdmin');
      const result = await callable({ invoiceId: saved.invoiceId });
      const binary = window.atob(result.data.document.contentBase64);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = result.data.document.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify('success', locked ? 'Facture téléchargée.' : 'Brouillon PDF téléchargé.');
    } catch (error) {
      notify('error', error?.message || 'Le PDF n’a pas pu être préparé.');
    } finally {
      setDownloading(false);
    }
  };

  const openSend = async () => {
    try {
      const saved = locked ? invoice : await save({ quiet: true });
      setRecipient(saved.customer.email || recipient);
      setSendOpen(true);
    } catch { /* Le message inline explique déjà l’erreur. */ }
  };

  const sendInvoice = async () => {
    setSending(true);
    try {
      const callable = await getCallableFunction('sendManualInvoiceAdmin');
      const result = await callable({ invoiceId: invoice.invoiceId, recipient, sendRequestId: uid('send') });
      const issued = normalizeLoadedInvoice({ ...invoice, ...result.data.invoice, status: 'issued', emailStatus: 'sent' });
      setInvoice(issued);
      onSent(issued);
      setSendOpen(false);
      setSendSuccess(true);
    } catch (error) {
      notify('error', error?.message || 'L’envoi a échoué. La facture reste enregistrée.');
      setSendOpen(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <button className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-stone-900 dark:hover:text-white" onClick={onBack} type="button"><ArrowLeft size={16} /> Toutes les factures</button>
          <div className="flex flex-wrap items-center gap-3"><p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Étape 2 sur 3 · Édition</p>{locked ? <span className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">Émise · verrouillée</span> : <span className="rounded-md bg-stone-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600 dark:bg-white/10 dark:text-stone-300">Brouillon modifiable</span>}</div>
          <h3 className="mt-2 text-3xl font-black tracking-tight">{locked ? invoice.number : 'Composer la facture'}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition active:translate-y-px ${darkMode ? 'border-white/10 hover:bg-white/10' : 'border-stone-200 bg-white hover:border-stone-400'}`} disabled={downloading || saving} onClick={download} type="button">{downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} PDF</button>
          {!locked ? <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition active:translate-y-px ${darkMode ? 'border-white/10 hover:bg-white/10' : 'border-stone-200 bg-white hover:border-stone-400'}`} disabled={saving} onClick={() => save()} type="button">{saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Sauvegarder</button> : null}
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-bold text-white transition hover:bg-stone-800 active:translate-y-px disabled:opacity-50 dark:bg-white dark:text-stone-950" disabled={saving || sending} onClick={openSend} type="button"><Mail size={16} /> {locked ? 'Renvoyer par e-mail' : 'Enregistrer et envoyer'}</button>
        </div>
      </div>
      {message ? <div aria-live="polite" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${message.kind === 'error' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'}`}>{message.kind === 'error' ? <X className="mt-0.5 shrink-0" size={16} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={16} />}<span>{message.text}</span></div> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,.92fr)]">
        <div className={`space-y-4 ${locked ? 'pointer-events-none opacity-70' : ''}`} aria-disabled={locked}>
          <section className={`rounded-2xl border p-5 ${darkMode ? 'border-white/10 bg-white/[.035]' : 'border-stone-200 bg-white'}`}>
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"><UserRound size={18} /></span><div><h4 className="font-black">Coordonnées du client</h4><p className="text-xs text-stone-500">Ces informations apparaissent sur la facture.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type de client" className="sm:col-span-2"><div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1 dark:bg-white/[.05]">{[['individual', 'Particulier'], ['business', 'Entreprise']].map(([value, label]) => <button className={`min-h-10 rounded-lg text-sm font-bold transition ${invoice.customer.customerType === value ? 'bg-white text-stone-950 shadow-sm dark:bg-stone-700 dark:text-white' : 'text-stone-500'}`} key={value} onClick={() => setCustomer('customerType', value)} type="button">{label}</button>)}</div></Field>
              {invoice.customer.customerType === 'business' ? <Field className="sm:col-span-2" label="Nom de l’entreprise" required><input className={inputClass} onChange={(event) => setCustomer('businessName', event.target.value)} value={invoice.customer.businessName} /></Field> : <><Field label="Prénom" required><input autoComplete="given-name" className={inputClass} onChange={(event) => setCustomer('firstName', event.target.value)} value={invoice.customer.firstName} /></Field><Field label="Nom" required><input autoComplete="family-name" className={inputClass} onChange={(event) => setCustomer('lastName', event.target.value)} value={invoice.customer.lastName} /></Field></>}
              <Field label="E-mail"><input autoComplete="email" className={inputClass} onChange={(event) => setCustomer('email', event.target.value)} type="email" value={invoice.customer.email} /></Field>
              <Field label="Téléphone"><input autoComplete="tel" className={inputClass} onChange={(event) => setCustomer('phone', event.target.value)} value={invoice.customer.phone} /></Field>
              <Field className="sm:col-span-2" label="Adresse" required><input autoComplete="street-address" className={inputClass} onChange={(event) => setCustomer('address1', event.target.value)} value={invoice.customer.address1} /></Field>
              <Field label="Code postal" required><input autoComplete="postal-code" className={inputClass} onChange={(event) => setCustomer('postalCode', event.target.value)} value={invoice.customer.postalCode} /></Field>
              <Field label="Ville" required><input autoComplete="address-level2" className={inputClass} onChange={(event) => setCustomer('city', event.target.value)} value={invoice.customer.city} /></Field>
            </div>
          </section>

          <section className={`rounded-2xl border p-5 ${darkMode ? 'border-white/10 bg-white/[.035]' : 'border-stone-200 bg-white'}`}>
            <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"><FileText size={18} /></span><div><h4 className="font-black">Meubles et éléments</h4><p className="text-xs text-stone-500">Les prix restent personnalisables sur ce brouillon.</p></div></div><button className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-200 px-3 text-xs font-bold hover:border-stone-400 dark:border-white/10" onClick={() => setInvoice((current) => ({ ...current, lines: [...current.lines, { lineId: uid('line'), productId: null, name: '', description: '', quantity: 1, unitPriceCents: 0 }] }))} type="button"><Plus size={14} /> Ligne libre</button></div>
            <div className="space-y-3">
              {invoice.lines.map((line, index) => (
                <div className={`rounded-xl border p-4 ${darkMode ? 'border-white/10 bg-black/10' : 'border-stone-200 bg-stone-50/70'}`} key={line.lineId}>
                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-stone-500">Élément {index + 1}</p><button aria-label={`Supprimer ${line.name || `l’élément ${index + 1}`}`} className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10" disabled={invoice.lines.length === 1} onClick={() => setInvoice((current) => ({ ...current, lines: current.lines.filter((item) => item.lineId !== line.lineId) }))} type="button"><Trash2 size={15} /></button></div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_5.5rem_8rem]">
                    <Field label="Désignation" required><input className={inputClass} onChange={(event) => setLine(line.lineId, 'name', event.target.value)} value={line.name} /></Field>
                    <Field label="Quantité" required><div className="flex"><button aria-label="Diminuer la quantité" className="grid h-11 w-9 shrink-0 place-items-center rounded-l-xl border border-r-0 border-stone-200 dark:border-white/10" onClick={() => setLine(line.lineId, 'quantity', Math.max(1, Number(line.quantity || 1) - 1))} type="button"><Minus size={13} /></button><input aria-label="Quantité" className={`${inputClass} rounded-none px-1 text-center tabular-nums`} min="1" onChange={(event) => setLine(line.lineId, 'quantity', Number(event.target.value))} type="number" value={line.quantity} /><button aria-label="Augmenter la quantité" className="grid h-11 w-9 shrink-0 place-items-center rounded-r-xl border border-l-0 border-stone-200 dark:border-white/10" onClick={() => setLine(line.lineId, 'quantity', Math.min(100, Number(line.quantity || 1) + 1))} type="button"><Plus size={13} /></button></div></Field>
                    <Field label="Prix unitaire" required><div className="relative"><input className={`${inputClass} pr-8 text-right tabular-nums`} inputMode="decimal" onBlur={(event) => { event.currentTarget.value = inputFromCents(line.unitPriceCents); }} onChange={(event) => setLine(line.lineId, 'unitPriceCents', centsFromInput(event.target.value))} defaultValue={inputFromCents(line.unitPriceCents)} /><span className="pointer-events-none absolute right-3 top-3 text-sm text-stone-400">€</span></div></Field>
                    <Field className="sm:col-span-3" label="Description (facultative)"><textarea className={`${inputClass} min-h-20 resize-y py-3`} onChange={(event) => setLine(line.lineId, 'description', event.target.value)} value={line.description} /></Field>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-4 dark:border-white/10"><span className="text-sm font-bold">Total de la facture</span><span className="text-xl font-black tabular-nums">{euro(total)}</span></div>
          </section>

          <section className={`rounded-2xl border p-5 ${darkMode ? 'border-white/10 bg-white/[.035]' : 'border-stone-200 bg-white'}`}>
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"><FileText size={18} /></span><div><h4 className="font-black">Dates et règlement</h4><p className="text-xs text-stone-500">Précisez quand la vente a eu lieu et comment elle a été réglée.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date de facture" required><input className={inputClass} onChange={(event) => setInvoice((current) => ({ ...current, issueDate: event.target.value }))} type="date" value={invoice.issueDate} /></Field>
              <Field label="Date de vente" required><input className={inputClass} onChange={(event) => setInvoice((current) => ({ ...current, saleDate: event.target.value }))} type="date" value={invoice.saleDate} /></Field>
              <Field label="Échéance" required><input className={inputClass} onChange={(event) => setInvoice((current) => ({ ...current, dueDate: event.target.value }))} type="date" value={invoice.dueDate} /></Field>
              <Field label="Mode de règlement"><input className={inputClass} onChange={(event) => setInvoice((current) => ({ ...current, paymentMethod: event.target.value }))} placeholder="Carte, virement, espèces…" value={invoice.paymentMethod} /></Field>
              <Field className="sm:col-span-2" label="Conditions de règlement" required><input className={inputClass} onChange={(event) => setInvoice((current) => ({ ...current, paymentTerms: event.target.value }))} value={invoice.paymentTerms} /></Field>
              <Field className="sm:col-span-3" label="Note visible sur la facture"><textarea className={`${inputClass} min-h-24 resize-y py-3`} onChange={(event) => setInvoice((current) => ({ ...current, notes: event.target.value }))} placeholder="Merci pour votre confiance, détail de livraison…" value={invoice.notes} /></Field>
            </div>
          </section>

          <section className={`overflow-hidden rounded-2xl border ${darkMode ? 'border-white/10 bg-white/[.035]' : 'border-stone-200 bg-white'}`}>
            <button aria-expanded={sellerOpen} className="flex w-full items-center justify-between gap-3 p-5 text-left" onClick={() => setSellerOpen((value) => !value)} type="button"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300"><Building2 size={18} /></span><div><h4 className="font-black">Informations de l’entreprise</h4><p className="text-xs text-stone-500">Mémorisées et préremplies sur les prochaines factures.</p></div></div><ChevronDown className={`transition ${sellerOpen ? 'rotate-180' : ''}`} size={18} /></button>
            {sellerOpen ? <div className="grid gap-4 border-t border-stone-200 p-5 dark:border-white/10 sm:grid-cols-2">
              <Field label="Nom commercial" required><input className={inputClass} onChange={(event) => setSeller('businessName', event.target.value)} value={invoice.seller.businessName || ''} /></Field>
              <Field label="Nom légal" required><input className={inputClass} onChange={(event) => setSeller('legalName', event.target.value)} value={invoice.seller.legalName || ''} /></Field>
              <Field label="SIREN" required><input className={inputClass} inputMode="numeric" onChange={(event) => setSeller('siren', event.target.value)} value={invoice.seller.siren || ''} /></Field>
              <Field label="SIRET"><input className={inputClass} inputMode="numeric" onChange={(event) => setSeller('siret', event.target.value)} value={invoice.seller.siret || ''} /></Field>
              <Field className="sm:col-span-2" label="Adresse" required><input className={inputClass} onChange={(event) => setSeller('address1', event.target.value)} value={invoice.seller.address1 || ''} /></Field>
              <Field label="Code postal" required><input className={inputClass} onChange={(event) => setSeller('postalCode', event.target.value)} value={invoice.seller.postalCode || ''} /></Field>
              <Field label="Ville" required><input className={inputClass} onChange={(event) => setSeller('city', event.target.value)} value={invoice.seller.city || ''} /></Field>
              <Field label="E-mail" required><input className={inputClass} onChange={(event) => setSeller('email', event.target.value)} type="email" value={invoice.seller.email || ''} /></Field>
              <Field label="Téléphone"><input className={inputClass} onChange={(event) => setSeller('phone', event.target.value)} value={invoice.seller.phone || ''} /></Field>
              <Field label="Régime de TVA"><select className={inputClass} onChange={(event) => setSeller('vatMode', event.target.value)} value={invoice.seller.vatMode || 'franchise'}><option value="franchise">Franchise en base de TVA</option><option value="margin">Régime de la marge — biens d’occasion</option><option value="standard">TVA standard</option></select></Field>
              <Field label="Forme juridique"><input className={inputClass} onChange={(event) => setSeller('legalForm', event.target.value)} value={invoice.seller.legalForm || ''} /></Field>
            </div> : null}
          </section>
        </div>
        <aside className="xl:sticky xl:top-5 xl:self-start">
          <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-stone-500">Aperçu en direct</p><p className="text-xs font-bold tabular-nums">{euro(total)}</p></div>
          <InvoicePreview invoice={invoice} />
        </aside>
      </div>

      {sendOpen ? <Dialog labelledBy="invoice-send-title" onClose={() => !sending && setSendOpen(false)}>
        <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"><Send size={21} /></span><button aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10" disabled={sending} onClick={() => setSendOpen(false)} type="button"><X size={18} /></button></div>
        <h3 className="mt-5 text-2xl font-black tracking-tight" id="invoice-send-title">Envoyer la facture</h3>
        <p className="mt-2 text-sm leading-6 text-stone-500">Le PDF sera joint à un e-mail Seconde Vie. Lors du premier envoi, un numéro définitif sera attribué et la facture sera verrouillée.</p>
        <Field className="mt-6" label="Adresse e-mail du destinataire" required><input className={inputClass} onChange={(event) => setRecipient(event.target.value)} placeholder="client@exemple.fr" type="email" value={recipient} /></Field>
        <div className="mt-4 rounded-xl bg-stone-100 p-4 text-xs leading-5 text-stone-600 dark:bg-white/[.06] dark:text-stone-300"><strong className="text-stone-900 dark:text-white">Avant l’envoi :</strong> vérifiez le nom, l’adresse, le montant, le régime de TVA et les informations légales de l’entreprise.</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="min-h-11 rounded-xl px-4 text-sm font-bold text-stone-500 hover:text-stone-900 dark:hover:text-white" disabled={sending} onClick={() => setSendOpen(false)} type="button">Annuler</button><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-950" disabled={sending || !recipient.trim()} onClick={sendInvoice} type="button">{sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}{sending ? 'Envoi en cours…' : 'Émettre et envoyer'}</button></div>
      </Dialog> : null}

      {sendSuccess ? <Dialog labelledBy="invoice-success-title" onClose={() => setSendSuccess(false)}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"><CheckCircle2 size={26} /></div>
        <h3 className="mt-5 text-center text-2xl font-black tracking-tight" id="invoice-success-title">Facture envoyée</h3>
        <p className="mt-2 text-center text-sm leading-6 text-stone-500">{invoice.number} a été envoyée à {recipient}. Le document émis est maintenant verrouillé.</p>
        <button className="mt-6 min-h-11 w-full rounded-xl bg-stone-950 text-sm font-bold text-white dark:bg-white dark:text-stone-950" onClick={() => setSendSuccess(false)} type="button">Terminer</button>
      </Dialog> : null}
    </section>
  );
}

export default function AdminInvoices({ darkMode = false }) {
  const initialWorkspaceRef = useRef(getAdminCachedData(INVOICE_WORKSPACE_CACHE_KEY));
  const [workspace, setWorkspace] = useState(initialWorkspaceRef.current || EMPTY_WORKSPACE);
  const [status, setStatus] = useState(initialWorkspaceRef.current ? 'ready' : 'loading');
  const [error, setError] = useState(null);
  const [view, setView] = useState('home');
  const [activeInvoice, setActiveInvoice] = useState(null);

  const load = useCallback(async ({ foreground = true, force = true } = {}) => {
    if (foreground) setStatus('loading');
    setError(null);
    try {
      const nextWorkspace = await preloadAdminInvoicesData({ force });
      setWorkspace(nextWorkspace);
      setStatus('ready');
    } catch (loadError) {
      setError(loadError?.message || 'Les factures ne sont pas disponibles.');
      if (!initialWorkspaceRef.current) setStatus('error');
    }
  }, []);
  useEffect(() => {
    void load({
      foreground: !initialWorkspaceRef.current,
      force: Boolean(initialWorkspaceRef.current),
    });
  }, [load]);

  const upsertInvoice = (invoice) => setWorkspace((current) => ({
    ...current,
    seller: invoice.seller || current.seller,
    invoices: [invoice, ...current.invoices.filter((item) => item.invoiceId !== invoice.invoiceId)],
  }));

  if (view === 'picker') return <ProductPicker darkMode={darkMode} onBack={() => setView('home')} onContinue={(products) => { setActiveInvoice(createDraft(workspace.seller, products)); setView('editor'); }} products={workspace.products} />;
  if (view === 'editor' && activeInvoice) return <Editor darkMode={darkMode} initialInvoice={activeInvoice} onBack={() => { setView('home'); setActiveInvoice(null); }} onSaved={(invoice) => { upsertInvoice(invoice); setActiveInvoice(invoice); }} onSent={(invoice) => { upsertInvoice(invoice); setActiveInvoice(invoice); }} />;

  return (
    <section className="space-y-7">
      <div className={`relative overflow-hidden rounded-[1.75rem] border p-6 md:p-9 ${darkMode ? 'border-white/10 bg-[#151513]' : 'border-stone-200 bg-[#f2eee5]'}`}>
        <div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[42px] border-amber-500/10" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600 backdrop-blur dark:bg-white/10 dark:text-stone-300"><FileText size={13} /> Atelier de facturation</span>
          <h3 className="mt-5 text-4xl font-black tracking-[-0.04em] md:text-5xl">Une facture prête en quelques minutes.</h3>
          <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600 dark:text-stone-400">Choisissez les meubles, complétez les coordonnées du client, vérifiez l’aperçu puis envoyez le PDF par e-mail.</p>
          <button className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-xl bg-stone-950 px-5 text-sm font-bold text-white transition hover:bg-stone-800 active:translate-y-px disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-stone-950" disabled={status !== 'ready'} onClick={() => setView('picker')} type="button"><FilePlus2 size={18} /> {status === 'loading' ? 'Catalogue en cours de synchronisation…' : 'Créer une facture'} {status === 'ready' ? <ArrowRight size={17} /> : null}</button>
        </div>
        <div className="relative mt-8 grid max-w-2xl grid-cols-3 gap-2 text-center md:gap-3">{[['01', 'Meubles'], ['02', 'Coordonnées'], ['03', 'Envoi PDF']].map(([number, label]) => <div className={`rounded-xl border px-2 py-3 ${darkMode ? 'border-white/10 bg-white/[.04]' : 'border-white/80 bg-white/60'}`} key={number}><p className="text-[10px] font-black text-amber-700 dark:text-amber-400">{number}</p><p className="mt-1 text-xs font-bold">{label}</p></div>)}</div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4"><div><h4 className="text-xl font-black">Factures enregistrées</h4><p className="mt-1 text-sm text-stone-500">Reprenez un brouillon ou renvoyez une facture déjà émise.</p></div><span className="text-xs font-bold text-stone-400">{status === 'loading' ? 'Synchronisation…' : `${workspace.invoices.length} document${workspace.invoices.length > 1 ? 's' : ''}`}</span></div>
        {status === 'error' ? <div className={`rounded-2xl border p-6 text-center ${darkMode ? 'border-red-400/20 bg-red-400/10' : 'border-red-200 bg-red-50'}`}><p className="font-black">Les données de facturation ne sont pas disponibles</p><p className="mt-2 text-sm text-stone-500">{error}</p><button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-bold text-white dark:bg-white dark:text-stone-950" onClick={() => load()} type="button"><RefreshCw size={15} /> Réessayer</button></div> : workspace.invoices.length ? <div className={`overflow-hidden rounded-2xl border ${darkMode ? 'border-white/10' : 'border-stone-200 bg-white'}`}>
          {workspace.invoices.map((invoice, index) => {
            const name = invoice.customer?.customerType === 'business' ? invoice.customer.businessName : [invoice.customer?.firstName, invoice.customer?.lastName].filter(Boolean).join(' ');
            return <button className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 text-left transition hover:bg-stone-50 dark:hover:bg-white/[.04] md:px-5 ${index ? 'border-t border-stone-200 dark:border-white/10' : ''}`} key={invoice.invoiceId} onClick={() => { setActiveInvoice(normalizeLoadedInvoice(invoice)); setView('editor'); }} type="button"><span className={`grid h-10 w-10 place-items-center rounded-xl ${invoice.status === 'issued' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300'}`}>{invoice.status === 'issued' ? <CheckCircle2 size={18} /> : <FileText size={18} />}</span><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm">{name || 'Client à compléter'}</strong><span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{invoice.status === 'issued' ? invoice.number : 'Brouillon'}</span></span><span className="mt-1 block truncate text-xs text-stone-500">{invoice.lines?.map((line) => line.name).join(', ') || 'Aucun élément'} · {formatDate(invoice.issueDate)}</span></span><span className="text-right"><strong className="block text-sm tabular-nums">{euro(invoice.totalCents)}</strong><span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-stone-400">{invoice.emailStatus === 'sent' ? <><Mail size={11} /> Envoyée</> : invoice.status === 'draft' ? 'À compléter' : 'Non envoyée'}</span></span></button>;
          })}
        </div> : <div className={`rounded-2xl border border-dashed px-6 py-14 text-center ${darkMode ? 'border-white/15' : 'border-stone-300'}`}><FileText className="mx-auto text-stone-300 dark:text-stone-600" size={28} /><p className="mt-3 font-bold">Aucune facture enregistrée</p><p className="mt-1 text-sm text-stone-500">Votre premier brouillon apparaîtra ici.</p></div>}
      </section>
    </section>
  );
}
