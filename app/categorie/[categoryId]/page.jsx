import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  getPublicCatalog,
  getPublicCatalogFallback,
  isSeoIndexableProduct
} from '../../../src/lib/server/products';
import { publicEnv } from '../../../src/lib/server/env';
import { getCategoryUrl, getProductUrl } from '../../../src/utils/slug';
import { getCategorySeoCopy } from '../../../src/kit/marketplace/seoCopy';
import { getProductCardImage, PRODUCT_CARD_IMAGE_SIZES } from '../../../src/utils/imageUtils';
import {
  buildCategoryBreadcrumbJsonLd,
  buildCategoryCollectionJsonLd,
  categoryEntries,
  cleanCategoryLabel,
  getCategoryMeta,
  getMatchingCategoryIds
} from '../../../src/lib/seo/categories';

export const revalidate = 300;
export const dynamicParams = false;

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

const getCategoryPageData = async (params) => {
  const { categoryId } = await params;
  const decodedCategoryId = decodeURIComponent(categoryId || '');
  const categoryMeta = getCategoryMeta(decodedCategoryId);
  if (!categoryMeta) return null;

  const matchingIds = getMatchingCategoryIds(decodedCategoryId);
  let products = await getPublicCatalog(`categories=${encodeURIComponent(matchingIds.join(','))}&scope=cards&limit=24`);
  if (!products.length) {
    products = await getPublicCatalogFallback({ categoryIds: matchingIds, limitCount: 24 });
  }
  products = products.filter(isSeoIndexableProduct);

  return {
    categoryId: decodedCategoryId,
    categoryLabel: cleanCategoryLabel(categoryMeta.label || decodedCategoryId),
    products
  };
};

export function generateStaticParams() {
  return categoryEntries.map((category) => ({ categoryId: category.id }));
}

export async function generateMetadata({ params }) {
  const data = await getCategoryPageData(params);
  if (!data) {
    notFound();
  }

  const copy = getCategorySeoCopy(data.categoryId, data.categoryLabel);
  const title = `${data.categoryLabel} restaurés`;
  const description = copy.intro.replace(/\s+/g, ' ').slice(0, 160);
  const canonical = getCategoryUrl(data.categoryId, publicEnv.siteUrl);
  const firstImage = getProductCardImage(data.products[0]);

  return {
    title,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      siteName: publicEnv.siteName,
      images: firstImage.src ? [{ url: firstImage.src, width: firstImage.metadata?.width || 768, height: firstImage.metadata?.height || 1024, alt: title }] : []
    },
    twitter: {
      card: firstImage.src ? 'summary_large_image' : 'summary',
      title,
      description,
      images: firstImage.src ? [firstImage.src] : []
    }
  };
}

export default async function CategoryPage({ params }) {
  const data = await getCategoryPageData(params);
  if (!data) notFound();

  const { categoryId, categoryLabel, products } = data;
  const copy = getCategorySeoCopy(categoryId, categoryLabel);
  const canonical = getCategoryUrl(categoryId, publicEnv.siteUrl);
  const itemListJsonLd = buildCategoryCollectionJsonLd({
    categoryId,
    categoryLabel,
    products,
    description: copy.intro,
    siteUrl: publicEnv.siteUrl
  });
  const breadcrumbJsonLd = buildCategoryBreadcrumbJsonLd({
    categoryId,
    categoryLabel,
    siteUrl: publicEnv.siteUrl
  });

  return (
    <>
      <section
        className="min-h-screen bg-[#f7f3ee] px-5 py-10 text-stone-950 md:px-10 md:py-14"
        data-ssr-category
      >
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="max-w-3xl space-y-5">
            <nav className="flex gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-stone-500">
              <Link href="/">Galerie</Link>
              <span aria-hidden="true">/</span>
              <span>{categoryLabel}</span>
            </nav>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-stone-500">Categorie</p>
            <h1 className="font-serif text-5xl leading-none md:text-7xl">{categoryLabel}</h1>
            <p className="text-base leading-8 text-stone-700">{copy.intro}</p>
            <p className="text-sm leading-7 text-stone-600">{copy.detail}</p>
            <p className="text-sm font-semibold text-stone-800">{products.length} pièces publiées</p>
          </div>

          {products.length ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.slice(0, 24).map((product, index) => {
                const cardImage = getProductCardImage(product);
                return (
                  <li key={product.id}>
                    <Link className="group block space-y-3 text-inherit no-underline" href={getProductUrl(product)} prefetch={false}>
                      {cardImage.src ? (
                        <div className="overflow-hidden rounded-xl bg-[#ebe1d3]">
                          <Image
                            src={cardImage.src}
                            width={cardImage.metadata?.width || 768}
                            height={cardImage.metadata?.height || 1024}
                            alt={product.name || product.title || ''}
                            sizes={PRODUCT_CARD_IMAGE_SIZES}
                            className="aspect-[3/4] h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            priority={index === 0}
                            placeholder={cardImage.metadata?.blurDataUrl ? 'blur' : 'empty'}
                            blurDataURL={cardImage.metadata?.blurDataUrl || undefined}
                          />
                        </div>
                      ) : null}
                      <div className="space-y-1">
                        <h2 className="font-serif text-2xl leading-tight">{product.name || product.title}</h2>
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{product.material || 'Piece restauree'}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-stone-300 p-6 text-stone-700">
              Aucune pièce publiée dans cette catégorie pour le moment.
            </p>
          )}
        </div>
      </section>
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
