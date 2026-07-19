const full = [
  {
    id: 'ci-mirror',
    collectionName: 'furniture',
    status: 'published',
    name: 'Miroir de validation CI',
    description: 'Fixture locale reservee au build sans identifiants cloud.',
    category: 'miroirs',
    material: 'Bois',
    stock: 1,
    sold: false,
    currentPrice: 120,
    seoIndexable: true,
    createdAt: { seconds: 300, nanoseconds: 0 },
    updatedAt: { seconds: 301, nanoseconds: 0 },
    images: ['https://example.test/ci-mirror.webp'],
    imageVariants: [{
      thumb320: 'https://example.test/ci-mirror-320.webp',
      thumb384: 'https://example.test/ci-mirror-384.webp',
      card: 'https://example.test/ci-mirror-card.webp',
      detailFast: 'https://example.test/ci-mirror-detail.webp',
      full: 'https://example.test/ci-mirror-full.webp'
    }],
    imageMetadata: [{
      width: 768,
      height: 1024,
      ratio: 0.75,
      dominantColor: '#d8cec1',
      blurDataUrl: 'data:image/webp;base64,fixture'
    }]
  }
];

module.exports = {
  revision: 1,
  catalogVersion: 1,
  aggregateSha256: 'c'.repeat(64),
  generatedAt: '2026-07-19T00:00:00.000Z',
  full,
  cards: full.map((product) => ({ ...product }))
};
