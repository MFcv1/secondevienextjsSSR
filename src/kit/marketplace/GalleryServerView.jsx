import KIT_CONFIG, { GALLERY_HERO_PRESETS } from '../config/constants';
import { GALLERY_SEO_COPY } from './seoCopy';
import ArchitecturalHeaderServer from './ArchitecturalHeaderServer';
import MarketplaceHeroServer from './MarketplaceHeroServer';
import CategoryRailServer from './CategoryRailServer';
import FooterServer from './FooterServer';
import GalleryGridActionsIsland from './GalleryGridActionsIsland';
import {
  BeforeAfterSectionServer,
  InstagramSectionServer,
  NewsletterSectionServer,
  ProductArrivalsSectionServer,
  ProductSmallPricesSectionServer,
  ReassuranceSectionServer,
  TestimonialsSectionServer,
} from './ProductSectionsServer';

const staticCategories = [
  { id: 'buffets', label: 'BUFFETS' },
  { id: 'armoires', label: 'ARMOIRES' },
  { id: 'miroirs', label: 'MIROIRS' },
  { id: 'commodes', label: 'COMMODES' },
];

const categoryImages = {
  buffets: '/images/categories/buffets-config-rail.webp',
  armoires: '/images/categories/armoires-config-rail.webp',
  miroirs: '/images/categories/miroirs-config-rail.webp',
  commodes: '/images/categories/commodes-config-rail.webp',
};

const categoryDescriptions = {
  buffets: 'Buffets anciens restaures pour salon et salle a manger.',
  armoires: 'Armoires anciennes avec rangement, bois et presence.',
  miroirs: 'Miroirs anciens pour lumiere, patine et profondeur.',
  commodes: 'Commodes restaurees faciles a placer au quotidien.',
};

const getCategoryRailImageSrc = (id) => (
  categoryImages[id] || '/images/categories/fallback.webp'
);

const normalizeFrenchCopy = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLocaleLowerCase('fr-FR');

const getGalleryHeroTexts = () => {
  const headerTexts = {
    banner_text: 'Mobilier restaure autour de Marseille',
    hero_title: GALLERY_SEO_COPY.title,
    hero_subtitle: 'Pieces uniques, bois ancien et livraison possible en France',
    hero_btn: 'Voir les pieces',
  };
  const heroTitle = headerTexts.hero_title?.trim() === 'Comment trouver des meubles intemporels ?'
    ? GALLERY_SEO_COPY.title
    : headerTexts.hero_title;
  const heroSubtitleKey = normalizeFrenchCopy(headerTexts.hero_subtitle);
  const heroSubtitle = heroSubtitleKey === 'nos conseils pour transformer votre interieur' || heroSubtitleKey === 'pieces uniques, bois ancien et livraison possible en france'
    ? 'Pieces uniques, bois ancien et livraison possible en France'
    : headerTexts.hero_subtitle;
  const heroButtonKey = normalizeFrenchCopy(headerTexts.hero_btn);
  const heroButtonLabel = heroButtonKey === 'lisez l article' || heroButtonKey === 'voir les pieces'
    ? 'Voir les pieces'
    : headerTexts.hero_btn;
  const heroBannerKey = normalizeFrenchCopy(headerTexts.banner_text);
  const heroBannerText = heroBannerKey === 'mobilier restaure autour de marseille'
    ? 'Mobilier restaure autour de Marseille'
    : headerTexts.banner_text;

  return {
    heroTitle,
    heroSubtitle,
    heroButtonLabel,
    heroBannerText,
  };
};

