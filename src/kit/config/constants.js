/**
 * ============================================================
 * KIT_CONFIG — Configuration centralisée du kit
 * ============================================================
 * Personnalisation Seconde Vie par Anais
 */

// ── MARQUE ────────────────────────────────────────────────────
const BRAND_NAME    = process.env.NEXT_PUBLIC_BRAND_NAME    || 'Seconde Vie';
const BRAND_TAGLINE = process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'par Anais';
const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || '';
const INSTAGRAM_FOLLOWERS_K = Number(process.env.NEXT_PUBLIC_INSTAGRAM_FOLLOWERS_K);
const HAS_PUBLIC_INSTAGRAM = /^https:\/\/www\.instagram\.com\/[A-Za-z0-9._-]+\/?$/i.test(INSTAGRAM_URL);

export const GALLERY_HERO_PRESETS = [
  { preset: 'imagehero/1.webp', src: '/images/imagehero/1.webp', mobileSrc: '/images/imagehero/1-mobile.webp', objectPosition: 'center center', mobileObjectPosition: '54% center' },
  { preset: 'imagehero/2.webp', src: '/images/imagehero/2.webp', mobileSrc: '/images/imagehero/2-mobile.webp', objectPosition: 'center center', mobileObjectPosition: '56% center' },
  { preset: 'imagehero/3.webp', src: '/images/imagehero/3.webp', mobileSrc: '/images/imagehero/3-mobile.webp', objectPosition: 'center center', mobileObjectPosition: '57% center' },
  { preset: 'imagehero/4.webp', src: '/images/imagehero/4.webp', mobileSrc: '/images/imagehero/4-mobile.webp', objectPosition: 'center center', mobileObjectPosition: '51% center' },
];

export const CATEGORY_RAIL_IMAGE_SOURCES = Object.freeze({
  buffets: '/images/categories/buffets-config-rail.webp',
  armoires: '/images/categories/armoires-config-rail.webp',
  miroirs: '/images/categories/miroirs-config-rail.webp',
  commodes: '/images/categories/commodes-config-rail.webp',
  meubles: '/images/analytics/journey-meubles-illustration-v1.webp',
  assises: '/images/analytics/journey-assises-illustration-v1.webp',
  eclairage: '/images/analytics/journey-eclairage-illustration-v1.webp',
  decorations: '/images/analytics/journey-decorations-illustration-v1.webp',
});

export const GALLERY_HERO_PRESET_ENTRIES = GALLERY_HERO_PRESETS.map(({ preset, objectPosition, mobileObjectPosition }) => ({
  preset,
  objectPosition,
  mobileObjectPosition,
}));

export const resolveGalleryHeroImage = (entry) => {
  if (!entry) return null;
  if (typeof entry === 'string') return { src: entry, objectPosition: 'center center' };

  if (entry.preset) {
    const preset = GALLERY_HERO_PRESETS.find((item) => item.preset === entry.preset);
    if (!preset) return null;
    return {
      ...preset,
      objectPosition: entry.objectPosition || preset.objectPosition || 'center center',
      mobileObjectPosition: entry.mobileObjectPosition || preset.mobileObjectPosition || entry.objectPosition || preset.objectPosition || 'center center',
    };
  }

  if (!entry.src) return null;
  return {
    src: entry.src,
    objectPosition: entry.objectPosition || 'center center',
    mobileObjectPosition: entry.mobileObjectPosition || entry.objectPosition || 'center center',
  };
};

