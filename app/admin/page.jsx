import RouteClientProviders from '../RouteClientProviders';
import AdminAppIsland from './AdminAppIsland';
import { getPublicCatalog, getPublicCatalogFallback } from '../../src/lib/server/products';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Administration',
  robots: {
    index: false,
    follow: false
  }
};

const getAdminInitialItems = async () => {
  const products = await getPublicCatalog('scope=cards&limit=120');
  if (products.length) return products;
  return getPublicCatalogFallback({ limitCount: 120 });
};

export default async function AdminPage() {
  const initialItems = await getAdminInitialItems();
  return (
    <RouteClientProviders>
      <AdminAppIsland initialItems={initialItems} />
    </RouteClientProviders>
  );
}
