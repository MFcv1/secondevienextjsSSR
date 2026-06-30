# Roadmap rendu final direct - sections galerie differees

Date: 2026-06-30

Statut closeout 2026-06-30: le rendu final direct est en place. `DeferredGalleryIsland` et les anciennes iles client lourdes `BeforeAfterSliderIsland`, `InstagramCarouselIsland` et `TestimonialsCarouselIsland` ont ete retirees du code actif; les sections fixes utilisent maintenant le HTML serveur final et des iles d'interactions fines.

## Probleme

Sur la galerie, certains modules fixes affichent d'abord un rendu provisoire SSR, puis un autre design environ une seconde plus tard quand `DeferredGalleryIsland` charge l'ilot client final.

Effet utilisateur: impression de rollback, bug visuel ou ancien design qui se corrige tout seul.

Les modules concernes sont:

- Avant / Apres;
- Instagram / Lifestyle & Atelier;
- Avis clients.

Le module newsletter `Abonne-toi et recois ton code promotionnel` ne presente pas ce probleme car il est rendu directement par `NewsletterSectionServer`, sans placeholder remplace par un ilot client.

## Cause technique historique

`src/kit/marketplace/DeferredGalleryIsland.jsx` garde d'abord ses enfants SSR, puis remplace tout le sous-arbre par un composant charge via `import()`:

- `type="before-after"` remplace `BeforeAfterSliderPlaceholder` par `BeforeAfterSliderIsland`;
- `type="instagram"` remplace `InstagramCarouselPlaceholder` par `InstagramCarouselIsland`;
- `type="testimonials"` remplace `TestimonialsCarouselPlaceholder` par `TestimonialsCarouselIsland`.

Le remplacement est volontairement differe par `IntersectionObserver`, `requestIdleCallback`, `intersectionDelayMs` et le chargement du chunk client. Le probleme n'est donc pas un bug image/cache: c'est une divergence structurelle entre le rendu initial et le rendu final.

## Contrat cible

Pour les modules fixes de galerie:

- aucun placeholder visuellement different du design final;
- meme composition au premier paint et apres hydratation;
- pas de remplacement complet de sous-arbre pour afficher le vrai design;
- les interactions peuvent etre attachees par de petits ilots client, mais ne doivent pas changer le layout initial;
- desktop, tablette et mobile doivent partager le meme contrat: rendu final visible immediatement, comportement interactif ajoute sans rollback.

## Audit par module

### Avant / Apres

Etat actuel:

- Corrige le 2026-06-30: le module ne passe plus par `DeferredGalleryIsland type="before-after"`;
- SSR initial: cadre premium, curseur central statique a 50%, badges Avant/Apres, panneau de description, boutons visuels et compteur;
- interaction client fine: rattachee via `GalleryFixedSectionsInteractions`, sans remplacement complet du sous-arbre.

Formats touches:

- Desktop: rollback tres visible car la composition droite change fortement;
- Tablette: risque identique, surtout sur le cadre et le panneau bas;
- Mobile: risque plus ponctuel selon la distance au module et le timing de chargement, mais le contrat reste mauvais.

Decision cible:

- rendu final directement en SSR: fait;
- ne plus utiliser `DeferredGalleryIsland` pour ce module: fait;
- interaction du slider attachee au markup final via un ilot client fin: fait.

### Instagram / Lifestyle & Atelier

Etat actuel:

- Corrige le 2026-06-30: le module ne passe plus par `DeferredGalleryIsland type="instagram"`;
- SSR initial: layout final Instagram rendu directement;
- effet conserve volontairement: les bulles flottantes sont presentes dans le HTML, mais restent masquees puis se revelent au scroll via un mini ilot dedie.

Formats touches:

- Desktop: rollback visible entre carousel simplifie et scene finale avec tokens/CTA/positionnement;
- Tablette: rendu initial mobile/tablette partiellement rapproche mais encore non contractuel;
- Mobile: certaines vues peuvent sembler correctes, mais les tokens et le carousel restent ajoutes/appliques plus tard.

Decision cible:

- rendre le layout final Instagram directement en SSR pour mobile, tablette et desktop: fait;
- garder les tokens dans le HTML initial mais les reveler au scroll, sans remplacement du module: fait;
- garder l'animation CSS decorative uniquement si elle ne change pas l'architecture visible;
- boutons/dots rattaches au markup final via un ilot client fin: fait.

### Avis clients

Etat actuel:

- Corrige le 2026-06-30: le module ne passe plus par `DeferredGalleryIsland type="testimonials"`;
- SSR initial: cartes, positions, etoiles, controles, compteur et dots rendus directement;
- les donnees restent statiques dans le rendu serveur, aucune source dynamique active.

