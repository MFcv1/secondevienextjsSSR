import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
    AlertTriangle,
    CheckCircle2,
    CreditCard,
    ExternalLink,
    Landmark,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
    ToggleLeft,
    ToggleRight,
    Wallet
} from 'lucide-react';
import { db, functions } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const PAYMENT_SETTINGS_CACHE_KEY = 'paymentSettings';

const statusCopy = {
    not_connected: {
        label: 'Non connecte',
        tone: 'stone',
        description: 'Aucun compte Stripe Connect actif. Le site peut encore utiliser le chemin Stripe legacy tant que les cles directes existent.'
    },
    action_required: {
        label: 'Configuration a terminer',
        tone: 'amber',
        description: 'La cliente doit terminer les informations legales ou bancaires dans Stripe.'
    },
    pending_review: {
        label: 'En verification',
        tone: 'amber',
        description: 'Stripe analyse le compte. Les paiements carte restent bloques tant que Stripe ne valide pas.'
    },
    active: {
        label: 'Paiements actifs',
        tone: 'emerald',
        description: 'Le compte Stripe connecte peut encaisser les paiements.'
    }
};

const getToneClass = (tone, darkMode) => {
    if (tone === 'emerald') return darkMode ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700';
    if (tone === 'amber') return darkMode ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700';
    return darkMode ? 'bg-white/8 text-stone-300' : 'bg-stone-100 text-stone-600';
};

