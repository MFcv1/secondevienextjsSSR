# Rapport technique - Galerie, scroll froid et reveal images

Date: 2026-05-17  
Contexte: clone Next.js SSR / Firebase App Hosting sandbox  
URL sandbox: https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app

## 1. Resume executif

Le probleme observe etait un manque de fluidite au scroll a froid sur Chromium: micro-freezes, images deja presentes mais scroll parfois saccade, comportement moins fluide que Debongout ou les images apparaissent progressivement par batch pendant la descente.

Le diagnostic a montre que le site essayait trop de "preparer" les images et certaines sections avant que l'utilisateur en ait besoin. En parallele, le footer declenchait aussi Google Maps pendant le scroll, ce qui ajoutait des scripts tiers au pire moment.

La strategie retenue a ete de basculer d'un modele "prechauffage agressif" vers un modele "reveal pilote par viewport":

- les images produit ne sont plus toutes poussees a l'avance;
- les sections basses ne sont plus montees/prechargees trop tot;
- Google Maps ne charge plus au scroll;
- chaque carte produit demande son image quand elle approche du viewport;
- le fade-in ne se joue que quand la carte est effectivement visible;
- un fallback garde la robustesse pour eviter les cartes blanches si un observer rate un cas;
- les handlers scroll globaux sont cadences par `requestAnimationFrame`.

Le resultat mesure sur sandbox froide apres optimisation:

- 76 requetes totales environ;
- 23 requetes pendant le scroll dans le dernier audit;
- 23/23 sont des images;
- 0 script pendant le scroll;
- 0 XHR pendant le scroll;
- 0 long task detectee apres debut du scroll;
- 0 gros gap de frame detecte dans Playwright headless.

Ce changement ne cherche pas a reduire le nombre absolu d'images chargees pendant le scroll. Au contraire, il accepte que les images arrivent au moment utile. Le gain vient surtout du fait que le scroll ne reveille plus de JS tiers, de preloads inutiles, ni de decode/prechauffage trop agressif.

## 2. Symptomes utilisateur

Les symptomes initiaux etaient:

- sur Firefox, le scroll semblait plus fluide a froid, avec des images qui apparaissent progressivement;
- sur Chromium, Chrome, Brave, Opera ou Edge, les images semblaient souvent deja presentes, mais le scroll pouvait freeze comme dans un jeu video;
- Debongout paraissait plus fluide: les containers arrivaient, puis les images apparaissaient vite en fade-in, sans bloquer le mouvement;
- sur notre site, les premieres optimisations avaient supprime certains freezes, mais le comportement restait incoherent entre `Nouveautes` et `Petits Prix`;
- a un moment, seules les 5 premieres cartes de `Petits Prix` semblaient beneficier du reveal progressif;
- une tentative trop stricte d'observer a provoque des cartes blanches parce que le root d'observation etait mauvais sur desktop;
- apres correction, `Petits Prix` a obtenu le bon comportement generalise; `Nouveautes` etait encore revele trop tot a cause du fallback de securite.

## 3. Lecon UX retenue

Le bon comportement n'est pas "tout afficher avant le scroll". C'est souvent trop cher pour Chromium, car le navigateur doit telecharger, decoder, rasteriser et composer trop de bitmaps pendant ou juste avant le mouvement.

Le bon comportement pour cette galerie est plus proche de Debongout:

- le container existe et reserve sa place;
- le navigateur ne charge pas tout trop tot;
- l'image reelle est demandee un peu avant l'arrivee;
- l'image fade-in quand la carte entre reellement dans le viewport;
- si le reseau est rapide, l'utilisateur ne voit presque pas le fond;
- si le reseau est plus lent, le fond neutre reste propre au lieu de provoquer une saccade.

Cela transforme une charge bloquante en feedback visuel controle.

## 4. Architecture ancienne de la page galerie

Avant cette passe, la page galerie suivait globalement cette structure:

```text
app/page.jsx
`-- ClientApp immediat
    `-- src/app.jsx
        `-- MarketplaceLayout
            |-- PremiumMegaMenu
            |-- MarketplaceHero
            |-- CategoryRail
            |-- ReassuranceSection
            |-- ProductArrivalsSection (Nouveautes)
            |   `-- ProductGridSection
            |       `-- ProductCard x 10
            |-- DeferredSectionSlot
            |   `-- BeforeAfterSection
            |-- DeferredSectionSlot
            |   `-- ProductSmallPricesSection (Petits Prix)
            |       `-- ProductGridSection
            |           `-- ProductCard x 10
            |-- DeferredSectionSlot
            |   `-- InstagramSection
            |-- DeferredSectionSlot
            |   `-- TestimonialsSection
            `-- DeferredSectionSlot
                `-- NewsletterSection
