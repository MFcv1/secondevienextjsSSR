import GalleryMobileShellIsland from '../../../app/GalleryMobileShellIsland';
import { getPublicCatalog, getPublicCatalogFallback } from '../../lib/server/products';
import { publicEnv } from '../../lib/server/env';
import { getProductUrl } from '../../utils/slug';
import GalleryServerView from './GalleryServerView';
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

const galleryReturnRestoreScript = `(() => {
  const RETURN_KEY = 'secondevie:product-return:v1';
  const ARRIVAL_KEY = 'secondevie:open-gallery-on-arrival';
  const MAX_AGE_MS = 30 * 60 * 1000;

  const rememberProductReturnTarget = (event) => {
    const link = event.target?.closest?.('a[href^="/produit/"]');
    if (!link) return;

    try {
      const scroller = document.getElementById('marketplaceGalleryScroll');
      window.sessionStorage.removeItem(ARRIVAL_KEY);
      window.sessionStorage.setItem(RETURN_KEY, JSON.stringify({
        href: window.location.pathname + (window.location.search || '') + (window.location.hash || ''),
        scrollY: window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0,
        galleryScrollTop: scroller?.scrollTop || 0,
        savedAt: Date.now(),
      }));
    } catch {
      // Links must remain normal navigation even if storage is unavailable.
    }
  };

  document.addEventListener('pointerdown', rememberProductReturnTarget, { capture: true, passive: true });
  document.addEventListener('touchstart', rememberProductReturnTarget, { capture: true, passive: true });
  document.addEventListener('click', rememberProductReturnTarget, { capture: true, passive: true });

  try {
    if (window.sessionStorage.getItem(ARRIVAL_KEY) !== 'true') return;
    window.sessionStorage.removeItem(ARRIVAL_KEY);

    const raw = window.sessionStorage.getItem(RETURN_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    if (!saved || Date.now() - Number(saved.savedAt || 0) > MAX_AGE_MS) return;

    const target = new URL(saved.href || '/', window.location.origin);
    if (target.pathname !== window.location.pathname || target.search !== window.location.search) return;

    const galleryTop = Math.max(0, Number(saved.galleryScrollTop || 0));
    const windowTop = Math.max(0, Number(saved.scrollY || 0));
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    const previousScrollRestoration = 'scrollRestoration' in window.history
      ? window.history.scrollRestoration
      : null;
    let cancelledByUser = false;

    root.style.scrollBehavior = 'auto';
    if (previousScrollRestoration !== null) {
      window.history.scrollRestoration = 'manual';
    }

    const cancelRestore = () => {
      cancelledByUser = true;
    };

    window.addEventListener('wheel', cancelRestore, { passive: true, once: true });
    window.addEventListener('touchstart', cancelRestore, { passive: true, once: true });
    window.addEventListener('keydown', cancelRestore, { passive: true, once: true });

    const apply = () => {
      if (cancelledByUser) return;
      const scroller = document.getElementById('marketplaceGalleryScroll');
      if (scroller && galleryTop > 0) {
        const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        scroller.scrollTop = maxTop > 0 ? Math.min(galleryTop, maxTop) : galleryTop;
      }
      if (windowTop > 0) {
        window.scrollTo(0, windowTop);
      }
    };

    apply();

    let frame = 0;
    const settle = () => {
      apply();
      frame += 1;
      if (!cancelledByUser && frame < 8) {
        window.requestAnimationFrame(settle);
        return;
      }
      window.setTimeout(() => {
        window.removeEventListener('wheel', cancelRestore);
        window.removeEventListener('touchstart', cancelRestore);
        window.removeEventListener('keydown', cancelRestore);
        window.sessionStorage.removeItem(RETURN_KEY);
        root.style.scrollBehavior = previousScrollBehavior;
        if (previousScrollRestoration !== null) {
          window.history.scrollRestoration = previousScrollRestoration;
        }
      }, 40);
    };

    window.requestAnimationFrame(settle);
  } catch {
    // Best effort scroll restoration only.
  }
})();`;

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
  const products = await getGalleryProducts();

  return (
    <>
      <GalleryServerView items={products} darkMode={false} />
      <GalleryMobileShellIsland />
      <script dangerouslySetInnerHTML={{ __html: galleryReturnRestoreScript }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(buildGalleryJsonLd(products, canonicalPath)) }}
      />
    </>
  );
}
