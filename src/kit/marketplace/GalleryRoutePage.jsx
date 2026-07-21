import GalleryMobileShellIsland from '../../../app/GalleryMobileShellIsland';
import { getGalleryPersonalization } from '../../lib/server/galleryPersonalization';
import { getPublicCatalogResult } from '../../lib/server/products';
import { publicEnv } from '../../lib/server/env';
import { getProductUrl } from '../../utils/slug';
import GalleryServerView from './GalleryServerView';
import ProductReturnRestoreIsland from './ProductReturnRestoreIsland';
import { GALLERY_SEO_COPY } from './seoCopy';

export const galleryDescription = GALLERY_SEO_COPY.intro;
export const galleryCanonicalPath = '/';
export const galleryAliasPath = '/galerie';
export const galleryTitle = 'Galerie de mobilier ancien restauré';

export const buildGalleryMetadata = (canonicalPath = galleryCanonicalPath) => ({
  title: galleryTitle,
  description: galleryDescription,
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: 'website',
    title: galleryTitle,
    description: galleryDescription,
    url: canonicalPath,
    siteName: publicEnv.siteName,
    images: ['/images/imagehero/1.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: galleryTitle,
    description: galleryDescription,
    images: ['/images/imagehero/1.webp'],
  },
});

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

const getGalleryProducts = async () => {
  const result = await getPublicCatalogResult('scope=cards&limit=48');
  return { ...result, products: result.products.slice(0, 48) };
};

const getProductTitle = (product, index) => {
  const rawTitle = (product?.name || product?.title || '').trim().replace(/\s+/g, ' ');
  if (rawTitle.length >= 3) return rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  return `Pièce restaurée ${String(index + 1).padStart(2, '0')}`;
};

const buildGalleryJsonLd = (products, canonicalPath = galleryCanonicalPath) => {
  const siteUrl = publicEnv.siteUrl.replace(/\/$/, '');
  const absoluteGalleryUrl = `${siteUrl}${canonicalPath}`;
  const organizationId = `${siteUrl}/#localbusiness`;
  const websiteId = `${siteUrl}/#website`;
  const webpageId = `${absoluteGalleryUrl}#webpage`;
  const itemListId = `${absoluteGalleryUrl}#catalogue`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': webpageId,
        name: galleryTitle,
        description: galleryDescription,
        url: absoluteGalleryUrl,
        isPartOf: { '@id': websiteId },
        about: { '@id': organizationId },
        mainEntity: { '@id': itemListId },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${absoluteGalleryUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: `${siteUrl}/`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': itemListId,
        name: 'Pièces disponibles dans la galerie Seconde Vie',
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: getProductTitle(product, index),
          url: getProductUrl(product, siteUrl),
        })),
      },
    ],
  };
};

export default async function GalleryRoutePage({ canonicalPath = galleryCanonicalPath } = {}) {
  const [catalog, personalization] = await Promise.all([
    getGalleryProducts(),
    getGalleryPersonalization(),
  ]);

  return (
    <>
      <GalleryServerView
        items={catalog.products}
        darkMode={false}
        announcementMessages={personalization.announcementMessages}
        catalogRevision={catalog.snapshot.revision}
        catalogVersion={catalog.snapshot.aggregateSha256}
      />
      <GalleryMobileShellIsland />
      <ProductReturnRestoreIsland scrollContainerId="marketplaceGalleryScroll" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(buildGalleryJsonLd(catalog.products, canonicalPath)) }}
      />
    </>
  );
}
