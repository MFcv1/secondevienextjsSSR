import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Boxes,
  Check,
  Copy,
  FileCheck,
  Gauge,
  GitBranch,
  Image as ImageIcon,
  Layers3,
  Link as LinkIcon,
  Network,
  ShieldCheck,
  Smartphone,
  Sparkles,
  SplitSquareHorizontal,
} from 'lucide-react';
import SEO from '../shared/SEO';

const chapters = Object.freeze([
  { id: 'decision', no: '01', title: 'Decision cadre', kicker: 'React ou autre structure' },
  { id: 'current-project', no: '02', title: 'Seconde Vie', kicker: 'Audit du cas type' },
  { id: 'since-v217', no: '03', title: 'Depuis v21.7', kicker: 'Ce qui change vraiment' },
  { id: 'roadmap', no: '04', title: 'Roadmap', kicker: 'Plan de travail valide' },
  { id: 'frameworks', no: '05', title: 'Frameworks', kicker: 'Comparaison pratique' },
  { id: 'images', no: '06', title: 'Images', kicker: 'Pipeline fluide' },
  { id: 'routing-data', no: '07', title: 'Routes et data', kicker: 'Partager la charge' },
  { id: 'mobile', no: '08', title: 'Mobile', kicker: 'Scroll, decode, paint' },
  { id: 'detail-flow', no: '09', title: 'Produit', kicker: 'Effets type Insta' },
  { id: 'guardrails', no: '10', title: 'Garde-fous', kicker: 'Ne pas casser v21.7' },
  { id: 'target', no: '11', title: 'Architecture cible', kicker: 'Compartiments de charge' },
  { id: 'next-ssr', no: '12', title: 'Next SSR', kicker: 'Optimisation du clone' },
  { id: 'migration', no: '13', title: 'Plan de migration', kicker: 'Sans tout jeter' },
  { id: 'checklist', no: '14', title: 'Checklist projet', kicker: 'Gate avant livraison' },
  { id: 'sources', no: '15', title: 'Sources', kicker: 'Docs officielles' },
]);

const frameworkRows = Object.freeze([
  {
    name: 'React + Vite SPA',
    verdict: 'Bon pour continuer Seconde Vie',
    score: '7/10',
    fit: 'Admin, checkout, galerie interactive et migration minimale.',
    strengths: [
      'Vite code-split deja les imports dynamiques et precharge les chunks directs.',
      'React.lazy est deja utilise sur les grandes vues.',
      'Le controle mobile fin reste plus simple en SPA qu avec une migration lourde.',
    ],
    limits: [
      'Premier rendu public depend du JS et des effets client.',
      'Pas d optimizer image natif pour images Firebase distantes.',
      'Plus le routeur grossit, plus les etats globaux peuvent se marcher dessus.',
    ],
  },
  {
    name: 'Next.js App Router',
    verdict: 'Meilleur choix React pour prochains sites catalogue',
    score: '9/10',
    fit: 'Marketplace publique image-heavy, SEO, pages produit partageables, rendu serveur.',
    strengths: [
      'Image component: tailles adaptees, formats modernes, lazy loading, stabilite CLS.',
      'SSR/SSG et cache serveur reduisent le travail initial du navigateur.',
      'App Router permet de garder les interactions en client components.',
    ],
    limits: [
      'Migration Firebase client vers loaders/server actions a cadrer.',
      'L optimizer image doit etre compatible avec l hebergement choisi.',
      'Risque de complexite si tout devient server/client sans conventions strictes.',
    ],
  },
  {
    name: 'Astro',
    verdict: 'Excellent pour sites vitrine/catalogue tres statiques',
    score: '8/10',
    fit: 'Pages publiques majoritairement lues, avec petites iles interactives.',
    strengths: [
      'HTML statique par defaut, hydratation seulement des iles necessaires.',
      'Tres bon pour separer hero, catalogue, footer, carrousel, filtres.',
      'Peut embarquer React uniquement la ou c est utile.',
    ],
    limits: [
      'Moins naturel pour une experience marketplace tres applicative.',
      'Etat partage entre iles a concevoir explicitement.',
      'Admin et checkout restent probablement plus confortables en React complet.',
    ],
  },
  {
    name: 'React Router framework / Remix',
    verdict: 'Bon compromis React data-first',
    score: '8/10',
    fit: 'React avec loaders, routes modulees, code splitting automatique par URL.',
    strengths: [
      'Les modules de route deviennent des entrees bundle separees.',
      'Les loaders evitent les cascades fetch apres rendu.',
      'Les transitions peuvent charger data, CSS et JS en parallele.',
    ],
    limits: [
      'Moins d aide image cle en main que Next.',
      'Demande une refonte de la logique app.jsx vers route modules.',
      'Le benefice depend de loaders serveur bien ecrits.',
    ],
  },
  {
    name: 'SvelteKit',
    verdict: 'Tres performant, mais changement d equipe mental',
    score: '7/10',
    fit: 'Nouveaux projets si vous acceptez de quitter React.',
    strengths: [
      'Code splitting, preloading, request coalescing et prerender par route.',
      'Svelte produit peu de runtime client.',
      'enhanced-img couvre formats, tailles, dimensions et EXIF pour assets locaux.',
    ],
    limits: [
      'Reecriture complete des composants React existants.',
      'Ecosysteme et patterns differents.',
      'Images distantes demandent quand meme un CDN ou service image.',
    ],
  },
  {
    name: 'Nuxt / Vue',
    verdict: 'Solide, mais pas prioritaire ici',
    score: '6/10',
    fit: 'Pertinent si le prochain projet part sur Vue des le depart.',
    strengths: [
      'Nuxt Image apporte une couche image mature.',
      'SSR/SSG et routing fichier sont robustes.',
      'Bon pour equipes Vue.',
    ],
    limits: [
      'Aucun avantage clair justifiant de quitter React dans votre contexte.',
      'Migration plus couteuse que Next ou React Router.',
      'Les bugs observes venaient surtout du pipeline image/scroll, pas de React seul.',
    ],
  },
]);

const currentFindings = Object.freeze([
  {
    id: 'SV-PERF-0001',
    status: 'verified',
    title: 'React n est pas la cause principale des bugs images observes.',
    source: 'src/utils/imageUtils.js + src/kit/marketplace/ProductDetailShellIsland.jsx',
    summary:
      'Le projet a deja corrige les vrais points durs: variantes WebP, srcset, staging mobile, ratio mesure et clipping stable. Ces problemes auraient existe aussi dans un autre framework si le pipeline image restait incomplet.',
    evidence: [
      'PRODUCT_IMAGE_VARIANT_SPECS cree thumb/card/medium/large/full.',
      'ProductCard utilise srcSet + sizes + decoding async + priorite sur les premieres cartes.',
      'ProductDetailShellIsland porte maintenant le media interactif de la route produit Next native.',
    ],
    engineering: [
      'Garder React est defendable pour Seconde Vie a court terme.',
      'Pour un nouveau projet public catalogue, Next.js reduira plus de risques par defaut.',
      'La vraie regle est: metadata image avant rendu, pas correction visuelle apres paint.',
    ],
  },
  {
    id: 'SV-PERF-0002',
    status: 'verified',
    title: 'Le routeur applicatif global a ete supprime.',
    source: 'app routes + route-specific islands',
    summary:
      'La navigation publique et les tunnels prives ne passent plus par un routeur SPA central. Les surfaces SEO sont des routes App Router, et les tunnels prives montent des iles dediees.',
    evidence: [
      'Les routes publiques lisent leurs donnees cote serveur.',
      'Admin, checkout, wishlist et commandes utilisent des iles route-specifiques.',
      'La galerie mobile conserve un contrat isole dans GalleryServerView et GalleryMobileShellIsland.',
    ],
    engineering: [
      'Pour les prochains projets, creer des route modules ou layouts par domaine.',
      'Le public catalogue ne doit pas charger les contraintes admin/checkout.',
      'Chaque surface doit posseder son scroll root au lieu de partager implicitement window.',
    ],
  },
  {
    id: 'SV-PERF-0003',
    status: 'verified',
    title: 'La facturation Firebase a deja ete optimisee dans la bonne direction.',
    source: 'functions-public/src/public/catalog.js + src/lib/server/products',
    summary:
      'Le endpoint publicCatalog et le cache sessionStorage vont dans le sens d un site fluide: moins de listeners publics, un chargement initial borne et un catalogue complet demande ensuite.',
    evidence: [
      'Chargement public initial limite a 36 items.',
      'Cache sessionStorage 5 minutes avec catalogVersion stockee.',
      'publicCatalog expose catalogVersion et baisse son cache HTTP a max-age 60 / s-maxage 120.',
      'Admin live listener limite aux vues utiles.',
    ],
    engineering: [
      'La prochaine marche est un monitoring de cache hit et une purge CDN si le trafic le justifie.',
      'Chaque page produit devrait pouvoir lire un document public minimal par slug/id.',
      'Les donnees admin ne doivent jamais etre dans le chemin initial visiteur.',
    ],
  },
  {
    id: 'SV-PERF-0004',
    status: 'verified',
    title: 'Le mobile doit rester une architecture, pas une suite de patches.',
    source: 'alertemobile.md + GalleryServerView + GalleryMobileShellIsland + src/index.css',
    summary:
      'Le bug historique montre que scroll, viewport et surfaces image-heavy sont couples. Pour les prochains projets, le scroll root mobile doit etre defini par layout des le debut.',
    evidence: [
      'Le shell galerie mobile est rendu par la route Next et controle par une petite ile.',
      'marketplace-gallery-shell et marketplace-gallery-scroll partagent le viewport mobile.',
      'Le chemin detail SPA legacy a ete retire; le shell galerie mobile reste contractualise.',
    ],
    engineering: [
      'Chaque page mobile image-heavy doit avoir un seul scroll root explicite.',
      'Les gestures detail/lightbox/bottom sheet ne doivent pas dependre du scroll global.',
      'Tester sur vrai telephone des qu une modif touche viewport, inertie ou images.',
    ],
  },
  {
    id: 'SV-PERF-0005',
    status: 'verified',
    title: 'Le bundle public initial est allege par routes natives.',
    source: 'app/page.jsx + GalleryServerView + route islands',
    summary:
      'Le shell SPA global ne charge plus panier, menu global, admin et checkout dans le parcours public. La galerie rend maintenant son premier HTML cote serveur.',
    evidence: [
      'Le rendu public ne passe plus par ClientApp.',
      'Le scroll global est revenu au natif navigateur, sans boucle RAF globale dediee au scroll.',
      'Le rapport agent demandait une passe fetch priority; le runtime React 19 du projet utilise la prop JSX camelCase fetchPriority.',
    ],
    engineering: [
      'Reporter analytics/app-check apres premier paint ou idle si possible.',
      'Charger le panier, le menu et Stripe seulement sur interaction ou route concernee.',
      'Mesurer le chunk initial avant/apres avec build + Network/Performance panel.',
    ],
  },
]);

