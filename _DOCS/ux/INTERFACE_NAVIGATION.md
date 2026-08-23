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
- safe areas iOS respectees;
- aucun double drawer shell/enrichi visible;
- aucun saut de galerie lors de l'ouverture d'un produit;
- la recherche mobile conserve le header, le champ et le menu en place; le focus ouvre le clavier et superpose les suggestions sous le champ sans monter un second ecran;
- les carrousels Instagram et temoignages de la galerie acceptent un glissement horizontal du doigt sur leur scene mobile, sans bloquer le scroll vertical de la page;
- navigation Next native, jamais `setView` ou hash routing;
- test sur largeur mobile reelle apres changement du shell, du header ou du detail produit.

Le contrat statique est verifie par `npm run mobile:contract`; le comportement visuel demande le gate menu mobile si la zone est modifiee.

## 5. Parcours principaux

### Visiteur

```text
home/galerie -> categorie ou recherche -> produit -> wishlist/panier/devis
```

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
