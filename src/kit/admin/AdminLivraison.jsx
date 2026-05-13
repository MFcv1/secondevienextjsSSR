import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Truck, Save, RefreshCw } from 'lucide-react';

const DEFAULT_SETTINGS = {
    retrait: { id: 'retrait', active: true, label: "Retrait à l'atelier (Marseille)", sub: "Sur rendez-vous", price: 0 },
    idf: { id: 'idf', active: true, label: "Livraison Marseille & Alentours", sub: "Par nos soins", price: 49 },
    transporteur: { id: 'transporteur', active: true, label: "Transporteur Spécialisé (Cocolis)", sub: "Protections sur-mesure", price: 89 }
};

const AdminLivraison = ({ darkMode }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'sys_metadata', 'delivery');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSettings(prev => ({ ...prev, ...docSnap.data() }));
                }
            } catch (e) {
                console.error("Error fetching delivery settings", e);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
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
        if (hasErrors) return;
        setSaving(true);
        try {
            // Normaliser les prix en Number avant sauvegarde
            const sanitized = {};
            for (const [key, mode] of Object.entries(settings)) {
                sanitized[key] = { ...mode, price: Number(mode.price) || 0, label: mode.label.trim(), sub: (mode.sub || '').trim() };
            }
            await setDoc(doc(db, 'sys_metadata', 'delivery'), sanitized, { merge: true });
            setSettings(sanitized);
            alert("✅ Paramètres de livraison enregistrés avec succès.");
        } catch (e) {
            console.error(e);
            alert("❌ Erreur lors de l'enregistrement : " + e.message);
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
                                                <label className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Label Principal</label>
                                                <input
                                                    type="text"
                                                    value={mode.label}
                                                    onChange={(e) => handleChange(key, 'label', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Ex: Livraison Marseille & Alentours"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Prix (€)</label>
                                                <input
                                                    type="number"
                                                    value={mode.price}
                                                    onChange={(e) => handleChange(key, 'price', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    className={inputClass}
                                                    min="0"
                                                    step="1"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-full">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Sous-titre (Description courte)</label>
                                            <input
                                                type="text"
                                                value={mode.sub}
                                                onChange={(e) => handleChange(key, 'sub', e.target.value)}
                                                className={inputClass}
                                                placeholder="Ex: Par nos soins"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end justify-center min-w-[120px]">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Activer</span>
                                            <input
                                                type="checkbox"
                                                checked={mode.active}
                                                onChange={(e) => handleChange(key, 'active', e.target.checked)}
                                                className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-stone-800 border-stone-700"
                                            />
                                        </label>
                                    </div>
                                </div>
                                {validationErrors[key] && <p className="text-red-500 text-xs font-bold mt-2">⚠ {validationErrors[key]}</p>}
                            </div>
                        );
                    })}
                </div>

                <div className="pt-8 mt-8 border-t border-stone-200 dark:border-stone-800 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || hasErrors}
                        className={`flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors ${saving || hasErrors ? 'bg-stone-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLivraison;
