import GalleryMobileShellIsland from '../GalleryMobileShellIsland';
import { getPublicCatalog, getPublicCatalogFallback } from '../../src/lib/server/products';
import { publicEnv } from '../../src/lib/server/env';
import { getServerDarkMode } from '../../src/lib/server/theme';
import GalleryServerView from '../../src/kit/marketplace/GalleryServerView';
import { GALLERY_SEO_COPY } from '../../src/kit/marketplace/seoCopy';
import { getProductUrl } from '../../src/utils/slug';

export const revalidate = 300;

const galleryDescription = GALLERY_SEO_COPY.intro;
const galleryUrl = '/galerie';

export const metadata = {
  title: 'Galerie de mobilier ancien restauré',
  description: galleryDescription,
  alternates: { canonical: galleryUrl },
  openGraph: {
    type: 'website',
    title: 'Galerie de mobilier ancien restauré',
    description: galleryDescription,
    url: galleryUrl,
    siteName: publicEnv.siteName,
    images: ['/images/imagehero/1.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galerie de mobilier ancien restauré',
    description: galleryDescription,
    images: ['/images/imagehero/1.webp'],
  },
};

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

const getGalleryProducts = async () => {
  let products = await getPublicCatalog('scope=cards&limit=48');
  if (!products.length) products = await getPublicCatalogFallback({ limitCount: 48 });
  return products.slice(0, 48);
};

const getProductTitle = (product, index) => {
  const rawTitle = (product?.name || product?.title || '').trim().replace(/\s+/g, ' ');
  if (rawTitle.length >= 3) return rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  return `Pièce restaurée ${String(index + 1).padStart(2, '0')}`;
};

const buildGalleryJsonLd = (products) => {
  const siteUrl = publicEnv.siteUrl.replace(/\/$/, '');
  const absoluteGalleryUrl = `${siteUrl}${galleryUrl}`;
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
        name: 'Galerie de mobilier ancien restauré',
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
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Galerie',
            item: absoluteGalleryUrl,
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

export default async function GaleriePage() {
  const products = await getGalleryProducts();
  const darkMode = await getServerDarkMode();

  return (
    <>
      <GalleryServerView items={products} darkMode={darkMode} />
      <GalleryMobileShellIsland />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(buildGalleryJsonLd(products)) }}
      />
    </>
  );
}
