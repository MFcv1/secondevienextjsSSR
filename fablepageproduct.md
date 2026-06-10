# Page produit - Optimisation apparition des images et transitions mobile

Date : 2026-06-10
Statut : document finalise apres la passe mobile drag/push sur la fiche produit.

Fichiers concernes :

- `app/produit/[slugOrId]/page.jsx`
- `src/kit/marketplace/ProductDetailShellIsland.jsx`
- `src/index.css`

Etat du worktree au moment de cette synthese :

- changements actifs : `src/kit/marketplace/ProductDetailShellIsland.jsx`, `src/index.css` ;
- logique SSR/preload de `app/produit/[slugOrId]/page.jsx` deja presente dans le code courant ;
- aucun retour au detail produit SPA legacy.

## 1. Probleme initial

- L'image centrale apparaissait d'abord "floue/molle" puis devenait nette : une couche preview `card` (768px) etait telechargee en `fetchPriority="high"` en concurrence avec la variante `medium` (1024px) reellement affichee, puis upscalee dans un cadre jusqu'a 920px.
- Les preloads SSR pointaient sur des variantes jamais affichees (`card` du voisin).
- En defilement rapide (molette ou swipe), l'affichage restait sur l'image precedente : seuls les voisins +-1 etaient precharges, et chaque changement attendait un decode borne a 320ms.
- Des "bandeaux flous" apparaissaient en bas de l'image : quand le budget decode expirait avant la fin du telechargement, le navigateur peignait l'image progressivement de haut en bas au-dessus du fond `blurDataUrl`.
- Sur mobile, la transition entre images etait un simple crossfade statique, sans suivi du doigt.

## 2. Preloads SSR exacts (`app/produit/[slugOrId]/page.jsx`)

`getInitialDetailImagePreloads` genere desormais des `<link rel="preload">` alignes sur ce que l'ile affiche vraiment :

- variante d'affichage exacte de l'image principale via `getProductDisplayImageSrc` (desktop + mobile, dedupliquee) en `high` ;
- `thumb` de l'image principale en `low` (sert le backdrop desktop et le rail de miniatures) ;
- variante d'affichage du voisin (image 2) en `low` au lieu de son `card`.

La couche preview `card` a ete supprimee du chemin critique : plus aucun octet telecharge pour une image jamais utile sur la premiere peinture produit.

## 3. Pipeline image de l'ile (`ProductDetailShellIsland.jsx`)

### Placeholder et backdrop

- Placeholder premiere peinture : `blurDataUrl` + `dominantColor` du cadre (deja en place, instantane).
- Backdrop d'ambiance desktop : passe de `medium` a `thumb` (indistinguable sous `blur-[80px]`, deja en cache via le rail/galerie) en `fetchPriority="low"`. L'ambiance apparait immediatement et ne concurrence plus le LCP.

### Decode-avant-commit

- Tout changement d'image (`goToIndex`, `goNext`/`goPrevious`, molette desktop, swipe) attend le decode complet de la cible avant de commiter, plafonne par `IMAGE_SWITCH_DECODE_BUDGET_MS` (500ms) pour ne jamais sembler bloque.
- `pendingImg` deplace le ring actif du rail de miniatures des le clic, avant le commit.
- Hover/focus d'une miniature desktop pre-decode l'image (`decode: true`).

### Underlay anti-bandeaux

- L'image precedente reste affichee en couche pleine opacite sous la nouvelle (`underlayImg`, mobile + desktop). La nouvelle se fond par-dessus (fade 160ms CSS pur, classe `product-detail-main-image-fade`, sans gating d'etat React).
- Le fond flou n'est plus jamais expose pendant un switch ; si un commit part avant la fin du telechargement, la nouvelle image se peint sur l'ancienne (effet wipe) au lieu d'un bandeau flou.
- Purge : `onLoad` + 260ms, filet de securite 1600ms.

Cette partie explique le correctif le plus visible sur les "bandes floues" : on ne retire plus l'ancienne image au moment exact ou la nouvelle source change. L'ancienne frame reste le plancher visuel jusqu'a ce que la nouvelle couche ait peint.

### Prewarm de toutes les images

- Apres l'arrivee de l'image principale, toutes les `medium` du produit (jusqu'a `IMAGE_PREWARM_MAX` = 11, par distance croissante autour de l'index actif, 140ms d'intervalle, priorite `low`) sont telechargees ET decodees.
- Garde-fou : `isConstrainedConnection()` (saveData / 2g) desactive le prewarm.
- Resultat : molette, swipe et clics thumb instantanes depuis le cache, meme en defilement rapide.

### Upgrade nettete silencieux (`large`)

- Une fois l'image active affichee et au repos (420ms), la variante `large` (1440px) est decodee en arriere-plan puis substituee sans remount (cles d'img par index, pas par src) : zero flash, le navigateur garde l'ancienne frame jusqu'a la nouvelle.
- Conditions : variante `large` reellement presente (jamais de fallback vers `full`), `frameWidth x devicePixelRatio > 1100`, connexion non contrainte.
- `sharpSrcs` (map index -> src large) est reutilise par l'underlay, le decode de switch et la lightbox.

