import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useLiveTheme } from '../config/theme';
import { Check, Sun, Moon, Layout, Sparkles } from 'lucide-react';

const AdminStudio = ({ darkMode }) => {
    // État global (Firestore)
    const { forcedMode } = useLiveTheme(darkMode);

    // Architectural is now the only design

    const [activeForcedMode, setActiveForcedMode] = useState(forcedMode);

    // Sync avec Firestore
    useEffect(() => {
        setActiveForcedMode(forcedMode);
    }, [forcedMode]);

    const saveSettings = async (mode) => {
        try {
            await setDoc(doc(db, 'sys_metadata', 'theme_settings'), {
                isStandardMode: false,
                activeDesignId: 'architectural',
                forcedMode: mode,
                updatedAt: Date.now()
            }, { merge: true });
        } catch (err) {
            console.error("Failed to save theme settings:", err);
            alert("Erreur lors de la sauvegarde.");
        }
    };

    const handleForceModeCollection = (e, designId, mode) => {
        e.stopPropagation();
        setActiveForcedMode(mode);
        saveSettings(mode);
    };

    return (
        <div className={`space-y-8 animate-in fade-in ${darkMode ? 'text-white' : 'text-stone-900'}`}>

            {/* EN-TÊTE ÉPURÉ */}
            <div className={`p-2 rounded-[2.5rem] ring-1 shadow-sm flex items-center gap-2 will-change-transform ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                <div className={`flex-1 py-4 md:py-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white shadow-inner`}>
                    <div className="flex items-center gap-3 relative z-10">
                        <Sparkles size={20} strokeWidth={2.5} />
                        <span className="text-lg font-black tracking-tight uppercase">Showroom 2026</span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 relative z-10">Design Architectural Actif</p>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 mx-12 rounded-t-full shadow-[0_-4px_12px_rgba(99,102,241,0.5)]"></div>
                </div>
            </div>

            {/* CONTENU : SEULEMENT SHOWROOM */}
            <div className="min-h-[400px]">
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-8">
                    <div className="px-4 text-center">
                        <h3 className="text-xl font-bold flex items-center justify-center gap-2 mb-2">
                            <Sparkles size={20} className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} />
                            Design Architectural (Editorial)
                        </h3>
                        <p className="text-sm opacity-60 max-w-2xl mx-auto">
                            Ce design est maintenant le standard par défaut pour votre boutique.
                            Gérez ici l'ambiance lumineuse forcée si nécessaire.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto">
                        {/* DESIGN ARCHITECTURAL */}
                        <div className={`group relative overflow-hidden rounded-[2.5rem] ring-4 ring-indigo-500/10 transition-all duration-300 will-change-transform`}>
                            {/* Image Cover Mockup */}
                            <div className={`aspect-[2.5/1] relative ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`}>
                                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                    <h1 className={`text-5xl font-serif leading-none opacity-20 ${darkMode ? 'text-white' : 'text-black'}`}>La<br />Galerie.</h1>
                                </div>
                                <div className="absolute top-4 right-4 bg-indigo-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                    <Check size={12} strokeWidth={4} /> Design Unique
                                </div>
                            </div>

                            {/* Content */}
                            <div className={`p-8 ${darkMode ? 'bg-stone-900 border-t border-stone-800' : 'bg-white border-t border-stone-100'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-2xl font-black tracking-tight mb-1">Ambiance Visuelle</h4>
                                        <span className="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Architectural</span>
                                    </div>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-indigo-500 text-white transition-colors`}>
                                        <Layout size={20} />
                                    </div>
                                </div>

                                <div className="mt-6 space-y-6">
                                    <p className="text-sm opacity-60 leading-relaxed">
                                        Définissez l'ambiance par défaut du site. Ce mode sera appliqué à l'arrivée des visiteurs, mais ils pourront toujours basculer manuellement via le bouton dédié.
                                    </p>

                                    {/* Force Mode Controls */}
                                    <div className={`flex items-center justify-between gap-4 p-2 rounded-2xl ${darkMode ? 'bg-stone-950/50' : 'bg-stone-50'}`}>
                                        <button
                                            onClick={(e) => handleForceModeCollection(e, 'architectural', 'light')}
                                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-wider transition-all ${activeForcedMode === 'light' ? 'bg-white text-stone-900 shadow-lg scale-[1.02]' : 'text-stone-400 hover:text-stone-600'}`}
                                        >
                                            <Sun size={16} /> Light Mode
                                        </button>
                                        <button
                                            onClick={(e) => handleForceModeCollection(e, 'architectural', 'dark')}
                                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-wider transition-all ${activeForcedMode === 'dark' ? 'bg-stone-800 text-white shadow-lg scale-[1.02]' : 'text-stone-400 hover:text-stone-600'}`}
                                        >
                                            <Moon size={16} /> Dark Mode
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t border-stone-100 dark:border-stone-800 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 justify-center">
                                    <span className="flex items-center gap-1"><Check size={12} /> Minimaliste</span>
                                    <div className="w-1 h-1 rounded-full bg-stone-400"></div>
                                    <span className="flex items-center gap-1"><Check size={12} /> Premium</span>
                                    <div className="w-1 h-1 rounded-full bg-stone-400"></div>
                                    <span className="flex items-center gap-1"><Check size={12} /> Responsive</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStudio;

