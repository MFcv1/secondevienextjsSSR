import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CreditCard, Landmark, ToggleLeft, ToggleRight, Wallet, ShieldCheck } from 'lucide-react';

const AdminPaymentSettings = ({ darkMode }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stripeEnabled, setStripeEnabled] = useState(true);

    // Écoute en temps réel
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'sys_metadata', 'payment_settings'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setStripeEnabled(data.stripeEnabled !== false); // default true
            }
            setLoading(false);
        }, (err) => {
            console.error('Payment settings listener error:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleToggle = async () => {
        const newValue = !stripeEnabled;
        setSaving(true);
        try {
            await setDoc(doc(db, 'sys_metadata', 'payment_settings'), {
                stripeEnabled: newValue,
                updatedAt: Date.now()
            }, { merge: true });
            setStripeEnabled(newValue);
        } catch (err) {
            console.error('Error saving payment settings:', err);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Chargement des paramètres de paiement...</div>;

    return (
        <div className={`space-y-8 animate-in fade-in ${darkMode ? 'text-white' : 'text-stone-900'}`}>

            {/* Header */}
            <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] ring-1 shadow-sm flex flex-col sm:flex-row items-center gap-4 md:gap-6 will-change-transform ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner ${darkMode ? 'bg-stone-800 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                    <CreditCard size={24} className="md:w-8 md:h-8" />
                </div>
                <div className="text-center sm:text-left">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">Moyens de Paiement</h2>
                    <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest opacity-60">Activez ou désactivez les paiements par carte en un clic</p>
                </div>
            </div>

            {/* Toggle Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* CARTE / WALLETS */}
                <div className={`p-8 rounded-[2.5rem] ring-1 shadow-sm will-change-transform transition-all ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stripeEnabled ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (darkMode ? 'bg-stone-800 text-stone-500' : 'bg-stone-100 text-stone-400')}`}>
                            <Wallet size={22} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg tracking-tight">Carte / Wallets</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Stripe — Visa, Mastercard, Apple Pay, Google Pay, PayPal</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className={`text-sm font-black uppercase tracking-wider ${stripeEnabled ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : 'text-stone-500'}`}>
                                {stripeEnabled ? 'Activé' : 'Désactivé'}
                            </span>
                            <p className="text-[10px] text-stone-500 mt-1 max-w-xs">
                                {stripeEnabled
                                    ? 'Les clients peuvent payer par carte ou wallet sur le checkout.'
                                    : 'Seul le virement / Wero est proposé aux clients.'}
                            </p>
                        </div>
                        <button
                            onClick={handleToggle}
                            disabled={saving}
                            className={`transition-all ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                            aria-label={stripeEnabled ? 'Désactiver les paiements par carte' : 'Activer les paiements par carte'}
                        >
                            {stripeEnabled ? (
                                <ToggleRight size={48} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                            ) : (
                                <ToggleLeft size={48} className="text-stone-500" />
                            )}
                        </button>
                    </div>
                </div>

                {/* VIREMENT / WERO (toujours actif) */}
                <div className={`p-8 rounded-[2.5rem] ring-1 shadow-sm will-change-transform ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Landmark size={22} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg tracking-tight">Virement / Wero</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Paiement différé — Instructions par email</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className={`text-sm font-black uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                Toujours actif
                            </span>
                            <p className="text-[10px] text-stone-500 mt-1 max-w-xs">
                                Ce mode de paiement est toujours disponible comme solution de base.
                            </p>
                        </div>
                        <div className="opacity-40">
                            <ToggleRight size={48} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Info box */}
            <div className={`p-6 rounded-[2rem] ring-1 flex items-start gap-4 ${darkMode ? 'bg-stone-900/50 ring-stone-800' : 'bg-stone-50 ring-stone-200'}`}>
                <ShieldCheck size={20} className="text-stone-500 shrink-0 mt-0.5" />
                <p className="text-xs text-stone-500 leading-relaxed">
                    Désactiver les paiements par carte masque simplement l'option côté client.
                    Aucun code n'est supprimé — vous pouvez réactiver Stripe à tout moment en un clic.
                    Les commandes existantes ne sont pas affectées.
                </p>
            </div>
        </div>
    );
};

export default AdminPaymentSettings;
