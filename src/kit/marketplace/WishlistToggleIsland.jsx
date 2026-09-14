'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthState } from '../contexts/AuthContext';
import { subscribeWishlistItems } from './wishlistState';

export default function WishlistToggleIsland({ className = '', darkMode = false } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnWishlist = pathname === '/wishlist';
  const { user } = useAuthState();
  const owner = user?.uid && !user.isAnonymous ? user.uid : 'guest';
  const [wishlist, setWishlist] = useState({ owner, count: 0 });
  const count = wishlist.owner === owner ? wishlist.count : 0;

  useEffect(() => subscribeWishlistItems(
    user,
    (_items, ids) => setWishlist({ owner, count: ids.length }),
    () => setWishlist({ owner, count: 0 })
  ), [owner, user]);

  const handleClick = (e) => {
    e.preventDefault();
    if (isOnWishlist) {
      router.back();
    } else {
      router.push('/wishlist');
    }
  };

  return (
    <button
      type="button"
      className={`relative ${className}`}
      title="Ma liste de souhaits"
      aria-label={`Ma liste de souhaits${count > 0 ? ` · ${count} pièce${count > 1 ? 's' : ''}` : ''}`}
      onClick={handleClick}
    >
      <Heart
        size={18}
        strokeWidth={1.5}
        className={`transition-colors duration-300 ${darkMode ? 'text-stone-200 group-hover:text-rose-300' : 'text-stone-900 group-hover:text-rose-500 dark:text-stone-200 dark:group-hover:text-rose-300'}`}
      />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-950 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white dark:bg-[#D9B58D] dark:text-stone-950 dark:ring-[#080807]" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </button>
  );
}
