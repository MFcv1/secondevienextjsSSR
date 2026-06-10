import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getCategoryUrl } from '../../utils/slug';

export default function CategoryRailServer({
  categories = [],
  descriptions = {},
  getImageSrc = (id) => `/images/categories/${id}-config-rail.webp`,
  darkMode = false,
} = {}) {
  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <section className="relative z-20 isolate -mt-[62px] w-full md:-mt-[135px]">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 top-[62px] z-0 md:top-[135px] ${darkMode ? 'bg-[#121212]' : 'bg-[#FAFAF9]'}`}
      />

      <div className="relative z-10 grid grid-cols-4 gap-3 px-4 pb-3 md:hidden">
        {safeCategories.slice(0, 4).map((cat, index) => (
          <Link key={cat.id} href={getCategoryUrl(cat.id)} prefetch={false} className="group flex min-w-0 cursor-pointer flex-col items-center text-inherit no-underline">
            <div className={`mb-2 h-[112px] w-full max-w-[74px] overflow-hidden rounded-[999px] border-[4px] shadow-[0_10px_24px_rgba(0,0,0,0.16)] ${darkMode ? 'border-[#1A1A1A]' : 'border-white'}`}>
              <img
                src={getImageSrc(cat.id)}
                sizes="74px"
                alt={cat.label}
                loading="eager"
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'auto'}
                className="h-full w-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-active:scale-[1.04]"
              />
            </div>
            <span className="w-full truncate text-center font-sans text-[8px] font-black uppercase tracking-widest">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="relative z-10 hidden translate-y-[52px] md:mx-auto md:grid md:w-full md:max-w-[900px] md:grid-cols-2 md:gap-[16px] md:px-6 md:pb-10 lg:translate-y-[45px] lg:max-w-[1100px] lg:px-8 lg:pb-14 xl:max-w-[1440px] xl:grid-cols-4 xl:gap-[18px] xl:px-6 xl:pb-16">
        {safeCategories.map((cat, index) => (
          <Link
            key={cat.id}
            href={getCategoryUrl(cat.id)}
            prefetch={false}
            className={`relative flex h-[152px] min-w-0 items-center rounded-[16px] p-[5px] text-inherit no-underline shadow-[0_18px_42px_rgba(33,27,19,0.07)] lg:h-[162px] lg:p-[6px] 2xl:h-[178px] 2xl:p-[6px] ${darkMode ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#181716]'}`}
          >
            <div className={`h-[142px] w-[118px] flex-none overflow-hidden rounded-[11px] border lg:h-[150px] lg:w-[130px] 2xl:h-[166px] 2xl:w-[150px] ${darkMode ? 'border-white/14 bg-white/[0.04]' : 'border-[#d8cfc5] bg-[#f8f4ef]'}`}>
              <div className="h-full w-full overflow-hidden rounded-[10px] bg-stone-100">
                <img
                  src={getImageSrc(cat.id)}
                  sizes="(min-width: 1536px) 150px, (min-width: 1024px) 130px, 118px"
                  alt={cat.label}
                  loading={index < 4 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority="auto"
                  className="h-full w-full object-cover object-center"
                />
              </div>
            </div>
            <div className="relative ml-4 flex h-[142px] min-w-0 flex-1 flex-col items-start justify-between overflow-hidden py-1 lg:ml-5 lg:h-[150px] lg:py-1.5 2xl:ml-5 2xl:h-[166px] 2xl:py-2">
              <img
                src="/images/logoanais-320.webp"
                alt=""
                aria-hidden="true"
                width="320"
                height="240"
                loading="lazy"
                decoding="async"
                className={`pointer-events-none absolute bottom-[24px] left-[-20px] z-0 h-[58px] w-auto select-none object-contain grayscale transition-opacity duration-700 lg:bottom-[28px] lg:left-[-22px] lg:h-[64px] 2xl:bottom-[34px] 2xl:left-[-25px] 2xl:h-[72px] ${darkMode ? 'opacity-[0.12] invert' : 'opacity-[0.15] mix-blend-multiply'}`}
              />
              <span className="relative z-[1] w-full">
                <span className={`block w-full truncate text-left font-sans text-[11px] font-semibold uppercase leading-none tracking-[0.16em] lg:text-[12px] 2xl:text-[13px] ${darkMode ? 'text-white/90' : 'text-[#24201c]'}`}>
                  {cat.label}
                </span>
                <span className="mt-3 flex w-full items-center gap-2" aria-hidden="true">
                  <span className={`h-px flex-1 bg-gradient-to-r ${darkMode ? 'from-white/30 via-white/12 to-transparent' : 'from-[#9A654B]/38 via-[#d8c8ba] to-transparent'}`} />
                  <span className={`h-1 w-1 rounded-full ${darkMode ? 'bg-white/45' : 'bg-[#c6a27e]'}`} />
                </span>
                <span className={`relative top-[-4px] mt-3 block max-w-[150px] font-sans text-[10.5px] font-normal leading-[1.45] tracking-normal lg:max-w-[158px] lg:text-[11px] 2xl:max-w-[178px] 2xl:text-[11.5px] ${darkMode ? 'text-white/58' : 'text-[#6b6259]'}`}>
                  {descriptions[cat.id]}
                </span>
              </span>
            </div>
            <span className={`category-cta-neon category-cta-neon--corner group/cta bottom-[5px] right-[5px] z-[2] inline-flex w-[118px] items-center justify-between gap-1.5 rounded-full border py-1 pl-4 pr-1 transition-[border-color,box-shadow,background-color] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] lg:bottom-[6px] lg:right-[6px] lg:w-[124px] 2xl:w-[132px] ${darkMode ? 'category-cta-neon--dark text-white' : 'text-[#181716]'}`}>
              <span className="relative z-[1] font-sans text-[11px] leading-none tracking-normal lg:text-[11.5px]">Decouvrir</span>
              <span className={`relative z-[1] flex h-[26px] w-[26px] flex-none rotate-0 transform-gpu items-center justify-center rounded-full transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:rotate-45 lg:h-[27px] lg:w-[27px] 2xl:h-[28px] 2xl:w-[28px] ${darkMode ? 'bg-white text-[#181716]' : 'bg-[#181716] text-white'}`}>
                <ArrowUpRight size={13} strokeWidth={1.75} />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
