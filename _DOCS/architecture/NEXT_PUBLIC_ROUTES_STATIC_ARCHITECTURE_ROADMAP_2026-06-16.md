# Roadmap architecture routes publiques statiques

Date: 2026-06-16

## Objectif

Cette roadmap cadre la passe long terme visant a rendre les routes publiques SEO de Seconde Vie plus previsibles, cacheables et conformes a l'architecture Next App Router.

Le principe cible est simple:

- les routes publiques SEO rendent un HTML serveur stable, indexable et partageable;
- les preferences visiteur, comme le theme, ne doivent pas forcer le rendu serveur dynamique;
- les filtres et tris facettes restent partageables par URL, mais ne doivent pas transformer la page categorie canonique en infinites variantes serveur;
- les vraies opportunites SEO facette doivent devenir des routes dediees, pas des query params indexes;
- les tunnels prives restent dynamiques.

## Sources et contraintes

Lire avant toute implementation:

- `AGENTS.md`
- `NEXT_NATIVE_ARCHITECTURE_BASELINE.md`
- `_DOCS/perf/NEXTJS_OPTIMIZATION_ROADMAP.md`
- `alertemobile.md` si une modification touche la galerie mobile, le detail produit, le shell/scroller marketplace ou les gestes mobile.

Regles Next a respecter:

- `cookies()` dans une page ou un layout est une API request-time et opt-in le rendu dynamique.
- `searchParams` dans une page est une API request-time et opt-in le rendu dynamique.
- `generateStaticParams()` + `revalidate` doivent rester le modele cible des routes dynamiques publiques cacheables.
- `dynamic = 'force-dynamic'` reste reserve aux tunnels prives ou endpoints admin.

## Diagnostic de depart

### Routes publiques saines

- `/`, `/galerie`, `/a-propos`, `/devis` ont une structure App Router native et des iles client ciblees.
- Les anciennes surfaces `ClientApp`, `Router.jsx`, `setView(...)` ne sont plus actives sur les routes publiques SEO.
- Les scripts d'audit existants verifient deja l'absence de marqueur SPA legacy sur plusieurs routes directes.

### Point 1 - Theme public

Probleme:

- `app/produit/[slugOrId]/page.jsx` lit `getServerDarkMode()`.
- `src/lib/server/theme.js` lit `cookies()`.
- Le theme est une preference UI visiteur, pas une donnee SEO produit.
- Cette lecture cookie peut rendre la fiche produit moins cacheable que prevu par `generateStaticParams()` + `revalidate = 300`.

Cible:

- Aucune route publique SEO ne doit lire `cookies()` pour le theme.
- Le serveur rend une version stable.
- Le theme s'applique avant peinture via un bootstrap client global base sur `localStorage` et/ou `prefers-color-scheme`.
- Les composants publics cessent progressivement de dependre de props serveur `darkMode` quand ce n'est pas necessaire.

### Point 2 - Categories et facettes

Probleme:

- `app/categorie/[categoryId]/page.jsx` lit `searchParams` et passe ces valeurs a `CategoryServerView`.
- `CategoryServerView` filtre et trie les produits cote serveur selon `sort`, `material`, `style`, `collection`, `availability`, `q`, `maxPrice`, `view`, etc.
- Chaque URL facette peut donc devenir une variante serveur de la categorie.

Cible:

- `/categorie/[categoryId]` reste la page canonique SEO, cacheable et ISR-friendly.
- Les filtres et tris deviennent une experience client progressive.
- Les query params restent partageables, mais sont lus par une ile client, pas par la page serveur.
- Les pages facettes importantes pour le SEO deviennent des routes dediees avec metadata/copy propres, par exemple une future route collection ou landing categorie specialisee.

### Point 3 - Gates de classification

Probleme:

- Les audits runtime existent, mais la preuve continue du mode de rendu Next doit etre plus explicite.
- Une regression type `cookies()`, `headers()` ou `searchParams` dans une route publique doit etre detectee tot.

Cible:

- Un gate statique/lint projet echoue si une route publique SEO importe ou appelle une API request-time interdite.
- Un gate post-build classe les routes clefs attendues: produit, categorie, galerie, devis, a-propos, tunnels prives.
- Les rapports indiquent clairement si une route publique est statique/ISR ou forcee dynamique.

## Roadmap de travail

### Phase A - Cadrage et inventaire

- Confirmer toutes les occurrences `cookies()`, `headers()`, `searchParams` dans `app/**`.
- Classer chaque occurrence: public SEO, tunnel prive, API admin, compatibilite legitime.
- Documenter les exceptions conservees.

### Phase B - Theme public sans cookie serveur

- Retirer `getServerDarkMode()` des routes publiques, en commençant par produit.
- Garantir que le rendu serveur public reste lisible et stable.
- Centraliser l'application du theme cote client dans le layout ou une petite ile globale.
- Conserver le comportement theme sur les tunnels prives si necessaire.

Fichiers probables:

- `app/produit/[slugOrId]/page.jsx`
- `src/lib/server/theme.js`
- `app/layout.jsx`
- composants recevant `darkMode` sur les routes publiques.

### Phase C - Categories canonique + facettes client

- Transformer la page categorie serveur en rendu canonique non dependant de `searchParams`.
- Garder `CategoryServerView` responsable du HTML canonique de base.
- Extraire l'etat facette vers une ile client qui lit et synchronise l'URL.
- Eviter de dupliquer un gros rendu produit client si la grille serveur peut rester le fallback initial.

Fichiers probables:

- `app/categorie/[categoryId]/page.jsx`
- `src/kit/marketplace/CategoryServerView.jsx`
- `src/kit/marketplace/CategoryControlsIsland.jsx`
- `src/kit/marketplace/categoryViewModel.js`

### Phase D - Routes SEO facettes utiles

- Identifier les facettes ayant une vraie valeur SEO.
- Preferer de vraies routes indexables a des query params indexes.
- Chaque route dediee doit avoir metadata, canonical, contenu serveur et JSON-LD adaptes.

Exemples candidats a etudier:

- collections metier
- petits prix
- nouveautes
- familles de produits fortes.

### Phase E - Gates

- Durcir `scripts/check-next-route-classification.cjs` ou ajouter un gate dedie.
- Detecter les APIs request-time interdites dans les routes publiques.
- Lire les artefacts build si necessaire pour confirmer les routes statiques/dynamiques.
- Documenter la commande npm dans `package.json` si elle n'existe pas deja.

### Phase F - Validation cible

Validations a utiliser quand l'implementation le justifie:

```powershell
npm run lint
npm run build
npm run perf:budget
npm run perf:product-direct -- --assert
npm run mobile:contract
```

La validation mobile est obligatoire si la galerie mobile, le shell produit mobile, les handlers touch ou les invariants `marketplace-gallery-*` sont touches.

## Decisions fortes

- Ne pas indexer les facettes query params par defaut.
- Ne pas utiliser `cookies()` pour personnaliser les routes publiques SEO.
- Ne pas reintroduire de shell SPA public.
- Ne pas toucher a la galerie mobile sans lire `alertemobile.md` et verifier le contrat.
- Ne pas rendre dynamiques les pages publiques pour des preferences UI.

## Statut

- 2026-06-16: roadmap creee apres audit architectural Grok/Codex. Travail a lancer par axes paralleles: theme/produit, categories/facettes, gates/prerender.
- 2026-06-16: premiere implementation lancee avec side agents.
  - Produit: `app/produit/[slugOrId]/page.jsx` ne lit plus `getServerDarkMode()` / `cookies()` et rend un theme serveur stable.
  - Categories: `app/categorie/[categoryId]/page.jsx` ne lit plus `searchParams`; les facettes/tri/vue sont appliques cote client par `CategoryControlsIsland` avec URL partageable.
  - Gates: `scripts/check-next-route-classification.cjs` bloque les APIs request-time dans les routes publiques SEO et verifie les tunnels dynamiques allowlistes.
  - Validation courte executee: `npm run next:routes` OK. Aucun build/serveur/Playwright lance dans cette passe.