```

Les points problematiques principaux:

1. `MarketplaceLayout.jsx` forcait ou accelerait trop de choses pendant l'entree galerie.

Ancien esprit:

```js
scheduleGalleryWarmup(preloadGalleryDeferredChunks, 250, handles);
scheduleGalleryWarmup(() => prewarmProductListImages(publishedItems, ...), 650, handles);
scheduleGalleryWarmup(() => prewarmProductListImages(getSmallPriceWarmupItems(publishedItems), ...), 900, handles);
scheduleGalleryWarmup(() => preloadLowerSectionImages(...), 1100, handles);
```

Effet:

- chunks bas importes avant besoin reel;
- images `Nouveautes` et `Petits Prix` prechauffees en avance;
- images de sections basses prechargees sans intention utilisateur;
- travail reseau/decode deplace vers le debut du scroll.

2. `ProductSections.jsx` ajoutait aussi des warmups propres aux sections.

Ancien esprit:

```js
prewarmProductListImages(sortedItems, {
  includeDetailPrimary: false,
  maxItems: 4,
  initialDelay: 9000,
});
```

Et pour `Petits Prix`:

```js
prewarmProductListImages(visibleItems, {
  includeDetailPrimary: false,
  maxItems: 4,
  initialDelay: 600,
});
```

Effet:

- traitement partiel;
- comportement different selon la position de la section;
- certaines lignes avaient un reveal visible, d'autres semblaient deja chargees.

3. `ProductCard.jsx` utilisait surtout `loading="lazy"` et des flags d'affichage.

Probleme: le lazy natif est une heuristique navigateur. Chrome peut charger bien avant l'ecran. L'animation `onLoad` peut donc se jouer hors champ. Quand l'utilisateur arrive, l'image est deja opacity 1 et l'effet Debongout n'est plus visible.

4. `Footer.jsx` chargeait Google Maps via iframe.

Meme avec `loading="lazy"`, l'iframe pouvait declencher une cascade:

- `maps.googleapis.com` scripts;
- `maps.gstatic.com` ressources;
- XHR/documents associes.

Cela arrivait pendant le scroll vers les sections basses, donc au pire moment pour la fluidite.

5. Les handlers de scroll globaux faisaient des updates trop frequents.

`ArchitecturalHeader.jsx` et `PremiumMegaMenu.jsx` ecoutaient le scroll pour cacher/afficher des surfaces. Meme si React dedupe certains `setState`, le handler tournait encore a frequence elevee.

## 5. Architecture nouvelle de la page galerie

La structure visuelle reste proche, mais la responsabilite de chargement a change.

```text
MarketplaceLayout
|-- Sections hautes visibles / necessaires
|   |-- Hero
|   |-- Categories
|   |-- Reassurance
|   `-- Nouveautes
|
|-- DeferredSectionSlot
|   |-- Avant/Apres
|   |-- Petits Prix
|   |-- Instagram
|   |-- Avis
|   `-- Newsletter
|
`-- ProductCard
    |-- decide quand demander l'image
    |-- decide quand reveler l'image
    |-- garde un fallback positionnel robuste
    `-- ne depend plus seulement du lazy natif
```

### Nouveau flux d'une carte produit

```text
1. La carte est rendue avec un container stable.
2. L'image reelle n'est pas encore dans src.
3. src pointe vers un GIF transparent 1x1.
4. requestObserver detecte que la carte approche du viewport.
5. Le vrai src/srcSet est pose.
6. Le navigateur telecharge l'image.
7. revealObserver detecte que la carte entre vraiment dans la zone visible.
8. Quand la vraie image est chargee, le CSS joue le fade-in.
9. Si l'observer rate un cas, un fallback verifie la position reelle avant de demander/reveler.
```

Cette separation est importante:

- "demander l'image" peut arriver un peu avant l'ecran;
- "reveler l'image" doit arriver quand la carte est visible;
- le fallback ne doit pas reveler hors ecran, sinon `Nouveautes` redevient deja affiche quand on arrive dessus.

## 6. Changements de code detailles

### 6.1 `Footer.jsx` - Google Maps opt-in

Fichier: `src/kit/layout/Footer.jsx`

Avant:

```jsx
<iframe
  src={mapUrl}
  title={title}
  loading="lazy"
