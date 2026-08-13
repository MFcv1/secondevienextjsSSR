import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Search, TicketPercent } from 'lucide-react';
import {
  adminSurfaces,
  EmptyState,
  Field,
  inputClass,
  LoadingPanel,
  Notice,
  PageHeader,
  Panel,
  StatusDot,
  Toggle,
} from './adminUiKit';
import {
  createPromotionCodeAdmin,
  listPromotionCodesAdmin,
  setPromotionCodeStatusAdmin,
} from './promotionCodeClient';

const toLocalInput = (date) => {
  const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60_000));
  return local.toISOString().slice(0, 16);
};

const initialForm = () => ({
  name: '',
  code: '',
  percentage: 10,
  scopeType: 'all',
  productIds: [],
  maxRedemptions: 100,
  maxPerCustomer: 1,
  minSubtotalEuros: 0,
  maxDiscountEuros: '',
  startsAt: toLocalInput(new Date()),
  expiresAt: toLocalInput(new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))),
});

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
  : '—';

export default function AdminPromotionCodes({ darkMode, items = [] }) {
  const surfaces = adminSurfaces(darkMode);
  const [promotions, setPromotions] = useState([]);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [productSearch, setProductSearch] = useState('');
  const [copied, setCopied] = useState(null);

  const load = async () => {
    setStatus('loading');
    try {
      const result = await listPromotionCodesAdmin();
      setPromotions(result.promotions || []);
      setStatus('ready');
    } catch (error) {
      setMessage({ tone: 'error', text: error?.message || 'Impossible de charger les codes.' });
      setStatus('error');
    }
  };

  useEffect(() => { void load(); }, []);

  const products = useMemo(() => items
    .filter((item) => {
      const haystack = `${item.name || item.title || ''} ${item.id || item.originalId || ''}`.toLowerCase();
      return haystack.includes(productSearch.toLowerCase());
    })
    .slice(0, 30), [items, productSearch]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleProduct = (productId) => setForm((current) => ({
    ...current,
    productIds: current.productIds.includes(productId)
      ? current.productIds.filter((id) => id !== productId)
      : [...current.productIds, productId],
  }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus('saving');
    setMessage(null);
    try {
      const result = await createPromotionCodeAdmin({
        ...form,
        code: form.code.trim() || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: new Date(form.expiresAt).toISOString(),
      });
      setPromotions((current) => [result.promotion, ...current]);
      setForm(initialForm());
      setProductSearch('');
      setMessage({ tone: 'success', text: `Le code ${result.promotion.code} est actif et vérifié côté serveur.` });
      setStatus('ready');
    } catch (error) {
      setMessage({ tone: 'error', text: error?.message || 'Le code n’a pas pu être créé.' });
      setStatus('ready');
    }
  };

  const toggleStatus = async (promotion, active) => {
    setMessage(null);
    try {
      const result = await setPromotionCodeStatusAdmin(promotion.code, active);
      setPromotions((current) => current.map((item) => (
        item.id === promotion.id ? result.promotion : item
      )));
    } catch (error) {
      setMessage({ tone: 'error', text: error?.message || 'Le statut n’a pas pu être modifié.' });
    }
  };

  const copy = async (promotion) => {
    await navigator.clipboard.writeText(promotion.code);
    setCopied(promotion.id);
    window.setTimeout(() => setCopied(null), 1400);
  };

  if (status === 'loading') return <LoadingPanel darkMode={darkMode} label="Chargement des codes promotionnels…" />;

  return (
    <div className="space-y-5">
      <PageHeader
        darkMode={darkMode}
        title="Codes promo"
        description="Créez des avantages bornés. Le serveur revalide le code, les produits, les limites et le montant avant Stripe."
        badge={<StatusDot darkMode={darkMode} label={`${promotions.filter((item) => item.status === 'active').length} actifs`} tone="emerald" />}
      />

      {message ? <Notice darkMode={darkMode} tone={message.tone}>{message.text}</Notice> : null}

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
        <Panel
          darkMode={darkMode}
          title="Nouveau code"
          description="Une utilisation est réservée avec la commande, puis consommée seulement après confirmation Stripe."
        >
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field darkMode={darkMode} htmlFor="promo-name" label="Nom interne">
                <input id="promo-name" className={inputClass(darkMode)} maxLength={120} onChange={(e) => setField('name', e.target.value)} placeholder="Vente privée août" required value={form.name} />
              </Field>
              <Field darkMode={darkMode} hint="Laissez vide pour un code sûr généré par le serveur." htmlFor="promo-code" label="Code public">
                <input id="promo-code" className={`${inputClass(darkMode)} uppercase`} maxLength={32} onChange={(e) => setField('code', e.target.value.toUpperCase())} placeholder="GÉNÉRÉ AUTOMATIQUEMENT" value={form.code} />
              </Field>
              <Field darkMode={darkMode} htmlFor="promo-percentage" label="Réduction (%)">
                <input id="promo-percentage" className={inputClass(darkMode)} max={50} min={1} onChange={(e) => setField('percentage', Number(e.target.value))} required type="number" value={form.percentage} />
              </Field>
              <Field darkMode={darkMode} htmlFor="promo-scope" label="Périmètre">
                <select id="promo-scope" className={inputClass(darkMode)} onChange={(e) => setField('scopeType', e.target.value)} value={form.scopeType}>
                  <option value="all">Tout le catalogue</option>
                  <option value="products">Produits sélectionnés</option>
                </select>
              </Field>
            </div>

            {form.scopeType === 'products' ? (
              <div className={`rounded-xl border p-3 ${surfaces.softPanel}`}>
                <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${surfaces.field}`}>
                  <Search size={14} />
                  <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" onChange={(e) => setProductSearch(e.target.value)} placeholder="Rechercher un produit" value={productSearch} />
                </label>
                <div className="mt-3 max-h-52 space-y-1 overflow-y-auto pr-1">
                  {products.map((product) => {
                    const id = String(product.originalId || product.id);
                    const selected = form.productIds.includes(id);
                    return (
                      <button className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${selected ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white') : surfaces.hoverRow}`} key={id} onClick={() => toggleProduct(id)} type="button">
                        <span className="truncate font-bold">{product.name || product.title || id}</span>
                        {selected ? <Check size={15} /> : <span className={`text-xs ${surfaces.faint}`}>Ajouter</span>}
                      </button>
                    );
                  })}
                </div>
                <p className={`mt-2 text-xs ${surfaces.muted}`}>{form.productIds.length} produit{form.productIds.length > 1 ? 's' : ''} sélectionné{form.productIds.length > 1 ? 's' : ''}</p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field darkMode={darkMode} htmlFor="promo-global-limit" label="Utilisations totales">
                <input id="promo-global-limit" className={inputClass(darkMode)} min={1} onChange={(e) => setField('maxRedemptions', Number(e.target.value))} required type="number" value={form.maxRedemptions} />
              </Field>
              <Field darkMode={darkMode} htmlFor="promo-customer-limit" label="Par client">
                <input id="promo-customer-limit" className={inputClass(darkMode)} min={1} onChange={(e) => setField('maxPerCustomer', Number(e.target.value))} required type="number" value={form.maxPerCustomer} />
              </Field>
              <Field darkMode={darkMode} htmlFor="promo-minimum" label="Minimum éligible (€)">
                <input id="promo-minimum" className={inputClass(darkMode)} min={0} onChange={(e) => setField('minSubtotalEuros', Number(e.target.value))} step="0.01" type="number" value={form.minSubtotalEuros} />
              </Field>
              <Field darkMode={darkMode} hint="Optionnel." htmlFor="promo-cap" label="Plafond de remise (€)">
                <input id="promo-cap" className={inputClass(darkMode)} min={0.01} onChange={(e) => setField('maxDiscountEuros', e.target.value)} step="0.01" type="number" value={form.maxDiscountEuros} />
              </Field>
              <Field darkMode={darkMode} htmlFor="promo-start" label="Début">
                <input id="promo-start" className={inputClass(darkMode)} onChange={(e) => setField('startsAt', e.target.value)} required type="datetime-local" value={form.startsAt} />
              </Field>
              <Field darkMode={darkMode} htmlFor="promo-end" label="Expiration">
                <input id="promo-end" className={inputClass(darkMode)} onChange={(e) => setField('expiresAt', e.target.value)} required type="datetime-local" value={form.expiresAt} />
              </Field>
            </div>

            <button className={`min-h-11 w-full rounded-xl px-4 text-sm font-black transition active:translate-y-px disabled:opacity-50 ${surfaces.primaryButton}`} disabled={status === 'saving' || (form.scopeType === 'products' && form.productIds.length === 0)} type="submit">
              {status === 'saving' ? 'Création sécurisée…' : 'Créer et activer le code'}
            </button>
          </form>
        </Panel>

        <Panel darkMode={darkMode} title="Codes disponibles" description="Les compteurs distinguent les checkouts réservés des paiements confirmés.">
          {promotions.length === 0 ? (
            <EmptyState darkMode={darkMode} description="Créez le premier code depuis le formulaire." icon={<TicketPercent size={26} />} title="Aucun code" />
          ) : (
            <div className={`divide-y ${surfaces.hairline}`}>
              {promotions.map((promotion) => (
                <article className="grid gap-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" key={promotion.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="inline-flex items-center gap-1.5 font-mono text-sm font-black tracking-wide" onClick={() => void copy(promotion)} title="Copier le code" type="button">
                        {promotion.code} {copied === promotion.id ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                      <StatusDot darkMode={darkMode} label={promotion.status === 'active' ? 'Actif' : 'Inactif'} tone={promotion.status === 'active' ? 'emerald' : 'stone'} />
                      <StatusDot darkMode={darkMode} label={promotion.source === 'newsletter' ? 'Newsletter' : 'Manuel'} tone="sky" />
                    </div>
                    <p className="mt-2 truncate text-sm font-black">{promotion.name}</p>
                    <p className={`mt-1 text-xs leading-5 ${surfaces.muted}`}>
                      {promotion.percentage} % · {promotion.scopeType === 'all' ? 'tout le catalogue' : `${promotion.productIds.length} produit(s)`} · {promotion.committed}/{promotion.maxRedemptions} utilisés · {promotion.reserved} réservés · expire le {formatDate(promotion.expiresAt)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 lg:justify-end">
                    <span className={`text-xs font-semibold ${surfaces.muted}`}>{promotion.status === 'active' ? 'Disponible' : 'Suspendu'}</span>
                    <Toggle checked={promotion.status === 'active'} id={`promotion-${promotion.id}`} label={`Activer ${promotion.code}`} onChange={(active) => void toggleStatus(promotion, active)} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