const GallerySeoQuoteMark = ({ darkMode = false } = {}) => (
  <span
    className={`pointer-events-none absolute -left-[5.6rem] -top-12 hidden h-[64px] w-[78px] -rotate-[7deg] select-none md:block lg:-left-[7.7rem] lg:-top-14 lg:h-[72px] lg:w-[88px] ${
      darkMode
        ? 'text-[#d8ad73]/58'
        : 'text-[#c9b49e]/82 dark:text-[#b99569]/58'
    }`}
    aria-hidden="true"
  >
    <svg viewBox="0 0 86 72" className="h-full w-full overflow-visible" fill="none">
      <defs>
        <linearGradient id="gallery-quote-metal" x1="18" y1="9" x2="62" y2="61" gradientUnits="userSpaceOnUse">
          <stop stopColor={darkMode ? '#FFE5BD' : '#F4E7D5'} />
          <stop offset="0.36" stopColor={darkMode ? '#D8A66B' : '#C99768'} />
          <stop offset="0.74" stopColor={darkMode ? '#8E5432' : '#95613E'} />
          <stop offset="1" stopColor={darkMode ? '#F0C78B' : '#E2BE91'} />
        </linearGradient>
        <linearGradient id="gallery-quote-edge" x1="24" y1="13" x2="58" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF9ED" stopOpacity="0.9" />
          <stop offset="1" stopColor="#9C6844" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="gallery-quote-inset" cx="34%" cy="28%" r="74%">
          <stop stopColor={darkMode ? '#FFE7C3' : '#FFF9EE'} />
          <stop offset="0.34" stopColor={darkMode ? '#D4A16B' : '#D7AA7D'} />
          <stop offset="0.72" stopColor={darkMode ? '#805035' : '#966546'} />
          <stop offset="1" stopColor={darkMode ? '#4D2C1D' : '#70432A'} />
        </radialGradient>
        <filter id="gallery-quote-shadow" x="-25%" y="-25%" width="160%" height="170%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="2.5" dy="4" stdDeviation="2.8" floodColor={darkMode ? '#000000' : '#6F472E'} floodOpacity={darkMode ? '0.35' : '0.18'} />
        </filter>
      </defs>
      <g transform="translate(5 5)" opacity="0.2" fill={darkMode ? '#5B321D' : '#8A5A39'}>
        <path d="M31.8 11.2c-12.2 5.2-18.9 14.1-18.9 25.2 0 8.4 5 14.4 12.7 14.4 6.7 0 11.5-4.6 11.5-10.9 0-5.8-3.8-9.7-9.4-10.3 1.2-4.6 4.6-8.6 10.3-12l-6.2-6.4Z" />
        <path d="M60.4 11.2c-12.2 5.2-18.9 14.1-18.9 25.2 0 8.4 5 14.4 12.7 14.4 6.7 0 11.5-4.6 11.5-10.9 0-5.8-3.8-9.7-9.4-10.3 1.2-4.6 4.6-8.6 10.3-12l-6.2-6.4Z" />
      </g>
      <g filter="url(#gallery-quote-shadow)">
      <path
        d="M31.8 11.2c-12.2 5.2-18.9 14.1-18.9 25.2 0 8.4 5 14.4 12.7 14.4 6.7 0 11.5-4.6 11.5-10.9 0-5.8-3.8-9.7-9.4-10.3 1.2-4.6 4.6-8.6 10.3-12l-6.2-6.4Z"
        fill="url(#gallery-quote-metal)"
        stroke={darkMode ? '#6D3D22' : '#7D4D2D'}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M60.4 11.2c-12.2 5.2-18.9 14.1-18.9 25.2 0 8.4 5 14.4 12.7 14.4 6.7 0 11.5-4.6 11.5-10.9 0-5.8-3.8-9.7-9.4-10.3 1.2-4.6 4.6-8.6 10.3-12l-6.2-6.4Z"
        fill="url(#gallery-quote-metal)"
        stroke={darkMode ? '#6D3D22' : '#7D4D2D'}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path d="M31.8 11.2c-12.2 5.2-18.9 14.1-18.9 25.2 0 8.4 5 14.4 12.7 14.4 6.7 0 11.5-4.6 11.5-10.9 0-5.8-3.8-9.7-9.4-10.3 1.2-4.6 4.6-8.6 10.3-12l-6.2-6.4Z" fill="url(#gallery-quote-edge)" opacity="0.72" />
      <path d="M60.4 11.2c-12.2 5.2-18.9 14.1-18.9 25.2 0 8.4 5 14.4 12.7 14.4 6.7 0 11.5-4.6 11.5-10.9 0-5.8-3.8-9.7-9.4-10.3 1.2-4.6 4.6-8.6 10.3-12l-6.2-6.4Z" fill="url(#gallery-quote-edge)" opacity="0.72" />
      <g fill="none" stroke={darkMode ? '#FFE4BC' : '#FFF8EC'} strokeOpacity="0.72" strokeWidth="0.7" strokeLinejoin="round">
        <path transform="translate(2.25 2.8) scale(0.91)" d="M31.8 11.2c-12.2 5.2-18.9 14.1-18.9 25.2 0 8.4 5 14.4 12.7 14.4 6.7 0 11.5-4.6 11.5-10.9 0-5.8-3.8-9.7-9.4-10.3 1.2-4.6 4.6-8.6 10.3-12l-6.2-6.4Z" />
        <path transform="translate(5.35 2.8) scale(0.91)" d="M60.4 11.2c-12.2 5.2-18.9 14.1-18.9 25.2 0 8.4 5 14.4 12.7 14.4 6.7 0 11.5-4.6 11.5-10.9 0-5.8-3.8-9.7-9.4-10.3 1.2-4.6 4.6-8.6 10.3-12l-6.2-6.4Z" />
      </g>
      <g>
        <circle cx="24.2" cy="39.2" r="4.15" fill="url(#gallery-quote-inset)" stroke={darkMode ? '#59331F' : '#75482D'} strokeWidth="0.9" />
        <circle cx="52.8" cy="39.2" r="4.15" fill="url(#gallery-quote-inset)" stroke={darkMode ? '#59331F' : '#75482D'} strokeWidth="0.9" />
        <circle cx="22.9" cy="37.8" r="0.85" fill="#FFF9ED" fillOpacity="0.7" />
        <circle cx="51.5" cy="37.8" r="0.85" fill="#FFF9ED" fillOpacity="0.7" />
      </g>
      </g>
    </svg>
  </span>
);

