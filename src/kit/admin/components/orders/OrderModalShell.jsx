'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])';

/**
 * Coque commune des surfaces modales des ventes : voile, piege de focus,
 * `Escape`, verrouillage du fond et restitution du focus a la fermeture.
 * `variant="sheet"` donne la feuille plein ecran utilisee sous xl.
 */
export default function OrderModalShell({
    children,
    className = '',
    darkMode = false,
    describedBy,
    labelledBy,
    locked = false,
    onClose,
    variant = 'dialog',
}) {
    const panelRef = useRef(null);
    const restoreFocusRef = useRef(null);

    useEffect(() => {
        restoreFocusRef.current = document.activeElement;
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        const timer = window.setTimeout(() => {
            const target = panelRef.current?.querySelector('[data-autofocus="true"]')
                || panelRef.current?.querySelector(FOCUSABLE)
                || panelRef.current;
            target?.focus?.();
        }, 0);
        return () => {
            window.clearTimeout(timer);
            document.body.style.overflow = overflow;
            const restore = restoreFocusRef.current;
            if (restore instanceof HTMLElement && document.contains(restore)) restore.focus();
        };
    }, []);

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            if (!locked) {
                event.stopPropagation();
                onClose?.();
            }
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = [...(panelRef.current?.querySelectorAll(FOCUSABLE) || [])];
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const isSheet = variant === 'sheet';

    return (
        <div
            className={`fixed inset-0 z-[120] flex justify-center bg-stone-950/45 backdrop-blur-[2px] sales-veil ${isSheet ? 'items-end p-0' : 'items-end p-0 sm:items-center sm:p-6'}`}
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !locked) onClose?.();
            }}
            onKeyDown={handleKeyDown}
        >
            <section
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                tabIndex={-1}
                className={`sales-sheet flex w-full flex-col overflow-hidden border outline-none ${
                    isSheet
                        ? 'h-[92dvh] rounded-t-[26px]'
                        : 'max-h-[min(760px,calc(100dvh-24px))] rounded-t-[26px] sm:max-w-[600px] sm:rounded-[26px]'
                } ${darkMode ? 'border-white/10 bg-[#11110f] text-white' : 'border-stone-200 bg-white text-stone-950'} ${className}`}
            >
                {children}
            </section>
        </div>
    );
}
