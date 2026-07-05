# Mega menu update

Date: 2026-07-05

## Objectif

Rendre l'ouverture du menu principal desktop aussi immediate que possible, en suivant la logique observee sur Rainmaker:

- le menu critique part avec le header;
- le panneau existe deja cote client, meme ferme;
- le clic ne doit pas declencher un gros chargement avant l'ouverture visuelle;
- auth, compteurs, panier, wishlist et donnees personnalisees restent secondaires;
- le header reste visible pendant l'ouverture, peu importe la position de scroll.

Reference UX: https://www.rainmaker.com/

## Diagnostic avant changement

Le menu principal etait trop "tout ou rien":

- `GlobalMenuTriggerIsland` ouvrait un shell ou un panneau lazy selon l'etat de preload.
- Le vrai rendu desktop passait encore par une chaine dynamique.
- A froid, le clic pouvait afficher un etat intermediaire avant que le contenu complet soit pret.
- Depuis une position de scroll basse, le menu pouvait s'ouvrir sous une portion de contenu au lieu de retrouver le header en haut.
- Le bouton avait un verrou de transition utile sur mobile, mais trop strict pour le desktop.

## Architecture mise en place

### Desktop critique

Le desktop suit maintenant une approche proche de Rainmaker:

- `src/kit/marketplace/GlobalMenuTriggerIsland.jsx` importe `GlobalMenu` directement.
- `src/kit/layout/GlobalMenu.jsx` importe `GlobalMenuDesktop` directement.
- `GlobalMenuMobile` reste dynamique pour ne pas charger le rendu mobile complet dans le chemin desktop.
- Sur desktop, le portal du menu est monte apres hydration et reste disponible ferme.
- Le clic desktop ne precharge plus `GlobalMenuPanelAuthIsland`.
- L'ouverture desktop devient principalement un changement d'etat visuel.

### Contenu enrichi decouple

Les chemins lourds restent hors de la fenetre critique:

- login charge seulement sur action explicite;
- auth/admin lus via les evenements globaux existants;
- panier/wishlist et donnees personnalisees ne bloquent pas l'ouverture;
- images du menu peuvent etre chauffees apres ouverture/idle.

### Header force visible

Pendant le menu desktop actif, le document recoit la classe:

```text
global-menu-desktop-open
```

`src/index.css` force alors le header en `fixed top: 0` au-dessus du menu. Cela evite l'anomalie ou un morceau de contenu scrolle apparaissait au-dessus du mega menu.

Point important: un header `fixed` sort du flux de page. Pour eviter que la galerie remonte puis redescende a la fermeture, `GlobalMenu.jsx` mesure la hauteur reelle du header et pose:

```text
--global-menu-header-height
```

`src/index.css` applique ensuite cette hauteur comme reserve sur le bloc qui suit le header pendant `global-menu-desktop-open`.

Ne pas remplacer ce couple par un simple `sticky`: au scroll profond, le header peut ne plus etre visible dans son contexte sticky et laisser un trou au-dessus du mega menu.

### Anti-spam desktop

Le verrou de transition a ete assoupli sur desktop:

- fermeture puis reclic peut rouvrir;
- le verrou dur reste principalement reserve au mobile;
- le bouton desktop ne tombe plus dans un etat ou les clics sont ignores pendant une fermeture.
- le delai `DESKTOP_MENU_CLOSE_MS` doit rester aligne avec la duree reelle de l'animation Framer de fermeture. S'il est trop court, le panneau est demonte avant la fin du clip/fade et la fermeture parait brutale.

### Re-armement des animations desktop

Le mega menu desktop reste monte ferme pour etre instantane a froid. Cette architecture impose une vigilance sur les animations Framer Motion:

- si les enfants restent montes en etat final, les staggers peuvent finir par ne plus rejouer;
- certains variants `exit` gardent volontairement `opacity: 1` pour eviter un flash a la fermeture;
- apres plusieurs ouvertures/fermetures, le bloc "Meubles par categorie" pouvait donc apparaitre d'un coup.

Correction dans `src/kit/layout/GlobalMenuDesktop.jsx`:

- `openCycle` s'incremente a chaque ouverture;
- le contenu desktop recoit une `key` basee sur ce cycle;
- l'ouverture force d'abord `hidden`;
- la frame suivante passe a `visible`.

Cela garde le menu pre-monte pour la reactivite, mais reinitialise la sequence interne a chaque ouverture. Le stagger des categories doit donc repartir proprement, meme apres beaucoup de cycles open/close.

## Fichiers principaux

