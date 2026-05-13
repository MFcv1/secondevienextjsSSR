import { notFound } from 'next/navigation';
import Image from 'next/image';
import ClientApp from '../../ClientApp';
import {
  getPublicProduct,
  getPublishedProductStaticParams
} from '../../../src/lib/server/products';
import { publicEnv } from '../../../src/lib/server/env';
import { getProductUrl } from '../../../src/utils/slug';
import { getProductImageItems, PRODUCT_DETAIL_IMAGE_SIZES } from '../../../src/utils/imageUtils';
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  getProductPrice
} from '../../../src/lib/seo/productStructuredData';

export const revalidate = 300;
export const dynamicParams = true;

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
    return {
      title: 'Produit introuvable',
      robots: { index: false, follow: false }
    };
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

  const image = getPrimaryImage(product);
  const price = getProductPrice(product);
  const jsonLd = buildProductJsonLd(product, publicEnv.siteUrl);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(product, publicEnv.siteUrl);

  return (
    <>
      <article className="sr-only" data-ssr-product>
        <h1>{product.name || product.title}</h1>
        {price && !product.priceOnRequest ? <p>{price} EUR</p> : <p>Prix sur demande</p>}
        {product.description ? <p>{product.description}</p> : null}
        {image.src ? (
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt={image.alt}
            sizes={PRODUCT_DETAIL_IMAGE_SIZES}
            priority
            placeholder={image.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={image.blurDataURL || undefined}
          />
        ) : null}
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ClientApp />
    </>
  );
}
