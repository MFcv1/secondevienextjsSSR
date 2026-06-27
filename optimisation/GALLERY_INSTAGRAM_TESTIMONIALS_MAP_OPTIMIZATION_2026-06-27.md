# Optimisation galerie - Instagram, avis clients et Google Maps

Date: 2026-06-27

## Contexte

Symptome observe sur la sandbox App Hosting:

```text
https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/galerie
```

En scroll froid desktop, une saccade etait visible entre la fin de la section Instagram et le debut des avis clients. La saccade etait surtout perceptible autour du passage vers le titre "La parole a nos clients.", puis amplifiee plus bas par le chargement Google Maps du footer.

Objectif de la passe:

- garder les animations existantes;
- ne pas redesign la galerie;
- stabiliser la jonction Instagram -> avis;
- empecher Google Maps de charger avant le footer visible.

## Diagnostic

### Avis clients

La section avis etait rendue en placeholder SSR via `TestimonialsCarouselPlaceholder`, puis remplacee par `TestimonialsCarouselIsland` via `DeferredGalleryIsland`.

Avant correction:

- `TestimonialsSectionServer` utilisait `rootMargin="240px 0px"` et `intersectionDelayMs={220}`;
- le carrousel reel arrivait donc tres tard, quasiment au moment ou le titre des avis entrait en viewport;
- le vrai composant importe `CustomerTestimonialsCarousel`, qui embarque `framer-motion`, drag carousel et animations infinies d'etoiles;
- le placeholder SSR avait surtout `min-h-[520px]`, alors que l'ile hydratee mesure environ `828px` sur desktop.

Effet probable:

- import JS + demarrage Framer pendant le scroll visible;
- recalcul de layout au remplacement placeholder -> ile hydratee;
- sensation de petite marche ou de coupure entre Instagram et avis.

### Google Maps

Le footer rendait directement `FooterMapFrameIsland`, avec un `iframe` Google Maps portant un `src` des le rendu initial de l'ile.

Meme avec `loading="lazy"`, Chrome pouvait lancer Maps avant que le footer soit visible:

- scripts Google Maps;
- requetes `maps.googleapis.com`;
- tuiles et images Google;
- long tasks et frame gaps pendant le bas de page.

Une comparaison locale en bloquant Maps a montre que les gros gaps de fin de parcours disparaissaient largement quand Maps ne chargeait pas.

## Changements appliques

### 1. Hauteur stable des avis

Fichiers:

- `src/kit/marketplace/ProductSectionsServer.jsx`
- `src/kit/shared/CustomerTestimonialsCarousel.jsx`

Changement:

```text
min-h-[520px] lg:min-h-[828px]
```

Ce minimum est pose a la fois sur:

- le placeholder SSR des avis;
- le carrousel hydrate.

But:

- garder la meme empreinte verticale avant/apres hydratation;
- eviter un changement de `documentHeight`;
- limiter le scroll anchoring et les recalculs visibles.

### 2. Chargement plus tot du carrousel avis

Fichier:

- `src/kit/marketplace/ProductSectionsServer.jsx`

Avant:

```jsx
<DeferredGalleryIsland
  type="testimonials"
  rootMargin="240px 0px"
  enableIdleFallback={false}
  intersectionDelayMs={220}
>
```

Apres:

```jsx
<DeferredGalleryIsland
  type="testimonials"
  rootMargin="900px 0px"
  enableIdleFallback={false}
  intersectionDelayMs={100}
>
```

But:

- preparer le chunk avis avant que la section soit visible;
- garder le lazy-load par proximite;
- ne pas charger les avis des le chargement initial;
- conserver les animations et le drag existants.

### 3. Google Maps charge uniquement au footer visible

Fichier:

- `src/kit/marketplace/FooterMapFrameIsland.jsx`

Avant:

- l'iframe etait rendue avec `src={mapUrl}` immediatement.

Apres:

- la boite de carte reste rendue et stable;
- un placeholder de fond conserve l'espace;
- `IntersectionObserver` observe le conteneur;
- l'iframe recoit son `src` uniquement quand le bloc carte entre dans le viewport;
- fallback scroll/resize leger si `IntersectionObserver` est indisponible;
- pas d'idle fallback pour Maps.

But:

- zero requete Google Maps avant le footer visible;
- eviter que Maps concurrence les sections Instagram, avis et newsletter;
- conserver la carte au footer sans impact froid en amont.

## Validation effectuee

Validation volontairement limitee apres correction:

```powershell
git diff --check
npx eslint src/kit/marketplace/ProductSectionsServer.jsx src/kit/shared/CustomerTestimonialsCarousel.jsx src/kit/marketplace/FooterMapFrameIsland.jsx
```

Resultat:

- `git diff --check` OK;
- ESLint a indique que ces fichiers sont ignores par la configuration actuelle, donc pas de validation lint/syntaxe effective par cette commande.

Deploiement effectue ensuite:

```powershell
firebase deploy --only apphosting:secondevie-next-sandbox --project secondevienextjsssr --non-interactive
firebase apphosting:backends:list --project secondevienextjsssr
```

Backend:

```text
secondevie-next-sandbox
https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app
```

Statut observe apres deploy:

```text
reconciling: false
Updated Date: 2026-06-27 16:25:41
```

Validation utilisateur:

- retour visuel apres deploy: "bcp mieux".

## Regles reutilisables

Pour optimiser une section basse de galerie sans casser l'identite visuelle:

1. Stabiliser l'empreinte SSR et hydratee avant de toucher aux animations.
2. Charger les iles animees assez tot pour que leur cout arrive hors viewport.
3. Garder `enableIdleFallback={false}` pour les sections basses qui ne doivent pas polluer le chargement initial.
4. Ne jamais mettre un `src` d'iframe tiers lourd avant la proximite reelle du bloc.
5. Pour Google Maps, preferer un conteneur stable + `IntersectionObserver` strict plutot qu'un simple `loading="lazy"`.
6. Mesurer separement les causes: JS d'ile React, changement de hauteur, images, iframes tiers.

## Points de vigilance

- Les animations Framer des avis sont conservees. Si une micro-saccade reste visible sur machine lente, la prochaine etape logique serait de declencher seulement l'animation infinie des etoiles apres une micro-idle locale, sans retirer Framer ni le drag.
- La carte Maps ne charge plus avant le footer visible. Si on veut encore plus strict, on peut remplacer l'auto-load au viewport par un bouton opt-in explicite.
- Ne pas appliquer cette logique a la galerie mobile sans relire `alertemobile.md` et sans conserver le contrat `marketplace-gallery-shell` / `marketplace-gallery-scroll`.
