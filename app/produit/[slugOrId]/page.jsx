import { notFound } from 'next/navigation';
import {
  getPublicProduct,
  getPublishedProductStaticParams,
  isSeoIndexableProduct
} from '../../../src/lib/server/products';
import { publicEnv } from '../../../src/lib/server/env';
import { getProductUrl } from '../../../src/utils/slug';
import { getProductDisplayImageSrc, getProductImageItems } from '../../../src/utils/imageUtils';
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd
} from '../../../src/lib/seo/productStructuredData';
import ProductDetailServerView from '../../../src/kit/marketplace/ProductDetailServerView';

export const revalidate = 300;
export const dynamicParams = true;

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

const normalizeText = (value, fallback = '') => String(value || fallback).replace(/\s+/g, ' ').trim();

const getInitialDetailImagePreloads = (product) => {
  const seen = new Set();
  const imageItems = getProductImageItems(product);
  const primary = imageItems[0];

  return [
    {
      href: getProductDisplayImageSrc(primary, { viewport: 'desktop' }),
      priority: 'high'
    },
    {
      href: getProductDisplayImageSrc(primary, { viewport: 'mobile' }),
      priority: 'high'
    },
    {
      href: primary?.thumb || '',
      priority: 'low'
    }
  ]
    .filter(({ href }) => {
      if (!href || seen.has(href)) return false;
      seen.add(href);
      return true;
    });
};

const getProductPageData = async (params) => {
  const resolvedParams = await params;
  return getPublicProduct(resolvedParams.slugOrId);
};

export async function generateStaticParams() {
  return getPublishedProductStaticParams(120);
}

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
  const darkMode = false;

  const jsonLd = buildProductJsonLd(product, publicEnv.siteUrl);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(product, publicEnv.siteUrl);
  const [primaryProductImage] = getProductImageItems(product);
  const detailImagePreloads = getInitialDetailImagePreloads(product);
  const primaryImmediateImage = detailImagePreloads[0]?.href || '';
  const productTitle = normalizeText(product.name || product.title, 'Produit Seconde Vie');
  const productDescription = normalizeText(product.description, publicEnv.siteDescription);

  return (
    <>
      {detailImagePreloads.map((image) => (
        <link
          key={image.href}
          rel="preload"
          as="image"
          href={image.href}
          fetchPriority={image.priority}
        />
      ))}
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
      <ProductDetailServerView product={product} darkMode={darkMode} />
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
