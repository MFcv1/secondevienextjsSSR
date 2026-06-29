import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getProductDisplayImageSrc, getProductImageItems } from '../src/utils/imageUtils.js';
import { getProductUrl } from '../src/utils/slug.js';

const DEFAULT_PROJECT_ID = 'secondevienextjsssr';
const DEFAULT_SITE_URL = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';

const argv = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  const [key, inlineValue] = arg.slice(2).split('=');
  const value = inlineValue ?? process.argv[index + 1];
  argv.set(key, value === undefined || value.startsWith('--') ? true : value);
  if (inlineValue === undefined && value && !value.startsWith('--')) index += 1;
}

const projectId = String(argv.get('project') || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID);
const siteUrl = String(argv.get('url') || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
const category = String(argv.get('category') || '').trim();
const limit = Math.max(1, Number(argv.get('limit') || 20));
const browserLimit = Math.max(0, Number(argv.get('browser-limit') || 6));
const includeBrowser = argv.has('browser');
const shouldAssert = argv.has('assert');
const outDir = path.resolve(String(argv.get('out') || 'logs/product-detail-image-cold-audit'));

const nowStamp = () => new Date().toISOString().replace(/[:.]/g, '-');

const publicCatalogUrl = () => {
  const params = new URLSearchParams({ scope: 'cards', limit: String(category ? Math.max(limit, 120) : limit) });
  return `https://us-central1-${projectId}.cloudfunctions.net/publicCatalog?${params.toString()}`;
};

const shortUrl = (url) => {
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.split('/').pop() || parsed.pathname);
  } catch {
    return String(url).slice(0, 160);
  }
};

const getVariant = (url) => (String(url).match(/_(thumb|card|detailFast|medium|large|full)_/i) || [null, 'unknown'])[1].toLowerCase();

const getProductsFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.products)) return payload.products;
  if (payload?.collections && typeof payload.collections === 'object') {
    return Object.values(payload.collections).flatMap((value) => Array.isArray(value) ? value : []);
  }
  return [];
};

const getPrimaryDetailImage = (product) => {
  const [primary] = getProductImageItems(product);
  const src = getProductDisplayImageSrc(primary, { viewport: 'desktop' })
    || primary?.medium
    || primary?.large
    || primary?.src
    || primary?.card
    || primary?.thumb
    || '';

  return {
    src,
    variant: getVariant(src),
    width: primary?.metadata?.width || 0,
    height: primary?.metadata?.height || 0,
    ratio: primary?.metadata?.ratio || null,
  };
};

const fetchCatalog = async () => {
  const response = await fetch(publicCatalogUrl(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`publicCatalog failed: ${response.status} ${response.statusText}`);
  }
  return getProductsFromPayload(await response.json());
};

const measureFetch = async (src) => {
  if (!src) return null;
  const startedAt = performance.now();
  const response = await fetch(src, { cache: 'no-store' });
  const buffer = await response.arrayBuffer().catch(() => new ArrayBuffer(0));
  const durationMs = Math.round(performance.now() - startedAt);
  const contentLength = Number(response.headers.get('content-length') || 0);
  return {
    status: response.status,
    ok: response.ok,
    durationMs,
    bytes: contentLength || buffer.byteLength || 0,
    kb: Math.round((contentLength || buffer.byteLength || 0) / 1024),
    contentType: response.headers.get('content-type') || '',
    cacheControl: response.headers.get('cache-control') || '',
  };
};

const createBrowserContext = async (browser) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'fr-FR',
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  return { context, page };
};

const measureBrowserDirect = async (browser, product) => {
  const { context, page } = await createBrowserContext(browser);
  const productUrl = getProductUrl(product, siteUrl);
  const startedAt = performance.now();
  try {
    const response = await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => {
      const image = Array.from(document.querySelectorAll('[data-product-main-image="true"]'))
        .find((node) => {
          const rect = node.getBoundingClientRect();
          return rect.width > 150 && rect.height > 150;
        });
      return Boolean(image?.complete && image.naturalWidth > 0);
    }, null, { timeout: 30000 });

    const image = await page.evaluate(() => {
      const node = Array.from(document.querySelectorAll('[data-product-main-image="true"]'))
        .find((candidate) => {
          const rect = candidate.getBoundingClientRect();
          return rect.width > 150 && rect.height > 150;
        });
      return node ? {
        src: node.currentSrc || node.src || '',
        complete: node.complete,
        naturalWidth: node.naturalWidth || 0,
        naturalHeight: node.naturalHeight || 0,
      } : null;
    });

    return {
      ok: Boolean(response?.ok()),
      status: response?.status() || 0,
      imageReadyMs: Math.round(performance.now() - startedAt),
      image: image ? { ...image, shortSrc: shortUrl(image.src) } : null,
      url: productUrl,
    };
  } finally {
    await context.close();
  }
};

await fs.mkdir(outDir, { recursive: true });

const normalizeCategory = (value) => String(value || '').trim().toLowerCase();

const products = (await fetchCatalog())
  .filter((product) => !category || normalizeCategory(product.category) === normalizeCategory(category))
  .slice(0, limit);
const rows = [];

for (const product of products) {
  const detail = getPrimaryDetailImage(product);
  if (!/^https?:\/\//i.test(detail.src)) continue;
  const fetchMetric = await measureFetch(detail.src);
  rows.push({
    id: product.id || '',
    title: product.name || product.title || 'Produit',
    productUrl: getProductUrl(product, siteUrl),
    detail,
    fetch: fetchMetric,
    browser: null,
  });
}

if (includeBrowser && rows.length) {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const row of rows.slice(0, browserLimit)) {
      row.browser = await measureBrowserDirect(browser, {
        id: row.id,
        name: row.title,
        title: row.title,
      });
    }
  } finally {
    await browser.close();
  }
}

rows.sort((a, b) => {
  const browserDelta = (b.browser?.imageReadyMs || 0) - (a.browser?.imageReadyMs || 0);
  if (browserDelta) return browserDelta;
  return (b.fetch?.durationMs || 0) - (a.fetch?.durationMs || 0);
});

const summary = {
  generatedAt: new Date().toISOString(),
  projectId,
  siteUrl,
  category,
  limit,
  includeBrowser,
  browserLimit,
  rows,
  slowest: rows.slice(0, 10).map((row) => ({
    id: row.id,
    title: row.title,
    variant: row.detail.variant,
    kb: row.fetch?.kb || 0,
    fetchMs: row.fetch?.durationMs || 0,
    browserReadyMs: row.browser?.imageReadyMs || null,
    width: row.detail.width,
    height: row.detail.height,
    image: shortUrl(row.detail.src),
    cacheControl: row.fetch?.cacheControl || '',
  })),
};

const summaryPath = path.join(outDir, `${nowStamp()}-summary.json`);
await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  summaryPath,
  catalogCount: products.length,
  slowest: summary.slowest,
}, null, 2));

if (shouldAssert) {
  const failed = rows.filter((row) => !row.fetch?.ok || !row.detail.src);
  if (failed.length) {
    console.error(`Cold image audit failed: ${failed.length} image(s) missing or not fetchable.`);
    process.exit(1);
  }
}
