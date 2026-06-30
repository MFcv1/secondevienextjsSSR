# Rapport - UX images page produit

Date: 2026-05-26

Ce rapport documente la sequence de corrections autour de la page produit directe et du detail produit galerie. Il est relie a `AGENTS.md` dans la code map et dans le journal agent `Goal 20`.

## Contexte

Le probleme de depart etait une difference forte entre l'experience attendue et l'experience observee sur `/produit/...`, surtout en cache froid.

Experience attendue:

- detail produit legacy/galerie;
- grande image centrale;
- panneau blanc a droite;
- bouton `AJOUTER AU PANIER`;
- miniatures verticales;
- bouton fermer `X`;
- comportement identique en arrivee directe, refresh et ouverture depuis la galerie.

Experience non voulue:

- route produit Next directe avec interface differente;
- boutons `RESERVER` / `FAVORI`;
- `Prix sur demande`;
- layout different de la galerie legacy.

Symptome image principal:

- sur desktop cache froid, l'image centrale pouvait apparaitre en mode "deroulement" ou passer visuellement de faible qualite a bonne qualite;
- le fond flou pouvait arriver en retard, bouger derriere l'image, ou creer un flash clair selon le navigateur;
- les formats horizontaux rendaient plus visible le passage entre variante `thumb` et variante `medium`.

## Contraintes relues

Avant les modifications produit/marketplace, `alertemobile.md` a ete relu.

Invariant a conserver dans `src/Router.jsx`:

```jsx
const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;
```

Ce rapport ne change pas cet invariant. Les corrections de cette sequence portent sur la route produit SSR, les sources image, le fond flou, le staging detail et le rendu SSR de transition.

## Probleme 1 - Deux interfaces produit concurrentes

### Diagnostic

La page produit directe pouvait passer par la route Next:

- `app/produit/[slugOrId]/page.jsx`

L'interface voulue vient du shell client legacy:

- `src/app.jsx`
- `src/Router.jsx`
- `src/kit/marketplace/ProductDetail.jsx`
- `src/kit/marketplace/ArchitecturalProductDetail.jsx`

`ProductPageExperience.jsx` existe encore dans le code, mais la route produit directe ne doit pas l'utiliser comme UI visible pour le visiteur.

### Correction retenue

La route `app/produit/[slugOrId]/page.jsx` garde les benefices SSR:

- metadata produit;
- JSON-LD `Product` et `BreadcrumbList`;
- contenu indexable en `sr-only`;
- canonical via les helpers SEO existants;
- preview SSR visuelle pendant le chargement du client.

Puis elle monte `ClientApp`, qui reprend la route `/produit/...` avec le shell legacy et affiche `ArchitecturalProductDetail`.

### Resultat

Les chemins suivants doivent converger vers la meme interface produit:

1. ouvrir directement `/produit/...`;
2. refresh sur `/produit/...`;
3. ouvrir le produit depuis la galerie.

L'UI cible est celle de `ArchitecturalProductDetail`, pas `ProductPageExperience`.

## Probleme 2 - Thumb puis medium au centre

### Diagnostic

Le premier essai utilisait une logique proche de:

- thumb ou preview pour afficher quelque chose tres vite;
- medium ensuite pour la vraie image detail.

Cela evitait parfois une zone vide, mais creait un defaut visible:

- l'image centrale semblait d'abord floue ou de qualite faible;
- puis elle devenait nette environ une fraction de seconde plus tard;
- sur les images horizontales ou avec ratio atypique, le changement etait tres perceptible.

### Decision

La page produit ne doit plus afficher une thumb au centre sur desktop.

Correction:

- l'image centrale detail utilise directement la variante `medium`;
- la preview SSR centrale utilise aussi cette meme `medium`;
- les miniatures a droite restent en `thumb`;
- le zoom/lightbox garde la variante `full` seulement quand le zoom est ouvert.

Fichiers concernes:

- `src/utils/imageUtils.js`
- `src/kit/marketplace/components/ProductCard.jsx`
- `src/kit/marketplace/ArchitecturalProductDetail.jsx`
- `app/produit/[slugOrId]/page.jsx`

## Probleme 3 - Tous a Table paraissait instantane

### Diagnostic

Le comportement observe sur Tous a Table ne venait pas d'une magie navigateur. L'explication technique retenue:

- la carte galerie charge deja une image suffisamment proche de l'image detail;
- le detail reutilise la meme URL ou une URL equivalente deja chaude;
- Chrome a souvent deja l'image en cache ou decodee au moment du clic;
- le cadre est dimensionne avec le bon ratio naturel;
- le detail donne donc l'impression d'etre instantane.

