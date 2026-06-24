# Roadmap optimisation mega menu desktop - Seconde Vie Next SSR

Date: 2026-06-24

## Perimetre

Cette roadmap concerne le retard a froid et le petit freeze d'apparition du grand panneau hamburger desktop, visible sur la galerie et les routes publiques qui utilisent `ArchitecturalHeaderServer`.

Quand on parle ici de "mega menu desktop", il s'agit bien de toute la grande nappe ouverte par le bouton `Menu`: fond blanc/beige sous le header, colonnes Accueil / categories / Explorer / Atelier, visuels atelier, overlay gris sur la page et rangée de services. Ce n'est pas seulement le petit menu horizontal sous le header.

Deux surfaces sont a distinguer:

- `src/kit/marketplace/PremiumMegaMenuIsland.jsx`: petit mega menu horizontal sous le header.
- `src/kit/layout/GlobalMenu.jsx`: grand panneau hamburger en overlay, celui qui correspond au screenshot et au ressenti de containers qui arrivent en retard.

Aucune modification de design ne doit etre faite pendant cette passe. Le but est de garder le rendu actuel et de rendre la premiere ouverture plus stable.

## Diagnostic statique

### Chemin d'ouverture actuel

1. `ArchitecturalHeaderServer` rend `GlobalMenuTriggerIsland`.
2. `GlobalMenuTriggerIsland` prechauffe `GlobalMenuPanelAuthIsland` en desktop via `requestIdleCallback` avec timeout `2200 ms`, puis aussi au focus, pointerdown et pointerenter.
3. Au clic, le trigger monte un portal vers `document.body`.
4. `GlobalMenuPanelAuthIsland` monte `AuthProvider forceInitialize deferUntilReady={false}`, `ToastProvider`, puis importe dynamiquement `GlobalMenu`.
5. `GlobalMenu` mesure le header, bloque le scroll, installe des listeners globaux, anime le backdrop et le panneau, puis revele les containers desktop.

### Cout de chargement identifie

Sur le build `.next` present dans le workspace:

- `GlobalMenu`: environ `464 KB` non gzip.
- `GlobalMenuPanelAuthIsland`: environ `99 KB` non gzip.
- `PremiumMegaMenuIsland`: environ `159 KB` non gzip.
- chunk Firebase Auth: environ `1.29 MB` non gzip si l'auth est declenchee.
- chunk Firebase Firestore: environ `2.83 MB` non gzip si les compteurs connectes declenchent les listeners.

Ces chiffres ne sont pas une validation runtime, mais ils expliquent le symptome: la premiere ouverture peut payer import dynamique, parsing JS, montage React, initialisation Auth/Firebase, layout sync et premier paint GPU. Une fois les chunks et images charges, le menu repond normalement.

### Cout de rendu identifie

Dans `GlobalMenu` et `src/index.css`, l'ouverture desktop combine:

- Framer Motion sur le shell, backdrop, panneau, containers et nombreux items.
- `clipPath` + `scaleY` + `opacity` sur le panneau.
- `backdrop-blur-sm` sur l'overlay desktop.
- `filter: blur(...)` sur les containers pendant l'entree.
- animations CSS additionnelles `.global-menu-reveal-container`.
- delais d'entree tres etales: sidebar `0.54 s`, categories `0.72 s`, discovery `0.92 s`, atelier `1.12 s`, services `1.28 s`.
- `useLayoutEffect` qui mesure `header.getBoundingClientRect()` et `desktopContentRef.scrollHeight` au moment de l'ouverture.
- prechauffage des images seulement apres `isMenuOpen`.

Le design est coherent, mais la premiere ouverture cumule trop de travail au meme moment.

### Ressenti ouverture / fermeture du fond beige

Le volet de fond blanc/beige peut effectivement paraitre s'ouvrir trop fort par rapport a la fermeture. Le code confirme une asymetrie:

- ouverture: le panneau passe visible avec `opacity` courte (`0.24 s`) et `clipPath/scaleY` sur `0.72 s`, avec une courbe tres rapide en debut (`MENU_PANEL_OPEN_EASE = [0.16, 1, 0.3, 1]`);
- fermeture: le panneau utilise une courbe plus retenue (`RAINMAKER_PANEL_EASE`) avec delai (`0.24 s`) et une sortie plus longue, tandis que l'opacite ne tombe qu'a la fin.

