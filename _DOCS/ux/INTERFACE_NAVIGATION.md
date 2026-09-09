# Interface, navigation et contrats UX

Derniere mise a jour: 2026-08-23
Statut: `REFERENCE_ACTIVE`

## 1. Intention

L'interface Seconde Vie est editoriale, claire et premium. Les optimisations doivent preserver l'identite visuelle, les transitions et la comprehension metier. Une amelioration technique ne doit pas remplacer le rendu actuel par une interface generique.

## 2. Shell global

Le shell est compose de:

- `app/layout.jsx` pour la structure globale;
- `ViewportHeightSyncIsland` pour synchroniser le viewport visuel dynamique pendant toute la navigation;
- `ArchitecturalHeaderServer` pour le header serveur;
- `HeaderAccountIsland`, `SearchSuggestIsland`, `DarkModeToggleIsland` et les controles interactifs;
- `GlobalMenuTriggerIsland` et `PremiumMegaMenuIsland` pour le menu principal;
- `FooterServer` et ses petites iles;
- `RouteTransitionIsland` pour les transitions de navigation.

Les donnees personnalisees ne doivent jamais bloquer l'affichage du header, l'ouverture du menu ou un lien public.

Les boutons « À propos » des menus mobile et desktop demandent le même rideau
« L'atelier » que les liens via `sv:route-transition-request`. La demande est
annulable : si `RouteTransitionIsland` la prend en charge, lui seul navigue et
le menu se ferme ; sinon la navigation Next habituelle reste disponible.
Le rideau conserve le préchargement vidéo et attend le signal de première image,
avec les délais bornés existants. Aucun breakpoint ne désactive ce parcours.

Dans « L'art de la matière » sur `/a-propos`, la section et les cartes suivent
la hauteur de leur contenu, sans hauteur minimale d'écran ni étirement des
rangées. La grille conserve une, deux puis quatre colonnes ; les cartes ont
16 px entre titre et description, puis 24 px avant « Découvrir l'étape ».
Les espacements reposent sur des gaps pour résister au reset des marges du shell.
Chaque carte révèle titre, description et libellé au scroll à son propre point
d'entrée, une seule fois. Le mode de mouvement réduit conserve le texte visible.

L'interlude « Préserver l'héritage / transmettre l'histoire » utilise le même
padding en haut et en bas (`clamp(4rem, 8vw, 10rem)`), sans translation verticale.
Lorsque la FAQ suit directement cet interlude, sa marge négative est neutralisée
pour qu'elle ne recouvre pas l'espace sous le texte. Le défilement horizontal
des deux lignes reste indépendant de ce centrage.

Correctif livré sur sandbox le 6 septembre : `/checkout` ne monte ni header,
bandeau catalogue, catégories ni footer de navigation. Les sorties proposées
restent celles du checkout, avec confirmation d'annulation après réservation.
Le retour au récapitulatif est bloqué pendant la soumission bancaire. La galerie
consomme `focusProduct` après révélation du meuble, conserve les autres paramètres
et le scroll, retire le liseré après cinq secondes et nettoie le timer au démontage.

Le panier utilise une seule frontiere asynchrone: `LazyCartPanelIsland` charge
`CartPanelIsland`, qui embarque directement son `CartSidebar`. Le shell
instantane reste visible pendant ce chargement puis cede la place a un panneau
deja executable; ne pas remettre une seconde importation dynamique autour de
`CartSidebar`, qui recreerait un intervalle sans panneau notamment sur Safari.

## 3. Mega menu desktop

Le menu desktop suit un contrat de reaction immediate:

1. son shell critique est premonte;
2. le clic change d'abord l'etat visuel;
3. le header est rendu visible meme si la page a ete scrollee;
4. panier, wishlist, auth et images enrichies se synchronisent apres l'ouverture;
5. le focus est place dans le panneau et restaure au bouton a la fermeture;
6. Escape et le backdrop ferment le menu;
7. chaque nouvelle ouverture reinitialise les animations internes via un cycle distinct.