const roadmapPhases = Object.freeze([
  {
    id: 'P0',
    title: 'Mesurer et alleger sans toucher au comportement',
    status: 'Partiellement implemente le 12 mai 2026',
    intent:
      'Installer une base de mesure et reduire le poids initial sans toucher aux gestes produit, au scroll mobile ou au design v21.7.',
    actions: [
      'Definir les budgets LCP, CLS, INP, poids JS initial, nombre d images eager et poids image first viewport.',
      'Lazy-loader CartSidebar, GlobalMenu, certaines modales et surfaces admin non visibles au premier ecran; l ancien MarketplaceDiscovery legacy est supprime.',
      'Reporter analytics et App Check apres first paint ou idle si les tests Firebase le valident.',
      'Corriger fetch priority dans une passe separee, en validant le comportement exact de la version React utilisee.',
      'Ne pas refactorer les gestures mobile dans cette phase.',
    ],
    files: ['app/page.jsx', 'src/kit/marketplace/GalleryServerView.jsx', 'app/GalleryMobileShellIsland.jsx', 'src/kit/config/firebase.js', 'src/kit/commerce/CheckoutView.jsx', 'src/kit/commerce/CheckoutStripeModal.jsx', 'src/kit/marketplace/GalleryProductCardServer.jsx'],
    risk: 'Risque faible si la phase reste limitee au shell et aux imports. Le risque principal est un premier clic menu/panier un peu plus lent sans preload idle.',
    validation: [
      'npm run build',
      'Lighthouse mobile preview build',
      'Comparaison taille chunk initial avant/apres',
      'Controle visuel home, galerie, menu, panier, admin',
    ],
  },
  {
    id: 'P1',
    title: 'Compartimenter la galerie',
    status: 'Premiere extraction structurelle appliquee le 12 mai 2026',
    intent:
      'Remplacer la galerie client par GalleryServerView et des iles strictement necessaires, sans changer l intention visuelle.',
    actions: [
      'Rendre hero, categories, grilles produits, atelier et footer en HTML serveur dans GalleryServerView.',
      'Garder hero, categories et premieres cartes dans le chunk initial.',
      'Charger les sections basses avec IntersectionObserver et placeholders de hauteur stable.',
      'Isoler GSAP/ScrollTrigger par section au lieu de les importer dans un gros bloc galerie global.',
    ],
    files: ['src/kit/marketplace/GalleryServerView.jsx', 'src/kit/marketplace/GalleryProductCardServer.jsx', 'app/GalleryMobileShellIsland.jsx', 'src/index.css'],
    risk: 'Risque moyen: les animations GSAP, les timers et les hauteurs de sections peuvent creer du CLS ou changer le rythme editorial.',
    validation: [
      'Screenshots desktop/mobile des sections galerie',
      'Controle CLS pendant apparition des sections basses',
      'Test dark/light si section concernee',
      'Performance panel sur scroll long galerie',
    ],
  },
  {
    id: 'P2',
    title: 'Optimiser donnees et images',
    status: 'Projection card-only, categories, cursor, ETag et version catalogue implementes le 12 mai 2026',
    intent:
      'Eviter que la galerie charge des donnees detail lourdes et fiabiliser chaque image avant rendu.',
    actions: [
      'Ameliorer publicCatalog avec projection minimale carte, pagination/cursor, endpoint categorie, version/ETag et invalidation apres edition admin.',
      'Separer donnees card et donnees detail: la galerie charge prix, stock, slug et images carte; la fiche charge le reste au besoin.',
      'Stocker ratio, dimensions, dominant color ou blur placeholder pour stabiliser les images.',
      'Garder les variantes thumb/card/medium/large/full, mais limiter les preload aux vraies images visibles ou probables.',
    ],
    files: ['functions-public/src/public/catalog.js', 'src/lib/server/products.js', 'firestore.rules', 'src/kit/shared/publicCatalogCache.js', 'src/kit/admin/publicCatalogInvalidation.js', 'src/kit/admin/AdminForm.jsx', 'src/kit/marketplace/GalleryServerView.jsx', 'src/kit/marketplace/ProductDetailShellIsland.jsx', 'src/utils/imageUtils.js', 'src/kit/marketplace/GalleryProductCardServer.jsx'],
    risk: 'Risque moyen: cache stale possible pendant la fenetre HTTP courte, ou incoherence entre carte et detail si un ancien document n a pas encore ses metadata image.',
    validation: [
      'Tests catalogue initial puis chargement complet',
      'Controle fallback Firestore si publicCatalog indisponible',
      'Verification ratios/images sur premiere visite mobile',
      'Audit Network: JSON carte plus leger que detail',
    ],
  },
  {
    id: 'P3',
    title: 'Refactor produit mobile uniquement apres tests',
    status: 'No-go implementation sans vrai telephone: roadmap documentee et garde-fous conserves',
    intent:
      'Rendre le detail produit plus maintenable sans changer les effets type Instagram, le bottom sheet, le retour lateral ou la sortie pull-down.',
    actions: [
      'Conserver le media produit dans ProductDetailShellIsland, sans reintroduire le detail SPA legacy.',
      'Conserver les frames mobiles stables de la route produit Next native.',
      'Centraliser les seuils de gestes: distance swipe, vitesse pull-down, tolerance tap, seuil bottom sheet.',
      'Ajouter une mini state machine: idle, detailOpen, pullingToGallery, closingToGallery, sheetOpen, lightboxOpen.',
    ],
    files: ['src/kit/marketplace/ProductDetailShellIsland.jsx', 'src/kit/marketplace/GalleryServerView.jsx', 'app/GalleryMobileShellIsland.jsx', 'src/index.css', 'alertemobile.md'],
    risk: 'Risque eleve: le moindre changement de scroll root, touch-action, data-detail-open ou staging peut reintroduire le drift mobile.',
    validation: [
      'Relire alertemobile.md avant toute modification',
      'Test vrai telephone: galerie -> scroll leger -> produit -> Details -> retour -> second produit',
      'Mesures attendues: window.scrollY 0, drift image 0px, drift resume 0px, scrollTop conserve',
      'Lightbox pinch/pan/swipe + sortie pull-down + swipe lateral premiere image',
    ],
  },
]);

