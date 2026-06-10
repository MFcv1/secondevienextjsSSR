'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';

const WISHLIST_STORAGE_KEY = 'sv_public_product_wishlist';

const readWishlist = () => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export default function ProductDetailActionsIsland({
  productId,
  productName,
  priceLabel,
  cartItem,
  mobile = false,
}) {
  const [isInCart, setIsInCart] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLiked(readWishlist().includes(productId));
  }, [productId]);

  const toggleLiked = useCallback(() => {
    if (!productId || typeof window === 'undefined') return;
    const current = readWishlist();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
    setLiked(next.includes(productId));
  }, [productId]);

  const handleCart = useCallback(() => {
    if (isInCart) {
      window.dispatchEvent(new CustomEvent('sv:open-cart'));
      return;
    }

    setIsInCart(true);
    try {
      const event = new CustomEvent('sv:product-added', {
        detail: cartItem || { originalId: productId, id: productId, name: productName, price: 0 },
      });
      window.dispatchEvent(event);
    } catch {
      // The local route can work without the global cart shell.
    }
  }, [isInCart, productId, productName]);

  if (mobile) {
    return (
      <div className="w-full mt-4 border-t border-stone-200 pt-4 flex-shrink-0">
        <button
          type="button"
          className="w-full rounded-xl py-3.5 flex items-center justify-center gap-2 font-label text-[11px] tracking-[0.1em] uppercase active:scale-95 transition-all duration-300 bg-stone-900 text-white hover:bg-black shadow-[0_16px_32px_rgba(28,25,23,0.18)]"
          onClick={handleCart}
        >
          <ShoppingBag size={15} />
          {isInCart ? 'Voir panier' : 'Ajouter au panier'}
          {priceLabel ? <span className="opacity-50 ml-1">· {priceLabel}</span> : null}
        </button>
        <button
          type="button"
          onClick={toggleLiked}
          className="mt-3 w-full rounded-xl py-3 flex items-center justify-center gap-2 border border-stone-200 bg-white/70 font-label text-[11px] tracking-[0.1em] uppercase text-stone-800 active:scale-95 transition-all"
        >
          <Heart size={15} className={liked ? 'fill-rose-400 text-rose-400' : ''} />
          Favori
        </button>
      </div>
    );
  }

  return (
    <div className="mb-10 detail-stagger">
      <div className="p-1 rounded-2xl border bg-white/40 border-black/5 shadow-sm transition-colors duration-1000">
        <button
          type="button"
          onClick={handleCart}
          className="w-full py-4 rounded-xl flex justify-center items-center gap-2 font-label text-[11px] tracking-[0.1em] uppercase transition-all shadow-md active:scale-95 bg-stone-900 text-stone-50 hover:bg-black"
        >
          {isInCart ? (
            <>
              <ShoppingBag size={15} /> Voir au panier
            </>
          ) : (
            'Ajouter au panier'
          )}
        </button>
      </div>
    </div>
  );
}