const GallerySeoIntro = ({ darkMode = false } = {}) => (
  <section className={`relative z-10 px-4 pb-7 pt-7 md:px-8 md:pb-0 md:pt-[112px] lg:px-12 ${darkMode ? 'bg-[#121212]' : 'bg-[#FAFAF9] dark:bg-[#0c0b0a]'}`} aria-labelledby="gallery-seo-title">
    <div className="mx-auto grid max-w-6xl gap-7 md:grid-cols-[1.1fr_0.9fr] md:items-end">
      <div className="gallery-seo-copy-block relative">
        <GallerySeoQuoteMark darkMode={darkMode} />
        <p className={`relative mb-3 -translate-y-3 font-sans text-[10px] font-black uppercase tracking-[0.26em] md:-translate-y-4 ${darkMode ? 'text-[#bca78c]' : 'text-[#8a6848] dark:text-[#c7a071]'}`}>
          {GALLERY_SEO_COPY.eyebrow}
        </p>
        <h2 id="gallery-seo-title" className={`font-serif text-[28px] leading-tight tracking-normal md:text-[38px] ${darkMode ? 'text-white' : 'text-[#181716] dark:text-[#f5efe6]'}`}>
          {GALLERY_SEO_COPY.title}
        </h2>
        <p className={`mt-4 max-w-3xl text-[14px] leading-[1.8] md:text-[15px] ${darkMode ? 'text-stone-300/82' : 'text-[#62584f] dark:text-[#c8bbaa]/82'}`}>
          {GALLERY_SEO_COPY.intro}
        </p>
      </div>
      <ul className="relative grid self-center pl-4 md:translate-x-20 md:pl-7">
        <span className={`pointer-events-none absolute -left-10 -top-5 hidden h-[calc(100%+2.5rem)] w-[2px] rounded-full bg-gradient-to-b from-transparent to-transparent md:block ${darkMode ? 'via-white/16' : 'via-[#c9b49e] dark:via-[#b99569]/26'}`} aria-hidden="true" />
        {GALLERY_SEO_COPY.highlights.map((highlight, index) => (
          <li key={highlight} className={`grid grid-cols-[30px_1fr] items-baseline gap-1 py-1.5 text-[12px] font-semibold leading-[1.5] md:grid-cols-[40px_1fr] md:py-2 ${darkMode ? 'text-stone-300' : 'text-[#4f463e] dark:text-[#d6cab9]/80'}`}>
            <span className={`font-serif text-[17px] font-normal italic leading-none md:text-[20px] ${darkMode ? 'text-[#d4b48c]' : 'text-[#9A654B] dark:text-[#c7a071]'}`}>
              {String(index + 1).padStart(2, '0')}&nbsp;.
            </span>
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default function GalleryServerView({ items = [], darkMode = false, announcementMessages = [] } = {}) {
  const heroTexts = getGalleryHeroTexts();
  const visibleCategories = staticCategories.filter((category) => (
    [...(KIT_CONFIG.categoryGroups || []), ...(KIT_CONFIG.productCategories || [])]
      .some((config) => config.id === category.id)
  ));

  return (
    <main
      className={`gallery-theme-surface min-h-screen w-full transition-colors duration-1000 ${darkMode ? 'bg-[#121212] text-[#f5f5f5]' : 'bg-[#FAFAF9] text-stone-900 dark:bg-[#080807] dark:text-[#f5efe6]'}`}
      data-ssr-gallery
      data-next-gallery-experience="server"
      data-public-ssr-fallback
    >
      <ArchitecturalHeaderServer darkMode={darkMode} announcementMessages={announcementMessages} />

      <div className="marketplace-gallery-shell animate-in fade-in duration-500" data-detail-open="false">
        <div
          id="marketplaceGalleryScroll"
          className="marketplace-gallery-scroll"
          data-detail-open="false"
        >
          <MarketplaceHeroServer
            darkMode={darkMode}
            heroImages={GALLERY_HERO_PRESETS}
            heroBannerText={heroTexts.heroBannerText}
            heroTitle={heroTexts.heroTitle}
            heroSubtitle={heroTexts.heroSubtitle}
            heroButtonLabel={heroTexts.heroButtonLabel}
          />

          <CategoryRailServer
            categories={visibleCategories}
            descriptions={categoryDescriptions}
            getImageSrc={getCategoryRailImageSrc}
            darkMode={darkMode}
          />

          <GallerySeoIntro darkMode={darkMode} />
          <ReassuranceSectionServer darkMode={darkMode} />
          <ProductArrivalsSectionServer items={items} darkMode={darkMode} />
          <BeforeAfterSectionServer darkMode={darkMode} />
          <ProductSmallPricesSectionServer items={items} darkMode={darkMode} />
          <InstagramSectionServer darkMode={darkMode} />
          <TestimonialsSectionServer darkMode={darkMode} />
          <NewsletterSectionServer darkMode={darkMode} />
          <FooterServer darkMode={darkMode} />
        </div>
      </div>
      <GalleryGridActionsIsland />
    </main>
  );
}
