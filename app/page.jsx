import Link from 'next/link';
import ClientApp from './ClientApp';
import { getPublicCatalog, getPublicCatalogFallback } from '../src/lib/server/products';
import { publicEnv } from '../src/lib/server/env';
import KIT_CONFIG from '../src/kit/config/constants';
import { getCategoryUrl, getProductUrl } from '../src/utils/slug';

export const revalidate = 300;

const categoryEntries = Array.from(
  new Map([
    ...(KIT_CONFIG.categoryGroups || []),
    ...(KIT_CONFIG.productCategories || [])
  ].map((category) => [category.id, category])).values()
);

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

export const metadata = {
  title: 'Mobilier ancien restaure autour de Marseille',
  description: publicEnv.siteDescription || 'Galerie de mobilier ancien restaure et pieces uniques par Seconde Vie.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Mobilier ancien restaure autour de Marseille',
    description: publicEnv.siteDescription,
    url: publicEnv.siteUrl,
    siteName: publicEnv.siteName,
    images: ['/images/gallery-hero-1.webp']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mobilier ancien restaure autour de Marseille',
    description: publicEnv.siteDescription,
    images: ['/images/gallery-hero-1.webp']
  }
};

const getHomeProducts = async () => {
  let products = await getPublicCatalog('scope=cards&limit=12');
  if (!products.length) products = await getPublicCatalogFallback({ limitCount: 12 });
  return products.slice(0, 12);
};

const productJsonLd = (products) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: publicEnv.siteName,
  description: publicEnv.siteDescription,
  url: publicEnv.siteUrl,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name || product.title,
      url: getProductUrl(product, publicEnv.siteUrl)
    }))
  }
});

export default async function Page() {
  const products = await getHomeProducts();

  return (
    <>
      <section
        className="sr-only"
        data-public-ssr-fallback
        data-ssr-home
      >
        <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[52vh] overflow-hidden bg-stone-900 lg:min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/55 via-stone-950/20 to-transparent" />
          </div>
          <div className="flex flex-col justify-center px-5 py-10 md:px-10 lg:px-14">
            <div className="max-w-3xl space-y-8">
              <div className="space-y-5">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-stone-500">Galerie Seconde Vie par Anais</p>
                <h1 className="font-serif text-5xl leading-none md:text-7xl">
                  Mobilier ancien restaure autour de Marseille
                </h1>
                <p className="max-w-2xl text-base leading-8 text-stone-700">
                  La galerie rassemble des meubles anciens restaures, des pieces vintage et des objets de caractere selectionnes pour leur matiere, leurs proportions et leur potentiel dans une maison actuelle.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className="rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white" href="#selection">
                  Voir la selection
                </Link>
                <Link className="rounded-full border border-stone-300 px-5 py-3 text-sm font-bold text-stone-800" href="/a-propos" prefetch={false}>
                  Decouvrir l'atelier
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {['Pieces uniques', 'Descriptions detaillees', 'Livraison selon piece'].map((label) => (
                  <div key={label} className="rounded-xl border border-stone-300 p-4 text-sm font-semibold text-stone-700">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="selection" className="mx-auto max-w-7xl space-y-9 px-5 py-12 md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-stone-500">Catalogue public</p>
              <h2 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">Dernieres pieces publiees</h2>
            </div>
            <nav className="flex flex-wrap gap-2">
              {categoryEntries.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  className="rounded-full border border-stone-300 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-stone-600"
                  href={getCategoryUrl(category.id)}
                  prefetch={false}
                >
                  {category.label}
                </Link>
              ))}
            </nav>
          </div>

          {products.length ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <li key={product.id}>
                  <Link className="group block space-y-3 text-inherit no-underline" href={getProductUrl(product)} prefetch={false}>
                    <div className="space-y-1">
                      <h2 className="font-serif text-2xl leading-tight">{product.name || product.title}</h2>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{product.material || 'Piece restauree'}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-stone-300 p-6 text-stone-700">
              Aucune piece publiee pour le moment.
            </p>
          )}
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd(products)) }}
      />
      <ClientApp />
    </>
  );
}
