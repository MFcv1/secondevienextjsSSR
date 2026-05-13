import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Globe, Mail, Phone, Facebook, Instagram, Save, Search, Share2, RefreshCw } from 'lucide-react';
import KIT_CONFIG from '../config/constants';

const AdminSEO = ({ darkMode }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Default Values (read from env vars / KIT_CONFIG — editable at runtime via Firestore)
    const [formData, setFormData] = useState({
        email:         process.env.NEXT_PUBLIC_BUSINESS_EMAIL   || '',
        phone:         process.env.NEXT_PUBLIC_BUSINESS_PHONE   || '',
        address:       process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '',
        instagram:     KIT_CONFIG.socialLinks.instagram,
        facebook:      KIT_CONFIG.socialLinks.facebook,
        footerTitle:   KIT_CONFIG.brandName,
        footerSubtitle: 'Contact',
        legacyText:    `${KIT_CONFIG.brandName} — ${KIT_CONFIG.brandTagline}`,
    });

    // Load data from Firestore
    useEffect(() => {
        const fetchData = async () => {
            try {
                const docRef = doc(db, 'sys_metadata', 'contact_info');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFormData(prev => ({ ...prev, ...docSnap.data() }));
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching contact info:", err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'sys_metadata', 'contact_info'), {
                ...formData,
                updatedAt: Date.now()
            }, { merge: true });
            alert("✅ Informations mises à jour avec succès !");
        } catch (err) {
            console.error("Error saving contact info:", err);
            alert("❌ Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Chargement des paramètres SEO...</div>;

    return (
        <div className={`space-y-8 animate-in fade-in ${darkMode ? 'text-white' : 'text-stone-900'}`}>

            {/* Header */}
            <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] ring-1 shadow-sm flex flex-col sm:flex-row items-center gap-4 md:gap-6 will-change-transform ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner ${darkMode ? 'bg-stone-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Globe size={24} className="md:w-8 md:h-8" />
                </div>
                <div className="text-center sm:text-left">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">Référencement & Contact</h2>
                    <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest opacity-60">Gérez vos coordonnées publiques et réseaux sociaux</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* CONTACT INFO CARD */}
                <div className={`p-8 rounded-[2.5rem] ring-1 shadow-sm will-change-transform ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                    <div className="flex items-center gap-3 mb-8">
                        <Mail size={20} className="text-emerald-500" />
                        <h3 className="text-lg font-black uppercase tracking-widest">Coordonnées</h3>
                    </div>

                    <div className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Email Public</label>
                            <div className={`flex items-center px-4 py-3 rounded-xl border ${darkMode ? 'bg-stone-950 border-stone-800 focus-within:border-emerald-500' : 'bg-stone-50 border-stone-200 focus-within:border-emerald-500'}`}>
                                <Mail size={16} className="opacity-40 mr-3" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="contact@exemple.fr"
                                    className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder-opacity-30"
                                />
                            </div>
                            <p className="text-[10px] opacity-40 ml-1">Visible dans le pied de page et la page contact.</p>
                        </div>

                        {/* Téléphone */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Téléphone</label>
                            <div className={`flex items-center px-4 py-3 rounded-xl border ${darkMode ? 'bg-stone-950 border-stone-800 focus-within:border-emerald-500' : 'bg-stone-50 border-stone-200 focus-within:border-emerald-500'}`}>
                                <Phone size={16} className="opacity-40 mr-3" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="07 00 00 00 00"
                                    className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder-opacity-30"
                                />
                            </div>
                            <p className="text-[10px] opacity-40 ml-1">Format recommandé : XX XX XX XX XX</p>
                        </div>
                    </div>
                </div>

                {/* SOCIAL NETWORKS CARD */}
                <div className={`p-8 rounded-[2.5rem] ring-1 shadow-sm will-change-transform ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                    <div className="flex items-center gap-3 mb-8">
                        <Share2 size={20} className="text-blue-500" />
                        <h3 className="text-lg font-black uppercase tracking-widest">Réseaux Sociaux</h3>
                    </div>

                    <div className="space-y-6">
                        {/* Instagram */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Instagram URL</label>
                            <div className={`flex items-center px-4 py-3 rounded-xl border ${darkMode ? 'bg-stone-950 border-stone-800 focus-within:border-pink-500' : 'bg-stone-50 border-stone-200 focus-within:border-pink-500'}`}>
                                <Instagram size={16} className="opacity-40 mr-3 text-pink-500" />
                                <input
                                    type="url"
                                    name="instagram"
                                    value={formData.instagram}
                                    onChange={handleChange}
                                    placeholder="https://instagram.com/..."
                                    className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder-opacity-30"
                                />
                            </div>
                        </div>

                        {/* Facebook */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Facebook URL</label>
                            <div className={`flex items-center px-4 py-3 rounded-xl border ${darkMode ? 'bg-stone-950 border-stone-800 focus-within:border-blue-600' : 'bg-stone-50 border-stone-200 focus-within:border-blue-600'}`}>
                                <Facebook size={16} className="opacity-40 mr-3 text-blue-600" />
                                <input
                                    type="url"
                                    name="facebook"
                                    value={formData.facebook}
                                    onChange={handleChange}
                                    placeholder="https://facebook.com/..."
                                    className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder-opacity-30"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* CONTENT CARD */}
            <div className={`p-8 rounded-[2.5rem] ring-1 shadow-sm will-change-transform ${darkMode ? 'bg-stone-900 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                <div className="flex items-center gap-3 mb-8">
                    <Search size={20} className="text-purple-500" />
                    <h3 className="text-lg font-black uppercase tracking-widest">Contenu Footer & SEO</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        {/* Titre Principal */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Grand Titre Footer</label>
                            <div className={`flex items-center px-4 py-3 rounded-xl border ${darkMode ? 'bg-stone-950 border-stone-800 focus-within:border-purple-500' : 'bg-stone-50 border-stone-200 focus-within:border-purple-500'}`}>
                                <textarea
                                    name="footerTitle"
                                    value={formData.footerTitle ?? KIT_CONFIG.brandName}
                                    onChange={handleChange}
                                    className="bg-transparent border-none outline-none w-full text-lg font-serif italic placeholder-opacity-30 resize-y min-h-[80px]"
                                    placeholder={KIT_CONFIG.brandName}
                                />
                            </div>
                        </div>

                        {/* Sous-titre */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Sous-titre (Petit)</label>
                            <div className={`flex items-center px-4 py-3 rounded-xl border ${darkMode ? 'bg-stone-950 border-stone-800 focus-within:border-purple-500' : 'bg-stone-50 border-stone-200 focus-within:border-purple-500'}`}>
                                <input
                                    type="text"
                                    name="footerSubtitle"
                                    value={formData.footerSubtitle ?? "Inquiry"}
                                    onChange={handleChange}
                                    className="bg-transparent border-none outline-none w-full text-xs font-black uppercase tracking-widest placeholder-opacity-30"
                                />
                            </div>
                        </div>

                        {/* Adresse */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Adresse Postale</label>
                            <div className={`flex items-center px-4 py-3 rounded-xl border ${darkMode ? 'bg-stone-950 border-stone-800 focus-within:border-purple-500' : 'bg-stone-50 border-stone-200 focus-within:border-purple-500'}`}>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address ?? ''}
                                    onChange={handleChange}
                                    placeholder="Ex: 12 Rue du Commerce, 75001 Paris"
                                    className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder-opacity-30"
                                />
                            </div>
                            <p className="text-[10px] opacity-40 ml-1">S'affiche sous le numéro de téléphone.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Texte Légal / SEO Bas de page */}
                        <div className="space-y-2 h-full">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Ligne Bas de Page (SEO)</label>
                            <textarea
                                name="legacyText"
                                value={formData.legacyText ?? `${KIT_CONFIG.brandName} — ${KIT_CONFIG.brandTagline}`}
                                onChange={handleChange}
                                className={`w-full h-32 p-4 rounded-xl border resize-none text-[10px] uppercase tracking-widest leading-relaxed ${darkMode ? 'bg-stone-950 border-stone-800 focus:border-purple-500' : 'bg-stone-50 border-stone-200 focus:border-purple-500'}`}
                            />
                            <p className="text-[10px] opacity-40 ml-1">Ce texte est important pour le référencement géographique.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION DE VALIDATION FINALE (FLUX NATUREL) */}
            <div className={`mt-16 p-8 md:p-12 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center text-center gap-6 transition-all ${darkMode ? 'border-stone-800 bg-stone-900/30' : 'border-stone-100 bg-stone-50/50'}`}>
                <div className="space-y-2">
                    <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-stone-900'}`}>Vos modifications sont prêtes ?</h3>
                    <p className="text-xs text-stone-400 font-medium">L'enregistrement mettra à jour instantanément les coordonnées sur tout le site.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="group relative flex items-center justify-center gap-4 px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                    <span>Enregistrer les réglages</span>
                </button>
            </div>

            {/* ESPACEUR DE FIN DE PAGE POUR LE FLUX NATUREL */}
            <div className="h-32"></div>
        </div>
    );
};

export default AdminSEO;