Ce contraste peut donner l'impression que la grande nappe beige "claque" a l'ouverture alors qu'elle respire mieux a la sortie. Une optimisation valide peut donc rendre l'ouverture plus progressive sans changer le design final.

## Regles strictes a ne pas casser

- Ne pas changer la grille, les tailles, les textes, les images, les couleurs, les rayons, les ombres, les espacements ou la hierarchie visuelle du menu.
- Ne pas supprimer le grand panneau hamburger ni le petit mega menu horizontal.
- Ne pas remplacer le menu par une version simplifiee visible.
- Ne pas reintroduire un gros chargement initial qui degraderait le premier scroll galerie.
- Ne pas charger Firebase Auth/Firestore pour un visiteur public uniquement pour afficher le menu.
- Ne pas prefetcher massivement toutes les routes ou toutes les images au premier paint.
- Ne pas toucher au contrat mobile marketplace dans cette passe. Si un changement touche mobile, relire `alertemobile.md` et lancer le gate mobile demande par ce fichier.
- Ne pas deployer ni lancer de validation lourde sans demande explicite.

## Objectifs mesurables

Avant correction, ajouter une mesure ciblee ou instrumenter temporairement:

- temps `pointerdown/click -> panneau visible`;
- temps `click -> premier container visible`;
- long tasks pendant les `1500 ms` suivant l'ouverture;
- chunks demandes par la premiere ouverture;
- images demandees avant et apres ouverture;
- presence ou non de chargement `firebase/auth` et `firebase/firestore` pour visiteur public.

Objectif UX:

- premiere ouverture sans freeze perceptible;
- container principal visible vite, meme si les details finissent leur animation;
- aucun changement visible du design final;
- fermeture conservee fluide.

## Roadmap priorisee

### M0 - Baseline courte

Creer un script d'audit optionnel type `scripts/audit-desktop-global-menu.mjs` ou etendre un audit existant, en mode local uniquement:

- ouvrir `/galerie` en desktop;
- vider le cache navigateur dans un contexte neuf;
- cliquer le bouton `Menu`;
- collecter PerformanceObserver `longtask`, timings DOM, requetes JS/images;
- verifier que le panneau apparait et que les containers clefs existent.

Validation conseillee seulement quand l'utilisateur la demande:

```powershell
npm run build
node scripts/audit-desktop-global-menu.mjs --assert
```

### M1 - Prechauffage plus fiable, sans cout initial brutal

But: eviter que le premier clic paie l'import dynamique.

Pistes:

- Deplacer le warmup desktop du panneau vers un timing plus deterministe apres interaction faible: `pointerenter`, `focus`, `pointerdown`, et eventuellement idle plus tot avec timeout court si le main thread est libre.
- Garder le prechauffage opportuniste, mais ajouter un etat local `panelReady` pour savoir si le chunk est deja pret.
- Si `panelReady` est faux au clic, afficher immediatement un shell transparent/stable ou lancer l'ouverture seulement apres le prochain frame, pour eviter le flash hache.
- Ne pas importer `GlobalMenu` au premier paint galerie. Le warmup doit rester idle/intention.

Fichiers cibles:

- `src/kit/marketplace/GlobalMenuTriggerIsland.jsx`
- `src/kit/marketplace/GlobalMenuPanelAuthIsland.jsx`

### M2 - Decoupler affichage menu et Auth/Firebase

But: un visiteur public doit pouvoir ouvrir le menu sans initialiser Firebase Auth.

Pistes:

- Remplacer `AuthProvider forceInitialize` par un mode non force pour le menu public, ou lire seulement `window.__svAuthUser` et les events deja emis.
- Charger l'auth seulement quand l'utilisateur clique sur "Connexion", "Commandes", "Wishlist" connectee ou une action qui l'exige.
- Garder les compteurs invite via `guestCart` et `localStorage` wishlist.
- Pour utilisateur connecte deja connu, conserver le comportement compte/admin, mais eviter de lancer Firestore tant qu'aucun `signedUser.uid` n'est disponible.

Fichiers cibles:

- `src/kit/marketplace/GlobalMenuPanelAuthIsland.jsx`
- `src/kit/contexts/AuthContext.jsx` uniquement si un mode provider plus fin est necessaire.

