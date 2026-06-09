# Alerte mobile - Galerie / Detail produit

Date incident: 2026-05-01

## Resume

Le bug observe sur mobile venait de la mecanique de scroll mobile de la galerie dans `src/Router.jsx`.

Le comportement sain, celui de la sandbox de reference, garde la galerie mobile dans un shell fixe avec scroll interne, meme quand on ouvre un detail produit depuis la galerie.

## Mise a jour 2026-06-09 - detail produit legacy retire

Le detail produit SPA legacy a ete retire de `src/Router.jsx`: la route produit active est maintenant la route native Next `app/produit/[slugOrId]/page.jsx`.

Les cartes produit restent des liens vers `/produit/...`; elles ne doivent plus monter `src/kit/marketplace/ProductDetail.jsx` ni `src/kit/marketplace/ArchitecturalProductDetail.jsx`.

L'invariant mobile ci-dessous reste conserve pour proteger le shell fixe de la galerie mobile:

```jsx
const isGalleryDetailOverlay = false;
const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;
```

Les sections suivantes decrivent l'incident historique de l'ancien overlay detail. Elles restent utiles pour ne pas casser la galerie mobile, mais ne doivent pas servir a reintroduire le chemin produit SPA.

## Cause identifiee

Dans le commit local `b080227` (`v16.7`, 2026-05-01 16:48:47 +0200), cette ligne a ete modifiee:

```jsx
const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;
```

Elle etait devenue:

```jsx
const shouldUseMobileGalleryScroll = isGalleryDetailOverlay;
```

Ce changement a desactive le mode galerie mobile fixe lorsque `view === 'gallery'`.

Effets secondaires:

- la galerie mobile repasse en flux normal au lieu de rester dans `marketplace-gallery-shell`;
- `marketplace-gallery-scroll` n'est plus applique en mode galerie;
- les handlers mobile `onScroll`, `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel` peuvent etre retires;
- `data-native-scroll-region` peut ne plus etre pose sur la galerie mobile;
- l'etat de scroll / viewport de la galerie devient incoherent avec le detail produit;
- sur mobile Chrome, un appui vers la zone "Details" peut alors provoquer un decalage visuel de l'image et du bloc bas.

## Incident complementaire 2026-05-04 - inertie galerie derriere le detail

Symptome exact observe:

```txt
ouvrir galerie mobile
-> faire un scroll leger dans la galerie
-> cliquer un meuble
-> ouvrir la modale basse "Details" / informations
-> l'image produit et le resume descendent d'abord
-> la modale finit ensuite par s'ouvrir
```

Ce bug peut donner l'impression que le probleme vient de `ArchitecturalProductDetail.jsx`, du bottom sheet, du seuil de swipe, ou de l'animation de sortie. Ce diagnostic est trompeur.

Cause reelle:

- la galerie est bien montee derriere le detail, ce qui est voulu;
- mais son scroller interne peut garder une inertie mobile juste apres un scroll leger;
- si cette inertie n'est pas coupee au clic produit, elle peut encore influencer le premier geste dans le detail;
- le premier swipe vers "Details" peut alors provoquer un decalage visuel de l'image et du bloc resume avant l'ouverture normale du bottom sheet.

Correction correcte:

- ne pas supprimer l'animation de sortie du detail;
- ne pas augmenter seulement le seuil de swipe;
- ne pas patcher uniquement le bottom sheet;
- figer `#marketplaceGalleryScroll` dans `Router.jsx` au moment ou un produit est ouvert depuis la galerie mobile, avant `setView('detail')`;
- conserver son `scrollTop`;
- remettre `window.scrollY`, `documentElement.scrollTop` et `body.scrollTop` a `0`;
- pendant le detail, mettre le scroller galerie en `overflow-y: hidden`, `-webkit-overflow-scrolling: auto`, `touch-action: none`;
- au retour galerie, retirer ces styles pour retrouver le scroll normal.

Implementation attendue dans `Router.jsx`:

```jsx
const freezeMobileGalleryScrollForDetail = React.useCallback(() => {
  if (
    typeof window === 'undefined' ||
    !window.matchMedia(MOBILE_MARKETPLACE_QUERY).matches
  ) {
    return;
  }

  const scroller = galleryScrollRef.current;
  const scrollTop = scroller?.scrollTop || 0;

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  if (!scroller) return;

  scroller.style.overflowY = 'hidden';
  scroller.style.webkitOverflowScrolling = 'auto';
  scroller.style.touchAction = 'none';
  scroller.scrollTop = scrollTop;
}, []);
```

