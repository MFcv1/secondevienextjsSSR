import { expect, test } from '@playwright/test';

test('les commandes du résumé tactile restent indépendantes du zoom', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Ce scénario exerce les interactions tactiles de la fiche mobile.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Refuser', exact: true }).tap();
  const productLink = page.getByRole('link', { name: /^Découvrir / }).first();
  const productPath = await productLink.getAttribute('href');
  await page.goto(productPath);
  await expect(page.locator('[data-next-product-detail-shell="native"]')).toBeVisible();

  const zoom = page.getByRole('dialog', { name: 'Image produit agrandie' });
  const details = page.getByRole('button', { name: 'Ouvrir les details', exact: true });
  await details.tap();
  await expect(page.locator('[data-mobile-bottom-sheet]')).toHaveAttribute('aria-hidden', 'false');
  await expect(zoom).toHaveCount(0);
  await page.getByRole('button', { name: 'Fermer les details', exact: true }).tap();
  await expect(page.locator('[data-mobile-bottom-sheet]')).toHaveAttribute('aria-hidden', 'true');

  const favorite = page.getByRole('button', { name: 'Ajouter a la liste de souhaits', exact: true });
  await favorite.tap();
  const liked = page.getByRole('button', { name: 'Retirer de la liste de souhaits', exact: true });
  await expect(liked).toHaveAttribute('aria-pressed', 'true');
  await expect(zoom).toHaveCount(0);
  await liked.tap();
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
  await expect(zoom).toHaveCount(0);

  await page.locator('[data-product-main-image="true"]:visible').tap();
  await expect(zoom).toBeVisible();
  await page.getByRole('button', { name: 'Fermer le zoom', exact: true }).tap();
  await expect(zoom).toHaveCount(0);
  await details.tap();
  await expect(page.locator('[data-mobile-bottom-sheet]')).toHaveAttribute('aria-hidden', 'false');
  await expect(zoom).toHaveCount(0);
});
