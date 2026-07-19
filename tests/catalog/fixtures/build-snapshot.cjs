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
    images: [],
    imageVariants: [],
    imageMetadata: []
  }
];

module.exports = {
  revision: 'ci-build-fixture',
  full,
  cards: full.map((product) => ({ ...product }))
};
