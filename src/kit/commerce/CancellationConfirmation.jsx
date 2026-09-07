import { useEffect, useRef, useState } from 'react';
import { checkoutDialogPanel, checkoutDialogPrimary, checkoutDialogButton } from './checkoutDialogStyles';

export function useCancellationConfirmation() {
    const [open, setOpen] = useState(false);
    const dialogRef = useRef(null);
    const pendingRef = useRef(null);
    const settle = (confirmed) => {
        pendingRef.current?.resolve(confirmed);
        pendingRef.current = null;
        setOpen(false);
    };
    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement;
        const dialog = dialogRef.current;
        dialog.showModal();
        return () => { dialog.close(); previous?.focus?.(); };
    }, [open]);
    useEffect(() => () => { pendingRef.current?.resolve(false); }, []);
    const confirmCancellation = () => {
        if (pendingRef.current) return pendingRef.current.promise;
        let resolve;
        const promise = new Promise((done) => { resolve = done; });
        pendingRef.current = { resolve, promise };
        setOpen(true);
        return promise;
    };
    const confirmation = open ? <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); settle(false); }} aria-label="Annuler la réservation" className={checkoutDialogPanel}>
        <h2 className="text-xl font-semibold">Annuler la réservation ?</h2>
        <p className="my-5 text-sm leading-relaxed text-stone-500">Si vous confirmez, ces pièces ne vous seront plus réservées.</p>
        <div className="grid gap-2.5">
            <button type="button" className={checkoutDialogPrimary} onClick={() => settle(false)}>Garder ma réservation</button>
            <button type="button" className={`${checkoutDialogButton} bg-red-50 text-red-700 hover:bg-red-100`} onClick={() => settle(true)}>Annuler et retourner à la galerie</button>
        </div>
    </dialog> : null;
    return { confirmCancellation, confirmation };
}