### Adaptation sur Seconde Vie

La strategie Seconde Vie a ete rapprochee de ce modele:

- les cartes galerie utilisent une source principale `medium`;
- `ProductCard` memorise l'image courante chargee pour le detail via `rememberInstantProductDetailImage`;
- les warmups intentionnels prechargent la variante `medium`;
- le detail desktop prend d'abord la source immediate memorisee si disponible;
- le detail ne force plus un passage thumb puis medium au centre.

Compromis accepte:

- `medium` est plus lourd que `thumb`, donc il faut rester vigilant sur la galerie;
- l'UX detail est priorisee parce que c'est la surface critique du produit;
- les miniatures restent en `thumb` pour limiter la surcharge laterale.

## Probleme 4 - Fond flou en retard ou flash de lumiere

### Diagnostic

Le fond flou desktop a eu plusieurs essais:

1. fond flou base sur thumb;
2. fond flou base sur `blurDataUrl`;
3. fond flou masque jusqu'au chargement;
4. fond flou aligne sur l'image centrale.

Les essais 1 et 2 reglaient partiellement la zone vide, mais creaient d'autres defauts:

- decalage entre les couleurs du fond et l'image centrale;
- mouvement derriere l'image;
- flash clair sur Firefox;
- impression de rollback ou de saut de luminosite.

### Correction finale

Le fond global flou desktop utilise maintenant la meme source que l'image centrale active:

```js
const detailBackdropSrc = activeImageSrc || getDetailBackdropImageSrc(activeImage);
```

Et `getDetailBackdropImageSrc` priorise `medium`:

```js
image?.medium || image?.large || image?.src || image?.card || image?.thumb || image?.full || ''
```

Le fallback avant peinture de l'image est une couleur dominante opaque:

- pas de `thumb` au centre;
- pas de `blurDataUrl` comme fond desktop principal;
- pas de preview differente derriere l'image centrale;
- le fond flou apparait quand la meme medium est disponible.

Fichiers:

- `src/kit/marketplace/ArchitecturalProductDetail.jsx`
- `app/produit/[slugOrId]/page.jsx`
- `src/index.css`

## Probleme 5 - Arrivee directe SSR avec fond et centre differents

### Diagnostic

Sur une URL produit directe, le SSR pouvait afficher:

- une preview/backdrop issue d'une thumb ou d'un blur;
- puis l'image centrale en medium;
- puis le client legacy hydrate le detail.

Ce melange rendait le premier rendu incoherent.

### Correction finale

Dans `app/produit/[slugOrId]/page.jsx`:

- `primaryImmediateImage` priorise `images[0].medium`;
- une seule image est preloadee en `fetchPriority="high"`;
- le backdrop SSR utilise `primaryImmediateImage`;
- l'image centrale SSR utilise `primaryImmediateImage`;
- la couleur dominante reste le fallback avant peinture.

Extrait de comportement attendu:

```txt
SSR backdrop src == SSR central image src == ..._medium_...webp
```

Controle effectue sur sandbox:

```txt
product-ssr-visual-preview__backdrop -> ..._medium_...webp
product-ssr-visual-preview__image--main -> ..._medium_...webp
```

## Probleme 6 - Formats horizontaux et ratios

### Diagnostic

Les formats horizontaux rendaient le probleme plus visible parce que:

- la thumb pouvait avoir un rendu different dans le cadre;
- le passage vers la medium changeait la nettete et parfois la perception du ratio;
- le fond pouvait utiliser une image differente du centre.

### Correction

Le cadre desktop est stabilise avec un ratio calcule depuis les metadonnees ou les images stagees.

Le centre et le fond utilisent la meme source active, ce qui evite:

- changement de source visible;
- difference de couleurs entre fond et image;
- perception d'un format qui se recale apres coup.

## Probleme 7 - Zoom et variantes full

### Decision

La variante `full` ne doit pas etre demandee pour le detail normal avant zoom.

Comportement attendu:

- galerie/cartes: `medium`;
- detail centre: `medium`;
- fond flou detail: meme `medium`;
- miniatures: `thumb`;
- zoom/lightbox: `full` apres ouverture du zoom, avec prechargement cible.

Le script `npm run perf:product-images` verifie notamment:

- pas de variantes `full` avant zoom en mobile;
- pas de variantes `full` avant zoom en desktop;
- detail desktop rendu dans la branche desktop uniquement;
- fond flou desktop present;
- image detail visible chargee rapidement.

## Probleme 8 - Paint navigateur et limite reseau

### Clarification technique

On ne peut pas rendre visible une image froide avant qu'elle soit telechargee et peinte par le navigateur.