/>
```

Probleme:

- `loading="lazy"` n'empeche pas l'iframe de charger quand le footer approche;
- Google Maps declenche plusieurs scripts et ressources;
- cela pollue la phase de scroll.

Apres:

```jsx
const MapFrame = ({ mapUrl, directionUrl, title, darkMode, className = '' }) => {
  const [isMapActive, setIsMapActive] = useState(false);

  return (
    <div className={...}>
      {isMapActive ? (
        <iframe src={mapUrl} title={title} loading="lazy" />
      ) : (
        <button type="button" onClick={() => setIsMapActive(true)}>
          Afficher la carte
        </button>
      )}
    </div>
  );
};
```

Effet:

- zero script Google Maps pendant le scroll;
- la carte reste accessible;
- l'utilisateur declenche volontairement le cout tiers.

### 6.2 `MarketplaceLayout.jsx` - fin des preloads agressifs desktop

Fichier: `src/kit/marketplace/MarketplaceLayout.jsx`

Suppressions importantes:

- `canPreloadGalleryScrollAssets`;
- `preloadGalleryDeferredChunks`;
- `preloadLowerSectionImages`;
- warmups desktop `Nouveautes`;
- warmups desktop `Petits Prix`;
- `forceReady={shouldWarmupDeferredSections}` sur les slots bas.

Avant:

```jsx
<DeferredSectionSlot minHeight="820px" delay={120} forceReady={shouldWarmupDeferredSections}>
  <ProductSmallPricesSection ... />
</DeferredSectionSlot>
```

Apres:

```jsx
<DeferredSectionSlot minHeight="820px" delay={120}>
  <ProductSmallPricesSection ... />
</DeferredSectionSlot>
```

Effet:

- les sections basses montent quand elles approchent;
- le JS de ces sections n'est plus importe juste parce que l'entree galerie commence;
- les images de ces sections ne sont plus prechargees hors besoin.

### 6.3 `ProductSections.jsx` - comportement homogene sur 10 cartes

Fichier: `src/kit/marketplace/components/ProductSections.jsx`

Les deux sections affichent 10 items:

```js
const NOUVEAUTES_PAGE_SIZE = 10;
const PETITS_PRIX_PAGE_SIZE = 10;
```

Avant:

- `Nouveautes` avait un prewarm differe;
- `Petits Prix` avait un observer + prewarm partiel;
- certaines cartes pouvaient etre traitees differemment;
- les premieres cartes pouvaient etre marquees prioritaires.

Apres:

```jsx
<ProductGridSection
  ...
  getPriority={() => false}
/>
```

Applique aux deux sections:

- `ProductArrivalsSection`;
- `ProductSmallPricesSection`.

Effet:

- aucune carte des grilles publiques n'est forcee en `priority`;
- pas de `index < 2`, `index < 4`, `index < 5`;
- les 10 cartes visibles de chaque section passent par le meme `ProductCard`;
- la difference visuelle vient uniquement de la position dans le viewport, pas d'un code different par ligne.

### 6.4 `ProductGridSection.jsx` - rendu partage

Fichier: `src/kit/marketplace/components/ProductGridSection.jsx`

Structure:

```jsx
{items.map((item, index) => (
  <ProductCard
    item={item}
    priority={Boolean(getPriority?.(item, index))}
    ...
  />
))}
```

Comme `getPriority={() => false}` dans `Nouveautes` et `Petits Prix`, toutes les cartes produit publiques recoivent:

```js
priority = false
```

Donc `ProductCard` controle tout via observers.

### 6.5 `ProductCard.jsx` - demande image et reveal explicites

Fichier: `src/kit/marketplace/components/ProductCard.jsx`

#### 6.5.1 Source transparente par defaut

```js
const TRANSPARENT_IMAGE_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
```

But:

- ne pas donner tout de suite le vrai `src`;
- empecher Chrome de charger trop tot par heuristique native;
- garder un element image stable dans le DOM.

#### 6.5.2 Etat de demande et etat de reveal

```js
const [isImageRequested, setIsImageRequested] = React.useState(priority);
const [isImageRevealActive, setIsImageRevealActive] = React.useState(priority);
const [isImageLoaded, setIsImageLoaded] = React.useState(false);
const shouldRequestImage = priority || isImageRequested;
```

Difference conceptuelle:

- `isImageRequested`: le vrai fichier image peut etre telecharge;
- `isImageRevealActive`: la carte a le droit d'afficher l'image;
- `isImageLoaded`: la vraie image a fini de charger.

#### 6.5.3 Root d'observation robuste

```js
const getProductCardObserverRoot = (node) => {
  const galleryRoot = document.getElementById('marketplaceGalleryScroll');
  if (!galleryRoot?.contains(node)) return null;

  const style = window.getComputedStyle(galleryRoot);
  const isScrollableRoot = (
    galleryRoot.scrollHeight > galleryRoot.clientHeight + 8 &&
    ['auto', 'scroll'].includes(style.overflowY)
  );

  return isScrollableRoot ? galleryRoot : null;
};
```

Pourquoi:

- sur mobile, `#marketplaceGalleryScroll` peut etre le vrai scroller;
- sur desktop, le vrai scroller est souvent le viewport navigateur;
- utiliser le mauvais root peut bloquer l'observer et laisser des cartes blanches.