const roadmapEvidenceRows = Object.freeze([
  ['P0.1 Budgets JS', 'Fait', 'npm run build + npm run perf:budget: app shell 83.1 kB gzip, Firebase public 150.82 kB gzip, galerie 11.66 kB gzip, first-paint clean.'],
  ['P0.1b Mesure reseau', 'Fait', 'npm run perf:network lance le preview et mesure / + /categorie/commodes en mobile 390x844 avec Playwright Python. Le script echoue si budgets reseau, Web Vitals locaux, chunks interdits ou baseline avant/apres depassent les seuils.'],
  ['P0.2 Lazy shell public', 'Fait', 'CartSidebar, GlobalMenu, Footer, OrderSuccessModal, AdminIPTracker, Stripe et facture PDF sortis du premier rendu; MarketplaceDiscovery legacy retire.'],
  ['P0.3 LCP/CLS/INP local', 'Fait local', 'PerformanceObserver injecte avant navigation: LCP, CLS et interaction menu sont controles en preview. Le vrai RUM production reste a ajouter pour mesurer les utilisateurs reels.'],
  ['P1.1 Hero + categories', 'Fait', 'GalleryServerView rend hero, categories et premieres cartes directement en HTML serveur.'],
  ['P1.2 Grilles produits', 'Fait', 'GalleryServerView porte le tri serveur des nouveautes/petits prix; GalleryProductCardServer rend les liens produit natifs.'],
  ['P1.3 Sections basses', 'Fait + chunks separes', 'Les sections basses publiques utiles sont rendues cote serveur; les anciens chunks galerie client ont ete supprimes.'],
  ['P1.4 Animations par section', 'Fait hors produit mobile', "La galerie publique n'attend plus GSAP/ScrollTrigger pour son premier rendu utile."],
  ['P2.1 publicCatalog cards', 'Fait', 'scope=cards, limit initial 36, projection courte, category/categories, cursor, nextCursor, ETag et catalogVersion implementes.'],
  ['P2.2 Card/detail split', 'Remplace par Next SSR', 'La carte pointe vers /produit/... et le document produit est resolu par la route Next native, plus par ensureProductDetail dans la SPA.'],
  ['P2.3 Metadata images', 'Fait nouveau upload + backfill sandbox', 'AdminForm stocke imageMetadata width/height/ratio/dominantColor/blurDataUrl pour les nouvelles images, publicCatalog projette la premiere metadata carte, et npm run backfill:product-metadata:dry audite les anciens produits. Sandbox: 35 produits publies complets, 0 pending, 0 failed.'],
  ['P3.1 Detail mobile', 'Route Next native', 'Le detail mobile actif vit dans ProductDetailShellIsland.jsx; le detail SPA legacy a ete retire.'],
  ['P3.2 Contrat mobile automatise', 'Fait garde-fou', 'npm run mobile:contract verifie alertemobile.md, invariant Router, #marketplaceGalleryScroll, data-detail-open, data-native-scroll-region, freeze CSS et absence du lazy overlay ProductDetail.'],
  ['P3.3 Gestures/state machine', 'Bloque', 'Pas de refactor detail gestures sans vrai telephone: alertemobile.md impose le test drift image/resume a 0 px.'],
  ['P3.4 Validation appareil', 'Bloque environnement', 'adb n est pas disponible dans cet environnement. Le test vrai telephone galerie -> produit -> Details -> retour -> second produit ne peut donc pas etre execute ici.'],
  ['Desktop first-scroll', 'Fait renforce', 'npm run perf:scroll mesure maintenant le chargement initial, le premier scroll molette, les long tasks et les layout shifts. Resultat preview desktop 1440x950 apres stabilisation des slots lazy: scroll max frame gap 16.8 ms, 0 frame >50 ms, load max frame gap 50 ms, 1 long task de 60 ms, CLS 0.0022.'],
  ['Hero mobile', 'Fait', 'Les images hero ont une position mobile dediee via mobileObjectPosition, CSS responsive et image h-full sur mobile. Validation Playwright 390x844: object-position 54% 50%, hero 390x430.'],
  ['Textes encodes', 'Fait', 'Correction des mojibakes visibles marketplace/admin form: selection, pepites, decouvrez, accents, euros et messages admin. Scan DOM Playwright: aucun marqueur mojibake sur home et Avant/Apres.'],
]);

const productDetailFlow = Object.freeze([
  ['1', 'Galerie mobile', 'La galerie vit dans .marketplace-gallery-shell avec #marketplaceGalleryScroll comme scroller interne. Le document ne porte pas le scroll principal.'],
  ['2', 'Clic produit', 'La carte est un lien vers /produit/...; elle ne monte plus de detail SPA dans Router.jsx.'],
  ['3', 'Route Next', 'app/produit/[slugOrId]/page.jsx rend la fiche produit SSR et delegue seulement les medias/actions a des iles client.'],
  ['4', 'Image centrale', 'ProductDetailShellIsland garde un cadre mobile stable avec product-detail-mobile-image-frame et product-detail-mobile-image-clip.'],
  ['5', 'Gestes horizontaux', 'Swipe gauche/droite change d image dans l ile produit native.'],
  ['6', 'Retour', 'Le retour produit se fait par navigation navigateur/route, plus par restauration d overlay SPA.'],
  ['7', 'Panneau mobile', 'Le panneau mobile produit reste local a ProductDetailShellIsland.'],
  ['8', 'Lightbox', 'Tap court ouvre la lightbox; pinch, pan, double tap et swipe image restent separes du shell galerie.'],
]);

const guardrailRows = Object.freeze([
  ['Commit reference', 'v21.7 est traite comme reference design/fonctionnement detail produit desktop et mobile.'],
  ['Contrat galerie mobile', 'Conserver GalleryServerView + GalleryMobileShellIsland comme shell galerie mobile.'],
  ['Contrat DOM mobile', 'Ne pas casser marketplace-gallery-shell, marketplace-gallery-scroll, #marketplaceGalleryScroll, data-detail-open, data-native-scroll-region.'],
  ['Contrat CSS', 'Conserver marketplace-mobile-scroll-lock, product-detail-scroll-lock et --marketplace-viewport-height.'],
  ['Contrat image', 'Garder product-detail-mobile-image-frame et product-detail-mobile-image-clip comme wrappers de clipping dans ProductDetailShellIsland.'],
  ['Route produit', 'Ne pas reintroduire les anciens composants detail produit SPA.'],
  ['Test obligatoire', 'Toute modif galerie/mobile impose un test vrai telephone; toute modif route produit impose le gate produit direct.'],
]);

const implementationResults = Object.freeze([
  ['Build app chunk', '316.45 kB min / 99.04 kB gzip', '258.16 kB min / 84.69-84.71 kB gzip', '-58.29 kB min'],
  ['Firebase chunk', '717.03 kB min / 168.24 kB gzip', '649.99 kB min / 154.44 kB gzip', '-67.04 kB min'],
  ['Firebase Storage', 'Inclus dans le chunk Firebase public', '34.18 kB min / 8.81 kB gzip en chunk admin upload', 'retire du parcours public'],
  ['Detail produit', 'Preload 250 ms apres galerie', 'Preload idle apres 9 s, chargement immediat au clic', 'retire du premier ecran mesure'],
  ['Requetes mobile preview', '76 requetes', '48 requetes', '-28 requetes'],
  ['Transfert total mobile preview', '3.30 MB', '811.2 kB', '-2.49 MB'],
  ['Images mobile preview', '2.52 MB', '390.4 kB', '-2.13 MB'],
  ['Web Vitals preview home', 'Pas de gate automatise', 'LCP 220 ms / CLS 0 / interaction menu 16 ms', 'budget local automatise vert'],
  ['Logo critique', '455.1 kB PNG', '10.6 kB WebP 320', '-444.4 kB'],
  ['Images categories galerie', '4 images Unsplash + 1 ORB en preview', '5 WebP locaux, 45.4 kB total, 0 requete Unsplash', '-48.8 kB sur le premier ecran mesure'],
  ['Police Material Symbols', '1 CSS Google Fonts inutilisee', '0 requete Material Symbols', '-1 requete externe'],
  ['Theme settings', 'Plusieurs hooks pouvaient lancer le meme getDoc', 'cache module + promesse inflight partagee', 'lectures Firestore dedupliquees'],
  ['Surfaces sorties du shell', 'Menu, panier, popup, footer, success/admin tracker statiques', 'Chunks lazy + rendu conditionnel', 'moins de JS initial'],
  ['Avis clients bas de page', 'Inclus dans le module galerie', 'CustomerTestimonialsCarousel lazy dans les sections differees', 'charge hors premier ecran'],
  ['Split hero/categories/produits/reassurance/avant-apres/Instagram/avis/newsletter', 'Rendu initial public dans un grand ilot client galerie', 'GalleryServerView + GalleryProductCardServer + GalleryMobileShellIsland', 'frontieres P1 plus nettes, chunk galerie mesure par budget'],
  ['Chunks sections basses', 'Galerie publique rendue par un grand ilot client', 'HTML serveur sans grand shell galerie client', 'Les anciens composants galerie client sont supprimes du chemin public'],
  ['Catalogue initial publicCatalog', 'Documents complets limites', '?limit=36&scope=cards', 'JSON carte sans description/full/large'],
  ['Endpoint categorie/cursor', 'Pas de segmentation publique par categorie', 'category/categories + cursor + nextCursor + ETag', 'base pour charger une categorie sans tout le catalogue'],
  ['Version catalogue', 'Cache public base seulement sur TTL', 'public/meta.catalogVersion + cache key Function versionnee + cache HTTP 60/120 s', 'invalidation admin explicite avec fenetre stale reduite'],
  ['Fallback Firestore', 'Limite 36 sans ordre serveur garanti', 'where(status) + orderBy(createdAt desc) + limit', 'meme ordre que publicCatalog'],
  ['Pages categories', 'Filtrage possible sur les 36 cartes initiales', 'requestCategoryCatalog(categoryId) avec endpoint segmente puis fallback Firestore', 'inventaire categorie complet sans charger tout le catalogue'],
  ['Categorie commodes preview', 'Charge categorie via catalogue complet', '42 requetes / 501.2 kB / 84.3 kB images / LCP 172 ms / CLS 0', 'route categorie ciblee'],
  ['Budget build automatise', 'Controle manuel uniquement', 'npm run perf:budget apres build', 'alerte sur regression chunks'],
  ['Mesure reseau reproductible', 'Gates Next actuels', 'npm run perf:budget + audits directs Playwright', 'Budgets .next et refresh direct des routes publiques'],
  ['Scroll desktop premier chargement', 'Sections basses montees plus tot par observer elargi et sans attente idle tardive', 'npm run perf:scroll: max frame gap 16.8 ms, load max 50 ms, 1 long task de 60 ms, CLS 0.0022, 0 frame scroll >50 ms', 'frame pacing dans le budget et CLS lazy stabilise'],
  ['Espace client', '446.36 kB MyOrdersView', '23.20 kB MyOrdersView + facture au clic', '-423.16 kB sur la route commandes'],
  ['Checkout Stripe', 'Modale paiement et Elements dans CheckoutView', '29.95 kB CheckoutView + 20.41 kB modal Stripe lazy', 'Stripe charge seulement apres PaymentIntent'],
]);

