import { useState } from 'react';
import Link from 'next/link';
import { getProductCardImage } from '../../utils/imageUtils';
import { getProductUrl } from '../../utils/slug';
import { getProductPriceAmount, getPurchaseUnavailableLabel, isPurchasable } from './purchasability';
import styles from './CartPage.module.css';

const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

function Favorite({ item, inCart, onAdd, onNavigate }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const available = !item.catalogUnavailable && isPurchasable(item);
  const add = async () => {
    if (pending || inCart) return;
    setPending(true);
    setError('');
    try {
      if (!await onAdd({ ...item, price: getProductPriceAmount(item), image: item.images?.[0] || item.imageUrl || item.image || '', quantity: 1 })) throw new Error('not-added');
    } catch {
      setError('Ajout impossible. Réessayez.');
    } finally { setPending(false); }
  };
  return (
    <article className={styles.favorite}>
      {/* Catalogue thumbnail, no remote Firestore fallback. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={getProductCardImage(item).src || '/images/furniture-placeholder.svg'} alt="" width="88" height="104" loading="lazy" />
      <div>
        <h3>{item.catalogUnavailable ? item.name : <Link href={getProductUrl(item)} onClick={onNavigate}>{item.name || item.title}</Link>}</h3>
        {!item.catalogUnavailable && !item.priceOnRequest && getProductPriceAmount(item) > 0 ? <p>{money.format(getProductPriceAmount(item))}</p> : null}
        {!available ? <p>{getPurchaseUnavailableLabel(item)}</p> : null}
        {available ? <button type="button" className={styles.favoriteAdd} disabled={pending || inCart} onClick={add}>
          {inCart ? 'Dans votre panier' : pending ? 'Ajout…' : 'Ajouter au panier'}
        </button> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </div>
    </article>
  );
}

export default function CartFavorites({ favorites, cartItems, onAdd, onNavigate }) {
  if (!favorites || (!favorites.count && !favorites.loading && !favorites.error)) return null;
  const ids = new Set(cartItems.map(item => String(item.originalId || item.id)));
  return (
    <section className={styles.favorites} aria-label="Vos favoris">
      <div className={styles.sectionHeading}><h2>Vos coups de cœur.</h2><span>{favorites.count || ''}</span></div>
      {favorites.loading ? <p role="status" className={styles.favoritesNote}>Chargement de vos favoris…</p> : null}
      {favorites.error ? <p role="alert" className={styles.error}>{favorites.error}</p> : null}
      <div className={styles.favoriteGrid}>{favorites.items.map(item => <Favorite key={item.id} item={item} inCart={ids.has(String(item.id))} onAdd={onAdd} onNavigate={onNavigate} />)}</div>
      {favorites.count > 12 ? <Link className={styles.favoriteAdd} href="/wishlist" onClick={onNavigate}>Voir tous mes favoris ({favorites.count})</Link> : null}
    </section>
  );
}
