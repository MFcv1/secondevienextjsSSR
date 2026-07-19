import ArchitecturalHeaderServer from '../../src/kit/marketplace/ArchitecturalHeaderServer';
import FooterServer from '../../src/kit/marketplace/FooterServer';
import SearchResultsIsland from '../../src/kit/marketplace/SearchResultsIsland';
import CatalogVersionSyncIsland from '../../src/kit/marketplace/CatalogVersionSyncIsland';
import { getMaterializedCatalogSnapshot } from '../../src/lib/server/materializedCatalog';

export const revalidate = 300;

export const metadata = {
  title: 'Recherche catalogue',
  description: 'Recherche dans les pieces de mobilier ancien restaure Seconde Vie.',
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchRoutePage() {
  const darkMode = false;
  const snapshot = await getMaterializedCatalogSnapshot();

  return (
    <main
      className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A] text-stone-200' : 'bg-[#FAFAF9] text-stone-950'}`}
      data-catalog-revision={snapshot.revision}
      data-catalog-version={snapshot.aggregateSha256}
    >
      <ArchitecturalHeaderServer darkMode={darkMode} />
      <SearchResultsIsland />
      <FooterServer darkMode={darkMode} />
      <CatalogVersionSyncIsland
        revision={snapshot.revision}
        aggregateSha256={snapshot.aggregateSha256}
        routeKind="search"
      />
    </main>
  );
}
