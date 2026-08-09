'use client';

import { GhostAction, PrimaryAction } from './OrderActionButtons';
import OrderModalShell from './OrderModalShell';
import { orderReference } from './orderPresentation';

/**
 * Remplace `window.confirm` : meme grammaire que la modale d'expedition,
 * donc aucune rupture de contexte au moment d'un acte irreversible.
 */
export default function ConfirmDialog({
    confirm,
    darkMode = false,
    icon = 'check',
    onCancel,
    onConfirm,
    orderId,
    pending = false,
}) {
    return (
        <OrderModalShell
            darkMode={darkMode}
            labelledBy="order-confirm-title"
            describedBy="order-confirm-body"
            locked={pending}
            onClose={onCancel}
        >
            <div className="p-6 sm:p-7">
                <p className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                    {orderReference(orderId)}
                </p>
                <h3 id="order-confirm-title" className="mt-2 text-[20px] font-extrabold tracking-[-0.03em]">
                    {confirm.title}
                </h3>
                <p id="order-confirm-body" className={`mt-2 max-w-[46ch] text-[12px] leading-6 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    {confirm.body}
                </p>
                <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                    <GhostAction darkMode={darkMode} label="Annuler" onClick={onCancel} disabled={pending} />
                    <div className="sm:w-[240px]">
                        <PrimaryAction
                            darkMode={darkMode}
                            label={confirm.action}
                            icon={icon}
                            busy={pending}
                            onClick={onConfirm}
                        />
                    </div>
                </div>
            </div>
        </OrderModalShell>
    );
}