### Hydration

- Si l'image SSR est deja `complete` au mount, `hasPrimaryImagePainted` passe a `true` immediatement (le prewarm demarre plus tot).

## 4. Transition swipe mobile (drag-follow + push directionnel)

Cette passe correspond aux changements actifs de `ProductDetailShellIsland.jsx` et `src/index.css`.

### Suivi du doigt

- `onPointerMove` sur le stage image avec verrouillage d'axe : >10px horizontal (ratio 1.2) = swipe image ; >12px vertical = gestes existants (ouvrir le panneau Details, fermer vers la galerie) inchanges.
- Pendant un drag horizontal, le cadre (`mobileImageDragRef`, la div shadow) suit le doigt en `translate3d` ecrit directement dans le style (pas de state React, 60fps), avec `scale` et opacite legerement progressifs.

### Release

- Navigation si |dx| > 18% de l'ecran OU flick (velocite > 0.45 px/ms et |dx| > 24px) ; sinon retour elastique 240ms (`resetImageDrag`).
- Le clic lightbox est supprime 420ms apres un swipe commite (`suppressImageClickRef`).

### Push continu au commit

- `commitImageIndex` lit la position reelle du cadre (`DOMMatrixReadOnly` sur le transform calcule), remet le wrapper a zero dans la meme frame, et transmet l'offset a l'underlay via les variables CSS `--sv-image-exit-from` / `--sv-image-exit-to`.
- L'ancienne image continue son mouvement depuis la position exacte du doigt vers le bord (classe `product-detail-mobile-image-underlay-exit`, 230ms) pendant que la nouvelle glisse depuis le cote oppose (`product-detail-mobile-image-enter--next` / `--prev`, 36% -> 0, 260ms cubic-bezier(0.22,1,0.36,1)).
- La direction est propagee par `requestImageIndex(..., { direction })` ; les taps de miniature gardent le crossfade simple (direction 0) ; desktop reste en fade.
- `prefers-reduced-motion: reduce` desactive toutes ces animations.

Effet attendu sur mobile :

- swipe lent : l'image suit le doigt, puis l'ancienne poursuit naturellement sa sortie ;
- flick rapide : la navigation s'engage sans attendre un long geste ;
- annulation : retour elastique, pas de changement d'image ;
- tap apres swipe : la lightbox ne s'ouvre pas accidentellement grace a `suppressImageClickRef`.

## 5. Ce qui a ete volontairement conserve

- Le geste vertical du panneau `Details` reste prioritaire quand l'axe vertical est detecte.
- Le clic/tap simple sur l'image ouvre toujours la lightbox, sauf juste apres un swipe image valide.
- Le zoom charge toujours la variante `full` seulement a la demande.
- Le desktop conserve son comportement fade/molette, sans animation push mobile.
- Le shell galerie mobile reste separe du detail produit : pas de retour a l'ancien overlay SPA.

## 6. Invariants preserves

- Jamais de variante `full` telechargee avant le zoom lightbox.
- Image visible = `medium` ou `large` (autorisees par `scripts/audit-product-page-direct.mjs`).
- Pas de CLS : cadres a aspect-ratio inchanges.
- Galerie, shell mobile (`marketplace-gallery-shell`, scroll lock, `--marketplace-viewport-height`) et gestes verticaux du detail produit intacts (cf. `alertemobile.md`).
- Lightbox zoom (`full` a la demande) inchangee.

## 7. Validation

- `npm run build` OK apres la passe courante (`/produit/[slugOrId]` : 11.2 kB, First Load 117 kB lors du dernier build observe).
- `npm run mobile:contract` OK apres finalisation du rapport.
- App Hosting sandbox redeploye ensuite sur `secondevie-next-sandbox`.

Validations encore recommandees avant merge/commit final :

- `npm run perf:product-direct -- --assert`
- test vrai telephone (cf. `alertemobile.md`) : galerie -> produit -> swipe images lent + flick dans les deux sens -> taps autour du hint "Details" (rien ne doit descendre) -> ouvrir/fermer le sheet -> retour galerie -> retester sur un second produit.

## 8. Resume operationnel pour le prochain agent

Le but de cette passe n'etait pas de changer le design de la page produit, mais de rendre le passage entre images plus propre :

1. Le SSR precharge les bonnes sources, celles que le detail affiche vraiment.
2. Le detail ne retire plus brutalement l'ancienne image pendant que la nouvelle arrive.
3. Les images du produit sont prechauffees et decodees progressivement apres la premiere peinture.
4. La variante `large` peut remplacer silencieusement la `medium` quand cela vaut le coup, sans flash.
5. Sur mobile, le swipe horizontal est devenu un vrai geste tactile : suivi du doigt, seuil de commit, flick, push directionnel.
6. Les gestes verticaux `Details` et retour galerie restent proteges.

Garde-fou principal : ne pas corriger une sensation de transition en reintroduisant le detail produit SPA legacy. La fiche produit active doit rester la route Next native `app/produit/[slugOrId]/page.jsx` avec `ProductDetailShellIsland` comme ile media bornee.
