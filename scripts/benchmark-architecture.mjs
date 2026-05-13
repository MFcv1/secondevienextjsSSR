import { chromium } from '@playwright/test';

const DEFAULT_SPA_BASE_URL = 'https://secondeviesandbox.web.app';
const DEFAULT_NEXT_BASE_URL = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';
const DEFAULT_PRODUCT_PATH = '/produit/buffet-KrTETXPknYNwgak66T8p';

const spaBaseUrl = process.env.SPA_BASE_URL || DEFAULT_SPA_BASE_URL;
const nextBaseUrl = process.env.NEXT_BASE_URL || DEFAULT_NEXT_BASE_URL;
const productPath = normalizeRoutePath(
  process.env.COLD_PRODUCT_PATH || process.env.PRODUCT_PATH || DEFAULT_PRODUCT_PATH
);

function normalizeRoutePath(value) {
  const routePath = String(value || '').trim();
  if (!routePath) return DEFAULT_PRODUCT_PATH;

  try {
    const url = new URL(routePath);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return routePath.startsWith('/') ? routePath : `/${routePath}`;
  }
}

const routes = [
  { label: 'home', path: '/', scroll: true },
  { label: 'category', path: '/categorie/buffets', scroll: true },
  { label: 'product', path: productPath, scroll: false }
];

const desktop = { width: 1440, height: 950 };

const vitalsProbe = `
(() => {
  window.__svArchVitals = {
    lcpMs: 0,
    cls: 0,
    longTasks: 0,
    maxLongTaskMs: 0
  };

  const observe = (type, callback) => {
    try {
      if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) callback(entry);
      }).observe({ type, buffered: true });
    } catch (_) {}
  };

  observe('largest-contentful-paint', (entry) => {
    window.__svArchVitals.lcpMs = Math.round(entry.startTime);
  });

  observe('layout-shift', (entry) => {
    if (!entry.hadRecentInput) {
      window.__svArchVitals.cls = Number((window.__svArchVitals.cls + entry.value).toFixed(4));
    }
  });

  observe('longtask', (entry) => {
    window.__svArchVitals.longTasks += 1;
    window.__svArchVitals.maxLongTaskMs = Math.max(
      window.__svArchVitals.maxLongTaskMs,
      Math.round(entry.duration || 0)
    );
  });
})();
`;

const classify = (url, resourceType) => {
  const lower = url.toLowerCase();
  if (resourceType === 'script' || lower.endsWith('.js')) return 'js';
  if (resourceType === 'stylesheet' || lower.endsWith('.css')) return 'css';
  if (
    resourceType === 'image' ||
    /\.(avif|webp|png|jpe?g|gif|svg)(\?|$)/i.test(lower) ||
    lower.includes('firebasestorage.googleapis.com') ||
    lower.includes('firebasestorage.app')
  ) {
    return 'image';
  }
  if (lower.includes('fonts.gstatic.com') || lower.includes('fonts.googleapis.com')) return 'font';
  return 'other';
};