Puis:

```jsx
const openProductDetail = (id, returnTarget = { view: 'gallery' }) => {
  if (returnTarget?.view === 'gallery') {
    freezeMobileGalleryScrollForDetail();
  }
  setMarketplaceViewportHeight();
  setSelectedItemId(id);
  setView('detail');
};
```

Et au retour hors detail:

```jsx
scroller.style.overflowY = '';
scroller.style.webkitOverflowScrolling = '';
scroller.style.touchAction = '';
```

Test qui a valide la correction:

```txt
Android Chrome reel, viewport mobile 390x844
galerie -> scroll leger -> clic produit -> premier swipe vers "Details"
window.scrollY = 0
#marketplaceGalleryScroll.scrollTop conserve
#marketplaceGalleryScroll overflow-y = hidden pendant detail
drift image pendant le premier geste = 0 px
drift resume pendant le premier geste = 0 px
retour galerie -> overflow-y = auto, touch-action = pan-y, scrollTop conserve
```

## Regle a ne surtout pas casser

Dans `src/Router.jsx`, il faut conserver:

```jsx
const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;
```

Ne pas remplacer par:

```jsx
const shouldUseMobileGalleryScroll = isGalleryDetailOverlay;
```

## Invariants obligatoires

La galerie mobile doit garder:

```jsx
className={shouldShowGallerySurface ? 'marketplace-gallery-shell animate-in fade-in duration-500' : 'fixed inset-0 pointer-events-none opacity-0 z-0'}
```

Le scroll interne doit garder:

```jsx
className="marketplace-gallery-scroll"
```

En mobile, ne pas conditionner ces handlers uniquement au mode detail:

```jsx
{...(isMobileMarketplace ? { 'data-native-scroll-region': true } : {})}
onScroll={handleGalleryScroll}
onTouchStart={handleGalleryTouchStart}
onTouchMove={handleGalleryTouchMove}
onTouchEnd={handleGalleryTouchEnd}
onTouchCancel={resetPullRefresh}
```

Quand le detail est ouvert depuis la galerie, la galerie reste montee mais son inertie doit etre stoppee:

```css
.marketplace-gallery-scroll[data-detail-open="true"] {
  overflow-y: hidden;
  -webkit-overflow-scrolling: auto;
  touch-action: none;
}
```

Et au moment du clic produit mobile, `Router.jsx` doit figer le scroller interne avant `setView('detail')`.
Le but n'est pas de supprimer les animations du detail, mais d'empecher une inertie de scroll galerie de continuer derriere le detail et de provoquer un decalage au premier swipe vers "Details".

## Ce qu'il ne faut pas faire

- Ne pas transformer la galerie mobile en page normale avec `relative z-0 w-full`.
- Ne pas retirer `marketplace-gallery-shell` en mode `view === 'gallery'`.
- Ne pas retirer `marketplace-gallery-scroll` en mode `view === 'gallery'`.
- Ne pas remplacer le scroll interne mobile par `window.scrollY` pour la galerie.
- Ne pas couper les handlers touch de la galerie en mode `view === 'gallery'`.
- Ne pas modifier `--marketplace-viewport-height` sans tester ouverture detail produit sur un vrai telephone.
- Ne pas corriger ce bug en supprimant l'animation de sortie du detail: la cause a traiter est l'etat/inertie du scroller galerie au moment d'ouvrir le produit.

## Test obligatoire apres modification mobile

Tester sur vrai mobile, pas seulement desktop responsive:

1. Ouvrir la galerie sur le telephone.
2. Ouvrir un produit depuis la galerie.
3. Appuyer autour du hint "Details" / fleche animee.
4. Verifier que l'image principale et le bloc titre ne descendent pas.
5. Fermer le detail et revenir galerie.
6. Reouvrir un autre produit et refaire le test.

URL typique de test local:

```txt
http://192.168.1.60:5174/produit/...
```

## Note importante

Ce probleme n'etait pas cause par le style du header ou du menu. La cause etait la logique mobile de `Router.jsx`, parce que la galerie et le detail produit partagent la gestion du viewport, du scroll lock et du shell mobile.