Risque principal: regression compte/admin dans le menu. A tester avec invite, client connecte et admin.

### M3 - Rendre le premier paint du panneau moins cher

But: le panneau doit apparaitre comme une surface stable avant que les containers n'animent.

Pistes:

- Garder le design final, mais reduire le travail de premiere frame:
  - remplacer `filter: blur(...)` d'entree par opacity/transform uniquement sur desktop normal, ou reserver le blur aux ouvertures deja chaudes;
  - eviter de cumuler Framer Motion + animation CSS sur les memes containers;
  - limiter `will-change` aux elements effectivement en animation et le retirer apres ouverture;
  - tester `clip-path` vs transform-only pour le panneau, sans changer le rendu final.
- Rendre les containers principaux visibles plus tot, puis animer les micro-elements ensuite.
- Harmoniser ouverture/fermeture: ouverture un peu plus douce mais moins "staggered tardif"; fermeture peut rester expressive.
- Traiter explicitement le fond blanc/beige: adoucir son arrivee pour qu'il ne claque pas avant les containers, tout en gardant sa position, sa hauteur, sa couleur et son rendu final identiques.

Fichiers cibles:

- `src/kit/layout/GlobalMenu.jsx`
- `src/index.css`

Regle design: la position finale et le style final doivent etre pixel-equivalents; seul le timing et les proprietes d'animation peuvent changer.

### M4 - Prechauffer les images au bon moment

But: eviter decode image pendant le premier reveal.

Pistes:

- Precharger les six images `MENU_IMAGE_SOURCES` pendant idle apres que le panneau JS est pret, pas seulement apres `isMenuOpen`.
- Garder `decoding="async"` et `fetchPriority="low"`.
- Ne pas precharger plus que les images du menu.
- Ne pas bloquer l'ouverture sur `decode()`.

Fichiers cibles:

- `src/kit/layout/GlobalMenu.jsx`
- ou helper dedie exporte depuis ce module si le warmup doit etre appele par `GlobalMenuTriggerIsland`.

### M5 - Reduire les mesures synchrones a l'ouverture

But: supprimer les recalculs layout visibles au premier clic.

Pistes:

- Precalculer `menuTop` depuis le header quand le trigger est hydrate ou au premier hover.
- Eviter de lire `desktopContentRef.scrollHeight` avant que le panneau soit stable si une hauteur desktop fixe/borne suffit.
- Garder les valeurs actuelles comme fallback pour resize.

Fichier cible:

- `src/kit/layout/GlobalMenu.jsx`

### M6 - Gate de non-regression

Ajouter un gate seulement apres accord:

- desktop `/galerie`;
- cache froid;
- click hamburger;
- assert panneau visible;
- assert pas de route cassée;
- collecter long tasks et delai d'apparition;
- mode `--trace=false` par defaut.

Ne pas rendre ce gate bloquant tant que la baseline n'est pas stable.

## Ordre recommande

1. M0 baseline courte.
2. M2 decoupler Auth/Firebase du simple affichage menu.
3. M1 rendre le warmup plus fiable.
4. M4 prechauffer les images menu sans bloquer.
5. M3 adoucir l'ouverture et retirer les proprietes de paint les plus couteuses.
6. M5 reduire les lectures layout synchrones.
7. M6 gate de non-regression.

## Hypothese principale

Le lag a froid n'est probablement pas cause par un seul detail CSS. Il vient du cumul:

- import dynamique non termine au premier clic;
- montage d'un gros composant Framer Motion;
- Auth/Firebase possiblement initialises trop tot;
- animations avec blur/clip-path/backdrop-blur;
- images decodees pendant ou juste apres l'ouverture;
- delais de reveal tres tardifs qui donnent l'impression que les containers arrivent en retard.

La correction la plus sure est donc progressive: rendre le panneau disponible avant le clic, sortir Auth/Firebase du chemin public, puis alleger uniquement la cinematique d'ouverture sans toucher au design final.

## Validation a demander avant implementation

Quand l'utilisateur voudra passer a l'implementation, verifier au minimum:

- invite public desktop;
- utilisateur connecte desktop;
- admin desktop si possible;
- petit mega menu horizontal toujours intact;
- hamburger mobile non regresse si un fichier partage est touche;
- aucune degradation du premier scroll galerie.
