# Interface, navigation et contrats UX

Derniere mise a jour: 2026-07-14
Statut: `REFERENCE_ACTIVE`

## 1. Intention

L'interface Seconde Vie est editoriale, claire et premium. Les optimisations doivent preserver l'identite visuelle, les transitions et la comprehension metier. Une amelioration technique ne doit pas remplacer le rendu actuel par une interface generique.

## 2. Shell global

Le shell est compose de:

- `app/layout.jsx` pour la structure globale;
- `ArchitecturalHeaderServer` pour le header serveur;
- `HeaderAccountIsland`, `SearchSuggestIsland`, `DarkModeToggleIsland` et les controles interactifs;
- `GlobalMenuTriggerIsland` et `PremiumMegaMenuIsland` pour le menu principal;
- `FooterServer` et ses petites iles;
- `RouteTransitionIsland` pour les transitions de navigation.

Les donnees personnalisees ne doivent jamais bloquer l'affichage du header, l'ouverture du menu ou un lien public.

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

Invariants:

- premier frame du drawer disponible sans attendre l'auth;
- scroll de page verrouille seulement quand le panneau est visible;
- focus piege dans le panneau et restaure a la fermeture;
- safe areas iOS respectees;
- aucun double drawer shell/enrichi visible;
- aucun saut de galerie lors de l'ouverture d'un produit;
- navigation Next native, jamais `setView` ou hash routing;
- test sur largeur mobile reelle apres changement du shell, du header ou du detail produit.

Le contrat statique est verifie par `npm run mobile:contract`; le comportement visuel demande le gate menu mobile si la zone est modifiee.

## 5. Parcours principaux

### Visiteur

```text
home/galerie -> categorie ou recherche -> produit -> wishlist/panier/devis
```

### Acheteur

```text
panier -> connexion/verification email -> checkout -> Stripe -> confirmation durable -> mes commandes
```

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

- utiliser `Link` et le routeur Next pour les destinations internes;
- prefetcher les routes probables sans saturer le reseau;
- fermer un overlay immediatement au clic valide;
- ne pas afficher la galerie entre le mega menu et `/mes-commandes`;
- garder un loading coherent sur les tunnels dynamiques;
- un bouton en traitement doit avoir un etat explicite et empecher les doubles soumissions;
- une erreur recuperable doit proposer le fallback utile, pas seulement un message technique.

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
src/kit/marketplace/GlobalMenuPanelAuthIsland.jsx
src/kit/marketplace/PremiumMegaMenuIsland.jsx
src/kit/marketplace/HeaderAccountIsland.jsx
src/kit/marketplace/CartPanelIsland.jsx
src/kit/marketplace/ProductDetailShellIsland.jsx
app/GalleryMobileShellIsland.jsx
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