Ce qui a ete corrige:

- ne plus montrer une variante basse qualite au centre;
- ne plus montrer une image differente dans le fond;
- ne plus faire un saut thumb -> medium au centre;
- garder une couleur dominante stable avant l'arrivee de la medium;
- precharger et reutiliser la medium autant que possible.

Ce qui reste vrai:

- si la medium est vraiment froide, elle depend toujours du reseau Firebase/CDN et du decode navigateur;
- Shopify peut donner une sensation plus instantanee grace a son CDN tres chaud, ses URLs reutilisees et son pipeline image mature;
- Seconde Vie ne recree pas Shopify, mais rapproche l'UX du modele "meme image deja chaude".

## Step-by-step des corrections

1. Confirmer que le probleme principal n'est pas uniquement une animation volontaire.
2. Identifier le paint progressif navigateur et le decalage entre variantes.
3. Comparer mentalement avec Tous a Table: meme URL ou image deja chaude entre carte et detail.
4. Abandonner l'approche "thumb visible au centre puis medium".
5. Passer la carte galerie et le detail produit sur `medium` comme source principale.
6. Garder les thumbs uniquement pour les rails de miniatures.
7. Faire memoriser l'image chargee par `ProductCard` pour le detail.
8. Prechauffer intentionnellement la medium au hover/focus/pointer/touch quand possible.
9. Garder le zoom en `full` uniquement dans la lightbox.
10. Stabiliser la route produit directe pour qu'elle monte `ClientApp` et l'interface `ArchitecturalProductDetail`.
11. Ajouter une preview SSR visuelle mais coherente avec la source `medium`.
12. Retirer le `blurDataUrl` et la thumb comme fond desktop principal pour eviter les flashs.
13. Faire pointer le fond flou desktop sur `activeImageSrc`, donc la meme medium que le centre.
14. Deployer sur App Hosting sandbox.
15. Verifier localement et sur sandbox les sorties SSR, SEO, mobile contract, build et audit images.

## Validations executees

Commandes locales:

```bash
npm run lint
npm run mobile:contract
npm run build
npm run perf:budget
```

Checks locaux avec serveur Next production:

```bash
NEXT_SSR_CHECK_BASE_URL=http://127.0.0.1:4302 npm run seo:check
npm run perf:product-images -- --url=http://127.0.0.1:4302/
```

Deploiement sandbox:

```bash
firebase deploy --project secondevienextjsssr --only apphosting:secondevie-next-sandbox --non-interactive
```

Checks sandbox:

```bash
NEXT_SSR_CHECK_BASE_URL=https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app npm run seo:check
npm run perf:product-images -- --url=https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/ --throttle=3
```

Resultats notables sandbox:

- `seo:check`: OK sur `/`, `/a-propos`, `/produit/meuble-de-metier-rD1lxm47FUolloY4ujez`, `/categorie/buffets`;
- `perf:product-images`: assertions OK;
- desktop detail: `currentSrc` en `medium`;
- mobile detail: `currentSrc` en `medium`;
- pas de variante `full` avant zoom;
- fond flou desktop present;
- route sandbox deployee: `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`.

## Garde-fous pour la suite

Ne pas reintroduire:

- `ProductPageExperience` comme UI visible de `/produit/[slugOrId]`;
- une thumb centrale avant la medium;
- `blurDataUrl` comme fond desktop principal du detail;
- une source de fond differente de l'image centrale active;
- une variante `full` dans le detail normal avant zoom;
- un changement dans `src/Router.jsx` qui casse `view === 'gallery' || isGalleryDetailOverlay`.

Avant toute nouvelle optimisation produit/mobile/galerie:

1. relire `alertemobile.md`;
2. verifier `_DOCS/perf/NEXTJS_OPTIMIZATION_ROADMAP.md` si la modification touche les performances Next/SSR;
3. lancer au minimum `npm run lint`, `npm run mobile:contract`, `npm run build`;
4. si la route produit SSR change, lancer `npm run seo:check`;
5. si le pipeline image change, lancer `npm run perf:product-images`.

## Etat final attendu

Sur une page produit directe:

- la couleur dominante apparait immediatement;
- le SSR precharge la medium;
- le fond flou et l'image centrale utilisent la meme medium;
- l'interface hydrate vers `ArchitecturalProductDetail`;
- aucune perte de qualite thumb -> medium ne doit etre visible au centre.

Depuis la galerie:

- la carte a deja charge une image utile pour le detail;
- l'ouverture produit reutilise/prechauffe la medium;
- les miniatures restent legeres;
- le zoom charge la full seulement quand necessaire.
