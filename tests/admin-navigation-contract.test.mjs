import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('Incidents reste le dernier item du menu lateral Admin', () => {
  const island = read('app/admin/AdminAppIsland.jsx');
  const constants = read('src/kit/config/constants.js');
  const groups = island.match(/const ADMIN_NAV_GROUPS = \[([\s\S]*?)\n\];/)?.[1] || '';
  const tabs = constants.match(/adminTabs:\s*\[([\s\S]*?)\n {2}\],/)?.[1] || '';
  const tabIds = [...tabs.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);

  assert.doesNotMatch(groups, /Vue d'ensemble[^\n]*incidents/);
  assert.match(groups, /\{ label: 'Administration', tabs: \['account', 'users', 'performance', 'incidents'\] \},\s*$/);
  assert.equal(tabIds.filter((id) => id === 'performance').length, 1);
  assert.equal(tabIds.at(-1), 'incidents');
  assert.equal(tabIds.filter((id) => id === 'incidents').length, 1);
});

test('Data affiche son cache immédiatement et espace les synchronisations automatiques', () => {
  const analytics = read('src/kit/admin/AdminAnalytics.jsx');
  const island = read('app/admin/AdminAppIsland.jsx');
  const sidebar = read('app/admin/AdminSidebar.jsx');
  assert.match(analytics, /ADMIN_ANALYTICS_REFRESH_TTL_MS\s*=\s*5 \* 60 \* 1000/);
  assert.match(analytics, /cachedAnalyticsSessions === null/);
  assert.match(analytics, /restoringSessions && sessions\.length === 0/);
  assert.doesNotMatch(analytics, /\(loading \|\| restoringSessions\) && sessions\.length === 0/);
  assert.match(island, /loadAdminAnalytics/);
  assert.match(sidebar, /onPointerEnter=\{\(\) => onIntent\?\.\(tab\.id\)\}/);
  assert.match(analytics, /ADMIN_SESSION_PAGE_SIZE\s*=\s*10/);
  assert.match(analytics, /overview_bundle/);
  assert.match(analytics, /traffic-overviews-v1/);
});

test('Ventes se precharge sur intention et les retours affichent un badge materialise', () => {
  const island = read('app/admin/AdminAppIsland.jsx');
  const sidebar = read('app/admin/AdminSidebar.jsx');
  const orders = read('src/kit/admin/AdminOrders.jsx');
  assert.match(island, /loadAdminOrders\(\)\.then/);
  assert.match(orders, /preloadAdminOrdersWorkspace/);
  assert.match(island, /admin_action_summary/);
  assert.match(sidebar, /actionCounts\[tab\.id\]/);
});

test('la concurrence checkout conserve le brouillon et les remboursements arrivent en direct', () => {
  const checkout = read('app/checkout/CheckoutPageIsland.jsx');
  const orders = read('src/kit/commerce/MyOrdersView.jsx');
  assert.match(checkout, /lastNonEmptyCartRef/);
  assert.match(checkout, /Cette pièce vient d’être vendue/);
  assert.match(checkout, /aucun paiement n’a été créé/);
  assert.match(orders, /where\('updatedAt', '>', Timestamp\.fromMillis\(ordersLiveSince\)\)/);
  assert.match(orders, /limit\(25\)/);
  assert.match(orders, /return onSnapshot\(liveQuery/);
});

test('les invokers Eventarc sont privés et associés à leur identité réelle', () => {
  const iam = read('scripts/configure-dashboard-event-invokers.mjs');
  const deploy = read('scripts/deploy-functions-targeted.mjs');
  assert.match(iam, /journalinventorymovementgen2', account: 'commerce-operations-reconciler/);
  assert.match(iam, /journalordereventgen2', account: 'commerce-operations-reconciler/);
  assert.match(iam, /projectcommercefinancialhistorygen2', account: 'order-stats-projector/);
  assert.match(iam, /projectadminactionsummarygen2', account: 'functions-eventarc-invoker/);
  assert.match(iam, /publicInvoker: false/);
  assert.match(deploy, /projectAdminActionSummaryGen2: dashboardEventTarget/);
});

test('Système reste monté pendant le passage Commande afin de conserver son listener', () => {
  const consoleSource = read('src/kit/admin/AdminIncidentConsole.jsx');
  assert.match(consoleSource, /<div hidden=\{mode !== 'system'\}>/);
  assert.doesNotMatch(consoleSource, /mode === 'system'\s*\?\s*<SystemIncidentConsole/);
});
