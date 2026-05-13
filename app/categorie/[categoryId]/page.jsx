import ClientApp from '../../ClientApp';
import {
  getPublicCatalog,
  getPublicCatalogFallback
} from '../../../src/lib/server/products';
import { publicEnv } from '../../../src/lib/server/env';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { categoryId } = await params;
  const label = decodeURIComponent(categoryId || '');
  const title = label ? `${label} restaure` : 'Categorie';
  const description = `Selection de mobilier ${label} restaure par Seconde Vie.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${publicEnv.siteUrl.replace(/\/$/, '')}/categorie/${encodeURIComponent(label)}`
    },
    openGraph: {
      title,
      description,
      siteName: publicEnv.siteName
    },
    twitter: {
      card: 'summary',
      title,
      description
    }
  };
}

export default async function CategoryPage({ params }) {
  const { categoryId } = await params;
  let products = await getPublicCatalog(`categories=${encodeURIComponent(categoryId)}&scope=cards&limit=24`);
  if (!products.length) {
    products = await getPublicCatalogFallback({ categoryIds: [categoryId], limitCount: 24 });
  }

  return (
    <>
      <section className="sr-only" data-ssr-category>
        <h1>{decodeURIComponent(categoryId)}</h1>
        <p>{products.length} pieces publiees dans cette categorie.</p>
        <ul>
          {products.slice(0, 12).map((product) => (
            <li key={product.id}>
              {product.name || product.title}
            </li>
          ))}
        </ul>
      </section>
      <ClientApp />
    </>
  );
}
