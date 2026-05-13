/**
 * SEO: Sitemap XML dynamique + HTML produit enrichi + Open Graph Meta
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { APP_ID, PRODUCT_COLLECTIONS, getSiteUrl } = require('../../helpers/config');

const db = admin.firestore();
const BRAND_NAME = 'Seconde Vie par Anais';
const DEFAULT_DESCRIPTION = 'Mobilier ancien restauré et pièces uniques autour de Marseille, avec livraison possible en France selon les pièces.';
const GALLERY_TITLE = 'Mobilier ancien restauré autour de Marseille';
const GALLERY_DESCRIPTION = 'Galerie Seconde Vie par Anais : meubles anciens restaurés, pièces uniques et mobilier de caractère, avec livraison autour de Marseille et en France selon les pièces.';
const ABOUT_TITLE = 'À propos de Seconde Vie par Anais';
const ABOUT_DESCRIPTION = 'L’histoire de Seconde Vie par Anais : atelier, restauration de mobilier ancien, sélection de pièces uniques et projet basé autour de Marseille.';
const DEFAULT_IMAGE_PATH = '/images/logoanais.png';
const BASE_HTML_CACHE_TTL_MS = 5 * 60 * 1000;

const CATEGORY_LABELS = {
    armoires: 'Armoires',
    buffets: 'Buffets',
    commodes: 'Commodes et chevets',
    tables: 'Tables',
    chaises: 'Chaises',
    fauteuils: 'Fauteuils',
    bancs: 'Bancs',
    miroirs: 'Miroirs',
    eclairage: 'Éclairage',
    deco: 'Décoration',
    meubles: 'Meubles',
    assises: 'Assises',
    decorations: 'Décorations'
};

const CATEGORY_GROUPS = {
    meubles: ['armoires', 'buffets', 'commodes', 'tables'],
    assises: ['chaises', 'fauteuils', 'bancs'],
    eclairage: ['eclairage'],
    decorations: ['miroirs', 'deco']
};

const LEGACY_CATEGORY_IDS = {
    mobilier: ['armoires', 'buffets', 'commodes', 'tables'],
    assises: ['chaises', 'fauteuils', 'bancs']
};

const CATEGORY_ORDER = [
    'meubles',
    'armoires',
    'buffets',
    'commodes',
    'tables',
    'assises',
    'chaises',
    'fauteuils',
    'bancs',
    'eclairage',
    'decorations',
    'miroirs',
    'deco'
];

const CATEGORY_CONTENT = {
    meubles: {
        h1: 'Meubles anciens restaurés',
        title: 'Meubles anciens restaurés et pièces uniques',
        description: 'Sélection de meubles anciens restaurés autour de Marseille : armoires, buffets, commodes et tables en bois, disponibles en ligne avec livraison.',
        intro: [
            'La galerie meubles rassemble les pièces fortes de Seconde Vie par Anais : armoires anciennes, buffets de campagne, commodes, chevets et tables restaurées avec soin dans notre atelier.',
            'Chaque meuble est choisi pour sa matière, ses proportions et son potentiel. Le bois est nettoyé, poncé, réparé puis protégé pour conserver le charme de l’ancien tout en retrouvant une vraie place dans une maison actuelle.',
            'Autour de Marseille, nous accompagnons les achats avec des solutions de livraison vers la métropole marseillaise, la Provence et le reste de la France selon les pièces.'
        ]
    },
    armoires: {
        h1: 'Armoires anciennes restaurées',
        title: 'Armoires anciennes restaurées',
        description: 'Armoires anciennes restaurées en bois, pièces uniques pour chambre, entrée ou linge de maison. Sélection autour de Marseille, livraison possible.',
        intro: [
            'Nos armoires anciennes restaurées sont sélectionnées pour leur présence, leur qualité de bois et leur capacité à traverser les années sans perdre leur élégance.',
            'Chaque armoire est travaillée avec attention : démontage si nécessaire, ponçage, reprises de structure, finitions protectrices et mise en valeur des détails d’origine.',
            'Ces pièces apportent du rangement, mais aussi une vraie signature dans une chambre, une entrée ou une maison de famille.'
        ]
    },
    buffets: {
        h1: 'Buffets anciens et enfilades restaurées',
        title: 'Buffets anciens restaurés',
        description: 'Buffets anciens, enfilades et meubles de rangement restaurés artisanalement. Pièces uniques en bois pour salon, salle à manger ou entrée.',
        intro: [
            'Les buffets et enfilades restaurés réunissent le côté pratique du rangement et la chaleur du mobilier ancien.',
            'Nous privilégions les lignes intemporelles, les bois de qualité et les meubles capables de devenir le point d’ancrage d’une salle à manger, d’un salon ou d’une entrée.',
            'Chaque pièce est remise en état avec une finition adaptée à son histoire : bois naturel, patine sobre, cire ou protection mate.'
        ]
    },
    commodes: {
        h1: 'Commodes et chevets restaurés',
        title: 'Commodes anciennes et chevets restaurés',
        description: 'Commodes anciennes, chevets et petits rangements restaurés. Mobilier unique pour chambre, entrée ou salon, livraison possible autour de Marseille et en France.',
        intro: [
            'Les commodes et chevets anciens sont des formats faciles à intégrer, tout en gardant le caractère d’une pièce restaurée.',
            'Tiroirs, plateaux, pieds et quincailleries sont contrôlés afin de proposer des meubles beaux, solides et agréables au quotidien.',
            'Selon les arrivages, la sélection mélange bois naturel, finitions peintes, patines douces et détails plus singuliers.'
        ]
    },
    tables: {
        h1: 'Tables anciennes restaurées',
        title: 'Tables anciennes restaurées',
        description: 'Tables anciennes restaurées : tables de ferme, tables de salle à manger et pièces en bois massif remises en valeur artisanalement.',
        intro: [
            'Une table ancienne restaurée garde les traces d’une vie passée tout en devenant un meuble central pour les repas, le travail ou les moments partagés.',
            'Nous portons une attention particulière aux plateaux, aux pieds et à la stabilité pour conserver le charme sans sacrifier l’usage.',
            'Les finitions sont choisies pour protéger le bois et laisser respirer la matière.'
        ]
    },
    assises: {
        h1: 'Assises anciennes restaurées',
        title: 'Chaises, fauteuils et bancs restaurés',
        description: 'Assises anciennes restaurées : chaises, fauteuils et bancs sélectionnés pour leur confort, leur ligne et leur potentiel décoratif.',
        intro: [
            'La sélection d’assises rassemble chaises, fauteuils et bancs anciens ou vintage, choisis pour leur silhouette et leur capacité à réchauffer un intérieur.',
            'Selon les pièces, la restauration peut concerner le bois, l’assise, la protection ou la remise en valeur des détails d’origine.',
            'Ces assises fonctionnent seules en pièce forte ou en composition plus libre autour d’une table.'
        ]
    },
    chaises: {
        h1: 'Chaises anciennes restaurées',
        title: 'Chaises anciennes restaurées',
        description: 'Chaises anciennes restaurées, vendues à l’unité ou en lot selon arrivage. Mobilier durable et pièces de caractère.',
        intro: [
            'Les chaises anciennes restaurées permettent de composer une table vivante, moins standardisée et plus personnelle.',
            'Nous recherchons les structures solides, les lignes intéressantes et les matières capables de supporter un usage quotidien.',
            'Chaque chaise est contrôlée, nettoyée et restaurée selon son état.'
        ]
    },
    fauteuils: {
        h1: 'Fauteuils anciens et vintage restaurés',
        title: 'Fauteuils anciens restaurés',
        description: 'Fauteuils anciens et vintage restaurés pour salon, chambre ou coin lecture. Pièces uniques sélectionnées dans le Sud.',
        intro: [
            'Un fauteuil ancien restauré installe immédiatement une atmosphère : coin lecture, salon, chambre ou bureau.',
            'Nous choisissons les fauteuils pour leur ligne, leur confort potentiel et leur capacité à dialoguer avec des intérieurs contemporains.',
            'Selon les modèles, le travail porte sur le bois, la finition, l’assise ou les détails textiles.'
        ]
    },
    bancs: {
        h1: 'Bancs anciens restaurés',
        title: 'Bancs anciens restaurés',
        description: 'Bancs anciens, bancs de ferme et petites assises restaurées pour entrée, table ou décoration intérieure.',
        intro: [
            'Les bancs anciens sont des pièces simples, utiles et très expressives.',
            'Ils trouvent leur place dans une entrée, au pied d’un lit, autour d’une table ou comme support décoratif.',
            'La restauration met l’accent sur la solidité, la patine et la protection du bois.'
        ]
    },
    eclairage: {
        h1: 'Luminaires anciens et éclairage vintage',
        title: 'Luminaires anciens et éclairage vintage',
        description: 'Luminaires anciens, lampes, suspensions et appliques vintage sélectionnés pour créer une ambiance chaleureuse et singulière.',
        intro: [
            'Les luminaires anciens et vintage ajoutent une présence immédiate à une pièce, même lorsqu’ils sont de petit format.',
            'La sélection peut réunir lampes à poser, suspensions, appliques ou pièces plus décoratives selon les arrivages.',
            'Chaque luminaire est choisi pour sa matière, sa ligne et l’ambiance qu’il peut apporter.'
        ]
    },
    decorations: {
        h1: 'Décoration ancienne et objets singuliers',
        title: 'Décoration ancienne et objets restaurés',
        description: 'Objets de décoration anciens, miroirs, cadres et pièces singulières pour compléter un intérieur avec caractère.',
        intro: [
            'La décoration ancienne permet d’ajouter du relief à un intérieur sans forcément changer tout le mobilier.',
            'Miroirs, cadres, objets et petites pièces sont sélectionnés pour leur charme, leur patine ou leur détail inattendu.',
            'Ces objets créent le lien entre meubles restaurés, souvenirs personnels et décoration contemporaine.'
        ]
    },
    miroirs: {
        h1: 'Miroirs anciens restaurés',
        title: 'Miroirs anciens restaurés',
        description: 'Miroirs anciens restaurés, trumeaux, miroirs dorés, bois ou rotin. Pièces uniques pour entrée, chambre ou salon.',
        intro: [
            'Les miroirs anciens restaurés agrandissent l’espace tout en apportant une vraie présence décorative.',
            'Trumeaux, miroirs à fronton, cadres en bois ou pièces plus sobres sont choisis pour leur forme, leur glace et leur potentiel.',
            'La restauration respecte le charme de l’ancien tout en permettant une installation propre et durable.'
        ]
    },
    deco: {
        h1: 'Objets de décoration anciens',
        title: 'Objets de décoration anciens',
        description: 'Objets de décoration anciens, petites pièces et accessoires sélectionnés pour donner du caractère à un intérieur.',
        intro: [
            'Les objets de décoration anciens apportent la touche finale : une matière, une couleur, une patine ou une histoire.',
            'La sélection évolue selon les trouvailles et complète naturellement les meubles restaurés de la galerie.',
            'Ces petites pièces permettent de personnaliser un intérieur avec douceur et authenticité.'
        ]
    }
};

let baseHtmlCache = {
    siteUrl: '',
    fetchedAt: 0,
    html: ''
};

function escapeXml(str) {
    return String(str || '').replace(/[<>&"']/g, m => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;'
    }[m]));
}

function slugify(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-') || 'produit';
}

function getProductPath(item, id) {
    return `/produit/${slugify(item?.name || item?.title)}-${encodeURIComponent(id)}`;
}

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function stripHtml(str) {
    return String(str || '')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function truncateText(str, max = 160) {
    const clean = stripHtml(str);
    if (clean.length <= max) return clean;
    const sliced = clean.slice(0, max - 1);
    const lastSpace = sliced.lastIndexOf(' ');
    return `${sliced.slice(0, lastSpace > 90 ? lastSpace : sliced.length).trim()}...`;
}

function toAbsoluteUrl(value, siteUrl) {
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    const raw = String(value || '').trim();
    if (!raw) return `${cleanSiteUrl}${DEFAULT_IMAGE_PATH}`;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('//')) return `https:${raw}`;
    if (raw.startsWith('/')) return `${cleanSiteUrl}${raw}`;
    return `${cleanSiteUrl}/${raw.replace(/^\/+/, '')}`;
}

function getProductImages(item, siteUrl) {
    const images = Array.isArray(item?.images) && item.images.length
        ? item.images
        : [item?.imageUrl || item?.thumbnailUrl].filter(Boolean);
    const unique = [...new Set(images.filter(Boolean))];
    return unique.length ? unique.map(src => toAbsoluteUrl(src, siteUrl)) : [toAbsoluteUrl(DEFAULT_IMAGE_PATH, siteUrl)];
}

function getProductPrice(item) {
    if (item?.priceOnRequest) return null;
    const value = item?.currentPrice ?? item?.startingPrice ?? item?.price;
    const price = Number(value);
    return Number.isFinite(price) && price > 0 ? price : null;
}

function isProductAvailable(item) {
    return !item?.sold && (item?.stock === undefined || Number(item.stock) > 0);
}

function formatPriceText(price) {
    if (price === null) return 'Prix sur demande';
    try {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(price);
    } catch (error) {
        return `${price.toFixed(0)} EUR`;
    }
}

function getProductDimensionsText(item) {
    if (item?.dimensions) return stripHtml(item.dimensions);

    const parts = [
        item?.width ? `L ${item.width} cm` : '',
        item?.depth ? `P ${item.depth} cm` : '',
        item?.height ? `H ${item.height} cm` : ''
    ].filter(Boolean);

    return parts.length ? parts.join(' x ') : '';
}

function getCategoryLabel(categoryId) {
    return CATEGORY_LABELS[categoryId] || String(categoryId || 'Mobilier restauré');
}

function getCategoryPath(categoryId) {
    return `/categorie/${encodeURIComponent(String(categoryId || '').trim())}`;
}

function getCategoryPage(categoryId) {
    const cleanId = String(categoryId || '').trim();
    const label = getCategoryLabel(cleanId);
    return CATEGORY_CONTENT[cleanId] || {
        h1: label,
        title: `${label} | Pièces restaurées`,
        description: `Sélection ${label.toLocaleLowerCase('fr-FR')} par ${BRAND_NAME}. Pièces uniques restaurées autour de Marseille avec livraison possible.`,
        intro: [
            `Découvrez notre sélection ${label.toLocaleLowerCase('fr-FR')} restaurée et choisie pour son caractère.`,
            'Chaque pièce est publiée en quantité limitée, avec une attention particulière portée à la matière, à la finition et à l’usage quotidien.'
        ]
    };
}

function isKnownCategoryId(categoryId) {
    return Boolean(CATEGORY_CONTENT[String(categoryId || '').trim()]);
}

function getMatchingCategoryIds(categoryId) {
    const cleanId = String(categoryId || '').trim();
    const ids = new Set(CATEGORY_GROUPS[cleanId] || [cleanId]);

    Object.entries(LEGACY_CATEGORY_IDS).forEach(([legacyId, children]) => {
        if ([...ids].some(id => children.includes(id))) ids.add(legacyId);
    });

    return [...ids].filter(Boolean);
}

function getProductDescription(item, categoryLabel) {
    const productName = item?.name || item?.title || 'Pièce unique restaurée';
    return truncateText(
        item?.metaDescription ||
        item?.seoDescription ||
        item?.description ||
        `${productName}, pièce issue de la catégorie ${categoryLabel.toLocaleLowerCase('fr-FR')} chez ${BRAND_NAME}. Disponible en ligne.`,
        165
    );
}

function sanitizeProductId(value) {
    return String(value || '').replace(/[^\w.-]/g, '');
}

function extractProductIdFromRequest(req, siteUrl) {
    const requestUrl = new URL(req.originalUrl || req.url || '/', siteUrl);
    const legacyProductId = requestUrl.searchParams.get('product');
    if (legacyProductId) return sanitizeProductId(legacyProductId);

    const match = requestUrl.pathname.match(/^\/produit\/([^/?#]+)\/?$/);
    if (!match) return '';

    const segment = decodeURIComponent(match[1]);
    const separatorIndex = segment.lastIndexOf('-');
    return sanitizeProductId(separatorIndex >= 0 ? segment.slice(separatorIndex + 1) : segment);
}

async function findPublishedProduct(productId) {
    if (!productId) return null;

    for (const col of PRODUCT_COLLECTIONS) {
        const docSnap = await db.doc(`artifacts/${APP_ID}/public/data/${col}/${productId}`).get();
        if (!docSnap.exists) continue;

        const data = docSnap.data();
        if (data.status && data.status !== 'published') return null;
        return { id: docSnap.id, collectionName: col, data };
    }

    return null;
}

async function findPublishedCategoryProducts(categoryId) {
    const matchingIds = getMatchingCategoryIds(categoryId);
    const items = [];

    for (const col of PRODUCT_COLLECTIONS) {
        const snap = await db.collection(`artifacts/${APP_ID}/public/data/${col}`)
            .where('status', '==', 'published')
            .get();

        snap.forEach(doc => {
            const data = doc.data();
            if (!matchingIds.includes(data.category)) return;
            items.push({ id: doc.id, collectionName: col, data });
        });
    }

    return items.sort((a, b) => {
        const aTime = a.data.createdAt?.toMillis?.() || 0;
        const bTime = b.data.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
    });
}

function fallbackSpaHtml(siteUrl) {
    return `<!doctype html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="theme-color" content="#1a120b">
</head>
<body>
    <div id="root"></div>
    <noscript>JavaScript est requis pour consulter ${escapeHtml(BRAND_NAME)}.</noscript>
</body>
</html>`;
}

async function getBaseHtml(siteUrl) {
    const now = Date.now();
    if (
        baseHtmlCache.html &&
        baseHtmlCache.siteUrl === siteUrl &&
        now - baseHtmlCache.fetchedAt < BASE_HTML_CACHE_TTL_MS
    ) {
        return baseHtmlCache.html;
    }

    const indexUrl = `${siteUrl.replace(/\/$/, '')}/index.html`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    try {
        const response = await fetch(indexUrl, {
            signal: controller.signal,
            headers: { 'User-Agent': 'SecondeVieSEO/1.0' }
        });
        if (!response.ok) throw new Error(`Index HTML fetch failed: ${response.status}`);

        const html = await response.text();
        if (!/<\/head>/i.test(html) || !/id=["']root["']/i.test(html)) {
            throw new Error('Index HTML shape is invalid');
        }

        baseHtmlCache = { siteUrl, fetchedAt: now, html };
        return html;
    } catch (error) {
        console.warn('SEO base HTML fallback:', error.message);
        return fallbackSpaHtml(siteUrl);
    } finally {
        clearTimeout(timeout);
    }
}

function removeManagedSeoTags(html) {
    return html
        .replace(/<title>[\s\S]*?<\/title>/i, '')
        .replace(/\s*<link\s+[^>]*rel=["']canonical["'][^>]*>\s*/gi, '\n')
        .replace(/\s*<meta\s+[^>]*(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+|product:[^"']+)["'][^>]*>\s*/gi, '\n')
        .replace(/\s*<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '\n');
}

function safeJsonLd(data) {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}

function buildHomeHead(siteUrl) {
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    const canonicalUrl = `${cleanSiteUrl}/`;
    const image = toAbsoluteUrl(DEFAULT_IMAGE_PATH, siteUrl);
    const title = `${GALLERY_TITLE} | ${BRAND_NAME}`;
    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': `${canonicalUrl}#organization`,
                name: BRAND_NAME,
                url: canonicalUrl,
                logo: image,
                image,
                description: DEFAULT_DESCRIPTION,
                areaServed: [
                    { '@type': 'City', name: 'Marseille' },
                    { '@type': 'Country', name: 'France' }
                ],
                knowsAbout: [
                    'mobilier ancien restauré',
                    'meubles vintage',
                    'restauration de meubles',
                    'livraison de mobilier'
                ]
            },
            {
                '@type': 'WebSite',
                '@id': `${canonicalUrl}#website`,
                url: canonicalUrl,
                name: BRAND_NAME,
                description: DEFAULT_DESCRIPTION,
                inLanguage: 'fr-FR',
                publisher: { '@id': `${canonicalUrl}#organization` }
            },
            {
                '@type': 'CollectionPage',
                '@id': `${canonicalUrl}#webpage`,
                url: canonicalUrl,
                name: GALLERY_TITLE,
                description: GALLERY_DESCRIPTION,
                isPartOf: { '@id': `${canonicalUrl}#website` },
                about: { '@id': `${canonicalUrl}#organization` }
            }
        ]
    };

    return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(GALLERY_DESCRIPTION)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:site_name" content="${escapeHtml(BRAND_NAME)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(GALLERY_DESCRIPTION)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(GALLERY_DESCRIPTION)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <script type="application/ld+json">${safeJsonLd(graph)}</script>`;
}

function buildHomeStaticContent(siteUrl) {
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    return `
<noscript>
    <main id="seo-home-content">
        <h1>Mobilier ancien restauré autour de Marseille</h1>
        <p>Seconde Vie par Anais présente une galerie de meubles anciens restaurés et de pièces uniques, avec une approche artisanale et une livraison possible autour de Marseille puis en France selon les pièces.</p>
        <p>La page principale rassemble les catégories, les produits disponibles et les entrées vers les fiches détaillées.</p>
        <nav aria-label="Pages principales">
            <a href="${escapeHtml(`${cleanSiteUrl}/a-propos`)}">À propos</a> /
            <a href="${escapeHtml(`${cleanSiteUrl}/categorie/meubles`)}">Meubles restaurés</a> /
            <a href="${escapeHtml(`${cleanSiteUrl}/categorie/buffets`)}">Buffets anciens</a> /
            <a href="${escapeHtml(`${cleanSiteUrl}/categorie/commodes`)}">Commodes anciennes</a>
        </nav>
    </main>
</noscript>`;
}

function buildAboutHead(siteUrl) {
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    const canonicalUrl = `${cleanSiteUrl}/a-propos`;
    const image = toAbsoluteUrl(DEFAULT_IMAGE_PATH, siteUrl);
    const title = `${ABOUT_TITLE} | ${BRAND_NAME}`;
    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': `${cleanSiteUrl}/#organization`,
                name: BRAND_NAME,
                url: `${cleanSiteUrl}/`,
                logo: image,
                image,
                description: DEFAULT_DESCRIPTION,
                areaServed: [
                    { '@type': 'City', name: 'Marseille' },
                    { '@type': 'Country', name: 'France' }
                ]
            },
            {
                '@type': 'AboutPage',
                '@id': `${canonicalUrl}#webpage`,
                url: canonicalUrl,
                name: ABOUT_TITLE,
                description: ABOUT_DESCRIPTION,
                inLanguage: 'fr-FR',
                isPartOf: {
                    '@type': 'WebSite',
                    name: BRAND_NAME,
                    url: `${cleanSiteUrl}/`
                },
                about: { '@id': `${cleanSiteUrl}/#organization` }
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${canonicalUrl}#breadcrumb`,
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Accueil',
                        item: `${cleanSiteUrl}/`
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: 'À propos',
                        item: canonicalUrl
                    }
                ]
            }
        ]
    };

    return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(ABOUT_DESCRIPTION)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:site_name" content="${escapeHtml(BRAND_NAME)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(ABOUT_DESCRIPTION)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(ABOUT_DESCRIPTION)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <script type="application/ld+json">${safeJsonLd(graph)}</script>`;
}

function buildAboutStaticContent(siteUrl) {
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    return `
<noscript>
    <main id="seo-about-content">
        <nav aria-label="Fil d'Ariane">
            <a href="${escapeHtml(`${cleanSiteUrl}/`)}">Accueil</a> / <span>À propos</span>
        </nav>
        <h1>À propos de Seconde Vie par Anais</h1>
        <p>Seconde Vie par Anais restaure et sélectionne du mobilier ancien et des pièces uniques, avec un ancrage éditorial centré autour de Marseille tant que les informations administratives définitives restent à confirmer.</p>
        <p>Cette page est conçue pour accueillir ensuite les informations exactes de l’atelier, de la cliente, de la zone de service, des photos, du savoir-faire et des preuves de confiance.</p>
        <p><a href="${escapeHtml(`${cleanSiteUrl}/`)}">Voir la galerie</a></p>
    </main>
</noscript>`;
}

function buildProductHead(productRecord, siteUrl) {
    const { id, data: item } = productRecord;
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    const productName = stripHtml(item.name || item.title || 'Pièce unique restaurée');
    const categoryLabel = getCategoryLabel(item.category);
    const description = getProductDescription(item, categoryLabel);
    const canonicalPath = getProductPath(item, id);
    const canonicalUrl = `${cleanSiteUrl}${canonicalPath}`;
    const images = getProductImages(item, siteUrl);
    const price = getProductPrice(item);
    const isAvailable = isProductAvailable(item);
    const availabilityUrl = isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
    const availabilityOg = isAvailable ? 'instock' : 'oos';
    const title = `${productName} | ${BRAND_NAME}`;

    const offer = {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'EUR',
        availability: availabilityUrl,
        itemCondition: 'https://schema.org/RefurbishedCondition',
        seller: {
            '@type': 'Organization',
            name: BRAND_NAME
        }
    };
    if (price !== null) offer.price = price.toFixed(2);

    const productSchema = {
        '@type': 'Product',
        '@id': `${canonicalUrl}#product`,
        name: productName,
        description,
        image: images,
        sku: id,
        category: categoryLabel,
        brand: {
            '@type': 'Brand',
            name: BRAND_NAME
        },
        offers: offer
    };

    if (item.material) productSchema.material = stripHtml(item.material);
    if (item.color) productSchema.color = stripHtml(item.color);
    if (item.dimensions || item.width || item.height) {
        productSchema.additionalProperty = [{
            '@type': 'PropertyValue',
            name: 'Dimensions',
            value: stripHtml(item.dimensions || [item.width, item.depth, item.height].filter(Boolean).join(' x '))
        }];
    }

    const breadcrumbItems = [
        {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: `${cleanSiteUrl}/`
        }
    ];

    if (item.category) {
        breadcrumbItems.push({
            '@type': 'ListItem',
            position: 2,
            name: categoryLabel,
            item: `${cleanSiteUrl}/categorie/${encodeURIComponent(item.category)}`
        });
    }

    breadcrumbItems.push({
        '@type': 'ListItem',
        position: breadcrumbItems.length + 1,
        name: productName,
        item: canonicalUrl
    });

    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            productSchema,
            {
                '@type': 'BreadcrumbList',
                '@id': `${canonicalUrl}#breadcrumb`,
                itemListElement: breadcrumbItems
            }
        ]
    };

    const priceMeta = price !== null ? `
    <meta property="product:price:amount" content="${price.toFixed(2)}">
    <meta property="product:price:currency" content="EUR">
    <meta property="product:availability" content="${availabilityOg}">` : `
    <meta property="product:availability" content="${availabilityOg}">`;

    return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:site_name" content="${escapeHtml(BRAND_NAME)}">
    <meta property="og:type" content="product">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(images[0])}">
    <meta property="og:image:alt" content="${escapeHtml(productName)}">${priceMeta}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(images[0])}">
    <script type="application/ld+json">${safeJsonLd(graph)}</script>`;
}

function buildProductStaticContent(productRecord, siteUrl) {
    const { id, data: item } = productRecord;
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    const productName = stripHtml(item.name || item.title || 'Pièce unique restaurée');
    const categoryLabel = getCategoryLabel(item.category);
    const description = stripHtml(item.description || getProductDescription(item, categoryLabel));
    const canonicalPath = getProductPath(item, id);
    const images = getProductImages(item, siteUrl);
    const price = getProductPrice(item);
    const dimensions = getProductDimensionsText(item);
    const isAvailable = isProductAvailable(item);

    const detailRows = [
        ['Prix', formatPriceText(price)],
        ['Disponibilité', isAvailable ? 'Disponible' : 'Indisponible'],
        ['Catégorie', categoryLabel],
        ['Matière', item.material ? stripHtml(item.material) : ''],
        ['Couleur', item.color ? stripHtml(item.color) : ''],
        ['Dimensions', dimensions],
        ['Référence', id]
    ].filter(([, value]) => value);

    const categoryLink = item.category
        ? `<a href="${escapeHtml(`${cleanSiteUrl}${getCategoryPath(item.category)}`)}">${escapeHtml(categoryLabel)}</a> / `
        : '';

    return `
