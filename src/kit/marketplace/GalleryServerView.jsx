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

const GallerySeoIntro = ({ darkMode = false } = {}) => (
  <section
    className={`relative z-10 px-4 pb-2 pt-5 md:px-8 md:pb-8 md:pt-24 lg:px-12 ${darkMode ? 'bg-[#121212]' : 'bg-[#FAFAF9] dark:bg-[#0c0b0a]'}`}
    aria-labelledby="gallery-seo-title"
    data-gallery-seo-intro
  >
    <div className="gallery-seo-shell mx-auto max-w-6xl">
      <div className="gallery-seo-core relative px-4 pb-2 pt-5 md:px-7 md:py-7">
        <span className={`gallery-seo-glint ${darkMode ? 'bg-[#d4b48c]/24' : 'bg-[#9A654B]/22'}`} aria-hidden="true" />
        <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-end md:gap-7">
          <div className="gallery-seo-reveal" style={{ '--gallery-seo-delay': '40ms' }}>
            <p className={`mb-2 font-sans text-[8.5px] font-black uppercase tracking-[0.22em] md:mb-3 md:text-[10px] md:tracking-[0.26em] ${darkMode ? 'text-[#bca78c]' : 'text-[#8a6848] dark:text-[#c7a071]'}`}>
              {GALLERY_SEO_COPY.eyebrow}
            </p>
            <h2 id="gallery-seo-title" className={`font-serif text-[21px] leading-[1.15] tracking-normal md:text-[38px] md:leading-tight ${darkMode ? 'text-white' : 'text-[#181716] dark:text-[#f5efe6]'}`}>
              {GALLERY_SEO_COPY.title}
            </h2>
            <p className={`mt-3 max-w-3xl text-[11.5px] leading-[1.56] md:mt-4 md:text-[15px] md:leading-[1.8] ${darkMode ? 'text-stone-300/82' : 'text-[#62584f] dark:text-[#c8bbaa]/82'}`}>
              {GALLERY_SEO_COPY.intro}
            </p>
          </div>
          <ul className="gallery-seo-proofs gallery-seo-reveal grid" style={{ '--gallery-seo-delay': '140ms' }}>
            {GALLERY_SEO_COPY.highlights.map((highlight, index) => (
              <li key={highlight} className={`gallery-seo-proof-item grid grid-cols-[24px_1fr] items-baseline gap-3 py-2.5 text-[11px] font-semibold leading-[1.48] md:grid-cols-[30px_1fr] md:text-[12px] md:leading-[1.58] ${darkMode ? 'text-stone-300' : 'text-[#4f463e] dark:text-[#d6cab9]/80'}`} style={{ '--gallery-seo-delay': `${180 + index * 70}ms` }}>
                <span className={`font-serif text-[13px] font-normal italic leading-none md:text-[15px] ${darkMode ? 'text-[#d4b48c]' : 'text-[#9A654B] dark:text-[#c7a071]'}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

export default function GalleryServerView({ items = [], darkMode = false } = {}) {
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
      <ArchitecturalHeaderServer darkMode={darkMode} />

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
      <GalleryGridActionsIsland observeSeoIntro />
    </main>
  );
}