export const KIT_CONFIG = {

  // Marque (utilisé dans le header, SEO, footer)
  brandName:    BRAND_NAME,
  brandTagline: BRAND_TAGLINE,

  // ── SEO ───────────────────────────────────────────────────
  seo: {
    siteTitle:   BRAND_NAME,
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || `Mobilier restauré avec passion — ${BRAND_NAME}.`,
    siteUrl:     process.env.NEXT_PUBLIC_SITE_URL          || '',
    ogImage:     process.env.NEXT_PUBLIC_OG_IMAGE          || '',
    galleryTitle:       `La Galerie — ${BRAND_NAME}`,
    galleryDescription: `Découvrez notre collection de mobilier restauré. Pièces uniques et vente directe.`,
  },

  // ── COLLECTIONS PRODUITS (unifié — une seule collection) ──
  collections: [
    {
      id:           'furniture',         // ID technique (= path Firestore) — NE PAS CHANGER
      label:        'Publications',      // Label unifié
      labelPlural:  'Publications',
      firestorePath: 'furniture',
      heroTaglines: ['Seconde Vie', 'Savoir-Faire', 'Pièce Unique', 'L\'Élégance du Temps.'],
    },
  ],

  // ── CATÉGORIES PRODUITS (filtres galerie + admin) ─────────
  productCategories: [
    // Meubles
    { id: 'armoires',   label: 'LES ARMOIRES',       iconKey: 'mobilier',  group: 'meubles' },
    { id: 'buffets',    label: 'LES BUFFETS',        iconKey: 'mobilier',  group: 'meubles' },
    { id: 'commodes',   label: 'COMMODES & CHEVETS', iconKey: 'mobilier',  group: 'meubles' },
    { id: 'tables',     label: 'LES TABLES',         iconKey: 'tables',    group: 'meubles' },
    // Assises
    { id: 'chaises',    label: 'LES CHAISES',        iconKey: 'assises',   group: 'assises' },
    { id: 'fauteuils',  label: 'LES FAUTEUILS',      iconKey: 'assises',   group: 'assises' },
    { id: 'bancs',      label: 'LES BANCS',          iconKey: 'assises',   group: 'assises' },
    // Éclairage
    { id: 'eclairage',  label: 'ÉCLAIRAGE',          iconKey: 'eclairage', group: 'eclairage' },
    // Décorations
    { id: 'miroirs',    label: 'LES MIROIRS',        iconKey: 'miroirs',   group: 'decorations' },
    { id: 'deco',       label: 'DÉCORATIONS',        iconKey: 'deco',      group: 'decorations' },
  ],

  // ── GROUPES DE CATÉGORIES (pills galerie + pages globales) ─
  categoryGroups: [
    { id: 'meubles',     label: 'MEUBLES',      iconKey: 'mobilier',  subCategories: ['armoires', 'buffets', 'commodes', 'tables'] },
    { id: 'assises',     label: 'LES ASSISES',   iconKey: 'assises',   subCategories: ['chaises', 'fauteuils', 'bancs'] },
    { id: 'eclairage',   label: 'ÉCLAIRAGE',     iconKey: 'eclairage', subCategories: ['eclairage'] },
    { id: 'decorations', label: 'DÉCORATIONS',   iconKey: 'deco',      subCategories: ['miroirs', 'deco'] },
  ],

  // ── ANNÉE DE COLLECTION ────────────────────────────────────
  collectionYear: new Date().getFullYear().toString(),

  adminTabs: [
    { id: 'dashboard',        label: 'Stats'       },
    { id: 'analytics',        label: 'Data'        },
    { id: 'furniture',        label: 'Publication' },  // ✅ Fusionné, label changé (id 'furniture' pour le routing)
    { id: 'inventory',        label: 'Vue Globale' },
    { id: 'studio',           label: 'Studio'      },
    { id: 'homepage',         label: 'Personnalisation' },
    { id: 'orders',           label: 'Ventes'      },
    { id: 'quotes',           label: 'Devis'       },
    { id: 'payment_links',    label: 'Liens de paiement' },
    { id: 'invoices',         label: 'Factures'    },
    { id: 'returns',          label: 'Retours'     },
    { id: 'livraison',        label: 'Livraison'   },
    { id: 'users',            label: 'Clients'     },
    { id: 'ip_manager',       label: 'Sécurité'    },
    { id: 'seo',              label: 'SEO'         },
    { id: 'newsletter',       label: 'Infos'       },
    { id: 'payment_settings', label: 'Paiement'    },
    { id: 'account',          label: 'Mon compte'  },
  ],

  // ── FEATURE FLAGS ─────────────────────────────────────────
  features: {
    // La surface newsletter / jeu promo reste visible pendant la demo.
    // Sa persistance et son envoi seront branches dans une passe dediee.
    newsletter:      true,
    // Les temoignages restent masques tant que leur provenance et leur droit
    // de publication n'ont pas ete confirmes explicitement.
    testimonials:    process.env.NEXT_PUBLIC_CUSTOMER_TESTIMONIALS_VERIFIED === 'true',
    instagramCommunity: HAS_PUBLIC_INSTAGRAM,
    analytics:       true,
    darkMode:        true,
    pwa:             true,
    invoicePdf:      true,
    excelExport:     true,
  },

  // ── MESSAGES UI ────────────────────────────────────────────
  messages: {
    noItemsAvailable: 'Aucun produit disponible pour le moment.',
  },

  // ── SUPPORT / CHAT ────────────────────────────────────────
  support: {
    // Numero WhatsApp au format international sans "+" ni espaces (ex: 33612345678).
    // Laisser vide pour masquer les CTA WhatsApp du chat.
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
    advisorName:    'Anais',
    replyHint:      'Reponse rapide en journee',
  },

  // ── CONTACT PUBLIC ────────────────────────────────────────
  // Valeurs temporaires de demonstration. Les parcours qui envoient réellement
  // un message utilisent uniquement les variables d'environnement confirmees.
  contact: {
    email:          process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'contact@secondevie-marseille.fr',
    phone:          process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+33 6 12 34 56 78',
    address:        process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '',
    addressDetails: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_DETAILS || 'Quartier du Panier, 13002',
    openingHours:   process.env.NEXT_PUBLIC_BUSINESS_OPENING_HOURS || 'Lun - Sam : 10h - 19h',
  },

  // ── SOCIAL LINKS ──────────────────────────────────────────
  socialLinks: {
    instagram: HAS_PUBLIC_INSTAGRAM ? INSTAGRAM_URL : '',
    facebook:  process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
    tiktok:    process.env.NEXT_PUBLIC_TIKTOK_URL || '',
  },

  socialProof: {
    instagramFollowersK: Number.isFinite(INSTAGRAM_FOLLOWERS_K) && INSTAGRAM_FOLLOWERS_K > 0
      ? INSTAGRAM_FOLLOWERS_K
      : null,
  },

  // ── DOCUMENTS JURIDIQUES ─────────────────────────────────
  // Ces URL restent vides tant que les textes n'ont pas ete valides/publies.
  legalLinks: {
    notice:  process.env.NEXT_PUBLIC_LEGAL_NOTICE_URL || '',
    terms:   process.env.NEXT_PUBLIC_TERMS_URL || '',
    privacy: process.env.NEXT_PUBLIC_PRIVACY_URL || '',
    cookies: process.env.NEXT_PUBLIC_COOKIES_URL || '',
  },

  // ── CORS DOMAINS ──────────────────────────────────────────
  corsDomains: [
    'http://localhost:5173',
    'http://localhost:3000',
  ],
};

export default KIT_CONFIG;
