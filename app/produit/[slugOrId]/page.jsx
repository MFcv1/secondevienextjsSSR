import { notFound } from 'next/navigation';
import {
  getPublicProduct,
  getPublishedProductStaticParams
} from '../../../src/lib/server/products';
import { publicEnv } from '../../../src/lib/server/env';
import { getCategoryUrl, getProductUrl } from '../../../src/utils/slug';
import { getProductDisplayImageSrc, getProductImageItems } from '../../../src/utils/imageUtils';
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  getProductPrice
} from '../../../src/lib/seo/productStructuredData';
import ProductPageExperience from '../../../src/kit/marketplace/ProductPageExperience';

export const revalidate = 300;
export const dynamicParams = true;

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

const formatPrice = (price) => {
  const value = Number(price);
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
};

const compact = (items) => items.filter((item) => item?.value);

export async function generateStaticParams() {
  try {
    return await getPublishedProductStaticParams(160);
  } catch (error) {
    console.warn('[SSR] Product static params unavailable:', error?.message || error);
    return [];
  }
}

const getProductPageData = async (params) => {
  const resolvedParams = await params;
  return getPublicProduct(resolvedParams.slugOrId);
};

const getPrimaryImage = (product) => {
  const [primary] = getProductImageItems(product);
  return {
    src: primary?.large || primary?.medium || primary?.src || product?.imageUrl || product?.thumbnailUrl || '',
    width: primary?.metadata?.width || 1200,
    height: primary?.metadata?.height || 1600,
    blurDataURL: primary?.metadata?.blurDataUrl || '',
    alt: product?.name || product?.title || 'Produit'
  };
};

const getClientImages = (product) => getProductImageItems(product).map((image) => ({
  src: image.src || '',
  thumb: image.thumb || '',
  card: image.card || '',
  medium: image.medium || '',
  large: image.large || '',
  full: image.full || '',
  ratio: image.ratio || null,
  metadata: image.metadata ? {
    width: image.metadata.width || 0,
    height: image.metadata.height || 0,
    ratio: image.metadata.ratio || null,
    dominantColor: image.metadata.dominantColor || '',
    blurDataUrl: image.metadata.blurDataUrl || '',
  } : null,
}));

const getClientProduct = (product) => ({
  id: product.id || '',
  collectionName: product.collectionName || 'furniture',
  name: product.name || product.title || 'Produit',
  title: product.title || product.name || 'Produit',
  category: product.category || '',
  description: product.description || '',
  material: product.material || '',
  style: product.style || '',
  origin: product.origin || '',
  dimensions: product.dimensions || '',
  currentPrice: product.currentPrice ?? null,
  startingPrice: product.startingPrice ?? null,
  price: product.price ?? null,
  priceOnRequest: Boolean(product.priceOnRequest),
  sold: Boolean(product.sold),
  stock: product.stock ?? null,
});

export async function generateMetadata({ params }) {
  const product = await getProductPageData(params);
  if (!product) {
    notFound();
  }

  const title = product.name || product.title || 'Produit';
  const description = product.description
    ? String(product.description).replace(/\s+/g, ' ').slice(0, 160)
    : publicEnv.siteDescription;
  const image = getPrimaryImage(product);
  const url = getProductUrl(product, publicEnv.siteUrl);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: publicEnv.siteName,
      images: image.src ? [{ url: image.src, width: image.width, height: image.height, alt: image.alt }] : []
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image.src ? [image.src] : []
    }
  };
}

export default async function ProductPage({ params }) {
  const product = await getProductPageData(params);
  if (!product) notFound();

  const price = getProductPrice(product);
  const jsonLd = buildProductJsonLd(product, publicEnv.siteUrl);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(product, publicEnv.siteUrl);
  const categoryHref = product.category ? getCategoryUrl(product.category) : '/';
  const images = getClientImages(product);
  const primaryPreloadMobile = getProductDisplayImageSrc(images[0], { viewport: 'mobile' });
  const primaryPreloadDesktop = getProductDisplayImageSrc(images[0], { viewport: 'desktop' });
  const productPayload = getClientProduct(product);
  const priceLabel = price && !product.priceOnRequest ? formatPrice(price) : 'Prix sur demande';
  const facts = compact([
    { label: 'Matiere', value: product.material },
    { label: 'Style', value: product.style },
    { label: 'Origine', value: product.origin },
    { label: 'Dimensions', value: product.dimensions },
    { label: 'Disponibilite', value: product.sold || product.stock === 0 ? 'Vendu' : 'Disponible' }
  ]);

  return (
    <>
      {primaryPreloadMobile ? (
        <link rel="preload" as="image" href={primaryPreloadMobile} media="(max-width: 1023px)" fetchPriority="high" />
      ) : null}
      {primaryPreloadDesktop && primaryPreloadDesktop !== primaryPreloadMobile ? (
        <link rel="preload" as="image" href={primaryPreloadDesktop} media="(min-width: 1024px)" fetchPriority="high" />
      ) : null}
      <ProductPageExperience
        product={productPayload}
        images={images}
        facts={facts}
        categoryHref={categoryHref}
        priceLabel={priceLabel}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
    </>
  );
}
