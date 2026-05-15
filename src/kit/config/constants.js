/**
 * ============================================================
 * KIT_CONFIG — Configuration centralisée du kit
 * ============================================================
 * Personnalisation Seconde Vie par Anais
 */

// ── MARQUE ────────────────────────────────────────────────────
const BRAND_NAME    = process.env.NEXT_PUBLIC_BRAND_NAME    || 'Seconde Vie';
const BRAND_TAGLINE = process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'par Anais';

export const GALLERY_HERO_PRESETS = [
  { preset: 'imagehero/1.webp', src: '/images/imagehero/1.webp', objectPosition: 'center center', mobileObjectPosition: '54% center' },
  { preset: 'imagehero/2.webp', src: '/images/imagehero/2.webp', objectPosition: 'center center', mobileObjectPosition: '56% center' },
  { preset: 'imagehero/3.webp', src: '/images/imagehero/3.webp', objectPosition: 'center center', mobileObjectPosition: '57% center' },
  { preset: 'imagehero/4.webp', src: '/images/imagehero/4.webp', objectPosition: 'center center', mobileObjectPosition: '51% center' },
];

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
    { id: 'livraison',        label: 'Livraison'   },
    { id: 'users',            label: 'Clients'     },
    { id: 'ip_manager',       label: 'Sécurité'    },
    { id: 'seo',              label: 'SEO'         },
    { id: 'newsletter',       label: 'Infos'       },
    { id: 'payment_settings', label: 'Paiement'    },
    { id: 'maintenance',      label: 'Maintenance' },
    { id: 'performance_study', label: 'Etude Perf' },
  ],

  // ── FEATURE FLAGS ─────────────────────────────────────────
  features: {
    newsletter:      true,
    analytics:       true,
    comments:        true,
    darkMode:        true,
    threeBackground: false,
    pwa:             true,
    invoicePdf:      true,
    excelExport:     true,
  },

  // ── MESSAGES UI ────────────────────────────────────────────
  messages: {
    noItemsAvailable: 'Aucun produit disponible pour le moment.',
  },

  // ── SOCIAL LINKS ──────────────────────────────────────────
  socialLinks: {
    instagram: '',
    facebook:  '',
    tiktok:    '',
  },

  // ── CORS DOMAINS ──────────────────────────────────────────
  corsDomains: [
    'http://localhost:5173',
    'http://localhost:3000',
  ],
};

export default KIT_CONFIG;
