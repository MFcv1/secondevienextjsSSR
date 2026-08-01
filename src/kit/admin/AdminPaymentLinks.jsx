'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Check,
  Clock3,
  Copy,
  Link2,
  Loader2,
  RefreshCw,
  RotateCw,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  cancelAdminPaymentLink,
  createAdminPaymentLink,
  extendAdminPaymentLink,
  listAdminPaymentLinks,
  recreateAdminPaymentLink,
  regenerateAdminPaymentLink,
} from '../commerce/adminPaymentLinkClient';
import {
  getProductPriceAmount,
  getProductStockAmount,
  isPurchasable,
} from '../commerce/purchasability';

const DELIVERY_LABELS = {
  'delivery-pickup': 'Retrait à l’atelier',
  'delivery-local': 'Livraison locale',
  'delivery-carrier': 'Transporteur spécialisé',
};

const STATUS = {
  active: { label: 'Coordonnées attendues', tone: 'warning' },
  ready_to_pay: { label: 'Prêt à payer', tone: 'info' },
  payment_in_progress: { label: 'Paiement en cours', tone: 'info' },
  paid: { label: 'Payé', tone: 'success' },
  expired: { label: 'Expiré', tone: 'neutral' },
  canceled: { label: 'Annulé', tone: 'danger' },
  needs_review: { label: 'À vérifier', tone: 'danger' },
};

const toneClass = (tone, darkMode) => {
  const map = darkMode ? {
    success: 'bg-emerald-400/10 text-emerald-200',
    info: 'bg-sky-400/10 text-sky-200',
    warning: 'bg-amber-400/10 text-amber-200',
    danger: 'bg-red-400/10 text-red-200',
    neutral: 'bg-white/[0.06] text-stone-400',
  } : {
    success: 'bg-emerald-50 text-emerald-700',
    info: 'bg-sky-50 text-sky-700',
    warning: 'bg-amber-50 text-amber-800',
    danger: 'bg-red-50 text-red-700',
    neutral: 'bg-stone-100 text-stone-600',
  };
  return map[tone] || map.neutral;
};

const formatMoney = (amountCents) => new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
}).format(Number(amountCents || 0) / 100);

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const productId = (item) => item.originalId || item.productId || item.id;
const productPrice = getProductPriceAmount;
const productStock = getProductStockAmount;
const productName = (item) => item.name || item.title || 'Pièce Seconde Vie';

const isSelectableProduct = (item) => (
  Boolean(productId(item)) &&
  item.status === 'published' &&
  isPurchasable(item) &&
  Number.isSafeInteger(productStock(item)) &&
  productStock(item) > 0
);

