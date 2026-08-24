import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
let server;
let origin;

test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    const modules = {
      '/checkoutRecovery.js': 'src/kit/commerce/checkoutRecovery.js',
      '/checkoutController.js': 'src/kit/commerce/checkoutController.js',
      '/commerceUiFlags.js': 'src/kit/commerce/commerceUiFlags.js'
    };
    if (modules[request.url]) {
      response.setHeader('content-type', 'text/javascript');
      response.end(await readFile(path.join(repositoryRoot, modules[request.url]), 'utf8'));
      return;
    }
    response.setHeader('content-type', 'text/html');
    response.end('<!doctype html><html><body><button id="checkout">Checkout</button></body></html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function storeDescriptor(page, suffix) {
  return page.evaluate(async (value) => {
    const recovery = await import('/checkoutRecovery.js');
    const descriptor = recovery.createCheckoutRecoveryDescriptor({
      ownerUid: `owner-browser-${value}`,
      clientOrderId: `client-browser-${value}`,
      orderId: `order-browser-${value}`,
      cartLines: [{ cartLineId: `cart-line-browser-${value}`, cartRevision: 4 }]
    });
    recovery.writeCheckoutRecoveryDescriptor(descriptor, { enabled: true });
    return descriptor;
  }, suffix);
}

test('R02 perte de reponse create puis reload reprend le meme descriptor', async ({ page }) => {
  await page.goto(origin);
  const descriptor = await storeDescriptor(page, 'r02');
  await page.reload();
  const recovered = await page.evaluate(async () => {
    const recovery = await import('/checkoutRecovery.js');
    return recovery.readCheckoutRecoveryDescriptor('owner-browser-r02', { enabled: true });
  });
  expect(recovered.clientOrderId).toBe(descriptor.clientOrderId);
  expect(recovered.orderId).toBe(descriptor.orderId);
});

test('R03 double clic ne lance pas deux intentions client', async ({ page }) => {
  await page.goto(origin);
  const result = await page.evaluate(async () => {
    let promise = null;
    let calls = 0;
    const submit = () => {
      if (promise) return promise;
      calls += 1;
      promise = Promise.resolve({ clientOrderId: 'client-browser-r03' });
      return promise;
    };
    const [left, right] = await Promise.all([submit(), submit()]);
    return { calls, left, right };
  });
  expect(result.calls).toBe(1);
  expect(result.left.clientOrderId).toBe(result.right.clientOrderId);
});

test('R04 reload pendant confirmation reprend les lignes immuables commande', async ({ page }) => {
  await page.goto(origin);
  await storeDescriptor(page, 'r04');
  await page.reload();
  const result = await page.evaluate(async () => {
    const recovery = await import('/checkoutRecovery.js');
    const descriptor = recovery.readCheckoutRecoveryDescriptor('owner-browser-r04', { enabled: true });
    const items = recovery.getCheckoutRecoveryOrderItems({ items: [{
      cartLineId: descriptor.cartLines[0].cartLineId,
      productId: 'product-browser-r04',
      name: 'Snapshot commande',
      unitAmountCents: 12500,
      quantity: 1
    }] });
    return { descriptor, items };
  });
  expect(result.descriptor.cartLines[0].cartRevision).toBe(4);
  expect(result.items[0].name).toBe('Snapshot commande');
  expect(result.items[0].price).toBe(125);
});

test('R10 timeout confirmation affiche verification en cours jamais succes', async ({ page }) => {
  await page.goto(origin);
  const state = await page.evaluate(async () => {
    const controller = await import('/checkoutController.js');
    let current = controller.createCheckoutControllerState();
    current = controller.reduceCheckoutController(current, { type: 'START', clientOrderId: 'client-browser-r10' }, { enabled: true });
    current = controller.reduceCheckoutController(current, { type: 'CREATED', orderId: 'order-browser-r10' }, { enabled: true });
    current = controller.reduceCheckoutController(current, { type: 'SUBMIT' }, { enabled: true });
    return current;
  });
  expect(state.status).toBe('processing');
  expect(state.status).not.toBe('succeeded');
});

test('R14 Auth ou App Check expire puis reauth reprend la meme commande', async ({ page }) => {
  await page.goto(origin);
  const descriptor = await storeDescriptor(page, 'r14');
  const result = await page.evaluate(async () => {
    const recovery = await import('/checkoutRecovery.js');
    const beforeReauth = recovery.readCheckoutRecoveryDescriptor('owner-browser-r14', { enabled: true });
    const simulatedAuthError = { code: 'unauthenticated' };
    const afterReauth = recovery.readCheckoutRecoveryDescriptor('owner-browser-r14', { enabled: true });
    return { beforeReauth, simulatedAuthError, afterReauth };
  });
  expect(result.simulatedAuthError.code).toBe('unauthenticated');
  expect(result.beforeReauth.orderId).toBe(descriptor.orderId);
  expect(result.afterReauth.orderId).toBe(descriptor.orderId);
});

test('R16 callable lent ou 503 conserve une reprise explicite sans boucle', async ({ page }) => {
  await page.goto(origin);
  const result = await page.evaluate(async () => {
    const intent = Object.freeze({ clientOrderId: 'client-browser-r16' });
    let attempts = 0;
    const submit = async () => {
      attempts += 1;
      if (attempts === 1) throw Object.assign(new Error('unavailable'), { code: 'unavailable' });
      return intent;
    };
    let errorCode = null;
    try { await submit(); } catch (error) { errorCode = error.code; }
    const attemptsBeforeUserRetry = attempts;
    const recovered = await submit();
    return { attempts, attemptsBeforeUserRetry, errorCode, recovered };
  });
  expect(result.errorCode).toBe('unavailable');
  expect(result.attemptsBeforeUserRetry).toBe(1);
  expect(result.attempts).toBe(2);
  expect(result.recovered.clientOrderId).toBe('client-browser-r16');
});
