const baseUrl = process.env.NEXT_SSR_CHECK_BASE_URL || 'http://127.0.0.1:3000';

const commonRequired = [
  ['h1', /<h1[^>]*>[\s\S]*?<\/h1>/i],
  ['canonical', /rel="canonical"/i],
  ['json ld', /application\/ld\+json/],
  ['og title', /property="og:title"|name="og:title"/],
  ['twitter card', /name="twitter:card"/],
  ['description meta', /name="description"/]
];

const routeChecks = [
  {
    label: 'home',
    path: '/',
    required: [
      ['home section', /data-ssr-home/],
      ['image', /<img[^>]+(?:src|srcset)=/i],
      ['no google fonts css', (html) => !/fonts\.googleapis\.com/i.test(html)]
    ]
  },
  {
    label: 'about',
    path: '/a-propos',
    required: [
      ['about article', /data-ssr-about/],
      ['image', /<img[^>]+(?:src|srcset)=/i],
      ['no client app fallback marker hidden before hydration', (html) => !/data-sv-client-hydrated/i.test(html)]
    ]
  }
];

const slugify = (value) => String(value || 'produit')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-{2,}/g, '-') || 'produit';

const getFirstPublishedProduct = async () => {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_APP_LOGICAL_NAME || 'secondevie';
  if (!projectId) throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing.');

  let product = null;

  const catalogResponse = await fetch(`https://us-central1-${projectId}.cloudfunctions.net/publicCatalog?scope=cards&limit=1`);
  if (catalogResponse.ok) {
    const payload = await catalogResponse.json();
    product = payload?.collections?.furniture?.[0] || null;
  }

  if (!product && apiKey) {
    const restResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'furniture' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'status' },
              op: 'EQUAL',
              value: { stringValue: 'published' }
            }
          },
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit: 1
        },
        parent: `projects/${projectId}/databases/(default)/documents/artifacts/${appId}/public/data`
      })
    });
    if (restResponse.ok) {
      const rows = await restResponse.json();
      const document = rows.find((row) => row.document)?.document;
      if (document?.fields) {
        product = {
          id: String(document.name || '').split('/').pop(),
          name: document.fields.name?.stringValue,
          title: document.fields.title?.stringValue
        };
      }
    }
  }

  if (!product?.id) {
    for (const id of ['KrTETXPknYNwgak66T8p', 'neZsnYoiX5NswNyLazMD']) {
      const directResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/artifacts/${appId}/public/data/furniture/${id}?key=${encodeURIComponent(apiKey)}`);
      if (!directResponse.ok) continue;
      const document = await directResponse.json();
      if (document.fields?.status?.stringValue === 'published' || id === 'KrTETXPknYNwgak66T8p') {
        product = {
          id,
          name: document.fields?.name?.stringValue,
          title: document.fields?.title?.stringValue
        };
        break;
      }
    }
  }

  if (!product?.id) throw new Error('No published product returned by public catalog or direct Firestore fallback.');
  return product;
};

const getProductPath = (product) => `/produit/${slugify(product.title || product.name)}-${encodeURIComponent(product.id)}`;

const CATEGORY_ROUTE_ALIASES = {
  mobilier: 'meubles',
  furniture: 'meubles',
  assise: 'assises',
  decoration: 'decorations',
  'décoration': 'decorations'
};

const INDEXABLE_CATEGORY_IDS = new Set([
  'meubles',
  'assises',
  'eclairage',
  'decorations',
  'armoires',
  'buffets',
  'commodes',
  'tables',
  'chaises',
  'fauteuils',
  'bancs',
  'miroirs',
  'deco'
]);

const getCategoryPath = (product) => {
  const rawCategory = typeof product?.category === 'string' && product.category.trim()
    ? product.category.trim().toLowerCase()
    : 'buffets';
  const category = CATEGORY_ROUTE_ALIASES[rawCategory] || rawCategory;
  if (!INDEXABLE_CATEGORY_IDS.has(category)) return '/categorie/buffets';
  return `/categorie/${encodeURIComponent(category)}`;
};

const matchesRequirement = (html, requirement) => {
  const [, pattern] = requirement;
  if (typeof pattern === 'function') return pattern(html);
  return pattern.test(html);
};

const assertRoute = async ({ label, path, required = [] }) => {
  const url = new URL(path, baseUrl);
  const response = await fetch(url);
  const html = await response.text();

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  const missing = [...commonRequired, ...required]
    .filter((requirement) => !matchesRequirement(html, requirement))
    .map(([requirementLabel]) => requirementLabel);

  if (missing.length) {
    throw new Error(`Missing SSR evidence for ${label} ${url}: ${missing.join(', ')}`);
  }

  return url;
};

const main = async () => {
  const product = await getFirstPublishedProduct();
  const requestedProductPath = process.argv[2];
  const checks = [
    ...routeChecks,
    {
      label: 'product',
      path: requestedProductPath || getProductPath(product),
      required: [
        ['product article', /data-ssr-product/],
        ['product json ld', /"@type":"Product"|"@type":\s*"Product"/],
        ['image', /<img[^>]+(?:src|srcset)=/i]
      ]
    },
    {
      label: 'category',
      path: getCategoryPath(product),
      required: [
        ['category section', /data-ssr-category/],
        ['collection json ld', /"@type":"CollectionPage"|"@type":\s*"CollectionPage"/],
        ['product links', /href="\/produit\//]
      ]
    }
  ];

  const urls = [];
  for (const check of checks) {
    urls.push(await assertRoute(check));
  }

  console.log(`SSR public checks passed:\n${urls.map((url) => `- ${url}`).join('\n')}`);
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