const AdminPaymentSettings = ({ darkMode }) => {
    const { isAdmin, isSuperAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
            const getStatus = httpsCallable(functions, 'getStripeConnectStatus');
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

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'sys_metadata', 'payment_settings'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setStripeEnabled(data.stripeEnabled !== false);
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
                window.setTimeout(() => refreshConnectStatus({ silent: false }), 400);
            }
        }
    }, []);

    const handleToggle = async () => {
        const newValue = !stripeEnabled;
        setSaving(true);
        try {
            await setDoc(doc(db, 'sys_metadata', 'payment_settings'), {
                stripeEnabled: newValue,
                updatedAt: Date.now()
            }, { merge: true });
            try {
                localStorage.setItem(PAYMENT_SETTINGS_CACHE_KEY, JSON.stringify({ stripeEnabled: newValue }));
            } catch {
                // Cache optional.
            }
            setStripeEnabled(newValue);
        } catch (err) {
            console.error('Error saving payment settings:', err);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    const startConnect = async () => {
        let redirectingToStripe = false;
        setConnectAction('connect');
        setConnectRedirecting(false);
        setConnectError('');
        try {
            const startOnboarding = httpsCallable(functions, 'startStripeConnectOnboarding');
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
        setConnectAction('sync');
        setConnectError('');
        try {
            const syncAccount = httpsCallable(functions, 'syncStripeConnectAccount');
            const result = await syncAccount();
            setConnectState(result.data?.connect || { status: 'not_connected' });
        } catch (error) {
            console.error('Stripe Connect sync error:', error);
            setConnectError(error.message || 'Synchronisation Stripe impossible.');
        } finally {
            setConnectAction('');
        }
    };

    const requestReconnect = async () => {
        setConnectAction('request-reconnect');
        setConnectError('');
        try {
            const requestFn = httpsCallable(functions, 'requestStripeConnectReconnect');
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
            const confirmFn = httpsCallable(functions, 'confirmStripeConnectReconnect');
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

    if (loading) return <div className="p-12 text-center animate-pulse">Chargement des parametres de paiement...</div>;

    const connectCopy = statusCopy[connectState.status] || statusCopy.not_connected;
    const stripeReady = connectState.chargesEnabled === true || connectState.status === 'not_connected';

    return (
        <div className={`space-y-8 animate-in fade-in ${darkMode ? 'text-white' : 'text-stone-900'}`}>
            <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] ring-1 shadow-sm flex flex-col sm:flex-row items-center gap-4 md:gap-6 ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner ${darkMode ? 'bg-stone-800 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                    <CreditCard size={24} className="md:w-8 md:h-8" />
                </div>
                <div className="text-center sm:text-left">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">Moyens de Paiement</h2>
                    <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest opacity-60">Stripe Connect, carte, wallets et virement</p>
                </div>
            </div>

            <div className={`p-6 md:p-8 rounded-[2rem] ring-1 shadow-sm ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                {connectAction === 'connect' ? (
                    <div className={`mb-5 overflow-hidden rounded-2xl border ${darkMode ? 'border-indigo-300/20 bg-indigo-300/10 text-indigo-100' : 'border-indigo-100 bg-indigo-50 text-indigo-950'}`}>
                        <div className="flex items-center gap-3 px-4 py-3 text-sm font-bold">
                            <RefreshCw size={16} className="animate-spin" />
                            <span>{connectRedirecting ? 'Redirection vers Stripe...' : 'Preparation de la connexion Stripe...'}</span>
                            <span className={`ml-auto h-2 w-2 rounded-full ${darkMode ? 'bg-indigo-200' : 'bg-indigo-500'} animate-pulse`} />
                        </div>
                        <div className={`h-1 w-full ${darkMode ? 'bg-white/10' : 'bg-indigo-100'}`}>
                            <div className={`h-full w-2/3 animate-pulse ${darkMode ? 'bg-indigo-200' : 'bg-indigo-500'}`} />
                        </div>
                    </div>
                ) : null}

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getToneClass(connectCopy.tone, darkMode)}`}>
                                {connectState.chargesEnabled ? <CheckCircle2 size={22} /> : <LockKeyhole size={22} />}
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Stripe Connect</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Encaissement sur le compte de la cliente</p>
                            </div>
                        </div>
                        <div className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getToneClass(connectCopy.tone, darkMode)}`}>
                            {connectCopy.label}
                        </div>
                        <p className="max-w-2xl text-sm leading-6 text-stone-500">{connectCopy.description}</p>
                        <div className="grid gap-3 text-xs sm:grid-cols-2">
                            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-white/[0.04]' : 'bg-stone-50'}`}>
                                <p className="font-black uppercase tracking-widest text-stone-500 text-[10px]">Compte actif</p>
                                <p className="mt-2 font-mono text-sm">{connectState.activeAccountIdMasked || '-'}</p>
                            </div>
                            <div className={`rounded-2xl p-4 ${darkMode ? 'bg-white/[0.04]' : 'bg-stone-50'}`}>
                                <p className="font-black uppercase tracking-widest text-stone-500 text-[10px]">Compte en attente</p>
                                <p className="mt-2 font-mono text-sm">{connectState.pendingAccountIdMasked || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[260px]">
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={startConnect}
                                disabled={Boolean(connectAction)}
                                className={`relative flex min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-stone-950 text-white hover:bg-stone-800'} ${connectAction ? 'cursor-wait opacity-80' : ''}`}
                            >
                                {connectAction === 'connect' ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                    <ExternalLink size={14} />
                                )}
                                {connectAction === 'connect'
                                    ? (connectRedirecting ? 'Redirection...' : 'Preparation...')
                                    : connectState.hasPendingAccount ? 'Continuer Stripe' : connectState.hasActiveAccount ? 'Connecter nouveau' : 'Connecter Stripe'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={syncConnect}
                            disabled={Boolean(connectAction) || connectLoading}
                            className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'border-white/10 text-stone-300 hover:bg-white/5' : 'border-stone-200 text-stone-600 hover:bg-stone-50'} ${connectAction === 'sync' ? 'cursor-wait opacity-60' : ''}`}
                        >
                            <RefreshCw size={14} className={connectAction === 'sync' ? 'animate-spin' : ''} />
                            Synchroniser
                        </button>
                    </div>
                </div>

                {connectError ? (
                    <div className={`mt-5 flex items-start gap-3 rounded-2xl p-4 text-sm ${darkMode ? 'bg-red-500/10 text-red-200' : 'bg-red-50 text-red-700'}`}>
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        <p>{connectError}</p>
                    </div>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className={`p-8 rounded-[2.5rem] ring-1 shadow-sm transition-all ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stripeEnabled && stripeReady ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (darkMode ? 'bg-stone-800 text-stone-500' : 'bg-stone-100 text-stone-400')}`}>
                            <Wallet size={22} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg tracking-tight">Carte / Wallets</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Stripe - moyens actifs et eligibles</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className={`text-sm font-black uppercase tracking-wider ${stripeEnabled && stripeReady ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : 'text-stone-500'}`}>
                                {stripeEnabled ? 'Active' : 'Desactive'}
                            </span>
                            <p className="text-[10px] text-stone-500 mt-1 max-w-xs">
                                {!stripeReady
                                    ? 'Stripe Connect doit etre finalise avant de reactiver les cartes.'
                                    : stripeEnabled
                                        ? 'Les clients peuvent payer par carte ou wallet sur le checkout.'
                                        : 'Seul le virement / Wero est propose aux clients.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggle}
                            disabled={saving || !stripeReady}
                            className={`transition-all ${saving || !stripeReady ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                            aria-label={stripeEnabled ? 'Desactiver les paiements par carte' : 'Activer les paiements par carte'}
                        >
                            {stripeEnabled ? (
                                <ToggleRight size={48} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                            ) : (
                                <ToggleLeft size={48} className="text-stone-500" />
                            )}
                        </button>
                    </div>
                </div>

                <div className={`p-8 rounded-[2.5rem] ring-1 shadow-sm ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Landmark size={22} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg tracking-tight">Virement / Wero</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Paiement differe - Instructions par email</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className={`text-sm font-black uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                Toujours actif
                            </span>
                            <p className="text-[10px] text-stone-500 mt-1 max-w-xs">
                                Ce mode reste disponible si Stripe est incomplet, restreint ou volontairement coupe.
                            </p>
                        </div>
                        <div className="opacity-40">
                            <ToggleRight size={48} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                        </div>
                    </div>
                </div>
            </div>

            {isSuperAdmin && connectState.hasActiveAccount ? (
                <div className={`p-6 rounded-[2rem] ring-1 space-y-5 ${darkMode ? 'bg-stone-900/50 ring-stone-800' : 'bg-stone-50 ring-stone-200'}`}>
                    <div className="flex items-start gap-4">
                        <ShieldCheck size={20} className="text-stone-500 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-black uppercase tracking-widest text-xs">Changement de compte Stripe</h3>
                            <p className="mt-2 text-xs text-stone-500 leading-relaxed">
                                Action sensible: un changement de compte modifie la destination des prochains paiements.
                                Les anciennes commandes gardent leur compte Stripe d'origine pour les remboursements.
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">1. Demande</label>
                            <input
                                value={reconnectRequestText}
                                onChange={(event) => setReconnectRequestText(event.target.value)}
                                placeholder="DEMANDER CHANGEMENT STRIPE"
                                className={`w-full rounded-2xl border px-4 py-3 text-xs font-bold outline-none ${darkMode ? 'border-white/10 bg-black/20 text-white' : 'border-stone-200 bg-white text-stone-900'}`}
                            />
                            <button
                                type="button"
                                onClick={requestReconnect}
                                disabled={connectAction === 'request-reconnect'}
                                className={`w-full rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-white/10 text-white' : 'bg-stone-200 text-stone-700'}`}
                            >
                                Demander le changement
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">2. Activation finale</label>
                            <input
                                value={reconnectConfirmText}
                                onChange={(event) => setReconnectConfirmText(event.target.value)}
                                placeholder="ACTIVER NOUVEAU STRIPE"
                                className={`w-full rounded-2xl border px-4 py-3 text-xs font-bold outline-none ${darkMode ? 'border-white/10 bg-black/20 text-white' : 'border-stone-200 bg-white text-stone-900'}`}
                            />
                            <button
                                type="button"
                                onClick={confirmReconnect}
                                disabled={connectAction === 'confirm-reconnect'}
                                className={`w-full rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white'}`}
                            >
                                Activer le nouveau compte
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className={`p-6 rounded-[2rem] ring-1 flex items-start gap-4 ${darkMode ? 'bg-stone-900/50 ring-stone-800' : 'bg-stone-50 ring-stone-200'}`}>
                <ShieldCheck size={20} className="text-stone-500 shrink-0 mt-0.5" />
                <p className="text-xs text-stone-500 leading-relaxed">
                    Stripe Connect evite de demander les cles Stripe de la cliente. Les actions sensibles passent par le serveur,
                    sont reservees au super-admin et sont journalisees. Aucune cle secrete Stripe n'est visible dans l'admin.
                </p>
            </div>
        </div>
    );
};

export default AdminPaymentSettings;
