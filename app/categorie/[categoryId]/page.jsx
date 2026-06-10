import { notFound } from 'next/navigation';
import {
  getPublicCatalog,
  getPublicCatalogFallback,
  isSeoIndexableProduct,
} from '../../../src/lib/server/products';
import { publicEnv } from '../../../src/lib/server/env';
import { getServerDarkMode } from '../../../src/lib/server/theme';
import { getCategoryUrl } from '../../../src/utils/slug';
import { getCategorySeoCopy } from '../../../src/kit/marketplace/seoCopy';
import { getProductCardImage } from '../../../src/utils/imageUtils';
import ArchitecturalHeaderServer from '../../../src/kit/marketplace/ArchitecturalHeaderServer';
import CategoryLegacyExperienceIsland from '../../../src/kit/marketplace/CategoryLegacyExperienceIsland';
import FooterServer from '../../../src/kit/marketplace/FooterServer';
import {
  buildCategoryBreadcrumbJsonLd,
  buildCategoryCollectionJsonLd,
  cleanCategoryLabel,
  getCategoryMeta,
  getMatchingCategoryIds,
} from '../../../src/lib/seo/categories';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

const getProductQualityRank = (product) => {
  let rank = 0;
  if (product?.material) rank += 2;
  if (product?.currentPrice || product?.startingPrice || product?.price) rank += 1;
  if (product?.images?.length || product?.imageVariants?.length) rank += 1;
  return rank;
};

const getCategoryRouteData = async (params) => {
  const { categoryId } = await params;
  const decodedCategoryId = decodeURIComponent(categoryId || '');
  const categoryMeta = getCategoryMeta(decodedCategoryId);
  if (!categoryMeta) return null;

  const matchingIds = getMatchingCategoryIds(decodedCategoryId);
  let products = await getPublicCatalog(`categories=${encodeURIComponent(matchingIds.join(','))}&scope=cards&limit=120`);
  if (!products.length) {
    products = await getPublicCatalogFallback({ categoryIds: matchingIds, limitCount: 120 });
  }
  products = products
    .filter(isSeoIndexableProduct)
    .sort((a, b) => getProductQualityRank(b) - getProductQualityRank(a));

  return {
    categoryId: decodedCategoryId,
    categoryLabel: cleanCategoryLabel(categoryMeta.label || decodedCategoryId),
    products,
  };
};

export async function generateMetadata({ params }) {
  const data = await getCategoryRouteData(params);
  if (!data) notFound();

  const copy = getCategorySeoCopy(data.categoryId, data.categoryLabel);
  const title = `${data.categoryLabel} restaurés`;
  const description = copy.intro.replace(/\s+/g, ' ').slice(0, 160);
  const canonical = getCategoryUrl(data.categoryId, publicEnv.siteUrl);
  const firstImage = getProductCardImage(data.products[0]);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      siteName: publicEnv.siteName,
      images: firstImage.src ? [{ url: firstImage.src, width: firstImage.metadata?.width || 768, height: firstImage.metadata?.height || 1024, alt: title }] : [],
    },
    twitter: {
      card: firstImage.src ? 'summary_large_image' : 'summary',
      title,
      description,
      images: firstImage.src ? [firstImage.src] : [],
    },
  };
}

export default async function CategoryRoutePage({ params }) {
  const data = await getCategoryRouteData(params);
  if (!data) notFound();
  const darkMode = await getServerDarkMode();

  const { categoryId, categoryLabel, products } = data;
  const copy = getCategorySeoCopy(categoryId, categoryLabel);
  const itemListJsonLd = buildCategoryCollectionJsonLd({
    categoryId,
    categoryLabel,
    products,
    description: copy.intro,
    siteUrl: publicEnv.siteUrl,
  });
  const breadcrumbJsonLd = buildCategoryBreadcrumbJsonLd({
    categoryId,
    categoryLabel,
    siteUrl: publicEnv.siteUrl,
  });

  return (
    <>
      <main className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A] text-stone-200' : 'bg-[#FAFAF9] text-stone-950'}`} data-ssr-category>
        <ArchitecturalHeaderServer darkMode={darkMode} />
        <CategoryLegacyExperienceIsland
          categoryId={categoryId}
          categoryLabel={categoryLabel}
          products={products}
          copy={copy}
          darkMode={darkMode}
        />
        <FooterServer darkMode={darkMode} />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
    </>
  );
}
