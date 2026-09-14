import { useEffect, useRef } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import styles from './CartPage.module.css';

/** Shared, lightweight shell: no data dependency before the cart is ready. */
export default function CartSurface({ isOpen, onClose, darkMode, children, loading = false }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    dialog.focus({ preventScroll: true });
    dialog.scrollTop = 0;
    return () => {
      dialog.close();
      if (!document.querySelector('dialog[open]')) {
        const target = previousFocus?.isConnected ? previousFocus : document.querySelector('button[aria-label="Panier"]');
        target?.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      className={styles.surface}
      data-theme={darkMode ? 'dark' : undefined}
      data-cart-panel
      aria-label="Votre panier"
      aria-busy={loading || undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
    >
      <header className={styles.navigation}>
        <button type="button" className={styles.back} aria-label="Continuer la visite" onClick={onClose}>
          <ArrowLeft size={17} aria-hidden="true" /><span>Continuer la visite</span>
        </button>
        <span className={styles.brand}>seconde vie<span className={styles.brandDot}>.</span></span>
        <button type="button" className={styles.close} aria-label="Fermer le panier" onClick={onClose}>
          <X size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>
      {isOpen ? children : null}
    </dialog>
  );
}
