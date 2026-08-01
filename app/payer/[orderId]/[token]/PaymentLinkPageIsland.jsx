'use client';

import { Elements } from '@stripe/react-stripe-js';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import CheckoutPaymentStep from '../../../../src/kit/commerce/CheckoutPaymentStep';
import {
  getAdminPaymentLinkPublic,
  prepareAdminPaymentLinkPayment,
  resumeAdminPaymentLinkPayment,
} from '../../../../src/kit/commerce/adminPaymentLinkClient';
import { getStripePromise, isStripeConfigured } from '../../../../src/kit/config/stripe';

const formatMoney = (amountCents) => new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
}).format(Number(amountCents || 0) / 100);

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
};

const terminalCopy = {
  paid: {
    icon: CheckCircle2,
    eyebrow: 'Paiement confirmé',
    title: 'Merci, votre commande est enregistrée.',
    body: 'L’atelier a reçu la confirmation Stripe. Un e-mail récapitulatif vous sera envoyé à l’adresse indiquée.',
  },
  expired: {
    icon: Clock3,
    eyebrow: 'Lien expiré',
    title: 'Cette réservation n’est plus active.',
    body: 'Contactez l’atelier pour vérifier la disponibilité des pièces et recevoir un nouveau lien.',
  },
  canceled: {
    icon: AlertCircle,
    eyebrow: 'Lien annulé',
    title: 'Cette demande a été annulée.',
    body: 'Aucun nouveau paiement ne peut être effectué avec cette adresse. Contactez l’atelier si nécessaire.',
  },
  needs_review: {
    icon: AlertCircle,
    eyebrow: 'Vérification en cours',
    title: 'L’atelier vérifie cette demande.',
    body: 'Ne tentez pas un second paiement. Nous rapprochons l’état de la commande avec Stripe.',
  },
};

function Summary({ data }) {
  return (
    <aside className="bg-[#20201e] px-5 py-7 text-stone-100 sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col lg:px-[clamp(3rem,5vw,6rem)] lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-300">Seconde Vie</span>
        <span className="text-[11px] font-medium text-stone-500">{data.reference}</span>
      </div>
      <div className="my-10 lg:my-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Commande réservée</p>
        <h1 className="mt-3 max-w-[13ch] text-[2.25rem] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-[clamp(3rem,4.8vw,5rem)]">
          Votre pièce vous attend.
        </h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-stone-400">
          Vérifiez vos coordonnées puis réglez directement avec Stripe. Aucun compte Seconde Vie n’est nécessaire.
        </p>

        <div className="mt-8 border-y border-white/10 py-2">
          {data.items.map((item) => (
            <div key={item.lineId} className="flex items-start justify-between gap-5 border-b border-white/[0.07] py-4 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-xs text-stone-500">Quantité {item.quantity}</p>
              </div>
              <strong className="shrink-0 text-sm tabular-nums">{formatMoney(item.totalCents)}</strong>
            </div>
          ))}
          <div className="flex items-center justify-between gap-5 py-4 text-sm text-stone-400">
            <span>Livraison</span>
            <span className="tabular-nums">{formatMoney(data.shippingCents)}</span>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-5">
          <span className="pb-1 text-sm text-stone-400">Total à régler</span>
          <strong className="text-4xl font-semibold tracking-[-0.04em] tabular-nums text-white">{formatMoney(data.totalCents)}</strong>
        </div>
        <div className="mt-7 flex items-start gap-3 rounded-xl border border-white/10 px-4 py-3 text-xs leading-5 text-stone-400">
          <Clock3 size={15} className="mt-0.5 shrink-0 text-stone-300" />
          <span>Réservation valable jusqu’au {formatDate(data.expiresAt)}.</span>
        </div>
      </div>
      <p className="text-xs leading-5 text-stone-500">Paiement traité par Stripe. Seconde Vie ne stocke aucune donnée bancaire.</p>
    </aside>
  );
}

