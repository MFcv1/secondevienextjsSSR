'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthState } from '../contexts/AuthContext';
import { listMyOrdersV2, COMMERCE_V2_CONSUMERS_ENABLED } from './commerceV2Client';
import { createCommerceCommandId, requestOrderCancellation } from './commerceCommandClient';
import { isPendingCheckout, pendingCheckoutMessage, prepareOwnedCheckoutResume } from './pendingCheckout';
import { CHECKOUT_RECOVERY_CHANGED_EVENT, CHECKOUT_RECOVERY_STORAGE_KEY } from './checkoutRecovery';
import { useCancellationConfirmation } from './CancellationConfirmation';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { checkoutDialogPanel, checkoutDialogPrimary, checkoutDialogSecondary } from './checkoutDialogStyles';

export default function CheckoutRecoveryPrompt() {
    const { user } = useAuthState();
    return <OwnedPrompt key={user?.uid || 'guest'} user={user} />;
}

function OwnedPrompt({ user }) {
    const pathname = usePathname();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const { confirmCancellation, confirmation } = useCancellationConfirmation();
    const presented = useRef(false);
    const offeredOrders = useRef(new Set());
    const [returnVersion, setReturnVersion] = useState(0);
    const dialog = useRef(null);
    const mounted = useRef(true);
    const commandId = useRef(null);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        const changed = (event) => {
            if (event.type === 'storage' && event.key !== CHECKOUT_RECOVERY_STORAGE_KEY) return;
            presented.current = false;
            setReturnVersion((value) => value + 1);
        };
        window.addEventListener(CHECKOUT_RECOVERY_CHANGED_EVENT, changed);
        window.addEventListener('storage', changed);
        return () => {
            window.removeEventListener(CHECKOUT_RECOVERY_CHANGED_EVENT, changed);
            window.removeEventListener('storage', changed);
        };
    }, []);
    useEffect(() => {
        if (!COMMERCE_V2_CONSUMERS_ENABLED || !user?.uid || presented.current || !['/', '/galerie'].includes(pathname)) return;
        presented.current = true;
        listMyOrdersV2({ pageSize: 25 }).then((result) => {
            if (!mounted.current) return;
            const pending = result.orders?.find((candidate) => candidate.userId === user.uid && isPendingCheckout(candidate));
            if (pending && !offeredOrders.current.has(pending.id)) {
                offeredOrders.current.add(pending.id);
                setOrder(pending);
            }
        }).catch(() => { /* The account retains its bounded retry/error UI. */ });
    }, [pathname, user?.uid, returnVersion]);
    useEffect(() => {
        if (!order || !['/', '/galerie'].includes(pathname)) return;
        const previous = document.activeElement;
        const element = dialog.current;
        element?.showModal();
        return () => { element?.close(); previous?.focus?.(); };
    }, [order, pathname]);
    const cancel = async () => {
        if (busy) return;
        setBusy(true);
        if (!await confirmCancellation()) { if (mounted.current) setBusy(false); return; }
        if (!mounted.current) return;
        commandId.current ||= createCommerceCommandId('cancel');
        try {
            const result = await requestOrderCancellation(order.id, 'Annulation explicite depuis la galerie', commandId.current);
            if (!mounted.current) return;
            if (result.outcome === 'canceled') { setOrder(null); return; }
            setNotice(result.outcome === 'paid' ? 'Votre paiement est confirmé. Retrouvez la commande dans votre compte.' : 'Le paiement est en cours de vérification.');
        } catch {
            if (mounted.current) setNotice('L’annulation reste à vérifier. Consultez le dossier avant de réessayer.');
        } finally { if (mounted.current) setBusy(false); }
    };
    if (!order) return null;
    return <dialog ref={dialog} onCancel={(event) => { if (busy) event.preventDefault(); else setOrder(null); }} className={checkoutDialogPanel} aria-labelledby="resume-checkout-title" aria-describedby="resume-checkout-description">
        {confirmation}
        <div aria-hidden="true" className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70"><ShoppingBag size={22} strokeWidth={1.5} /></div>
        <h2 id="resume-checkout-title" className="text-2xl font-semibold leading-tight tracking-tight">Votre réservation vous attend</h2>
        <p id="resume-checkout-description" className="mt-3 mb-6 text-sm leading-relaxed text-stone-500" role="status">{notice || pendingCheckoutMessage(order)}</p>
        <div className="grid gap-2.5">
            <button type="button" className={checkoutDialogPrimary} disabled={busy} onClick={() => { prepareOwnedCheckoutResume(order, user.uid); setOrder(null); router.push('/checkout'); }}>Reprendre le paiement <ArrowUpRight aria-hidden="true" size={17} /></button>
            <button type="button" className={checkoutDialogSecondary} disabled={busy} onClick={() => setOrder(null)}>Garder ma réservation</button>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-stone-200/70 pt-4 text-xs font-medium">
            <button type="button" disabled={busy} onClick={() => { setOrder(null); router.push('/mes-commandes'); }} className="min-h-11 rounded-lg px-1 text-stone-500 hover:text-stone-900 focus-visible:outline-offset-4 disabled:opacity-50">Consulter le dossier</button>
            <button type="button" disabled={busy} onClick={cancel} className="min-h-11 rounded-lg px-1 text-red-700 hover:text-red-800 focus-visible:outline-offset-4 disabled:opacity-50">{busy ? 'Vérification…' : 'Annuler la réservation'}</button>
        </div>
    </dialog>;
}