const implementationLedger = Object.freeze([
  {
    label: 'P0 applique',
    detail: 'CartSidebar, GlobalMenu, Footer, OrderSuccessModal et AdminIPTracker sont charges a la demande avec Suspense; MarketplaceDiscovery legacy a ete retire du code actif.',
  },
  {
    label: 'Firebase analytics retire',
    detail: 'firebase/analytics n est plus importe dans la config initiale; AppCheck reste synchrone pour ne pas risquer les requetes protegees.',
  },
  {
    label: 'Firebase Storage isole',
    detail: 'firebase/storage est sorti de src/kit/config/firebase.js vers src/kit/config/firebaseStorage.js. AdminForm et AdminHomepage gardent l upload, mais le chunk public Firebase ne transporte plus Storage.',
  },
  {
    label: 'Detail produit Next natif',
    detail: 'Le detail produit n est plus un chunk SPA charge depuis Router.jsx. Les cartes pointent vers /produit/... et la route Next rend le contenu SSR.',
  },
  {
    label: 'Images React',
    detail: 'Les props JSX de priorite image utilisent fetchPriority en camelCase, conforme au runtime React 19. Les priorites existantes sont conservees.',
  },
  {
    label: 'Data safety',
    detail: 'Le chargement catalogue complet merge par id. Le detail produit complet est lu par la route Next native, pas par un deep link SPA.',
  },
  {
    label: 'Payload cartes',
    detail: 'publicCatalog accepte scope=cards: la premiere charge renvoie les champs courts de grille et seulement thumb/card/medium de la premiere image.',
  },
  {
    label: 'Metadata images',
    detail: 'Le pipeline admin calcule maintenant width, height, ratio, dominantColor et blurDataUrl au moment de l optimisation image. ProductCard utilise dominantColor comme fond de media, et le detail produit pre-seed ses ratios depuis imageMetadata avant le premier onLoad quand la donnee existe.',
  },
  {
    label: 'Backfill metadata ancien stock',
    detail: 'scripts/backfill-product-image-metadata.cjs ajoute un dry-run par defaut et un mode commit protege. Il calcule width/height/ratio/dominantColor/blurDataUrl via sharp, met a jour imageMetadata et bump public/meta.catalogVersion apres ecriture. Validation sandbox: 35 produits publies scannes, 34 mis a jour apres le commit test initial, 35 skipped au dry-run final, 0 pending, 0 failed.',
  },
  {
    label: 'Endpoint public segmente',
    detail: 'publicCatalog supporte maintenant category/categories, cursor, nextCursor et ETag. Le cache memoire reste borne par scope, limite, categorie et cursor.',
  },
  {
    label: 'Version catalogue',
    detail: 'Les actions admin create/update/status/delete/sold/available appellent bumpPublicCatalogVersion. La Function publicCatalog lit artifacts/secondevie/public/meta, ajoute catalogVersion au JSON et integre cette version dans ses cles de cache memoire. Le navigateur admin purge aussi ses caches sessionStorage public et categorie.',
  },
  {
    label: 'Fenetre stale controlee',
    detail: 'Le cache HTTP publicCatalog passe a max-age 60 et s-maxage 120. Ce n est pas une purge CDN instantanee, mais la fenetre de catalogue obsolet est maintenant courte et documentee.',
  },
  {
    label: 'Completeness categories',
    detail: 'Le fallback Firestore public reprend maintenant le meme tri createdAt desc que la Function, et la route categorie demande une charge dediee requestCategoryCatalog(categoryId) pour ne pas filtrer seulement les 36 premieres cartes.',
  },
  {
    label: 'P1 structure',
    detail: 'Le premier rendu galerie est servi par GalleryServerView: hero, categories, grilles, atelier et liens natifs sont presents sans attendre un shell client.',
  },
  {
    label: 'P1 restant',
    detail: "L'ancien JSX galerie client est retire du parcours public; la surveillance porte maintenant sur GalleryServerView et son ile mobile.",
  },
  {
    label: 'P3 no-go',
    detail: 'Le detail produit SPA legacy a ete retire. npm run mobile:contract protege toujours les invariants Router/CSS de galerie mobile et l absence du lazy overlay ProductDetail.',
  },
  {
    label: 'Sections basses',
    detail: 'Les sections publiques rendues par la galerie serveur gardent des dimensions stables et des liens natifs; les interactions non critiques ne bloquent plus le HTML initial.',
  },
  {
    label: 'Chunks bas de galerie',
    detail: 'Build du 9 juin 2026: la galerie publique ne charge plus de grand ilot client galerie.',
  },
  {
    label: 'Benchmark scroll desktop',
    detail: 'scripts/audit-gallery-scroll-lag.mjs mesure maintenant load frame gaps, premier scroll molette, long tasks et layout shifts. Derniere validation apres stabilisation des slots lazy: max frame gap scroll 16.8 ms, load max 50 ms, 0 frame scroll au-dessus de 50 ms, 1 long task de 60 ms, layoutShiftTotal 0.0022.',
  },
  {
    label: 'Scroll natif global',
    detail: 'Le scroll global ne passe plus par Lenis: la molette, le tactile et les scrolls programmes utilisent le moteur natif du navigateur. Les animations GSAP gardent leurs ScrollTrigger locaux.',
  },
  {
    label: 'Hero mobile',
    detail: 'GalleryServerView utilise les presets imagehero et conserve une source mobile dediee pour le hero galerie.',
  },
  {
    label: 'Encodage visible',
    detail: 'Les textes visibles de la galerie serveur sont maintenant portes par GalleryServerView et controles par les audits directs.',
  },
  {
    label: 'Baseline avant/apres',
    detail: 'Les anciens scripts reseau Vite ont ete retires. La surveillance courante passe par npm run perf:budget, les audits directs et npm run perf:scroll.',
  },
  {
    label: 'Avis clients lazy',
    detail: 'CustomerTestimonialsCarousel est charge via React.lazy uniquement quand les sections basses sont montees, avec un placeholder stable pour eviter le saut de layout.',
  },
  {
    label: 'Budget automatise',
    detail: 'scripts/check-performance-budget.cjs controle les tailles gzip des chunks critiques et verifie que Firebase Storage, facture PDF, Stripe, le catalogue client legacy et avis clients ne sont pas references par dist/index.html.',
  },
  {
    label: 'Contrat mobile automatise',
    detail: 'scripts/check-mobile-marketplace-contract.cjs echoue si l invariant shouldUseMobileGalleryScroll, le shell/scroller galerie, data-detail-open, data-native-scroll-region, le freeze CSS disparait, ou si Router.jsx relazy-load ProductDetail.',
  },
  {
    label: 'Mesure reseau automatisee',
    detail: 'Les mesures reseau Vite legacy ont ete retirees du flux actif; les routes publiques Next sont controlees par les audits direct-refresh et les budgets .next.',
  },
  {
    label: 'Hero carousel',
    detail: 'Le carousel hero ne donne un src qu a l image active et a la suivante; les autres slides gardent leur calque mais ne partent pas toutes en reseau au premier paint.',
  },
  {
    label: 'Espace client',
    detail: 'Le generateur de facture PDF est charge uniquement au clic telechargement; la page Mes commandes ne transporte plus jspdf au premier rendu.',
  },
  {
    label: 'Checkout Stripe',
    detail: 'La modale Stripe, Elements et CheckoutPaymentStep ont ete sortis dans CheckoutStripeModal. Le tunnel checkout reste identique, mais le code paiement est charge seulement quand checkoutState passe a ready_to_pay.',
  },
  {
    label: 'Recherche et cartes',
    detail: 'La recherche galerie couvre name/material, et le memo ProductCard surveille les champs visibles prix, stock, sold, nom et matiere.',
  },
  {
    label: 'Images initiales',
    detail: 'Les srcSet des cartes ne publient plus large/full, le warmup detail tactile ne part plus sur un simple debut de scroll, le prewarm Nouveautes est repousse, et le logo PNG 455 kB est remplace par un WebP 10.6 kB.',
  },
  {
    label: 'Categories locales',
    detail: 'Les visuels des categories galerie ne dependent plus d Unsplash. Les 5 assets dedies public/images/categories pesent 45.4 kB au total et suppriment l erreur ORB observee en preview mobile.',
  },
  {
    label: 'Fonts et theme',
    detail: 'La police Material Symbols inutilisee a ete retiree de index.html/index.css, et useLiveTheme partage maintenant une seule promesse Firestore theme_settings entre les instances app, galerie, header et detail.',
  },
  {
    label: 'Limite restante',
    detail: 'Les images Firebase restent le premier poste reseau. Les prochains gains demandent surtout le backfill imageMetadata des anciens produits, puis un monitoring cache hit/CDN en production.',
  },
]);

const v217ChangeRows = Object.freeze([
  ['Reference Git', '81295a7 v21.7', 'Le commit HEAD reste la reference design/fonctionnement. Tout ce chapitre compare le worktree courant a cette base.'],
  ['Surface modifiee', '27 fichiers suivis modifies + 22 entrees nouvelles', 'La modification est large, mais elle est majoritairement une extraction/segmentation de charge, pas une refonte visuelle.'],
  ['Volume diff suivi', '+1649 / -1978 lignes', 'Le graphe client galerie legacy est retire; le rendu public passe par GalleryServerView.'],
  ['Page admin doc', 'Nouvelle documentation vivante', 'PerformanceArchitectureStudy documente la strategie, les chiffres, les gates et les risques dans une vraie page admin.'],
]);

