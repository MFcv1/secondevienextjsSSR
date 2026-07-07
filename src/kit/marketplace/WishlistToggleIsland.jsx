'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

export default function WishlistToggleIsland({ className = '', darkMode = false } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnWishlist = pathname === '/wishlist';

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
      className={className}
      title="Ma liste de souhaits"
      aria-label="Ma liste de souhaits"
      onClick={handleClick}
    >
      <Heart
        size={18}
        strokeWidth={1.5}
        className={`transition-colors duration-300 ${darkMode ? 'text-stone-200 group-hover:text-rose-300' : 'text-stone-900 group-hover:text-rose-500 dark:text-stone-200 dark:group-hover:text-rose-300'}`}
      />
    </button>
  );
}