Ne jamais bloquer l'ouverture sur Firebase, App Check, une requete catalogue ou un import dynamique lourd.

## 4. Menu mobile

Le mobile utilise un shell instantane puis un enrichissement differe. Ce contrat remplace les anciennes notes liees au routeur SPA, qui ne sont plus applicables.

`app/GalleryMobileShellIsland.jsx` controle le shell mobile final rendu par `src/kit/marketplace/GalleryServerView.jsx`. Leur contrat commun est verifie automatiquement et ne doit pas etre remplace par un overlay produit SPA.

`app/ViewportHeightSyncIsland.jsx`, monte dans le layout racine, est l'unique proprietaire de `--marketplace-viewport-height`. Il synchronise la hauteur reelle de `visualViewport` pendant le repli des barres Chrome/Safari, les changements d'orientation et le retour au premier plan. La galerie et le detail produit consomment cette variable sans la reecrire localement.

Invariants:

- premier frame du drawer disponible sans attendre l'auth;
- scroll de page verrouille seulement quand le panneau est visible;
- focus piege dans le panneau et restaure a la fermeture;
- a l'ouverture mobile, focus sur une action de navigation, jamais sur le champ de recherche; la recherche s'active au toucher du champ ou par navigation clavier explicite;
- safe areas iOS respectees;
- aucun double drawer shell/enrichi visible;
- aucun saut de galerie lors de l'ouverture d'un produit;
- la recherche mobile conserve le header, le champ et le menu en place; le focus ouvre le clavier et superpose les suggestions sous le champ sans monter un second ecran;
- les carrousels Instagram et temoignages de la galerie acceptent un glissement horizontal du doigt sur leur scene mobile, sans bloquer le scroll vertical de la page;
- navigation Next native, jamais `setView` ou hash routing;
- test sur largeur mobile reelle apres changement du shell, du header ou du detail produit.

Le contrat statique est verifie par `npm run mobile:contract`; le comportement visuel demande le gate menu mobile si la zone est modifiee.

### Hero et catégories de la galerie sur mobile

Sous 768 px, le hero utilise `clamp(408px, calc(57svh + 28px), 478px)` pour équilibrer
l'image et son contenu avec les catégories suivantes. La hauteur utilise
le petit viewport stable afin de ne pas grandir au repli des barres du navigateur.
Le titre « Des meubles à faire revivre chez vous » précède six catégories
en deux rangées de trois : Buffets, Tables, Armoires, puis Miroirs, Chaises,
Commodes. Les photos arrondies sont au ratio 2/3, sans chevauchement avec le
hero. La grille est plafonnée à 420 px avec des marges latérales de 32 px,
un espacement horizontal de 12 px et un cadre blanc de 5 px autour des photos.
Tables et Chaises utilisent les photos du catalogue copiées dans
`public/images/categories/{tables,chaises}-catalog-rail.webp` (produits
`BfVsRJC01QMNDvx9Tldf` et `5ZBinIKs3IIj9ugh6ar9`). Chaises mène à Assises,
catégorie actuelle de cette pièce ; Tables mène à Tables.
Le titre mobile mesure 28,5 px, le descriptif 14,3 px et les boutons 33 px
de hauteur. Les espacements sont agrandis avec le contenu ; la marge sous
le descriptif est de 44 px et les boutons restent côte à côte.
Ce sont des liens de catégories, pas une
sélection de produits. À partir de 768 px, le hero et le rail conservent
leur présentation existante. Le scroll interne et son propriétaire restent inchangés.
Les indicateurs du hero ont une piste et un remplissage de même largeur,
28 px sur mobile et 48 px à partir de 768 px, dans une zone cliquable de
24 px de haut. Le remplissage reste borné à la piste et repart à chaque image.
En mouvement réduit, seul l'indicateur actif est rempli, sans animation.

### Section avant / après

