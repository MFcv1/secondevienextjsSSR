import Link from 'next/link';
import HomeGalleryLauncher from './HomeGalleryLauncher';
import { getPublicCatalog, getPublicCatalogFallback } from '../src/lib/server/products';
import { publicEnv } from '../src/lib/server/env';
import KIT_CONFIG from '../src/kit/config/constants';
import { getCategoryUrl, getProductUrl } from '../src/utils/slug';
import { getProductCardImage, getProductImageItems } from '../src/utils/imageUtils';

export const revalidate = 300;

const heroImages = [
  '/images/imagehero/1.webp',
  '/images/imagehero/2.webp',
  '/images/imagehero/3.webp',
];

const heroImageAlts = [
  'Buffet ancien restauré présenté en intérieur',
  'Meuble ancien restauré avec patine claire',
  'Détail de mobilier vintage sélectionné par Seconde Vie',
];

const categoryCopy = {
  buffets: {
    title: 'Buffets anciens',
    text: 'Volumes de rangement, façades travaillées et présence immédiate pour une entrée, une salle à manger ou un salon.',
    image: '/images/categories/buffets-config-rail.webp',
  },
  armoires: {
    title: 'Armoires restaurées',
    text: 'Pièces hautes et utiles, choisies pour leur ligne, leur capacité et la qualité de leur matière.',
    image: '/images/categories/armoires-config-rail.webp',
  },
  commodes: {
    title: 'Commodes et chevets',
    text: 'Formats plus compacts pour installer une patine, un équilibre et du rangement sans alourdir la pièce.',
    image: '/images/categories/commodes-config-rail.webp',
  },
  miroirs: {
    title: 'Miroirs anciens',
    text: 'Cadres, reflets et détails décoratifs qui agrandissent l’espace sans effacer son caractère.',
    image: '/images/categories/miroirs-config-rail.webp',
  },
  tables: {
    title: 'Tables et plateaux',
    text: 'Surfaces de vie sélectionnées pour leur ligne, leur stabilité et leur capacité à traverser les usages.',
    image: '/images/categories/fallback.webp',
  },
  chaises: {
    title: 'Assises vintage',
    text: 'Chaises, fauteuils et bancs remis en valeur pour compléter une table ou créer un point d’attention.',
    image: '/images/categories/fallback.webp',
  },
};

const categoryEntries = ['buffets', 'armoires', 'commodes', 'miroirs', 'tables', 'chaises']
  .map((id) => {
    const config = [...(KIT_CONFIG.categoryGroups || []), ...(KIT_CONFIG.productCategories || [])]
      .find((category) => category.id === id);
    return config ? { ...config, ...categoryCopy[id] } : null;
  })
  .filter(Boolean);

const homeSelectionCategoryOrder = ['buffets', 'armoires', 'commodes', 'miroirs'];
const homeFeaturedProductIds = [
  'mBZuoKIzWW8EycXDwtdT',
  '30zeGFFcGWnBkK44YHZj',
  '9yl4isQ7IjfnApVGQC5C',
  '0KXe2kmuAn0tJzwqZxOI',
];
const homeExcludedProductIds = new Set([
  'RwaaP9TGIw1871LIr7ns',
  '3uidDZpwH2ydH8v9jiw3',
  'VdMQLvZvXJL7mKVxCBvb',
  'bU407t3vFKcMq2UJ1wQL',
]);

const routeSteps = [
  ['01', 'Mesurer', 'Largeur, hauteur, profondeur et contraintes du meuble sont vérifiées avant de promettre un départ.'],
  ['02', 'Protéger', 'Angles, portes, miroirs, plateaux et patines sont préparés selon la fragilité de chaque pièce.'],
  ['03', 'Installer', 'Retrait atelier, Marseille proche ou transport dédié: la solution reste ajustée au meuble.'],
];