function TerminalState({ status }) {
  const copy = terminalCopy[status] || terminalCopy.needs_review;
  const Icon = copy.icon;
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-12 sm:px-8 lg:min-h-screen">
      <div className="w-full max-w-xl">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-stone-900 text-white">
          <Icon size={24} />
        </span>
        <p className="mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">{copy.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl">{copy.title}</h2>
        <p className="mt-4 max-w-lg text-sm leading-6 text-stone-600">{copy.body}</p>
        <Link href="/" className="mt-8 inline-flex min-h-11 items-center rounded-xl border border-stone-300 px-5 text-xs font-bold text-stone-800 transition hover:border-stone-600">
          Retour à la galerie
        </Link>
      </div>
    </div>
  );
}

export default function PaymentLinkPageIsland({ orderId, token }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });
  const [payment, setPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    postalCode: '',
    city: '',
    country: 'FR',
  });

  const load = useCallback(async () => {
    try {
      const data = await getAdminPaymentLinkPublic(orderId, token);
      setState({ status: 'ready', data, error: '' });
      return data;
    } catch (error) {
      setState({
        status: 'error',
        data: null,
        error: error?.message || 'Ce lien de paiement est introuvable.',
      });
      return null;
    }
  }, [orderId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const waitForConfirmation = useCallback(async () => {
    setVerifying(true);
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      const data = await load();
      if (!data || ['paid', 'expired', 'canceled', 'needs_review'].includes(data.status)) {
        setVerifying(false);
        return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 1800));
    }
    setVerifying(false);
  }, [load]);

  useEffect(() => {
    if (state.data?.status === 'payment_in_progress') {
      void waitForConfirmation();
    }
  }, [state.data?.status, waitForConfirmation]);

  const startPayment = async (event) => {
    event?.preventDefault?.();
    setSubmitting(true);
    setState((current) => ({ ...current, error: '' }));
    try {
      const result = state.data?.status === 'ready_to_pay'
        ? await resumeAdminPaymentLinkPayment(orderId, token)
        : await prepareAdminPaymentLinkPayment({
          orderId,
          token,
          email: form.email,
          shippingAddress: {
            fullName: form.fullName,
            phone: form.phone,
            line1: form.line1,
            line2: form.line2,
            postalCode: form.postalCode,
            city: form.city,
            country: form.country,
          },
        });
      setPayment(result);
      await load();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error?.message || 'Le paiement ne peut pas être préparé.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const stripePromise = useMemo(() => (
    payment?.connectedAccountId ? getStripePromise(payment.connectedAccountId) : null
  ), [payment?.connectedAccountId]);

  const elementsOptions = useMemo(() => payment?.clientSecret ? ({
    clientSecret: payment.clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#1c1917',
        colorText: '#1c1917',
        colorBackground: '#ffffff',
        colorDanger: '#b91c1c',
        borderRadius: '10px',
        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      },
    },
  }) : null, [payment?.clientSecret]);

  const returnPath = useMemo(() => (
    `/payer/${encodeURIComponent(orderId)}/${encodeURIComponent(token)}`
  ), [orderId, token]);

  if (state.status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f4ef] text-stone-700">
        <div className="flex items-center gap-3 text-sm font-semibold"><Loader2 size={18} className="animate-spin" /> Préparation du lien sécurisé…</div>
      </main>
    );
  }

  if (state.status === 'error' && !state.data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f4ef] px-6 text-stone-900">
        <div className="max-w-lg text-center">
          <AlertCircle className="mx-auto" size={34} />
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">Lien indisponible</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">{state.error}</p>
        </div>
      </main>
    );
  }

  const data = state.data;
  const terminal = ['paid', 'expired', 'canceled', 'needs_review'].includes(data.status);

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-stone-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(22rem,40vw)_minmax(0,1fr)]">
        <Summary data={data} />
        {terminal ? <TerminalState status={data.status} /> : (
          <section className="px-5 py-8 sm:px-8 lg:px-[clamp(3rem,7vw,8rem)] lg:py-12">
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center gap-3 border-b border-stone-200 pb-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-stone-900 text-white"><LockKeyhole size={17} /></span>
                <div>
                  <p className="text-sm font-semibold">Paiement privé</p>
                  <p className="mt-0.5 text-xs text-stone-500">Ce lien est unique et peut être révoqué par l’atelier.</p>
                </div>
              </div>

              {state.error && (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" /> {state.error}
                </div>
              )}

              {verifying ? (
                <div className="flex min-h-[28rem] flex-col items-center justify-center text-center">
                  <span className="relative grid h-14 w-14 place-items-center rounded-full bg-stone-900 text-white">
                    <PackageCheck size={23} />
                    <span className="absolute inset-0 animate-ping rounded-full border border-stone-900 opacity-20 motion-reduce:animate-none" />
                  </span>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight">Confirmation du paiement</h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-stone-600">Stripe confirme la transaction à l’atelier. Ne rechargez pas et ne tentez pas un second paiement.</p>
                </div>
              ) : payment && stripePromise && elementsOptions ? (
                <div className="mt-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Dernière étape</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Régler avec Stripe</h2>
                  <div className="mt-7">
                    <Elements key={payment.clientSecret} stripe={stripePromise} options={elementsOptions}>
                      <CheckoutPaymentStep
                        total={data.totalCents / 100}
                        orderId={orderId}
                        returnPath={returnPath}
                        onPaymentSuccess={() => void waitForConfirmation()}
                      />
                    </Elements>
                  </div>
                </div>
              ) : data.status === 'ready_to_pay' ? (
                <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
                  <ShieldCheck size={24} />
                  <h2 className="mt-5 text-2xl font-semibold tracking-tight">Vos coordonnées sont enregistrées</h2>
                  <p className="mt-3 text-sm leading-6 text-stone-600">Reprenez le même paiement Stripe. Aucun nouveau stock ni aucune nouvelle commande ne sera créé.</p>
                  <button
                    type="button"
                    disabled={submitting || !isStripeConfigured}
                    onClick={startPayment}
                    className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <LockKeyhole size={16} />}
                    Reprendre le paiement
                  </button>
                </div>
              ) : (
                <form onSubmit={startPayment} className="mt-7 space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Coordonnées</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Où préparer la livraison ?</h2>
                    <p className="mt-3 text-sm leading-6 text-stone-600">Ces informations sont rattachées à la commande et transmises à l’atelier après paiement.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="text-xs font-semibold text-stone-700">Nom et prénom</span>
                      <input required maxLength={120} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10" autoComplete="name" />
                    </label>
                    <label>
                      <span className="text-xs font-semibold text-stone-700">E-mail</span>
                      <input required type="email" maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder={data.emailLocked ? data.emailHint : 'vous@exemple.fr'} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10" autoComplete="email" />
                      {data.emailLocked ? <small className="mt-1.5 block text-[10px] text-stone-500">Utilisez l’adresse indiquée par l’atelier : {data.emailHint}</small> : null}
                    </label>
                    <label>
                      <span className="text-xs font-semibold text-stone-700">Téléphone</span>
                      <input maxLength={40} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10" autoComplete="tel" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="text-xs font-semibold text-stone-700">Adresse</span>
                      <input required maxLength={160} value={form.line1} onChange={(event) => setForm({ ...form, line1: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10" autoComplete="address-line1" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="text-xs font-semibold text-stone-700">Complément d’adresse · facultatif</span>
                      <input maxLength={160} value={form.line2} onChange={(event) => setForm({ ...form, line2: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10" autoComplete="address-line2" />
                    </label>
                    <label>
                      <span className="text-xs font-semibold text-stone-700">Code postal</span>
                      <input required maxLength={12} value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10" autoComplete="postal-code" />
                    </label>
                    <label>
                      <span className="text-xs font-semibold text-stone-700">Ville</span>
                      <input required maxLength={120} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10" autoComplete="address-level2" />
                    </label>
                    <label>
                      <span className="text-xs font-semibold text-stone-700">Pays</span>
                      <select value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10" autoComplete="country">
                        <option value="FR">France</option>
                      </select>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !isStripeConfigured}
                    className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={17} className="animate-spin" /> : <LockKeyhole size={17} />}
                    {submitting ? 'Réservation vérifiée…' : `Continuer · ${formatMoney(data.totalCents)}`}
                  </button>
                </form>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
