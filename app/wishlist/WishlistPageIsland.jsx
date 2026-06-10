'use client';

import { useEffect, useState } from 'react';
import WishlistView from '../../src/kit/marketplace/WishlistView';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import { getDb, loadFirestoreModule } from '../../src/kit/config/firebaseLazy';

function WishlistPageContent({ initialItems = [] }) {
  const { user, loading } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try {
      setDarkMode(window.localStorage.getItem('darkMode') === 'true');
    } catch {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.isAnonymous) {
      setWishlistItems([]);
      return undefined;
    }

    let cancelled = false;
    let unsubscribe = null;

    Promise.all([getDb(), loadFirestoreModule()])
      .then(([db, { collection, onSnapshot, query }]) => {
        if (cancelled) return;
        unsubscribe = onSnapshot(
          query(collection(db, 'users', user.uid, 'wishlist')),
          (snap) => setWishlistItems(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))),
          (error) => console.error('Wishlist sync error:', error)
        );
      })
      .catch((error) => {
        if (!cancelled) console.error('Wishlist sync error:', error);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user]);

  const addToCart = async (item) => {
    if (!user || user.isAnonymous) return;
    const [db, { addDoc, collection, serverTimestamp }] = await Promise.all([getDb(), loadFirestoreModule()]);
    await addDoc(collection(db, 'users', user.uid, 'cart'), {
      originalId: item.id,
      collectionName: item.collectionName || 'furniture',
      name: item.name,
      price: item.currentPrice || item.startingPrice || item.price || 0,
      image: item.images?.[0] || item.imageUrl || item.image || '',
      material: item.material || 'Bois',
      quantity: 1,
      addedAt: serverTimestamp(),
    });
  };

  const toggleWishlist = async (item) => {
    if (!user || user.isAnonymous) return;
    const [db, { deleteDoc, doc, serverTimestamp, setDoc }] = await Promise.all([getDb(), loadFirestoreModule()]);
    const originalId = item.originalId || item.id;
    const exists = wishlistItems.some((entry) => (entry.originalId || entry.id) === originalId);
    const docRef = doc(db, 'users', user.uid, 'wishlist', originalId);
    if (exists) {
      await deleteDoc(docRef);
      return;
    }
    await setDoc(docRef, {
      originalId,
      name: item.name,
      price: item.currentPrice || item.startingPrice || item.price || 0,
      image: item.images?.[0] || item.imageUrl || item.image || '',
      material: item.material || 'Bois',
      addedAt: serverTimestamp(),
    });
  };

  const clearWishlist = async () => {
    if (!user || user.isAnonymous) return;
    const [db, { doc, writeBatch }] = await Promise.all([getDb(), loadFirestoreModule()]);
    const batch = writeBatch(db);
    wishlistItems.forEach((item) => {
      batch.delete(doc(db, 'users', user.uid, 'wishlist', item.id));
    });
    await batch.commit();
  };

  if (loading) return <div className="min-h-screen bg-[#FAFAF9]" />;

  return (
    <WishlistView
      wishlistItems={wishlistItems}
      items={initialItems}
      onAddToCart={addToCart}
      onToggleWishlist={toggleWishlist}
      onClearWishlist={clearWishlist}
      onOpenAbout={() => { window.location.href = '/a-propos'; }}
      onBack={() => { window.location.href = '/galerie'; }}
      darkMode={darkMode}
      user={user}
      onShowLogin={() => { window.location.href = '/admin'; }}
    />
  );
}

export default function WishlistPageIsland(props) {
  return <WishlistPageContent {...props} />;
}
