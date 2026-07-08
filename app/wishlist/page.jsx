import RouteClientProviders from '../RouteClientProviders';
import WishlistPageIsland from './WishlistPageIsland';
import ArchitecturalHeaderServer from '../../src/kit/marketplace/ArchitecturalHeaderServer';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Liste de souhaits',
  robots: { index: false, follow: false }
};

export default async function WishlistPage() {
  return (
    <RouteClientProviders>
      <ArchitecturalHeaderServer darkMode={false} />
      <WishlistPageIsland />
    </RouteClientProviders>
  );
}
