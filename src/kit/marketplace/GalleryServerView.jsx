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
  <section className={`relative z-10 px-4 pb-7 pt-7 md:px-8 md:pb-8 md:pt-24 lg:px-12 ${darkMode ? 'bg-[#121212]' : 'bg-[#FAFAF9]'}`} aria-labelledby="gallery-seo-title">
    <div className="mx-auto grid max-w-6xl gap-7 md:grid-cols-[1.1fr_0.9fr] md:items-end">
      <div>
        <p className={`mb-3 font-sans text-[10px] font-black uppercase tracking-[0.26em] ${darkMode ? 'text-[#bca78c]' : 'text-[#8a6848]'}`}>
          {GALLERY_SEO_COPY.eyebrow}
        </p>
        <h2 id="gallery-seo-title" className={`font-serif text-[28px] leading-tight tracking-normal md:text-[38px] ${darkMode ? 'text-white' : 'text-[#181716]'}`}>
          {GALLERY_SEO_COPY.title}
        </h2>
        <p className={`mt-4 max-w-3xl text-[14px] leading-[1.8] md:text-[15px] ${darkMode ? 'text-stone-300/82' : 'text-[#62584f]'}`}>
          {GALLERY_SEO_COPY.intro}
        </p>
      </div>
      <ul className={`grid gap-2 border-t pt-4 md:border-l md:border-t-0 md:pl-7 md:pt-0 ${darkMode ? 'border-white/10' : 'border-[#d8c8ba]'}`}>
        {GALLERY_SEO_COPY.highlights.map((highlight) => (
          <li key={highlight} className={`flex items-start gap-3 text-[12px] font-semibold leading-[1.65] ${darkMode ? 'text-stone-300' : 'text-[#4f463e]'}`}>
            <span className={`mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full ${darkMode ? 'bg-[#d4b48c]' : 'bg-[#9A654B]'}`} />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
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
      className={`gallery-theme-surface min-h-screen w-full transition-colors duration-1000 ${darkMode ? 'bg-[#121212] text-[#f5f5f5]' : 'bg-[#FAFAF9] text-stone-900'}`}
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
          <div className="gallery-mobile-depth-field" aria-hidden="true">
            <span className="gallery-mobile-depth-field__dots gallery-mobile-depth-field__dots--left" />
            <span className="gallery-mobile-depth-field__dots gallery-mobile-depth-field__dots--right" />
            <span className="gallery-mobile-depth-field__orb gallery-mobile-depth-field__orb--top" />
            <span className="gallery-mobile-depth-field__orb gallery-mobile-depth-field__orb--bottom" />
            <span className="gallery-mobile-depth-field__rail gallery-mobile-depth-field__rail--left" />
            <span className="gallery-mobile-depth-field__rail gallery-mobile-depth-field__rail--right" />
          </div>

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
