'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { quoteReceiptEmail } = require('../functions/src/quotes/quoteEmailTemplates');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('transactional email HTML escapes client and catalog strings', () => {
  const injection = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const message = quoteReceiptEmail({
    requestNumber: injection,
    customer: { firstName: injection, email: 'client@example.test' },
    project: {
      furnitureLabel: injection,
      description: injection,
      indicativeEstimate: { minCents: 1000, maxCents: 2000 },
      services: [{ label: injection }]
    }
  }, 'sender@example.test');

  assert.doesNotMatch(message.html, /<img src=x|<script>alert/);
  assert.match(message.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(message.html, /&lt;script&gt;alert\(2\)&lt;\/script&gt;/);
});

test('every data-backed JSON-LD script neutralizes closing script tags', () => {
  const files = [
    'app/a-propos/page.jsx',
    'app/categorie/[categoryId]/page.jsx',
    'app/devis/page.jsx',
    'app/produit/[slugOrId]/page.jsx',
    'src/kit/marketplace/GalleryRoutePage.jsx'
  ];
  for (const file of files) {
    const source = read(file);
    assert.match(source, /JSON\.stringify\(data\)\.replace\(\/<\/g, '\\\\u003c'\)/, file);
    assert.match(source, /dangerouslySetInnerHTML=\{\{ __html: safeJsonLd\(/, file);
  }
});

test('admin rich text and quote views do not inject stored markup', () => {
  const storyEditor = read('src/kit/admin/components/StoryEditor.jsx');
  const quoteAdmin = read('src/kit/admin/AdminQuotes.jsx');
  assert.match(storyEditor, /const text = escapeHtml\(token\.text\)/);
  assert.match(storyEditor, /editor\.innerHTML = markdownToEditorHtml\(value\)/);
  assert.doesNotMatch(quoteAdmin, /dangerouslySetInnerHTML|\.innerHTML\s*=/);
});

test('PDF and OAuth callback outputs keep untrusted values out of executable markup', () => {
  for (const file of [
    'functions/src/invoicing/manualInvoicePdf.js',
    'functions/src/commerce/domain/commerceDocumentArtifact.js'
  ]) {
    const source = read(file);
    assert.match(source, /pdf\.text\(/, file);
    assert.doesNotMatch(source, /addJavaScript|addJS|autoPrint|dangerouslySetInnerHTML|\.innerHTML/, file);
  }
  const meta = read('functions/src/integrations/meta.js');
  assert.match(meta, /JSON\.stringify\([^\n]+\)\.replace\(\/<\/g, '\\\\u003c'\)/);
  assert.match(meta, /<script nonce="\$\{nonce\}">/);
});

test('internal Functions errors never expose raw provider messages to clients', () => {
  const functionFiles = fs.readdirSync(path.join(root, 'functions/src'), { recursive: true })
    .filter((entry) => /\.(?:js|cjs|mjs)$/.test(entry))
    .map((entry) => read(path.join('functions/src', entry)))
    .join('\n');
  assert.doesNotMatch(
    functionFiles,
    /HttpsError\(\s*['"]internal['"]\s*,\s*(?:error|err)\??\.message/
  );
});
