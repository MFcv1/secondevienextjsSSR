import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdtemp, readFile } from 'node:fs/promises';
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

test.beforeAll(async () => {
    const output = await mkdtemp(path.join(tmpdir(), 'sv-payment-ui-'));
    const mock = path.join(directory, 'payment-ui-provider.jsx');
    await new Promise((resolve, reject) => webpack({
        mode: 'development', context: root, entry: path.join(directory, 'payment-ui-entry.jsx'),
        output: { path: output, filename: 'bundle.js' }, devtool: false,
        resolve: { extensions: ['.js', '.jsx'], alias: {
            '@stripe/react-stripe-js': mock, 'firebase/firestore': mock, 'firebase/functions': mock,
            '../config/stripe': mock, '../config/firebase': mock, '../config/functionTargets': mock,
            '../config/firebaseLazy': mock,
            './commerceV2Client': mock,
        } },
        module: { rules: [{ test: /\.jsx$/, exclude: /node_modules/, use: path.join(directory, 'payment-ui-loader.cjs') }] },
    }, (error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString('errors-only'))) : resolve()));
    const bundle = await readFile(path.join(output, 'bundle.js'));
    server = createServer((req, res) => {
        res.setHeader('content-type', req.url === '/bundle.js' ? 'application/javascript; charset=utf-8' : 'text/html; charset=utf-8');
        res.end(req.url === '/bundle.js' ? bundle : '<!doctype html><html><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { if (server) await new Promise((resolve) => server.close(resolve)); });
test.beforeEach(async ({ context, page }) => {
    page.on('pageerror', (error) => { throw error; });
    await context.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin);
});

test('card and wallet share one submission; bank challenge stays mounted; durable paid gates success', async ({ page }) => {
    await page.getByRole('button', { name: /Payer/ }).click();
    await expect(page.getByRole('button', { name: /Revenir au récapitulatif/ })).toBeDisabled();
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.querySelector('[data-testid="elements"] button').click());
    expect(await page.evaluate(() => [window.calls, window.mounts, window.unmounts, window.closedCount])).toEqual([1, 1, 0, 0]);
    await page.evaluate(() => window.resolveStripe({ paymentIntent: { id: 'pi_local', status: 'processing' } }));
    await expect(page.getByText('Paiement en cours de vérification', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => window.successes)).toBe(0);
    await page.evaluate(() => window.paid());
    await expect.poll(() => page.evaluate(() => window.successes)).toBe(1);
});

test('known refusal allows retry on same mounted form; unknown result offers bounded verification', async ({ page }) => {
    await page.clock.install();
    await page.getByRole('button', { name: /Payer/ }).click();
    await page.evaluate(() => window.resolveStripe({ error: { type: 'card_error', message: 'Carte refusée simulée' } }));
    await expect(page.getByText('Carte refusée simulée')).toBeVisible();
    await page.getByRole('button', { name: /Payer/ }).click();
    expect(await page.evaluate(() => [window.calls, window.mounts])).toEqual([2, 1]);
    await page.evaluate(() => window.rejectStripe(new Error('Simulated network loss')));
    await page.clock.fastForward(46000);
    await expect(page.getByRole('button', { name: 'Vérifier à nouveau' })).toBeVisible();
    expect(await page.evaluate(() => window.successes)).toBe(0);
    await page.getByRole('button', { name: 'Vérifier à nouveau' }).click();
    await page.evaluate(() => window.paid());
    await expect.poll(() => page.evaluate(() => window.successes)).toBe(1);
});

test('two tabs and reload preserve the request identity before any response', async ({ page, context }) => {
    const second = await context.newPage();
    await second.goto(origin);
    await expect(page.getByRole('button', { name: /Payer/ })).toBeVisible();
    await expect(second.getByRole('button', { name: /Payer/ })).toBeVisible();
    const [left, right] = await Promise.all([page.evaluate(() => window.requestIdentity()), second.evaluate(() => window.requestIdentity())]);
    expect(left).toBe(right);
    await page.reload();
    await expect(page.getByRole('button', { name: /Payer/ })).toBeVisible();
    expect(await page.evaluate(() => window.requestIdentity())).toBe(left);
});

test('cancellation requires explicit choice and restores focus; Escape keeps the reservation', async ({ page }) => {
    await page.goto(`${origin}/?confirmation`);
    const exit = page.getByRole('button', { name: 'Sortir de la réservation' });
    await exit.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(exit).toBeFocused();
    expect(await page.evaluate(() => window.cancelConfirmed)).toBe(false);
    await exit.click();
    await page.getByRole('button', { name: 'Annuler et retourner à la galerie' }).click();
    expect(await page.evaluate(() => window.cancelConfirmed)).toBe(true);
});
