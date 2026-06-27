const routes = [
  { label: 'root-gallery', spa: '/', next: '/' },
  { label: 'category', spa: '/categorie/buffets', next: '/categorie/buffets' },
  {
    label: 'product',
    spa: '/produit/buffet-KrTETXPknYNwgak66T8p',
    next: '/produit/buffet-KrTETXPknYNwgak66T8p'
  }
];

const getHtmlStats = async (baseUrl, path) => {
  const startedAt = performance.now();
  const response = await fetch(new URL(path, baseUrl));
  const html = await response.text();
  const elapsedMs = Math.round(performance.now() - startedAt);
  return {
    status: response.status,
    elapsedMs,
    htmlBytes: Buffer.byteLength(html),
    hasProductJsonLd: html.includes('application/ld+json') && html.includes('"@type":"Product"'),
    hasProductHeading: /<h1[^>]*>[^<]+<\/h1>/i.test(html),
    hasProductArticle: html.includes('data-ssr-product'),
    hasClientShell: html.includes('__next') || html.includes('id="root"')
  };
};

const main = async () => {
  const spaBaseUrl = process.env.SPA_BASE_URL || 'http://127.0.0.1:4173';
  const nextBaseUrl = process.env.NEXT_BASE_URL || 'http://127.0.0.1:3000';
  const results = [];

  for (const route of routes) {
    results.push({
      route: route.label,
      spa: await getHtmlStats(spaBaseUrl, route.spa).catch((error) => ({ error: error.message })),
      next: await getHtmlStats(nextBaseUrl, route.next).catch((error) => ({ error: error.message }))
    });
  }

  console.table(results.map((entry) => ({
    route: entry.route,
    spaStatus: entry.spa.status || entry.spa.error,
    spaHtmlBytes: entry.spa.htmlBytes || '',
    nextStatus: entry.next.status || entry.next.error,
    nextHtmlBytes: entry.next.htmlBytes || '',
    spaProductHeading: entry.spa.hasProductHeading || false,
    nextProductHeading: entry.next.hasProductHeading || false,
    nextProductJsonLd: entry.next.hasProductJsonLd || false,
    nextProductArticle: entry.next.hasProductArticle || false
  })));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
