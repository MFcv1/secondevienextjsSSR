const timestamp = (seconds, nanoseconds = 0) => ({ seconds, nanoseconds });

const products = [
  {
    id: 'mirror-a',
    data: {
      status: 'published',
      name: 'Miroir A',
      description: 'Miroir ancien restaure',
      category: 'miroirs',
      material: 'Bois',
      stock: 2,
      sold: false,
      currentPrice: 120,
      createdAt: timestamp(300, 3),
      updatedAt: timestamp(301, 4),
      images: ['https://example.test/a.webp'],
      imageVariants: [{ thumb384: 'https://example.test/a-384.webp', full: 'https://example.test/a-full.webp' }],
      imageMetadata: [{ width: 384, height: 512, ratio: 0.75, dominantColor: '#fff', blurDataUrl: 'data:x' }],
      buyerId: 'must-not-leak',
      stripePaymentIntentId: 'must-not-leak',
      adminNotes: 'must-not-leak'
    }
  },
  {
    id: 'mirror-b',
    data: {
      status: 'published',
      name: 'Miroir B',
      description: 'Second miroir',
      category: 'miroirs',
      stock: 1,
      sold: false,
      startingPrice: 80,
      createdAt: timestamp(200, 2)
    }
  },
  {
    id: 'draft-c',
    data: { status: 'draft', name: 'Draft', stock: 1, currentPrice: 50, createdAt: timestamp(100, 1) }
  },
  {
    id: 'e2e-d',
    data: { status: 'published', name: 'E2E', e2eOnly: true, stock: 1, currentPrice: 20, createdAt: timestamp(50, 1) }
  }
];

module.exports = { products, timestamp };
