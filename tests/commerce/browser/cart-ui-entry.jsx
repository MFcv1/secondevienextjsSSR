import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import CartPageView from '../../../src/kit/commerce/CartPageView';

const initialItems = [
  { id: 'buffet', name: 'Buffet en chêne, années 50', material: 'Chêne naturel · Finition huilée', image: '/images/categories/buffets-config-rail.webp', price: 780, quantity: 1 },
  { id: 'chaise', name: 'Chaise de bistrot', material: 'Bois courbé', image: '/images/categories/chaises-catalog-rail.webp', price: 125, quantity: 2 },
];

function Fixture() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [checkout, setCheckout] = useState(false);
  const query = new URLSearchParams(window.location.search);
  return <>
    <button type="button" aria-label="Panier" onClick={() => setOpen(true)}>Ouvrir le panier</button>
    <button type="button">Action de la page derrière</button>
    {checkout ? <p role="status">Checkout reçu</p> : null}
    <CartPageView
      isOpen={open} onClose={() => setOpen(false)} cartItems={items}
      totalPrice={items.reduce((sum, item) => sum + item.price * item.quantity, 0)}
      onCheckout={() => { setCheckout(true); setOpen(false); }}
      onRemoveItem={async (id) => {
        if (query.has('fail')) throw new Error('Fixture: suppression refusée');
        setItems((current) => current.filter((item) => item.id !== id));
      }}
      darkMode={query.has('dark')}
    />
  </>;
}

createRoot(document.getElementById('root')).render(<Fixture />);
