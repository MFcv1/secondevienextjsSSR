import { notFound } from 'next/navigation';
import {
  getPublicProduct,
  getPublishedProductStaticParams
} from '../../../src/lib/server/products';
import { publicEnv } from '../../../src/lib/server/env';
import { getCategoryUrl, getProductUrl } from '../../../src/utils/slug';
import {
  getProductDisplayImageSrc,
  getProductImageItems
} from '../../../src/utils/imageUtils';
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  getProductPrice
} from '../../../src/lib/seo/productStructuredData';
import ClientApp from '../../ClientApp';

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
  srcSet: image.srcSet || '',
  ratio: image.ratio || null,
  metadata: image.metadata ? {
    width: image.metadata.width || 0,
    height: image.metadata.height || 0,
    ratio: image.metadata.ratio || null,
    dominantColor: image.metadata.dominantColor || '',
    blurDataUrl: image.metadata.blurDataUrl || '',
  } : null,
}));

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
  const primaryImmediateImage = images[0]?.thumb
    || images[0]?.card
    || getProductDisplayImageSrc(images[0], { variant: 'card' })
    || images[0]?.medium
    || images[0]?.large
    || images[0]?.src
    || '';
  const primaryPreviewColor = images[0]?.metadata?.dominantColor || '#8c7b64';
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
      {primaryImmediateImage ? (
        <link
          rel="preload"
          as="image"
          href={primaryImmediateImage}
          fetchPriority="high"
        />
      ) : null}
      <article data-ssr-product className="sr-only">
        <nav aria-label="Fil d'Ariane">
          <a href="/">Galerie</a>
          {product.category ? (
            <>
              <span> / </span>
              <a href={categoryHref}>{product.category}</a>
            </>
          ) : null}
        </nav>
        <h1>{product.name || product.title || 'Produit'}</h1>
        <p>{priceLabel}</p>
        {product.description ? <p>{product.description}</p> : null}
        {facts.length ? (
          <dl>
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {primaryImmediateImage ? (
          <img
            src={primaryImmediateImage}
            alt={product.name || product.title || 'Produit'}
            width={images[0].metadata?.width || 768}
            height={images[0].metadata?.height || 1024}
          />
        ) : null}
      </article>
      {primaryImmediateImage ? (
        <div
          data-product-ssr-preview
          className="product-ssr-visual-preview"
          aria-hidden="true"
          style={{ backgroundColor: primaryPreviewColor }}
        >
          <img
            className="product-ssr-visual-preview__backdrop"
            src={images[0]?.thumb || primaryImmediateImage}
            alt=""
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <img
            className="product-ssr-visual-preview__image"
            src={primaryImmediateImage}
            alt=""
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      ) : null}
      <ClientApp />
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