function StatusPill({ darkMode, status }) {
  const copy = STATUS[status] || { label: status || 'Inconnu', tone: 'neutral' };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${toneClass(copy.tone, darkMode)}`}>
      {copy.label}
    </span>
  );
}

export default function AdminPaymentLinks({ darkMode, items = [], mutationsEnabled }) {
  const [state, setState] = useState({ status: 'loading', links: [], setup: null, error: '' });
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [email, setEmail] = useState('');
  const [deliveryModeId, setDeliveryModeId] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(120);
  const [action, setAction] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setState((current) => ({ ...current, status: 'loading', error: '' }));
    try {
      const result = await listAdminPaymentLinks({ pageSize: 50 });
      setState({
        status: 'ready',
        links: result.links || [],
        setup: result.setup || null,
        error: '',
      });
      setDeliveryModeId((current) => current || result.setup?.deliveryModes?.[0]?.id || '');
    } catch (error) {
      setState((current) => ({
        ...current,
        status: 'error',
        error: error?.message || 'Lecture des liens impossible.',
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectableItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr');
    return items
      .filter(isSelectableProduct)
      .filter((item) => !needle || productName(item).toLocaleLowerCase('fr').includes(needle))
      .slice(0, 80);
  }, [items, query]);

  const selectedItems = useMemo(() => (
    items.filter((item) => selectedIds.includes(productId(item)))
  ), [items, selectedIds]);

  const selectedTotalCents = selectedItems.reduce(
    (sum, item) => sum + Math.round(productPrice(item) * 100),
    0
  );
  const selectedDelivery = state.setup?.deliveryModes?.find((mode) => mode.id === deliveryModeId);
  const totalCents = selectedTotalCents + Number(selectedDelivery?.shippingCents || 0);
  const canMutate = mutationsEnabled && state.setup?.enabled === true;

  const toggleProduct = (id) => {
    setSelectedIds((current) => (
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length < 20 ? [...current, id] : current
    ));
  };

  const copyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setNotice(`Lien ${link.reference} copié.`);
    } catch {
      setNotice('Copie automatique impossible. Ouvrez le lien puis copiez son adresse.');
    }
  };

  const createLink = async (event) => {
    event.preventDefault();
    if (!canMutate || selectedItems.length === 0 || !deliveryModeId) return;
    setAction('create');
    setNotice('');
    try {
      const created = await createAdminPaymentLink({
        email: email.trim() || null,
        deliveryModeId,
        expiryMinutes,
        items: selectedItems.map((item) => ({
          productId: productId(item),
          collectionName: item.collectionName || 'furniture',
          variantId: item.variantId || null,
          quantity: 1,
        })),
      });
      setState((current) => ({ ...current, links: [created, ...current.links] }));
      setSelectedIds([]);
      setEmail('');
      await copyLink(created);
    } catch (error) {
      setNotice(error?.message || 'Création du lien impossible.');
    } finally {
      setAction('');
    }
  };

  const updateLink = async (orderId, kind, operation) => {
    setAction(`${kind}:${orderId}`);
    setNotice('');
    try {
      const updated = await operation();
      setState((current) => ({
        ...current,
        links: current.links.map((link) => link.orderId === orderId ? updated : link),
      }));
      if (kind === 'regenerate') await copyLink(updated);
      else setNotice(`Lien ${updated.reference} mis à jour.`);
    } catch (error) {
      setNotice(error?.message || 'Mise à jour impossible.');
    } finally {
      setAction('');
    }
  };

  const regenerate = (link) => {
    if (!window.confirm('Régénérer ce lien ? L’ancienne URL cessera immédiatement de fonctionner.')) return;
    void updateLink(link.orderId, 'regenerate', () => regenerateAdminPaymentLink(link.orderId));
  };

  const cancel = (link) => {
    if (!window.confirm('Annuler ce lien ? Stripe sera vérifié avant toute libération du stock.')) return;
    void updateLink(link.orderId, 'cancel', () => cancelAdminPaymentLink(link.orderId));
  };

  const recreate = async (link) => {
    if (!window.confirm('Créer un nouveau lien ? Le prix et le stock seront vérifiés et une nouvelle réservation sera créée.')) return;
    setAction(`recreate:${link.orderId}`);
    setNotice('');
    try {
      const created = await recreateAdminPaymentLink(link.orderId, 120);
      setState((current) => ({ ...current, links: [created, ...current.links] }));
      await copyLink(created);
    } catch (error) {
      setNotice(error?.message || 'Le nouveau lien ne peut pas être créé.');
    } finally {
      setAction('');
    }
  };

  const panel = darkMode ? 'border-white/10 bg-[#111111]' : 'border-stone-200 bg-white';
  const muted = darkMode ? 'text-stone-400' : 'text-stone-500';
  const field = darkMode
    ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-stone-600 focus:border-white/30'
    : 'border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:border-stone-500';

  return (
    <div className={`space-y-6 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
      <header className={`rounded-3xl border p-6 md:p-8 ${panel}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white'}`}>
                <Link2 size={20} />
              </span>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-[0.24em] ${muted}`}>Rail de secours</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] md:text-3xl">Liens de paiement</h2>
              </div>
            </div>
            <p className={`mt-5 max-w-2xl text-sm leading-6 ${muted}`}>
              Réservez des pièces et envoyez un paiement Stripe sans compte client. Prix, stock, expiration et rapprochement restent contrôlés par Seconde Vie.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={state.status === 'loading'}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-[10px] font-black uppercase tracking-[0.12em] transition ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-stone-200 hover:bg-stone-50'}`}
          >
            <RefreshCw size={14} className={state.status === 'loading' ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </header>

      {!canMutate && (
        <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'border-amber-300/20 bg-amber-300/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          <p>Création et pilotage désactivés par le contrôle commerce. Les liens existants restent visibles et copiables.</p>
        </div>
      )}

      {notice && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'border-white/10 bg-white/[0.04]' : 'border-stone-200 bg-stone-50'}`} aria-live="polite">
          {notice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.35fr)]">
        <form onSubmit={createLink} className={`rounded-3xl border p-5 md:p-6 ${panel}`}>
          <h3 className="text-lg font-black tracking-tight">Créer une demande</h3>
          <p className={`mt-1 text-xs leading-5 ${muted}`}>Le stock est réservé dès la création du lien.</p>

          <label className="mt-6 block">
            <span className={`text-[10px] font-black uppercase tracking-[0.12em] ${muted}`}>Rechercher un meuble</span>
            <span className="relative mt-2 block">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={`min-h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none transition ${field}`}
                placeholder="Nom de la pièce"
              />
            </span>
          </label>

          <div className={`mt-3 max-h-64 space-y-1 overflow-y-auto rounded-2xl border p-2 ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
            {selectableItems.length === 0 ? (
              <p className={`px-3 py-6 text-center text-xs ${muted}`}>Aucun meuble achetable trouvé.</p>
            ) : selectableItems.map((item) => {
              const id = productId(item);
              const checked = selectedIds.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleProduct(id)}
                  className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${checked ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white') : (darkMode ? 'hover:bg-white/5' : 'hover:bg-stone-50')}`}
                >
                  <span className="min-w-0">
                    <strong className="block truncate text-xs">{productName(item)}</strong>
                    <small className={`mt-0.5 block text-[10px] ${checked ? 'opacity-70' : muted}`}>Stock {productStock(item)}</small>
                  </span>
                  <span className="flex items-center gap-2">
                    <strong className="text-xs tabular-nums">{formatMoney(productPrice(item) * 100)}</strong>
                    <span className={`grid h-5 w-5 place-items-center rounded-md border ${checked ? 'border-current' : (darkMode ? 'border-white/20' : 'border-stone-300')}`}>
                      {checked ? <Check size={12} /> : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              <span className={`text-[10px] font-black uppercase tracking-[0.12em] ${muted}`}>Livraison</span>
              <select
                value={deliveryModeId}
                onChange={(event) => setDeliveryModeId(event.target.value)}
                className={`mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none ${field}`}
              >
                {(state.setup?.deliveryModes || []).map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {DELIVERY_LABELS[mode.id] || mode.id} · {formatMoney(mode.shippingCents)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={`text-[10px] font-black uppercase tracking-[0.12em] ${muted}`}>Validité</span>
              <select
                value={expiryMinutes}
                onChange={(event) => setExpiryMinutes(Number(event.target.value))}
                className={`mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none ${field}`}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 heure</option>
                <option value={120}>2 heures</option>
                <option value={240}>4 heures</option>
                <option value={1440}>24 heures</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className={`text-[10px] font-black uppercase tracking-[0.12em] ${muted}`}>E-mail à verrouiller · facultatif</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none ${field}`}
              placeholder="client@exemple.fr"
            />
          </label>

          <div className={`mt-5 rounded-2xl border px-4 py-3 ${darkMode ? 'border-white/10 bg-white/[0.035]' : 'border-stone-200 bg-stone-50'}`}>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className={muted}>{selectedItems.length} pièce{selectedItems.length > 1 ? 's' : ''}</span>
              <strong className="text-base tabular-nums">{formatMoney(totalCents)}</strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canMutate || selectedItems.length === 0 || !deliveryModeId || action === 'create'}
            className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-[0.12em] transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-45 ${darkMode ? 'bg-white text-stone-950 hover:bg-stone-200 focus-visible:ring-white' : 'bg-stone-950 text-white hover:bg-stone-800 focus-visible:ring-stone-950'}`}
          >
            {action === 'create' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {action === 'create' ? 'Réservation en cours…' : 'Créer et copier le lien'}
          </button>
        </form>

        <section className={`rounded-3xl border p-5 md:p-6 ${panel}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black tracking-tight">Registre des liens</h3>
              <p className={`mt-1 text-xs ${muted}`}>{state.links.length} demande{state.links.length > 1 ? 's' : ''} récente{state.links.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          {state.status === 'loading' ? (
            <div className={`mt-6 flex min-h-48 items-center justify-center gap-3 text-sm ${muted}`}>
              <Loader2 size={17} className="animate-spin" /> Chargement…
            </div>
          ) : state.error ? (
            <div className={`mt-6 flex items-start gap-3 rounded-2xl p-4 text-sm ${darkMode ? 'bg-red-400/10 text-red-200' : 'bg-red-50 text-red-700'}`}>
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p>{state.error}</p>
            </div>
          ) : state.links.length === 0 ? (
            <div className={`mt-6 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
              <Link2 size={24} className={muted} />
              <p className="mt-3 text-sm font-bold">Aucun lien envoyé</p>
              <p className={`mt-1 text-xs ${muted}`}>Sélectionnez une pièce pour créer la première demande.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {state.links.map((link) => {
                const active = ['active', 'ready_to_pay', 'payment_in_progress'].includes(link.status);
                return (
                  <article key={link.orderId} className={`rounded-2xl border p-4 ${darkMode ? 'border-white/10 bg-white/[0.025]' : 'border-stone-200 bg-stone-50/60'}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-xs tracking-wide">{link.reference}</strong>
                          <StatusPill darkMode={darkMode} status={link.status} />
                        </div>
                        <p className={`mt-2 truncate text-xs ${muted}`}>
                          {link.items.map((item) => item.title).join(' · ')}
                        </p>
                      </div>
                      <strong className="shrink-0 text-base tabular-nums">{formatMoney(link.totalCents)}</strong>
                    </div>

                    <dl className={`mt-4 grid gap-2 border-y py-3 text-[10px] sm:grid-cols-3 ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
                      <div><dt className={muted}>Client</dt><dd className="mt-1 truncate font-bold">{link.customerEmail || 'À renseigner'}</dd></div>
                      <div><dt className={muted}>Créé</dt><dd className="mt-1 font-bold">{formatDate(link.createdAt)}</dd></div>
                      <div><dt className={muted}>Expire</dt><dd className="mt-1 font-bold">{formatDate(link.expiresAt)}</dd></div>
                    </dl>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void copyLink(link)}
                        className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-[9px] font-black uppercase tracking-[0.1em] transition ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-stone-200 bg-white hover:border-stone-400'}`}
                      >
                        <Copy size={12} /> Copier
                      </button>
                      {active && (
                        <>
                          <button
                            type="button"
                            disabled={!canMutate || Boolean(action)}
                            onClick={() => void updateLink(link.orderId, 'extend', () => extendAdminPaymentLink(link.orderId, 120))}
                            className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-[9px] font-black uppercase tracking-[0.1em] transition disabled:opacity-40 ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-stone-200 bg-white hover:border-stone-400'}`}
                          >
                            {action === `extend:${link.orderId}` ? <Loader2 size={12} className="animate-spin" /> : <Clock3 size={12} />}
                            + 2 h
                          </button>
                          {link.status === 'active' && (
                            <button
                              type="button"
                              disabled={!canMutate || Boolean(action)}
                              onClick={() => regenerate(link)}
                              className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-[9px] font-black uppercase tracking-[0.1em] transition disabled:opacity-40 ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-stone-200 bg-white hover:border-stone-400'}`}
                            >
                              {action === `regenerate:${link.orderId}` ? <Loader2 size={12} className="animate-spin" /> : <RotateCw size={12} />}
                              Changer l’URL
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={!canMutate || Boolean(action)}
                            onClick={() => cancel(link)}
                            className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-[9px] font-black uppercase tracking-[0.1em] transition disabled:opacity-40 ${darkMode ? 'border-red-300/20 text-red-200 hover:bg-red-300/10' : 'border-red-200 bg-white text-red-700 hover:bg-red-50'}`}
                          >
                            {action === `cancel:${link.orderId}` ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                            Annuler
                          </button>
                        </>
                      )}
                      {!active && ['expired', 'canceled'].includes(link.status) && (
                        <button
                          type="button"
                          disabled={!canMutate || Boolean(action)}
                          onClick={() => void recreate(link)}
                          className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-[9px] font-black uppercase tracking-[0.1em] transition disabled:opacity-40 ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-stone-200 bg-white hover:border-stone-400'}`}
                        >
                          {action === `recreate:${link.orderId}` ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          Nouveau lien
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
