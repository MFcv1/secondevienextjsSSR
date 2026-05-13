import { chromium } from '@playwright/test';

const spaBaseUrl = process.env.SPA_BASE_URL || 'http://127.0.0.1:4173';
const nextBaseUrl = process.env.NEXT_BASE_URL || 'http://127.0.0.1:3000';

const routes = [
  { label: 'home', path: '/' },
  { label: 'category', path: '/categorie/buffets' },
  { label: 'product', path: '/produit/buffet-KrTETXPknYNwgak66T8p' }
];

const profiles = [
  { label: 'desktop', viewport: { width: 1440, height: 950 }, isMobile: false, hasTouch: false },
  { label: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
];

const vitalsProbe = `
(() => {
  window.__svVitals = { lcpMs: 0, cls: 0, longTasks: 0, maxLongTaskMs: 0 };
  const observe = (type, callback) => {
    try {
      if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) callback(entry);
      }).observe({ type, buffered: true });
    } catch (_) {}
  };
  observe('largest-contentful-paint', (entry) => {
    window.__svVitals.lcpMs = Math.round(entry.startTime);
  });
  observe('layout-shift', (entry) => {
    if (!entry.hadRecentInput) {
      window.__svVitals.cls = Number((window.__svVitals.cls + entry.value).toFixed(4));
    }
  });
  observe('longtask', (entry) => {
    window.__svVitals.longTasks += 1;
    window.__svVitals.maxLongTaskMs = Math.max(window.__svVitals.maxLongTaskMs, Math.round(entry.duration || 0));
  });
})();
`;

const classify = (url, resourceType) => {
  const lower = url.toLowerCase();
  if (resourceType === 'script' || lower.endsWith('.js')) return 'js';
  if (
    resourceType === 'image' ||
    /\.(avif|webp|png|jpe?g|gif|svg)(\?|$)/i.test(lower) ||
    lower.includes('firebasestorage.googleapis.com')
  ) {
    return 'image';
  }
  if (resourceType === 'stylesheet' || lower.endsWith('.css')) return 'css';
  return 'other';
};

const measure = async ({ baseUrl, appLabel, route, profile }) => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: profile.viewport,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    deviceScaleFactor: profile.isMobile ? 3 : 1
  });
  const page = await context.newPage();
  const responses = [];
  const consoleIssues = [];

  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      consoleIssues.push(`${message.type()}: ${message.text().slice(0, 160)}`);
    }
  });

  page.on('response', async (response) => {
    const request = response.request();
    let bytes = Number(response.headers()['content-length'] || 0);
    if (!bytes) {
      try {
        bytes = (await response.body()).byteLength;
      } catch {
        bytes = 0;
      }
    }
    responses.push({
      url: response.url(),
      status: response.status(),
      type: classify(response.url(), request.resourceType()),
      bytes
    });
  });

  await page.addInitScript(vitalsProbe);

  const startedAt = performance.now();
  const response = await page.goto(new URL(route.path, baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 45_000
  });
  await page.waitForTimeout(route.label === 'product' ? 3500 : 3000);
  const elapsedMs = Math.round(performance.now() - startedAt);
  const vitals = await page.evaluate('window.__svVitals || {}');
  const title = await page.title();
  const html = await page.content();
  await browser.close();

  const bytesFor = (type) => responses
    .filter((entry) => entry.type === type)
    .reduce((sum, entry) => sum + entry.bytes, 0);

  return {
    app: appLabel,
    profile: profile.label,
    route: route.label,
    status: response?.status() || 0,
    elapsedMs,
    requestCount: responses.length,
    totalBytes: responses.reduce((sum, entry) => sum + entry.bytes, 0),
    jsBytes: bytesFor('js'),
    imageBytes: bytesFor('image'),
    cssBytes: bytesFor('css'),
    lcpMs: vitals.lcpMs || 0,
    cls: vitals.cls || 0,
    longTasks: vitals.longTasks || 0,
    maxLongTaskMs: vitals.maxLongTaskMs || 0,
    hasProductJsonLd: html.includes('application/ld+json') && html.includes('"@type":"Product"'),
    hasSsrProduct: html.includes('data-ssr-product'),
    title,
    consoleIssues: consoleIssues.slice(0, 5)
  };
};

const main = async () => {
  const results = [];
  for (const profile of profiles) {
    for (const route of routes) {
      results.push(await measure({ baseUrl: spaBaseUrl, appLabel: 'spa', route, profile }));
      results.push(await measure({ baseUrl: nextBaseUrl, appLabel: 'next', route, profile }));
    }
  }

  console.table(results.map((entry) => ({
    app: entry.app,
    profile: entry.profile,
    route: entry.route,
    status: entry.status,
    requests: entry.requestCount,
    totalKB: Math.round(entry.totalBytes / 1024),
    jsKB: Math.round(entry.jsBytes / 1024),
    imageKB: Math.round(entry.imageBytes / 1024),
    lcpMs: entry.lcpMs,
    cls: entry.cls,
    longTasks: entry.longTasks,
    productJsonLd: entry.hasProductJsonLd,
    ssrProduct: entry.hasSsrProduct
  })));

  const failures = results
    .filter((entry) => entry.status < 200 || entry.status >= 400)
    .map((entry) => `${entry.app}/${entry.profile}/${entry.route} returned ${entry.status}`);

  if (failures.length) {
    throw new Error(failures.join('\n'));
  }
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
