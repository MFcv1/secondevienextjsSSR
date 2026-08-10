import { useCallback, useEffect, useRef, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import {
    getDeliveryPolicyAdmin,
    saveDeliveryPolicyAdmin
} from '../commerce/deliveryPolicyAdminClient';
import { getAdminCachedData, loadAdminCachedData } from './adminDataCache';
import {
    adminSurfaces,
    Field,
    Notice,
    PageHeader,
    Panel,
    Toggle,
    inputClass
} from './adminUiKit';

const DELIVERY_POLICY_CACHE_KEY = 'admin-delivery-policy';

const DEFAULT_SETTINGS = {
    retrait: { id: 'retrait', active: true, label: "Retrait à l'atelier (Marseille)", sub: "Sur rendez-vous", price: 0 },
    idf: { id: 'idf', active: true, label: "Livraison Marseille & Alentours", sub: "Par nos soins", price: 49 },
    transporteur: { id: 'transporteur', active: true, label: "Transporteur Spécialisé (Cocolis)", sub: "Protections sur-mesure", price: 90 }
};

export const preloadAdminDeliveryData = ({ force = false } = {}) => (
    loadAdminCachedData(
        DELIVERY_POLICY_CACHE_KEY,
        getDeliveryPolicyAdmin,
        { force }
    )
);

const AdminLivraison = ({ darkMode }) => {
    const initialPolicyRef = useRef(getAdminCachedData(DELIVERY_POLICY_CACHE_KEY));
    const [settings, setSettings] = useState(initialPolicyRef.current?.settings || DEFAULT_SETTINGS);
    const [status, setStatus] = useState(initialPolicyRef.current ? 'ready' : 'loading');
    const [saving, setSaving] = useState(false);
    const [policyState, setPolicyState] = useState({
        policyVersion: initialPolicyRef.current?.policyVersion || null,
        controlRevision: initialPolicyRef.current?.controlRevision ?? null
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    const load = useCallback(async ({ foreground = true, force = true } = {}) => {
        if (foreground) setStatus('loading');
        setMessage({ type: '', text: '' });
        try {
            const result = await preloadAdminDeliveryData({ force });
            setSettings(result.settings);
            setPolicyState({
                policyVersion: result.policyVersion,
                controlRevision: result.controlRevision
            });
            setStatus('ready');
        } catch (error) {
            console.error('Error fetching delivery settings', error);
            if (!initialPolicyRef.current) setStatus('error');
            setMessage({
                type: 'error',
                text: error.message || 'Chargement des paramètres de livraison impossible.'
            });
        }
    }, []);

    useEffect(() => {
        void load({ foreground: !initialPolicyRef.current, force: false });
    }, [load]);

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
            void loadAdminCachedData(
                DELIVERY_POLICY_CACHE_KEY,
                async () => result,
                { force: true }
            ).catch(() => {});
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

    const surfaces = adminSurfaces(darkMode);
    const field = inputClass(darkMode);
    const disabled = saving || status !== 'ready';
    const saveDisabled = disabled || hasErrors || !policyState.policyVersion;

    return (
        <div className="space-y-5">
            <PageHeader
                darkMode={darkMode}
                description="Labels, descriptions et tarifs proposés au moment de la commande."
                title="Livraison"
                actions={(
                    <button
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${surfaces.secondaryButton}`}
                        disabled={status === 'loading'}
                        onClick={() => load()}
                        type="button"
                    >
                        <RefreshCw className={status === 'loading' ? 'animate-spin' : ''} size={15} />
                        Actualiser
                    </button>
                )}
            />

            {message.text ? (
                <Notice darkMode={darkMode} tone={message.type === 'success' ? 'success' : 'error'}>
                    {message.text}
                </Notice>
            ) : null}

            <Panel
                darkMode={darkMode}
                description="Chaque mode peut être activé, renommé et tarifé indépendamment."
                title="Modes de livraison"
                footer={(
                    <>
                        <p className={`text-xs ${surfaces.muted}`}>
                            {hasErrors
                                ? 'Corrigez les champs signalés avant d’enregistrer.'
                                : 'La publication est immédiate sur le checkout.'}
                        </p>
                        <button
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${surfaces.primaryButton}`}
                            disabled={saveDisabled}
                            onClick={handleSave}
                            type="button"
                        >
                            {saving ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
                            {saving ? 'Enregistrement…' : 'Enregistrer et publier'}
                        </button>
                    </>
                )}
            >
                <div className="space-y-3">
                    {Object.keys(settings).map((key) => {
                        const mode = settings[key];
                        return (
                            <div className={`rounded-xl border p-4 ${surfaces.softPanel}`} key={key}>
                                <div className="flex items-center justify-between gap-4">
                                    <p className="truncate text-sm font-black tracking-tight">
                                        {mode.label || 'Mode sans nom'}
                                    </p>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className={`text-xs font-semibold ${surfaces.muted}`}>
                                            {mode.active ? 'Actif' : 'Masqué'}
                                        </span>
                                        <Toggle
                                            checked={Boolean(mode.active)}
                                            disabled={disabled}
                                            id={`${key}-delivery-active`}
                                            label={`Activer ${mode.label || key}`}
                                            onChange={(next) => handleChange(key, 'active', next)}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px]">
                                    <Field darkMode={darkMode} htmlFor={`${key}-delivery-label`} label="Intitulé">
                                        <input
                                            className={field}
                                            disabled={disabled}
                                            id={`${key}-delivery-label`}
                                            onChange={(event) => handleChange(key, 'label', event.target.value)}
                                            placeholder="Livraison Marseille & Alentours"
                                            type="text"
                                            value={mode.label || ''}
                                        />
                                    </Field>
                                    <Field darkMode={darkMode} htmlFor={`${key}-delivery-description`} label="Précision">
                                        <input
                                            className={field}
                                            disabled={disabled}
                                            id={`${key}-delivery-description`}
                                            onChange={(event) => handleChange(key, 'sub', event.target.value)}
                                            placeholder="Par nos soins"
                                            type="text"
                                            value={mode.sub || ''}
                                        />
                                    </Field>
                                    <Field darkMode={darkMode} htmlFor={`${key}-delivery-price`} label="Prix (€)">
                                        <input
                                            className={`${field} text-right tabular-nums`}
                                            disabled={disabled}
                                            id={`${key}-delivery-price`}
                                            min="0"
                                            onChange={(event) => handleChange(key, 'price', event.target.value)}
                                            onFocus={(event) => event.target.select()}
                                            step="1"
                                            type="number"
                                            value={mode.price}
                                        />
                                    </Field>
                                </div>

                                {validationErrors[key] ? (
                                    <p className="mt-3 text-xs font-bold text-red-600">{validationErrors[key]}</p>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </Panel>
        </div>
    );
};

export default AdminLivraison;
