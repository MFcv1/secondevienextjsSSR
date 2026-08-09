'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  MAX_PHOTOS,
  hashToken,
  normalizeInternalNotes,
  normalizeQuoteRequest,
  normalizeQuoteStatus,
  quoteDocumentId,
  quoteReference,
  tokenMatches,
} = require('../functions/src/quotes/quoteRequestDomain');
const { quoteReceiptEmail } = require('../functions/src/quotes/quoteEmailTemplates');

const root = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const requestFixture = (overrides = {}) => ({
  clientRequestId: '123e4567-e89b-12d3-a456-426614174000',
  uploadToken: 'a'.repeat(64),
  expectedPhotoCount: 2,
  consent: true,
  customer: {
    firstName: 'Camille',
    lastName: 'Martin',
    email: 'Camille@example.test',
    phone: '06 12 34 56 78',
    location: 'Marseille',
  },
  project: {
    furnitureType: 'commode',
    condition: 'Rayures ou marques visibles',
    dimensions: { height: '92', width: '110', depth: '48', weight: '35' },
    description: 'Une commode familiale à restaurer.',
    notes: 'Accès au deuxième étage.',
    severity: 'Modérés',
    serviceIds: ['poncage', 'defauts'],
  },
  ...overrides,
});

test('devis: le serveur normalise le client et calcule sa propre estimation', () => {
  const normalized = normalizeQuoteRequest(requestFixture());
  assert.equal(normalized.customer.email, 'camille@example.test');
  assert.equal(normalized.customer.fullName, 'Camille Martin');
  assert.equal(normalized.project.furnitureLabel, 'Commode');
  assert.deepEqual(normalized.project.indicativeEstimate, {
    minCents: 7000,
    maxCents: 21000,
    currency: 'EUR',
  });
  assert.equal(normalized.project.services[1].severity, 'Modérés');
  assert.equal(normalized.expectedPhotoCount, 2);
});

test('devis: consentement, services, photos et notes sont strictement bornés', () => {
  assert.throws(() => normalizeQuoteRequest(requestFixture({ consent: false })), /accord|required/i);
  assert.throws(() => normalizeQuoteRequest(requestFixture({
    project: { ...requestFixture().project, serviceIds: ['prix-invente'] },
  })), /Prestations invalides/);
  assert.throws(() => normalizeQuoteRequest(requestFixture({ expectedPhotoCount: MAX_PHOTOS + 1 })), /photos invalide/);
  assert.throws(() => normalizeInternalNotes('x'.repeat(4001)), /trop long/);
  assert.equal(normalizeQuoteStatus('proposal_ready'), 'proposal_ready');
  assert.throws(() => normalizeQuoteStatus('deleted'), /Statut/);
});

test('devis: identifiant et jeton de dépôt sont stables et séparés', () => {
  const requestId = requestFixture().clientRequestId;
  assert.match(quoteDocumentId(requestId), /^quote_[a-f0-9]{32}$/);
  assert.equal(quoteDocumentId(requestId), quoteDocumentId(requestId));
  assert.equal(quoteReference(new Date('2026-08-09T12:00:00Z'), requestId).startsWith('DEV-20260809-'), true);
  assert.equal(tokenMatches('a'.repeat(64), hashToken('a'.repeat(64))), true);
  assert.equal(tokenMatches('b'.repeat(64), hashToken('a'.repeat(64))), false);
});

test('devis: accusé de réception client sans notification vers une adresse métier', () => {
  const normalized = normalizeQuoteRequest(requestFixture());
  const message = quoteReceiptEmail({
    requestNumber: 'DEV-20260809-ABC123',
    customer: normalized.customer,
    project: normalized.project,
  }, 'sandbox-sender@example.test');
  assert.equal(message.to, 'camille@example.test');
  assert.equal(message.bcc, undefined);
  assert.match(message.subject, /bien été reçue/);
  assert.match(message.html, /Aucune action nécessaire/);
  assert.doesNotMatch(message.html, /contact@seconde-vie/i);
});

test('devis: UI lazy, callables et stockages privés restent alignés', () => {
  const admin = source('app/admin/AdminAppIsland.jsx');
  const constants = source('src/kit/config/constants.js');
  const publicForm = source('src/kit/marketplace/QuoteFormIsland.jsx');
  const quoteFunctions = source('functions/src/quotes/quoteRequests.js');
  const functionsIndex = source('functions/index.js');
  const firestoreRules = source('firestore.rules');
  const storageRules = source('storage.rules');

  assert.match(constants, /\{ id: 'quotes',\s+label: 'Devis'/);
  assert.match(admin, /const loadAdminQuotes = \(\) => import\('\.\.\/\.\.\/src\/kit\/admin\/AdminQuotes'\)/);
  assert.match(admin, /React\.lazy\(loadAdminQuotes\)/);
  assert.match(admin, /preloadAdminQuotesData/);
  assert.match(publicForm, /submitQuoteRequest/);
  assert.match(publicForm, /quote_submitted/);
  assert.doesNotMatch(publicForm, /window\.location\.href\s*=\s*`mailto:/);
  for (const callable of [
    'createQuoteRequest',
    'uploadQuoteRequestPhoto',
    'finalizeQuoteRequest',
    'listQuoteRequestsAdmin',
    'getQuoteRequestAdmin',
    'updateQuoteRequestAdmin',
    'onQuoteRequestSubmitted',
  ]) {
    assert.match(functionsIndex, new RegExp(`exports\\.${callable}`));
  }
  assert.match(quoteFunctions, /checkActiveStrongAdmin/);
  assert.match(quoteFunctions, /limit\(MAX_ADMIN_QUOTES \+ 1\)/);
  assert.match(firestoreRules, /match \/quote_requests\/\{quoteId\}/);
  assert.match(firestoreRules, /match \/sys_audit_quotes\/\{auditId\}/);
  assert.match(storageRules, /match \/quote-requests\/\{allPaths=\*\*\}/);
  assert.match(storageRules, /topLevel != 'quote-requests'/);
});
