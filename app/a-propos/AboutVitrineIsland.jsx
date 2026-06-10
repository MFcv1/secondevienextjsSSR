'use client';

import HomeView from '../../src/vitrine/HomeView';

export default function AboutVitrineIsland() {
  const enterMarketplace = () => {
    window.location.assign('/galerie');
  };

  return (
    <HomeView
      darkMode={false}
      onEnterMarketplace={enterMarketplace}
      onStartMarketplaceTransition={() => {}}
      onOpenDiscovery={enterMarketplace}
    />
  );
}