const faqItems = [
  {
    question: 'La livraison est-elle possible hors Marseille ?',
    answer: 'Oui, chaque demande est étudiée selon le volume du meuble, sa fragilité et la distance. Le retrait local reste possible quand il est plus adapté.',
  },
  {
    question: 'Les meubles sont-ils tous restaurés ?',
    answer: 'La sélection privilégie des pièces anciennes nettoyées, réparées ou remises en valeur. Les interventions sont adaptées à chaque meuble pour préserver sa matière.',
  },
  {
    question: 'Comment réserver une pièce de la galerie ?',
    answer: 'Chaque fiche produit permet de consulter les détails, les photos et les informations utiles. Les pièces étant uniques, une demande rapide permet de sécuriser la disponibilité.',
  },
  {
    question: 'Peut-on demander une restauration sur mesure ?',
    answer: 'Oui, la page devis permet de présenter un meuble, des photos et le type d’intervention souhaité afin d’obtenir une première estimation.',
  },
];

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');
const homeDescription = publicEnv.siteDescription || 'Meubles anciens restaurés, buffets, armoires, commodes et miroirs sélectionnés par Seconde Vie autour de Marseille.';
const galleryEntryBootstrapScript = `
(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    var shouldOpenGallery = params.get('page') === 'gallery'
      || window.location.hash === '#gallery'
      || window.sessionStorage.getItem('secondevie:open-gallery-on-arrival') === 'true';
    if (shouldOpenGallery) {
      document.documentElement.setAttribute('data-sv-force-gallery-entry', 'true');
    }
  } catch (error) {}
})();
`;

export const metadata = {
  title: 'Mobilier ancien restauré à Marseille',
  description: homeDescription,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: 'Mobilier ancien restauré à Marseille',
    description: homeDescription,
    url: publicEnv.siteUrl,
    siteName: publicEnv.siteName,
    images: ['/images/imagehero/1.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mobilier ancien restauré à Marseille',
    description: homeDescription,
    images: ['/images/imagehero/1.webp'],
  },
};

const getHomeProducts = async () => {
  let products = await getPublicCatalog('scope=cards&limit=24');
  if (!products.length) products = await getPublicCatalogFallback({ limitCount: 24 });
  return products.slice(0, 24);
};

const formatPrice = (product) => {
  if (product?.priceOnRequest) return 'Prix sur demande';
  const price = product?.currentPrice || product?.price || product?.startingPrice;
  if (!price) return 'Voir la pièce';
  return `${Number(price).toLocaleString('fr-FR')} €`;
};

const getProductCategoryLabel = (product) => {
  const category = [...(KIT_CONFIG.categoryGroups || []), ...(KIT_CONFIG.productCategories || [])]
    .find((entry) => entry.id === product?.category);
  return category?.label?.replace(/^LES\s+/i, '') || product?.material || 'Pièce restaurée';
};

const getProductTitle = (product, index) => {
  const rawTitle = (product?.name || product?.title || '').trim().replace(/\s+/g, ' ');
  if (rawTitle.length >= 3) return rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  return `Pièce restaurée ${String(index + 1).padStart(2, '0')}`;
};

const getProductDescription = (product) => {
  const material = (product?.material || product?.woodType || '').trim();
  const materialPrefix = material && material.length > 2 ? `${material}. ` : '';
  const categoryDescriptions = {
    buffets: 'Rangement généreux, façade travaillée et patine restaurée pour donner du relief à la pièce.',
    armoires: 'Une pièce haute, choisie pour sa ligne, sa capacité et la présence douce de sa matière.',
    commodes: 'Format compact, équilibre visuel et rangement utile sans alourdir un salon ou une chambre.',
    miroirs: 'Cadre ancien, reflet profond et détail décoratif pour ouvrir la pièce avec caractère.',
  };

  return `${materialPrefix}${categoryDescriptions[product?.category] || 'Pièce ancienne restaurée, sélectionnée pour sa matière et sa présence.'}`;
};

const getHomeProductVisual = (product) => {
  const primaryImage = getProductImageItems(product)[0];
  return primaryImage?.large
    || primaryImage?.medium
    || primaryImage?.src
    || getProductCardImage(product).src
    || '';
};

const getFeaturedProductVisual = (product) => (
  getHomeProductVisual(product)
);

const getFeaturedProductImage = (product) => {
  const primaryImage = getProductImageItems(product)[0];
  const fallback = getProductCardImage(product).src;
  const src = primaryImage?.large
    || primaryImage?.medium
    || primaryImage?.src
    || fallback
    || '';
  const candidates = [
    [primaryImage?.medium, 1024],
    [primaryImage?.large, 1440],
    [primaryImage?.full, 1920],
  ];
  const seen = new Set();
  const srcSet = candidates
    .filter(([candidate]) => candidate && !seen.has(candidate) && seen.add(candidate))
    .map(([candidate, width]) => `${candidate} ${width}w`)
    .join(', ');

  return {
    src,
    srcSet,
    sizes: '(max-width: 767px) min(92vw, 430px), 480px',
    ratio: Number(primaryImage?.metadata?.ratio || primaryImage?.ratio || 0) || null,
  };
};

