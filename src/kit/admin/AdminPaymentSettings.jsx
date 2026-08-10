import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import {
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    Landmark,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
    Wallet
} from 'lucide-react';
import { db } from '../config/firebase';
import { getCallableFunction } from '../config/firebaseLazy';
import { COMMERCE_V2_UI_ENABLED } from '../commerce/commerceUiFlags';
import { useAuth } from '../contexts/AuthContext';
import {
    adminSurfaces,
    Field,
    LoadingPanel,
    Notice,
    PageHeader,
    Panel,
    StatusDot,
    inputClass
} from './adminUiKit';

const statusCopy = {
    not_connected: {
        label: 'Non connecté',
        tone: 'stone',
        description: 'Aucun compte Stripe Connect actif. Terminez la configuration pour activer les paiements sur la boutique.'
    },
    action_required: {
        label: 'Configuration à terminer',
        tone: 'amber',
        description: 'La cliente doit terminer les informations légales ou bancaires dans Stripe.'
    },
    pending_review: {
        label: 'En vérification',
        tone: 'amber',
        description: 'Stripe analyse le compte. Les paiements carte restent bloqués tant que Stripe ne valide pas.'
    },
    active: {
        label: 'Paiements actifs',
        tone: 'emerald',
        description: 'Le compte Stripe connecté peut encaisser les paiements.'
    }
};

const getToneClass = (tone, darkMode) => {
    if (tone === 'emerald') return darkMode ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700';
    if (tone === 'amber') return darkMode ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700';
    return darkMode ? 'bg-white/8 text-stone-300' : 'bg-stone-100 text-stone-600';
};