<noscript>
    <main id="seo-product-content">
        <nav aria-label="Fil d'Ariane">
            <a href="${escapeHtml(`${cleanSiteUrl}/`)}">Accueil</a> / ${categoryLink}<span>${escapeHtml(productName)}</span>
        </nav>
        <article>
            <h1>${escapeHtml(productName)}</h1>
            <figure>
                <img src="${escapeHtml(images[0])}" alt="${escapeHtml(productName)}" loading="eager" style="max-width:100%;height:auto;">
            </figure>
            <p>${escapeHtml(description)}</p>
            <dl>
                ${detailRows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('\n                ')}
            </dl>
            <p>Cette pièce est référencée dans la galerie Seconde Vie par Anais, avec livraison possible autour de Marseille et en France selon les pièces.</p>
            <p>
                <a href="${escapeHtml(`${cleanSiteUrl}${canonicalPath}`)}">Voir la fiche produit</a> /
                <a href="${escapeHtml(`${cleanSiteUrl}/`)}">Retour à la galerie</a> /
                <a href="${escapeHtml(`${cleanSiteUrl}/a-propos`)}">À propos de l’atelier</a>
            </p>
        </article>
    </main>
</noscript>`;
}

function buildFallbackHead(siteUrl, requestPath, noindex = false) {
    const canonicalUrl = `${siteUrl.replace(/\/$/, '')}${requestPath || '/'}`;
    return `
    <title>${escapeHtml(BRAND_NAME)}</title>
    <meta name="description" content="${escapeHtml(DEFAULT_DESCRIPTION)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    ${noindex ? '<meta name="robots" content="noindex, follow">' : ''}
    <meta property="og:site_name" content="${escapeHtml(BRAND_NAME)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:title" content="${escapeHtml(BRAND_NAME)}">
    <meta property="og:description" content="${escapeHtml(DEFAULT_DESCRIPTION)}">
    <meta property="og:image" content="${escapeHtml(toAbsoluteUrl(DEFAULT_IMAGE_PATH, siteUrl))}">
    <meta name="twitter:card" content="summary_large_image">`;
}

function buildCategoryHead(categoryId, products, siteUrl) {
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    const page = getCategoryPage(categoryId);
    const canonicalUrl = `${cleanSiteUrl}${getCategoryPath(categoryId)}`;
    const title = `${page.title} | ${BRAND_NAME}`;
    const image = products[0] ? getProductImages(products[0].data, siteUrl)[0] : toAbsoluteUrl(DEFAULT_IMAGE_PATH, siteUrl);
    const itemList = products.slice(0, 24).map((product, index) => {
        const item = product.data;
        return {
            '@type': 'ListItem',
            position: index + 1,
            url: `${cleanSiteUrl}${getProductPath(item, product.id)}`,
            name: stripHtml(item.name || item.title || `Produit ${index + 1}`)
        };
    });

    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                '@id': `${canonicalUrl}#webpage`,
                url: canonicalUrl,
                name: page.h1,
                description: page.description,
                isPartOf: {
                    '@type': 'WebSite',
                    name: BRAND_NAME,
                    url: `${cleanSiteUrl}/`
                }
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${canonicalUrl}#breadcrumb`,
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Accueil',
                        item: `${cleanSiteUrl}/`
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: page.h1,
                        item: canonicalUrl
                    }
                ]
            },
            {
                '@type': 'ItemList',
                '@id': `${canonicalUrl}#items`,
                numberOfItems: products.length,
                itemListElement: itemList
            }
        ]
    };

    return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:site_name" content="${escapeHtml(BRAND_NAME)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(page.description)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(page.description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <script type="application/ld+json">${safeJsonLd(graph)}</script>`;
}

function buildCategoryStaticContent(categoryId, products, siteUrl) {
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    const page = getCategoryPage(categoryId);
    const productLinks = products.slice(0, 12).map(product => {
        const item = product.data;
        const productName = stripHtml(item.name || item.title || 'Pièce restaurée');
        const price = getProductPrice(item);
        const priceText = price !== null ? ` - ${price.toFixed(0)} EUR` : '';
        return `<li><a href="${escapeHtml(getProductPath(item, product.id))}">${escapeHtml(productName)}</a>${escapeHtml(priceText)}</li>`;
    }).join('');

    return `
<noscript>
    <main id="seo-category-content">
        <nav aria-label="Fil d'Ariane">
            <a href="/">Accueil</a> / <span>${escapeHtml(page.h1)}</span>
        </nav>
        <h1>${escapeHtml(page.h1)}</h1>
        ${page.intro.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('\n        ')}
        <p>${products.length} pièce${products.length > 1 ? 's' : ''} actuellement référencée${products.length > 1 ? 's' : ''} dans cette catégorie.</p>
        ${productLinks ? `<h2>Pièces disponibles</h2><ul>${productLinks}</ul>` : '<p>Les pièces de cette catégorie arrivent au fil des restaurations et des trouvailles atelier.</p>'}
        <p><a href="${escapeHtml(`${cleanSiteUrl}/`)}">Voir toute la galerie Seconde Vie par Anais</a></p>
    </main>
</noscript>`;
}

function injectHead(html, managedHead) {
    const cleaned = removeManagedSeoTags(html);
    if (/<head[^>]*>/i.test(cleaned)) {
        return cleaned.replace(/<head[^>]*>/i, match => `${match}\n${managedHead}\n`);
    }
    return cleaned;
}

function injectBodyStart(html, bodyContent) {
    if (!bodyContent) return html;
    if (/<body[^>]*>/i.test(html)) {
        return html.replace(/<body[^>]*>/i, match => `${match}\n${bodyContent}\n`);
    }
    return html;
}

// --- HOME / GALLERY HTML META INJECTION ---
exports.homeMeta = functions.https.onRequest(async (req, res) => {
    const SITE_URL = getSiteUrl();
    try {
        const baseHtml = await getBaseHtml(SITE_URL);
        const withHead = injectHead(baseHtml, buildHomeHead(SITE_URL));
        const withBody = injectBodyStart(withHead, buildHomeStaticContent(SITE_URL));

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).send(withBody);
    } catch (error) {
        console.error('Home Meta Error:', error);
        const baseHtml = await getBaseHtml(SITE_URL);
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.status(200).send(injectHead(baseHtml, buildFallbackHead(SITE_URL, '/')));
    }
});

// --- ABOUT HTML META INJECTION ---
exports.aboutMeta = functions.https.onRequest(async (req, res) => {
    const SITE_URL = getSiteUrl();
    try {
        const baseHtml = await getBaseHtml(SITE_URL);
        const withHead = injectHead(baseHtml, buildAboutHead(SITE_URL));
        const withBody = injectBodyStart(withHead, buildAboutStaticContent(SITE_URL));

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).send(withBody);
    } catch (error) {
        console.error('About Meta Error:', error);
        const baseHtml = await getBaseHtml(SITE_URL);
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.status(200).send(injectHead(baseHtml, buildFallbackHead(SITE_URL, '/a-propos')));
    }
});

// --- SITEMAP XML ---
exports.sitemap = functions.https.onRequest(async (req, res) => {
    const SITE_URL = getSiteUrl();
    try {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
        <loc>${SITE_URL}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${SITE_URL}/a-propos</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;

        CATEGORY_ORDER.forEach(categoryId => {
            const priority = CATEGORY_GROUPS[categoryId] ? '0.8' : '0.75';
            xml += `
    <url>
        <loc>${escapeXml(`${SITE_URL}${getCategoryPath(categoryId)}`)}</loc>
        <changefreq>weekly</changefreq>
        <priority>${priority}</priority>
    </url>`;
        });

        for (const colName of PRODUCT_COLLECTIONS) {
            const snap = await db.collection(`artifacts/${APP_ID}/public/data/${colName}`).get();
            snap.forEach(doc => {
                const item = doc.data();
                if (item.status !== 'published') return;
                const lastMod = item.updatedAt?.toDate?.()?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0];
                const imgTag = item.images?.[0] ? `
        <image:image>
            <image:loc>${escapeXml(item.images[0])}</image:loc>
            <image:title>${escapeXml(item.name)}</image:title>
        </image:image>` : '';

                xml += `
    <url>
        <loc>${escapeXml(`${SITE_URL}${getProductPath(item, doc.id)}`)}</loc>
        <lastmod>${lastMod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>${imgTag}
    </url>`;
            });
        }

        xml += `
</urlset>`;

        res.set('Content-Type', 'text/xml');
        res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        res.status(200).send(xml);
    } catch (error) {
        console.error("Sitemap Error:", error);
        res.status(500).send("Error generating sitemap");
    }
});

// --- PRODUCT HTML META INJECTION ---
exports.productMeta = functions.https.onRequest(async (req, res) => {
    const SITE_URL = getSiteUrl();
    const requestUrl = new URL(req.originalUrl || req.url || '/', SITE_URL);
    const requestPath = requestUrl.pathname;

    try {
        const productId = extractProductIdFromRequest(req, SITE_URL);
        const baseHtml = await getBaseHtml(SITE_URL);
        const productRecord = await findPublishedProduct(productId);

        if (!productRecord) {
            res.set('Content-Type', 'text/html; charset=utf-8');
            res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
            res.set('X-Robots-Tag', 'noindex, follow');
            res.status(404).send(injectHead(baseHtml, buildFallbackHead(SITE_URL, requestPath, true)));
            return;
        }

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
        const withHead = injectHead(baseHtml, buildProductHead(productRecord, SITE_URL));
        const withBody = injectBodyStart(withHead, buildProductStaticContent(productRecord, SITE_URL));
        res.status(200).send(withBody);
    } catch (error) {
        console.error('Product Meta Error:', error);
        const baseHtml = await getBaseHtml(SITE_URL);
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.set('X-Robots-Tag', 'noindex, follow');
        res.status(503).send(injectHead(baseHtml, buildFallbackHead(SITE_URL, requestPath, true)));
    }
});

// --- CATEGORY HTML META INJECTION ---
exports.categoryMeta = functions.https.onRequest(async (req, res) => {
    const SITE_URL = getSiteUrl();
    const requestUrl = new URL(req.originalUrl || req.url || '/', SITE_URL);
    const requestPath = requestUrl.pathname;
    const match = requestPath.match(/^\/categorie\/([^/?#]+)\/?$/);
    const categoryId = match ? decodeURIComponent(match[1]) : '';

    try {
        const baseHtml = await getBaseHtml(SITE_URL);

        if (!categoryId || !isKnownCategoryId(categoryId)) {
            res.set('Content-Type', 'text/html; charset=utf-8');
            res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
            res.set('X-Robots-Tag', 'noindex, follow');
            res.status(404).send(injectHead(baseHtml, buildFallbackHead(SITE_URL, requestPath, true)));
            return;
        }

        const products = await findPublishedCategoryProducts(categoryId);
        const withHead = injectHead(baseHtml, buildCategoryHead(categoryId, products, SITE_URL));
        const withBody = injectBodyStart(withHead, buildCategoryStaticContent(categoryId, products, SITE_URL));

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).send(withBody);
    } catch (error) {
        console.error('Category Meta Error:', error);
        const baseHtml = await getBaseHtml(SITE_URL);
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.set('X-Robots-Tag', 'noindex, follow');
        res.status(503).send(injectHead(baseHtml, buildFallbackHead(SITE_URL, requestPath, true)));
    }
});

exports.shareMeta = functions.https.onRequest(async (req, res) => {
    const SITE_URL = getSiteUrl();
    const rawProductId = req.query.product || '';
    const productId = rawProductId.replace(/[^a-zA-Z0-9_-]/g, '');

    let title = "Ma Boutique";
    let desc = "Découvrez nos collections";
    let img = `${SITE_URL}/assets/logo.png`;
    let productPath = productId ? `/produit/produit-${encodeURIComponent(productId)}` : '/';

    if (productId) {
        try {
            // Try all collections
            for (const col of PRODUCT_COLLECTIONS) {
                const docSnap = await db.doc(`artifacts/${APP_ID}/public/data/${col}/${productId}`).get();
                if (docSnap.exists) {
                    const data = docSnap.data();
                    title = data.name || title;
                    desc = (data.description || desc).substring(0, 160);
                    img = data.images?.[0] || img;
                    productPath = getProductPath(data, productId);
                    break;
                }
            }
        } catch (e) { }
    }

    const html = `
    <!doctype html>
    <head>
        <title>${escapeHtml(title)}</title>
        <meta property="og:title" content="${escapeHtml(title)}">
        <meta property="og:description" content="${escapeHtml(desc)}">
        <meta property="og:image" content="${escapeHtml(img)}">
        <meta property="og:url" content="${escapeHtml(`${SITE_URL}${productPath}`)}">
        <meta name="twitter:card" content="summary_large_image">
    </head>
    <body>
        <script>window.location.href = '${escapeHtml(productPath)}';</script>
    </body>`;

    res.set('Content-Type', 'text/html');
    res.status(200).send(html);
});
