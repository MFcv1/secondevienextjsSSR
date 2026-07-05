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

### Anti-spam desktop

Le verrou de transition a ete assoupli sur desktop:

- fermeture puis reclic peut rouvrir;
- le verrou dur reste principalement reserve au mobile;
- le bouton desktop ne tombe plus dans un etat ou les clics sont ignores pendant une fermeture.

## Fichiers principaux

- `src/kit/marketplace/GlobalMenuTriggerIsland.jsx`: orchestration du bouton, portal, desktop critique, shell mobile.
- `src/kit/layout/GlobalMenu.jsx`: shell global, scroll lock, choix desktop/mobile.
- `src/kit/layout/GlobalMenuDesktop.jsx`: rendu desktop complet critique.
- `src/index.css`: classe `global-menu-desktop-open` pour header fixe pendant le menu.
- `pnpm-workspace.yaml`: autorisations pnpm App Hosting pour les builds cloud.

## Decision mobile

Oui, on peut appliquer la meme philosophie sur mobile, mais pas exactement la meme implementation.

Sur desktop, le menu est une surface sous-header assez stable. Sur mobile, le menu est un drawer plein ecran avec:

- scroll lock;
- `body fixed`;
- safe areas iOS/Android;
- gestures touch;
- clavier virtuel possible via la recherche;
- fermeture par tap overlay / navigation / retour.

Importer le vrai menu mobile riche dans le header donnerait une ouverture plus directe, mais augmenterait le bundle critique mobile et risquerait de melanger le scroll lock avec le premier tap.

La bonne version mobile serait donc:

1. `MobileMenuInstantShell`
   - monte avec le header;
   - tres leger;
   - deja ferme dans le DOM;
   - animation CSS immediate;
   - liens principaux, recherche, compte tile simple.

2. `MobileMenuEnhancedContent`
   - lazy apres idle ou apres premiere ouverture;
   - auth, compte utilisateur, compteur panier/wishlist;
   - routes prefetch et donnees secondaires;
   - ne remplace pas le shell pendant l'animation d'ouverture.

3. Scroll lock decale et robuste
   - reponse visuelle au tap immediate;
   - scroll lock applique juste apres l'ouverture visuelle;
   - restauration du scroll uniquement quand la fermeture est terminee;
   - garde-fou anti-spam conserve, mais plus court et reversible.

## Plan mobile recommande

1. Extraire le mobile shell actuel de `GlobalMenuOpeningShell` vers un composant dedie.
2. Le monter en permanence sur mobile apres hydration, ferme et inert.
3. Faire du tap menu un simple changement de classe/etat pour ouvrir le shell.
4. Charger `GlobalMenuPanelAuthIsland` en idle et seulement enrichir le contenu apres ouverture.
5. Garder le vrai `GlobalMenuMobile` lazy tant que les mesures ne prouvent pas qu'il doit devenir critique.
6. Valider avec `npm run perf:menu-mobile` et test manuel Android/iOS avant deploy.

## Invariants

- Ne jamais afficher un voile seul sans contenu utile.
- Ne jamais bloquer l'ouverture visuelle sur Firebase, auth, App Check, panier, wishlist ou images.
- Ne pas remettre `GlobalMenuDesktop` en import dynamique pour le desktop.
- Ne pas rendre le mobile plus lourd sans mesure de budget.
- Ne pas supprimer les animations, seulement sortir les chargements de la fenetre critique.