const hasDisplayReadyTitle = (product) => {
  const rawTitle = (product?.name || product?.title || '').trim().toLowerCase();
  if (rawTitle.length < 4) return false;
  return !['test', 'demo', 'image', 'photo', 'meuble de metier'].includes(rawTitle);
};

const hasDisplayReadyPrice = (product) => {
  if (product?.priceOnRequest) return true;
  const price = Number(product?.currentPrice || product?.price || product?.startingPrice || 0);
  return price === 0 || price >= 50;
};

const isDisplayReadyHomeProduct = (product) => (
  product?.id &&
  !homeExcludedProductIds.has(product.id) &&
  getHomeProductVisual(product) &&
  product?.category !== 'tables' &&
  hasDisplayReadyTitle(product) &&
  hasDisplayReadyPrice(product)
);

const getHomeProductPriority = (product) => {
  const rawTitle = (product?.name || product?.title || '').trim().toLowerCase();
  const price = Number(product?.currentPrice || product?.price || product?.startingPrice || 0);
  let score = 0;
  if (price >= 50) score += 2;
  if (rawTitle.includes('buffet')) score += 2;
  if (rawTitle.includes('armoire') || rawTitle.includes('miroir') || rawTitle.includes('chevet') || rawTitle.includes('commode')) score += 1;
  return score;
};

const getFeaturedProducts = (products, limit = 4) => {
  const selected = [];
  const seenVisuals = new Set();
  const eligibleProducts = products
    .filter(isDisplayReadyHomeProduct)
    .sort((a, b) => getHomeProductPriority(b) - getHomeProductPriority(a));

  const addProduct = (product) => {
    if (selected.length >= limit) return;
    const visual = getFeaturedProductVisual(product);
    const visualKey = visual || product?.id || '';
    if (visualKey && seenVisuals.has(visualKey)) return;
    if (visualKey) seenVisuals.add(visualKey);
    selected.push(product);
  };

  homeFeaturedProductIds.forEach((productId) => {
    const product = eligibleProducts.find((entry) => entry.id === productId);
    if (product) addProduct(product);
  });

  if (selected.length >= limit) return selected;

  homeSelectionCategoryOrder.forEach((categoryId) => {
    const product = eligibleProducts.find((entry) => entry.category === categoryId);
    if (product) addProduct(product);
  });

  if (selected.length >= limit) return selected;

  eligibleProducts.forEach(addProduct);

  if (selected.length >= limit) return selected;

  products.forEach((product) => {
    if (selected.length >= limit) return;
    if (selected.some((entry) => entry.id === product.id)) return;
    selected.push(product);
  });

  return selected;
};

const getProductCardClassName = (index) => {
  const variants = [
    'sv-product-card--lead',
    'sv-product-card--wide',
    'sv-product-card--narrow',
    'sv-product-card--quiet sv-product-card--offset',
  ];
  return variants[index] || 'sv-product-card--narrow';
};

const buildJsonLd = (products) => {
  const siteUrl = publicEnv.siteUrl.replace(/\/$/, '');
  const homeUrl = `${siteUrl}/`;
  const organizationId = `${homeUrl}#localbusiness`;
  const webpageId = `${homeUrl}#webpage`;
  const itemListId = `${homeUrl}#selection`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': organizationId,
        name: publicEnv.siteName,
        url: homeUrl,
        image: `${siteUrl}/images/imagehero/1.webp`,
        description: homeDescription,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Marseille',
          addressCountry: 'FR',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${homeUrl}#website`,
        name: publicEnv.siteName,
        url: homeUrl,
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'CollectionPage',
        '@id': webpageId,
        name: 'Mobilier ancien restauré autour de Marseille',
        description: homeDescription,
        url: homeUrl,
        isPartOf: { '@id': `${homeUrl}#website` },
        about: { '@id': organizationId },
        mainEntity: { '@id': itemListId },
      },
      {
        '@type': 'ItemList',
        '@id': itemListId,
        name: 'Dernières pièces de la galerie Seconde Vie',
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: getProductTitle(product, index),
          url: getProductUrl(product, siteUrl),
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${homeUrl}#faq`,
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };
};