const AdminPaymentSettings = ({ darkMode }) => {
    const { isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stripeEnabled, setStripeEnabled] = useState(true);
    const [connectLoading, setConnectLoading] = useState(true);
    const [connectAction, setConnectAction] = useState('');
    const [connectError, setConnectError] = useState('');
    const [connectRedirecting, setConnectRedirecting] = useState(false);
    const [connectState, setConnectState] = useState({ status: 'not_connected' });
    const [reconnectRequestText, setReconnectRequestText] = useState('');
    const [reconnectConfirmText, setReconnectConfirmText] = useState('');

    const refreshConnectStatus = async ({ silent = false } = {}) => {
        if (!silent) setConnectAction('sync');
        setConnectError('');
        try {
            const getStatus = await getCallableFunction('getStripeConnectStatus');
            const result = await getStatus();
            setConnectState(result.data?.connect || { status: 'not_connected' });
        } catch (error) {
            console.error('Stripe Connect status error:', error);
            setConnectError(error.message || 'Lecture Stripe Connect impossible.');
        } finally {
            setConnectLoading(false);
            if (!silent) setConnectAction('');
        }
    };

    const syncConnectAccount = async ({ action = 'sync', clearReturnParam = false } = {}) => {
        setConnectAction(action);
        setConnectError('');
        try {
            const syncAccount = await getCallableFunction('syncStripeConnectAccount');
            const result = await syncAccount();
            setConnectState(result.data?.connect || { status: 'not_connected' });
            if (clearReturnParam && typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('stripe_connect');
                window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
            }
        } catch (error) {
            console.error('Stripe Connect sync error:', error);
            setConnectError(error.message || 'Synchronisation Stripe impossible.');
        } finally {
            setConnectLoading(false);
            setConnectAction('');
        }
    };

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'sys_metadata', 'payment_settings'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setStripeEnabled(COMMERCE_V2_UI_ENABLED || data.stripeEnabled !== false);
            }
            setLoading(false);
        }, (err) => {
            console.error('Payment settings listener error:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        refreshConnectStatus({ silent: true });
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('stripe_connect') === 'return' || params.get('stripe_connect') === 'refresh') {
                window.setTimeout(() => {
                    syncConnectAccount({ action: 'return-sync', clearReturnParam: true });
                }, 400);
            }
        }
    }, []);

    const startConnect = async () => {
        let redirectingToStripe = false;
        setConnectAction('connect');
        setConnectRedirecting(false);
        setConnectError('');
        try {
            const startOnboarding = await getCallableFunction('startStripeConnectOnboarding');
            const result = await startOnboarding({ origin: window.location.origin });
            if (result.data?.url) {
                redirectingToStripe = true;
                setConnectRedirecting(true);
                window.location.href = result.data.url;
                return;
            }
            throw new Error('Lien Stripe Connect manquant.');
        } catch (error) {
            console.error('Stripe Connect onboarding error:', error);
            setConnectError(error.message || 'Demarrage Stripe Connect impossible.');
        } finally {
            if (!redirectingToStripe) setConnectAction('');
        }
    };

    const syncConnect = async () => {
        await syncConnectAccount({ action: 'sync' });
    };

    const requestReconnect = async () => {
        setConnectAction('request-reconnect');
        setConnectError('');
        try {
            const requestFn = await getCallableFunction('requestStripeConnectReconnect');
            await requestFn({ confirmText: reconnectRequestText });
            setReconnectRequestText('');
            await refreshConnectStatus({ silent: true });
        } catch (error) {
            console.error('Stripe Connect reconnect request error:', error);
            setConnectError(error.message || 'Demande de changement impossible.');
        } finally {
            setConnectAction('');
        }
    };

    const confirmReconnect = async () => {
        setConnectAction('confirm-reconnect');
        setConnectError('');
        try {
            const confirmFn = await getCallableFunction('confirmStripeConnectReconnect');
            const result = await confirmFn({ confirmText: reconnectConfirmText });
            setReconnectConfirmText('');
            setConnectState(result.data?.connect || { status: 'not_connected' });
        } catch (error) {
            console.error('Stripe Connect reconnect confirm error:', error);
            setConnectError(error.message || 'Activation du nouveau compte impossible.');
        } finally {
            setConnectAction('');
        }
    };

    const surfaces = adminSurfaces(darkMode);
    const field = inputClass(darkMode);

    if (loading) return <LoadingPanel darkMode={darkMode} label="Chargement des paramètres de paiement…" />;

    const connectCopy = statusCopy[connectState.status] || statusCopy.not_connected;
    const stripeReady = connectState.chargesEnabled === true || connectState.status === 'not_connected';
    const stripeDashboardUrl = connectState.livemode
        ? 'https://dashboard.stripe.com'
        : 'https://dashboard.stripe.com/test/dashboard';

    return (
        <div className="space-y-5">
            <PageHeader
                darkMode={darkMode}
                description="Stripe Connect, carte, wallets et virement."
                title="Paiement"
                actions={(
                    <button
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${surfaces.secondaryButton}`}
                        disabled={Boolean(connectAction) || connectLoading}
                        onClick={syncConnect}
                        type="button"
                    >
                        <RefreshCw className={connectAction === 'sync' ? 'animate-spin' : ''} size={15} />
                        Synchroniser
                    </button>
                )}
            />

            {connectAction === 'connect' || connectAction === 'return-sync' ? (
                <Notice darkMode={darkMode}>
                    <span className="flex items-center gap-2">
                        <RefreshCw className="animate-spin" size={15} />
                        {connectAction === 'return-sync'
                            ? 'Finalisation de la connexion Stripe…'
                            : connectRedirecting ? 'Redirection vers Stripe…' : 'Préparation de la connexion Stripe…'}
                    </span>
                </Notice>
            ) : null}

            {connectError ? (
                <Notice darkMode={darkMode} tone="error">
                    <span className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 shrink-0" size={16} />
                        {connectError}
                    </span>
                </Notice>
            ) : null}

            <Panel
                darkMode={darkMode}
                description="Encaissement direct sur le compte de la cliente."
                title="Stripe Connect"
                actions={<StatusDot darkMode={darkMode} label={connectCopy.label} tone={connectCopy.tone} />}
                footer={(
                    <>
                        <p className={`text-xs ${surfaces.muted}`}>
                            {connectState.livemode ? 'Compte en mode réel.' : 'Compte en mode test.'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {connectState.hasActiveAccount ? (
                                <a
                                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition active:translate-y-px ${surfaces.secondaryButton}`}
                                    href={stripeDashboardUrl}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    <ExternalLink size={15} />
                                    Tableau de bord Stripe
                                </a>
                            ) : null}
                            {isAdmin ? (
                                <button
                                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${surfaces.primaryButton}`}
                                    disabled={Boolean(connectAction)}
                                    onClick={startConnect}
                                    type="button"
                                >
                                    {connectAction === 'connect'
                                        ? <RefreshCw className="animate-spin" size={15} />
                                        : <ExternalLink size={15} />}
                                    {connectAction === 'connect'
                                        ? (connectRedirecting ? 'Redirection…' : 'Préparation…')
                                        : connectState.hasPendingAccount
                                            ? 'Continuer la configuration'
                                            : connectState.hasActiveAccount ? 'Connecter un autre compte' : 'Connecter Stripe'}
                                </button>
                            ) : null}
                        </div>
                    </>
                )}
            >
                <div className="flex items-start gap-3">
                    <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${getToneClass(connectCopy.tone, darkMode)}`}>
                        {connectState.chargesEnabled ? <CheckCircle2 size={17} /> : <LockKeyhole size={17} />}
                    </span>
                    <p className={`max-w-2xl text-sm leading-6 ${surfaces.muted}`}>{connectCopy.description}</p>
                </div>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className={`rounded-xl border p-4 ${surfaces.softPanel}`}>
                        <dt className={`text-xs font-semibold ${surfaces.muted}`}>Compte actif</dt>
                        <dd className="mt-1 font-mono text-sm font-bold">{connectState.activeAccountIdMasked || '—'}</dd>
                    </div>
                    <div className={`rounded-xl border p-4 ${surfaces.softPanel}`}>
                        <dt className={`text-xs font-semibold ${surfaces.muted}`}>Compte en attente</dt>
                        <dd className="mt-1 font-mono text-sm font-bold">{connectState.pendingAccountIdMasked || '—'}</dd>
                    </div>
                </dl>
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
                <Panel
                    darkMode={darkMode}
                    description="Stripe — moyens actifs et éligibles."
                    title="Carte et wallets"
                    actions={(
                        <StatusDot
                            darkMode={darkMode}
                            label={stripeEnabled ? 'Actif' : 'Inactif'}
                            tone={stripeEnabled && stripeReady ? 'emerald' : 'stone'}
                        />
                    )}
                >
                    <div className="flex items-start gap-3">
                        <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${surfaces.softPanel} border`}>
                            <Wallet size={17} />
                        </span>
                        <p className={`text-sm leading-6 ${surfaces.muted}`}>
                            {!stripeReady
                                ? 'Stripe Connect doit être finalisé avant de réactiver les cartes.'
                                : stripeEnabled
                                    ? 'Les clients peuvent payer par carte ou wallet sur le checkout.'
                                    : 'Seul le virement est proposé aux clients.'}
                        </p>
                    </div>
                </Panel>

                <Panel
                    darkMode={darkMode}
                    description="Paiement différé — instructions par e-mail."
                    title="Virement et Wero"
                    actions={<StatusDot darkMode={darkMode} label="Désactivé" tone="stone" />}
                >
                    <div className="flex items-start gap-3">
                        <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${surfaces.softPanel} border`}>
                            <Landmark size={17} />
                        </span>
                        <p className={`text-sm leading-6 ${surfaces.muted}`}>
                            Le paiement différé n’est pas activé sur le sandbox. Stripe test reste le seul rail transactionnel.
                        </p>
                    </div>
                </Panel>
            </div>

            {isAdmin && connectState.hasActiveAccount ? (
                <Panel
                    darkMode={darkMode}
                    description="Un changement de compte modifie la destination des prochains paiements. Les anciennes commandes conservent leur compte d’origine pour les remboursements."
                    title="Changement de compte Stripe"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field darkMode={darkMode} htmlFor="stripe-reconnect-request" label="1. Demande">
                            <input
                                className={field}
                                id="stripe-reconnect-request"
                                onChange={(event) => setReconnectRequestText(event.target.value)}
                                placeholder="DEMANDER CHANGEMENT STRIPE"
                                value={reconnectRequestText}
                            />
                            <button
                                className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${surfaces.secondaryButton}`}
                                disabled={connectAction === 'request-reconnect'}
                                onClick={requestReconnect}
                                type="button"
                            >
                                Demander le changement
                            </button>
                        </Field>
                        <Field darkMode={darkMode} htmlFor="stripe-reconnect-confirm" label="2. Activation finale">
                            <input
                                className={field}
                                id="stripe-reconnect-confirm"
                                onChange={(event) => setReconnectConfirmText(event.target.value)}
                                placeholder="ACTIVER NOUVEAU STRIPE"
                                value={reconnectConfirmText}
                            />
                            <button
                                className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${surfaces.primaryButton}`}
                                disabled={connectAction === 'confirm-reconnect'}
                                onClick={confirmReconnect}
                                type="button"
                            >
                                Activer le nouveau compte
                            </button>
                        </Field>
                    </div>
                </Panel>
            ) : null}

            <div className={`flex items-start gap-3 rounded-2xl border p-4 ${surfaces.softPanel}`}>
                <ShieldCheck className={`mt-0.5 shrink-0 ${surfaces.faint}`} size={17} />
                <p className={`text-xs leading-5 ${surfaces.muted}`}>
                    Stripe Connect évite de demander les clés Stripe de la cliente. Les actions sensibles passent par le serveur,
                    sont réservées aux administrateurs actifs et sont journalisées. Aucune clé secrète n’est visible dans l’admin.
                </p>
            </div>
        </div>
    );
};

export default AdminPaymentSettings;