Formats touches:

- Desktop: placeholder proche, mais pas identique aux controles et positions finales;
- Tablette/mobile: placeholder simplifie, puis carousel final avec controles et positions.

Decision cible:

- rendre les avis statiques finaux en SSR avec les memes cartes et controles visibles que le final: fait;
- boutons/dots rattaches au markup final via un ilot client fin: fait;
- sinon assumer un module statique tant qu'il n'est pas connecte a une vraie source d'avis.

## Plan d'execution

### Phase 1 - Stabilisation sans changement design

Objectif: supprimer le rollback visible sans redesign.

1. Creer des rendus serveur finaux:
   - `BeforeAfterFinalServer` ou equivalent dans `ProductSectionsServer.jsx`;
   - `InstagramFinalServer` ou equivalent;
   - `TestimonialsFinalServer` ou equivalent.
2. Remplacer les trois appels `DeferredGalleryIsland` par les rendus finaux serveur.
   - Fait pour `before-after`;
   - Fait pour `instagram`;
   - Fait pour `testimonials`.
3. Ne pas toucher a `NewsletterSectionServer`, qui est deja le modele correct.
4. Conserver les contenus, images, classes et espacements du design final existant.

### Phase 2 - Ilots d'interaction minimaux

Objectif: conserver les interactions sans changer le premier rendu.

1. Avant / Apres:
   - ajouter un ilot qui gere seulement le range, le clip-path, les boutons et l'index actif;
   - le markup initial doit deja contenir le curseur a 50%, le panneau bas et les controles.
2. Instagram:
   - ilot limite a `goToInsta`, drag/pointer et activation des boutons;
   - les tokens doivent etre presents dans le HTML initial puis reveles au scroll, sans remplacement de la section.
3. Avis:
   - ilot limite a navigation carousel/drag si l'interaction reste utile;
   - sinon garder rendu statique final.

### Phase 3 - Breakpoints et formats

Verifier separement:

- mobile etroit: 360 x 740;
- mobile courant: 390 x 844;
- grande tablette portrait: 768 x 1024;
- tablette/desktop compact: 1024 x 768;
- desktop: 1440 x 900;
- wide desktop: 1920 x 1080.

Pour chaque format:

- charger `/galerie` a froid;
- scroller jusqu'a Avant / Apres, Instagram, Avis;
- verifier que le premier rendu et l'etat apres 2 secondes sont visuellement identiques hors micro-animation decorative;
- verifier absence de saut de hauteur et de repositionnement majeur;
- verifier que `NewsletterSectionServer` reste stable.

### Phase 4 - Gates techniques

Avant validation visuelle longue:

- `rg "DeferredGalleryIsland type=\"before-after\"|DeferredGalleryIsland type=\"instagram\"|DeferredGalleryIsland type=\"testimonials\"" src/kit/marketplace/ProductSectionsServer.jsx` doit ne plus trouver ces usages;
- `npm run mobile:contract` si un changement touche le shell galerie mobile ou ses hauteurs;
- `npm run next:routes` si les imports serveur/client changent fortement.

Validation visuelle uniquement si demandee explicitement:

- screenshots desktop/tablette/mobile avant/apres 2 secondes;
- comparaison DOM `data-deferred-gallery-island` absente ou non utilisee pour ces modules fixes;
- controle que les cartes produits restent presentes dans `Nouveautes` et `Petits Prix`.

## Non-objectifs

- Ne pas refaire le design.
- Ne pas toucher au shell mobile `.marketplace-gallery-shell` / `#marketplaceGalleryScroll`.
- Ne pas reintroduire un chemin SPA legacy.
- Ne pas connecter les avis a une source dynamique dans cette passe.
- Ne pas optimiser au hasard les images produit.

## Risques

- Importer directement des composants `"use client"` lourds dans le rendu galerie peut augmenter le JS initial. La cible n'est pas "tout client direct", mais "visuel final serveur + ilot d'interaction minimal".
- Les composants actuels melangent markup final et logique d'interaction. Une extraction progressive sera plus sure qu'un gros remplacement.
- Les tokens Instagram utilisent beaucoup de CSS d'apparition. Il faudra distinguer animation decorative acceptable et changement de layout inacceptable.

## Critere de fin

Le chargement froid de `/galerie` ne montre plus d'ancien design provisoire pour Avant / Apres, Instagram ou Avis, sur mobile, tablette et desktop. Le premier rendu visible est le rendu final.