export default async function Page() {
  const products = await getHomeProducts();
  const featuredProducts = getFeaturedProducts(products, 4);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: galleryEntryBootstrapScript }} />
      <HomeGalleryLauncher />
      <main className="sv-home" data-public-ssr-fallback data-ssr-home>
        <header className="sv-home-nav">
          <nav className="sv-home-nav__inner" aria-label="Navigation accueil">
            <Link href="/" className="sv-home-brand">
              <img src="/images/logoanais-320.webp" alt="Seconde Vie par Anaïs" width="44" height="33" />
              <span>
                <strong>Seconde Vie</strong>
                <small>par Anaïs</small>
              </span>
            </Link>
            <div className="sv-home-nav__links">
              <a href="#selection">Pièces</a>
              <a href="#atelier">Atelier</a>
              <a href="#faq">FAQ</a>
            </div>
            <button type="button" data-gallery-launcher className="sv-home-button sv-home-button--light">
              Galerie
              <span aria-hidden="true">→</span>
            </button>
          </nav>
        </header>

        <section className="sv-home-hero">
          <div className="sv-home-hero__media" aria-hidden="true">
            <picture>
              <source media="(max-width: 767px)" srcSet="/images/imagehero/1-mobile.webp" />
              <img
                src="/images/imagehero/1.webp"
                alt=""
                width="1672"
                height="941"
                fetchPriority="high"
              />
            </picture>
          </div>

          <div className="sv-home-hero__inner">
            <div className="sv-home-hero__copy">
              <p className="sv-home-kicker">Galerie de mobilier restauré</p>
              <h1>Mobilier ancien restauré autour de Marseille</h1>
              <p className="sv-home-hero__intro">
                Buffets, armoires, commodes et miroirs choisis pour leur matière, restaurés avec mesure,
                puis présentés comme des pièces uniques prêtes à rejoindre un intérieur actuel.
              </p>
              <div className="sv-home-actions">
                <button type="button" data-gallery-launcher className="sv-home-button sv-home-button--cream">
                  Entrer dans la galerie
                  <span aria-hidden="true">→</span>
                </button>
                <a href="#selection" className="sv-home-link-button">Voir les pièces</a>
              </div>
            </div>

            <aside className="sv-home-hero-card sv-home-reveal" aria-label="Sélection actuelle">
              <p>Sélection actuelle</p>
              <div className="sv-home-hero-card__images">
                {heroImages.map((src, index) => (
                  <img
                    key={src}
                    src={src}
                    alt={heroImageAlts[index] || 'Mobilier ancien restauré'}
                    width="240"
                    height="320"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                ))}
              </div>
              <strong>Une première lecture visuelle, puis la galerie complète pour choisir au détail.</strong>
            </aside>
          </div>
        </section>

        <section className="sv-home-section sv-category-band">
          <div className="sv-category-band__intro">
            <p className="sv-home-kicker">Choisir par type de pièce</p>
            <h2>Chaque intérieur appelle une présence.</h2>
            <p>
              Buffets, armoires, miroirs ou petites pièces: chaque famille garde sa ligne, son usage
              et son échelle pour entrer dans la galerie sans se perdre.
            </p>
          </div>

          <div className="sv-category-grid">
            {categoryEntries.map((category, index) => (
              <Link
                key={category.id}
                href={getCategoryUrl(category.id)}
                prefetch={false}
                className={`sv-category-card ${index === 0 || index === 3 ? 'sv-category-card--wide' : ''}`}
              >
                <img src={category.image} alt={category.title} width="520" height="650" loading="lazy" />
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{category.title}</h3>
                  <p>{category.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="selection" className="sv-home-section sv-selection-section sv-home-animate">
          <div className="sv-section-heading sv-selection-heading">
            <div>
              <p className="sv-home-kicker">Dernières pièces</p>
              <h2>Quatre pièces en vue, choisies pour leur caractère.</h2>
            </div>
            <button type="button" data-gallery-launcher className="sv-home-button sv-home-button--dark">
              Tout voir
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {featuredProducts.length ? (
            <ul className="sv-product-wall">
              {featuredProducts.map((product, index) => {
                const productVisual = getFeaturedProductVisual(product);
                const productImage = getFeaturedProductImage(product);
                const title = getProductTitle(product, index);
                return (
                  <li key={product.id} className={getProductCardClassName(index)}>
                    <Link href={getProductUrl(product)} prefetch={false} className="sv-product-link">
                      <article className="sv-product-card">
                        <div
                          className="sv-product-card__media"
                          style={productImage.ratio ? { '--sv-product-image-ratio': productImage.ratio } : undefined}
                        >
                          {productVisual ? (
                            <img
                              src={productImage.src}
                              srcSet={productImage.srcSet || undefined}
                              sizes={productImage.srcSet ? productImage.sizes : undefined}
                              alt={title}
                              width="760"
                              height="920"
                              loading={index < 2 ? 'eager' : 'lazy'}
                              decoding="async"
                            />
                          ) : (
                            <div className="sv-product-card__placeholder" aria-hidden="true" />
                          )}
                        </div>
                        <div className="sv-product-card__body">
                          <p>
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            {getProductCategoryLabel(product)}
                          </p>
                          <h3>{title}</h3>
                          <span>{getProductDescription(product)}</span>
                          <strong>{formatPrice(product)}</strong>
                        </div>
                      </article>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="sv-empty-selection">Aucune pièce publiée pour le moment.</p>
          )}
        </section>

        <section id="atelier" className="sv-home-section sv-atelier-section">
          <div className="sv-atelier-images">
            <figure>
              <img src="/images/before-after/avant-gallery.webp" alt="Meuble avant restauration" width="700" height="900" loading="eager" />
              <figcaption>Avant</figcaption>
            </figure>
            <figure>
              <img src="/images/before-after/apres-gallery.webp" alt="Meuble après restauration" width="700" height="900" loading="eager" />
              <figcaption>Après</figcaption>
            </figure>
          </div>
          <div className="sv-atelier-copy">
            <p className="sv-home-kicker">Atelier et savoir-faire</p>
            <h2>Restaurer sans effacer l’histoire.</h2>
            <p>
              Le travail consiste à lire la pièce avant d’intervenir: nettoyer, réparer, stabiliser,
              choisir une finition et garder les traces qui donnent de la profondeur. L’objectif n’est
              pas de rendre le meuble neuf, mais de le rendre juste.
            </p>
            <div className="sv-home-actions">
              <Link href="/a-propos" prefetch={false} className="sv-home-link-button sv-home-link-button--dark">Découvrir l’atelier</Link>
              <Link href="/devis" prefetch={false} className="sv-home-button sv-home-button--dark">Demander un devis</Link>
            </div>
          </div>
        </section>

        <section className="sv-home-section sv-location-section sv-home-animate">
          <div className="sv-location-copy">
            <p className="sv-home-kicker">Marseille et livraison</p>
            <h2>Du meuble choisi à sa place chez vous.</h2>
            <p className="sv-location-intro">
              L'achat ne s'arrête pas à la photo: on regarde le volume, les accès, la fragilité
              et la bonne manière de faire arriver la pièce sans improvisation.
            </p>
          </div>
          <div className="sv-route-board">
            <figure className="sv-route-visual">
              <img src="/images/menu-delivery-marseille-wide.jpg" alt="Livraison de mobilier ancien à Marseille" width="900" height="480" loading="lazy" />
            </figure>
            {routeSteps.map(([number, title, text]) => (
              <article key={title} className={`sv-location-card sv-location-card--${number}`}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
            <aside className="sv-route-note">
              <strong>Marseille et alentours</strong>
              <p>Les projets proches restent simples; les trajets plus longs sont validés meuble par meuble.</p>
            </aside>
          </div>
        </section>

        <section id="faq" className="sv-home-section sv-faq-section">
          <div className="sv-faq-heading">
            <p className="sv-home-kicker">Réponses utiles avant la visite</p>
          </div>
          <div className="sv-faq-mark" aria-hidden="true">FAQ</div>
          <div className="sv-faq-list">
            {faqItems.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="sv-home-section sv-final-cta">
          <div>
            <p className="sv-home-kicker">Entrée galerie</p>
            <h2>Voir les pièces disponibles maintenant.</h2>
          </div>
          <button type="button" data-gallery-launcher className="sv-home-button sv-home-button--cream">
            Entrer dans la galerie
            <span aria-hidden="true">→</span>
          </button>
        </section>

        <footer className="sv-home-footer">
          <div>
            <p>Seconde Vie</p>
            <span>Galerie de mobilier ancien restauré, pièces uniques, atelier et livraison étudiée autour de Marseille.</span>
          </div>
          <nav aria-label="Liens de pied de page">
            <Link href={getCategoryUrl('buffets')} prefetch={false}>Buffets</Link>
            <Link href={getCategoryUrl('armoires')} prefetch={false}>Armoires</Link>
            <Link href="/a-propos" prefetch={false}>Atelier</Link>
            <Link href="/devis" prefetch={false}>Devis</Link>
          </nav>
        </footer>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(buildJsonLd(featuredProducts)) }}
      />
    </>
  );
}
