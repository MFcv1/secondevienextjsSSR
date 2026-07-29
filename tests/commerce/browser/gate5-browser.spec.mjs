import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

let server;
let origin;

test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    if (request.url === '/checkoutRecovery.js') {
      response.setHeader('content-type', 'text/javascript');
      response.end(await readFile(
        path.join(repositoryRoot, 'src/kit/commerce/checkoutRecovery.js'),
        'utf8'
      ));
      return;
    }
    if (request.url === '/commerceUiFlags.js') {
      response.setHeader('content-type', 'text/javascript');
      response.end(await readFile(
        path.join(repositoryRoot, 'src/kit/commerce/commerceUiFlags.js'),
        'utf8'
      ));
      return;
    }
    if (request.url === '/guestCart.js') {
      response.setHeader('content-type', 'text/javascript');
      response.end(await readFile(
        path.join(repositoryRoot, 'src/kit/commerce/guestCart.js'),
        'utf8'
      ));
      return;
    }
    response.setHeader('content-type', 'text/html');
    response.end('<!doctype html><html><body>Gate 5 browser harness</body></html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  origin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise((resolve, reject) => server.close((error) => (
    error ? reject(error) : resolve()
  )));
});

test('recovery survives reload but is rejected for another Firebase identity', async ({ page }) => {
  await page.goto(origin);
  const stored = await page.evaluate(async () => {
    const recovery = await import('/checkoutRecovery.js');
    const descriptor = recovery.createCheckoutRecoveryDescriptor({
      ownerUid: 'owner-browser-gate5',
      clientOrderId: 'client-browser-gate5',
      orderId: 'order-browser-gate5',
      cartLines: [{ cartLineId: 'cart-line-browser-gate5', cartRevision: 3 }]
    });
    recovery.writeCheckoutRecoveryDescriptor(descriptor, { enabled: true });
    return window.localStorage.getItem(recovery.CHECKOUT_RECOVERY_STORAGE_KEY);
  });
  expect(stored).not.toContain('clientSecret');
  expect(stored).not.toContain('price');

  await page.reload();
  const result = await page.evaluate(async () => {
    const recovery = await import('/checkoutRecovery.js');
    return {
      owned: recovery.readCheckoutRecoveryDescriptor(
        'owner-browser-gate5',
        { enabled: true }
      )?.orderId,
      foreign: recovery.readCheckoutRecoveryDescriptor(
        'foreign-browser-gate5',
        { enabled: true }
      )
    };
  });
  expect(result.owned).toBe('order-browser-gate5');
  expect(result.foreign).toBeNull();
});

test('recovery descriptor is available to another tab of the same identity', async ({ browser }) => {
  const context = await browser.newContext();
  const firstPage = await context.newPage();
  const secondPage = await context.newPage();
  await Promise.all([firstPage.goto(origin), secondPage.goto(origin)]);
  await firstPage.evaluate(async () => {
    const recovery = await import('/checkoutRecovery.js');
    recovery.writeCheckoutRecoveryDescriptor(
      recovery.createCheckoutRecoveryDescriptor({
        ownerUid: 'owner-multitab-gate5',
        clientOrderId: 'client-multitab-gate5',
        orderId: 'order-multitab-gate5',
        cartLines: [{ cartLineId: 'cart-line-multitab-gate5', cartRevision: 1 }]
      }),
      { enabled: true }
    );
  });
  const resumedOrderId = await secondPage.evaluate(async () => {
    const recovery = await import('/checkoutRecovery.js');
    return recovery.readCheckoutRecoveryDescriptor(
      'owner-multitab-gate5',
      { enabled: true }
    )?.orderId;
  });
  expect(resumedOrderId).toBe('order-multitab-gate5');
  await context.close();
});

test('removed and re-added cart line cannot be deleted by an older checkout cleanup', async ({ page }) => {
  await page.goto(origin);
  const result = await page.evaluate(async () => {
    const cart = await import('/guestCart.js');
    const recovery = await import('/checkoutRecovery.js');
    const product = {
      id: 'product-browser-gate5',
      collectionName: 'furniture',
      name: 'Produit navigateur',
      quantity: 1
    };
    const first = cart.addGuestCartItem(product)[0];
    const purchased = {
      cartLineId: first.cartLineId,
      cartRevision: first.cartRevision
    };
    cart.removeGuestCartItem(first.id);
    const readded = cart.addGuestCartItem(product)[0];
    return {
      firstLineId: first.cartLineId,
      readdedLineId: readded.cartLineId,
      cleanupWouldDelete: recovery.isPurchasedCartLineUnchanged(
        readded,
        purchased
      )
    };
  });
  expect(result.readdedLineId).not.toBe(result.firstLineId);
  expect(result.cleanupWouldDelete).toBe(false);
});

test('cart revision mismatch preserves a line changed in another tab', async ({ browser }) => {
  const context = await browser.newContext();
  const firstPage = await context.newPage();
  const secondPage = await context.newPage();
  await Promise.all([firstPage.goto(origin), secondPage.goto(origin)]);
  await firstPage.evaluate(async () => {
    const cart = await import('/guestCart.js');
    cart.addGuestCartItem({
      id: 'product-multitab-gate5',
      collectionName: 'furniture',
      quantity: 1
    });
  });
  const result = await secondPage.evaluate(async () => {
    const cart = await import('/guestCart.js');
    const recovery = await import('/checkoutRecovery.js');
    const current = cart.readGuestCart()[0];
    return recovery.isPurchasedCartLineUnchanged(current, {
      cartLineId: current.cartLineId,
      cartRevision: current.cartRevision + 1
    });
  });
  expect(result).toBe(false);
  await context.close();
});
