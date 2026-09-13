import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';
import CartSurface from './CartSurface';
import styles from './CartPage.module.css';

const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

function AnimatedAmount({ value }) {
  const formatted = money.format(value);
  return (
    <span className={styles.amount} aria-label={formatted}>
      <span key={formatted} className={styles.digits} aria-hidden="true">
        {Array.from(formatted).map((character, index) => (
          <span className={styles.digitWindow} key={index}>
            <span className={styles.digit} style={{ '--digit-delay': `${Math.min(index, 12) * 45}ms` }}>{character}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

function Reveal({ children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.IntersectionObserver) return undefined;
    element.dataset.reveal = 'pending';
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.reveal = 'visible';
      observer.disconnect();
    }, { root: element.closest('dialog'), threshold: 0.08 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`${styles.reveal} ${className}`}>{children}</div>;
}

function CartItem({ item, onRemoveItem, onRemoved }) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const quantity = Number(item.quantity) || 1;
  const remove = async () => {
    if (removing) return;
    setRemoving(true);
    setError('');
    try {
      await onRemoveItem(item.id);
      onRemoved(item.name);
    } catch {
      setError('Cette pièce n’a pas pu être retirée. Réessayez.');
      setRemoving(false);
    }
  };
  return (
    <Reveal>
      <article className={styles.item} aria-label={item.name}>
        <div className={styles.imageFrame}>
          {/* Cart payloads already carry the catalogue image; keep its existing URL. onError is a load event, not an interaction. */}
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/no-noninteractive-element-interactions */}
          <img
            src={item.image || '/images/furniture-placeholder.svg'}
            alt={item.name}
            width="320" height="360" decoding="async"
            onError={(event) => {
              if (!event.currentTarget.src.endsWith('/images/furniture-placeholder.svg')) event.currentTarget.src = '/images/furniture-placeholder.svg';
            }}
          />
        </div>
        <div className={styles.itemInfo}>
          <p className={styles.eyebrow}>Votre sélection</p>
          <h3>{item.name}</h3>
          {item.material ? <p className={styles.material}>{item.material}</p> : null}
          <p className={styles.quantity}>Quantité {quantity}</p>
        </div>
        <div className={styles.itemActions}>
          <p className={styles.itemPrice}>{money.format((Number(item.price) || 0) * quantity)}</p>
          {quantity > 1 ? <p className={styles.unitPrice}>{money.format(Number(item.price) || 0)} / pièce</p> : null}
          <button type="button" onClick={remove} disabled={removing} className={styles.remove} aria-label={`Retirer ${item.name} du panier`}>
            {removing ? 'Suppression…' : 'Retirer'}
          </button>
          {error ? <p role="alert" className={styles.error}>{error}</p> : null}
        </div>
      </article>
    </Reveal>
  );
}

export default function CartPageView({ isOpen, onClose, cartItems, onRemoveItem, totalPrice, onCheckout, darkMode, loading = false, loadError = '' }) {
  const [announcement, setAnnouncement] = useState('');
  const headingRef = useRef(null);
  const count = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const onRemoved = (name) => {
    setAnnouncement(`${name} a été retiré du panier.`);
    headingRef.current?.focus({ preventScroll: true });
  };
  const checkoutButton = (
    <button type="button" className={styles.primary} onClick={onCheckout} disabled={loading || Boolean(loadError)}>
      Valider la commande <ArrowRight size={17} aria-hidden="true" />
    </button>
  );

  return (
    <CartSurface isOpen={isOpen} onClose={onClose} darkMode={darkMode} loading={loading}>
      <div className={styles.content}>
        <p role="status" className={styles.srOnly}>{announcement}</p>
        {loadError ? <p className={styles.error} role="alert">{loadError}</p> : null}
        {loading && !cartItems.length ? (
          <section className={styles.empty} role="status"><ShoppingBag size={36} strokeWidth={1} /><h1>Votre panier se prépare.</h1><p>Vos pièces arrivent dans un instant.</p></section>
        ) : cartItems.length ? (
          <>
            <section className={styles.hero}>
              <p className={styles.eyebrow}>Votre panier · {count} pièce{count > 1 ? 's' : ''}</p>
              <h1 ref={headingRef} tabIndex={-1}>Une nouvelle histoire.<br /><span>Chez vous.</span></h1>
              <AnimatedAmount value={totalPrice} />
              <p className={styles.totalNote}>Sous-total · Livraison calculée à l’étape suivante.</p>
              {checkoutButton}
              <p className={styles.secure}><ShieldCheck size={15} aria-hidden="true" /> Paiement sécurisé par Stripe</p>
            </section>
            <section className={styles.selection} aria-label="Pièces de votre panier">
              <div className={styles.sectionHeading}><h2>Les pièces choisies.</h2><span>{String(count).padStart(2, '0')}</span></div>
              <div className={styles.items}>
                {cartItems.map((item) => <CartItem key={item.id} item={item} onRemoveItem={onRemoveItem} onRemoved={onRemoved} />)}
              </div>
            </section>
            <Reveal className={styles.summarySection}>
              <div className={styles.summaryIntro}><p className={styles.eyebrow}>La suite de leur histoire</p><h2>Il ne manque <br />plus que vous.</h2><p>Retrouvez vos pièces et choisissez votre mode de livraison à l’étape suivante.</p></div>
              <section className={styles.summary} aria-label="Récapitulatif du panier">
                <dl><div><dt>Pièces ({count})</dt><dd>{money.format(totalPrice)}</dd></div><div><dt>Livraison</dt><dd>Calculée à l’étape suivante</dd></div><div className={styles.summaryTotal}><dt>Sous-total</dt><dd>{money.format(totalPrice)}</dd></div></dl>
                {checkoutButton}
                <p className={styles.summaryNote}>Les disponibilités et les prix sont confirmés lors de la commande.</p>
              </section>
            </Reveal>
            <Reveal className={styles.reassurance}>
              <div><ShieldCheck size={23} strokeWidth={1.3} aria-hidden="true" /><h3>Un paiement en confiance.</h3><p>Vos informations de paiement sont traitées par Stripe.</p></div>
              <div><Truck size={23} strokeWidth={1.3} aria-hidden="true" /><h3>La prochaine étape, chez vous.</h3><p>Les options et frais de livraison sont précisés avant le paiement.</p></div>
            </Reveal>
          </>
        ) : !loadError ? (
          <section className={styles.empty}>
            <span className={styles.emptyIcon}><ShoppingBag size={38} strokeWidth={1} aria-hidden="true" /></span>
            <p className={styles.eyebrow}>Votre panier</p>
            <h1 ref={headingRef} tabIndex={-1}>Une place pour<br />un coup de cœur.</h1>
            <p>Votre panier est encore vide.<br />La prochaine belle pièce vous attend peut-être.</p>
            <button type="button" className={styles.primary} onClick={onClose}>Continuer la visite <ArrowRight size={17} aria-hidden="true" /></button>
          </section>
        ) : null}
        <footer className={styles.footer}><span>Seconde Vie</span><span>Des meubles. Des histoires. La vôtre.</span></footer>
      </div>
    </CartSurface>
  );
}
