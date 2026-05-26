import Link from 'next/link';
import HomeGalleryLauncher from './HomeGalleryLauncher';
import { getPublicCatalog, getPublicCatalogFallback } from '../src/lib/server/products';
import { publicEnv } from '../src/lib/server/env';
import KIT_CONFIG from '../src/kit/config/constants';
import { getCategoryUrl, getProductUrl } from '../src/utils/slug';
import { getProductCardImage } from '../src/utils/imageUtils';

export const revalidate = 300;

const heroImages = [
  '/images/imagehero/1.webp',
  '/images/imagehero/2.webp',
  '/images/imagehero/3.webp',
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

const proofItems = [
  ['01', 'Pièces uniques', 'Un seul exemplaire par meuble, documenté avec ses proportions, son état et sa matière.'],
  ['02', 'Restauration mesurée', 'Nettoyer, réparer, stabiliser et choisir une finition sans gommer l’histoire visible.'],
  ['03', 'Lecture claire', 'Photos, dimensions et détails utiles pour décider avant la visite ou la livraison.'],
  ['04', 'Trajet étudié', 'Retrait ou transport organisé selon volume, accès, fragilité et distance depuis Marseille.'],
];

const proofStatement = ['Choisir', 'une', 'pièce', 'ancienne,', 'c’est', 'lire', 'sa', 'matière', 'avant', 'son', 'prix.'];

const routeSteps = [
  ['01', 'Volume', 'Largeur, hauteur, profondeur et poids estimé posent le cadre avant toute promesse.'],
  ['02', 'Accès', 'Escalier, ascenseur, stationnement, étage et contraintes du lieu sont vérifiés avec précision.'],
  ['03', 'Trajet', 'Retrait atelier, Marseille proche ou transport dédié: la solution suit la fragilité de la pièce.'],
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

export const metadata = {
  title: 'Mobilier ancien restauré à Marseille',
  description: publicEnv.siteDescription || 'Meubles anciens restaurés, buffets, armoires, commodes et miroirs sélectionnés par Seconde Vie autour de Marseille.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Mobilier ancien restauré à Marseille',
    description: publicEnv.siteDescription,
    url: publicEnv.siteUrl,
    siteName: publicEnv.siteName,
    images: ['/images/imagehero/1.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mobilier ancien restauré à Marseille',
    description: publicEnv.siteDescription,
    images: ['/images/imagehero/1.webp'],
  },
};

const getHomeProducts = async () => {
  let products = await getPublicCatalog('scope=cards&limit=10');
  if (!products.length) products = await getPublicCatalogFallback({ limitCount: 10 });
  return products.slice(0, 10);
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
  const rawTitle = (product?.name || product?.title || '').trim();
  if (rawTitle.length >= 3) return rawTitle;
  return `Pièce restaurée ${String(index + 1).padStart(2, '0')}`;
};

const getProductDescription = (product) => {
  const detail = product?.material || product?.style || product?.woodType;
  if (detail && detail.length > 2) return detail;
  return 'Meuble ancien restauré et prêt à découvrir dans la galerie.';
};

const getHomeProductVisual = (product) => {
  const categoryVisual = categoryCopy[product?.category]?.image;
  if (categoryVisual) return categoryVisual;
  return getProductCardImage(product).src;
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
        description: publicEnv.siteDescription || 'Galerie de mobilier ancien restauré autour de Marseille.',
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
        description: publicEnv.siteDescription || 'Sélection de meubles anciens restaurés, pièces uniques et mobilier vintage.',
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
  const featuredProducts = products.slice(0, 8);

  return (
    <>
      <HomeGalleryLauncher />
      <main className="sv-home" data-public-ssr-fallback data-ssr-home>
        <header className="sv-home-nav">
          <nav className="sv-home-nav__inner" aria-label="Navigation accueil">
            <Link href="/" className="sv-home-brand">
              <img src="/images/logoanais-320.webp" alt="" width="44" height="33" />
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
                    alt=""
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

        <section className="sv-home-section sv-proof-chapter sv-home-animate" aria-label="Garanties Seconde Vie">
          <div className="sv-proof-chapter__statement">
            <p className="sv-home-kicker">Ce qui compte avant l’achat</p>
            <h2 aria-label={proofStatement.join(' ')}>
              {proofStatement.map((word, index) => (
                <span className="sv-tone-word" key={`${word}-${index}`}>{word} </span>
              ))}
            </h2>
          </div>
          <div className="sv-proof-rail">
            {proofItems.map(([number, title, text]) => (
              <article key={title} className="sv-proof-line">
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sv-home-section sv-category-band">
          <div className="sv-category-band__intro">
            <p className="sv-home-kicker">Choisir par type de pièce</p>
            <h2>Le bon meuble commence par une silhouette.</h2>
            <p>
              Les catégories gardent le catalogue lisible pour Google comme pour les visiteurs:
              chaque entrée mène vers une page SSR dédiée.
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
                <img src={category.image} alt="" width="520" height="650" loading="lazy" />
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
              <h2>Une galerie vivante, limitée aux pièces disponibles.</h2>
            </div>
            <button type="button" data-gallery-launcher className="sv-home-button sv-home-button--dark">
              Tout voir
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {featuredProducts.length ? (
            <ul className="sv-product-wall">
              {featuredProducts.map((product, index) => {
                const productVisual = getHomeProductVisual(product);
                const title = getProductTitle(product, index);
                return (
                  <li key={product.id} className={index === 0 ? 'sv-product-card--lead' : undefined}>
                    <Link href={getProductUrl(product)} prefetch={false} className="sv-product-link">
                      <article className="sv-product-card">
                        <div className="sv-product-card__media">
                          {productVisual ? (
                            <img
                              src={productVisual}
                              alt={title}
                              width="760"
                              height="920"
                              loading={index < 2 ? 'eager' : 'lazy'}
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
          <div>
            <p className="sv-home-kicker">Marseille et livraison</p>
            <h2>Une pièce se choisit aussi par son trajet.</h2>
            <p className="sv-location-intro">
              Pas de promesse vague: chaque meuble passe par une lecture logistique avant de quitter l’atelier.
            </p>
          </div>
          <div className="sv-route-board">
            <div className="sv-route-board__line" aria-hidden="true" />
            {routeSteps.map(([number, title, text]) => (
              <article key={title} className="sv-location-card">
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
            <aside className="sv-route-note">
              <strong>Marseille d’abord</strong>
              <p>Les projets proches sont traités avec priorité; les trajets plus longs sont validés meuble par meuble.</p>
            </aside>
          </div>
        </section>

        <section id="faq" className="sv-home-section sv-faq-section">
          <div className="sv-faq-heading">
            <p className="sv-home-kicker">Questions fréquentes</p>
            <h2>Avant d’entrer dans la galerie.</h2>
          </div>
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
