'use client';

import { ChevronUp } from 'lucide-react';

export default function FooterBackToTopButtonIsland({ darkMode = false } = {}) {
  const handleClick = () => {
    const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'auto' : 'smooth';
    const galleryScroller = document.getElementById('marketplaceGalleryScroll');
    if (galleryScroller && galleryScroller.scrollHeight > galleryScroller.clientHeight) {
      galleryScroller.scrollTo({ top: 0, behavior });
      return;
    }

    window.scrollTo({ top: 0, behavior });
  };

  return (
    <button
      type="button"
      aria-label="Retour en haut"
      onClick={handleClick}
      className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${darkMode ? 'bg-[#211f1b] text-[#f8f2ea]' : 'bg-[#f3eee7] text-stone-950'}`}
    >
      <ChevronUp size={18} />
    </button>
  );
}