const htmlStats = async (baseUrl, route) => {
  const startedAt = performance.now();
  const response = await fetch(new URL(route.path, baseUrl));
  const html = await response.text();
  return {
    route: route.label,
    path: route.path,
    status: response.status,
    elapsedMs: Math.round(performance.now() - startedAt),
    htmlKB: Math.round(Buffer.byteLength(html) / 1024),
    hasH1: /<h1[^>]*>[^<]+<\/h1>/i.test(html),
    hasMetaDescription: /<meta\s+name=["']description["']/i.test(html),
    hasCanonical: /<link\s+rel=["']canonical["']/i.test(html),
    hasProductJsonLd: html.includes('application/ld+json') && html.includes('"@type":"Product"'),
    hasSsrProduct: html.includes('data-ssr-product'),
    hasRootShell: html.includes('id="root"') || html.includes('__next')
  };
};

const collectScrollProbe = async (page) => {
  await page.evaluate(() => {
    window.__svArchScroll = {
      active: true,
      previous: performance.now(),
      frameTimes: []
    };

    const tick = (now) => {
      const probe = window.__svArchScroll;
      if (!probe?.active) return;
      probe.frameTimes.push(Math.round((now - probe.previous) * 10) / 10);
      probe.previous = now;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });

  for (let index = 0; index < 22; index += 1) {
    await page.mouse.wheel(0, 420);
    await page.waitForTimeout(55);
  }

  await page.waitForTimeout(1000);

  return page.evaluate(() => {
    const probe = window.__svArchScroll || { frameTimes: [] };
    probe.active = false;
    const frames = probe.frameTimes.slice(1);
    const over50 = frames.filter((value) => value > 50);
    const over100 = frames.filter((value) => value > 100);
    return {
      frameCount: frames.length,
      avgFrameGapMs: Number((frames.reduce((sum, value) => sum + value, 0) / Math.max(1, frames.length)).toFixed(1)),
      maxFrameGapMs: Math.max(0, ...frames),
      over50msFrames: over50.length,
      over100msFrames: over100.length,
      finalScrollY: Math.round(window.scrollY),
      scrollHeight: document.documentElement.scrollHeight
    };
  });
};

const runtimeStats = async ({ baseUrl, app, route }) => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: desktop,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false
  });
  const page = await context.newPage();
  const responses = [];
  const consoleIssues = [];

  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      consoleIssues.push(`${message.type()}: ${message.text().slice(0, 180)}`);
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
  const vitals = await page.evaluate('window.__svArchVitals || {}');
  const timing = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0];
    if (!entry) return {};
    return {
      domContentLoadedMs: Math.round(entry.domContentLoadedEventEnd),
      loadEventMs: Math.round(entry.loadEventEnd)
    };
  });
  const scroll = route.scroll ? await collectScrollProbe(page) : null;
  await browser.close();

  const bytesFor = (type) => responses
    .filter((entry) => entry.type === type)
    .reduce((sum, entry) => sum + entry.bytes, 0);

  return {
    app,
    route: route.label,
    path: route.path,
    status: response?.status() || 0,
    elapsedMs,
    domContentLoadedMs: timing.domContentLoadedMs || 0,
    loadEventMs: timing.loadEventMs || 0,
    requests: responses.length,
    totalKB: Math.round(responses.reduce((sum, entry) => sum + entry.bytes, 0) / 1024),
    jsKB: Math.round(bytesFor('js') / 1024),
    imageKB: Math.round(bytesFor('image') / 1024),
    cssKB: Math.round(bytesFor('css') / 1024),
    fontKB: Math.round(bytesFor('font') / 1024),
    lcpMs: vitals.lcpMs || 0,
    cls: vitals.cls || 0,
    longTasks: vitals.longTasks || 0,
    maxLongTaskMs: vitals.maxLongTaskMs || 0,
    scroll,
    consoleIssues: consoleIssues.slice(0, 5)
  };
};

const printHtmlTable = (rows) => {
  console.log('\nHTML / SEO initial');
  console.table(rows.map((row) => ({
    app: row.app,
    route: row.route,
    path: row.path,
    status: row.status,
    htmlKB: row.htmlKB,
    hasH1: row.hasH1,
    metaDescription: row.hasMetaDescription,
    canonical: row.hasCanonical,
    productJsonLd: row.hasProductJsonLd,
    ssrProduct: row.hasSsrProduct
  })));
};

const printRuntimeTable = (rows) => {
  console.log('\nRuntime desktop 1440x950');
  console.table(rows.map((row) => ({
    app: row.app,
    route: row.route,
    path: row.path,
    status: row.status,
    requests: row.requests,
    totalKB: row.totalKB,
    jsKB: row.jsKB,
    imageKB: row.imageKB,
    lcpMs: row.lcpMs,
    cls: row.cls,
    longTasks: row.longTasks,
    maxLongTaskMs: row.maxLongTaskMs
  })));
};

const printScrollTable = (rows) => {
  console.log('\nScroll smoothness desktop');
  console.table(rows
    .filter((row) => row.scroll)
    .map((row) => ({
      app: row.app,
      route: row.route,
      path: row.path,
      maxFrameGapMs: row.scroll.maxFrameGapMs,
      over50msFrames: row.scroll.over50msFrames,
      over100msFrames: row.scroll.over100msFrames,
      finalScrollY: row.scroll.finalScrollY
    })));
};

const main = async () => {
  console.log(`SPA_BASE_URL=${spaBaseUrl}`);
  console.log(`NEXT_BASE_URL=${nextBaseUrl}`);
  console.log(`PRODUCT_PATH=${productPath}`);

  const htmlRows = [];
  for (const route of routes) {
    htmlRows.push({ app: 'spa-hosting', ...(await htmlStats(spaBaseUrl, route)) });
    htmlRows.push({ app: 'next-app-hosting', ...(await htmlStats(nextBaseUrl, route)) });
  }
  printHtmlTable(htmlRows);

  const runtimeRows = [];
  for (const route of routes) {
    const [spa, next] = await Promise.all([
      runtimeStats({ baseUrl: spaBaseUrl, app: 'spa-hosting', route }),
      runtimeStats({ baseUrl: nextBaseUrl, app: 'next-app-hosting', route })
    ]);
    runtimeRows.push(spa, next);
  }

  printRuntimeTable(runtimeRows);
  printScrollTable(runtimeRows);

  const failures = runtimeRows
    .filter((row) => row.status < 200 || row.status >= 400)
    .map((row) => `${row.app}/${row.route} returned ${row.status}`);

  if (failures.length) {
    throw new Error(failures.join('\n'));
  }
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
