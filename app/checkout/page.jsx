import RouteClientProviders from '../RouteClientProviders';
import CheckoutPageIsland from './CheckoutPageIsland';
import ArchitecturalHeaderServer from '../../src/kit/marketplace/ArchitecturalHeaderServer';
import FooterServer from '../../src/kit/marketplace/FooterServer';
import { getServerDarkMode } from '../../src/lib/server/theme';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false }
};

export default async function CheckoutPage() {
  const darkMode = await getServerDarkMode();

  return (
    <main className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A] text-stone-200' : 'bg-[#FAFAF9] text-stone-950'}`}>
      <ArchitecturalHeaderServer darkMode={darkMode} />
      <RouteClientProviders>
        <CheckoutPageIsland />
      </RouteClientProviders>
      <FooterServer darkMode={darkMode} />
    </main>
  );
}
