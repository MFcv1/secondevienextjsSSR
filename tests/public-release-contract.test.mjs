import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('demo contact, social and legal surfaces remain visible while quote requests use the back-office workflow', async () => {
  const [config, footer, quote, quoteClient, quoteFunctions] = await Promise.all([
    read('src/kit/config/constants.js'),
    read('src/kit/marketplace/FooterServer.jsx'),
    read('src/kit/marketplace/QuoteFormIsland.jsx'),
    read('src/kit/marketplace/quoteRequestClient.js'),
    read('functions/src/quotes/quoteRequests.js'),
  ]);
  assert.match(config, /contact@secondevie-marseille\.fr/);
  assert.match(config, /\+33 6 12 34 56 78/);
  assert.match(config, /legalLinks:\s*\{[\s\S]*NEXT_PUBLIC_TERMS_URL[\s\S]*NEXT_PUBLIC_PRIVACY_URL/);
  assert.match(footer, /socialLinks\.map/);
  assert.match(footer, /bientot disponible/);
  assert.equal(footer.includes("['Se connecter', '/admin']"), false);
  assert.match(footer, /legalLinks\.map/);
  assert.match(quote, /submitQuoteRequest/);
  assert.match(quoteClient, /createQuoteRequest/);
  assert.match(quoteClient, /finalizeQuoteRequest/);
  assert.match(quoteFunctions, /module\.exports\s*=\s*\{[\s\S]*createQuoteRequest/);
  assert.match(quoteFunctions, /module\.exports\s*=\s*\{[\s\S]*finalizeQuoteRequest/);
});

test('newsletter stays visible and quotes can reach the estimate before durable submission', async () => {
  const [config, gallery, quote] = await Promise.all([
    read('src/kit/config/constants.js'),
    read('src/kit/marketplace/GalleryServerView.jsx'),
    read('src/kit/marketplace/QuoteFormIsland.jsx'),
  ]);

  assert.match(config, /newsletter:\s+true/);
  assert.match(gallery, /KIT_CONFIG\.features\.newsletter\s*\?/);
  assert.match(quote, /const showEstimate[\s\S]*goToStep\(ESTIMATE_STEP_INDEX\)/);
  assert.match(quote, /const handleSubmit[\s\S]*submitQuoteRequest/);
  assert.match(quote, /setSubmitted\(true\)/);
  assert.doesNotMatch(quote, /CONTACT_CHANNEL_READY/);
});

test('checkout remains demonstrable while linking legal documents as soon as they exist', async () => {
  const checkout = await read('src/kit/commerce/CheckoutView.jsx');

  assert.match(checkout, /LEGAL_DOCUMENTS_READY/);
  assert.doesNotMatch(checkout, /LEGAL_CHECKOUT_READY/);
  assert.match(checkout, /rgpdAccepted && formData\.deliveryMode/);
  assert.match(checkout, /href=\{TERMS_URL\}/);
  assert.match(checkout, /href=\{PRIVACY_URL\}/);
  assert.match(checkout, /J&apos;accepte les conditions générales de vente/);
});

test('maintenance audit stays local with no public artifact or admin page', async () => {
  const [maintenanceScript, adminIsland, config] = await Promise.all([
    read('scripts/maintenance-audit.mjs'),
    read('app/admin/AdminAppIsland.jsx'),
    read('src/kit/config/constants.js'),
  ]);

  assert.match(maintenanceScript, /\.maintenance', 'audit\.json/);
  assert.doesNotMatch(maintenanceScript, /publicStatusPath|public\/maintenance|status\.json/);
  assert.doesNotMatch(adminIsland, /AdminMaintenance|adminCollection === 'maintenance'/);
  assert.doesNotMatch(config, /id:\s*'maintenance'/);
  await assert.rejects(
    () => read('public/maintenance/status.json'),
    (error) => error?.code === 'ENOENT'
  );
  await assert.rejects(
    () => read('src/kit/admin/AdminMaintenance.jsx'),
    (error) => error?.code === 'ENOENT'
  );
});

test('unverified social proof and unavailable payment promises fail closed', async () => {
  const [
    config,
    gallery,
    about,
    productSections,
    sharedTestimonials,
    cart,
    footer,
    support,
    menu,
    announcements,
  ] = await Promise.all([
    read('src/kit/config/constants.js'),
    read('src/kit/marketplace/GalleryServerView.jsx'),
    read('src/kit/vitrine/AboutServerView.jsx'),
    read('src/kit/marketplace/ProductSectionsServer.jsx'),
    read('src/kit/shared/CustomerTestimonialsCarousel.jsx'),
    read('src/kit/commerce/CartSidebar.jsx'),
    read('src/kit/marketplace/FooterServer.jsx'),
    read('src/kit/marketplace/SupportChatPanel.jsx'),
    read('src/kit/layout/GlobalMenuDesktop.jsx'),
    read('src/lib/server/galleryPersonalization.js'),
  ]);

  assert.match(config, /NEXT_PUBLIC_CUSTOMER_TESTIMONIALS_VERIFIED === 'true'/);
  assert.match(config, /instagramCommunity:\s*HAS_PUBLIC_INSTAGRAM/);
  assert.match(gallery, /KIT_CONFIG\.features\.testimonials\s*\?/);
  assert.match(gallery, /KIT_CONFIG\.features\.instagramCommunity\s*\?/);
  assert.match(about, /KIT_CONFIG\.features\.testimonials\s*\?/);
  assert.match(about, /KIT_CONFIG\.features\.instagramCommunity\s*\?/);

  const publicClaims = [
    productSections,
    sharedTestimonials,
    cart,
    footer,
    support,
    menu,
    announcements,
  ].join('\n');

  for (const unsupportedClaim of [
    '124 avis Google',
    '38.9',
    '38,9',
    'Klarna',
    '4x sans frais',
    'PayPal',
    'wero',
    'Satisfait ou rembourse',
    'DSS Compliant',
    'Paiement 100% sécurisé',
    'Livraison partout à Marseille',
  ]) {
    assert.equal(publicClaims.includes(unsupportedClaim), false, `unsupported public claim: ${unsupportedClaim}`);
  }
});
