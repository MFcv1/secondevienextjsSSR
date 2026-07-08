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
    className={`pointer-events-none absolute -left-16 -top-8 hidden h-[74px] w-[74px] -rotate-[6deg] select-none items-center justify-center rounded-[22px] p-[7px] ring-1 shadow-[0_22px_42px_-34px_rgba(65,45,28,0.72)] md:flex lg:-left-24 lg:-top-10 lg:h-[86px] lg:w-[86px] lg:rounded-[26px] ${
      darkMode
        ? 'bg-[#1a1510]/88 ring-[#d8ad73]/18'
        : 'bg-[#efe7dc]/84 ring-[#bfa286]/34 dark:bg-[#1a1510]/88 dark:ring-[#d8ad73]/18'
    }`}
    aria-hidden="true"
  >
    <span className="absolute inset-[5px] rounded-[18px] border border-white/72 dark:border-[#f0d2a5]/12 lg:rounded-[22px]" />
    <span
      className={`relative flex h-full w-full rotate-[6deg] items-center justify-center rounded-[17px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.52)] lg:rounded-[21px] ${
        darkMode
          ? 'border-[#d8ad73]/18 bg-[#100d0a]/72 text-[#d8ad73]'
          : 'border-[#b99272]/26 bg-[#fbfaf7]/80 text-[#9a654b] dark:border-[#d8ad73]/18 dark:bg-[#100d0a]/72 dark:text-[#d8ad73]'
      }`}
    >
      <svg viewBox="0 0 64 64" className="h-[58px] w-[58px] overflow-visible lg:h-[66px] lg:w-[66px]" fill="none">
        <path
          d="M15 15.5h34"
          stroke="currentColor"
          strokeOpacity="0.36"
          strokeWidth="1.4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M15 48.5h34"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="1.4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M25.8 24.2c-4.8 2.9-7.2 6.6-7.2 11.2 0 4.1 2.5 7.2 6.3 7.2 3.1 0 5.4-2.2 5.4-5.2 0-2.8-1.9-4.8-4.7-5.1.6-2.1 2.4-4.1 5.1-5.9l-4.9-2.2Z"
          fill="currentColor"
          fillOpacity="0.72"
        />
        <path
          d="M42.4 24.2c-4.8 2.9-7.2 6.6-7.2 11.2 0 4.1 2.5 7.2 6.3 7.2 3.1 0 5.4-2.2 5.4-5.2 0-2.8-1.9-4.8-4.7-5.1.6-2.1 2.4-4.1 5.1-5.9l-4.9-2.2Z"
          fill="currentColor"
          fillOpacity="0.92"
        />
        <circle cx="16" cy="16" r="2" fill="currentColor" fillOpacity="0.18" />
        <circle cx="48" cy="48" r="2" fill="currentColor" fillOpacity="0.18" />
      </svg>
    </span>
  </span>
);

const GallerySeoIntro = ({ darkMode = false } = {}) => (
  <section className={`relative z-10 px-4 pb-7 pt-7 md:px-8 md:pb-8 md:pt-24 lg:px-12 ${darkMode ? 'bg-[#121212]' : 'bg-[#FAFAF9] dark:bg-[#0c0b0a]'}`} aria-labelledby="gallery-seo-title">
    <div className="mx-auto grid max-w-6xl gap-7 md:grid-cols-[1.1fr_0.9fr] md:items-end">
      <div className="gallery-seo-copy-block relative">
        <GallerySeoQuoteMark darkMode={darkMode} />
        <p className={`mb-3 font-sans text-[10px] font-black uppercase tracking-[0.26em] ${darkMode ? 'text-[#bca78c]' : 'text-[#8a6848] dark:text-[#c7a071]'}`}>
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