#### 6.5.4 Demande image avant le viewport

```js
const requestObserver = new IntersectionObserver((entries) => {
  const isNearViewport = entries.some((entry) => entry.isIntersecting);
  if (isNearViewport) {
    setIsImageRequested(true);
    requestObserver.disconnect();
  }
}, {
  root,
  rootMargin: '260px 0px 340px 0px',
  threshold: 0.01,
});
```

But:

- lancer le telechargement un peu avant l'arrivee;
- eviter que l'utilisateur voie trop longtemps un fond vide;
- garder une marge faible comparee aux anciens preloads massifs.

#### 6.5.5 Reveal seulement quand visible

```js
const revealObserver = new IntersectionObserver((entries) => {
  const isInViewport = entries.some((entry) => entry.isIntersecting);
  if (isInViewport) {
    window.clearTimeout(revealFallbackTimer);
    setIsImageRevealActive(true);
    revealObserver.disconnect();
  }
}, {
  root,
  rootMargin: '0px',
  threshold: 0.01,
});
```

But:

- ne pas jouer le fade hors ecran;
- rendre `Nouveautes` coherent avec `Petits Prix`;
- garder l'effet progressif visible quand la carte arrive.

#### 6.5.6 Fallback positionnel

```js
const revealFallbackTimer = window.setTimeout(() => {
  const { isNear, isVisible } = getProductCardViewportState(node, root);
  if (isNear) setIsImageRequested(true);
  if (isVisible) setIsImageRevealActive(true);
}, 1400);
```

Ce fallback est volontairement plus subtil que l'ancien:

- il ne revele pas tout au bout de 1.4s;
- il verifie la position reelle;
- il demande l'image si la carte est proche;
- il revele seulement si la carte est visible;
- il evite le retour du bug `Nouveautes deja affiche hors ecran`;
- il evite aussi le bug des cartes blanches infinies.

#### 6.5.7 Rendu de l'image

```jsx
<img
  src={shouldRequestImage ? cardImage.src : TRANSPARENT_IMAGE_SRC}
  srcSet={shouldRequestImage ? (cardImage.srcSet || undefined) : undefined}
  sizes={PRODUCT_CARD_IMAGE_SIZES}
  data-real-image={shouldRequestImage ? 'true' : 'false'}
  loading={priority && !suspendImageWarmup ? 'eager' : 'lazy'}
  decoding="async"
  fetchPriority={priority && !suspendImageWarmup ? 'high' : 'auto'}
  onLoad={handleImageLoad}
/>
```

Comme `priority=false` pour les grilles publiques:

- `loading="lazy"`;
- `decoding="async"`;
- `fetchPriority="auto"`;
- vraie image seulement quand `isImageRequested=true`.

### 6.6 `index.css` - masque et fade-in

Fichier: `src/index.css`

```css
.product-card-media[data-image-reveal="pending"] .product-card-image,
.product-card-media[data-image-loaded="false"] .product-card-image {
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .product-card-media[data-image-reveal="visible"][data-image-loaded="true"] .product-card-image {
    animation: product-card-image-fade-in 360ms cubic-bezier(.29,.65,.58,1) both;
  }
}

@keyframes product-card-image-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

Effet:

- pas d'image visible tant que la vraie image n'est pas chargee;
- pas de flash de l'image transparente;
- fade propre quand les deux conditions sont reunies:
  - carte revelee;
  - vraie image chargee.

### 6.7 `ArchitecturalHeader.jsx` et `PremiumMegaMenu.jsx` - scroll cadencé

Les handlers de scroll sont passes sous `requestAnimationFrame`.

But:

- ne pas appeler des updates React a chaque evenement scroll brut;
- regrouper les lectures/ecritures par frame;
- eviter des `setState` redondants.

## 7. Pourquoi `Nouveautes` et `Petits Prix` ne semblaient pas identiques

La cause n'etait pas une difference dans `ProductCard` apres generalisation. La vraie difference venait du cycle de vie des sections:

- `Nouveautes` est montee tot dans la page;
- `Petits Prix` est montee plus tard via `DeferredSectionSlot`;
- donc le fallback de securite de `ProductCard` commencait plus tot pour `Nouveautes`;
- si ce fallback revelait sans verifier la position, il pouvait rendre les images de `Nouveautes` deja visibles avant que l'utilisateur arrive dessus;
- `Petits Prix`, monte tard, conservait naturellement le comportement progressif.

Correction:

- le fallback ne revele plus hors ecran;
- il verifie `getBoundingClientRect`;
- il respecte le root reel de scroll;
- `Nouveautes` et `Petits Prix` ont maintenant la meme mecanique; seule la position de la carte change le moment d'apparition.

## 8. Ancien vs nouveau: diagramme de responsabilites

### Ancien modele

```text
MarketplaceLayout
|-- decide de precharger des produits
|-- decide de precharger Petits Prix
|-- decide de precharger sections basses
|-- force le montage de chunks
|
ProductSections
|-- ajoute encore des prewarm locaux
|
ProductCard
|-- depend surtout de loading=lazy
|-- animation parfois deja jouee hors ecran
|
Footer
`-- iframe Google Maps chargee au scroll
```