Sur ordinateur (à partir de 1024 px), les modules avant/après et newsletter
sont plafonnés à 1240 px. Titres, espacements internes, marges de section et
volumes du fond sont réduits ensemble, sans transformation globale ni hauteur
minimale imposée. Les sections Nouveautés et Petits Prix reprennent des marges
et un titre plus compacts. Le mobile conserve ses tailles lisibles et tactiles.
Les cartes de ces grilles gardent leur titre sur une ligne avec ellipse ; le
nom complet reste dans le lien et son infobulle. Pour une pièce vendue, seule
la pastille photo porte « Vendu » : le titre utilise toute la largeur sous
la ligne matière/stock. Le prix reste affiché pour les pièces non vendues.

Le décor clair de `BeforeAfterSectionServer` utilise un fond ivoire/champagne
avec deux volumes mats en CSS, sans image décorative à précharger. Ces formes
restent non interactives et masquées aux technologies d’assistance ; le mode
sombre conserve son fond dédié. Le comparateur, ses images et ses gestes
restent ceux du composant existant. Les chevrons SVG sont centrés dans leurs
contrôles ; le repère de focus clavier du curseur porte sur la poignée,
sans ajouter de cadre autour de la photo lors d’un clic ou d’un glissement.
L’en-tête atelier porte des outils croisés en SVG. Le grand monogramme utilise
la silhouette originale comme masque, avec un relief sombre mat : centre
brun lumineux et bords espresso assortis au bouton et aux badges Avant/Après,
sans halo ni contour ajouté.
Le monogramme est ancré au titre, indépendamment de la hauteur du panneau,
avec une légère remontée optique vers le sommet des minuscules.
Poignée, badges et typographie du projet suivent la largeur du comparateur ;
sous 420 px de panneau, les commandes passent sous la description pour
préserver la lisibilité du nom du meuble. Le curseur conserve sa surface de
glissement et son accès clavier, même lorsque son disque visuel est réduit.

### Section newsletter

`NewsletterSectionServer` reprend « Champagne équilibré » : deux ovales
asymétriques en CSS, nuances proches, bord supérieur mat et reflet partiel
sur le volume inférieur. Les gravures et leur préchargement sont retirés ;
les fichiers restent conservés. « Offre exclusive » utilise une étiquette euro
en SVG, un long filet et le monogramme, sans encadré ni étoiles. Le nom de
variante « Champagne & équilibre » n’est pas affiché sur le site.
Le décor est non interactif, masqué aux technologies d’assistance et adapté
au mobile ; le mode sombre conserve ses surfaces dédiées. Le jeu serveur,
ses gains, le consentement et l’envoi du code gardent leurs contrats existants.

## 5. Parcours principaux

### Visiteur

```text
home/galerie -> categorie ou recherche -> produit -> wishlist/panier/devis
```

L'entrée du formulaire `/devis` conserve l'ordre rail → panneau → textes →
cartes, avec un facteur temporel de 0,6 pour le rail, le panneau et les textes,
et de 0,8 pour une cascade de cartes plus douce. Chaque facteur s'applique aux
transitions CSS, décalages et timers, sur toutes les largeurs. Le rail est libéré
à 940 ms, soit 110 ms après le début du CTA, sous réserve d'être dans le viewport.
Ce relais est distinct de la fin du hero (1 550 ms) : aucune transition du hero
n'est interrompue. Les groupes suivants passent le relais à la fin de
leur dernière transition, sans marge d'attente supplémentaire. Les textes
et cartes se déclenchent près du bas du viewport (marge de 4 %). Le module du
formulaire se précharge pendant l'introduction mais ne monte qu'au signal du
rail ou au filet de sécurité existant. Le hero, le bloc « Le parcours », les
transitions entre étapes et le mode sans mouvement gardent leur comportement.

