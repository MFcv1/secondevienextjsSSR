import RouteClientProviders from '../RouteClientProviders';
import OrdersPageIsland from './OrdersPageIsland';
import ArchitecturalHeaderServer from '../../src/kit/marketplace/ArchitecturalHeaderServer';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Mon espace',
  robots: { index: false, follow: false }
};

export default function OrdersPage() {
  return (
    <>
      <ArchitecturalHeaderServer darkMode={false} />
      <RouteClientProviders>
        <OrdersPageIsland />
      </RouteClientProviders>
    </>
  );
}
