import { notFound } from 'next/navigation';
import {
  getPublicProduct,
  getPublishedProductStaticParams,
  isSeoIndexableProduct
} from '../../../src/lib/server/products';
import { publicEnv } from '../../../src/lib/server/env';
import { getProductUrl } from '../../../src/utils/slug';
import { getProductImageItems } from '../../../src/utils/imageUtils';
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd
} from '../../../src/lib/seo/productStructuredData';
import ProductDetailRouteExperience from '../../../src/kit/marketplace/ProductDetailRouteExperience';

export const revalidate = 300;
export const dynamicParams = true;

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

const normalizeText = (value, fallback = '') => String(value || fallback).replace(/\s+/g, ' ').trim();

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
  const shouldIndex = isSeoIndexableProduct(product);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: shouldIndex ? undefined : { index: false, follow: true },
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

  const jsonLd = buildProductJsonLd(product, publicEnv.siteUrl);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(product, publicEnv.siteUrl);
  const [primaryProductImage] = getProductImageItems(product);
  const primaryImmediateImage = primaryProductImage?.medium
    || primaryProductImage?.large
    || primaryProductImage?.src
    || primaryProductImage?.card
    || primaryProductImage?.thumb
    || '';
  const productTitle = normalizeText(product.name || product.title, 'Produit Seconde Vie');
  const productDescription = normalizeText(product.description, publicEnv.siteDescription);

  return (
    <>
      {primaryImmediateImage ? (
        <link
          rel="preload"
          as="image"
          href={primaryImmediateImage}
          fetchPriority="high"
        />
      ) : null}
      <article data-ssr-product className="sr-only">
        <h1>{productTitle}</h1>
        <p>{productDescription}</p>
        {primaryImmediateImage ? (
          <img
            src={primaryImmediateImage}
            alt={productTitle}
            width={primaryProductImage?.metadata?.width || 900}
            height={primaryProductImage?.metadata?.height || 1200}
          />
        ) : null}
      </article>
      <ProductDetailRouteExperience product={product} />
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
