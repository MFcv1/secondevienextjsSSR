const baseUrl = process.env.NEXT_SSR_CHECK_BASE_URL || 'http://127.0.0.1:3000';

const required = [
  ['product article', /data-ssr-product/],
  ['h1', /<h1[^>]*>[^<]+<\/h1>/i],
  ['json ld', /application\/ld\+json/],
  ['og title', /property="og:title"|name="og:title"/],
  ['description meta', /name="description"/],
  ['image', /<img[^>]+(?:src|srcset)=/i]
];

const getFirstProductPath = async () => {
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
  const slugBase = String(product.title || product.name || 'produit')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'produit';

  return `/produit/${slugBase}-${encodeURIComponent(product.id)}`;
};

const main = async () => {
  const path = process.argv[2] || await getFirstProductPath();
  const url = new URL(path, baseUrl);
  const response = await fetch(url);
  const html = await response.text();

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  const missing = required
    .filter(([, pattern]) => !pattern.test(html))
    .map(([label]) => label);

  if (missing.length) {
    throw new Error(`Missing SSR evidence for ${url}: ${missing.join(', ')}`);
  }

  console.log(`SSR product check passed: ${url}`);
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
