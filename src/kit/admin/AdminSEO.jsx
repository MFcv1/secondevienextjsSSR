import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Save, RefreshCw } from 'lucide-react';
import KIT_CONFIG from '../config/constants';
import {
    adminSurfaces,
    Field,
    LoadingPanel,
    Notice,
    PageHeader,
    Panel,
    inputClass
} from './adminUiKit';

const AdminSEO = ({ darkMode }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

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
        setMessage({ type: '', text: '' });
        try {
            await setDoc(doc(db, 'sys_metadata', 'contact_info'), {
                ...formData,
                updatedAt: Date.now()
            }, { merge: true });
            setMessage({ type: 'success', text: 'Informations publiques mises à jour.' });
        } catch (err) {
            console.error("Error saving contact info:", err);
            setMessage({ type: 'error', text: 'Enregistrement impossible. Réessayez dans un instant.' });
        } finally {
            setSaving(false);
        }
    };

    const surfaces = adminSurfaces(darkMode);
    const field = inputClass(darkMode);

    if (loading) return <LoadingPanel darkMode={darkMode} label="Chargement des paramètres SEO…" />;

    const saveButton = (
        <button
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${surfaces.primaryButton}`}
            disabled={saving}
            onClick={handleSave}
            type="button"
        >
            {saving ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
    );

    return (
        <div className="space-y-5">
            <PageHeader
                actions={saveButton}
                darkMode={darkMode}
                description="Coordonnées publiques, réseaux sociaux et contenu du pied de page."
                title="Référencement et contact"
            />

            {message.text ? (
                <Notice darkMode={darkMode} tone={message.type === 'success' ? 'success' : 'error'}>
                    {message.text}
                </Notice>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-2">
                <Panel
                    darkMode={darkMode}
                    description="Affichées dans le pied de page et la page contact."
                    title="Coordonnées"
                >
                    <div className="space-y-4">
                        <Field darkMode={darkMode} htmlFor="seo-email" label="E-mail public">
                            <input
                                className={field}
                                id="seo-email"
                                name="email"
                                onChange={handleChange}
                                placeholder="contact@exemple.fr"
                                type="email"
                                value={formData.email}
                            />
                        </Field>
                        <Field
                            darkMode={darkMode}
                            hint="Format recommandé : 07 00 00 00 00"
                            htmlFor="seo-phone"
                            label="Téléphone"
                        >
                            <input
                                className={field}
                                id="seo-phone"
                                name="phone"
                                onChange={handleChange}
                                placeholder="07 00 00 00 00"
                                type="tel"
                                value={formData.phone}
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel
                    darkMode={darkMode}
                    description="Laissez vide pour masquer le lien correspondant."
                    title="Réseaux sociaux"
                >
                    <div className="space-y-4">
                        <Field darkMode={darkMode} htmlFor="seo-instagram" label="Instagram">
                            <input
                                className={field}
                                id="seo-instagram"
                                name="instagram"
                                onChange={handleChange}
                                placeholder="https://instagram.com/…"
                                type="url"
                                value={formData.instagram}
                            />
                        </Field>
                        <Field darkMode={darkMode} htmlFor="seo-facebook" label="Facebook">
                            <input
                                className={field}
                                id="seo-facebook"
                                name="facebook"
                                onChange={handleChange}
                                placeholder="https://facebook.com/…"
                                type="url"
                                value={formData.facebook}
                            />
                        </Field>
                    </div>
                </Panel>
            </div>

            <Panel
                darkMode={darkMode}
                description="Textes affichés en bas de chaque page du site public."
                title="Pied de page"
                footer={(
                    <>
                        <p className={`text-xs ${surfaces.muted}`}>
                            La ligne de bas de page participe au référencement local.
                        </p>
                        {saveButton}
                    </>
                )}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field darkMode={darkMode} htmlFor="seo-footer-title" label="Grand titre">
                        <input
                            className={field}
                            id="seo-footer-title"
                            name="footerTitle"
                            onChange={handleChange}
                            placeholder={KIT_CONFIG.brandName}
                            type="text"
                            value={formData.footerTitle}
                        />
                    </Field>
                    <Field darkMode={darkMode} htmlFor="seo-footer-subtitle" label="Sous-titre">
                        <input
                            className={field}
                            id="seo-footer-subtitle"
                            name="footerSubtitle"
                            onChange={handleChange}
                            placeholder="Contact"
                            type="text"
                            value={formData.footerSubtitle}
                        />
                    </Field>
                    <Field
                        className="md:col-span-2"
                        darkMode={darkMode}
                        hint="Exemple : Seconde Vie — mobilier restauré à Marseille."
                        htmlFor="seo-legacy"
                        label="Ligne de bas de page"
                    >
                        <textarea
                            className={`${field} min-h-24 resize-y leading-6`}
                            id="seo-legacy"
                            name="legacyText"
                            onChange={handleChange}
                            value={formData.legacyText}
                        />
                    </Field>
                </div>
            </Panel>
        </div>
    );
};

export default AdminSEO;
