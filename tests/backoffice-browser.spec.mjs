import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { transform, loadBindings } = require('next/dist/build/swc');

// Bundle de test en mémoire : React réel et composants réels, transports doublés.
// Aucun serveur Firebase, secret, URL hébergée ou effet métier externe.
async function bundle() {
  await loadBindings();
  const modules = new Map();
  const root = process.cwd();
  const stub = `
    const React = require('react');
    const icon = () => null;
    const transport = new Proxy({}, {get: (_, key) => key === '__esModule' ? true : key === 'getCallableFunction' ? async name => async payload => new Promise((resolve,reject) => window.calls.push({name,payload,resolve,reject})) : key === 'db' ? {} : undefined});
    const firestore = {collection: (...args) => args, doc: (...args) => args, documentId: () => 'id', query: (...args) => args, where: (...args) => args, orderBy: (...args) => args, limit: n => n,
      onSnapshot: (query, options, callback) => { const cb = typeof options === 'function' ? options : callback; window.subscriptions.push(query);
        if(query.includes('insights')) window.calls.push({name:'insights',resolve:value=>cb({exists:()=>true,data:()=>value,metadata:{fromCache:false}})});
        else queueMicrotask(() => cb({docs: [],size:0,metadata:{fromCache:false}})); return () => {}; },
      getDoc: () => new Promise((resolve,reject) => window.calls.push({name:'insights',resolve: value => resolve({exists:()=>true,data:()=>value}),reject})),
      getDocs: async () => ({docs:[]}), Timestamp: {fromMillis: n => n}};
    const motion = new Proxy({}, {get: (_, tag) => React.forwardRef(({children, ...props}, ref) => React.createElement(tag, {ref}, children))});
    module.exports = {transport, firestore, icons: new Proxy({}, {get: (_,key) => key === '__esModule' ? true : icon}), motion: {motion,useReducedMotion:()=>true,animate:(_a,b,options)=>{options?.onUpdate?.(b);return {stop(){}}}}};
  `;
  const aliases = new Map();
  const add = async (filename, provided) => {
    if (modules.has(filename)) return filename;
    modules.set(filename, '');
    let source = provided ?? fs.readFileSync(filename, 'utf8');
    if (filename.endsWith('.jsx') || filename.includes('/src/') || filename.startsWith('virtual:')) {
      source = (await transform(source, { filename: filename.replace('virtual:', '') + '.jsx', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } }, target: 'es2022' }, module: {type:'commonjs'} })).code;
    }
    const requests = [...source.matchAll(/require\(["']([^"']+)["']\)/g)].map(m => m[1]);
    for (const request of new Set(requests)) {
      let resolved;
      if (request === 'firebase/firestore') resolved = aliases.get('firestore');
      else if (request.includes('config/firebase')) resolved = aliases.get('transport');
      else if (request === 'lucide-react') resolved = aliases.get('icons');
      else if (request === 'framer-motion') resolved = aliases.get('motion');
      else if (request === 'next/image') resolved = aliases.get('image');
      else if (request.includes('utils/imageUtils')) resolved = aliases.get('images');
      else {
        const resolver = createRequire(filename.startsWith('virtual:') ? path.join(root, 'test-bundle.cjs') : filename);
        try { resolved = resolver.resolve(request); }
        catch { resolved = resolver.resolve(request + '.js'); }
        await add(resolved);
      }
      source = source.replaceAll(`require("${request}")`, `require(${JSON.stringify(resolved)})`).replaceAll(`require('${request}')`, `require(${JSON.stringify(resolved)})`);
    }
    modules.set(filename, source);
    return filename;
  };
  for (const name of ['firestore','transport','icons','motion']) aliases.set(name, `virtual:${name}`);
  aliases.set('image','virtual:image'); aliases.set('images','virtual:images');
  await add('virtual:stubs', stub);
  for (const name of ['firestore','transport','icons','motion']) modules.set(`virtual:${name}`, `module.exports = require('virtual:stubs').${name};`);
  await add('virtual:image', `const React = require('react'); module.exports = function Image({src,alt}){return React.createElement('img',{src,alt});}`);
  await add('virtual:images', `exports.getProductImageItems = () => [];`);
  const entry = await add('virtual:entry', `
    const React = require('react'); const {createRoot} = require('react-dom/client');
    const Dashboard = require('./src/kit/admin/AdminDashboard.jsx').default;
    const Analytics = require('./src/kit/admin/AdminAnalytics.jsx').default;
    const Invoices = require('./src/kit/admin/AdminInvoices.jsx').default;
    const Quotes = require('./src/kit/admin/AdminQuotes.jsx').default;
    require('./src/kit/admin/adminDataCache.js').setAdminCacheAuthorization('local-admin');
    window.calls=[]; window.observers=[]; window.subscriptions=[];
    window.IntersectionObserver=class { constructor(callback){this.callback=callback;window.observers.push(this);} observe(){} disconnect(){} };
    const root=createRoot(document.getElementById('root'));
    window.renderView=(name, revision=0)=>root.render(React.createElement(({Dashboard,Analytics,Invoices,Quotes})[name], {user:{uid:'local-admin'},onLoadCatalog:()=>Promise.resolve(),backOfficeReadyAt:revision}));
    window.leaveView=()=>root.render(null);
    window.intersect=()=>window.observers.at(-1)?.callback([{isIntersecting:true}]);
  `);
  return `window.process={env:{NODE_ENV:'development'}};const mods={${[...modules].map(([id,src])=>`${JSON.stringify(id)}:function(module,exports,require){${src}\n}`).join(',')}};const cache={};function require(id){if(cache[id])return cache[id].exports;const m=cache[id]={exports:{}};mods[id](m,m.exports,require);return m.exports;}require(${JSON.stringify(entry)});`;
}
let script;
test.beforeAll(async () => { script = await bundle(); });
test.beforeEach(async ({page}) => {
  await page.route('**/*', route => route.abort());
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({content:script});
});

