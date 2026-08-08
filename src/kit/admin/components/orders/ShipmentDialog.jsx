'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
    DEFAULT_SHIPPING_CARRIER,
    SHIPPING_CARRIERS,
    getShippingCarrierLabel,
} from '../../../commerce/shippingCarriers';
import { GhostAction, PrimaryAction } from './OrderActionButtons';
import OrderModalShell from './OrderModalShell';
import { orderReference } from './orderPresentation';

/**
 * Confirmation d'expedition ou mise a jour du suivi.
 * Le contenu envoye au client est le meme qu'avant le revamp ; seule la
 * presentation suit desormais le vocabulaire Publication.
 */
export default function ShipmentDialog({
    darkMode = false,
    error,
    mode,
    onClose,
    onSubmit,
    order,
    pending = false,
}) {
    const current = order.shipmentTracking || {};
    const [withTracking, setWithTracking] = useState(current.mode ? current.mode === 'tracked' : true);
    const [carrierCode, setCarrierCode] = useState(current.carrierCode || DEFAULT_SHIPPING_CARRIER);
    const [carrierName, setCarrierName] = useState(current.carrierCode === 'other' ? current.carrierLabel || '' : '');
    const [trackingNumber, setTrackingNumber] = useState(current.trackingNumber || '');

    const canSubmitTracked = Boolean(
        trackingNumber.trim() && (carrierCode !== 'other' || carrierName.trim())
    );

    const submitTracked = () => {
        if (!canSubmitTracked) return;
        onSubmit({
            carrierCode,
            carrierName: carrierCode === 'other' ? carrierName.trim() : null,
            trackingNumber: trackingNumber.trim(),
        });
    };

    const fieldClass = `mt-2 min-h-11 w-full rounded-[14px] border-none px-3.5 text-[12px] font-semibold outline-none ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:ring-2 ${
        darkMode
            ? 'bg-black/25 text-white ring-white/10 placeholder:text-stone-700 focus:ring-white/25'
            : 'bg-[#F7F6F3] text-stone-950 ring-black/[0.045] placeholder:text-stone-400 focus:bg-white focus:ring-stone-300'
    }`;

    return (
        <OrderModalShell
            darkMode={darkMode}
            labelledBy="shipment-dialog-title"
            describedBy="shipment-dialog-description"
            locked={pending}
            onClose={onClose}
        >
            <div className="overflow-y-auto p-6 sm:p-7 custom-scrollbar">
                <div className="flex items-start justify-between gap-5">
                    <div>
                        <p className={`text-[9px] font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                            {orderReference(order.id)}
                        </p>
                        <h3 id="shipment-dialog-title" className="mt-2 text-[20px] font-extrabold tracking-[-0.03em]">
                            {mode === 'update' ? 'Modifier le suivi' : 'Confirmer l’expédition'}
                        </h3>
                        <p id="shipment-dialog-description" className={`mt-2 max-w-[50ch] text-[12px] leading-6 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                            Ces informations seront envoyées au client et resteront accessibles dans son espace commandes.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={pending}
                        aria-label="Fermer"
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 transition-colors duration-200 disabled:opacity-40 ${darkMode ? 'text-stone-400 ring-white/10 hover:bg-white/[0.07]' : 'text-stone-500 ring-black/[0.07] hover:bg-stone-50'}`}
                    >
                        <X size={16} strokeWidth={1.8} />
                    </button>
                </div>

                <div className={`mt-6 grid grid-cols-2 gap-1 rounded-[18px] p-1.5 ${darkMode ? 'bg-white/[0.055]' : 'bg-stone-200/65'}`}>
                    <button
                        data-autofocus="true"
                        type="button"
                        onClick={() => setWithTracking(true)}
                        aria-pressed={withTracking}
                        className={`min-h-10 rounded-[13px] px-3 text-[11.5px] font-extrabold transition-colors duration-200 ${withTracking ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white') : 'text-stone-500'}`}
                    >
                        Avec numéro de suivi
                    </button>
                    <button
                        type="button"
                        onClick={() => setWithTracking(false)}
                        aria-pressed={!withTracking}
                        className={`min-h-10 rounded-[13px] px-3 text-[11.5px] font-extrabold transition-colors duration-200 ${!withTracking ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white') : 'text-stone-500'}`}
                    >
                        Sans numéro de suivi
                    </button>
                </div>

                {withTracking ? (
                    <div className="mt-5 space-y-4">
                        <label className="block">
                            <span className={`text-[9px] font-extrabold uppercase tracking-[0.12em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Transporteur</span>
                            <select
                                value={carrierCode}
                                onChange={(event) => setCarrierCode(event.target.value)}
                                disabled={pending}
                                className={fieldClass}
                            >
                                {SHIPPING_CARRIERS.map((carrier) => (
                                    <option key={carrier.code} value={carrier.code}>{carrier.label}</option>
                                ))}
                            </select>
                        </label>
                        {carrierCode === 'other' ? (
                            <label className="block">
                                <span className={`text-[9px] font-extrabold uppercase tracking-[0.12em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Nom du transporteur</span>
                                <input
                                    value={carrierName}
                                    onChange={(event) => setCarrierName(event.target.value)}
                                    maxLength={80}
                                    disabled={pending}
                                    placeholder="Ex. transporteur régional"
                                    className={fieldClass}
                                />
                            </label>
                        ) : null}
                        <label className="block">
                            <span className={`text-[9px] font-extrabold uppercase tracking-[0.12em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Numéro de suivi</span>
                            <input
                                value={trackingNumber}
                                onChange={(event) => setTrackingNumber(event.target.value)}
                                maxLength={120}
                                disabled={pending}
                                autoComplete="off"
                                placeholder="Numéro figurant sur le bordereau"
                                className={`${fieldClass} font-mono`}
                            />
                            <span className={`mt-2 block text-[11px] leading-5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                Le client verra {getShippingCarrierLabel(carrierCode, carrierName)} et ce numéro dans l’e-mail et son espace personnel.
                            </span>
                        </label>
                    </div>
                ) : (
                    <p className={`mt-5 rounded-[16px] px-4 py-4 text-[12px] leading-6 ring-1 ${darkMode ? 'bg-black/20 text-stone-400 ring-white/10' : 'bg-[#F7F6F3] text-stone-600 ring-black/[0.045]'}`}>
                        La commande sera marquée comme expédiée sans numéro. Le client sera informé que le transporteur communiquera directement les modalités de remise.
                    </p>
                )}

                {error ? (
                    <p role="alert" className="mt-5 rounded-[16px] bg-red-500/10 px-4 py-3 text-[12px] leading-5 text-red-600 ring-1 ring-red-500/15 dark:text-red-400">
                        {error}
                    </p>
                ) : null}

                <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                    <GhostAction darkMode={darkMode} label="Annuler" onClick={onClose} disabled={pending} />
                    <div className="sm:w-[260px]">
                        {withTracking ? (
                            <PrimaryAction
                                darkMode={darkMode}
                                icon="truck"
                                label={pending ? 'Enregistrement…' : (mode === 'update' ? 'Enregistrer le suivi' : 'Confirmer avec suivi')}
                                onClick={submitTracked}
                                busy={pending}
                                disabled={!canSubmitTracked}
                            />
                        ) : (
                            <PrimaryAction
                                darkMode={darkMode}
                                icon="truck"
                                label={pending ? 'Enregistrement…' : (mode === 'update' ? 'Retirer le suivi' : 'Expédier sans suivi')}
                                onClick={() => onSubmit({ carrierCode: null, carrierName: null, trackingNumber: null })}
                                busy={pending}
                            />
                        )}
                    </div>
                </div>
            </div>
        </OrderModalShell>
    );
}