const v217DomainRows = Object.freeze([
  ['Shell public', 'v21.7 portait encore menu, panier, footer, success modal, Stripe/facture et plusieurs surfaces en dur.', 'Ces surfaces sont maintenant chargees a la demande: moins de JS initial et moins de code admin/commerce sur le premier ecran public.'],
  ['Galerie', 'La galerie etait un gros ilot client avec hero, categories, produits et sections basses.', "GalleryServerView et GalleryProductCardServer forment le coeur serveur de la galerie; GalleryMobileShellIsland reste l'ile mobile minimale."],
  ['Nuance bundle', "Apres l'extraction precedente, la galerie restait encore un grand ilot client.", 'Cette limite est corrigee par la migration serveur: les anciens composants galerie client publics sont supprimes.'],
  ['Scroll desktop', 'Le premier scroll pouvait cumuler un moteur de scroll JS, ScrollTrigger global et montage de sections basses.', 'Le scroll global est natif, les ScrollTrigger restent locaux aux sections, les sections basses montent par slots et perf:scroll mesure load + scroll + CLS.'],
  ['Images hero mobile', 'Le hero mobile utilisait le meme objectPosition que desktop et une image h-[120%] ancree verticalement.', 'Chaque preset a mobileObjectPosition; mobile utilise h-full et desktop garde md:h-[120%]. Validation 390x844: object-position 54% 50%.'],
  ['Catalogue public', 'La premiere charge restait proche d un chargement catalogue general.', 'publicCatalog supporte scope=cards, limit, category/categories, cursor, nextCursor, ETag et catalogVersion.'],
  ['Images produits', 'Les cartes/detail dependaient plus fortement des URLs et ratios disponibles au runtime.', 'AdminForm stocke imageMetadata; ProductCard exploite dominantColor; detail mobile preseed les ratios et garde le staging decode/currentSrc.'],
  ['Cache/invalidation', 'TTL et session cache existaient sans version publique explicite.', 'public/meta.catalogVersion est bump par les actions admin; caches Function/navigateur utilisent cette version.'],
  ['Admin upload', 'Upload optimisait les images mais ne remplissait pas toutes les metadata utiles.', 'Pipeline ajoute width/height/ratio/dominantColor/blurDataUrl et script backfill pour l ancien stock.'],
  ['Encodage', 'Plusieurs textes visibles contenaient des mojibakes de type selection/pepites/decouvrez casses.', 'Scan src JS/JSX propre; DOM home et Avant/Apres sans marqueur mojibake.'],
  ['Mobile detail', 'Le detail actif est maintenant la route produit Next native.', 'Les invariants Router/shell galerie et l absence du lazy overlay produit sont proteges par mobile:contract.'],
]);

const v217MetricRows = Object.freeze([
  ['Requetes home mobile', '76 avant baseline', '48 maintenant, soit -28 requetes et -36.8%.'],
  ['Transfert home mobile', '3.30 MB avant baseline', '811.2 kB maintenant, soit -2.49 MB et -75.4%.'],
  ['Images home mobile', '2.52 MB avant baseline', '390.4 kB maintenant, soit -2.13 MB et -84.5%.'],
  ['App shell gzip', '99.04 kB gzip mesure initiale', '83.1 kB gzip maintenant, soit environ -16 kB gzip.'],
  ['Chunk galerie gzip', '21.09 kB gzip avant split lazy sections basses', '11.66 kB gzip maintenant, soit -9.43 kB gzip et -44.7%.'],
  ['Firebase public gzip', '168.24 kB gzip mesure initiale', '150.82 kB gzip maintenant, Storage isole hors parcours public.'],
  ['MyOrdersView', '446.36 kB avec generateur facture embarque', '23.20 kB + generateInvoice charge au clic.'],
  ['Premier scroll desktop', 'Pas de gate v21.7', 'max frame gap scroll 16.8 ms, 0 frame scroll >50 ms, load max 50 ms, layoutShiftTotal 0.0022.'],
  ['Categorie commodes', 'Route filtree depuis charge plus generale', '42 requetes, 501.2 kB, 84.3 kB images, LCP 172 ms, CLS 0.'],
]);

const v217RiskRows = Object.freeze([
  ['Mieux', 'Le public est plus leger, les images sont plus previsibles, les sections sont compartimentees, les budgets sont automatises.', 'L infra est objectivement meilleure pour un site image-heavy.'],
  ['Pas magique', 'React reste une SPA: le premier rendu public depend encore du JS, de Firebase et du navigateur client.', 'Pour un prochain gros catalogue public, Next.js garderait un avantage structurel avec SSR/SSG et image optimizer.'],
  ['Risque restant', 'Le detail mobile a encore des gestes dans ProductDetailShellIsland, mais il ne passe plus par un routeur SPA.', 'Ne pas reintroduire les anciens composants detail produit SPA pour corriger un comportement produit.'],
  ['Risque bundle', 'Les sections publiques utiles sont rendues dans le HTML serveur.', "Le risque restant est surtout visuel: conserver la proximite design de l'ancienne galerie tout en gardant le rendu serveur."],
  ['Prochain gain', 'Ajouter RUM production: vrais INP, LCP, CLS, cache hit publicCatalog, decode images, device class.', 'Les mesures locales disent que la structure est meilleure; le RUM dira comment les vrais appareils reagissent.'],
]);

const architectureRows = Object.freeze([
  ['Shell public', 'HTML/route initiale legere, SEO, header, hero et LCP image', 'SSR/SSG ou SPA minimal, zero admin'],
  ['Catalogue initial', '36 a 48 items, metadata image, prix, stock, slug', 'Cache CDN + session cache'],
  ['Catalogue profond', 'pagination, recherche, filtres, categories', 'Charge a la demande, transition non urgente'],
  ['Image service', 'variants, dimensions, ratio, blur, cache immutable', 'Pipeline upload + CDN'],
  ['Detail produit', 'route partageable, image principale predecodee, infos critiques', 'Chunk dedie + preload sur intent'],
  ['Interactions', 'wishlist, panier, devis, login', 'Iles ou chunks conditionnels'],
  ['Admin', 'CRUD, analytics, exports, images', 'Bundle separe, jamais dans parcours public'],
  ['Observabilite', 'LCP, CLS, INP, decode, cache hit, scroll drift', 'RUM + Lighthouse + vrai mobile'],
]);

const nextSsrOptimizationRows = Object.freeze([
  ['N0 Baseline', 'Conserver npm run perf:architecture comme comparaison Hosting vs App Hosting, puis ajouter un scenario produit froid si necessaire.', 'lint, build, seo:check, mobile:contract, test:e2e, perf:architecture'],
  ['N1 Cache serveur', 'Centraliser les lectures produit/categorie server-only, dedupliquer par requete, ajouter cache par produit et version catalogue.', 'firebase-admin server-only, cache(), catalogVersion, invalidation admin'],
  ['N2 Pages produit ISR', 'Preparer generateStaticParams/revalidate pour les meubles publies afin que le premier visiteur ne paie pas toujours le rendu complet.', 'HTML produit, metadata, JSON-LD, brouillons exclus'],
  ['N3 Images premiere visite', 'Servir la bonne variante, preloader seulement l image principale, utiliser ratio/dominantColor/blurDataUrl et verifier le cache Storage.', 'pas de full-size inutile, pas de CLS, pas de flash mobile'],
  ['N4 Hydratation reduite', 'Garder le SEO produit en serveur et isoler wishlist, panier, auth, lightbox, checkout, cropper, charts et admin en client/dynamic.', 'JS public stable ou en baisse, routes admin hors parcours public'],
  ['N5 Prefetch intelligent', 'Depuis galerie: prefetch route/image sur hover/focus desktop, prudence mobile, annulation ou limitation pendant scroll rapide.', 'clic produit plus rapide sans explosion des requetes Storage'],
  ['N6 Observabilite', 'Suivre cold starts, latence p95, erreurs 5xx, cache hit et couts App Hosting avant decision production.', 'routes cles App Hosting + rapport avant/apres'],
]);

const nextSsrDecisionRows = Object.freeze([
  ['Ce qui est deja gagne', 'Le benchmark deploye montre moins de KB, moins de requetes et un vrai bloc produit SSR sur la page produit.', 'ARCHITECTURE_BENCHMARK_DECISION.md'],
  ['Ce qui reste SPA-like', 'La galerie, le detail interactif, le panier, la wishlist, le checkout et l admin restent largement client-side.', 'optimisation Next encore a faire'],
  ['Point dur meuble froid', 'Le premier produit jamais consulte depend encore de caches froids: Storage/CDN, Firestore, App Hosting, decode image et hydration.', 'N1 + N2 + N3 prioritaires'],
  ['Decision prudente', 'Continuer le clone Next comme cible future, mais ne pas basculer prod avant admin/commerce/mobile/couts.', 'validation sandbox uniquement'],
]);

const imageProtocol = Object.freeze([
  {
    title: 'A l upload',
    detail: 'Generer AVIF/WebP ou WebP, largeurs 320/480/768/1024/1440/1920, EXIF nettoye, ratio et dimensions stockes.',
  },
  {
    title: 'Dans Firestore',
    detail: 'Ne jamais stocker seulement une URL brute. Stocker variants, width, height, ratio, dominantColor ou blurDataURL.',
  },
  {
    title: 'Dans la galerie',
    detail: 'Rendre une carte avec aspect-ratio stable, srcset et sizes exacts, lazy par defaut, eager seulement pour les premieres cartes.',
  },
  {
    title: 'Au clic produit',
    detail: 'Precharger l image detail sur pointer intent, decoder avant swap visible sur mobile, garder l ancien visuel pendant transition.',
  },
  {
    title: 'Dans le detail',
    detail: 'Un cadre stable clippe l image. L enfant image ne porte pas le clipping critique. Le ratio final doit etre connu avant paint.',
  },
  {
    title: 'En cache',
    detail: 'Assets versionnes en cache long, JSON public en s-maxage court, catalogVersion dans publicCatalog et bump explicite apres edition admin.',
  },
]);

