import { cache } from 'react';
import { notFound } from 'next/navigation';
import {
  getPublicCatalogResult,
} from '../../../src/lib/server/products';
import { publicEnv } from '../../../src/lib/server/env';
import { getCategoryUrl } from '../../../src/utils/slug';
import { getCategorySeoCopy } from '../../../src/kit/marketplace/seoCopy';
import { getProductCardImage } from '../../../src/utils/imageUtils';
import ArchitecturalHeaderServer from '../../../src/kit/marketplace/ArchitecturalHeaderServer';
import CategoryServerView from '../../../src/kit/marketplace/CategoryServerView';
import FooterServer from '../../../src/kit/marketplace/FooterServer';
import ProductReturnRestoreIsland from '../../../src/kit/marketplace/ProductReturnRestoreIsland';
import {
  buildCategoryBreadcrumbJsonLd,
  buildCategoryCollectionJsonLd,
  categoryEntries,
  cleanCategoryLabel,
  getCategoryMeta,
  getCategorySeoTitle,
  getMatchingCategoryIds,
  isSeoIndexableCategory,
} from '../../../src/lib/seo/categories';

export const revalidate = 300;
export const dynamicParams = true;

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');
const getProductQualityRank = (product) => {
  let rank = 0;
  if (product?.material) rank += 2;
  if (product?.currentPrice || product?.startingPrice || product?.price) rank += 1;
  if (product?.images?.length || product?.imageVariants?.length) rank += 1;
  return rank;
};

const getCategoryRouteData = cache(async (categoryId) => {
  const decodedCategoryId = decodeURIComponent(categoryId || '');
  const categoryMeta = getCategoryMeta(decodedCategoryId);
  if (!categoryMeta) return null;

  const matchingIds = getMatchingCategoryIds(decodedCategoryId);
  const catalog = await getPublicCatalogResult(`categories=${encodeURIComponent(matchingIds.join(','))}&scope=cards&limit=120`);
  const products = catalog.products
    .sort((a, b) => getProductQualityRank(b) - getProductQualityRank(a));

  return {
    categoryId: decodedCategoryId,
    categoryLabel: cleanCategoryLabel(categoryMeta.label || decodedCategoryId),
    products,
    snapshot: catalog.snapshot,
  };
});

const getCategoryRouteDataFromParams = async (params) => {
  const { categoryId } = await params;
  return getCategoryRouteData(categoryId);
};

export async function generateStaticParams() {
  return categoryEntries.map((category) => ({
    categoryId: encodeURIComponent(category.id)
  }));
}

export async function generateMetadata({ params }) {
  const data = await getCategoryRouteDataFromParams(params);
  if (!data) notFound();

  const copy = getCategorySeoCopy(data.categoryId, data.categoryLabel);
  const title = getCategorySeoTitle(data.categoryId, data.categoryLabel);
  const description = copy.intro.replace(/\s+/g, ' ').slice(0, 160);
  const canonical = getCategoryUrl(data.categoryId, publicEnv.siteUrl);
  const firstImage = getProductCardImage(data.products[0]);
  const shouldIndex = isSeoIndexableCategory(data.categoryId, data.products);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: shouldIndex ? undefined : { index: false, follow: true },
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
  const data = await getCategoryRouteDataFromParams(params);
  if (!data) notFound();
  const darkMode = false;

  const { categoryId, categoryLabel, products, snapshot } = data;
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
      <main
        className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A] text-stone-200' : 'bg-[#FAFAF9] text-stone-950'}`}
        data-ssr-category
        data-catalog-revision={snapshot.revision}
        data-catalog-version={snapshot.aggregateSha256}
      >
        <ArchitecturalHeaderServer darkMode={darkMode} />
        <CategoryServerView
          categoryId={categoryId}
          categoryLabel={categoryLabel}
          products={products}
          copy={copy}
          darkMode={darkMode}
          catalogRevision={snapshot.revision}
          catalogVersion={snapshot.aggregateSha256}
        />
        <FooterServer darkMode={darkMode} />
      </main>
      <ProductReturnRestoreIsland />
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