### Nouveau modele

```text
MarketplaceLayout
|-- reserve les sections
|-- monte les sections basses par viewport
|-- ne prechauffe plus les grilles produits publiques
|
ProductSections
|-- trie et pagine 10 items
|-- ne donne plus de priorite speciale aux premieres cartes
|
ProductGridSection
|-- map chaque item vers ProductCard
|
ProductCard
|-- observe son propre container
|-- demande l'image proche du viewport
|-- revele l'image dans le viewport
|-- fallback positionnel robuste
|
Footer
`-- Google Maps opt-in seulement au clic
```

## 9. Validation effectuee

Commandes executees pendant la passe:

```bash
npm run lint
npm run mobile:contract
npm run build
npm run perf:budget
firebase deploy --only apphosting:secondevie-next-sandbox --project secondevienextjsssr
```

Audit Playwright froid sur sandbox:

```text
totalRequests: 76
scrollRequests: 23
scrollRequestTypes: { image: 23 }
longTasksAfterScroll: 0
frameGapsAfterScroll: 0
```

Interpretation:

- les images sont maintenant chargees pendant le scroll, ce qui est attendu;
- aucune requete script/XHR n'est declenchee par le scroll mesure;
- aucun long task n'a ete observe en headless;
- le ressenti utilisateur plus fluide est coherent avec la suppression de JS tiers et de preloads agressifs.

## 10. Limites de la mesure

Playwright headless ne reproduit pas parfaitement:

- le GPU/composite de Chrome desktop reel;
- la pression memoire d'un navigateur utilisateur avec beaucoup d'onglets;
- les extensions;
- la vitesse exacte du reseau;
- le rendu visuel percus des fades.

Mais il donne un signal fiable sur:

- type de ressources chargees pendant le scroll;
- presence ou absence de scripts tiers;
- long tasks detectees;
- gros gaps de frame dans le contexte de test.

## 11. Points de vigilance futurs

Ne pas reintroduire:

- `prewarmProductListImages` dans `src/app.jsx` pour la galerie publique;
- warmup partiel `maxItems: 4/5` pour `Nouveautes` ou `Petits Prix`;
- `priority={index < ...}` sur les grilles publiques de la galerie;
- `forceReady` sur les `DeferredSectionSlot` bas pendant l'entree galerie;
- iframe Google Maps avec `src` direct dans le footer;
- fallback de carte qui revele hors ecran sans verifier `getBoundingClientRect`.

Verifier apres chaque changement:

```bash
npm run lint
npm run mobile:contract
npm run build
npm run perf:budget
```

Et, si le sujet touche la fluidite:

- audit froid nouveau contexte navigateur;
- regarder les requetes pendant scroll;
- verifier que les requetes scroll restent majoritairement images;
- verifier absence de scripts tiers;
- verifier absence de long tasks.

## 12. Conclusion

Le travail a transforme la galerie d'une architecture "preparation agressive" vers une architecture "progressive reveal controle".

Ce changement explique le ressenti utilisateur:

- moins de freeze car moins de JS et moins de travail parasite pendant le scroll;
- plus d'images qui apparaissent progressivement, car elles sont demandees au bon moment;
- comportement `Petits Prix` generalise;
- correction du cas `Nouveautes`, qui etait revele trop tot par le fallback;
- robustesse gardee grace au fallback positionnel.

Le comportement recherche n'est pas que tout soit instantane. Le comportement recherche est que le scroll reste fluide, et que les images arrivent vite, proprement, et sans bloquer le mouvement.
