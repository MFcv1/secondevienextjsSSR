# Menu navigation and category loading report - 2026-06-16

## Scope

Passe ciblee sur les routes publiques appelees depuis le menu horizontal, le mega menu et le menu global:

- `/categorie/*`, notamment `/categorie/buffets`, `/categorie/meubles`, `/categorie/eclairage`;
- `/devis`;
- `/a-propos`;
- ancres galerie `/galerie#gallery-pieces` et `/galerie#gallery-small-prices`;
- routes compte visibles dans le menu global: `/mes-commandes`, `/wishlist`, `/admin`.

Objectif utilisateur: eviter les ecrans blancs/squelettes visibles au clic menu, rendre les redirections plus directes, et supprimer les chemins qui donnaient l'impression de passer par une mauvaise page avant la page demandee.

## Diagnostic

### Categories

Le grand squelette visible avant les pages meubles venait de `app/categorie/[categoryId]/loading.jsx`.

Ce fichier etait affiche automatiquement par Next App Router pendant la navigation client, tant que le payload serveur de la route categorie n'etait pas pret. La page finale etait correcte, mais l'etat intermediaire donnait une impression de page blanche ou de chargement trop lourd.

Deux facteurs rendaient cet etat plus visible:

- les routes categorie n'etaient pas toujours prechargees avant le clic depuis les menus;
- `app/categorie/[categoryId]/page.jsx` lisait `getServerDarkMode()`, donc un cookie serveur, ce qui rendait la route categorie dependante de la requete et moins favorable au prerendu/cache statique.

### Devis et liens menu

Le cas "devis semble passer par galerie avant devis" venait surtout du comportement de transition client: si l'utilisateur est deja sur la galerie et que `/devis` n'est pas pret, React garde l'ancienne page visible pendant que la nouvelle route charge. Cela donne visuellement l'impression d'un detour.

Des incoherences de chemins existaient aussi dans le menu global:

- certains boutons utilisaient encore `window.location.assign`, donc navigation document complete;
- `Nouveautes` et `Prix bas` renvoyaient vers `/galerie` sans ancre precise;
- une tuile livraison/atelier envoyait vers `/galerie` alors que l'intention correspondait mieux a `/devis`.

## Changes

### Category route

- Suppression de `app/categorie/[categoryId]/loading.jsx` pour ne plus afficher le grand squelette de transition.
- `app/categorie/[categoryId]/page.jsx` memoise le chargement categorie via `cache()`.
- `app/categorie/[categoryId]/page.jsx` ne lit plus le cookie `darkMode`; la route categorie publique utilise un rendu clair par defaut pour rester cacheable/prerendable.
- Le build confirme les categories en SSG:
  - `/categorie/meubles`
  - `/categorie/assises`
  - `/categorie/eclairage`
  - et les autres categories issues de `generateStaticParams`.

### Mega menu desktop

- `src/kit/marketplace/PremiumMegaMenuIsland.jsx` utilise `next/link` pour les liens internes.
- Ajout d'un prefetch cible au survol/focus:
  - lien principal de l'item;
  - sous-categories visibles dans le panneau;
  - `/devis` quand l'item expose des ressources.

Le but n'est pas de precharger tout le site, seulement les routes visibles dans l'intention menu courante.

### Global menu / hamburger

- `src/kit/marketplace/GlobalMenuPanelAuthIsland.jsx` precharge les routes critiques a l'ouverture du panneau:
  - galerie et ancres principales;
  - categories principales et sous-categories du menu;
  - `/a-propos`, `/devis`, `/mes-commandes`, `/wishlist`.
- `src/kit/layout/GlobalMenu.jsx` utilise le chemin Next `onNavigate` pour `/a-propos` et `/devis` au lieu de `window.location.assign`.
- `Nouveautes` pointe vers `/galerie#gallery-pieces`.
- `Prix bas` pointe vers `/galerie#gallery-small-prices`.
- La tuile livraison/atelier pointe vers `/devis`.

### Routes compte

- `app/RouteClientProviders.jsx` ne bloque plus le rendu des enfants pendant l'initialisation auth.
- `app/mes-commandes/OrdersPageIsland.jsx` affiche un fallback visible au lieu de `null` pendant auth/mount, puis utilise `router.push` pour les retours internes.
- `app/wishlist/WishlistPageIsland.jsx` affiche un fallback structurel et utilise `router.push` pour `/a-propos`, `/galerie`, `/admin`.

### Devis

- `src/kit/marketplace/QuoteRequestServerView.jsx` passe `initialDarkMode` a `QuoteFormIsland`, ce qui corrige une prop ignoree.

## Validation and deploy

Validation locale:

- `git diff --check` OK.
- `npm run build` OK apres relance hors sandbox a cause d'un `spawn EPERM` initial.
- Build Next: 55 pages generees.
- La route `/categorie/[categoryId]` est sortie en SSG (`●`) avec les categories attendues.

Deploiement:

```powershell
firebase deploy --only apphosting:secondevie-next-sandbox --project secondevienextjsssr --non-interactive
```

Resultat:

- Rollout App Hosting sandbox complet.
- URL: `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`

## Decisions to preserve

- Ne pas restaurer `app/categorie/[categoryId]/loading.jsx` sous forme de grand squelette; cela recreerait l'ecran intermediaire visible.
- Ne pas remettre `getServerDarkMode()` dans la route categorie publique sans mesurer l'impact cache/prerendu.
- Garder les liens menu internes en `Link` ou `router.push`, pas en `window.location.assign`, sauf besoin explicite de reload document.
- Le prefetch doit rester cible aux routes visibles/attendues du menu. Eviter un prefetch massif de tous les produits ou de tout le catalogue.

## Known limits

- Si le serveur App Hosting ou l'endpoint catalogue est froid, une navigation non prechargee peut encore conserver l'ancienne page quelques instants pendant la transition Next, mais le grand squelette categorie a ete retire.
- Les pages compte restent des tunnels clients non SEO. Elles sont plus fiables visuellement, mais elles chargent encore une partie de l'auth/catalogue selon le cas.
