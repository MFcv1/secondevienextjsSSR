'use client';

import React, { useCallback, useState } from 'react';
import ArchitecturalProductDetail from './ArchitecturalProductDetail';

export default function ProductDetailRouteExperience({ product }) {
  const [cartItems, setCartItems] = useState([]);

  const handleBack = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = '/';
  }, []);

  const handleAddToCart = useCallback((item) => {
    if (!item?.id) return;
    setCartItems((current) => (
      current.some((cartItem) => cartItem.id === item.id)
        ? current
        : [...current, item]
    ));
  }, []);

  return (
    <ArchitecturalProductDetail
      item={product}
      onBack={handleBack}
      onAddToCart={handleAddToCart}
      onOpenCart={() => {}}
      darkMode={false}
      setHeaderProps={() => {}}
      cartItems={cartItems}
      toggleTheme={() => {}}
      onOpenMenu={() => {}}
      initialDesktopDetailViewport
    />
  );
}
