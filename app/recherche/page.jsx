import ArchitecturalHeaderServer from '../../src/kit/marketplace/ArchitecturalHeaderServer';
import FooterServer from '../../src/kit/marketplace/FooterServer';
import SearchResultsIsland from '../../src/kit/marketplace/SearchResultsIsland';

export const revalidate = 300;

export const metadata = {
  title: 'Recherche catalogue',
  description: 'Recherche dans les pieces de mobilier ancien restaure Seconde Vie.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchRoutePage() {
  const darkMode = false;

  return (
    <main className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A] text-stone-200' : 'bg-[#FAFAF9] text-stone-950'}`}>
      <ArchitecturalHeaderServer darkMode={darkMode} />
      <SearchResultsIsland />
      <FooterServer darkMode={darkMode} />
    </main>
  );
}