const migrationSteps = Object.freeze([
  ['0', 'Ne pas migrer Seconde Vie maintenant', 'Continuer React/Vite, stabiliser pipeline image, mesurer avant gros chantier.'],
  ['1', 'Extraire les domaines', 'Deplacer catalogue, detail, checkout, admin et docs en modules autonomes avec contrats clairs.'],
  ['2', 'Ajouter des budgets', 'Budget initial JS public, nombre d images eager, taille totale first viewport, seuil INP/LCP.'],
  ['3', 'Tester Next.js sur clone', 'Prototype catalogue + produit + Firebase/Storage avec next/image ou loader CDN.'],
  ['4', 'Choisir par projet', 'Next.js pour marketplace publique; Astro pour vitrine/catalogue editorial; Vite SPA pour admin/outils.'],
  ['5', 'Industrialiser l upload', 'Un script/function unique produit variants, manifest image et headers cache.'],
]);

const checklist = Object.freeze([
  ['LCP', 'L image principale est connue, dimensionnee, prechargee ou prioritaire, et ne change pas de ratio apres paint.'],
  ['CLS', 'Toute carte image a un aspect-ratio stable, aucun texte/prix ne pousse la grille au chargement.'],
  ['INP', 'Filtres, recherche et scroll ne recalculent pas toute la galerie sans transition/deferred value.'],
  ['JS initial', 'La page publique ne charge pas admin, charts, cropper, Stripe ou gros menus avant besoin.'],
  ['Data', 'Pas de listener public permanent sauf besoin temps reel visible et justifie.'],
  ['Cache', 'Static assets en cache long, JSON public cache court/CDN, HTML sans cache durable si SPA.'],
  ['Mobile', 'Un scroll root par surface, gestures non passives uniquement quand necessaire, test vrai telephone.'],
  ['Images', 'Variants + metadata + decode + fallback; pas d URL brute sans dimensions.'],
  ['Observabilite', 'Lighthouse preview build + Performance panel + mesure appareil reel avant livraison.'],
]);

const sources = Object.freeze([
  {
    label: 'Next.js Image Optimization',
    url: 'https://nextjs.org/docs/app/getting-started/images',
    note: 'Image component: tailles adaptees, WebP, stabilite layout, lazy loading, remote patterns.',
  },
  {
    label: 'Astro Islands Architecture',
    url: 'https://docs.astro.build/en/concepts/islands/',
    note: 'HTML statique majoritaire, hydratation selective des composants interactifs.',
  },
  {
    label: 'Astro Images',
    url: 'https://docs.astro.build/en/guides/images/',
    note: 'Image/Picture, transformations, sources distantes autorisees, limites selon adapter.',
  },
  {
    label: 'React Router Automatic Code Splitting',
    url: 'https://reactrouter.com/main/explanation/code-splitting',
    note: 'Routes comme entrees de bundle et retrait de code serveur du client.',
  },
  {
    label: 'Remix Data Loading',
    url: 'https://remix.run/docs/main/guides/data-loading',
    note: 'SSR, chargement data/JS/CSS en parallele, reduction des waterfalls.',
  },
  {
    label: 'Vite Build Optimizations',
    url: 'https://vite.dev/guide/features#build-optimizations',
    note: 'CSS code splitting, modulepreload et optimisation des chunks dynamiques.',
  },
  {
    label: 'React Suspense',
    url: 'https://react.dev/reference/react/Suspense',
    note: 'Suspense couvre lazy code et sources compatible framework, pas les fetch useEffect classiques.',
  },
  {
    label: 'SvelteKit Performance',
    url: 'https://svelte.dev/docs/kit/performance',
    note: 'Code splitting, preloading, request coalescing, prerender, prevention des waterfalls.',
  },
  {
    label: 'SvelteKit Images',
    url: 'https://svelte.dev/docs/kit/images',
    note: 'enhanced-img: formats, tailles, dimensions, EXIF; limite sur images distantes.',
  },
  {
    label: 'Firebase Hosting Cache',
    url: 'https://firebase.google.com/docs/hosting/manage-cache',
    note: 'CDN, Cache-Control, max-age/s-maxage et comportement contenu dynamique.',
  },
]);

const sourceCards = Object.freeze([
  { label: 'Galerie serveur', path: 'src/kit/marketplace/GalleryServerView.jsx', state: 'HTML galerie public SSR' },
  { label: 'Ile mobile galerie', path: 'app/GalleryMobileShellIsland.jsx', state: 'viewport, scroll lock, pull refresh' },
  { label: 'Images', path: 'src/utils/imageUtils.js', state: 'variants, srcset, prewarm, decode cache' },
  { label: 'Detail', path: 'src/kit/marketplace/ProductDetailShellIsland.jsx', state: 'ile media produit Next native' },
  { label: 'Carte galerie serveur', path: 'src/kit/marketplace/GalleryProductCardServer.jsx', state: 'liens natifs + images carte' },
  { label: 'Backend', path: 'functions-public/src/public/catalog.js', state: 'catalogue public cache' },
]);

const statusLabel = {
  verified: 'Verified',
  watch: 'Watch',
  critical: 'Critical',
  recommend: 'Recommend',
};

