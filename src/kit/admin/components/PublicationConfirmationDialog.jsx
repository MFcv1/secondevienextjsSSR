'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { createPortal } from 'react-dom';

const DestinationRow = ({
  active,
  detail,
  disabled = false,
  label,
  locked = false,
  onClick
}) => {
  const content = (
    <>
      <span className="min-w-0">
        <span className="block text-[13px] font-extrabold tracking-[-0.015em]">{label}</span>
        <span className="mt-0.5 block truncate text-[10px] font-medium text-stone-400">{detail}</span>
      </span>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 transition-colors duration-200 ${active ? 'bg-emerald-600 text-white ring-emerald-600' : 'text-transparent ring-black/10 dark:ring-white/15'}`} aria-hidden="true">
        {active && <Check size={13} strokeWidth={2.2} />}
      </span>
    </>
  );

  if (locked) {
    return <div className="flex min-h-14 items-center justify-between gap-4 py-3">{content}</div>;
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left transition-opacity duration-200 active:scale-[0.99] disabled:cursor-wait disabled:opacity-50"
    >
      {content}
    </button>
  );
};

const PublicationConfirmationDialog = ({
  actionLabel,
  darkMode = false,
  facebookAvailable,
  facebookSelected,
  instagramAvailable,
  instagramSelected,
  instagramUsername,
  message,
  messageIsError,
  onClose,
  onConfirm,
  onToggle,
  open,
  pageName,
  uploading
}) => {
  const [mounted, setMounted] = useState(false);
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const previousFocusRef = useRef(null);
  const uploadingRef = useRef(uploading);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
    uploadingRef.current = uploading;
  }, [onClose, uploading]);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !uploadingRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) || []);
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
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!mounted || !open) return null;

  const selectedNetworks = [
    instagramSelected ? 'Instagram' : '',
    facebookSelected ? 'Facebook' : ''
  ].filter(Boolean);
  const summary = selectedNetworks.length > 0
    ? `Le site et ${selectedNetworks.join(' + ')} seront publiés dans la même opération.`
    : 'Seul le site sera publié. Aucun réseau social ne recevra ce contenu.';

  return createPortal(
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-stone-950/45 px-4 py-8 backdrop-blur-[3px]">
      <button type="button" tabIndex={-1} aria-label="Fermer la confirmation" disabled={uploading} onClick={onClose} className="absolute inset-0 cursor-default disabled:cursor-wait" />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publication-confirmation-title"
        aria-describedby="publication-confirmation-description"
        className={`relative w-full max-w-[520px] rounded-[26px] border p-5 shadow-[0_28px_90px_rgba(28,25,23,0.24)] sm:p-7 ${darkMode ? 'border-white/10 bg-[#11110f] text-white' : 'border-stone-200 bg-white text-stone-950'}`}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-stone-400">Publication finale</p>
            <h2 id="publication-confirmation-title" className="mt-2 text-[24px] font-extrabold leading-none tracking-[-0.04em]">Où publier cet ouvrage ?</h2>
            <p id="publication-confirmation-description" className="mt-2 max-w-[40ch] text-[11px] leading-5 text-stone-500">Vérifie les destinations avant l’envoi. Le site reste toujours prioritaire.</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Fermer la confirmation"
            disabled={uploading}
            onClick={onClose}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 transition-colors duration-200 disabled:opacity-40 ${darkMode ? 'text-stone-400 ring-white/10 hover:bg-white/5 hover:text-white' : 'text-stone-500 ring-black/[0.07] hover:bg-stone-100 hover:text-stone-950'}`}
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className={`mt-6 divide-y rounded-[18px] px-4 ring-1 ${darkMode ? 'divide-white/10 bg-black/20 ring-white/10' : 'divide-black/[0.06] bg-[#F8F7F4] ring-black/[0.05]'}`}>
          <DestinationRow active detail="Toujours inclus · publication catalogue" label="Site Seconde Vie" locked />
          {instagramAvailable && (
            <DestinationRow
              active={instagramSelected}
              detail={instagramUsername ? `@${instagramUsername}` : 'Compte professionnel connecté'}
              disabled={uploading}
              label="Instagram"
              onClick={() => onToggle('instagram')}
            />
          )}
          {facebookAvailable && (
            <DestinationRow
              active={facebookSelected}
              detail={pageName || 'Page Facebook connectée'}
              disabled={uploading}
              label="Facebook"
              onClick={() => onToggle('facebook')}
            />
          )}
        </div>

        {!instagramAvailable && !facebookAvailable && (
          <p className={`mt-3 rounded-[14px] px-4 py-3 text-[10px] leading-4 ${darkMode ? 'bg-white/5 text-stone-400' : 'bg-stone-100 text-stone-500'}`}>Aucun réseau social n’est connecté. Tu peux publier uniquement sur le site ou fermer cette fenêtre pour connecter Instagram.</p>
        )}

        <div className={`mt-4 rounded-[14px] px-4 py-3 text-[10px] font-semibold leading-4 ${selectedNetworks.length > 0 ? (darkMode ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-800') : (darkMode ? 'bg-white/5 text-stone-400' : 'bg-stone-100 text-stone-600')}`}>
          {summary}
        </div>

        {message && (
          <p role={messageIsError ? 'alert' : 'status'} aria-live={messageIsError ? 'assertive' : 'polite'} className={`mt-3 rounded-[12px] px-3 py-2.5 text-[9px] font-bold ${messageIsError ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/15' : 'bg-stone-500/10 text-stone-500'}`}>{message}</p>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-[0.42fr_1fr]">
          <button type="button" disabled={uploading} onClick={onClose} className={`min-h-11 rounded-full px-4 text-[10px] font-extrabold ring-1 transition-colors duration-200 active:scale-[0.98] disabled:opacity-40 ${darkMode ? 'ring-white/10 hover:bg-white/5' : 'ring-black/[0.07] hover:bg-stone-50'}`}>Annuler</button>
          <button type="button" disabled={uploading} onClick={onConfirm} className="min-h-11 rounded-full bg-stone-950 px-5 text-[10px] font-extrabold text-white shadow-[0_14px_34px_rgba(28,25,23,0.2)] transition-[transform,opacity] duration-200 active:scale-[0.98] disabled:cursor-wait disabled:opacity-50 dark:bg-white dark:text-stone-950">{actionLabel}</button>
        </div>
      </section>
    </div>,
    document.body
  );
};

export default PublicationConfirmationDialog;
