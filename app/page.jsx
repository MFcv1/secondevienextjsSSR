import Link from 'next/link';
import HomeMotionIsland from './HomeMotionIsland';
import { getPublicCatalog, getPublicCatalogFallback } from '../src/lib/server/products';
import { publicEnv } from '../src/lib/server/env';
import KIT_CONFIG from '../src/kit/config/constants';
import { getCategoryUrl, getProductUrl } from '../src/utils/slug';
import { getProductCardImage, getProductImageItems } from '../src/utils/imageUtils';

export const revalidate = 300;

export const viewport = {
  themeColor: '#18100c',
  colorScheme: 'dark',
};

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
    image: '/images/categories/buffets-home.webp',
  },
  armoires: {
    title: 'Armoires restaurées',
    text: 'Pièces hautes et utiles, choisies pour leur ligne, leur capacité et la qualité de leur matière.',
    image: '/images/categories/armoires-home.webp',
  },
  commodes: {
    title: 'Commodes et chevets',
    text: 'Formats plus compacts pour installer une patine, un équilibre et du rangement sans alourdir la pièce.',
    image: '/images/categories/commodes-home.webp',
  },
  miroirs: {
    title: 'Miroirs anciens',
    text: 'Cadres, reflets et détails décoratifs qui agrandissent l’espace sans effacer son caractère.',
    image: '/images/categories/miroirs-home.webp',
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

const getCategoryImageFromProducts = (products = [], usedImages = new Set(), matcher = null) => {
  const product = products.find((item) => {
    if (matcher && !matcher(item)) return false;
    const image = getProductCardImage(item).src || getHomeProductVisual(item);
    return image && !usedImages.has(image);
  });
  const image = product ? (getProductCardImage(product).src || getHomeProductVisual(product)) : '';
  if (image) usedImages.add(image);
  return image;
};

const normalizeHomeSearchText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const isAssiseProduct = (product) => {
  const category = normalizeHomeSearchText(product?.category);
  const text = normalizeHomeSearchText([
    product?.name,
    product?.title,
    product?.material,
    product?.description,
  ].filter(Boolean).join(' '));

  return ['assises', 'chaises', 'fauteuils', 'bancs'].includes(category)
    || /\b(assise|chaise|chaises|fauteuil|fauteuils|banc|bancs)\b/.test(text);
};

const getHomeCategoryImages = async (homeProducts = []) => {
  const usedImages = new Set(Object.values(categoryCopy).map((entry) => entry.image).filter(Boolean));
  const entries = await Promise.all([
    ['tables', ['tables']],
    ['chaises', ['assises', 'chaises', 'fauteuils', 'bancs']],
  ].map(async ([id, categoryIds]) => {
    let products = await getPublicCatalog(`scope=cards&limit=6&categories=${categoryIds.join(',')}`);
    if (!products.length) {
      products = await getPublicCatalogFallback({ categoryIds, limitCount: 6 });
    }
    const matcher = id === 'chaises' ? isAssiseProduct : null;
    const image = getCategoryImageFromProducts(products, usedImages, matcher)
      || (id === 'chaises' ? getCategoryImageFromProducts(homeProducts, usedImages, matcher) : '');
    return [id, image];
  }));

  return Object.fromEntries(entries.filter(([, image]) => image));
};

const formatPrice = (product) => {
  if (product?.priceOnRequest) return 'Prix sur demande';
  const price = product?.currentPrice || product?.price || product?.startingPrice;
  if (!price) return 'Voir la pièce';
  return `${Number(price).toLocaleString('fr-FR')} €`;
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
  const categoryImages = await getHomeCategoryImages(products);
  const featuredProducts = getFeaturedProducts(products, 4);
  const displayCategoryEntries = categoryEntries.map((category) => ({
    ...category,
    image: categoryImages[category.id] || category.image,
  }));

  return (
    <>
      <HomeMotionIsland />
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
            <Link href="/galerie" prefetch={false} className="sv-home-button sv-home-button--light sv-home-button--nav">
              Galerie
              <span aria-hidden="true">→</span>
            </Link>
          </nav>
        </header>

        <section className="sv-home-hero">
          <div className="sv-home-hero__media" aria-hidden="true">
            <picture>
              <source media="(max-width: 767px)" srcSet="/images/imagehero/1-mobile-v2.webp" />
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
                <Link href="/galerie" prefetch={false} className="sv-home-button sv-home-button--cream">
                  Entrer dans la galerie
                  <span aria-hidden="true">→</span>
                </Link>
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
            {displayCategoryEntries.map((category, index) => (
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
            <Link href="/galerie" prefetch={false} className="sv-home-button sv-home-button--dark">
              Tout voir
              <span aria-hidden="true">→</span>
            </Link>
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
        </section>

        <section className="sv-home-section sv-location-section sv-home-animate">
          <div className="sv-location-copy">
            <p className="sv-home-kicker">Marseille et livraison</p>
            <h2>Livraison à 20 km autour de Marseille.</h2>
            <p className="sv-location-intro">
              On organise simplement le retrait ou la livraison proche, selon le meuble et les accès.
            </p>
          </div>
          <div className="sv-route-board">
            <figure className="sv-route-visual">
              <img src="/images/menu-delivery-marseille-wide.jpg" alt="Livraison de mobilier ancien à Marseille" width="900" height="480" loading="lazy" />
            </figure>
            <aside className="sv-route-note">
              <strong>Livraison locale</strong>
              <p>Disponible autour de Marseille, dans un rayon d'environ 20 km.</p>
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
          <div className="sv-final-cta__inner">
            <div className="sv-final-cta__copy">
              <p className="sv-home-kicker">Entrée galerie</p>
              <h2>Voir les pièces disponibles maintenant.</h2>
            </div>
            <img
              src="/images/logoanais-320.webp"
              alt=""
              width="96"
              height="72"
              loading="lazy"
              decoding="async"
              className="sv-final-cta__logo"
              aria-hidden="true"
            />
            <Link href="/galerie" prefetch={false} className="sv-home-button sv-home-button--cream">
              Entrer dans la galerie
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <footer className="sv-home-footer">
          <div className="sv-home-footer__shell">
            <div className="sv-home-footer__brand">
              <Link href="/" prefetch={false} className="sv-home-footer__logo">
                <img src="/images/logoanais-320.webp" alt="Seconde Vie par Anais" width="64" height="48" loading="lazy" />
                <span>
                  <strong>Seconde Vie<span>.</span></strong>
                  <small>par Anais</small>
                </span>
              </Link>
              <p>Galerie de mobilier ancien restaure, pieces uniques, atelier et livraison etudiee autour de Marseille.</p>
              <div className="sv-home-footer__socials" aria-label="Reseaux sociaux">
                <a href={KIT_CONFIG.socialLinks.instagram || '/galerie'} aria-label="Instagram">IG</a>
                <a href={KIT_CONFIG.socialLinks.facebook || '/galerie'} aria-label="Facebook">FB</a>
                <Link href="/galerie#gallery-pieces" prefetch={false} aria-label="Voir la galerie">SV</Link>
              </div>
            </div>

            <nav className="sv-home-footer__panel sv-home-footer__links" aria-label="Liens du pied de page">
              <div className="sv-home-footer__links-column">
                <h3>La galerie</h3>
                <Link href="/galerie#gallery-pieces" prefetch={false}>Nouveautes <span aria-hidden="true">{'->'}</span></Link>
                <Link href={getCategoryUrl('meubles')} prefetch={false}>Meubles <span aria-hidden="true">{'->'}</span></Link>
                <Link href={getCategoryUrl('assises')} prefetch={false}>Assises <span aria-hidden="true">{'->'}</span></Link>
                <Link href={getCategoryUrl('eclairage')} prefetch={false}>Eclairage <span aria-hidden="true">{'->'}</span></Link>
                <Link href={getCategoryUrl('decorations')} prefetch={false}>Decorations <span aria-hidden="true">{'->'}</span></Link>
                <Link href="/galerie#gallery-small-prices" prefetch={false}>Petits prix <span aria-hidden="true">{'v ->'}</span></Link>
              </div>
              <div className="sv-home-footer__links-column">
                <h3>A propos</h3>
                <Link href="/a-propos" prefetch={false}>Notre histoire</Link>
                <Link href="/a-propos#valeurs" prefetch={false}>Nos valeurs</Link>
                <Link href="/a-propos#atelier" prefetch={false}>Atelier & Renovations</Link>
                <Link href="/devis" prefetch={false}>Livraison</Link>
                <Link href="/#faq" prefetch={false}>FAQ</Link>
                <Link href="/devis" prefetch={false}>Contact</Link>
              </div>
              <div className="sv-home-footer__links-column">
                <h3>Mon compte</h3>
                <Link href="/admin" prefetch={false}>Se connecter</Link>
                <Link href="/wishlist" prefetch={false}>Creer un compte</Link>
                <Link href="/mes-commandes" prefetch={false}>Mes commandes</Link>
                <Link href="/wishlist" prefetch={false}>Mes favoris</Link>
                <Link href="/admin" prefetch={false}>Mes annonces</Link>
                <Link href="/devis" prefetch={false}>Vendre un objet</Link>
              </div>
              <div className="sv-home-footer__links-column">
                <h3>Besoin d'aide ?</h3>
                <Link href="/devis" prefetch={false}>Centre d'aide</Link>
                <Link href="/devis" prefetch={false}>Livraison & Retours</Link>
                <Link href="/checkout" prefetch={false}>Paiement securise</Link>
                <Link href="/devis" prefetch={false}>Conditions d'utilisation</Link>
                <Link href="/devis" prefetch={false}>Politique de confidentialite</Link>
                <Link href="/devis" prefetch={false}>CGV</Link>
              </div>
            </nav>

            <section className="sv-home-footer__panel sv-home-footer__atelier" aria-labelledby="home-footer-atelier">
              <h3 id="home-footer-atelier">Notre atelier a Marseille</h3>
              <div className="sv-home-footer__map">
                <iframe
                  src="https://www.google.com/maps?q=Marseille%2C%20France&z=13&output=embed"
                  title="Carte de l'atelier a Marseille"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="sv-home-footer__contact">
                <a href="mailto:contact@secondevie-marseille.fr"><span>Mail</span>contact@secondevie-marseille.fr</a>
                <a href="tel:+33612345678"><span>Tel</span>+33 6 12 34 56 78</a>
                <p><span>Horaires</span>Lun - Sam : 10h - 19h</p>
              </div>
            </section>

            <section className="sv-home-footer__panel sv-home-footer__payments" aria-labelledby="home-footer-payments">
              <h3 id="home-footer-payments">Moyens de paiement acceptes</h3>
              <div className="sv-home-footer__payment-stack">
                <div className="sv-home-footer__payment-card">
                  <div className="sv-home-footer__payment-heading">
                    <span aria-hidden="true" className="sv-home-footer__payment-icon">
                      <svg viewBox="0 0 24 24" focusable="false">
                        <path d="M4.75 8.5h14.5v10H4.75z" />
                        <path d="M7.5 8.5V6.75a4.5 4.5 0 0 1 9 0V8.5" />
                        <path d="M7.75 13h2" />
                      </svg>
                    </span>
                    <span>
                      <strong>Carte / Wallets</strong>
                      <small>Rapide & securise</small>
                    </span>
                  </div>
                  <div className="sv-home-footer__payment-chip-row">
                    <span className="sv-payment-chip sv-payment-chip--visa">VISA</span>
                    <span className="sv-payment-chip sv-payment-chip--mastercard" aria-label="Mastercard">
                      <svg viewBox="0 0 52 32" focusable="false" aria-hidden="true">
                        <circle cx="20" cy="16" r="12" fill="#EB001B" />
                        <circle cx="32" cy="16" r="12" fill="#F79E1B" />
                        <path d="M26 7.4a12 12 0 0 1 0 17.2 12 12 0 0 1 0-17.2Z" fill="#FF5F00" />
                      </svg>
                    </span>
                    <span className="sv-payment-chip sv-payment-chip--apple" aria-label="Apple Pay">
                      <svg viewBox="0 0 18 22" focusable="false" aria-hidden="true">
                        <path d="M14.7 11.5c0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.6-1.7-3.1-1.7-1.3-.1-2.6.8-3.3.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 6.9 1.1 9.2.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.8-1.1-2.8-4Z" />
                        <path d="M12.6 5.2c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1 1.7-.9 2.6 1 0 1.9-.5 2.5-1.2Z" />
                      </svg>
                      Pay
                    </span>
                    <span className="sv-payment-chip sv-payment-chip--google" aria-label="Google Pay">
                      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                        <path fill="#4285F4" d="M22.6 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.75h3.56c2.08-1.92 3.28-4.74 3.28-8.08Z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.56-2.75c-.98.66-2.23 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                        <path fill="#FBBC05" d="M5.84 14.1A6.61 6.61 0 0 1 5.5 12c0-.73.12-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84Z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.1 14.97 1 12 1A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z" />
                      </svg>
                      Pay
                    </span>
                    <span className="sv-payment-chip sv-payment-chip--paypal">PayPal</span>
                  </div>
                </div>
                <div className="sv-home-footer__payment-separator" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="m8 7 4-4 4 4" />
                    <path d="M12 3v18" />
                    <path d="m8 17 4 4 4-4" />
                  </svg>
                </div>
                <div className="sv-home-footer__payment-card">
                  <div className="sv-home-footer__payment-heading">
                    <span aria-hidden="true" className="sv-home-footer__payment-icon">
                      <svg viewBox="0 0 24 24" focusable="false">
                        <path d="M3 10h18L12 4 3 10Z" />
                        <path d="M5 10v8" />
                        <path d="M9 10v8" />
                        <path d="M15 10v8" />
                        <path d="M19 10v8" />
                        <path d="M4 18h16" />
                      </svg>
                    </span>
                    <span>
                      <strong>Virement</strong>
                      <small>Instructions via email</small>
                    </span>
                  </div>
                  <div className="sv-home-footer__payment-chip-row">
                    <span className="sv-payment-chip sv-payment-chip--bank">
                      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                        <path d="M3 10h18L12 4 3 10Z" />
                        <path d="M5 10v8" />
                        <path d="M9 10v8" />
                        <path d="M15 10v8" />
                        <path d="M19 10v8" />
                        <path d="M4 18h16" />
                      </svg>
                      Virement
                    </span>
                    <span className="sv-payment-chip sv-payment-chip--wero">wero</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="sv-home-footer__panel sv-home-footer__delivery" aria-labelledby="home-footer-delivery">
              <h3 id="home-footer-delivery">Livraison & securite</h3>
              <img src="/images/footer-delivery-dark.webp" alt="Livraison partout a Marseille" width="768" height="512" loading="lazy" />
              <div className="sv-home-footer__trust">
                <div className="sv-home-footer__trust-title">
                  <span aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M12 3.75 19.25 7v5.25c0 4.6-3.05 7.55-7.25 8.75-4.2-1.2-7.25-4.15-7.25-8.75V7L12 3.75Z" />
                      <path d="m8.8 12.15 2.1 2.1 4.45-4.55" />
                    </svg>
                  </span>
                  Site securise
                </div>
                <span className="sv-home-footer__trust-item">
                  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                    <path d="M6.5 10V7.75a5.5 5.5 0 0 1 11 0V10" />
                    <path d="M5 10h14v10H5z" />
                    <path d="M12 14v2.5" />
                  </svg>
                  <span>SSL<br />Secure</span>
                </span>
                <span className="sv-home-footer__trust-item">
                  <strong>PCI</strong>
                  <span>DSS<br />Compliant</span>
                </span>
                <span className="sv-home-footer__trust-item">
                  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                    <path d="M12 3.75 19 6.9v5.35c0 4.25-2.85 7.05-7 8.25-4.15-1.2-7-4-7-8.25V6.9l7-3.15Z" />
                    <path d="m9.15 12.15 1.9 1.9 3.95-4.1" />
                  </svg>
                  <span>3D<br />Secure</span>
                </span>
              </div>
            </section>
          </div>
        </footer>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(buildJsonLd(featuredProducts)) }}
      />
    </>
  );
}
