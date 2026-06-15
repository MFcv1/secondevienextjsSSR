'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WishlistView from '../../src/kit/marketplace/WishlistView';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import { getDb, loadFirestoreModule } from '../../src/kit/config/firebaseLazy';

function WishlistPageContent({ initialItems = [] }) {
  const router = useRouter();
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAF9] px-5 py-10 text-stone-950 md:px-10 md:py-14" aria-busy="true">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="space-y-4">
            <div className="h-12 w-56 animate-pulse rounded-2xl bg-stone-200" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded-full bg-stone-100" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="aspect-[3/4] animate-pulse rounded-xl bg-[#e6dccf]" key={index} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <WishlistView
      wishlistItems={wishlistItems}
      items={initialItems}
      onAddToCart={addToCart}
      onToggleWishlist={toggleWishlist}
      onClearWishlist={clearWishlist}
      onOpenAbout={() => { router.push('/a-propos'); }}
      onBack={() => { router.push('/galerie'); }}
      darkMode={darkMode}
      user={user}
      onShowLogin={() => { router.push('/admin'); }}
    />
  );
}

export default function WishlistPageIsland(props) {
  return <WishlistPageContent {...props} />;
}
