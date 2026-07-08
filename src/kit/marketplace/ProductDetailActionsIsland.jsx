'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag } from 'lucide-react';
import { CART_STATE_CHANGED_EVENT, getCartDocumentId, readGuestCart } from '../commerce/guestCart';
import { getCurrentWishlistUser, readWishlistIds, setWishlistItem } from './wishlistState';

export default function ProductDetailActionsIsland({
  productId,
  productName,
  priceLabel,
  cartItem,
  mobile = false,
  isUnavailable = false,
  unavailableLabel = 'Indisponible',
  quoteHref = '',
}) {
  const router = useRouter();
  const [isInCart, setIsInCart] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLiked(readWishlistIds().includes(productId));
  }, [productId]);

  useEffect(() => {
    if (!productId || typeof window === 'undefined') return undefined;

    const syncLiked = () => {
      setLiked(readWishlistIds().includes(productId));
    };

    syncLiked();
    window.addEventListener('sv:wishlist-state-changed', syncLiked);
    window.addEventListener('storage', syncLiked);
    return () => {
      window.removeEventListener('sv:wishlist-state-changed', syncLiked);
      window.removeEventListener('storage', syncLiked);
    };
  }, [productId]);

  useEffect(() => {
    if (!productId || typeof window === 'undefined') return undefined;
    const cartDocId = getCartDocumentId(cartItem || { originalId: productId, id: productId });
    if (!cartDocId) return undefined;

    const hasProduct = (items = []) => items.some((item) => (
      item.id === cartDocId
      || getCartDocumentId(item) === cartDocId
      || item.originalId === productId
      || item.id === productId
    ));

    setIsInCart(hasProduct(readGuestCart()));

    const handleCartStateChanged = (event) => {
      setIsInCart(hasProduct(Array.isArray(event.detail?.items) ? event.detail.items : []));
    };

    window.addEventListener(CART_STATE_CHANGED_EVENT, handleCartStateChanged);
    return () => window.removeEventListener(CART_STATE_CHANGED_EVENT, handleCartStateChanged);
  }, [cartItem, productId]);

  const toggleLiked = useCallback(() => {
    if (!productId || typeof window === 'undefined') return;
    const nextLiked = !readWishlistIds().includes(productId);
    setLiked(nextLiked);
    setWishlistItem({
      ...(cartItem || {}),
      id: productId,
      originalId: productId,
      name: cartItem?.name || cartItem?.title || productName,
      title: cartItem?.title || cartItem?.name || productName,
    }, nextLiked, getCurrentWishlistUser()).catch((error) => {
      console.error('Product detail wishlist sync error:', error);
      setLiked(readWishlistIds().includes(productId));
    });
  }, [cartItem, productId, productName]);

  const handleCart = useCallback(() => {
    if (isUnavailable) {
      if (quoteHref) router.push(quoteHref);
      return;
    }

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
  }, [cartItem, isInCart, isUnavailable, productId, productName, quoteHref, router]);

  const disabled = isUnavailable && !quoteHref;
  const actionLabel = isUnavailable ? unavailableLabel : isInCart ? 'Deja dans le panier' : 'Ajouter au panier';

  if (mobile) {
    return (
      <div className="w-full mt-4 border-t border-stone-200 pt-4 flex-shrink-0" data-product-detail-actions>
        <button
          type="button"
          disabled={disabled}
          aria-disabled={disabled}
          data-product-detail-action-button
          className={`w-full rounded-xl py-3.5 flex items-center justify-center gap-2 font-label text-[11px] tracking-[0.1em] uppercase active:scale-95 transition-all duration-300 ${
            disabled
              ? 'cursor-not-allowed bg-stone-200 text-stone-500'
              : 'bg-stone-900 text-white hover:bg-black shadow-[0_16px_32px_rgba(28,25,23,0.18)]'
          }`}
          onClick={handleCart}
        >
          <ShoppingBag size={15} />
          {actionLabel}
          {priceLabel && !isUnavailable ? <span className="opacity-50 ml-1">· {priceLabel}</span> : null}
        </button>
        <button
          type="button"
          onClick={toggleLiked}
          className="mt-3 w-full rounded-xl py-3 flex items-center justify-center gap-2 border border-stone-200 bg-white/70 font-label text-[11px] tracking-[0.1em] uppercase text-stone-800 active:scale-95 transition-all"
        >
          <Heart size={15} className={liked ? 'fill-rose-400 text-rose-400' : ''} />
          Liste de souhaits
        </button>
      </div>
    );
  }

  return (
    <div className="mb-10 detail-stagger" data-product-detail-actions>
      <div className="p-1 rounded-2xl border bg-white/40 border-black/5 shadow-sm transition-colors duration-1000">
        <button
          type="button"
          onClick={handleCart}
          disabled={disabled}
          aria-disabled={disabled}
          data-product-detail-action-button
          className={`w-full py-4 rounded-xl flex justify-center items-center gap-2 font-label text-[11px] tracking-[0.1em] uppercase transition-all active:scale-95 ${
            disabled
              ? 'cursor-not-allowed bg-stone-200 text-stone-500'
              : 'bg-stone-900 text-stone-50 hover:bg-black shadow-md'
          }`}
        >
          {isUnavailable ? (
            actionLabel
          ) : isInCart ? (
            <>
              <ShoppingBag size={15} /> Deja dans le panier
            </>
          ) : (
            'Ajouter au panier'
          )}
        </button>
      </div>
    </div>
  );
}