export default function PerformanceArchitectureStudy({ onBack, embedded = false, seo = true }) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeId = chapters[activeChapter]?.id ?? chapters[0].id;
  const indicatorStyle = useMemo(
    () => ({ transform: `translateY(${activeChapter * 42}px)` }),
    [activeChapter]
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, nextProgress)));

      const probeLine = Math.min(window.innerHeight * 0.38, 360);
      const isAtBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;
      let nextActive = 0;

      if (isAtBottom) {
        nextActive = chapters.length - 1;
      } else {
        chapters.forEach((chapter, index) => {
          const node = document.getElementById(chapter.id);
          if (node && node.getBoundingClientRect().top <= probeLine) nextActive = index;
        });
      }

      setActiveChapter(nextActive);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText('Seconde Vie performance architecture study / 2026-05-12');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className={`sv-doc-page ${embedded ? 'sv-doc-page--embedded' : ''}`} data-skill="editorial-minimal" data-archetype="research-journal-warm-stone">
      {seo && (
        <SEO
          title="Etude performance images et architecture"
          description="Etude framework, images, routing et architecture cible pour sites catalogue image-heavy."
          url="/etude-performance"
        />
      )}

      <div className="sv-doc-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <header className="sv-doc-topbar">
        <a className="sv-doc-brand" href="/" onClick={(event) => {
          if (!onBack) return;
          event.preventDefault();
          onBack();
        }}>
          Seconde Vie
        </a>
        <span className="sv-doc-slash">/</span>
        <span className="sv-doc-issue">Performance images 01</span>
        <div className="sv-doc-topbar-actions">
          <button className="sv-doc-ghost-button" onClick={handleCopy} type="button">
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? 'Citation copied' : 'Copy citation'}
          </button>
          <button className="sv-doc-icon-button" onClick={onBack || (() => { window.location.href = '/'; })} aria-label={embedded ? 'Retour admin' : 'Retour au site'} type="button">
            <ArrowLeft aria-hidden="true" />
          </button>
        </div>
      </header>

      <aside className="sv-doc-chapter-rail" aria-label="Chapitres">
        <p>Chapters</p>
        <nav>
          <span className="sv-doc-chapter-indicator" style={indicatorStyle} aria-hidden="true" />
          {chapters.map((chapter, index) => (
            <a aria-current={activeChapter === index ? 'page' : undefined} href={`#${chapter.id}`} key={chapter.id}>
              <span>{chapter.no}</span>
              {chapter.title}
            </a>
          ))}
        </nav>
      </aside>

      <aside className="sv-doc-source-rail" aria-label="Sur cette page">
        <p>On this page</p>
        <nav>
          {chapters.map((chapter) => (
            <a aria-current={activeId === chapter.id ? 'page' : undefined} href={`#${chapter.id}`} key={chapter.id}>
              {chapter.kicker}
            </a>
          ))}
        </nav>
        <div className="sv-doc-rail-block">
          <p>Decision</p>
          <strong>React reste adapte; Next.js est le meilleur choix React pour les prochains catalogues publics image-heavy.</strong>
        </div>
        <div className="sv-doc-rail-block">
          <p>Tags</p>
          <div className="sv-doc-tags">
            <span>Images</span>
            <span>Mobile</span>
            <span>Routing</span>
            <span>Firebase</span>
          </div>
        </div>
      </aside>

      <article className="sv-doc-article">
        <section className="sv-doc-hero" id="decision">
          <div className="sv-doc-kicker-row">
            <span>Research pass</span>
            <span>12 mai 2026</span>
          </div>
          <span className="sv-doc-chapter-no">01</span>
          <h1>React n est pas le probleme. L architecture de charge l est.</h1>
          <p className="sv-doc-lede">
            Seconde Vie montre un cas classique: beaucoup d images, une galerie mobile exigeante, un detail produit anime,
            Firebase, panier, admin et SEO. Le bon choix framework depend de la facon dont on isole le public, les images,
            les donnees et les interactions.
          </p>
          <div className="sv-doc-meta-rule">
            <span>Conclusion: <strong>garder React ici</strong></span>
            <span>Prochains projets: <strong>Next.js ou Astro selon besoin</strong></span>
            <span>Risque cle: <strong>images sans metadata</strong></span>
            <span>Gate: <strong>vrai mobile + build preview</strong></span>
          </div>
        </section>

        <section className="sv-doc-proof-plate" aria-label="Synthese decisionnelle">
          <div>
            <GitBranch aria-hidden="true" />
            <span>SV-PERF CHAIN</span>
          </div>
          <p>
            Cette page n est pas une note abstraite: elle mappe les documents officiels aux fichiers reels du projet et
            transforme l experience Seconde Vie en protocole reutilisable pour les prochains sites riches en images.
          </p>
          <dl>
            <div>
              <dt>Frameworks</dt>
              <dd>{frameworkRows.length}</dd>
            </div>
            <div>
              <dt>Sources</dt>
              <dd>{sources.length}</dd>
            </div>
            <div>
              <dt>Gates</dt>
              <dd>{checklist.length}</dd>
            </div>
          </dl>
        </section>

        <section className="sv-doc-section" id="current-project">
          <SectionHead no="02" eyebrow="Seconde Vie" title="Le projet est deja sur la bonne piste, mais trop centralise.">
            La base React/Vite actuelle n est pas mauvaise. Elle contient deja du lazy-loading, un cache catalogue, des
            variants image et un staging mobile. Le point faible est la concentration des responsabilites dans le shell.
          </SectionHead>
          <div className="sv-doc-source-grid">
            {sourceCards.map((card) => (
              <article className="sv-doc-source-card" key={card.path}>
                <span>{card.label}</span>
                <strong>{card.path}</strong>
                <em>{card.state}</em>
              </article>
            ))}
          </div>
          <LedgerList entries={currentFindings} />
        </section>

        <section className="sv-doc-section" id="since-v217">
          <SectionHead no="03" eyebrow="Depuis v21.7" title="Ce qui change vraiment depuis le commit de reference.">
            v21.7 reste la reference design et comportement. Les modifications actuelles ne cherchent pas a changer
            l identite du site: elles se concentrent sur le poids initial, la segmentation des charges, les images,
            le catalogue public, le premier scroll desktop, le hero mobile et les garde-fous.
          </SectionHead>
          <div className="sv-doc-result-panel">
            <div className="sv-doc-map-intro">
              <GitBranch aria-hidden="true" />
              <div>
                <span>Base de comparaison</span>
                <p>
                  La comparaison part du commit <code>81295a7 v21.7</code>. Le worktree courant contient 27 fichiers
                  suivis modifies et 22 entrees nouvelles; les lignes suivies changent de +1649 / -1978. Le gros retrait
                  vient surtout du remplacement du grand ilot galerie par un rendu serveur specialise.
                </p>
              </div>
            </div>
            <ProtocolTable rows={v217ChangeRows} />
          </div>

          <div className="sv-doc-map-intro sv-doc-map-intro--compact">
            <Layers3 aria-hidden="true" />
            <div>
              <span>Changements par domaine</span>
              <p>
                Le changement principal n est pas cosmetique: les charges sont mieux compartimentees. Le public, le
                catalogue, les images, le checkout, l admin et les sections basses ne vivent plus tous dans le meme paquet.
              </p>
            </div>
          </div>
          <ProtocolTable rows={v217DomainRows} />

          <div className="sv-doc-map-intro sv-doc-map-intro--compact">
            <Gauge aria-hidden="true" />
            <div>
              <span>Chiffres concrets</span>
              <p>
                Ces chiffres viennent des scripts reproductibles ajoutes au projet: <code>perf:budget</code>,
                <code>perf:network</code>, <code>perf:scroll</code> et du baseline reseau versionne.
              </p>
            </div>
          </div>
          <ProtocolTable rows={v217MetricRows} />

          <div className="sv-doc-checklist">
            {v217RiskRows.map((entry) => (
              <article className="sv-doc-check" key={entry[0]}>
                <ShieldCheck aria-hidden="true" />
                <div>
                  <strong>{entry[0]}</strong>
                  <p><b>{entry[1]}</b> {entry[2]}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sv-doc-section" id="roadmap">
          <SectionHead no="04" eyebrow="Roadmap validee" title="Ordre d execution pour ameliorer sans casser v21.7.">
            Cette roadmap est un plan de travail documente, pas une promesse que les chantiers sont deja appliques. Chaque
            phase garde le design et les gestures comme contrat de sortie.
          </SectionHead>
          <div className="sv-doc-roadmap-grid">
            {roadmapPhases.map((phase) => (
              <article className="sv-doc-roadmap-card" data-phase={phase.id} key={phase.id}>
                <div className="sv-doc-roadmap-head">
                  <span>{phase.id}</span>
                  <div>
                    <strong>{phase.title}</strong>
                    <em>{phase.status}</em>
                  </div>
                </div>
                <p>{phase.intent}</p>
                <div className="sv-doc-roadmap-columns">
                  <section>
                    <span>Actions</span>
                    <ul>{phase.actions.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section>
                    <span>Fichiers</span>
                    <ul>{phase.files.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                </div>
                <div className="sv-doc-roadmap-risk">
                  <ShieldCheck aria-hidden="true" />
                  <div>
                    <span>Risque</span>
                    <p>{phase.risk}</p>
                  </div>
                </div>
                <details className="sv-doc-entry-disclosure">
                  <summary>Validation obligatoire</summary>
                  <div className="sv-doc-entry-context">
                    <section>
                      <span>Gates</span>
                      <ul>
                        {phase.validation.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </details>
              </article>
            ))}
          </div>
          <div className="sv-doc-result-panel">
            <div className="sv-doc-map-intro">
              <Gauge aria-hidden="true" />
              <div>
                <span>Avant / apres mesure</span>
                <p>
                  Mesures CDP Chrome headless sur preview: mobile 390x844 pour le reseau et desktop 1440x950
                  pour le premier scroll molette, URL <code>http://127.0.0.1:4173/</code>, cache navigateur neuf.
                  Elles valident le poids initial et le frame pacing du premier chargement.
                </p>
              </div>
            </div>
            <ProtocolTable rows={implementationResults} />
            <div className="sv-doc-map-intro sv-doc-map-intro--compact">
              <FileCheck aria-hidden="true" />
              <div>
                <span>Matrice action par action</span>
                <p>
                  Ce tableau distingue ce qui est fait, partiel, non couvert ou bloque. Il evite de confondre un build vert
                  avec une roadmap entierement terminee.
                </p>
              </div>
            </div>
            <ProtocolTable rows={roadmapEvidenceRows} />
            <div className="sv-doc-checklist">
              {implementationLedger.map((entry) => (
                <article className="sv-doc-check" key={entry.label}>
                  <FileCheck aria-hidden="true" />
                  <div>
                    <strong>{entry.label}</strong>
                    <p>{entry.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sv-doc-section" id="frameworks">
          <SectionHead no="05" eyebrow="Frameworks" title="Le meilleur framework est celui qui retire une classe de bugs.">
            Pour un site catalogue image-heavy, le gain attendu ne vient pas du logo du framework. Il vient du rendu initial,
            du cache, de l optimisation image et de la capacite a ne charger que la surface visible.
          </SectionHead>
          <div className="sv-doc-framework-grid">
            {frameworkRows.map((row) => (
              <article className="sv-doc-framework-card" key={row.name}>
                <div className="sv-doc-framework-head">
                  <span>{row.score}</span>
                  <strong>{row.name}</strong>
                  <em>{row.verdict}</em>
                </div>
                <p>{row.fit}</p>
                <div className="sv-doc-mini-columns">
                  <div>
                    <span>Forces</span>
                    <ul>{row.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                  <div>
                    <span>Limites</span>
                    <ul>{row.limits.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sv-doc-section" id="images">
          <SectionHead no="06" eyebrow="Images" title="La fluidite commence avant que React rende la carte.">
            Le navigateur doit connaitre taille, ratio, priorite et cache avant l affichage. Sinon, n importe quel framework
            finira par compenser avec des patches visuels.
          </SectionHead>
          <ProtocolTable rows={imageProtocol.map((row) => [row.title, row.detail, 'obligatoire'])} />
        </section>

        <section className="sv-doc-section" id="routing-data">
          <SectionHead no="07" eyebrow="Routes et data" title="Partager la charge veut dire creer des frontieres nettes.">
            Les charges doivent etre sharde par route, par domaine et par moment d usage: public initial, public profond,
            interaction, checkout, compte client et admin.
          </SectionHead>
          <ProtocolTable rows={architectureRows} />
        </section>

        <section className="sv-doc-section" id="mobile">
          <SectionHead no="08" eyebrow="Mobile" title="Le scroll mobile doit etre dessine comme une API.">
            Le projet a prouve qu une galerie et un detail produit peuvent se perturber si le shell mobile, l inertie et le
            viewport ne sont pas contractualises. Cette regle passe avant les animations.
          </SectionHead>
          <div className="sv-doc-code-map-shell">
            <div className="sv-doc-map-intro">
              <Smartphone aria-hidden="true" />
              <div>
                <span>Invariant Seconde Vie</span>
                <p>
                  Conserver le shell galerie mobile rendu par <code>GalleryServerView</code> et controle par
                  <code>GalleryMobileShellIsland</code>. Le detail produit actif est une route Next native.
                </p>
              </div>
            </div>
            <div className="sv-doc-metric-grid">
              <Metric icon={<Gauge />} label="Scroll root" value="1" detail="Un scroller actif par surface mobile." />
              <Metric icon={<ImageIcon />} label="Decode" value="avant paint" detail="Image detail preparee hors ecran." />
              <Metric icon={<SplitSquareHorizontal />} label="Gestures" value="isolees" detail="Lightbox, sheet et back swipe separent leurs axes." />
              <Metric icon={<ShieldCheck />} label="Test" value="telephone" detail="Pas seulement responsive desktop." />
            </div>
          </div>
        </section>

        <section className="sv-doc-section" id="detail-flow">
          <SectionHead no="09" eyebrow="Produit mobile" title="La route produit est sortie du shell SPA.">
            La page produit ne doit pas etre traitee comme une modale standard. Sur mobile, elle combine SSR Next,
            ile media, panneau mobile, lightbox et navigation navigateur.
          </SectionHead>
          <ProtocolTable rows={productDetailFlow} />
        </section>

        <section className="sv-doc-section" id="guardrails">
          <SectionHead no="10" eyebrow="Garde-fous v21.7" title="Ce qui ne doit pas etre simplifie pendant les optimisations.">
            Le commit v21.7 sert de reference design et fonctionnement pour les pages detail produit desktop et mobile. Les
            optimisations doivent respecter ces contrats avant de chercher un gain de poids ou de lisibilite.
          </SectionHead>
          <div className="sv-doc-guardrail-panel">
            <div className="sv-doc-invariant-block">
              <Network aria-hidden="true" />
              <div>
                <span>Invariant absolu</span>
                <code>GalleryServerView + GalleryMobileShellIsland + #marketplaceGalleryScroll</code>
              </div>
            </div>
            <ProtocolTable rows={guardrailRows} />
          </div>
        </section>

        <section className="sv-doc-section" id="target">
          <SectionHead no="11" eyebrow="Architecture cible" title="La structure ideale ressemble a des plaques independantes.">
            Chaque plaque peut etre rendue, cachee, hydratee et testee seule. Le public n attend jamais l admin; le detail
            n attend jamais tout le catalogue; le mobile ne depend pas du scroll global.
          </SectionHead>
          <div className="sv-doc-architecture-plate">
            <Layer title="Public static shell" items={['Header SEO', 'hero/LCP', 'categories', 'footer']} />
            <Layer title="Catalog engine" items={['publicCatalog', 'pagination', 'filters', 'session cache']} />
            <Layer title="Image pipeline" items={['upload', 'variants', 'manifest', 'CDN cache']} />
            <Layer title="Interactive islands" items={['cart', 'wishlist', 'quote', 'auth modal']} />
            <Layer title="Private admin" items={['CRUD', 'analytics', 'cropper', 'exports']} />
            <Layer title="Performance budget" items={['LCP', 'CLS', 'INP', 'JS initial']} />
          </div>
        </section>

        <section className="sv-doc-section" id="next-ssr">
          <SectionHead no="12" eyebrow="Optimisation Next SSR" title="Le clone Next est un socle, pas encore le plafond.">
            Le benchmark deploye montre un gain reel, mais la prochaine etape consiste a utiliser les leviers propres a
            Next: cache serveur, pages produit pre-rendues, revalidation admin, images ciblees et hydratation plus fine.
          </SectionHead>
          <div className="sv-doc-result-panel">
            <div className="sv-doc-map-intro">
              <Gauge aria-hidden="true" />
              <div>
                <span>Roadmap documentee</span>
                <p>
                  Le fichier <code>NEXTJS_OPTIMIZATION_ROADMAP.md</code> est la reference agent pour cette passe. Il
                  complete <code>ARCHITECTURE_BENCHMARK_DECISION.md</code> avec un plan d execution centre sur le cas
                  produit froid et le scale App Hosting.
                </p>
              </div>
            </div>
            <ProtocolTable rows={nextSsrDecisionRows} />
            <div className="sv-doc-map-intro sv-doc-map-intro--compact">
              <Layers3 aria-hidden="true" />
              <div>
                <span>Ordre d execution</span>
                <p>
                  Priorite: mesurer, cacher cote serveur, stabiliser les images, puis seulement ensuite prerender/ISR et
                  reduire l hydratation. Le prefetch vient apres pour eviter d augmenter les requetes Storage.
                </p>
              </div>
            </div>
            <ProtocolTable rows={nextSsrOptimizationRows} />
            <div className="sv-doc-checklist">
              <article className="sv-doc-check">
                <ShieldCheck aria-hidden="true" />
                <div>
                  <strong>Garde-fou production</strong>
                  <p>Ne pas ecrire ni migrer Firebase production pendant cette roadmap. Les validations restent sandbox/App Hosting test.</p>
                </div>
              </article>
              <article className="sv-doc-check">
                <FileCheck aria-hidden="true" />
                <div>
                  <strong>Gate mobile</strong>
                  <p>Toute optimisation touchant galerie, detail, image mobile ou scroll doit relire alertemobile.md et conserver l invariant Router.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="sv-doc-section" id="migration">
          <SectionHead no="13" eyebrow="Migration" title="Ne migrez pas pour corriger un symptome deja compris.">
            Le bon mouvement est progressif: extraire les domaines, mesurer, puis prototyper un prochain catalogue en
            Next.js ou Astro. Une migration brute de Seconde Vie augmenterait le risque mobile.
          </SectionHead>
          <ProtocolTable rows={migrationSteps} />
        </section>

        <section className="sv-doc-section" id="checklist">
          <SectionHead no="14" eyebrow="Checklist projet" title="Chaque prochain site image-heavy doit passer ces gates.">
            Ces controles doivent etre executes en build preview et sur appareil reel avant de considerer la fluidite comme
            terminee.
          </SectionHead>
          <div className="sv-doc-checklist">
            {checklist.map(([label, detail]) => (
              <article className="sv-doc-check" key={label}>
                <FileCheck aria-hidden="true" />
                <div>
                  <strong>{label}</strong>
                  <p>{detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sv-doc-section" id="sources">
          <SectionHead no="15" eyebrow="Sources" title="La recommandation est ancree dans les docs officielles consultees.">
            Les liens ci-dessous sont les sources primaires utilisees pour comparer les frameworks et definir les protocoles
            de charge. Date de consultation: 12 mai 2026.
          </SectionHead>
          <div className="sv-doc-source-list">
            {sources.map((source) => (
              <a href={source.url} target="_blank" rel="noreferrer" className="sv-doc-source-link" key={source.url}>
                <LinkIcon aria-hidden="true" />
                <div>
                  <strong>{source.label}</strong>
                  <p>{source.note}</p>
                  <span>{source.url}</span>
                </div>
              </a>
            ))}
          </div>
          <div className="sv-doc-actions">
            <button className="sv-doc-ghost-button" onClick={handleCopy} type="button">
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? 'Citation copied' : 'Copy citation'}
            </button>
            <a className="sv-doc-primary-button" href="/" onClick={(event) => {
              if (!onBack) return;
              event.preventDefault();
              onBack();
            }}>
              <ArrowLeft aria-hidden="true" />
              {embedded ? 'Retour admin' : 'Retour au site'}
            </a>
          </div>
        </section>
      </article>
    </main>
  );
}

function SectionHead({ no, eyebrow, title, children }) {
  return (
    <header className="sv-doc-section-head">
      <span>{eyebrow}</span>
      <div>
        <em>{no}</em>
        <h2>{title}</h2>
      </div>
      <p>{children}</p>
    </header>
  );
}

function LedgerList({ entries }) {
  return (
    <div className="sv-doc-ledger-list">
      {entries.map((entry) => (
        <article className="sv-doc-ledger-entry" data-status={entry.status} key={entry.id}>
          <div className="sv-doc-entry-icon" aria-hidden="true">
            {entry.status === 'critical' ? <Smartphone /> : entry.status === 'watch' ? <FileCheck /> : <ShieldCheck />}
          </div>
          <div>
            <div className="sv-doc-entry-meta">
              <span>{entry.id}</span>
              <span>{statusLabel[entry.status]}</span>
            </div>
            <h3>{entry.title}</h3>
            <p>{entry.summary}</p>
            <small>{entry.source}</small>
            <ul>
              {entry.evidence.map((item) => (
                <li key={item}>
                  <Check aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <details className="sv-doc-entry-disclosure">
              <summary>Ouvrir le contexte technique</summary>
              <div className="sv-doc-entry-context">
                <section>
                  <span>Notes ingenieur</span>
                  <ul>
                    {entry.engineering.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </details>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProtocolTable({ rows }) {
  return (
    <div className="sv-doc-protocol-table" role="table">
      {rows.map(([item, meaning, detail]) => (
        <div className="sv-doc-protocol-row" role="row" key={`${item}-${detail}`}>
          <span role="cell">{item}</span>
          <strong role="cell">{meaning}</strong>
          <em role="cell">{detail}</em>
        </div>
      ))}
    </div>
  );
}

function Metric({ icon, label, value, detail }) {
  return (
    <article className="sv-doc-metric">
      {React.cloneElement(icon, { 'aria-hidden': true })}
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function Layer({ title, items }) {
  return (
    <article className="sv-doc-layer">
      <div>
        <Boxes aria-hidden="true" />
        <strong>{title}</strong>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <Sparkles aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