Le parcours `/devis` est un assistant à colonne unique en sept étapes. L'estimation
indicative constitue la dernière étape, après la saisie et la validation des
coordonnées; elle ne reste pas affichée sous les étapes précédentes. Le bouton
d'envoi réel apparaît uniquement sur cet écran final. Sous le breakpoint desktop,
les étapes utilisent le scroll naturel du document, sans hauteur fixe, sans
conteneur interne défilant et sans panneau décoratif imbriqué. La progression
reste collante en haut et les actions retour/suivant restent fixes en bas. Le
lanceur d'aide WhatsApp est masqué sur `/devis` mobile pour ne pas concurrencer
ces actions. Le bloc `Le parcours` prolonge l'assistant sans panneau sur mobile,
présente ses quatre étapes en grille 2 x 2 et réserve une marge basse suffisante
pour ne jamais être masqué par la barre d'actions. L'étape meuble conserve sur
mobile une galerie portrait compacte 2 x 3, bornée à 430 px et au ratio 5:6 afin
de garder de la profondeur sans surdimensionner les cartes. Entre 520 et 560 px, les autres
grilles — états, coordonnées et estimation — gagnent une colonne
intermédiaire afin d'éviter des cartes surdimensionnées avant le breakpoint
desktop; les contrôles mobiles restent compacts sans modifier les dimensions
qualifiées sur laptop et desktop. Les prestations restent en pleine largeur
jusqu'au desktop pour préserver les intitulés, les prix et les descriptions;
leurs cartes mobiles gardent une hauteur compacte et un corps descriptif plus
petit; la zone texte répartit la ligne titre/prix et la description avec un
écart mesuré, sans vide résiduel.

### Acheteur

```text
panier -> connexion/verification email -> checkout -> Stripe -> confirmation durable -> mes commandes
```

Le paiement Stripe utilise un ecran plein viewport, pas une petite modale
desktop. Sur grand ecran il separe contexte de commande et formulaire; sur
mobile il revient a une colonne sans scroll horizontal. Le retour au
recapitulatif conserve la commande et doit proposer la reprise exacte du meme
PaymentIntent. Apres reload, la reprise ne depend ni d'un formulaire encore
rempli ni d'une nouvelle creation de commande.

L'ecran plein viewport occupe toute la largeur disponible: la colonne sombre
ne doit pas etre entouree d'une marge de fond clair sur les grands ecrans. La
confirmation apres paiement suit le meme contrat plein ecran. Les textes
client de ces deux surfaces expliquent seulement l'action, l'attente, la
securite utile et la prochaine etape; ils n'exposent pas le vocabulaire
interne de serveur, projection, webhook ou idempotence.

### Client connecte

```text
header/menu Mon espace -> commandes/factures/wishlist/adresse/profil/support
```

### Administrateur

```text
connexion commune -> reconnaissance claim/registre -> step-up fort si necessaire -> /admin
```

L'interface de connexion reste commune. Les droits et l'assurance forte sont imposes par le moteur, pas par une seconde page de login.

## 6. Navigation et performance percue

- utiliser `Link` et le routeur Next pour toutes les destinations internes inter-routes, y compris footer, recherche, categories, produits, devis, espace client et fallbacks;
- conserver `<a>` uniquement pour URL externe, `mailto:`, `tel:`, ancre dans le meme document ou rechargement explicitement voulu;
- les formulaires de filtres categorie gardent une action GET partageable sans JavaScript; l'ile intercepte seulement le parcours enrichi et pousse la meme URL avec le routeur;
- prefetcher les routes probables sans saturer le reseau;
- dans le mega-menu, prefetcher la destination reellement survolee, focalisee ou pressee, jamais toutes les routes d'une famille a l'ouverture;
- dans une grille categorie, la simple proximite du viewport chauffe les images; la route produit attend une intention hover, focus ou press;
- fermer un overlay immediatement au clic valide;
- ne pas afficher la galerie entre le mega menu et `/mes-commandes`;
- garder un loading coherent sur les tunnels dynamiques;
- un bouton en traitement doit avoir un etat explicite et empecher les doubles soumissions;
- une erreur recuperable doit proposer le fallback utile, pas seulement un message technique.

