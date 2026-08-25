import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { isPerformanceSafePath } from '../src/kit/shared/performanceRoutePolicy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('Performance Monitoring est limité aux vitrines publiques sans données sensibles', () => {
  for (const route of ['/', '/galerie', '/categorie/buffets', '/produit/commode-bleue', '/a-propos']) assert.equal(isPerformanceSafePath(route), true, route);
  for (const route of ['/admin', '/checkout', '/payer/o1/token', '/mes-commandes', '/wishlist', '/recherche?q=nom', '/devis']) assert.equal(isPerformanceSafePath(route), false, route);
});

test('le SDK reste lazy et est coupé dès le début d’une transition privée', () => {
  const island = read('app/PerformanceMonitoringIsland.jsx');
  const instrumentation = read('instrumentation-client.js');
  assert.match(island, /import\('firebase\/performance'\)/);
  assert.match(island, /dataCollectionEnabled = enabled/);
  assert.match(island, /instrumentationEnabled = enabled/);
  assert.match(instrumentation, /onRouterTransitionStart/);
  assert.match(instrumentation, /isPerformanceSafePath\(url\)/);
});
