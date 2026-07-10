const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const validProduct = {
  id: 'valid-1',
  status: 'published',
  name: 'Buffet parisien restauré',
  description: 'Buffet ancien restauré avec soin dans notre atelier, prêt à rejoindre un nouvel intérieur.',
  imageUrl: 'https://example.test/buffet.webp'
};

(async () => {
  const contractUrl = pathToFileURL(path.join(root, 'src/lib/seo/indexability.js')).href;
  const { getProductSeoDecision } = await import(contractUrl);

  const validDecision = getProductSeoDecision(validProduct);
  assert.equal(validDecision.publicVisible, true, 'un produit publié hors fixture doit rester visible');
  assert.equal(validDecision.indexable, true, 'un produit éditorial complet doit être indexable');
  assert.equal(validDecision.canonicalSlug, 'buffet-parisien-restaure-valid-1', 'le slug canonique doit être stable');
  assert.equal(getProductSeoDecision({ ...validProduct, description: 'trop court' }).indexable, false, 'une description faible doit être noindex');
  assert.equal(getProductSeoDecision({ ...validProduct, imageUrl: '' }).indexable, false, 'un produit sans image doit être noindex');
  assert.equal(getProductSeoDecision({ ...validProduct, seoIndexable: false }).indexable, false, 'le noindex éditorial explicite doit gagner');

  const productRoute = read('app/produit/[slugOrId]/page.jsx');
  const categoryRoute = read('app/categorie/[categoryId]/page.jsx');
  const sitemap = read('app/sitemap.js');

  assert.match(productRoute, /robots:\s*shouldIndex\s*\?\s*undefined\s*:\s*\{\s*index:\s*false/, 'la route produit doit traduire le contrat en robots noindex');
  assert.match(categoryRoute, /isSeoIndexableCategory/, 'la route catégorie doit appliquer son contrat d’indexabilité');
  assert.match(sitemap, /filter\(\(category\)\s*=>\s*isSeoIndexableCategory/, 'le sitemap ne doit publier que les catégories indexables');
  assert.match(sitemap, /filter\(isSeoIndexableProduct\)/, 'le sitemap ne doit publier que les produits indexables');

  console.log('[seo:surface] Contrat produits, catégories, metadata robots et sitemap : OK');
})().catch((error) => {
  console.error(`[seo:surface] ${error.message}`);
  process.exitCode = 1;
});
