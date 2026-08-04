import { useState, useEffect } from 'react';
import { Truck, Save, RefreshCw } from 'lucide-react';
import {
    getDeliveryPolicyAdmin,
    saveDeliveryPolicyAdmin
} from '../commerce/deliveryPolicyAdminClient';

const DEFAULT_SETTINGS = {
    retrait: { id: 'retrait', active: true, label: "Retrait à l'atelier (Marseille)", sub: "Sur rendez-vous", price: 0 },
    idf: { id: 'idf', active: true, label: "Livraison Marseille & Alentours", sub: "Par nos soins", price: 49 },
    transporteur: { id: 'transporteur', active: true, label: "Transporteur Spécialisé (Cocolis)", sub: "Protections sur-mesure", price: 89 }
};

const AdminLivraison = ({ darkMode }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [policyState, setPolicyState] = useState({ policyVersion: null, controlRevision: null });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        let active = true;
        const fetchSettings = async () => {
            try {
                const result = await getDeliveryPolicyAdmin();
                if (!active) return;
                setSettings(result.settings);
                setPolicyState({
                    policyVersion: result.policyVersion,
                    controlRevision: result.controlRevision
                });
            } catch (e) {
                console.error("Error fetching delivery settings", e);
                if (active) setMessage({
                    type: 'error',
                    text: e.message || 'Chargement des paramètres de livraison impossible.'
                });
            } finally {
                if (active) setLoading(false);
            }
        };
        void fetchSettings();
        return () => { active = false; };
    }, []);

    // Validation
    const getErrors = () => {
        const errors = {};
        for (const [key, mode] of Object.entries(settings)) {
            if (!mode.label || !mode.label.trim()) errors[key] = "Label requis";
            else if (mode.price === '' || isNaN(Number(mode.price)) || Number(mode.price) < 0) errors[key] = "Prix invalide (≥ 0)";
        }
        return errors;
    };
    const validationErrors = getErrors();
    const hasErrors = Object.keys(validationErrors).length > 0;

    const handleSave = async () => {
        if (hasErrors || !policyState.policyVersion || !Number.isSafeInteger(policyState.controlRevision)) return;
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const result = await saveDeliveryPolicyAdmin({
                settings,
                sourcePolicyVersion: policyState.policyVersion,
                expectedControlRevision: policyState.controlRevision
            });
            setSettings(result.settings);
            setPolicyState({
                policyVersion: result.policyVersion,
                controlRevision: result.controlRevision
            });
            setMessage({ type: 'success', text: 'Paramètres de livraison enregistrés et publiés.' });
        } catch (e) {
            console.error(e);
            const reason = e?.details?.reason || e?.customData?.details?.reason;
            if (reason === 'COMMERCE_DELIVERY_POLICY_STALE') {
                try {
                    const fresh = await getDeliveryPolicyAdmin();
                    setSettings(fresh.settings);
                    setPolicyState({
                        policyVersion: fresh.policyVersion,
                        controlRevision: fresh.controlRevision
                    });
                    setMessage({
                        type: 'error',
                        text: 'La configuration avait changé. La dernière version a été rechargée.'
                    });
                } catch (refreshError) {
                    console.error('Delivery settings refresh failed', refreshError);
                    setMessage({ type: 'error', text: 'La configuration a changé. Rechargez la page.' });
                }
            } else {
                setMessage({
                    type: 'error',
                    text: e.message || 'Enregistrement des paramètres de livraison impossible.'
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (id, field, value) => {
        setSettings(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: field === 'price' ? (value === '' ? '' : Number(value)) : value
            }
        }));
    };

    if (loading) {
        return <div className="p-12 text-center text-stone-400 font-bold animate-pulse">Chargement des paramètres de livraison...</div>;
    }

    const baseCard = darkMode ? 'bg-[#161616] border border-white/5 shadow-2xl' : 'bg-white border border-stone-100 shadow-sm';
    const textBase = darkMode ? 'text-white' : 'text-stone-900';
    const textMuted = darkMode ? 'text-white/40' : 'text-stone-400';
    const inputClass = `w-full px-4 py-2 mt-1 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-stone-900 border-stone-800 text-white placeholder-white/20' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400'}`;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
            <div className={`p-8 rounded-[32px] ${baseCard}`}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className={`text-xl font-black flex items-center gap-2 ${textBase}`}>
                            <Truck size={24} className="text-indigo-500" />
                            Modes de Livraison
                        </h3>
                        <p className={`text-sm mt-2 ${textMuted}`}>Personnalisez les labels, les descriptions et les tarifs des différents modes de livraison disponibles lors de la commande.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {Object.keys(settings).map((key) => {
                        const mode = settings[key];
                        return (
                            <div key={key} className={`p-6 rounded-2xl border ${darkMode ? 'border-white/5 bg-stone-900/50' : 'border-stone-100 bg-stone-50/50'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label htmlFor={`${key}-delivery-label`} className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Label Principal</label>
                                                <input
                                                    id={`${key}-delivery-label`}
                                                    type="text"
                                                    value={mode.label || ''}
                                                    onChange={(e) => handleChange(key, 'label', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Ex: Livraison Marseille & Alentours"
                                                    disabled={saving}
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label htmlFor={`${key}-delivery-price`} className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Prix (€)</label>
                                                <input
                                                    id={`${key}-delivery-price`}
                                                    type="number"
                                                    value={mode.price}
                                                    onChange={(e) => handleChange(key, 'price', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    className={inputClass}
                                                    min="0"
                                                    step="1"
                                                    disabled={saving}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-full">
                                            <label htmlFor={`${key}-delivery-description`} className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Sous-titre (Description courte)</label>
                                                <input
                                                    id={`${key}-delivery-description`}
                                                    type="text"
                                                    value={mode.sub || ''}
                                                    onChange={(e) => handleChange(key, 'sub', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Ex: Par nos soins"
                                                    disabled={saving}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end justify-center min-w-[120px]">
                                        <label htmlFor={`${key}-delivery-active`} className="flex items-center gap-2 cursor-pointer">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Activer</span>
                                                <input
                                                    id={`${key}-delivery-active`}
                                                    type="checkbox"
                                                    checked={mode.active}
                                                    onChange={(e) => handleChange(key, 'active', e.target.checked)}
                                                    className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-stone-800 border-stone-700"
                                                    disabled={saving}
                                            />
                                        </label>
                                    </div>
                                </div>
                                {validationErrors[key] && <p className="text-red-500 text-xs font-bold mt-2">⚠ {validationErrors[key]}</p>}
                            </div>
                        );
                    })}
                </div>

                <div className="pt-8 mt-8 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div aria-live="polite">
                        {message.text && (
                            <p className={`text-sm font-bold ${message.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {message.text}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || hasErrors || !policyState.policyVersion}
                        className={`flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors ${saving || hasErrors || !policyState.policyVersion ? 'bg-stone-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Enregistrement...' : 'Enregistrer et publier'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLivraison;
