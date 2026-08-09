import { Quote } from 'lucide-react';
import KIT_CONFIG, { CATEGORY_RAIL_IMAGE_SOURCES, GALLERY_HERO_PRESETS } from '../config/constants';
import { GALLERY_SEO_COPY } from './seoCopy';
import ArchitecturalHeaderServer from './ArchitecturalHeaderServer';
import MarketplaceHeroServer from './MarketplaceHeroServer';
import CategoryRailServer from './CategoryRailServer';
import FooterServer from './FooterServer';
import GalleryGridActionsIsland from './GalleryGridActionsIsland';
import GalleryFixedSectionsInteractions from './GalleryFixedSectionsInteractions';
import CatalogVersionSyncIsland from './CatalogVersionSyncIsland';
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

const categoryDescriptions = {
  buffets: 'Buffets anciens restaures pour salon et salle a manger.',
  armoires: 'Armoires anciennes avec rangement, bois et presence.',
  miroirs: 'Miroirs anciens pour lumiere, patine et profondeur.',
  commodes: 'Commodes restaurees faciles a placer au quotidien.',
};

const getCategoryRailImageSrc = (id) => (
  CATEGORY_RAIL_IMAGE_SOURCES[id] || '/images/categories/fallback.webp'
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
    className={`pointer-events-none absolute -left-[5.7rem] -top-[2.85rem] hidden h-[52px] w-[52px] select-none md:block lg:-left-[7.1rem] lg:-top-[3.15rem] lg:h-[58px] lg:w-[58px] ${
      darkMode ? 'text-[#d8ad73]/45' : 'text-[#b8b1a8]/80 dark:text-[#d8ad73]/45'
    }`}
    aria-hidden="true"
  >
    <Quote className="h-full w-full -scale-x-100" strokeWidth={1.5} />
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

export default function GalleryServerView({
  items = [],
  darkMode = false,
  announcementMessages = [],
  catalogRevision = 0,
  catalogVersion = '',
} = {}) {
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
      data-catalog-revision={catalogRevision}
      data-catalog-version={catalogVersion}
    >
      <ArchitecturalHeaderServer darkMode={darkMode} announcementMessages={announcementMessages} />

      <div className="marketplace-gallery-shell animate-in fade-in duration-500" data-detail-open="false">
        <div
          id="marketplaceGalleryScroll"
          className="marketplace-gallery-scroll"
          data-detail-open="false"
        >
          <GalleryFixedSectionsInteractions />
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
          <ProductArrivalsSectionServer items={items} darkMode={darkMode} catalogVersion={catalogVersion} />
          <BeforeAfterSectionServer darkMode={darkMode} />
          <ProductSmallPricesSectionServer items={items} darkMode={darkMode} catalogVersion={catalogVersion} />
          {KIT_CONFIG.features.instagramCommunity ? (
            <InstagramSectionServer
              darkMode={darkMode}
              instagramUrl={KIT_CONFIG.socialLinks.instagram}
              instagramFollowersK={KIT_CONFIG.socialProof.instagramFollowersK}
            />
          ) : null}
          {KIT_CONFIG.features.testimonials ? <TestimonialsSectionServer darkMode={darkMode} /> : null}
          {KIT_CONFIG.features.newsletter ? <NewsletterSectionServer darkMode={darkMode} /> : null}
          <FooterServer darkMode={darkMode} />
        </div>
      </div>
      <GalleryGridActionsIsland observeVisibleWarmup surface="gallery" />
      <CatalogVersionSyncIsland
        revision={catalogRevision}
        aggregateSha256={catalogVersion}
        routeKind="gallery"
      />
    </main>
  );
}
