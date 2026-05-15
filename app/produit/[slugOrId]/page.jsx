import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ClientApp from '../../ClientApp';
import {
  getPublicProduct,
  getPublishedProductStaticParams
} from '../../../src/lib/server/products';
import { publicEnv } from '../../../src/lib/server/env';
import { getCategoryUrl, getProductUrl } from '../../../src/utils/slug';
import { getProductImageItems, PRODUCT_DETAIL_IMAGE_SIZES } from '../../../src/utils/imageUtils';
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  getProductPrice
} from '../../../src/lib/seo/productStructuredData';

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

  const image = getPrimaryImage(product);
  const price = getProductPrice(product);
  const jsonLd = buildProductJsonLd(product, publicEnv.siteUrl);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(product, publicEnv.siteUrl);
  const categoryHref = product.category ? getCategoryUrl(product.category) : '/';
  const facts = compact([
    { label: 'Matiere', value: product.material },
    { label: 'Style', value: product.style },
    { label: 'Origine', value: product.origin },
    { label: 'Dimensions', value: product.dimensions },
    { label: 'Disponibilite', value: product.sold || product.stock === 0 ? 'Vendu' : 'Disponible' }
  ]);

  return (
    <>
      <article
        className="min-h-screen bg-[#f7f3ee] px-5 py-10 text-stone-950 md:px-10 md:py-14"
        data-public-ssr-fallback
        data-ssr-product
      >
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] md:items-start">
          {image.src ? (
            <div className="overflow-hidden rounded-xl bg-[#ebe1d3]">
              <Image
                src={image.src}
                width={image.width}
                height={image.height}
                alt={image.alt}
                sizes={PRODUCT_DETAIL_IMAGE_SIZES}
                priority
                placeholder={image.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={image.blurDataURL || undefined}
                className="h-auto w-full object-contain"
              />
            </div>
          ) : null}
          <div className="space-y-7">
            <nav className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-stone-500">
              <Link href="/">Galerie</Link>
              {product.category ? (
                <>
                  <span aria-hidden="true">/</span>
                  <Link href={categoryHref}>{product.category}</Link>
                </>
              ) : null}
            </nav>
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-stone-500">Piece restauree</p>
              <h1 className="font-serif text-5xl leading-none md:text-7xl">{product.name || product.title}</h1>
              <p className="text-xl font-semibold">
                {price && !product.priceOnRequest ? formatPrice(price) : 'Prix sur demande'}
              </p>
            </div>
            {product.description ? (
              <p className="max-w-2xl text-base leading-8 text-stone-700">{product.description}</p>
            ) : null}
            {facts.length ? (
              <dl className="grid gap-3 border-y border-stone-300 py-5 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">{fact.label}</dt>
                    <dd className="mt-1 text-sm text-stone-900">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white" href="/">
                Voir la galerie
              </Link>
              {product.category ? (
                <Link className="rounded-full border border-stone-300 px-5 py-3 text-sm font-bold text-stone-800" href={categoryHref}>
                  Voir la categorie
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <ClientApp />
    </>
  );
}
