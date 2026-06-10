import Link from 'next/link';
import { Heart, Search } from 'lucide-react';
import KIT_CONFIG from '../config/constants';
import PremiumMegaMenuLazyIsland from './PremiumMegaMenuLazyIsland';
import DarkModeToggleIsland from './DarkModeToggleIsland';
import HeaderAccountIsland from './HeaderAccountIsland';
import GlobalMenuTriggerIsland from './GlobalMenuTriggerIsland';
import CartPanelIsland from './CartPanelIsland';

export default function ArchitecturalHeaderServer({ darkMode = false } = {}) {
  const surfaceTone = darkMode ? 'bg-[#0A0A0A] text-stone-200' : 'bg-white text-stone-900';
  const actionClusterTone = darkMode
    ? 'bg-white/[0.045] ring-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
    : 'bg-stone-100/85 ring-stone-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]';
  const actionButtonTone = darkMode
    ? 'text-stone-200 hover:bg-white/[0.08] hover:text-[#D9B58D]'
    : 'text-stone-800 hover:bg-white hover:text-[#8B5C42]';
  const actionButtonClass = `relative group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${actionButtonTone}`;

  return (
    <>
      <header className={`sticky top-0 z-50 transition-[transform,background-color,color] duration-150 ease-in-out safe-pt-header ${surfaceTone}`}>
        <div className="relative mx-auto flex h-16 max-w-[1920px] items-center justify-between px-3 md:h-[76px] md:px-8">
          <div className="z-10 -ml-1 flex shrink-0 items-center md:-ml-8">
            <Link href="/" prefetch={false} className="group flex items-center gap-1 text-inherit no-underline">
              <img
                src="/images/logoanais-320.webp"
                alt="Seconde Vie"
                width="320"
                height="240"
                decoding="async"
                className={`h-10 w-auto object-contain transition-all duration-500 md:h-[50px] ${darkMode ? 'brightness-0 invert opacity-100' : 'brightness-0 opacity-80'}`}
              />
              <span className="flex flex-col leading-none">
                <span className={`flex items-center gap-0.5 font-serif text-[16px] font-bold tracking-normal transition-colors md:text-[24px] ${darkMode ? 'text-stone-200 group-hover:text-stone-400' : 'text-stone-900 group-hover:text-stone-600'}`}>
                  {KIT_CONFIG.brandName}<span className="text-[26px] leading-none text-orange-600">.</span>
                </span>
                <span className={`mt-0.5 font-serif text-[11px] italic md:text-[14px] ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                  {KIT_CONFIG.brandTagline}
                </span>
              </span>
            </Link>
          </div>

          <form action="/galerie" className="absolute left-1/2 z-0 hidden w-full max-w-xl -translate-x-1/2 px-4 lg:flex xl:max-w-2xl">
            <div className={`relative flex w-full items-center overflow-hidden rounded-md border transition-colors ${darkMode ? 'border-white/10 bg-[#1A1A1A] focus-within:border-white/30' : 'border-transparent bg-[#F2F0ED] focus-within:border-stone-300'}`}>
              <input
                type="search"
                name="q"
                placeholder="Rechercher un produit..."
                className={`w-full bg-transparent py-2.5 pl-4 pr-10 font-sans text-[13px] tracking-wide outline-none ${darkMode ? 'text-stone-200 placeholder-stone-500' : 'text-stone-800 placeholder-stone-400'}`}
              />
              <button
                type="submit"
                aria-label="Rechercher"
                className="absolute right-3 text-stone-400 transition-colors hover:text-stone-600 dark:hover:text-stone-200"
              >
                <Search size={16} strokeWidth={1.5} />
              </button>
            </div>
          </form>

          <div className="z-10 flex shrink-0 items-center gap-2 md:gap-4">
            <div className={`flex items-center gap-1 rounded-full p-1 ring-1 ${actionClusterTone}`}>
              <HeaderAccountIsland darkMode={darkMode} />

              <DarkModeToggleIsland className={actionButtonClass} />

              <Link href="/wishlist" prefetch={false} className={actionButtonClass} title="Ma wishlist" aria-label="Ma wishlist">
                <Heart size={18} strokeWidth={1.5} className={`transition-colors duration-300 ${darkMode ? 'text-stone-200 group-hover:text-rose-400' : 'text-stone-900 group-hover:text-rose-500'}`} />
              </Link>

              <CartPanelIsland className={actionButtonClass} darkMode={darkMode} />

              <GlobalMenuTriggerIsland darkMode={darkMode} />
            </div>
          </div>
        </div>
      </header>
      <PremiumMegaMenuLazyIsland darkMode={darkMode} />
    </>
  );
}
