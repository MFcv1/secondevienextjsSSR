import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { webpack } = require('next/dist/compiled/webpack/webpack');
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../..');
let server;
let origin;
let output;

test.beforeAll(async () => {
  output = await mkdtemp(path.join(tmpdir(), 'sv-cart-ui-'));
  await new Promise((resolve, reject) => webpack({
    mode: 'development', context: root, entry: path.join(directory, 'cart-ui-entry.jsx'),
    output: { path: output, filename: 'bundle.js' }, devtool: false,
    resolve: { extensions: ['.js', '.jsx'] },
    plugins: [{ apply(compiler) {
      compiler.hooks.compilation.tap('CartFixture', (compilation) => {
        compiler.webpack.NormalModule.getCompilationHooks(compilation).loader.tap('CartFixture', (context) => {
          context.currentTraceSpan = require('next/dist/trace').trace('cart-fixture');
        });
      });
    } }],
    module: { rules: [
      { test: /\.jsx$/, exclude: /node_modules/, use: path.join(directory, 'payment-ui-loader.cjs') },
      { test: /\.css$/, use: [
        require.resolve('next/dist/build/webpack/loaders/next-style-loader'),
        { loader: require.resolve('next/dist/build/webpack/loaders/css-loader/src'), options: {
          modules: { mode: 'pure', exportLocalsConvention: 'asIs', getLocalIdent: require('next/dist/build/webpack/config/blocks/css/loaders/getCssModuleLocalIdent').getCssModuleLocalIdent },
          postcss: async () => ({ postcss: require('postcss') }),
        } },
      ] },
    ] },
  }, (error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString('errors-only'))) : resolve()));
  const bundle = await readFile(path.join(output, 'bundle.js'));
  server = createServer(async (req, res) => {
    const asset = /^\/images\/categories\/[a-z-]+\.webp$/.test(req.url);
    res.setHeader('content-type', asset ? 'image/webp' : req.url === '/bundle.js' ? 'application/javascript; charset=utf-8' : 'text/html; charset=utf-8');
    if (asset) {
      try { res.end(await readFile(path.join(root, 'public', req.url))); } catch { res.writeHead(404); res.end(); }
      return;
    }
    res.end(req.url === '/bundle.js' ? bundle : '<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}*{box-sizing:border-box}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (output) await rm(output, { recursive: true, force: true });
});
test.beforeEach(async ({ context, page }) => {
  page.on('pageerror', (error) => { throw error; });
  await context.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto(origin);
});

test('full viewport, bounded overflow, keyboard containment and restored focus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Panier', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
  for (const width of [320, 390, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await dialog.boundingBox()).toEqual({ x: 0, y: 0, width, height: 900 });
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((el) => el.contains(document.activeElement) || document.activeElement === document.body)).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('quantity totals, removal, empty cart and checkout callback', async ({ page }) => {
  await page.getByRole('button', { name: 'Panier', exact: true }).click();
  await expect(page.getByLabel('1 030,00 €', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Retirer Chaise de bistrot du panier' }).click();
  await expect(page.getByLabel('780,00 €', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Retirer Buffet/ }).click();
  await expect(page.getByRole('heading', { name: /Une place pour/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Valider la commande' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button', { name: 'Panier', exact: true }).click();
  await page.getByRole('button', { name: 'Valider la commande' }).first().click();
  await expect(page.getByRole('status')).toHaveText('Checkout reçu');
});

test('failed removal preserves the line and exposes a retry', async ({ page }) => {
  await page.goto(`${origin}/?fail`);
  await page.getByRole('button', { name: 'Panier', exact: true }).click();
  const remove = page.getByRole('button', { name: /Retirer Buffet/ });
  await remove.click();
  await expect(page.getByRole('alert')).toContainText('n’a pas pu être retirée');
  await expect(remove).toBeEnabled();
  await expect(page.getByLabel('1 030,00 €', { exact: true })).toBeVisible();
});

test('scroll reveals, dark theme and reduced motion remain readable', async ({ page }, testInfo) => {
  await page.goto(`${origin}/?dark`);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Panier', exact: true }).click();
  expect(await page.getByRole('dialog').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(18, 17, 16)');
  expect(await page.locator('[aria-label="1 030,00 €"] span span span').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  await page.screenshot({ path: testInfo.outputPath('cart-dark.png') });
  await page.goto(origin);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Panier', exact: true }).click();
  await expect(page.locator('[data-reveal]').first()).toHaveAttribute('data-reveal', 'visible');
  await page.screenshot({ path: testInfo.outputPath('cart-light.png'), animations: 'disabled' });
  const recap = page.getByRole('region', { name: 'Récapitulatif du panier' });
  await recap.scrollIntoViewIfNeeded();
  await expect(recap.locator('..')).toHaveAttribute('data-reveal', 'visible');
  await expect(recap).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('cart-summary.png'), animations: 'disabled' });
});
