import Link from 'next/link';
import { Heart, Search } from 'lucide-react';
import KIT_CONFIG from '../config/constants';
import PremiumMegaMenuLazyIsland from './PremiumMegaMenuLazyIsland';
import DarkModeToggleIsland from './DarkModeToggleIsland';
import HeaderAccountIsland from './HeaderAccountIsland';
import GlobalMenuTriggerIsland from './GlobalMenuTriggerIsland';
import LazyCartPanelIsland from './LazyCartPanelIsland';

export default function ArchitecturalHeaderServer({ darkMode = false } = {}) {
  const surfaceTone = darkMode
    ? 'border-white/[0.06] bg-[#080807] text-stone-100 shadow-[0_1px_0_rgba(255,255,255,0.04)]'
    : 'border-stone-100 bg-white text-stone-900 shadow-none dark:border-white/[0.06] dark:bg-[#080807] dark:text-stone-100 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]';
  const actionClusterTone = darkMode
    ? 'bg-white/[0.055] ring-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_44px_rgba(0,0,0,0.35)] backdrop-blur-xl'
    : 'bg-stone-100/85 ring-stone-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-white/[0.055] dark:ring-white/[0.10] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_44px_rgba(0,0,0,0.35)] dark:backdrop-blur-xl';
  const actionButtonTone = darkMode
    ? 'text-stone-200 hover:bg-white/[0.10] hover:text-[#D9B58D] focus-visible:ring-[#D9B58D]/45'
    : 'text-stone-800 hover:bg-white hover:text-[#8B5C42] focus-visible:ring-[#8B5C42]/25 dark:text-stone-200 dark:hover:bg-white/[0.10] dark:hover:text-[#D9B58D] dark:focus-visible:ring-[#D9B58D]/45';
  const actionButtonClass = `relative group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${actionButtonTone}`;

  return (
    <>
      <header className={`sticky top-0 z-50 border-b transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-in-out safe-pt-header ${surfaceTone}`}>
        <div className="relative mx-auto flex h-16 max-w-[1920px] items-center justify-between px-3 md:h-[76px] md:px-8">
          <div className="z-10 -ml-1 flex shrink-0 items-center md:-ml-8">
            <Link href="/" prefetch={false} className="group flex items-center gap-1 text-inherit no-underline">
              <img
                src="/images/logoanais-320.webp"
                alt="Seconde Vie"
                width="320"
                height="240"
                decoding="async"
                className={`h-10 w-auto object-contain transition-all duration-500 md:h-[50px] ${darkMode ? 'brightness-0 invert opacity-100' : 'brightness-0 opacity-80 dark:invert dark:opacity-100'}`}
              />
              <span className="flex flex-col leading-none">
                <span className={`flex items-center gap-0.5 font-serif text-[16px] font-bold tracking-normal transition-colors md:text-[24px] ${darkMode ? 'text-stone-100 group-hover:text-[#D9B58D]' : 'text-stone-900 group-hover:text-stone-600 dark:text-stone-100 dark:group-hover:text-[#D9B58D]'}`}>
                  {KIT_CONFIG.brandName}<span className="text-[26px] leading-none text-orange-600">.</span>
                </span>
                <span className={`mt-0.5 font-serif text-[11px] italic md:text-[14px] ${darkMode ? 'text-stone-400' : 'text-stone-500 dark:text-stone-400'}`}>
                  {KIT_CONFIG.brandTagline}
                </span>
              </span>
            </Link>
          </div>

          <form action="/" className="absolute left-1/2 z-0 hidden w-full max-w-xl -translate-x-1/2 px-4 lg:flex xl:max-w-2xl">
            <div className={`relative flex w-full items-center overflow-hidden rounded-md border transition-[background-color,border-color,box-shadow] duration-300 ${darkMode ? 'border-white/10 bg-[#151412] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] focus-within:border-[#D9B58D]/45 focus-within:shadow-[0_0_0_3px_rgba(217,181,141,0.10)]' : 'border-transparent bg-[#F2F0ED] focus-within:border-stone-300 dark:border-white/10 dark:bg-[#151412] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:focus-within:border-[#D9B58D]/45 dark:focus-within:shadow-[0_0_0_3px_rgba(217,181,141,0.10)]'}`}>
              <input
                type="search"
                name="q"
                placeholder="Rechercher un produit..."
                className={`w-full bg-transparent py-2.5 pl-4 pr-10 font-sans text-[13px] tracking-wide outline-none ${darkMode ? 'text-stone-100 placeholder-stone-500' : 'text-stone-800 placeholder-stone-400 dark:text-stone-100 dark:placeholder-stone-500'}`}
              />
              <button
                type="submit"
                aria-label="Rechercher"
                className="absolute right-3 text-stone-400 transition-colors hover:text-stone-600 focus-visible:outline-none focus-visible:text-[#8B5C42] dark:text-stone-500 dark:hover:text-[#D9B58D] dark:focus-visible:text-[#D9B58D]"
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
                <Heart size={18} strokeWidth={1.5} className={`transition-colors duration-300 ${darkMode ? 'text-stone-200 group-hover:text-rose-300' : 'text-stone-900 group-hover:text-rose-500 dark:text-stone-200 dark:group-hover:text-rose-300'}`} />
              </Link>

              <LazyCartPanelIsland className={actionButtonClass} darkMode={darkMode} />

              <GlobalMenuTriggerIsland darkMode={darkMode} />
            </div>
          </div>
        </div>
      </header>
      <PremiumMegaMenuLazyIsland darkMode={darkMode} />
    </>
  );
}