Les surfaces galerie, categorie, produit et recherche exposent leur `aggregateSha256`. `CatalogVersionSyncIsland` ecoute le seul document `sys_catalog_live/current` quand l'onglet est visible, confirme la version signalee avec des reprises bornees, controle aussi la version au retour visible, au `pageshow` et apres un changement de pathname, puis effectue au plus un `router.refresh()` par version pertinente. Sur la galerie, l'evenement charge en plus les cartes de la release API exacte et remplace directement les grilles Nouveautes/Petits Prix: publication, modification, vente, remise en vente, stock, prix et ordre editorial n'attendent donc pas le HTML ISR. Le refresh Next preserve la navigation document et fait converger le reste de la page, tandis que les caches de warmup/prefetch produit sont reinitialises sur changement de version. L'absence du signal ne doit jamais bloquer ISR, le retour arriere ou une destination prefetchee.

Depuis une fiche produit, la croix, le geste de fermeture mobile et le retour natif du navigateur reprennent l'entree d'historique source lorsqu'elle correspond au produit ouvert et au meme `deploymentId`; une source ancienne ou non identifiee est remplacee directement par sa route courante au lieu de restaurer un document obsolete. `ProductReturnRestoreIsland` memorise puis restaure atomiquement, avant de reveler la source, la position du conteneur mobile de la galerie ou le scroll document d'une categorie, y compris avec ses parametres de filtre et de tri. Le marqueur persiste pendant les remounts, refreshs et rechargements de document immediatement consecutifs; un bootstrap racine remet le masque avant le premier rendu si le retour est encore actif. La revelation attend une geometrie stable et le scroll ne doit plus etre reecrit ensuite. Pendant ce retour, la restauration native, le pull-to-refresh galerie et les refreshs catalogue sont neutralises. Une fiche ouverte directement, ou un `router.back()` reste sans effet, conserve un fallback vers la source valide memorisee, puis vers `/`.

## 7. Accessibilite essentielle

Chaque overlay ou modale doit fournir:

- nom accessible et role coherent;
- ordre de tabulation logique;
- focus initial visible;
- fermeture Escape si l'action peut etre annulee;
- restauration du focus;
- texte d'erreur annonce;
- etats `disabled`, `busy` ou `aria-live` quand necessaire;
- cible tactile d'au moins environ 44 px sur mobile;
- contraste suffisant pour texte, bordures utiles et focus.

Les animations doivent respecter `prefers-reduced-motion` lorsqu'elles ne sont pas indispensables a la comprehension.

## 8. Theme et style

Le theme est partage par `src/kit/config/theme.js`, `src/index.css` et les composants. Eviter:

- les styles globaux ponctuels qui contredisent le design system;
- les z-index arbitraires sans verifier header, modales, menu, panier et lightbox;
- les animations de layout couteuses quand transform/opacity suffisent;
- les variantes desktop/mobile visuellement incompatibles.

## 9. Fichiers structurants

```text
src/kit/layout/GlobalMenu.jsx
src/kit/layout/GlobalMenuDesktop.jsx
src/kit/layout/GlobalMenuMobile.jsx
src/kit/marketplace/ArchitecturalHeaderServer.jsx
src/kit/marketplace/GlobalMenuTriggerIsland.jsx
src/kit/marketplace/PremiumMegaMenuIsland.jsx
src/kit/marketplace/HeaderAccountIsland.jsx
src/kit/marketplace/LazyCartPanelIsland.jsx
src/kit/marketplace/CartPanelIsland.jsx
src/kit/commerce/CartSidebar.jsx
src/kit/marketplace/ProductDetailShellIsland.jsx
app/GalleryMobileShellIsland.jsx
app/ViewportHeightSyncIsland.jsx
src/kit/marketplace/GalleryServerView.jsx
app/RouteTransitionIsland.jsx
src/index.css
```

## 10. Gates

```bash
npm run perf:menu-desktop
npm run perf:menu-mobile
npm run mobile:contract
```

Pour un correctif visuel cible, ne pas lancer ces gates longues sans demande explicite. Une passe UX complete ou une preuve de non-regression les justifie.