test('Data : sept jours conservés après retours répétés', async ({page}) => {
  await page.evaluate(()=>window.renderView('Analytics'));
  await page.getByRole('button', {name:'7j',exact:true}).click();
  for (let i=0;i<5;i++) {
    await page.evaluate(()=>window.leaveView());
    await expect(page.locator('#root')).toBeEmpty();
    await page.evaluate(()=>window.renderView('Analytics'));
    await expect(page.getByRole('button', {name:'7j',exact:true})).toHaveAttribute('aria-pressed','true');
  }
});

test('Data compatible : réponse partie sur 24 h ne remplace pas les sept jours sélectionnés', async ({page}) => {
  await page.evaluate(()=>window.renderView('Analytics'));
  await expect.poll(()=>page.evaluate(()=>window.calls.filter(c=>c.payload?.action==='overview_bundle').length)).toBe(1);
  await page.getByRole('button', {name:'7j',exact:true}).click();
  await page.evaluate(()=>{
    const overview = count => ({kpis:{uniqueVisitors:count,totalSessions:count,visitorConfidenceLabel:'Fixture locale'},chartData:[],dataQuality:{confidence:'haute',isWindowComplete:true,method:'Fixture locale'}});
    window.calls.find(c=>c.payload?.action==='overview_bundle').resolve({data:{overviews:{'1j':overview(11),'7j':overview(77)}}});
  });
  await expect(page.locator('h4').filter({hasText:/^77$/})).toBeVisible();
  await expect(page.locator('h4').filter({hasText:/^11$/})).toHaveCount(0);
  await expect(page.getByRole('button', {name:'7j',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('I1 Factures : attente, erreur et nouvelle lecture vide confirmée', async ({page}) => {
  await page.evaluate(()=>window.renderView('Invoices'));
  await expect(page.getByText('Aucune facture enregistrée')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Chargement');
  await page.evaluate(()=>window.calls[0].reject(new Error('Lecture locale interrompue')));
  await page.getByRole('button',{name:'Réessayer'}).click();
  await page.evaluate(()=>window.calls.at(-1).resolve({data:{seller:{},invoices:[],products:[]}}));
  await expect(page.getByText('Aucune facture enregistrée')).toBeVisible();
  expect(await page.evaluate(()=>window.calls.map(c=>c.payload.includeProducts))).toEqual([false,false]);
});

test('I1 insights : squelette initial, changement de dépendance, payload invalide et retry', async ({page}) => {
  await page.evaluate(()=>window.renderView('Dashboard'));
  await expect.poll(()=>page.evaluate(()=>window.observers.length)).toBeGreaterThan(0);
  await page.evaluate(()=>window.intersect());
  await expect.poll(()=>page.evaluate(()=>window.calls.length)).toBe(1);
  await page.evaluate(()=>window.renderView('Dashboard', 1));
  await expect.poll(()=>page.evaluate(()=>window.observers.length)).toBeGreaterThan(1);
  await page.evaluate(()=>window.intersect());
  await page.evaluate(()=>window.calls[0].resolve({productsState:'ready'}));
  await page.getByRole('button',{name:'Réessayer le chargement des tendances'}).click();
  await page.evaluate(()=>window.intersect());
  await expect.poll(()=>page.evaluate(()=>window.calls.length)).toBe(2);
  await page.evaluate(()=>window.calls[1].resolve({schemaVersion:1,windowDays:30,revision:1,coverageThrough:{seconds:1,nanoseconds:0},updatedAt:{seconds:1,nanoseconds:0},quote:{visits:0,starts:0,submitted:0},productsState:'ready',products:[]}));
  await expect(page.getByRole('button',{name:'Réessayer le chargement des tendances'})).toHaveCount(0);
});

test('I2/I4 devis : suivi reçu avant les photos, saisie conservée', async ({page}) => {
  await page.evaluate(()=>window.renderView('Quotes'));
  await expect.poll(()=>page.evaluate(()=>window.calls.length)).toBe(1);
  await page.evaluate(()=>window.calls[0].resolve({data:{quotes:[{quoteId:'local-quote',version:1,status:'new',internalNotes:'Version serveur',photoCount:1,customer:{},project:{services:[]}}]}}));
  await page.getByLabel('Notes internes').fill('Brouillon conservé');
  await page.evaluate(()=>window.calls.find(c=>c.name==='getQuoteRequestAdmin').resolve({data:{quote:{quoteId:'local-quote',version:1,status:'new',internalNotes:'Version serveur',photos:[],customer:{},project:{services:[]}}}}));
  await expect(page.getByLabel('Notes internes')).toHaveValue('Brouillon conservé');
});

test('Stats : trente retours rapides gardent les deux écoutes initiales', async ({page}) => {
  await page.evaluate(()=>window.renderView('Dashboard'));
  await expect.poll(()=>page.evaluate(()=>window.subscriptions.length)).toBe(2);
  await page.getByRole('button', {name:'3 mois', exact:true}).click();
  for(let index=0;index<30;index++) {
    await page.evaluate(()=>window.leaveView());
    await expect(page.locator('#root')).toBeEmpty();
    await page.evaluate(()=>window.renderView('Dashboard'));
    await expect(page.getByText('KPI · Données partielles')).toBeVisible();
    await expect(page.getByRole('button', {name:'3 mois', exact:true})).toHaveAttribute('aria-pressed', 'true');
  }
  expect(await page.evaluate(()=>window.subscriptions.length)).toBe(2);
});

test('Devis : photo locale reçue et affichée sans perdre les notes', async ({page}) => {
  await page.evaluate(()=>window.renderView('Quotes'));
  await expect.poll(()=>page.evaluate(()=>window.calls.length)).toBe(1);
  await page.evaluate(()=>window.calls[0].resolve({data:{quotes:[{quoteId:'photo',version:1,status:'new',photoCount:1,customer:{},project:{services:[]}}]}}));
  await page.getByLabel('Notes internes').fill('À conserver');
  await expect.poll(()=>page.evaluate(()=>window.calls.length)).toBe(2);
  await page.evaluate(()=>window.calls[1].resolve({data:{quote:{quoteId:'photo',version:1,status:'new',customer:{},project:{services:[]},photos:[{photoId:'local',originalName:'chaise',url:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/%3E'}]}}}));
  await expect(page.getByAltText('Photo du meuble — chaise')).toBeVisible();
  await expect(page.getByLabel('Notes internes')).toHaveValue('À conserver');
});

test('Factures : ouverture du détail local conserve lignes et montant', async ({page}) => {
  await page.evaluate(()=>window.renderView('Invoices'));
  await expect.poll(()=>page.evaluate(()=>window.calls.length)).toBe(1);
  await page.evaluate(()=>window.calls[0].resolve({data:{seller:{},invoices:[{id:'invoice-local',status:'draft',customer:{firstName:'Camille',lastName:'Local'},lines:[{id:'line',name:'Restauration chaise locale',quantity:2,unitPriceCents:12500,totalCents:25000}],totalCents:25000,issueDate:'2026-09-05'}]}}));
  await page.getByRole('button', {name:/Camille/}).click();
  await expect(page.getByLabel('Désignation', {exact:false})).toHaveValue('Restauration chaise locale');
  await expect(page.getByLabel('Quantité', {exact:true})).toHaveValue('2');
  await expect(page.getByLabel('Prix unitaire', {exact:false})).toHaveValue('125,00');
  expect(await page.evaluate(()=>window.calls.length)).toBe(1);
});

test('Factures : une ancienne réponse backend ne promet pas une recherche globale', async ({page}) => {
  await page.evaluate(()=>window.renderView('Invoices'));
  await expect.poll(()=>page.evaluate(()=>window.calls.length)).toBe(1);
  await page.evaluate(()=>window.calls[0].resolve({data:{seller:{},products:[],invoices:[]}}));
  await expect(page.getByText('Aucune facture enregistrée')).toBeVisible();
  await expect(page.getByRole('button',{name:'Rechercher la référence exacte'})).toHaveCount(0);
});

test('I2 devis : sélection rapide et saisie après départ de sauvegarde ne sont pas écrasées', async ({page}) => {
  await page.evaluate(()=>window.renderView('Quotes'));
  await expect.poll(()=>page.evaluate(()=>window.calls.length)).toBe(1);
  await page.evaluate(()=>window.calls[0].resolve({data:{quotes:['Q1','Q2'].map(requestNumber=>({quoteId:requestNumber,requestNumber,version:1,status:'new',internalNotes:requestNumber,photoCount:1,customer:{},project:{services:[]}}))}}));
  await page.getByRole('button',{name:/Q2/}).click();
  await expect(page.getByLabel('Notes internes')).toHaveValue('Q2');
  await page.evaluate(()=>window.calls.find(c=>c.name==='getQuoteRequestAdmin'&&c.payload.quoteId==='Q1').resolve({data:{quote:{quoteId:'Q1',version:1,status:'new',internalNotes:'Tardif Q1',photos:[],customer:{},project:{services:[]}}}}));
  await expect(page.getByLabel('Notes internes')).toHaveValue('Q2');
  await page.getByLabel('Notes internes').fill('Envoyé');
  await page.getByRole('button',{name:'Enregistrer le suivi'}).click();
  await page.getByLabel('Notes internes').fill('Saisie après départ');
  await page.evaluate(()=>window.calls.find(c=>c.name==='updateQuoteRequestAdmin').resolve({data:{quote:{quoteId:'Q2',requestNumber:'Q2',version:2,status:'new',internalNotes:'Envoyé',photoCount:0,photos:[],customer:{},project:{services:[]}}}}));
  await expect(page.getByLabel('Notes internes')).toHaveValue('Saisie après départ');
  await expect(page.getByRole('button',{name:'Enregistrer le suivi'})).toBeDisabled();
});
