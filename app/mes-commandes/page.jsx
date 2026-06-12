import RouteClientProviders from '../RouteClientProviders';
import OrdersPageIsland from './OrdersPageIsland';
import ArchitecturalHeaderServer from '../../src/kit/marketplace/ArchitecturalHeaderServer';
import { getPublicCatalog, getPublicCatalogFallback } from '../../src/lib/server/products';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Mon espace',
  robots: { index: false, follow: false }
};

const getOrdersInitialItems = async () => {
  const products = await getPublicCatalog('scope=cards&limit=120');
  if (products.length) return products;
  return getPublicCatalogFallback({ limitCount: 120 });
};

export default async function OrdersPage() {
  const initialItems = await getOrdersInitialItems();
  return (
    <>
      <ArchitecturalHeaderServer darkMode={false} />
      <RouteClientProviders>
        <OrdersPageIsland initialItems={initialItems} />
      </RouteClientProviders>
    </>
  );
}