- `src/kit/marketplace/GlobalMenuTriggerIsland.jsx`: orchestration du bouton, portal, desktop critique, shell mobile.
- `src/kit/layout/GlobalMenu.jsx`: shell global, scroll lock, choix desktop/mobile.
- `src/kit/layout/GlobalMenuDesktop.jsx`: rendu desktop complet critique.
- `src/index.css`: classe `global-menu-desktop-open` pour header fixe pendant le menu.
- `pnpm-workspace.yaml`: autorisations pnpm App Hosting pour les builds cloud.

## Decision mobile

Oui, on peut appliquer la meme philosophie sur mobile, avec une nuance: le menu doit etre complet cote apparence, mais seuls les morceaux dynamiques restent lazy.

Sur desktop, le menu est une surface sous-header assez stable. Sur mobile, le menu est un drawer plein ecran avec:

- scroll lock;
- `body fixed`;
- safe areas iOS/Android;
- gestures touch;
- clavier virtuel possible via la recherche;
- fermeture par tap overlay / navigation / retour.

Importer toute la logique riche dans le header augmenterait le bundle critique mobile et ferait dependre le premier tap de l'auth, des compteurs et des donnees utilisateur. La version optimale est donc de charger avec le header un shell visuel complet, ferme en CSS, puis d'enrichir apres.

La version mobile appliquee:

1. `MobileMenuInstantShell`
   - monte avec le header;
   - complet cote apparence critique;
   - deja ferme dans le DOM;
   - animation CSS immediate;
   - liens principaux, recherche, compte tile simple;
   - etat admin/compte critique quand deja connu.

2. `MobileMenuEnhancedContent`
   - lazy apres idle ou premiere ouverture;
   - auth, compte utilisateur, compteur panier/wishlist;
   - routes prefetch et donnees secondaires;
   - ne remplace jamais le shell avant le retour visuel initial.

3. Scroll lock decale et robuste
   - reponse visuelle au tap immediate;
   - scroll lock applique juste apres l'ouverture visuelle;
   - restauration du scroll uniquement quand la fermeture est terminee;
   - garde-fou anti-spam conserve, mais plus court et reversible.

## Implementation mobile

- `GlobalMenuOpeningShell` reste monte sur mobile apres hydration, meme quand le menu est ferme.
- A chaque ouverture mobile, `instantShellActive` force le shell visuel en premier, meme si le panneau enrichi est deja precharge.
- `GlobalMenuPanelAuthIsland` continue de charger en lazy/idle et prend le relais seulement apres un court delai d'ouverture.
- Le verrou mobile reste conserve pour eviter les doubles transitions pendant le drawer, mais il ne bloque plus le premier rendu visuel.
- Le desktop garde son comportement direct avec `GlobalMenu` critique.

## Suivi mobile recommande

1. Extraire ensuite le mobile shell actuel de `GlobalMenuOpeningShell` vers un composant dedie si le fichier devient trop gros.
2. Mesurer `npm run perf:menu-mobile` avant/apres sur Android et iOS.
3. Ajuster le delai de handoff si le passage shell -> contenu enrichi produit un micro-saut perceptible.
4. Ne rendre le vrai `GlobalMenuMobile` critique que si les mesures prouvent que le cout bundle reste acceptable.

## Invariants

- Ne jamais afficher un voile seul sans contenu utile.
- Ne jamais bloquer l'ouverture visuelle sur Firebase, auth, App Check, panier, wishlist ou images.
- Ne pas remettre `GlobalMenuDesktop` en import dynamique pour le desktop.
- Ne pas rendre le mobile plus lourd sans mesure de budget.
- Ne pas supprimer les animations, seulement sortir les chargements de la fenetre critique.
- Re-armer les animations internes si une surface reste montee fermee pour la reactivite.
- Garder `fixed + reserve de hauteur` pour le header desktop pendant le mega menu; ne pas revenir a `sticky` seul.

## Extension aux surfaces panier, wishlist et hero

La meme logique est appliquee aux surfaces d'achat quand le gain est net et compatible avec l'architecture Next:

- Le panier expose un shell instantane dans `LazyCartPanelIsland`, monte avec le bouton et capable d'apparaitre avant le chargement du vrai panneau.
- Le vrai `CartPanelIsland` reste lazy et reprend la main apres un court handoff, avec auth, Firestore, panier connecte et checkout.
- `CartSidebar` est prechauffe quand le panier est prime, pour eviter une seconde attente apres le chargement du premier ilot.
- La page wishlist garde son rendu de page Next et ses donnees initiales, mais l'action "ajouter au panier" declenche l'evenement panier immediatement.
- Les mutations wishlist sont optimistes: l'UI repond au clic puis revient en arriere seulement en cas d'erreur.
- Le CTA hero vers `/devis` est prefetch par Next, sans transformer le hero serveur en ile client.

Invariant general: le clic revele une surface deja prete ou un shell deja pret; les donnees dynamiques suivent apres.
