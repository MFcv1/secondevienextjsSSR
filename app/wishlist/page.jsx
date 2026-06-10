import RouteClientProviders from '../RouteClientProviders';
import WishlistPageIsland from './WishlistPageIsland';
import { getPublicCatalog, getPublicCatalogFallback } from '../../src/lib/server/products';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Wishlist',
  robots: { index: false, follow: false }
};

const getWishlistInitialItems = async () => {
  const products = await getPublicCatalog('scope=cards&limit=120');
  if (products.length) return products;
  return getPublicCatalogFallback({ limitCount: 120 });
};

export default async function WishlistPage() {
  const initialItems = await getWishlistInitialItems();
  return (
    <RouteClientProviders>
      <WishlistPageIsland initialItems={initialItems} />
    </RouteClientProviders>
  );
}
