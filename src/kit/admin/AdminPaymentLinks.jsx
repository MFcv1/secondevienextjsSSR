'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
} from 'lucide-react';
import {
  adminSurfaces,
  Field,
  focusRingWithin,
  inputClass,
  Notice,
  PageHeader,
  Panel,
  StatusDot,
} from './adminUiKit';
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
  active: { label: 'Coordonnées attendues', tone: 'amber' },
  ready_to_pay: { label: 'Prêt à payer', tone: 'sky' },
  payment_in_progress: { label: 'Paiement en cours', tone: 'sky' },
  paid: { label: 'Payé', tone: 'emerald' },
  expired: { label: 'Expiré', tone: 'stone' },
  canceled: { label: 'Annulé', tone: 'red' },
  needs_review: { label: 'À vérifier', tone: 'red' },
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
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
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


  const surfaces = adminSurfaces(darkMode);
  const field = inputClass(darkMode);
  const rowButton = `inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 ${surfaces.secondaryButton}`;

  return (
    <div className="space-y-5">
      <PageHeader
        darkMode={darkMode}
        description="Réservez des pièces et envoyez un paiement Stripe sans compte client. Prix, stock et expiration restent contrôlés par Seconde Vie."
        title="Liens de paiement"
        actions={(
          <button
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${surfaces.secondaryButton}`}
            disabled={state.status === 'loading'}
            onClick={() => void refresh()}
            type="button"
          >
            <RefreshCw className={state.status === 'loading' ? 'animate-spin' : ''} size={15} />
            Actualiser
          </button>
        )}
      />

      {!canMutate ? (
        <Notice darkMode={darkMode} tone="warning">
          Création et pilotage désactivés par le contrôle commerce. Les liens existants restent visibles et copiables.
        </Notice>
      ) : null}

      {notice ? (
        <div aria-live="polite">
          <Notice darkMode={darkMode}>{notice}</Notice>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)] xl:items-start">
        <form onSubmit={createLink}>
          <Panel
            darkMode={darkMode}
            description="Le stock est réservé dès la création du lien."
            title="Créer une demande"
            footer={(
              <>
                <p className={`text-xs ${surfaces.muted}`}>
                  {selectedItems.length} pièce{selectedItems.length > 1 ? 's' : ''} ·{' '}
                  <span className={`font-bold tabular-nums ${darkMode ? 'text-white' : 'text-stone-950'}`}>
                    {formatMoney(totalCents)}
                  </span>
                </p>
                <button
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${surfaces.primaryButton}`}
                  disabled={!canMutate || selectedItems.length === 0 || !deliveryModeId || action === 'create'}
                  type="submit"
                >
                  {action === 'create' ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
                  {action === 'create' ? 'Réservation…' : 'Créer et copier'}
                </button>
              </>
            )}
          >
            <div className="space-y-4">
              <div className="min-w-0">
                <label className="block text-sm font-bold" htmlFor="payment-link-search">Pièces à réserver</label>
                <label
                  className={`mt-2 flex items-center gap-2.5 rounded-lg border px-3 py-2.5 ${surfaces.field} ${focusRingWithin}`}
                  htmlFor="payment-link-search"
                >
                  <Search className="shrink-0" size={15} />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                    id="payment-link-search"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Rechercher un meuble…"
                    value={query}
                  />
                </label>

                <div className={`mt-2 max-h-56 overflow-y-auto rounded-lg border ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
                  {selectableItems.length === 0 ? (
                    <p className={`px-3 py-8 text-center text-xs ${surfaces.muted}`}>Aucun meuble achetable trouvé.</p>
                  ) : (
                    <div className={`divide-y ${surfaces.hairline}`}>
                      {selectableItems.map((item) => {
                        const id = productId(item);
                        const checked = selectedIds.includes(id);
                        return (
                          <button
                            className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5 text-left transition ${checked ? (darkMode ? 'bg-white/[0.06]' : 'bg-stone-100') : surfaces.hoverRow}`}
                            key={id}
                            onClick={() => toggleProduct(id)}
                            type="button"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold tracking-tight">{productName(item)}</span>
                              <span className={`mt-0.5 block text-xs ${surfaces.muted}`}>Stock {productStock(item)}</span>
                            </span>
                            <span className="flex items-center gap-2.5">
                              <span className="text-sm font-bold tabular-nums">{formatMoney(productPrice(item) * 100)}</span>
                              <span
                                className={`grid h-[18px] w-[18px] place-items-center rounded-[6px] border transition ${
                                  checked
                                    ? (darkMode ? 'border-white bg-white text-stone-950' : 'border-stone-950 bg-stone-950 text-white')
                                    : (darkMode ? 'border-white/20' : 'border-stone-300')
                                }`}
                              >
                                {checked ? <Check size={12} strokeWidth={3} /> : null}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field darkMode={darkMode} htmlFor="payment-link-delivery" label="Livraison">
                  <select
                    className={field}
                    id="payment-link-delivery"
                    onChange={(event) => setDeliveryModeId(event.target.value)}
                    value={deliveryModeId}
                  >
                    {(state.setup?.deliveryModes || []).map((mode) => (
                      <option key={mode.id} value={mode.id}>
                        {DELIVERY_LABELS[mode.id] || mode.id} · {formatMoney(mode.shippingCents)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field darkMode={darkMode} htmlFor="payment-link-expiry" label="Validité">
                  <select
                    className={field}
                    id="payment-link-expiry"
                    onChange={(event) => setExpiryMinutes(Number(event.target.value))}
                    value={expiryMinutes}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 heure</option>
                    <option value={120}>2 heures</option>
                    <option value={240}>4 heures</option>
                    <option value={1440}>24 heures</option>
                  </select>
                </Field>
              </div>

              <Field
                darkMode={darkMode}
                hint="Laissez vide pour un lien ouvert à toute adresse."
                htmlFor="payment-link-email"
                label="E-mail à verrouiller"
              >
                <input
                  className={field}
                  id="payment-link-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="client@exemple.fr"
                  type="email"
                  value={email}
                />
              </Field>
            </div>
          </Panel>
        </form>

        <section className={`overflow-hidden rounded-2xl border ${surfaces.panel}`}>
          <div className={`flex items-center justify-between border-b px-5 py-3.5 ${surfaces.divider}`}>
            <div className="min-w-0">
              <h3 className="text-sm font-black tracking-tight">Registre des liens</h3>
              <p className={`mt-1 text-xs ${surfaces.muted}`}>Demandes envoyées les plus récentes.</p>
            </div>
            <span className={`shrink-0 text-xs tabular-nums ${surfaces.muted}`}>{state.links.length}</span>
          </div>

          {state.status === 'loading' ? (
            <div className={`flex min-h-40 items-center justify-center gap-3 text-sm font-semibold ${surfaces.muted}`}>
              <Loader2 className="animate-spin" size={16} /> Chargement…
            </div>
          ) : state.error ? (
            <div className="p-5">
              <Notice darkMode={darkMode} tone="error">{state.error}</Notice>
            </div>
          ) : state.links.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className={`mb-3 flex justify-center ${surfaces.faint}`}><Link2 size={24} /></div>
              <p className="text-sm font-black">Aucun lien envoyé</p>
              <p className={`mt-1 text-sm ${surfaces.muted}`}>Sélectionnez une pièce pour créer la première demande.</p>
            </div>
          ) : (
            <div className={`divide-y ${surfaces.hairline}`}>
              {state.links.map((link) => {
                const active = ['active', 'ready_to_pay', 'payment_in_progress'].includes(link.status);
                const copy = STATUS[link.status] || { label: link.status || 'Inconnu', tone: 'stone' };
                return (
                  <article className={`px-5 py-4 transition ${surfaces.hoverRow}`} key={link.orderId}>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="truncate text-sm font-black tracking-tight">{link.reference}</span>
                        <StatusDot darkMode={darkMode} label={copy.label} tone={copy.tone} />
                      </div>
                      <span className="shrink-0 text-sm font-black tabular-nums">{formatMoney(link.totalCents)}</span>
                    </div>

                    <p className={`mt-1 truncate text-xs ${surfaces.muted}`}>
                      {link.items.map((item) => item.title).join(' · ')}
                    </p>

                    <dl className={`mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs ${surfaces.muted}`}>
                      <div className="flex min-w-0 gap-1.5">
                        <dt>Client</dt>
                        <dd className="truncate font-semibold">{link.customerEmail || 'à renseigner'}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>Créé</dt>
                        <dd className="font-semibold tabular-nums">{formatDate(link.createdAt)}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>Expire</dt>
                        <dd className="font-semibold tabular-nums">{formatDate(link.expiresAt)}</dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className={rowButton} onClick={() => void copyLink(link)} type="button">
                        <Copy size={13} /> Copier
                      </button>
                      {active ? (
                        <>
                          <button
                            className={rowButton}
                            disabled={!canMutate || Boolean(action)}
                            onClick={() => void updateLink(link.orderId, 'extend', () => extendAdminPaymentLink(link.orderId, 120))}
                            type="button"
                          >
                            {action === `extend:${link.orderId}` ? <Loader2 className="animate-spin" size={13} /> : <Clock3 size={13} />}
                            + 2 h
                          </button>
                          {link.status === 'active' ? (
                            <button
                              className={rowButton}
                              disabled={!canMutate || Boolean(action)}
                              onClick={() => regenerate(link)}
                              type="button"
                            >
                              {action === `regenerate:${link.orderId}` ? <Loader2 className="animate-spin" size={13} /> : <RotateCw size={13} />}
                              Changer l’URL
                            </button>
                          ) : null}
                          <button
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 ${darkMode ? 'border-red-500/20 text-red-300 hover:bg-red-500/10' : 'border-red-100 text-red-700 hover:bg-red-50'}`}
                            disabled={!canMutate || Boolean(action)}
                            onClick={() => cancel(link)}
                            type="button"
                          >
                            {action === `cancel:${link.orderId}` ? <Loader2 className="animate-spin" size={13} /> : <Ban size={13} />}
                            Annuler
                          </button>
                        </>
                      ) : null}
                      {!active && ['expired', 'canceled'].includes(link.status) ? (
                        <button
                          className={rowButton}
                          disabled={!canMutate || Boolean(action)}
                          onClick={() => void recreate(link)}
                          type="button"
                        >
                          {action === `recreate:${link.orderId}` ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
                          Nouveau lien
                        </button>
                      ) : null}
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
