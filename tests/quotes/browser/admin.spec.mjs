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
let server, origin, output;

test.beforeAll(async () => {
  output = await mkdtemp(path.join(tmpdir(), 'sv-quotes-ui-'));
  const mock = path.join(directory, 'provider.jsx');
  await new Promise((resolve, reject) => webpack({
    mode: 'development', context: root, entry: path.join(directory, 'entry.jsx'),
    output: { path: output, filename: 'bundle.js' }, devtool: false,
    resolve: { extensions: ['.js', '.jsx'], alias: { 'next/image': mock, './adminDataCache': mock, './quoteAdminClient': mock } },
    module: { rules: [{ test: /\.jsx$/, exclude: /node_modules/, use: path.join(root, 'tests/commerce/browser/payment-ui-loader.cjs') }] },
  }, (error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString('errors-only'))) : resolve()));
  const css = await require('postcss')([require('@tailwindcss/postcss')({ base: root })]).process('@import "tailwindcss" source(none); @source "../../../src/kit/admin"; @source "./entry.jsx";', { from: path.join(directory, 'fixture.css') });
  const bundle = await readFile(path.join(output, 'bundle.js'));
  server = createServer((req, res) => {
    res.setHeader('content-type', req.url === '/bundle.js' ? 'application/javascript; charset=utf-8' : 'text/html; charset=utf-8');
    res.end(req.url === '/bundle.js' ? bundle : `<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.css}</style><body style="background:#faf9f7;color:#292524"><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (output) await rm(output, { recursive: true, force: true });
});
test.beforeEach(async ({ page, context }) => {
  page.on('pageerror', error => { throw error; });
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto(origin);
});

test('photos open privately; Escape restores focus; no horizontal overflow', async ({ page }, info) => {
  const open = page.getByRole('button', { name: /Photo du meuble/ }).first();
  await open.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('quotes-layout.png'), fullPage: true });
});

test('preview saves pricing automatically; sends only after confirmation; trash can be restored', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Modifier le devis' }).click();
  await page.getByRole('spinbutton', { name: 'Prix proposé — Ponçage manuel' }).fill('80');
  await page.getByRole('button', { name: 'Ajouter une prestation' }).click();
  await page.getByRole('combobox', { name: 'Prestation à ajouter' }).selectOption('protection');
  await page.getByRole('spinbutton', { name: 'Prix proposé — Finition & protection' }).fill('35');
  await page.getByRole('textbox', { name: 'Message au client' }).fill('Je propose une finition protectrice en complément du ponçage. Le devis est de 115 €.');
  await page.getByRole('button', { name: 'Ajouter une prestation' }).click();
  await expect(page.getByRole('combobox', { name: 'Prestation à ajouter' }).locator('option[value="protection"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ajouter une prestation' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('region', { name: 'Devis à proposer' }).screenshot({ path: info.outputPath('quote-editor.png') });
  await expect(page.locator('#quote-admin-detail header')).toHaveCSS('position', 'static');
  await expect(page.getByRole('button', { name: 'Prévisualiser et envoyer' })).toBeEnabled();
  await page.getByRole('button', { name: 'Prévisualiser et envoyer' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('camille@example.test');
  await expect(dialog).toContainText('115,00');
  await expect(dialog).toContainText('finition protectrice');
  expect(await page.evaluate(() => window.actions)).toEqual(['save']);
  await dialog.getByRole('button', { name: 'Envoyer au client' }).click();
  await expect(page.getByText('Proposition envoyée au client.', { exact: true }).first()).toBeVisible();
  const sentBadge = page.locator('span').getByText('Envoyé', { exact: true }).first();
  await expect(sentBadge).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(sentBadge).toHaveCSS('border-top-width', '0px');
  expect(await page.evaluate(() => window.actions)).toEqual(['save', 'send']);
  await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await page.getByRole('button', { name: 'Mettre à la corbeille' }).click();
  await expect(page.getByRole('button', { name: 'Restaurer la demande' })).toBeVisible();
  await page.getByLabel('Filtrer les demandes par statut').selectOption('trash');
  await page.getByRole('button', { name: 'Restaurer la demande' }).click();
  expect(await page.evaluate(() => window.actions)).toEqual(['save', 'send', 'trash', 'restore']);
});

test('failed automatic save preserves draft and prevents preview and email', async ({ page }) => {
  await page.getByRole('button', { name: 'Modifier le devis' }).click();
  await page.getByRole('spinbutton', { name: 'Prix proposé — Ponçage manuel' }).fill('80');
  await page.evaluate(() => { window.failSave = true; });
  await page.getByRole('button', { name: 'Prévisualiser et envoyer' }).click();
  await expect(page.getByRole('alert')).toContainText('L’enregistrement n’a pas abouti');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Prix proposé — Ponçage manuel' })).toHaveValue('80');
  expect(await page.evaluate(() => window.actions)).toEqual(['save']);
  await page.evaluate(() => { window.failSave = false; });
  await page.getByRole('button', { name: 'Prévisualiser et envoyer' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => window.actions)).toEqual(['save', 'save']);
});

test('preparation and sending show immediate progress until each request resolves', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Modifier le devis' }).click();
  await page.getByRole('spinbutton', { name: 'Prix proposé — Ponçage manuel' }).fill('60');
  await page.getByRole('button', { name: 'Ajouter une prestation' }).click();
  const picker = page.getByRole('combobox', { name: 'Prestation à ajouter' });
  expect((await picker.boundingBox()).height).toBe(48);
  await page.evaluate(() => { window.holdAction = 'save'; });
  await page.getByRole('button', { name: 'Prévisualiser et envoyer' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Préparation de l’aperçu');
  const segment = dialog.locator('.quote-progress-segment');
  const positions = await segment.evaluate(element => {
    const animation = element.getAnimations()[0];
    animation.pause();
    animation.currentTime = 200;
    const first = getComputedStyle(element).transform;
    animation.currentTime = 800;
    const second = getComputedStyle(element).transform;
    animation.play();
    return [first, second];
  });
  expect(positions[0]).not.toBe(positions[1]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(segment).toHaveCSS('animation-name', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(dialog.getByRole('button', { name: 'Envoyer au client' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await dialog.screenshot({ path: info.outputPath('quote-progress.png') });
  await page.evaluate(() => window.releaseAction());
  await expect(dialog).toContainText('Vérifier la proposition');
  await page.evaluate(() => { window.holdAction = 'send'; });
  await dialog.getByRole('button', { name: 'Envoyer au client' }).click();
  await expect(dialog).toContainText('Envoi au client');
  expect(await page.evaluate(() => window.actions)).toEqual(['save', 'send']);
  await page.evaluate(() => window.releaseAction());
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText('Proposition envoyée au client.', { exact: true }).first()).toBeVisible();
});
