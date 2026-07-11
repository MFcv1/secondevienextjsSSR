import { expect, test } from '@playwright/test';

const productPath = '/produit/buffet-KrTETXPknYNwgak66T8p';
const clientRoutes = [
  '/',
  '/a-propos',
  '/devis',
  '/checkout',
  '/wishlist',
  '/mes-commandes'
];

for (const route of clientRoutes) {
  test(`client route ${route} renders a non-empty shell`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('body')).toContainText('Seconde Vie');
  });
}

test('product route contains raw SSR product evidence', async ({ request }) => {
  const response = await request.get(productPath);
  expect(response.status()).toBe(200);

  const html = await response.text();
  expect(html).toContain('data-ssr-product');
  expect(html).toContain('application/ld+json');
  expect(html).toMatch(/<h1[^>]*>[^<]+<\/h1>/i);
  expect(html).toMatch(/(?:EUR|Prix sur demande)/);
  expect(html).toMatch(/<img[^>]+(?:src|srcset)=/i);
});

test('product route contains SSR product evidence before interactive shell', async ({ page }) => {
  const response = await page.goto(productPath);
  expect(response?.status()).toBe(200);

  const html = await page.content();
  expect(html).toContain('data-ssr-product');
  expect(html).toContain('application/ld+json');
  await expect(page.locator('[data-ssr-product] h1')).toHaveCount(1);
});

test('category route renders SSR category evidence', async ({ page }) => {
  const response = await page.goto('/categorie/buffets');
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-ssr-category]')).toHaveCount(1);
});

test('admin route does not expose admin content without auth', async ({ page }) => {
  const response = await page.goto('/admin');
  expect(response?.status()).toBe(200);
  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page.getByText('Gestion Boutique')).toHaveCount(0);
});

test('passkey auth state keeps Quitter and Mon espace synchronized', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Le libelle Quitter est volontairement masque sous le breakpoint desktop.');

  const response = await page.goto('/');
  expect(response?.status()).toBe(200);

  await page.evaluate(() => {
    const passkeyUser = {
      uid: 'e2e-passkey-user',
      email: 'passkey@example.com',
      displayName: null,
      isAnonymous: false,
    };
    window.__svAuthUser = passkeyUser;
    window.dispatchEvent(new CustomEvent('sv:auth-user-changed', {
      detail: { user: passkeyUser },
    }));
  });

  await expect(page.getByText('Quitter', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  await expect(page.getByText('Mon espace', { exact: true })).toBeVisible();
  await expect(page.getByText('Quitter', { exact: true })).toBeVisible();
});
